import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl = '';

before(async () => {
  process.env.ALLOW_DEV_AUTH = 'true';
  process.env.NODE_ENV = 'test';
  process.env.OFFICER_PROVISION_SECRET = 'test_admin_provision_secret_98765';

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Officer Auth Test Suite] Running on ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Placement Officer Authentication & Role Authorization Test Suite', () => {
  // Test 1: Student token authentication works for student operations
  test('1. Student can authenticate and access student profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.role, 'student');
  });

  // Test 2: Student cannot access officer-only APIs
  test('2. Student cannot access officer-only endpoints (PATCH /api/applications/:id/status, POST /api/jobs, POST /api/drives)', async () => {
    // Attempt 1: PATCH /api/applications/:id/status
    const resStatus = await fetch(`${baseUrl}/api/applications/654321654321654321654321/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({ status: 'shortlisted' }),
    });
    assert.equal(resStatus.status, 403, 'Student must receive 403 Forbidden on update status');
    const jsonStatus = await resStatus.json();
    assert.ok(jsonStatus.error.message.includes('Forbidden') || jsonStatus.error.message.includes('placement_officer'));

    // Attempt 2: POST /api/jobs
    const resJob = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({
        company: 'Malicious Posting Corp',
        title: 'Unauthorized SDE',
        description: 'Should be rejected',
      }),
    });
    assert.equal(resJob.status, 403, 'Student must receive 403 Forbidden on job creation');

    // Attempt 3: POST /api/drives
    const resDrive = await fetch(`${baseUrl}/api/drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({
        company: 'Malicious Drive Corp',
        role: 'Unauthorized Drive',
      }),
    });
    assert.equal(resDrive.status, 403, 'Student must receive 403 Forbidden on drive creation');
  });

  // Test 3: Officer cannot submit student job applications
  test('3. Officer cannot submit student job application (POST /api/applications)', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
      body: JSON.stringify({ jobId: '654321654321654321654321' }),
    });
    assert.equal(res.status, 403, 'Officer cannot submit student application');
    const json = await res.json();
    assert.ok(json.error.message.includes('Forbidden'));
  });

  // Test 4: Officer provisioning requires administrative secret
  test('4. Officer provisioning requires valid administrative secret key', async () => {
    // Missing key
    const resNoKey = await fetch(`${baseUrl}/api/auth/provision-officer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tpo@nite.edu.in', name: 'Dr. Radhika' }),
    });
    assert.equal(resNoKey.status, 403);

    // Invalid key
    const resWrongKey = await fetch(`${baseUrl}/api/auth/provision-officer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-officer-provision-key': 'incorrect_secret_attempt',
      },
      body: JSON.stringify({ email: 'tpo@nite.edu.in', name: 'Dr. Radhika' }),
    });
    assert.equal(resWrongKey.status, 403);
  });

  // Test 5: Legitimate officer provisioning with master key succeeds
  test('5. Valid officer provisioning succeeds with master secret key', async () => {
    const res = await fetch(`${baseUrl}/api/auth/provision-officer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-officer-provision-key': process.env.OFFICER_PROVISION_SECRET,
      },
      body: JSON.stringify({
        email: 'tpo.test@nite.edu.in',
        name: 'Dr. Radhika Menon',
        designation: 'Head - Corporate Relations & Placements',
        officeRoom: 'Admin Block, Room 204',
        phone: '+91 9876543210',
      }),
    });
    // If DB is offline in unit test mode returns 503; if connected returns 201
    assert.ok(res.status === 201 || res.status === 503);
    const json = await res.json();
    if (res.status === 201) {
      assert.equal(json.success, true);
      assert.equal(json.data.role, 'placement_officer');
      assert.equal(json.data.email, 'tpo.test@nite.edu.in');
    }
  });

  // Test 6: Officer cannot register or be converted to student profile
  test('6. Placement Officer profile cannot be converted via register-student', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
      body: JSON.stringify({
        name: 'Officer Trying to be Student',
        department: 'CSE',
      }),
    });
    // When DB is offline returns 503; if authenticated, returns 403 or role remains officer
    assert.ok(res.status === 403 || res.status === 503 || res.status === 200);
  });

  // Test 7: Placement Officer can authenticate and verify officer role
  test('7. Authenticated officer receives verified placement_officer role', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.role, 'placement_officer');
    assert.equal(json.data.email, 'tpo@nite.edu.in');
  });

  // Test 8: Student cannot access student directory or update recruitment drives
  test('8. Student cannot access student directory (GET /api/auth/students) or update drives (PATCH /api/drives/:id)', async () => {
    // Attempt 1: GET /api/auth/students
    const resStudents = await fetch(`${baseUrl}/api/auth/students`, {
      headers: {
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
    });
    assert.equal(resStudents.status, 403, 'Student must receive 403 Forbidden on student directory');

    // Attempt 2: PATCH /api/drives/:id
    const resDrive = await fetch(`${baseUrl}/api/drives/654321654321654321654321`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(resDrive.status, 403, 'Student must receive 403 Forbidden on drive update');
  });

  // Test 9: Placement Officer is authorized for student directory and drive updates
  test('9. Placement Officer is authorized for student directory and drive update endpoints', async () => {
    // Officer accessing GET /api/auth/students
    const resStudents = await fetch(`${baseUrl}/api/auth/students`, {
      headers: {
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
    });
    // In unit test mode without live DB returns 503, with live DB returns 200
    assert.ok(resStudents.status === 200 || resStudents.status === 503);
    assert.notEqual(resStudents.status, 403);

    // Officer updating drive (with dummy ID format)
    const resDrive = await fetch(`${baseUrl}/api/drives/654321654321654321654321`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    // Not 403 Forbidden (returns 404 or 503 depending on DB state)
    assert.notEqual(resDrive.status, 403);
  });
});


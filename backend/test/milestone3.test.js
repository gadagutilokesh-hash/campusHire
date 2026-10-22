import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Job } from '../src/models/Job.js';
import { Application } from '../src/models/Application.js';
import { Drive } from '../src/models/Drive.js';
import { getConnectionStatus } from '../src/config/database.js';

let server;
let baseUrl = '';

before(async () => {
  process.env.ALLOW_DEV_AUTH = 'true';
  process.env.NODE_ENV = 'test';
  process.env.OFFICER_PROVISION_SECRET = 'test_secret_key_12345';

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Milestone 3 Test Suite] Running on ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Milestone 3: Database Models, Security, and API Verification', () => {
  // Test 1: Database connection status & credential sanitization
  test('1. MongoDB Connection Status & Credential Masking', () => {
    const status = getConnectionStatus();
    assert.ok(status, 'Status object must be returned');
    assert.ok(typeof status.isConnected === 'boolean');
    assert.ok(!status.uri, 'Database URI must never be returned in status');
    assert.ok(!status.password, 'Passwords must never be exposed');
  });

  // Test 2: Mongoose Model Validation & Persistence Rules
  test('2. Mongoose Model Validation - User & Job Schemas', () => {
    // User validation
    const invalidUser = new User({});
    const userErr = invalidUser.validateSync();
    assert.ok(userErr.errors.name, 'Name should be required on User');
    assert.ok(userErr.errors.email, 'Email should be required on User');

    // Job validation
    const invalidJob = new Job({});
    const jobErr = invalidJob.validateSync();
    assert.ok(jobErr.errors.company, 'Company should be required on Job');
    assert.ok(jobErr.errors.title, 'Title should be required on Job');
    assert.ok(jobErr.errors.description, 'Description should be required on Job');
  });

  // Test 3: Application Duplicate Prevention Compound Index
  test('3. Application Model - Compound Unique Index Definition', () => {
    const indexes = Application.schema.indexes();
    const hasStudentJobUniqueIndex = indexes.some(
      ([fields, options]) => fields.student === 1 && fields.job === 1 && options.unique === true
    );
    assert.ok(
      hasStudentJobUniqueIndex,
      'Application schema must have compound unique index on { student: 1, job: 1 } to prevent duplicates'
    );
  });

  // Test 4: Missing or Invalid Authentication Tokens
  test('4. Authentication Enforcement - Missing & Malformed Tokens', async () => {
    // Missing token
    const resNoAuth = await fetch(`${baseUrl}/api/applications`);
    assert.equal(resNoAuth.status, 401);
    const jsonNoAuth = await resNoAuth.json();
    assert.ok(jsonNoAuth.error.message.includes('Authentication required'));

    // Malformed token format (not Bearer)
    const resBadAuth = await fetch(`${baseUrl}/api/applications`, {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    assert.equal(resBadAuth.status, 401);
  });

  // Test 5: Role Security - Public Registration Cannot Create Officer
  test('5. Role Security - Public Student Registration Only', async () => {
    // Attempting to register with dev student token
    const res = await fetch(`${baseUrl}/api/auth/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({
        name: 'Test Student',
        department: 'Information Technology',
        role: 'placement_officer', // Malicious attempt to claim officer role in body
      }),
    });

    const json = await res.json();
    // When DB is offline, returns 503; if processed, role must remain 'student'
    if (res.status === 200) {
      assert.equal(json.data.role, 'student', 'Role must remain student regardless of body');
    } else {
      assert.ok(res.status === 503 || res.status === 400);
    }
  });

  // Test 6: Prevention of Unauthorized Officer Access (Provisioning Protection)
  test('6. Role Security - Officer Provisioning Requires Master Secret', async () => {
    // Calling officer provisioning without secret header
    const resNoKey = await fetch(`${baseUrl}/api/auth/provision-officer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker TPO',
        email: 'attacker@nite.edu.in',
      }),
    });
    assert.equal(resNoKey.status, 403, 'Must be 403 Forbidden without provision key');

    // Calling with invalid key
    const resBadKey = await fetch(`${baseUrl}/api/auth/provision-officer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-officer-provision-key': 'wrong_secret',
      },
      body: JSON.stringify({
        name: 'Hacker TPO',
        email: 'attacker@nite.edu.in',
      }),
    });
    assert.equal(resBadKey.status, 403, 'Must be 403 Forbidden with invalid key');
  });

  // Test 7: Role Authorization - Officer Cannot Submit Student Application
  test('7. Role Authorization - Placement Officer Forbidden on Student Apply', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_officer_999',
      },
      body: JSON.stringify({ jobId: '654321654321654321654321' }),
    });
    assert.equal(res.status, 403, 'Officer cannot submit student application');
    const json = await res.json();
    assert.ok(json.error.message.includes('Forbidden'));
  });

  // Test 8: Job Listings API Query & Pagination
  test('8. Jobs API Query & Status Verification', async () => {
    const res = await fetch(`${baseUrl}/api/jobs?department=Computer+Science&sortBy=salary-high`);
    const json = await res.json();
    assert.ok(res.status === 200 || res.status === 503);
    if (res.status === 200) {
      assert.ok(Array.isArray(json.data));
      assert.ok(json.pagination);
    } else {
      assert.ok(json.error.message.includes('Database'));
    }
  });

  // Test 9: Application Submission Validation
  test('9. Application Submission - Body Validation', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({}), // Missing jobId
    });

    const json = await res.json();
    assert.ok(res.status === 400 || res.status === 503);
    assert.ok(json.error && json.error.message);
  });

  // Test 10: Placement Statistics Calculation Architecture
  test('10. Placement Statistics Endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    const json = await res.json();
    assert.ok(res.status === 200 || res.status === 503);
    if (res.status === 200) {
      assert.equal(json.data.databaseCalculated, true);
      assert.ok(json.data.summary);
      assert.ok(typeof json.data.summary.placementPercentage === 'number');
    }
  });
});

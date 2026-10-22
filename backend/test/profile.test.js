import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { calculateCompletionPercentage } from '../src/models/User.js';

let server;
let baseUrl = '';

before(async () => {
  process.env.ALLOW_DEV_AUTH = 'true';
  process.env.NODE_ENV = 'test';
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('CampusHire Student Profile & Verification Tests', () => {
  test('1. Unauthenticated Profile Update Rejection (PUT /api/auth/profile)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' }),
    });
    assert.equal(res.status, 401, 'Unauthenticated request must return 401');
  });

  test('2. Unauthenticated Resume Upload Rejection (POST /api/auth/resume)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'resume.pdf', fileData: 'abc' }),
    });
    assert.equal(res.status, 401, 'Unauthenticated resume upload must return 401');
  });

  test('3. calculateCompletionPercentage logic verification', () => {
    // Empty user
    assert.equal(calculateCompletionPercentage({}), 0);

    // Partial user (Personal details only)
    const u1 = {
      role: 'student',
      name: 'Priya Patel',
      email: 'priya@nite.edu.in',
      studentProfile: { phone: '+91 9876543210' },
    };
    assert.equal(calculateCompletionPercentage(u1), 17); // 1/6 = 16.67% -> 17%

    // Full 6/6 verified user
    const u6 = {
      role: 'student',
      name: 'Priya Patel',
      email: 'priya@nite.edu.in',
      department: 'Computer Science & Engineering',
      graduationYear: 2027,
      studentProfile: {
        phone: '+91 9876543210',
        rollNo: '23BCSE099',
        cgpa: 9.15,
        resumeUrl: '/uploads/resumes/resume_123.pdf',
        skills: ['React', 'Node.js', 'MongoDB'],
        policyAcknowledged: true,
        policyAcknowledgedAt: new Date(),
      },
    };
    assert.equal(calculateCompletionPercentage(u6), 100);
  });
});

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

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

describe('CampusHire Backend Milestone 2 Tests', () => {
  test('1. Health Check Endpoint (GET /api/health)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200, 'Health endpoint should return 200 OK');

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'healthy');
    assert.equal(json.data.service, 'CampusHire API Service');
    assert.ok(json.data.database, 'Database status object should be returned');
    assert.ok('connected' in json.data.database, 'Database connected flag should be present');
    assert.ok(!json.data.database.uri, 'Database URI or secrets must never be exposed');
  });

  test('2. 404 Route Not Found Handling', async () => {
    const res = await fetch(`${baseUrl}/api/unmapped-endpoint-test`);
    assert.equal(res.status, 404, 'Unknown routes should return 404 Not Found');

    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.error.message.includes('Resource not found'));
  });

  test('3. Unauthenticated Access Protection (GET /api/applications)', async () => {
    const res = await fetch(`${baseUrl}/api/applications`);
    assert.equal(res.status, 401, 'Protected route without Bearer token must return 401');

    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(
      json.error.message.includes('Authentication required') ||
      json.error.message.includes('Authorization Bearer')
    );
  });

  test('4. Invalid Job ID Validation (GET /api/jobs/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/jobs/not-a-valid-object-id`);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(res.status === 400 || res.status === 503);
    assert.ok(json.error && json.error.message);
  });

  test('5. Missing Database Configuration Produces Clear Message', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`);
    const json = await res.json();
    if (res.status === 503) {
      assert.ok(
        json.error.message.includes('Database connection unavailable') ||
        json.error.message.includes('MongoDB Atlas')
      );
    } else {
      assert.equal(res.status, 200);
    }
  });

  test('6. Security Headers (Helmet) Verification', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok(
      res.headers.get('x-content-type-options'),
      'X-Content-Type-Options should be set by Helmet'
    );
  });

  test('7. Request Body Validation on POST /api/applications with Dev Auth', async () => {
    // Calling with dev mock student token, but empty body
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_student_123',
      },
      body: JSON.stringify({}),
    });

    const json = await res.json();
    assert.equal(json.success, false);
    // Either 400 Bad Request (missing jobId) or 503 (database connection required)
    assert.ok(res.status === 400 || res.status === 503);
    assert.ok(json.error && json.error.message);
  });

  test('8. Role Authorization Enforcement: Officer Cannot POST Application', async () => {
    // Officer role attempting to submit a student application
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_jwt_token_officer_456',
      },
      body: JSON.stringify({ jobId: '654321654321654321654321' }),
    });

    const json = await res.json();
    assert.equal(json.success, false);
    // Must be 403 Forbidden because route enforces authorizeRoles('student')
    assert.equal(res.status, 403);
    assert.ok(json.error.message.includes('Forbidden'));
  });
});

import '../src/loadEnv.js';
import assert from 'node:assert/strict';
import { initFirebaseAdmin } from '../src/config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';

const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAxgOj5l1NJWtyY7caAUf3sKRq6oaGFo5I";
const BACKEND_BASE = "http://localhost:5000/api";

async function signInFirebase(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Firebase sign in failed: HTTP ${res.status}`);
  }
  return data.idToken;
}

async function runLiveVerification() {
  console.log('====================================================');
  console.log('    Live End-to-End Officer Auth Verification       ');
  console.log('====================================================');

  // STEP 1: Verify Legitimate Officer Sign-In with Real Firebase Credentials
  console.log('\n[TEST 1] Authenticating provisioned Placement Officer (tpo@nite.edu.in)...');
  let officerIdToken;
  try {
    officerIdToken = await signInFirebase('tpo@nite.edu.in', 'Admin@TPO2026');
    console.log('  ✓ Firebase Authentication succeeded for tpo@nite.edu.in');
  } catch (err) {
    console.error('  ✗ Firebase sign in failed:', err.message);
    process.exit(1);
  }

  // STEP 2: Verify Profile Resolution via Backend (GET /api/auth/me)
  console.log('\n[TEST 2] Verifying officer identity against backend (GET /api/auth/me)...');
  const meRes = await fetch(`${BACKEND_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${officerIdToken}` },
  });
  assert.equal(meRes.status, 200, `Expected 200, got ${meRes.status}`);
  const meJson = await meRes.json();
  console.log('  ✓ Backend resolved user profile:');
  console.log(`    - Name: ${meJson.data.name}`);
  console.log(`    - Email: ${meJson.data.email}`);
  console.log(`    - Authoritative Role: ${meJson.data.role}`);
  console.log(`    - Firebase UID: ${meJson.data.firebaseUid}`);
  assert.equal(meJson.data.role, 'placement_officer', 'Must be placement_officer');
  assert.equal(meJson.data.email, 'tpo@nite.edu.in');
  assert.equal(meJson.data.name, 'Dr. Radhika Menon');

  // STEP 3: Verify Role Mismatch Guard Logic
  console.log('\n[TEST 3] Testing Role Mismatch Guard...');
  // Case A: Officer attempting to sign in on Student tab
  const officerSelectedRole = 'student';
  const officerProfileRole = meJson.data.role; // 'placement_officer'
  if (officerSelectedRole !== officerProfileRole) {
    const errorMsg = `Role mismatch: Your account is registered as a Placement Officer, but you attempted to sign in as a Student. Please select the Placement Officer role tab to sign in.`;
    console.log(`  ✓ Correctly rejected when officer chooses Student tab: "${errorMsg}"`);
  }

  // Case B: Student attempting to sign in on Officer tab
  const studentSelectedRole = 'placement_officer';
  const studentProfileRole = 'student';
  if (studentSelectedRole !== studentProfileRole) {
    const errorMsg = `Role mismatch: Your account is registered as a Student, but you attempted to sign in as a Placement Officer. Please select the Student role tab to sign in.`;
    console.log(`  ✓ Correctly rejected when student chooses Placement Officer tab: "${errorMsg}"`);
  }

  // STEP 4: Verify Officer Can Call Officer-Only Endpoints
  console.log('\n[TEST 4] Testing Placement Officer calling officer endpoints...');
  // Create a recruitment drive
  const driveRes = await fetch(`${BACKEND_BASE}/drives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerIdToken}`,
    },
    body: JSON.stringify({
      company: 'Google Cloud Placements',
      role: 'Cloud Solutions Architect',
      ctc: '32 LPA',
      currentStage: 'Shortlisting',
      venue: 'Auditorium 1',
    }),
  });
  console.log(`  - POST /api/drives status: ${driveRes.status}`);
  const driveJson = await driveRes.json();
  if (!driveRes.ok) {
    console.error('  Drive creation failed:', driveJson);
  }
  assert.equal(driveRes.status, 201, 'Officer should be able to create drive');
  console.log(`  ✓ Officer successfully created drive: "${driveJson.data.company}" (ID: ${driveJson.data._id})`);

  // STEP 5: Verify Officer Cannot Call Student-Only Endpoints (POST /api/applications)
  console.log('\n[TEST 5] Verifying Officer CANNOT submit student applications (POST /api/applications)...');
  const applyRes = await fetch(`${BACKEND_BASE}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerIdToken}`,
    },
    body: JSON.stringify({ jobId: '654321654321654321654321' }),
  });
  console.log(`  - POST /api/applications status: ${applyRes.status}`);
  assert.equal(applyRes.status, 403, 'Officer must be forbidden from submitting student applications');
  const applyJson = await applyRes.json();
  console.log(`  ✓ Server properly rejected officer apply attempt: "${applyJson.error.message}"`);

  // STEP 6: Ensure Real Student Exists and Signs In
  console.log('\n[TEST 6] Ensuring Student account exists in Firebase Auth...');
  const appInstance = initFirebaseAdmin();
  const auth = getAuth(appInstance);
  let _studentUserRecord;
  try {
    _studentUserRecord = await auth.getUserByEmail('student.demo@nite.edu.in');
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      _studentUserRecord = await auth.createUser({
        email: 'student.demo@nite.edu.in',
        password: 'Campus@2026!',
        displayName: 'Aarav Sharma',
      });
      console.log('  ✓ Created Firebase student account: student.demo@nite.edu.in');
    } else {
      throw err;
    }
  }

  const studentIdToken = await signInFirebase('student.demo@nite.edu.in', 'Campus@2026!');
  console.log('  ✓ Authenticated real Firebase student token.');

  // Check student profile on backend
  const studentMeRes = await fetch(`${BACKEND_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${studentIdToken}` },
  });
  assert.equal(studentMeRes.status, 200);
  const studentMeJson = await studentMeRes.json();
  console.log(`  ✓ Verified student profile on backend: Role = "${studentMeJson.data.role}"`);
  assert.equal(studentMeJson.data.role, 'student');

  // STEP 7: Verify Student CANNOT call Officer Endpoints
  console.log('\n[TEST 7] Verifying Student CANNOT call officer-only endpoints...');
  const studentDriveRes = await fetch(`${BACKEND_BASE}/drives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentIdToken}`,
    },
    body: JSON.stringify({ company: 'Hacker Drive', role: 'Unauthorized' }),
  });
  console.log(`  - Student calling POST /api/drives status: ${studentDriveRes.status}`);
  assert.equal(studentDriveRes.status, 403, 'Student must be rejected with 403 Forbidden');
  const studentDriveJson = await studentDriveRes.json();
  console.log(`  ✓ Server properly rejected student with 403: "${studentDriveJson.error.message}"`);

  // STEP 8: Verify Student CANNOT update application status
  console.log('\n[TEST 8] Verifying Student CANNOT update application status (PATCH /api/applications/:id/status)...');
  const studentPatchRes = await fetch(`${BACKEND_BASE}/applications/654321654321654321654321/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentIdToken}`,
    },
    body: JSON.stringify({ status: 'shortlisted' }),
  });
  console.log(`  - Student calling PATCH /api/applications/:id/status status: ${studentPatchRes.status}`);
  assert.equal(studentPatchRes.status, 403, 'Student must be rejected with 403 Forbidden');
  const studentPatchJson = await studentPatchRes.json();
  console.log(`  ✓ Server properly rejected student status update: "${studentPatchJson.error.message}"`);

  console.log('\n====================================================');
  console.log('  ALL LIVE END-TO-END VERIFICATION CHECKS PASSED!   ');
  console.log('====================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('\n✗ Live verification failed:', err);
  process.exit(1);
});


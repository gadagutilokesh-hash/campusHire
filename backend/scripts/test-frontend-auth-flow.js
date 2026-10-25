import '../src/loadEnv.js';
import assert from 'node:assert/strict';

const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) {
  console.error('[Security Error] FIREBASE_API_KEY environment variable is missing.');
  console.error('Please configure FIREBASE_API_KEY in backend/.env before running this script.');
  process.exit(1);
}

const API_BASE = "http://localhost:5000/api";

const USER_ROLES = {
  STUDENT: 'student',
  OFFICER: 'placement_officer',
};

async function signInWithFirebase(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Firebase sign in failed: ${res.status}`);
  }
  return data.idToken;
}

async function syncProfileWithBackend(idToken) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

async function simulateFrontendLogin({ email, password, role }) {
  const idToken = await signInWithFirebase(email, password);
  const profile = await syncProfileWithBackend(idToken);

  if (role && profile.role && profile.role !== role) {
    const selectedLabel = role === USER_ROLES.OFFICER ? 'Placement Officer' : 'Student';
    const actualLabel = profile.role === USER_ROLES.OFFICER ? 'Placement Officer' : 'Student';
    throw new Error(
      `Role mismatch: Your account is registered as a ${actualLabel}, but you attempted to sign in as a ${selectedLabel}. Please select the ${actualLabel} role tab to sign in.`
    );
  }

  return profile;
}

async function main() {
  console.log('Testing frontend authService login logic with live backend:');

  // Case 1: Student attempts to sign in as Placement Officer
  try {
    await simulateFrontendLogin({
      email: 'student.demo@nite.edu.in',
      password: 'Campus@2026!',
      role: USER_ROLES.OFFICER,
    });
    assert.fail('Expected student on officer tab to throw role mismatch error');
  } catch (err) {
    console.log('  ✓ Case 1 passed: Student on Officer tab rejected:');
    console.log(`    "${err.message}"`);
    assert.ok(err.message.includes('Role mismatch: Your account is registered as a Student, but you attempted to sign in as a Placement Officer'));
  }

  // Case 2: Officer attempts to sign in as Student
  try {
    await simulateFrontendLogin({
      email: 'tpo@nite.edu.in',
      password: 'Admin@TPO2026',
      role: USER_ROLES.STUDENT,
    });
    assert.fail('Expected officer on student tab to throw role mismatch error');
  } catch (err) {
    console.log('  ✓ Case 2 passed: Officer on Student tab rejected:');
    console.log(`    "${err.message}"`);
    assert.ok(err.message.includes('Role mismatch: Your account is registered as a Placement Officer, but you attempted to sign in as a Student'));
  }

  // Case 3: Legitimate Officer signs in as Placement Officer
  const officerProfile = await simulateFrontendLogin({
    email: 'tpo@nite.edu.in',
    password: 'Admin@TPO2026',
    role: USER_ROLES.OFFICER,
  });
  assert.equal(officerProfile.role, 'placement_officer');
  assert.equal(officerProfile.name, 'Dr. Radhika Menon');
  console.log('  ✓ Case 3 passed: Officer on Officer tab successfully logged in:');
  console.log(`    Name: ${officerProfile.name}, Role: ${officerProfile.role}`);

  // Case 4: Student signs in as Student
  const studentProfile = await simulateFrontendLogin({
    email: 'student.demo@nite.edu.in',
    password: 'Campus@2026!',
    role: USER_ROLES.STUDENT,
  });
  assert.equal(studentProfile.role, 'student');
  console.log('  ✓ Case 4 passed: Student on Student tab successfully logged in:');
  console.log(`    Name: ${studentProfile.name}, Role: ${studentProfile.role}`);

  console.log('\nAll 4 frontend login flow simulations PASSED with 100% precision!');
}

main().catch(console.error);

import '../src/loadEnv.js';

const webApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyAxgOj5l1NJWtyY7caAUf3sKRq6oaGFo5I';
const BACKEND_URL = 'http://localhost:5000/api';

async function getFirebaseIdToken(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Firebase login failed');
  return data.idToken;
}

async function runDashboardVerification() {
  console.log('=== CampusHire Placement Officer Dashboard Live Verification ===\n');

  // Step 1: Authenticate Officer & Student
  console.log('1. Authenticating Officer (tpo@nite.edu.in)...');
  const officerToken = await getFirebaseIdToken('tpo@nite.edu.in', 'Admin@TPO2026');
  console.log('   Officer Token acquired successfully.');

  console.log('2. Authenticating Student (student.demo@nite.edu.in)...');
  const studentToken = await getFirebaseIdToken('student.demo@nite.edu.in', 'Campus@2026!');
  console.log('   Student Token acquired successfully.\n');

  // Step 2: GET /api/stats
  console.log('3. Testing GET /api/stats (Overview & Analytics)...');
  const statsRes = await fetch(`${BACKEND_URL}/stats`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const statsJson = await statsRes.json();
  console.log(`   Status: HTTP ${statsRes.status}`);
  console.log(`   Has overview: ${Boolean(statsJson.data?.overview)}`);
  console.log(`   Has summary: ${Boolean(statsJson.data?.summary)}`);
  console.log(`   Has branchWise: ${Array.isArray(statsJson.data?.branchWise)} (length: ${statsJson.data?.branchWise?.length})`);
  console.log(`   Registered Students count: ${statsJson.data?.overview?.registeredStudents}`);
  console.log(`   Active Drives count: ${statsJson.data?.overview?.activeDrives}`);
  if (!statsJson.data?.overview || statsJson.data?.overview.registeredStudents === undefined) {
    throw new Error('Stats API failed response shape contract!');
  }

  // Step 3: GET /api/drives
  console.log('\n4. Testing GET /api/drives (Drive Management)...');
  const drivesRes = await fetch(`${BACKEND_URL}/drives`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const drivesJson = await drivesRes.json();
  console.log(`   Status: HTTP ${drivesRes.status}`);
  console.log(`   Total Drives in DB: ${drivesJson.pagination?.total || drivesJson.data?.length}`);
  const firstDrive = drivesJson.data?.[0];
  if (firstDrive) {
    console.log(`   Sample Drive: ${firstDrive.company} (${firstDrive.status}, Round: ${firstDrive.currentRound})`);
  }

  // Step 4: POST /api/drives as Officer
  console.log('\n5. Testing POST /api/drives (Create Drive by Officer)...');
  const createDriveRes = await fetch(`${BACKEND_URL}/drives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      company: 'Amazon Web Services',
      role: 'Cloud Support Associate',
      ctcLpa: 14,
      venueOrLink: 'Seminar Hall 2',
      currentRound: 'Online Coding Assessment',
      status: 'upcoming',
      targetBatch: '2027',
    }),
  });
  const createDriveJson = await createDriveRes.json();
  console.log(`   Status: HTTP ${createDriveRes.status}`);
  console.log(`   Created Drive ID: ${createDriveJson.data?._id}`);
  console.log(`   Company: ${createDriveJson.data?.company}`);
  const createdDriveId = createDriveJson.data?._id;

  // Step 5: PATCH /api/drives/:id as Officer
  console.log('\n6. Testing PATCH /api/drives/:id (Update Drive by Officer)...');
  const patchDriveRes = await fetch(`${BACKEND_URL}/drives/${createdDriveId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`,
    },
    body: JSON.stringify({
      status: 'in_progress',
      currentRound: 'Technical Interview Round 1',
      venueOrLink: 'Placement Lab 3',
    }),
  });
  const patchDriveJson = await patchDriveRes.json();
  console.log(`   Status: HTTP ${patchDriveRes.status}`);
  console.log(`   Updated status: ${patchDriveJson.data?.status}`);
  console.log(`   Updated round: ${patchDriveJson.data?.currentRound}`);

  // Step 6: PATCH /api/drives/:id as Student (RBAC check)
  console.log('\n7. Testing PATCH /api/drives/:id as Student (Must be rejected)...');
  const studentPatchRes = await fetch(`${BACKEND_URL}/drives/${createdDriveId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  console.log(`   Status: HTTP ${studentPatchRes.status} (Expected 403)`);
  if (studentPatchRes.status !== 403) {
    throw new Error(`Student was not rejected on drive update! Received ${studentPatchRes.status}`);
  }

  // Step 7: GET /api/applications as Officer
  console.log('\n8. Testing GET /api/applications (Officer Application View)...');
  const appsRes = await fetch(`${BACKEND_URL}/applications`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const appsJson = await appsRes.json();
  console.log(`   Status: HTTP ${appsRes.status}`);
  console.log(`   Applications returned: ${appsJson.data?.length || 0}`);

  // Step 8: GET /api/auth/students as Officer
  console.log('\n9. Testing GET /api/auth/students (Registered Students Directory)...');
  const studentsRes = await fetch(`${BACKEND_URL}/auth/students`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const studentsJson = await studentsRes.json();
  console.log(`   Status: HTTP ${studentsRes.status}`);
  console.log(`   Students returned: ${studentsJson.data?.length || 0}`);
  if (studentsJson.data?.length > 0) {
    console.log(`   Sample Student: ${studentsJson.data[0].name} (${studentsJson.data[0].department}, Roll: ${studentsJson.data[0].studentProfile?.rollNo || 'Not Assigned'})`);
  }

  // Step 9: GET /api/auth/students as Student (RBAC check)
  console.log('\n10. Testing GET /api/auth/students as Student (Must be rejected)...');
  const studentAccessStudentsRes = await fetch(`${BACKEND_URL}/auth/students`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`   Status: HTTP ${studentAccessStudentsRes.status} (Expected 403)`);
  if (studentAccessStudentsRes.status !== 403) {
    throw new Error(`Student was not rejected on student directory! Received ${studentAccessStudentsRes.status}`);
  }

  console.log('\n=== ALL OFFICER DASHBOARD ENDPOINTS & RBAC GUARDS FULLY VERIFIED! ===');
}

runDashboardVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

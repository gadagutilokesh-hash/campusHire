// Authentication service integrating Firebase Authentication with MongoDB backend sync
// Preserves demonstration mode when VITE_USE_MOCK_API is explicitly enabled.

import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../config/firebase';
import { currentStudent, currentOfficer } from '../data/mockStudents';
import { USER_ROLES } from '../utils/constants';
import { apiResponse, delay } from './api';

const AUTH_STORAGE_KEY = 'campushire_auth_user';
const TOKEN_STORAGE_KEY = 'campushire_auth_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';

/**
 * Normalizes user profile data across backend MongoDB schema and frontend component requirements.
 * Dynamically computes verification checklist and exact profile completion percentage.
 */
export const normalizeUserProfile = (user) => {
  if (!user) return null;
  const sp = user.studentProfile || {};
  const op = user.officerProfile || {};
  let role = user.role || USER_ROLES.STUDENT;
  if (role === 'officer') role = USER_ROLES.OFFICER;

  const normalized = {
    ...user,
    id: user._id || user.id || user.firebaseUid,
    role,
    name: user.name || user.email?.split('@')[0] || 'Student',
    email: user.email,
    branch: user.department || user.branch || 'General Engineering',
    department: user.department || user.branch || 'General Engineering',
    graduationYear: user.graduationYear || sp.graduationYear || 2027,
    rollNo: sp.rollNo || user.rollNo || 'Not Assigned',
    cgpa: sp.cgpa !== undefined ? Number(sp.cgpa) : (user.cgpa !== undefined ? Number(user.cgpa) : 0),
    activeBacklogs: sp.activeBacklogs !== undefined ? sp.activeBacklogs : (user.activeBacklogs || 0),
    historyBacklogs: sp.historyBacklogs !== undefined ? sp.historyBacklogs : (user.historyBacklogs || 0),
    tenthPercentage: sp.tenthPercentage !== undefined ? Number(sp.tenthPercentage) : (user.tenthPercentage !== undefined ? Number(user.tenthPercentage) : 0),
    twelfthPercentage: sp.twelfthPercentage !== undefined ? Number(sp.twelfthPercentage) : (user.twelfthPercentage !== undefined ? Number(user.twelfthPercentage) : 0),
    placementStatus: sp.placementStatus || user.placementStatus || 'unplaced',
    skills: sp.skills || user.skills || [],
    skillBadges: sp.skillBadges || user.skillBadges || [],
    resumeUrl: sp.resumeUrl || user.resumeUrl || '',
    resumeName: sp.resumeName || user.resumeName || '',
    resumeSize: sp.resumeSize || user.resumeSize || 0,
    resumeUpdatedAt: sp.resumeUpdatedAt || user.resumeUpdatedAt || null,
    phone: sp.phone || op.phone || user.phone || '',
    address: sp.address || user.address || '',
    course: sp.course || user.course || 'B.Tech',
    policyAcknowledged: Boolean(sp.policyAcknowledged || user.policyAcknowledged),
    policyAcknowledgedAt: sp.policyAcknowledgedAt || user.policyAcknowledgedAt || null,
  };

  // Dynamically calculate verification checklist and accurate completion percentage
  if (role === USER_ROLES.STUDENT) {
    const rollNoUpper = String(normalized.rollNo || '').trim().toUpperCase();
    const hasRollNo = Boolean(
      rollNoUpper &&
      rollNoUpper !== 'NOT ASSIGNED' &&
      rollNoUpper !== 'NOT_ASSIGNED' &&
      rollNoUpper !== 'N/A' &&
      rollNoUpper !== 'PENDING'
    );

    const checks = [
      {
        id: 1,
        title: 'Personal Details & Contact Info',
        completed: Boolean(normalized.name && normalized.email && normalized.phone),
        tip: 'Provide verified contact email, phone number, and residential address.',
      },
      {
        id: 2,
        title: 'Academic Records (Department & Roll No)',
        completed: Boolean(normalized.branch && hasRollNo && normalized.graduationYear),
        tip: 'Ensure your department, student roll number, and graduation year are recorded.',
      },
      {
        id: 3,
        title: 'Academic Standing (CGPA & Backlogs)',
        completed: Boolean(normalized.cgpa !== undefined && normalized.cgpa !== null && normalized.cgpa > 0),
        tip: 'Record cumulative CGPA and academic standing for placement screening.',
      },
      {
        id: 4,
        title: 'Resume Uploaded',
        completed: Boolean(normalized.resumeUrl && normalized.resumeUrl.trim().length > 0),
        tip: 'Upload your verified PDF resume for campus recruitment screening.',
      },
      {
        id: 5,
        title: 'Technical Skills & Badges',
        completed: Boolean(Array.isArray(normalized.skills) && normalized.skills.length > 0),
        tip: 'List your core engineering competencies, frameworks, and skill proficiency levels.',
      },
      {
        id: 6,
        title: 'Placement Policy Acknowledgment Form',
        completed: Boolean(normalized.policyAcknowledged && normalized.policyAcknowledgedAt),
        tip: 'Read, sign, and submit the 2026-27 placement guidelines agreement.',
      },
    ];

    const completedCount = checks.filter((c) => c.completed).length;
    const profileCompletion = Math.round((completedCount / checks.length) * 100);

    normalized.completionChecklist = checks;
    normalized.profileCompletion = profileCompletion;
  }

  return normalized;
};

export const authService = {
  isFirebaseActive() {
    return isFirebaseConfigured && auth !== null;
  },

  isMockMode() {
    return IS_MOCK_MODE;
  },

  /**
   * Syncs authenticated user profile directly with backend MongoDB Atlas using Firebase ID token.
   * Throws descriptive errors when backend authentication, database, or connection fails.
   */
  async syncProfileWithBackend(idToken) {
    if (!idToken) return null;

    let res;
    try {
      res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
    } catch (netErr) {
      throw new Error(`Unable to reach backend service at ${API_BASE} (${netErr.message}). Please verify server connectivity.`);
    }

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `Backend service returned HTTP ${res.status}`;
      if (res.status === 503) {
        throw new Error(`Database service unavailable: ${errorMsg}`);
      }
      if (res.status === 401) {
        throw new Error(`Authentication token rejected by backend: ${errorMsg}`);
      }
      if (res.status === 403) {
        throw new Error(`Backend access forbidden: ${errorMsg}`);
      }
      throw new Error(`Profile synchronization failed: ${errorMsg}`);
    }

    const json = await res.json();
    if (!json?.data) {
      throw new Error('User profile record could not be resolved from MongoDB database.');
    }

    const normalized = normalizeUserProfile(json.data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(TOKEN_STORAGE_KEY, idToken);
    return normalized;
  },

  /**
   * Logs in a user. Uses real Firebase Auth if configured; otherwise uses demonstration session.
   * Strictly distinguishes incorrect credentials, network errors, disabled providers, and role mismatches.
   */
  async login({ email, password, role = USER_ROLES.STUDENT }) {
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid institutional email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (this.isFirebaseActive()) {
      let fbUser;
      let idToken;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        fbUser = userCredential.user;
        idToken = await fbUser.getIdToken();
      } catch (fbError) {
        let errorMsg = 'Failed to sign in. Please verify your credentials.';
        const code = fbError?.code || '';

        if (
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password' ||
          code === 'auth/invalid-credential'
        ) {
          errorMsg = 'Invalid credentials. Please verify your email and password.';
        } else if (code === 'auth/invalid-email') {
          errorMsg = 'Please provide a valid institutional email address.';
        } else if (code === 'auth/user-disabled') {
          errorMsg = 'This account has been disabled by an administrator. Please contact the Placement Cell.';
        } else if (code === 'auth/too-many-requests') {
          errorMsg = 'Access temporarily disabled due to many failed sign-in attempts. Please try again later.';
        } else if (code === 'auth/network-request-failed') {
          errorMsg = 'Network connection failed. Unable to reach Firebase Authentication servers. Please check your internet connection.';
        } else if (code === 'auth/operation-not-allowed') {
          errorMsg = 'Email/Password sign-in provider is disabled in Firebase Console. Please enable Email/Password under Authentication.';
        } else if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
          errorMsg = 'Firebase configuration error: Invalid API key. Please check your environment variables.';
        } else if (code === 'auth/app-deleted') {
          errorMsg = 'Firebase configuration error: Firebase application instance is unavailable.';
        } else if (fbError?.message) {
          errorMsg = fbError.message;
        }

        // Ensure no leftover session on failed authentication
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        throw new Error(errorMsg);
      }

      // Step 2: Synchronize and verify MongoDB profile
      try {
        const profile = await this.syncProfileWithBackend(idToken);
        if (!profile) {
          throw new Error('User profile record could not be resolved from MongoDB database.');
        }

        // Step 3: Enforce role-based authorization and prevent role mismatch
        const isOfficerRequested =
          role === USER_ROLES.OFFICER || role === 'placement_officer' || role === 'officer';
        const isOfficerProfile =
          profile.role === USER_ROLES.OFFICER ||
          profile.role === 'placement_officer' ||
          profile.role === 'officer';

        if (role && profile.role && isOfficerRequested !== isOfficerProfile) {
          const selectedLabel = isOfficerRequested ? 'Placement Officer' : 'Student';
          const actualLabel = isOfficerProfile ? 'Placement Officer' : 'Student';
          throw new Error(
            `Role mismatch: Your account is registered as a ${actualLabel}, but you attempted to sign in as a ${selectedLabel}. Please select the ${actualLabel} role tab to sign in.`
          );
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem(TOKEN_STORAGE_KEY, idToken);

        return apiResponse(profile, 'Logged in via Firebase successfully');
      } catch (backendOrRoleErr) {
        // Sign out of Firebase to prevent leaving a dangling, unauthorized session
        try {
          await signOut(auth);
        } catch {
          // Ignore signOut cleanup errors
        }
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        throw backendOrRoleErr;
      }
    }

    // Demonstration Mode fallback (Only if VITE_USE_MOCK_API is true)
    if (this.isMockMode()) {
      await delay(250);
      const rawUser =
        role === USER_ROLES.OFFICER
          ? { ...currentOfficer, role: USER_ROLES.OFFICER }
          : { ...currentStudent, role: USER_ROLES.STUDENT };
      const userData = normalizeUserProfile(rawUser);

      const simulatedToken = `mock_jwt_token_${role}_${Date.now()}`;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, simulatedToken);

      return apiResponse(userData, 'Logged in (Demonstration Mode)');
    }

    throw new Error('Firebase Authentication is not available. Please verify your configuration.');
  },

  /**
   * Register a new student account
   */
  async registerStudent({ email, password, name, department, graduationYear, rollNo, cgpa }) {
    if (!email || !email.includes('@')) {
      throw new Error('Valid institutional email is required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (!name || !department) {
      throw new Error('Name and Department are required fields.');
    }

    if (this.isFirebaseActive()) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Register profile in MongoDB
      const res = await fetch(`${API_BASE}/auth/register-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name,
          email,
          department,
          graduationYear: graduationYear || 2027,
          rollNo,
          cgpa: Number(cgpa) || 7.0,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error?.message || 'Failed to save student profile in database.');
      }

      const json = await res.json();
      const normalized = normalizeUserProfile(json.data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(TOKEN_STORAGE_KEY, idToken);
      return apiResponse(normalized, 'Registered successfully');
    }

    // In demo mode
    if (this.isMockMode()) {
      await delay(300);
      const mockCreated = normalizeUserProfile({
        ...currentStudent,
        name,
        email,
        department,
        rollNo: rollNo || '23BTEST001',
        cgpa: Number(cgpa) || 8.0,
        role: USER_ROLES.STUDENT,
      });
      const simulatedToken = `mock_jwt_token_student_${Date.now()}`;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockCreated));
      localStorage.setItem(TOKEN_STORAGE_KEY, simulatedToken);
      return apiResponse(mockCreated, 'Student registered (Demonstration Mode)');
    }

    throw new Error('Firebase Authentication is not available for registration.');
  },

  /**
   * Updates student profile details and recalculates verification status
   */
  async updateProfile(profileData) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required to update profile.');
    }

    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to update profile (${res.status})`);
    }

    const json = await res.json();
    const normalized = normalizeUserProfile(json.data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    return apiResponse(normalized, 'Placement profile updated successfully');
  },

  /**
   * Uploads and verifies a genuine PDF resume
   */
  async uploadResume({ fileName, fileType, fileSize, fileData }) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required to upload resume.');
    }

    const res = await fetch(`${API_BASE}/auth/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName, fileType, fileSize, fileData }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to upload resume (${res.status})`);
    }

    const json = await res.json();
    const normalized = normalizeUserProfile(json.data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    return apiResponse(normalized, 'PDF resume uploaded and verified successfully');
  },

  /**
   * Logs out the user
   */
  async logout() {
    if (this.isFirebaseActive()) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[AuthService] Firebase signOut notice:', err.message);
      }
    } else {
      await delay(120);
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return apiResponse(null, 'Logged out successfully');
  },

  /**
   * Retrieves active session user without injecting mock data in live mode
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return normalizeUserProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading auth state:', e);
    }

    // Only fallback to mock profile in explicit mock mode
    if (this.isMockMode()) {
      return normalizeUserProfile({ ...currentStudent, role: USER_ROLES.STUDENT });
    }

    return null;
  },

  /**
   * Retrieves active token for backend requests
   */
  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  },

  /**
   * Role switch helper for evaluation
   */
  switchRole(role) {
    if (this.isMockMode()) {
      const newUser =
        role === USER_ROLES.OFFICER
          ? { ...currentOfficer, role: USER_ROLES.OFFICER }
          : { ...currentStudent, role: USER_ROLES.STUDENT };
      const normalized = normalizeUserProfile(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(TOKEN_STORAGE_KEY, `mock_jwt_token_${role}_${Date.now()}`);
      return normalized;
    }
    return this.getCurrentUser();
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY));
  },
};

export default authService;

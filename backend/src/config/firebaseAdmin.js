import '../loadEnv.js';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp = null;

/**
 * Checks if Firebase Admin credentials are fully provided in backend environment
 */
export const isFirebaseAdminConfigured = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return Boolean(
    projectId &&
    clientEmail &&
    privateKey &&
    !projectId.includes('your-') &&
    !clientEmail.includes('your-') &&
    !privateKey.includes('...')
  );
};

/**
 * Initialize Firebase Admin SDK
 */
export const initFirebaseAdmin = () => {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn(
      '[Firebase Admin] Credentials not configured. Token verification will reject until valid credentials are added in backend/.env.'
    );
    return null;
  }

  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID.replace(/"/g, ''),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL.replace(/"/g, ''),
        privateKey,
      }),
    });

    console.log('[Firebase Admin] Initialized successfully for project:', process.env.FIREBASE_PROJECT_ID);
    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error.message);
    return null;
  }
};

/**
 * Verifies a client Firebase ID token.
 */
export const verifyFirebaseIdToken = async (idToken) => {
  const appInstance = initFirebaseAdmin();
  if (!appInstance) {
    throw new Error(
      'Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env.'
    );
  }

  return await getAuth(appInstance).verifyIdToken(idToken);
};

/**
 * Retrieves a user record by email from Firebase Auth if exists
 */
export const getFirebaseUserByEmail = async (email) => {
  const appInstance = initFirebaseAdmin();
  if (!appInstance) return null;
  try {
    return await getAuth(appInstance).getUserByEmail(email.toLowerCase());
  } catch (err) {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  }
};

/**
 * Sets custom user claims in Firebase Auth (e.g. { role: 'placement_officer' })
 */
export const setFirebaseUserClaims = async (uid, claims) => {
  const appInstance = initFirebaseAdmin();
  if (!appInstance) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
  await getAuth(appInstance).setCustomUserClaims(uid, claims);
};

/**
 * Creates or updates a placement officer account in Firebase Auth with verified custom claims
 */
export const createFirebaseOfficerUser = async ({ email, password, displayName }) => {
  const appInstance = initFirebaseAdmin();
  if (!appInstance) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
  const auth = getAuth(appInstance);
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email.toLowerCase());
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: email.toLowerCase(),
        password,
        displayName,
      });
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: 'placement_officer' });
  return userRecord;
};

export default {
  initFirebaseAdmin,
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken,
  getFirebaseUserByEmail,
  setFirebaseUserClaims,
  createFirebaseOfficerUser,
};


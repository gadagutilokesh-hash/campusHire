import { User } from '../models/User.js';
import {
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken,
  setFirebaseUserClaims,
} from '../config/firebaseAdmin.js';
import { getConnectionStatus } from '../config/database.js';

/**
 * Authentication Middleware
 *
 * Verifies Bearer tokens sent in the Authorization header.
 *
 * 1. Checks for Authorization header formatted as 'Bearer <token>'
 * 2. If Firebase Admin is configured:
 *    - Verifies token with Firebase Admin
 *    - Looks up trusted user profile & role in MongoDB
 *    - If user exists in Firebase but not in MongoDB, automatically creates student profile
 *      (public signups can NEVER create placement_officer accounts)
 *    - Binds verified server record to req.user
 * 3. In development test environments without cloud keys:
 *    - Supports dev mock token ONLY if ALLOW_DEV_AUTH=true is explicitly set in environment
 * 4. In all other scenarios, returns a clear 401/503 explaining configuration requirements.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Missing or malformed Authorization Bearer header.',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(' ')[1];

  // Development/Test mock identity handling (Strictly gated by ALLOW_DEV_AUTH)
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const allowDevAuth = process.env.ALLOW_DEV_AUTH === 'true';

  if (isDevOrTest && allowDevAuth && token.startsWith('mock_jwt_token_')) {
    const isOfficer = token.includes('officer');
    req.user = {
      _id: req.headers['x-dev-user-id'] || '000000000000000000000001',
      name: isOfficer ? 'Dr. Radhika Menon' : 'Arjun Sharma',
      email: isOfficer ? 'tpo@nite.edu.in' : 'arjun.sharma@nite.edu.in',
      role: isOfficer ? 'placement_officer' : 'student',
      department: 'Computer Science & Engineering',
      graduationYear: 2027,
    };
    return next();
  }

  // If Firebase Admin is configured, perform real token verification
  if (isFirebaseAdminConfigured()) {
    try {
      const decodedToken = await verifyFirebaseIdToken(token);

      // Verify and resolve identity from MongoDB
      const dbStatus = getConnectionStatus();
      if (!dbStatus.isConnected) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Database connection unavailable to resolve authenticated user profile.',
            statusCode: 503,
          },
        });
      }

      // Check Firebase custom claims if present
      const isOfficerClaim =
        decodedToken.role === 'placement_officer' || decodedToken.placement_officer === true;

      let user = await User.findOne({
        $or: [{ firebaseUid: decodedToken.uid }, { email: decodedToken.email?.toLowerCase() }],
      });

      if (user) {
        // Enforce account identity and UID consistency
        if (user.firebaseUid && user.firebaseUid !== decodedToken.uid) {
          return res.status(409).json({
            success: false,
            error: {
              message:
                'Account identity conflict: Authenticated Firebase UID does not match registered profile UID.',
              statusCode: 409,
            },
          });
        }

        let modified = false;

        // Bind firebaseUid if user was provisioned prior to first Firebase sign-in
        if (!user.firebaseUid) {
          user.firebaseUid = decodedToken.uid;
          modified = true;
        }

        // If user is provisioned as placement_officer in MongoDB, ensure Firebase custom claims reflect this
        if (user.role === 'placement_officer' && !isOfficerClaim) {
          try {
            await setFirebaseUserClaims(decodedToken.uid, { role: 'placement_officer' });
          } catch (claimsErr) {
            console.warn('[Auth Middleware] Notice syncing custom claims:', claimsErr.message);
          }
        }

        if (modified) {
          await user.save();
        }
      } else {
        // First-time authenticated user not yet in MongoDB:
        // If the Firebase account carries verified administrative custom claim, provision officer profile;
        // otherwise default strictly to student (public registration can NEVER create officer accounts).
        const role = isOfficerClaim ? 'placement_officer' : 'student';

        user = new User({
          firebaseUid: decodedToken.uid,
          name:
            decodedToken.name ||
            decodedToken.email?.split('@')[0] ||
            (isOfficerClaim ? 'Placement Officer' : 'Student'),
          email: decodedToken.email?.toLowerCase(),
          role,
          ...(role === 'student'
            ? {
                department: 'General Engineering',
                graduationYear: 2027,
                studentProfile: {
                  placementStatus: 'unplaced',
                  profileCompletion: 20,
                },
              }
            : {
                officerProfile: {
                  designation: 'Placement Officer',
                },
              }),
        });
        await user.save();
      }

      req.user = user;
      return next();
    } catch (firebaseErr) {
      return res.status(401).json({
        success: false,
        error: {
          message: `Authentication failed: ${firebaseErr.message || 'Invalid or expired Firebase ID token.'}`,
          statusCode: 401,
        },
      });
    }
  }

  // Fallback when credentials are unconfigured: clear security notice without silent bypass
  return res.status(503).json({
    success: false,
    error: {
      message:
        'Firebase Authentication credentials are not configured on the server. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env, or set ALLOW_DEV_AUTH=true for local development testing.',
      statusCode: 503,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Role-Based Access Control Middleware.
 * Enforces that req.user has one of the allowed roles.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized: User profile not resolved.',
          statusCode: 401,
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Forbidden: Access requires role [${allowedRoles.join(', ')}]. Your verified role is '${req.user.role}'.`,
          statusCode: 403,
        },
      });
    }

    next();
  };
};

export default { authenticate, authorizeRoles };

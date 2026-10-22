import { getConnectionStatus } from '../config/database.js';

/**
 * Health Check Controller
 * GET /api/health
 * Returns API and database status without leaking secrets.
 */
export const getHealth = async (req, res) => {
  const dbStatus = getConnectionStatus();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'CampusHire API Service',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus.status,
        connected: dbStatus.isConnected,
      },
      auth: {
        firebaseConfigured: !!(
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY
        ),
      },
      timestamp: new Date().toISOString(),
    },
  });
};

export default { getHealth };

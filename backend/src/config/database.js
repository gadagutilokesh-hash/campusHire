import '../loadEnv.js';
import mongoose from 'mongoose';

// Register connection lifecycle event handlers once
let listenersRegistered = false;
const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    const activeDb = mongoose.connection.name || process.env.MONGODB_DB_NAME || 'campushire';
    console.log(`[Database] Mongoose connected to MongoDB Atlas (database: '${activeDb}').`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Mongoose runtime connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection disconnected from MongoDB Atlas.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose reconnected to MongoDB Atlas.');
  });
};

/**
 * Returns a safe connection state description without exposing any credentials.
 */
export const getConnectionStatus = () => {
  const stateCode = mongoose.connection.readyState;
  switch (stateCode) {
    case 0:
      return { status: 'disconnected', isConnected: false };
    case 1:
      return { status: 'connected', isConnected: true };
    case 2:
      return { status: 'connecting', isConnected: false };
    case 3:
      return { status: 'disconnecting', isConnected: false };
    default:
      return { status: 'unknown', isConnected: false };
  }
};

/**
 * Formats diagnostic error messages for common MongoDB Atlas failure modes.
 * Secrets, usernames, and passwords are never included.
 */
const formatAtlasErrorMessage = (error) => {
  const msg = error.message || '';
  const code = error.code || '';

  if (code === 8000 || msg.includes('bad auth') || msg.includes('AuthenticationFailed') || msg.includes('auth error')) {
    return 'Authentication Failed: The database credentials in MONGODB_URI are invalid. Verify your Atlas Database Access user and password.';
  }

  if (msg.includes('querySrv ENOTFOUND') || msg.includes('ENOTFOUND')) {
    return 'DNS Resolution Failed: Unable to resolve cluster hostname. Verify the cluster URL in MONGODB_URI.';
  }

  if (
    error.name === 'MongooseServerSelectionError' ||
    msg.includes('server selection timed out') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNREFUSED')
  ) {
    return 'Network Access Restricted / Timed Out: Unable to reach MongoDB Atlas cluster. Ensure your IP address is whitelisted in MongoDB Atlas -> Network Access (e.g. 0.0.0.0/0 for development).';
  }

  return `Failed to connect to MongoDB Atlas: ${msg}`;
};

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Sanitizes logging to ensure secrets are never exposed.
 */
export const connectDatabase = async () => {
  registerConnectionListeners();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'campushire';

  // Safe diagnostic log: confirms variable presence, length, and protocol without exposing secrets
  const uriConfigured = Boolean(uri);
  const protocol = uri ? (uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://') : 'none';
  console.log(
    `[Database] Connection check: MONGODB_URI is ${uriConfigured ? 'SET' : 'NOT SET'} (protocol: ${protocol}, length: ${uri ? uri.length : 0}), Target Database: '${dbName}'`
  );

  if (!uri) {
    console.warn(
      '[Database] MONGODB_URI is not set in environment variables. Running in disconnected mode. Database features will return clear configuration notices.'
    );
    return false;
  }

  // Prevent placeholder string from causing continuous hang
  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.warn(
      '[Database] MONGODB_URI contains placeholder credentials (<username>/<password>). Please update with your real MongoDB Atlas connection string in backend/.env.'
    );
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      dbName,
    });
    console.log(`[Database] MongoDB Atlas connection established successfully (database: '${dbName}').`);
    return true;
  } catch (error) {
    const diagnosticMessage = formatAtlasErrorMessage(error);
    console.error(`[Database] ${diagnosticMessage}`);
    return false;
  }
};

export default connectDatabase;

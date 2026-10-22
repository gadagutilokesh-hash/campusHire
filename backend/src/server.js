import './loadEnv.js';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = process.env.PORT || 5000;

// Initialize database connection
connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`[Server] CampusHire Backend listening on http://localhost:${PORT}`);
  console.log(`[Server] Health check endpoint: http://localhost:${PORT}/api/health`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Server] Shutting down gracefully...');
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('[Database] MongoDB connection closed.');
    }
  } catch (err) {
    console.error('[Database] Error closing MongoDB connection:', err.message);
  }
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;

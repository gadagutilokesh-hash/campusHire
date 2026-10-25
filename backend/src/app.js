import './loadEnv.js';
import express from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import driveRoutes from './routes/driveRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Middlewares
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Helper to sanitize origin URLs (strips whitespace and trailing slashes)
const sanitizeOrigin = (url) => (typeof url === 'string' ? url.trim().replace(/\/+$/, '') : '');

// Default trusted origins including production Vercel frontend and local development
const DEFAULT_ALLOWED_ORIGINS = [
  'https://campus-hire-wine.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// Resolves configured origins from environment variable CLIENT_ORIGIN
const getConfiguredOrigins = () => {
  const envVal = process.env.CLIENT_ORIGIN;
  if (!envVal) return DEFAULT_ALLOWED_ORIGINS;

  // Support comma-separated origins or a single origin
  const parsed = envVal
    .split(',')
    .map((o) => sanitizeOrigin(o))
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...parsed]));
};

// Origin validation predicate without wildcard workarounds
const isOriginAllowed = (origin) => {
  // Allow non-browser requests (e.g. mobile apps, curl, server-to-server health checks)
  if (!origin) return true;

  const cleanOrigin = sanitizeOrigin(origin);
  const allowedList = getConfiguredOrigins();

  // 1. Exact match with configured or default production origins
  if (allowedList.includes(cleanOrigin)) {
    return true;
  }

  // 2. Allow local development ports dynamically (http://localhost:* or http://127.0.0.1:*)
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
    return true;
  }

  // 3. Allow Vercel preview deployments for campus-hire
  if (/^https:\/\/campus-hire-[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
};

// CORS configuration options
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      }
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-dev-user-id',
    'x-officer-provision-key',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

// 1. Mount CORS middleware FIRST to guarantee preflight and cross-origin handling runs before all other middlewares/routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Security HTTP headers with Helmet - configured so Cross-Origin-Resource-Policy permits API consumption
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 4. Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Serve verified static uploads (e.g. resumes)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 6. Direct Health check endpoints (both /health and /api/health for Render/monitoring probes)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// 7. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/stats', statsRoutes);

// 8. Root fallback notice
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CampusHire REST API Service is running.',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// 9. 404 Handler
app.use(notFound);

// 10. Centralized Error Handler
app.use(errorHandler);

export default app;

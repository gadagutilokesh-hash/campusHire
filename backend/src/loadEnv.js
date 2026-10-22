import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env using absolute path, independent of terminal CWD
const backendEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: backendEnvPath });

// Fallback to project root .env if MONGODB_URI is still not loaded
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export default process.env;

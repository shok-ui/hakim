import 'dotenv/config';

// Central environment handling. The API fails fast on startup when a critical
// variable is missing so misconfigurations are caught immediately instead of
// surfacing as runtime errors on the first request.

function readString(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw;
}

function readInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return parsed;
}

const nodeEnv = readString('NODE_ENV', 'development');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  throw new Error(
    'Environment variable JWT_SECRET is missing or too short. ' +
      'Copy server/.env.example to server/.env and set a long random value.'
  );
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: readInt('PORT', 4000),
  mongoUri: readString('MONGODB_URI', 'mongodb://127.0.0.1:27017/hakim'),
  // USE_MEMORY_DB=true spins up an ephemeral MongoDB (mongodb-memory-server)
  // instead of requiring a real mongod. Used for sandboxes and demos.
  useMemoryDb: process.env.USE_MEMORY_DB === 'true',
  redisUrl: readString('REDIS_URL', 'redis://127.0.0.1:6379'),
  jwtSecret,
  jwtExpiresIn: readString('JWT_EXPIRES_IN', '7d'),
  clientOrigin: readString('CLIENT_ORIGIN', 'http://localhost:5173'),
  cacheTtlSeconds: readInt('CACHE_TTL_SECONDS', 60)
};

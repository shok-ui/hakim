import dotenv from 'dotenv';

dotenv.config();

// Loads and validates configuration from environment variables once at boot.
const pick = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: pick('CLIENT_ORIGIN', 'http://localhost:5173'),
  mongoUri: pick('MONGODB_URI', 'mongodb://127.0.0.1:27017/hakim'),
  redisUrl: pick('REDIS_URL', 'redis://127.0.0.1:6379'),
  jwtSecret: pick('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  slotMinutes: Number(process.env.SLOT_MINUTES ?? 30),
  maxBookingDaysAhead: Number(process.env.MAX_BOOKING_DAYS_AHEAD ?? 60)
};

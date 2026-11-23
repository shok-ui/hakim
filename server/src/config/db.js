import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  logger.info({ uri: safeUri(env.mongoUri) }, 'MongoDB connected');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

function safeUri(uri) {
  // Hide credentials before logging the connection string.
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.password = '***';
    return parsed.toString();
  } catch {
    return 'invalid-uri';
  }
}

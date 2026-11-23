import mongoose from 'mongoose';
import { logger } from './logger.js';

export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info({ host: mongoose.connection.host, db: mongoose.connection.name }, 'connected to MongoDB');
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('disconnected from MongoDB');
  }
}

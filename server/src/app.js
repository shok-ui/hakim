import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { getRedis } from './config/redis.js';
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import reviewRoutes from './routes/reviews.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Builds the Express application. Kept free of connections so tests and
// smoke checks can import it safely; the HTTP server and database/Redis
// lifecycles live in src/index.js.
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.info(
        { method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - startedAt },
        'request'
      );
    });
    next();
  });

  app.get('/api/health', async (_req, res) => {
    const mongoUp = mongoose.connection.readyState === 1;
    let redisUp = false;
    try {
      redisUp = await Promise.race([
        getRedis().ping().then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 300))
      ]);
    } catch {
      redisUp = false;
    }
    res.json({
      status: mongoUp ? 'ok' : 'degraded',
      mongo: mongoUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime())
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/reviews', reviewRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

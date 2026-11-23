import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 5000)
});

redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));
redis.on('connect', () => logger.info('Redis connected'));

export function disconnectRedis() {
  redis.disconnect();
}

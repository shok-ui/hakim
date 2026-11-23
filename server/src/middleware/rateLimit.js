import { ApiError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { getRedis } from '../config/redis.js';

// Fixed-window rate limiter backed by Redis. Used on credential endpoints to
// slow down brute force attempts. Fails open when Redis is unavailable so
// the API stays reachable; that trade-off is documented in the README.
export function rateLimit({ windowSeconds = 300, max = 10, prefix = 'rl' } = {}) {
  return async (req, _res, next) => {
    try {
      const redis = getRedis();
      const key = `${prefix}:${req.ip || 'unknown'}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (count > max) {
        return next(new ApiError(429, 'Too many requests. Please try again in a few minutes.'));
      }
      next();
    } catch (error) {
      logger.warn({ err: error.message, prefix }, 'rate limiter skipped, redis unavailable');
      next();
    }
  };
}

import { redis } from '../config/redis.js';

// Fixed-window rate limiter backed by Redis. Responds with 429 and a
// Retry-After header once the limit is exceeded. Fails open when Redis is
// unreachable so a cache outage never locks users out.
export function rateLimit({ key, limit, windowSeconds, message = 'Too many requests, please slow down' }) {
  return (req, res, next) => {
    const bucket = `rl:${key}:${req.ip ?? 'unknown'}`;
    redis
      .incr(bucket)
      .then(async (count) => {
        if (count === 1) await redis.expire(bucket, windowSeconds);
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
        if (count > limit) {
          const ttl = await redis.ttl(bucket);
          res.setHeader('Retry-After', String(Math.max(1, ttl)));
          return res.status(429).json({ message });
        }
        return next();
      })
      .catch(() => next());
  };
}

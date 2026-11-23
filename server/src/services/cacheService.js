import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

// Read-through JSON cache on top of Redis. Every helper fails soft: cache
// problems degrade performance but never break a request.
export async function cacheGet(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn({ key, err: err.message }, 'Cache read failed');
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ key, err: err.message }, 'Cache write failed');
  }
}

export async function cacheDelete(...keys) {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ keys, err: err.message }, 'Cache invalidation failed');
  }
}

// Deletes every key matching a pattern (SCAN based, safe for production).
export async function cacheDeletePattern(pattern) {
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.warn({ pattern, err: err.message }, 'Pattern invalidation failed');
  }
}

// Returns the cached value, or computes it with the producer, stores the
// result and returns it.
export async function withCache(key, ttlSeconds, producer) {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const fresh = await producer();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

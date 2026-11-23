import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getRedis } from '../config/redis.js';

// Cache-aside helper. Reads a JSON value from Redis and falls back to the
// producer function on a cache miss, or whenever Redis is unavailable. In
// that case the API simply runs uncached instead of failing.
export async function cached(key, ttlSeconds, producer) {
  try {
    const raw = await getRedis().get(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (error) {
    logger.debug({ err: error.message, key }, 'cache read skipped');
  }

  const value = await producer();

  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds ?? env.cacheTtlSeconds);
  } catch (error) {
    logger.debug({ err: error.message, key }, 'cache write skipped');
  }

  return value;
}

// Deletes every cache key that starts with the given prefix using a SCAN
// loop, which is safe for large keyspaces.
export async function bustPrefix(prefix) {
  try {
    const redis = getRedis();
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    logger.debug({ err: error.message, prefix }, 'cache bust skipped');
  }
}

// Short-lived optimistic lock used while a booking is being written. Returns
// the lock token on success, null when somebody else holds the lock, or the
// sentinel "db-only" when Redis is unavailable. The database partial unique
// index on appointments is the final safety net in every case.
export async function acquireLock(key, ttlSeconds = 10) {
  try {
    const redis = getRedis();
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
    if (result) return token;
    return null;
  } catch (error) {
    logger.warn({ err: error.message, key }, 'lock unavailable, relying on database constraint');
    return 'db-only';
  }
}

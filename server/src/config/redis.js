import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// Redis is an optional accelerator for Hakim: it powers response caching,
// rate limiting and the booking slot lock. The client is created lazily and
// the connection error is logged as a warning instead of crashing the API.
// Every consumer is expected to treat Redis failures as a soft degradation.

let client;

export function getRedis() {
  if (!client) {
    client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 500, 10_000)
    });
    client.on('error', (error) => {
      logger.warn({ err: error.message }, 'redis error');
    });
    client
      .connect()
      .then(() => logger.info({ url: env.redisUrl }, 'connected to Redis'))
      .catch((error) => logger.warn({ err: error.message }, 'redis unavailable, running without cache'));
  }
  return client;
}

export async function closeRedis() {
  if (!client) return;
  const current = client;
  client = undefined;
  try {
    await current.quit();
  } catch {
    current.disconnect();
  }
}

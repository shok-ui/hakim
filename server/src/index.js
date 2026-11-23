import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { logger } from './config/logger.js';

const app = createApp();
let server;

async function start() {
  await connectDb(env.mongoUri);
  server = app.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Hakim API is listening');
  });
}

async function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDb();
    await closeRedis();
  } catch (error) {
    logger.error({ err: error.message }, 'error during shutdown');
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  logger.error({ err: error.message }, 'failed to start the API');
  process.exit(1);
});

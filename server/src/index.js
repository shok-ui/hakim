import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { disconnectRedis } from './config/redis.js';
import { createApp } from './app.js';
import { startReminderScheduler } from './services/reminderService.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () =>
    logger.info({ port: env.port, env: env.nodeEnv }, 'Hakim API listening')
  );

  startReminderScheduler();

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    server.close();
    await disconnectDatabase();
    disconnectRedis();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err: err.message }, 'Failed to start Hakim API');
  process.exit(1);
});

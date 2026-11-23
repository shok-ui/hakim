import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { seedAll } from './seed/seed.js';

const app = createApp();
let server;
let mongod;

// In-memory MongoDB mode: when USE_MEMORY_DB=true the API boots an ephemeral
// mongod (mongodb-memory-server), connects to it and seeds the demo data in
// the same process. This is what sandboxes and quick demos use when no real
// MongoDB is available. Without the flag the startup path is unchanged.
async function resolveMongoUri() {
  if (!env.useMemoryDb) {
    return env.mongoUri;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'hakim' } });
  const uri = mongod.getUri('hakim');
  logger.info(`in-memory MongoDB ready at ${uri}`);
  return uri;
}

async function start() {
  const uri = await resolveMongoUri();
  await connectDb(uri);

  if (env.useMemoryDb) {
    await seedAll();
  }

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
    if (mongod) {
      await mongod.stop();
    }
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

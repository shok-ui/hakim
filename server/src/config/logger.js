import pino from 'pino';

// Structured JSON logging. Keep the level configurable without pulling the
// whole env module so utility code can log without creating import cycles.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'hakim-api' }
});

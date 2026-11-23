import mongoose from 'mongoose';
import { ApiError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. Known ApiErrors keep their status and message,
// Mongoose validation and duplicate key errors are translated to friendly
// responses, and everything else is logged with a stack and returned as a
// generic 500 so internals never leak to clients.
export function errorHandler(error, _req, res, _next) {
  if (error instanceof ApiError) {
    const body = { message: error.message };
    if (error.details !== undefined) body.details = error.details;
    return res.status(error.status).json(body);
  }

  if (error?.name === 'ValidationError' && error.errors) {
    const details = Object.values(error.errors).map((issue) => ({
      path: issue.path,
      message: issue.message
    }));
    return res.status(422).json({ message: 'Validation failed', details });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'The requested resource conflicts with an existing record' });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Malformed identifier' });
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The database is not reachable. Please try again later.' });
  }

  logger.error({ err: error }, 'unhandled error');
  return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
}

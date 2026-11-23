import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

// Central error handler: known ApiErrors and Mongoose validation errors become
// clean JSON responses; anything unexpected is logged and returns a generic
// message so internals never leak to clients.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message)
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'This record already exists' });
  }

  logger.error({ err: err.message }, 'Unhandled error');
  return res.status(500).json({ message: 'Internal server error' });
}

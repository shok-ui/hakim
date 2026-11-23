// Small error handling helpers shared by every route.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

// Express 4 does not forward rejected promises from async handlers, so every
// async route is wrapped with this helper.
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

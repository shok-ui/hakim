import { ApiError } from '../utils/errors.js';

// Declarative request validation with zod. Parsed values replace the raw
// ones (coercion, trimming, defaults) so handlers work with clean data.
export function validate({ body, query } = {}) {
  return (req, _res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body ?? {});
      }
      if (query) {
        req.validatedQuery = query.parse(req.query ?? {});
      }
      next();
    } catch (error) {
      if (Array.isArray(error?.issues)) {
        next(
          new ApiError(
            422,
            'Validation failed',
            error.issues.map((issue) => ({
              path: issue.path.join('.') || 'value',
              message: issue.message
            }))
          )
        );
      } else {
        next(error);
      }
    }
  };
}

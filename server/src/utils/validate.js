import { ApiError } from './ApiError.js';

// Small hand-rolled validators - enough structure without extra dependencies.
export const validators = {
  email(value) {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  },
  password(value) {
    return (
      typeof value === 'string' &&
      value.length >= 8 &&
      /[A-Za-z]/.test(value) &&
      /\d/.test(value)
    );
  },
  name(value) {
    return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 80;
  },
  objectId(value) {
    return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
  }
};

export function assert(condition, message) {
  if (!condition) throw ApiError.badRequest(message);
}

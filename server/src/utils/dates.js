// Pure date and time helpers used by slot generation and booking validation.
// Everything is UTC based so behavior is identical on any host and easy to
// unit test. Dates are handled as "YYYY-MM-DD" strings to avoid timezone
// drift between the client and the server.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidDateStr(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

export function dayOfWeekUtc(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();
}

export function todayStrUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function nowMinutesUtc() {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

export function isPastDate(dateStr) {
  return dateStr < todayStrUtc();
}

export function minutesToLabel(minute) {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function labelToMinutes(label) {
  const match = TIME_PATTERN.exec(String(label ?? '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

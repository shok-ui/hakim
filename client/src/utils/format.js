// Small formatting helpers shared across pages. Every helper accepts an
// optional locale (defaults to en-US) so pages render dates in the active
// UI language while the underlying values stay stable.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || 'H'
  );
}

export function formatDate(iso, locale = 'en-US') {
  if (!iso) return '';
  // Date-only strings ("YYYY-MM-DD", the appointment-day format) are pinned
  // to UTC midnight so the calendar day never shifts; full timestamps keep
  // rendering in the viewer's local timezone as before.
  if (DATE_ONLY.test(iso)) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(iso, locale = 'en-US') {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso, locale = 'en-US') {
  if (!iso) return '';
  return `${formatDate(iso, locale)}, ${formatTime(iso, locale)}`;
}

// Minutes since midnight (UTC) to a zero-padded 24h label, matching the
// server-side slot labels: 540 -> "09:00".
export function minutesToLabel(minute) {
  if (!Number.isFinite(minute)) return '';
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Full label for an appointment keyed by date string + start minute, the
// shape returned by /api/appointments/mine and /api/appointments/doctor.
export function formatAppointmentWhen(when, locale = 'en-US') {
  if (!when?.date) return '';
  const time = minutesToLabel(when.startMinute);
  return time ? `${formatDate(when.date, locale)} - ${time} (UTC)` : formatDate(when.date, locale);
}

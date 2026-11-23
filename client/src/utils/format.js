// Small formatting helpers shared across pages.

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

export function formatDate(iso) {
  if (!iso) return '';
  // Appointment dates arrive as "YYYY-MM-DD"; parsing with T00:00 keeps the
  // calendar day stable instead of shifting with the local timezone.
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return `${formatDate(iso)}, ${formatTime(iso)}`;
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
export function formatAppointmentWhen(when) {
  if (!when?.date) return '';
  const time = minutesToLabel(when.startMinute);
  return time ? `${formatDate(when.date)} at ${time} (UTC)` : formatDate(when.date);
}

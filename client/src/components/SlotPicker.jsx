import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.jsx';

// Date strip for the next 14 days plus the bookable slot grid for the
// selected day, driven by the live slot contract:
// GET /doctors/:id/slots?date=YYYY-MM-DD -> { date, schedule, slots }
// where each slot is { startMinute, endMinute, label, available }.
// Booking is delegated to the onBook(date, startMinute) callback so pages
// decide what happens next (redirect, refresh, error message).
export function SlotPicker({ doctorId, onBook, disabled }) {
  const { t, dateLocale } = useI18n();
  const days = getNextDays(14, dateLocale);
  const [activeDay, setActiveDay] = useState(days[0].iso);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [busySlot, setBusySlot] = useState(null);

  useEffect(() => {
    let active = true;
    setSlots(null);
    setError('');
    (async () => {
      try {
        const data = await api(`/doctors/${doctorId}/slots`, { query: { date: activeDay } });
        if (active) setSlots(data.slots);
      } catch (err) {
        if (active) setError(err.message);
      }
    })();
    return () => {
      active = false;
    };
  }, [doctorId, activeDay]);

  const refreshSlots = async () => {
    try {
      const data = await api(`/doctors/${doctorId}/slots`, { query: { date: activeDay } });
      setSlots(data.slots);
    } catch {
      // Keep the previous list; the next day switch refreshes anyway.
    }
  };

  const book = async (startMinute) => {
    setError('');
    setBusySlot(startMinute);
    try {
      await onBook(activeDay, startMinute);
      await refreshSlots();
    } catch (err) {
      setError(err.message);
      await refreshSlots(); // availability may have changed (e.g. slot taken)
    } finally {
      setBusySlot(null);
    }
  };

  const noSlots = Array.isArray(slots) && slots.length === 0;
  const allTaken = Array.isArray(slots) && slots.length > 0 && slots.every((s) => !s.available);

  return (
    <div className="slot-picker">
      <div className="day-tabs">
        {days.map((day) => (
          <button
            key={day.iso}
            type="button"
            className={day.iso === activeDay ? 'day-tab active' : 'day-tab'}
            onClick={() => setActiveDay(day.iso)}
          >
            <span className="day-tab-dow">{day.dow}</span>
            <span className="day-tab-date">{day.label}</span>
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {slots === null ? (
        <p className="muted">{t('loadingSlots')}</p>
      ) : noSlots ? (
        <p className="muted">{t('noWorkingDay')}</p>
      ) : allTaken ? (
        <p className="muted">{t('noFreeSlots')}</p>
      ) : (
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.startMinute}
              type="button"
              disabled={!slot.available || disabled || busySlot === slot.startMinute}
              className={slot.available ? 'slot' : 'slot taken'}
              onClick={() => book(slot.startMinute)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Day strip labels follow the active UI locale while the ISO key stays a
// pure UTC calendar day, matching the server-side slot generation.
function getNextDays(n, dateLocale) {
  const days = [];
  for (let i = 0; i < n; i++) {
    // Dates are pure UTC calendar days on the server (slot generation and the
    // "today" cutoff both use UTC), so the day strip is built from UTC parts.
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const iso = [
      d.getUTCFullYear(),
      String(d.getUTCMonth() + 1).padStart(2, '0'),
      String(d.getUTCDate()).padStart(2, '0')
    ].join('-');
    days.push({
      iso,
      dow: d.toLocaleDateString(dateLocale, { weekday: 'short', timeZone: 'UTC' }),
      label: d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    });
  }
  return days;
}

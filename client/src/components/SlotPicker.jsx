import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Day tabs for the next 7 days plus the bookable slot grid for the selected
// day. Booking is delegated to the onBook callback so pages can decide what
// happens next (redirect, refresh, error toast).
export function SlotPicker({ doctorId, onBook, disabled }) {
  const days = getNextDays(7);
  const [activeDay, setActiveDay] = useState(days[0].iso);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [busySlot, setBusySlot] = useState('');

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
      // Keep the previous list; the next tab switch refreshes anyway.
    }
  };

  const book = async (startAt) => {
    setError('');
    setBusySlot(startAt);
    try {
      await onBook(startAt);
      await refreshSlots();
    } catch (err) {
      setError(err.message);
      await refreshSlots(); // availability may have changed (e.g. slot taken)
    } finally {
      setBusySlot('');
    }
  };

  const allTaken = Array.isArray(slots) && slots.every((s) => s.taken);

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
        <p className="muted">Loading slots...</p>
      ) : allTaken ? (
        <p className="muted">No free slots on this day. Please check another day.</p>
      ) : (
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.startAt}
              type="button"
              disabled={slot.taken || disabled || busySlot === slot.startAt}
              className={slot.taken ? 'slot taken' : 'slot'}
              onClick={() => book(slot.startAt)}
            >
              {formatTime(slot.startAt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getNextDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
    days.push({
      iso,
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }
  return days;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

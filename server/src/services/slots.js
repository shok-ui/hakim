import {
  dayOfWeekUtc,
  isValidDateStr,
  minutesToLabel,
  nowMinutesUtc,
  todayStrUtc
} from '../utils/dates.js';

// Pure slot generation. Given a doctor schedule and the set of already booked
// start minutes for a calendar date, it expands the working window into
// fixed-length slots and marks availability. No database or clock access
// happens here, which keeps booking logic easy to test and reason about.

export function isWorkDay(schedule, dateStr) {
  return isValidDateStr(dateStr) && schedule.workDays.includes(dayOfWeekUtc(dateStr));
}

export function generateDaySlots(schedule, bookedStartMinutes = [], fromMinute = 0) {
  const { startMinute, endMinute, slotMinutes } = schedule;
  const booked = new Set(bookedStartMinutes);
  const slots = [];

  for (let start = startMinute; start + slotMinutes <= endMinute; start += slotMinutes) {
    slots.push({
      startMinute: start,
      endMinute: start + slotMinutes,
      label: minutesToLabel(start),
      available: start >= fromMinute && !booked.has(start)
    });
  }

  return slots;
}

// Full slot list for one date. Slots in the past are disabled when the
// requested date is today (server time, UTC).
export function slotsForDate({ schedule, dateStr, bookedStartMinutes = [], now = {} }) {
  if (!isWorkDay(schedule, dateStr)) return [];

  const today = now.todayStr ?? todayStrUtc();
  const fromMinute = dateStr === today ? (now.minutes ?? nowMinutesUtc()) : 0;

  return generateDaySlots(schedule, bookedStartMinutes, fromMinute);
}

// Booking validation: the requested start minute must land exactly on a slot
// boundary inside the working window of that week day.
export function isSlotInSchedule(schedule, dateStr, startMinute) {
  if (!isWorkDay(schedule, dateStr)) return false;

  const { startMinute: windowStart, endMinute, slotMinutes } = schedule;
  if (!Number.isInteger(startMinute)) return false;
  if (startMinute < windowStart || startMinute + slotMinutes > endMinute) return false;

  return (startMinute - windowStart) % slotMinutes === 0;
}

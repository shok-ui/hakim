import { env } from '../config/env.js';

// Working hours shared by all doctors (24h clock). Slots are aligned to the
// SLOT_MINUTES grid. All times use the server timezone, which should match the
// clinic timezone in a single-region deployment.
export const WORKING_HOURS = { startHour: 9, endHour: 17 };

const MS_PER_MINUTE = 60_000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// All bookable slot times for a calendar day, in ascending order. Slots in the
// past (relative to `now`) are never offered.
export function generateCandidateSlots(day, now = new Date()) {
  const slots = [];
  const base = startOfDay(day);
  for (
    let minutes = WORKING_HOURS.startHour * 60;
    minutes < WORKING_HOURS.endHour * 60;
    minutes += env.slotMinutes
  ) {
    const slot = new Date(base.getTime() + minutes * MS_PER_MINUTE);
    if (slot.getTime() <= now.getTime()) continue;
    slots.push(slot);
  }
  return slots;
}

// A start time is bookable when it is aligned to the slot grid, inside
// working hours, on a weekday, in the future and within the booking horizon.
export function isBookableSlot(startAt, now = new Date()) {
  const slot = new Date(startAt);
  if (Number.isNaN(slot.getTime())) return { ok: false, reason: 'Invalid date' };

  const base = startOfDay(slot);
  const minutesFromMidnight = (slot.getTime() - base.getTime()) / MS_PER_MINUTE;
  const { startHour, endHour } = WORKING_HOURS;

  if (minutesFromMidnight % env.slotMinutes !== 0) {
    return { ok: false, reason: `Slots must be aligned to ${env.slotMinutes} minutes` };
  }
  if (minutesFromMidnight < startHour * 60 || minutesFromMidnight >= endHour * 60) {
    return { ok: false, reason: `Working hours are ${startHour}:00-${endHour}:00` };
  }

  const weekday = slot.getDay(); // 0 = Sunday ... 6 = Saturday
  if (weekday === 0 || weekday === 6) {
    return { ok: false, reason: 'Appointments are available Monday to Friday' };
  }

  if (slot.getTime() <= now.getTime()) {
    return { ok: false, reason: 'That slot is in the past' };
  }

  const horizon = now.getTime() + env.maxBookingDaysAhead * 24 * 60 * 60 * 1000;
  if (slot.getTime() > horizon) {
    return { ok: false, reason: `Bookings open at most ${env.maxBookingDaysAhead} days ahead` };
  }

  return { ok: true };
}

export function slotEnd(startAt) {
  return new Date(new Date(startAt).getTime() + env.slotMinutes * MS_PER_MINUTE);
}

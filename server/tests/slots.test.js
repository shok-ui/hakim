import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDaySlots, isSlotInSchedule, isWorkDay, slotsForDate } from '../src/services/slots.js';

const MON_FRI = [1, 2, 3, 4, 5];
const schedule = { workDays: MON_FRI, startMinute: 540, endMinute: 1020, slotMinutes: 30 };

test('generateDaySlots expands the working window into slots', () => {
  const slots = generateDaySlots(schedule, [], 0);
  assert.equal(slots.length, 16); // (1020 - 540) / 30
  assert.equal(slots[0].label, '09:00');
  assert.equal(slots[0].startMinute, 540);
  assert.equal(slots[0].endMinute, 570);
  assert.ok(slots.every((slot) => slot.available === true));
});

test('generateDaySlots marks booked starts unavailable', () => {
  const slots = generateDaySlots(schedule, [540, 690], 0);
  const booked = slots.filter((slot) => !slot.available).map((slot) => slot.startMinute);
  assert.deepEqual(booked, [540, 690]);
  assert.equal(slots.find((slot) => slot.startMinute === 570).available, true);
});

test('generateDaySlots respects the fromMinute cutoff', () => {
  const slots = generateDaySlots(schedule, [], 660); // 11:00
  const firstAvailable = slots.find((slot) => slot.available);
  assert.equal(firstAvailable.startMinute, 660);
  assert.ok(slots.filter((slot) => !slot.available).every((slot) => slot.startMinute < 660));
});

test('generateDaySlots ignores partial slots at the end of the window', () => {
  const oddSchedule = { ...schedule, endMinute: 1010 }; // window not divisible by 30
  const slots = generateDaySlots(oddSchedule, [], 0);
  assert.ok(slots.every((slot) => slot.endMinute <= 1010));
  assert.equal(slots.length, 15); // last full slot ends at 1010? 540 + 15*30 = 990 + 30 = 1010
});

test('isWorkDay uses the UTC week day of the date', () => {
  assert.equal(isWorkDay(schedule, '2024-01-01'), true); // Monday
  assert.equal(isWorkDay(schedule, '2024-01-06'), false); // Saturday
  assert.equal(isWorkDay(schedule, '2024-01-07'), false); // Sunday
  assert.equal(isWorkDay(schedule, 'not-a-date'), false);
});

test('slotsForDate disables past slots on today', () => {
  const now = { todayStr: '2024-01-01', minutes: 660 }; // 11:00
  const slots = slotsForDate({ schedule, dateStr: '2024-01-01', bookedStartMinutes: [], now });
  const firstAvailable = slots.find((slot) => slot.available);
  assert.equal(firstAvailable.startMinute, 660);
});

test('slotsForDate keeps future days fully open', () => {
  const now = { todayStr: '2024-01-01', minutes: 1000 };
  const slots = slotsForDate({ schedule, dateStr: '2024-01-03', bookedStartMinutes: [], now });
  assert.equal(slots.length, 16);
  assert.ok(slots.every((slot) => slot.available === true));
});

test('slotsForDate returns an empty list on non-working days', () => {
  const slots = slotsForDate({ schedule, dateStr: '2024-01-06', bookedStartMinutes: [] });
  assert.deepEqual(slots, []);
});

test('isSlotInSchedule accepts only aligned boundaries inside the window', () => {
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 540), true);
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 990), true);
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 539), false);
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 1000), false);
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 1020), false);
  assert.equal(isSlotInSchedule(schedule, '2024-01-06', 540), false);
  assert.equal(isSlotInSchedule(schedule, '2024-01-01', 570.5), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCandidateSlots, isBookableSlot, slotEnd } from '../src/services/slotService.js';

// Fixed "now" (a Monday late morning) keeps the tests deterministic.
const MONDAY_10AM = new Date('2026-01-05T10:00:00');

test('generates 16 aligned slots for a full working day', () => {
  const tuesday = new Date('2026-01-06T00:00:00');
  const yesterday = new Date('2026-01-05T08:00:00');
  const slots = generateCandidateSlots(tuesday, yesterday);

  assert.equal(slots.length, 16);
  assert.equal(slots[0].getHours(), 9);
  assert.equal(slots[0].getMinutes(), 0);
  assert.equal(slots[slots.length - 1].getMinutes(), 30);
});

test('never offers slots in the past', () => {
  const slots = generateCandidateSlots(MONDAY_10AM, MONDAY_10AM);
  for (const slot of slots) {
    assert.ok(slot.getTime() > MONDAY_10AM.getTime());
  }
  assert.equal(slots[0].getHours(), 10); // 09:00 and 09:30 dropped
});

test('rejects misaligned, out-of-hours and weekend slots', () => {
  assert.equal(isBookableSlot(new Date('2026-01-06T09:10:00'), MONDAY_10AM).ok, false);
  assert.equal(isBookableSlot(new Date('2026-01-06T07:00:00'), MONDAY_10AM).ok, false);
  assert.equal(isBookableSlot(new Date('2026-01-06T17:30:00'), MONDAY_10AM).ok, false);
  assert.equal(isBookableSlot(new Date('2026-01-10T09:00:00'), MONDAY_10AM).ok, false); // Saturday
  assert.equal(isBookableSlot(new Date('2026-01-11T09:00:00'), MONDAY_10AM).ok, false); // Sunday
  assert.equal(isBookableSlot('not-a-date', MONDAY_10AM).ok, false);
  assert.equal(isBookableSlot(new Date('2026-01-05T09:00:00'), MONDAY_10AM).ok, false); // past
});

test('accepts a valid future slot and computes its end time', () => {
  const slot = new Date('2026-01-06T11:30:00');
  const check = isBookableSlot(slot, MONDAY_10AM);
  assert.equal(check.ok, true);

  const end = slotEnd(slot);
  assert.equal(end.getHours(), 12);
  assert.equal(end.getMinutes(), 0);
});

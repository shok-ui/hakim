import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dayOfWeekUtc,
  isValidDateStr,
  labelToMinutes,
  minutesToLabel,
  nowMinutesUtc,
  todayStrUtc
} from '../src/utils/dates.js';

test('minutesToLabel formats minutes as zero-padded 24h time', () => {
  assert.equal(minutesToLabel(0), '00:00');
  assert.equal(minutesToLabel(540), '09:00');
  assert.equal(minutesToLabel(545), '09:05');
  assert.equal(minutesToLabel(1050), '17:30');
  assert.equal(minutesToLabel(1439), '23:59');
});

test('labelToMinutes parses valid labels and rejects malformed input', () => {
  assert.equal(labelToMinutes('09:00'), 540);
  assert.equal(labelToMinutes('9:05'), 545);
  assert.equal(labelToMinutes('23:59'), 1439);
  assert.equal(labelToMinutes('24:00'), null);
  assert.equal(labelToMinutes('09:60'), null);
  assert.equal(labelToMinutes('nine oclock'), null);
  assert.equal(labelToMinutes(''), null);
  assert.equal(labelToMinutes(undefined), null);
});

test('isValidDateStr accepts only real ISO calendar dates', () => {
  assert.equal(isValidDateStr('2024-01-01'), true);
  assert.equal(isValidDateStr('2026-02-28'), true);
  assert.equal(isValidDateStr('2026-02-30'), false);
  assert.equal(isValidDateStr('2023-02-29'), false);
  assert.equal(isValidDateStr('01-01-2024'), false);
  assert.equal(isValidDateStr('2024-1-1'), false);
  assert.equal(isValidDateStr(''), false);
  assert.equal(isValidDateStr(null), false);
});

test('dayOfWeekUtc returns the UTC week day', () => {
  // 2024-01-01 was a Monday (1), 2024-01-07 the following Sunday (0).
  assert.equal(dayOfWeekUtc('2024-01-01'), 1);
  assert.equal(dayOfWeekUtc('2024-01-07'), 0);
  assert.equal(dayOfWeekUtc('2024-01-05'), 5);
});

test('todayStrUtc and nowMinutesUtc return sane values', () => {
  const today = todayStrUtc();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  const minutes = nowMinutesUtc();
  assert.ok(minutes >= 0 && minutes < 1440);
});

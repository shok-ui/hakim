import test from 'node:test';
import assert from 'node:assert/strict';
import { validators } from '../src/utils/validate.js';

test('email validator accepts normal addresses', () => {
  assert.equal(validators.email('user@example.com'), true);
  assert.equal(validators.email('first.last@sub.domain.org'), true);
  assert.equal(validators.email('bad@@example'), false);
  assert.equal(validators.email('missing-at-sign.com'), false);
  assert.equal(validators.email(12345), false);
});

test('password validator enforces length and complexity', () => {
  assert.equal(validators.password('Str0ngPass'), true);
  assert.equal(validators.password('Admin@12345'), true);
  assert.equal(validators.password('short1'), false); // too short
  assert.equal(validators.password('nodigits'), false); // no digits
  assert.equal(validators.password('12345678'), false); // no letters
  assert.equal(validators.password(undefined), false);
});

test('name validator trims and bounds input', () => {
  assert.equal(validators.name('  Ada Lovelace  '), true);
  assert.equal(validators.name('a'), false);
  assert.equal(validators.name('x'.repeat(81)), false);
});

test('objectId validator checks the 24-hex format', () => {
  assert.equal(validators.objectId('65a1f2b3c4d5e6f7a8b9c0d1'), true);
  assert.equal(validators.objectId('not-an-id'), false);
});

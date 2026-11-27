#!/usr/bin/env node
// Locale parity gate: every locale must expose exactly the same key set as
// the English dictionary (the source of truth). Also verifies that every
// {param} used by a non-English string exists in its English counterpart.
// Run: node scripts/check-locales.mjs
import { en } from '../src/i18n/locales/en.js';
import { fa } from '../src/i18n/locales/fa.js';

const LOCALES = { en, fa };

const params = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
const enKeys = Object.keys(en).sort();

let failed = false;

for (const [code, dict] of Object.entries(LOCALES)) {
  const keys = Object.keys(dict).sort();

  const missing = enKeys.filter((k) => !(k in dict));
  const extra = keys.filter((k) => !(k in en));

  if (missing.length) {
    failed = true;
    console.error(`[${code}] missing keys: ${missing.join(', ')}`);
  }
  if (extra.length) {
    failed = true;
    console.error(`[${code}] unknown keys: ${extra.join(', ')}`);
  }

  // Placeholder mismatch detection, e.g. fa forgets a {name}.
  for (const key of keys.filter((k) => k in en)) {
    const a = new Set(params(en[key]));
    const b = new Set(params(dict[key]));
    const diff = [...a].filter((p) => !b.has(p)).concat([...b].filter((p) => !a.has(p)));
    if (diff.length) {
      failed = true;
      console.error(`[${code}] "${key}" placeholder mismatch: ${diff.join(', ')}`);
    }
  }
}

const total = enKeys.length;
if (failed) {
  console.error('Locale check FAILED.');
  process.exit(1);
}
console.log(`Locale check passed: ${total} keys x ${Object.keys(LOCALES).length} locales.`);

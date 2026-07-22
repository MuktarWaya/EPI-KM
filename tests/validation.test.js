import assert from 'node:assert';
import test from 'node:test';

test('Phone Validation Test', () => {
  const phone = '081-234-5678';
  const cleaned = phone.replace(/[^0-9]/g, '');
  assert.strictEqual(cleaned, '0812345678');
});

test('Age Calculation Test', () => {
  const birth = new Date('2024-01-01');
  const today = new Date('2026-07-01');
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  assert.strictEqual(months, 30);
});

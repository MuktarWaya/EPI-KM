import assert from 'node:assert';
import test from 'node:test';

test('KS Model Flag Routing Test', () => {
  const answers = { q5: 4, q6: 5, q7: 2, q8: 1 };
  const flagSafety = answers.q5 >= 4 ? 'YES' : 'NO';
  const flagReligious = answers.q6 >= 4 ? 'YES' : 'NO';
  const flagAccess = answers.q7 >= 4 ? 'YES' : 'NO';

  assert.strictEqual(flagSafety, 'YES');
  assert.strictEqual(flagReligious, 'YES');
  assert.strictEqual(flagAccess, 'NO');
});

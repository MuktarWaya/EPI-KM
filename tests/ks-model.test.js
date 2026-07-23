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

test('KS Model Score & 4-Tier Non-Stigmatizing Classification Test', () => {
  function calculateKsScoreAndGroup(q1, q2, q3, q4, q5, q6, q7, q8) {
    const scorePos = (q1 - 3) + (q2 - 3) + (q3 - 3) + (q4 - 3);
    const scoreNeg = (3 - q5) + (3 - q6) + (3 - q7) + (3 - q8);
    const rawScore = scorePos + scoreNeg;
    const totalScore = Math.max(-15, Math.min(15, rawScore));

    let groupNum = 1;
    if (totalScore >= 7) groupNum = 1;
    else if (totalScore >= 0) groupNum = 2;
    else if (totalScore >= -7) groupNum = 3;
    else groupNum = 4;

    return { score: totalScore, groupNum };
  }

  // Max score (+15) -> Group 1
  const resMax = calculateKsScoreAndGroup(5, 5, 5, 5, 1, 1, 1, 1);
  assert.strictEqual(resMax.score, 15);
  assert.strictEqual(resMax.groupNum, 1);

  // Moderate positive score (+4) -> Group 2 (range 0 to +6)
  const resGroup2 = calculateKsScoreAndGroup(4, 4, 3, 3, 2, 2, 3, 3);
  assert.strictEqual(resGroup2.score, 4);
  assert.strictEqual(resGroup2.groupNum, 2);

  // Moderate negative score (-4) -> Group 3
  const resGroup3 = calculateKsScoreAndGroup(2, 2, 3, 3, 4, 4, 3, 3);
  assert.strictEqual(resGroup3.score, -4);
  assert.strictEqual(resGroup3.groupNum, 3);

  // Min score (-15) -> Group 4
  const resMin = calculateKsScoreAndGroup(1, 1, 1, 1, 5, 5, 5, 5);
  assert.strictEqual(resMin.score, -15);
  assert.strictEqual(resMin.groupNum, 4);
});

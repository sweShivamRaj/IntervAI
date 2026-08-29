const assert = require('node:assert/strict');
const {
  calculateRecentAverage,
  computeAdaptiveDecision,
  computeNextDifficulty,
  getTopicPerformance,
  selectNextTopic,
} = require('../services/adaptiveService');

assert.equal(computeNextDifficulty(2, [85]), 3, '80+ should increase difficulty');
assert.equal(computeNextDifficulty(2, [90]), 3, '90 should increase difficulty');
assert.equal(computeNextDifficulty(2, [85]), 3, '85 should increase difficulty');
assert.equal(computeNextDifficulty(2, [50, 79]), 2, '50-79 average should maintain difficulty');
assert.equal(computeNextDifficulty(2, [70]), 2, '70 should maintain difficulty');
assert.equal(computeNextDifficulty(2, [49]), 1, 'below 50 should decrease difficulty');
assert.equal(computeNextDifficulty(2, [45]), 1, '45 should decrease difficulty');
assert.equal(computeNextDifficulty(2, [20]), 1, '20 should decrease difficulty');

assert.equal(computeNextDifficulty(1, [10]), 1, 'difficulty must not go below Easy');
assert.equal(computeNextDifficulty(3, [100]), 3, 'difficulty must not go above Hard');

const multipleRecentScores = [20, 90, 90, 60];
assert.equal(calculateRecentAverage(multipleRecentScores), 80, 'only the last 3 scores are averaged');
assert.equal(computeNextDifficulty(2, multipleRecentScores), 3);

const topicAnswers = [
  { topic: 'DSA', score: 40, evaluationStatus: 'completed' },
  { topic: 'JavaScript', score: 90, evaluationStatus: 'completed' },
  { topic: 'DSA', score: 45, evaluationStatus: 'completed' },
];
assert.equal(getTopicPerformance(topicAnswers, 'DSA').average, 42.5);
assert.equal(selectNextTopic({
  skills: ['JavaScript', 'DSA'],
  order: 3,
  answers: topicAnswers,
}), 'DSA', 'weak topics should receive additional questions');

const documentedProgression = computeAdaptiveDecision({
  currentDifficulty: 3,
  nextTopic: 'JavaScript',
  answeredTopic: 'JavaScript',
  answers: [
    { topic: 'JavaScript', score: 90, evaluationStatus: 'completed' },
    { topic: 'JavaScript', score: 85, evaluationStatus: 'completed' },
    { topic: 'JavaScript', score: 40, evaluationStatus: 'completed' },
  ],
  topicDifficulties: [{ topic: 'JavaScript', difficulty: 3 }],
});
assert.equal(documentedProgression.recentAverage, 215 / 3);
assert.equal(documentedProgression.nextDifficulty, 2, 'poor latest Hard answer should recover to Medium');

const topicIsolation = computeAdaptiveDecision({
  currentDifficulty: 2,
  nextTopic: 'JavaScript',
  answeredTopic: 'DSA',
  answers: [
    { topic: 'DSA', score: 40, evaluationStatus: 'completed' },
    { topic: 'JavaScript', score: 90, evaluationStatus: 'completed' },
  ],
  topicDifficulties: [
    { topic: 'DSA', difficulty: 2 },
    { topic: 'JavaScript', difficulty: 2 },
  ],
});
assert.equal(topicIsolation.nextDifficulty, 3, 'strong JavaScript should not be reduced by weak DSA');

console.log('Adaptive service unit tests passed.');

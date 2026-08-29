const assert = require('node:assert/strict');
const {
  buildReportAnalytics,
  buildRecommendedTopics,
} = require('../services/analyticsService');
const config = require('../config/env');
const {
  generateOverallFeedback,
  validateReportResponse,
} = require('../services/reportService');

const questions = [
  { _id: 'q1', order: 1, topic: 'JavaScript', difficulty: 1, questionText: 'Explain closures.' },
  { _id: 'q2', order: 2, topic: 'DSA', difficulty: 2, questionText: 'Explain binary search.' },
  { _id: 'q3', order: 3, topic: 'DSA', difficulty: 3, questionText: 'Design a graph traversal.' },
];

const answers = [
  {
    questionId: 'q1',
    score: 90,
    evaluation: { strengths: ['Clear explanation'], weaknesses: [] },
    evaluationStatus: 'completed',
  },
  {
    questionId: 'q2',
    score: 60,
    evaluation: { strengths: [], weaknesses: ['Explain complexity'], improvementSuggestion: 'Discuss O(log n).' },
    evaluationStatus: 'completed',
  },
  {
    questionId: 'q3',
    score: 40,
    evaluation: { strengths: [], weaknesses: ['Needs a concrete example'] },
    evaluationStatus: 'failed',
  },
];

const report = buildReportAnalytics({
  interview: {
    scoreAverage: 63.33,
    questionCount: 3,
    skills: ['JavaScript', 'DSA'],
  },
  questions,
  answers,
});

assert.equal(report.overallScore, 63.33);
assert.equal(report.averageScore, 63.33);
assert.equal(report.questionCount, 3);
assert.deepEqual(report.skillAnalysis, [
  { skill: 'JavaScript', attempts: 1, averageScore: 90, bestScore: 90 },
  { skill: 'DSA', attempts: 2, averageScore: 50, bestScore: 60 },
]);
assert.equal(report.questionAnalysis[2].difficultyLabel, 'Hard');
assert.equal(report.questionAnalysis[2].score, 40);
assert.deepEqual(report.difficultyProgression.map((item) => item.difficulty), [1, 2, 3]);
assert.deepEqual(report.recommendedTopics, ['DSA']);
assert.ok(report.strengths.includes('Clear explanation'));
assert.ok(report.weaknesses.includes('Explain complexity'));

const emptyReport = buildReportAnalytics({
  interview: { scoreAverage: null, questionCount: 1, skills: ['SQL'] },
  questions: [{ _id: 'empty', order: 1, topic: 'SQL', difficulty: 2, questionText: 'Explain joins.' }],
  answers: [],
});
assert.equal(emptyReport.overallScore, 0);
assert.equal(emptyReport.questionAnalysis[0].score, null);
assert.deepEqual(emptyReport.recommendedTopics, ['SQL']);
assert.deepEqual(buildRecommendedTopics([{ skill: 'SQL', averageScore: 45 }], ['SQL']), ['SQL']);

async function testOverallFeedback() {
  const originalProvider = config.ai.provider;
  config.ai.provider = 'mock';
  const mockFeedback = await generateOverallFeedback({ jobRole: 'Backend Developer', overallScore: 85 });
  assert.equal(mockFeedback.status, 'completed');
  assert.match(mockFeedback.feedback, /Strong overall performance/);

  config.ai.provider = 'fallback';
  const fallbackFeedback = await generateOverallFeedback({ jobRole: 'Backend Developer', overallScore: 40 });
  assert.equal(fallbackFeedback.status, 'failed');
  assert.equal(typeof fallbackFeedback.feedback, 'string');
  assert.equal(typeof fallbackFeedback.safeMessage, 'string');
  assert.equal(validateReportResponse({ feedback: 'valid' }).valid, true);
  assert.equal(validateReportResponse({ feedback: '' }).valid, false);
  config.ai.provider = originalProvider;
}

testOverallFeedback()
  .then(() => console.log('Phase 8 analytics unit tests passed.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

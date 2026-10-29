const assert = require('node:assert/strict');
const config = require('../config/env');
const {
  SAFE_FAILURE_MESSAGE,
  buildFallbackResult,
  calculateWeightedScore,
  evaluateCandidateAnswer,
  validateEvaluationResponse,
} = require('../services/evaluationService');
const { heuristicEvaluate } = require('../data/fallbackQuestions');

const context = {
  question: {
    questionText: 'Explain how the Node.js event loop supports non-blocking I/O.',
    topic: 'Node.js',
    difficulty: 2,
  },
  expectedConcepts: ['event loop', 'non-blocking', 'concurrency'],
  candidateRole: 'Backend Developer',
  topic: 'Node.js',
  difficulty: 2,
};

const originalConfig = {
  provider: config.ai.provider,
  apiKey: config.ai.apiKey,
  maxRetries: config.ai.maxRetries,
  baseUrl: config.ai.baseUrl,
  timeoutMs: config.ai.timeoutMs,
};
const originalFetch = global.fetch;

async function run() {
  config.ai.provider = 'mock';
  config.ai.apiKey = '';

  const strong = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: [
      'The event loop coordinates JavaScript execution with the Node.js runtime.',
      'It uses the call stack and task queues to schedule callbacks after non-blocking I/O completes.',
      'This lets Node.js handle concurrency without creating one thread per request, while CPU-heavy work should move to worker threads.',
    ].join(' '),
  });
  assert.equal(strong.status, 'completed');
  assert.ok(strong.score >= 70, `expected strong score, got ${strong.score}`);
  assert.equal(
    strong.score,
    calculateWeightedScore(strong.evaluation),
    'final score must use the backend weighting formula'
  );

  const weak = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'It runs JavaScript code and handles requests.',
  });
  assert.equal(weak.status, 'completed');
  assert.ok(weak.score < strong.score, 'weak answer should score below strong answer');

  config.ai.provider = 'openai';
  config.ai.apiKey = 'test-key';
  config.ai.maxRetries = 0;
  let providerRequest;
  global.fetch = async (_url, options) => {
    providerRequest = JSON.parse(options.body);
    return {
      ok: true,
      async json() {
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                correctness: 90,
                relevance: 80,
                technicalDepth: 70,
                clarity: 60,
                completeness: 50,
                feedback: 'Good technical explanation.',
                strengths: ['Correct event loop explanation'],
                weaknesses: ['Could add an operational example'],
                improvementSuggestion: 'Add a production monitoring example.',
                nextFocus: 'Explain an operational example.',
                keyConceptsCovered: ['event loop', 'non-blocking'],
                keyConceptsMissed: ['concurrency'],
              }),
            },
          }],
        };
      },
    };
  };
  const providerSuccess = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'The event loop schedules callbacks after asynchronous I/O completes.',
  });
  assert.equal(providerSuccess.status, 'completed');
  assert.equal(providerSuccess.provider, 'openai');
  assert.equal(providerSuccess.score, 77, 'weighted score must be calculated on the backend');
  assert.equal(providerRequest.response_format.type, 'json_schema');

  config.ai.provider = 'mock';
  config.ai.apiKey = '';

  await assert.rejects(
    () => evaluateCandidateAnswer({ ...context, candidateAnswer: '   ' }),
    /Candidate answer is required/
  );

  config.ai.provider = 'openai';
  config.ai.apiKey = 'test-key';
  config.ai.maxRetries = 1;
  global.fetch = async () => {
    throw new Error('simulated provider outage');
  };
  const failed = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'The event loop schedules callbacks after I/O completes.',
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.safeMessage, SAFE_FAILURE_MESSAGE);
  assert.ok(Number.isFinite(failed.score), 'fallback should preserve a usable score');
  assert.equal(failed.scoringMethod, 'expected-concept-coverage');
  assert.equal(failed.evaluation.clarity, null, 'fallback must not claim an AI clarity score');
  assert.ok(failed.score >= 0 && failed.score <= 100);
  const noRubricFallback = buildFallbackResult({ candidateAnswer: 'A long answer without a rubric.' });
  assert.equal(noRubricFallback.score, null);
  assert.equal(noRubricFallback.scoringMethod, 'unavailable');

  config.ai.maxRetries = 0;
  const originalWarn = console.warn;
  let providerLog = '';
  console.warn = (...args) => { providerLog += args.join(' '); };
  global.fetch = async () => ({
    ok: false,
    status: 401,
    async json() {
      return { error: { code: 'invalid_api_key', message: 'The API key is invalid.' } };
    },
  });
  const invalidKey = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'The event loop schedules callbacks after I/O completes.',
  });
  console.warn = originalWarn;
  assert.equal(invalidKey.status, 'failed');
  assert.match(providerLog, /HTTP 401.*invalid_api_key/);
  assert.doesNotMatch(invalidKey.safeMessage, /invalid_api_key|invalid API key/i);

  config.ai.maxRetries = 0;
  config.ai.timeoutMs = 1;
  global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      const timeoutError = new Error('The operation was aborted.');
      timeoutError.name = 'AbortError';
      reject(timeoutError);
    }, { once: true });
  });
  const timedOut = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'The event loop handles asynchronous callbacks after I/O completes.',
  });
  assert.equal(timedOut.status, 'failed');
  assert.equal(timedOut.safeMessage, SAFE_FAILURE_MESSAGE, 'timeout should use the safe fallback message');

  config.ai.maxRetries = 1;
  let invalidAttempts = 0;
  global.fetch = async () => {
    invalidAttempts += 1;
    return {
      ok: true,
      async json() {
        return {
          choices: [{ message: { content: JSON.stringify({ correctness: 101 }) } }],
        };
      },
    };
  };
  const invalid = await evaluateCandidateAnswer({
    ...context,
    candidateAnswer: 'The event loop handles asynchronous callbacks.',
  });
  assert.equal(invalid.status, 'failed');
  assert.equal(invalidAttempts, 2, 'invalid output should be retried once');

  const invalidShape = validateEvaluationResponse({
    correctness: 101,
    relevance: 50,
    technicalDepth: 50,
    clarity: 50,
    completeness: 50,
    feedback: 'feedback',
    strengths: [],
    weaknesses: [],
    improvementSuggestion: 'suggestion',
    nextFocus: 'next step',
    keyConceptsCovered: [],
    keyConceptsMissed: [],
  });
  assert.equal(invalidShape.valid, false);

  const rubricEstimate = heuristicEvaluate({
    answer: 'event loop and non-blocking are covered; this answer is deliberately long, but length cannot add rubric points.',
    expectedConcepts: ['event loop', 'non-blocking', 'concurrency', 'worker threads'],
  });
  assert.equal(rubricEstimate.score, 50, 'fallback score must equal concept coverage and ignore answer length');
  assert.deepEqual(rubricEstimate.matchedConcepts, ['event loop', 'non-blocking']);
  assert.deepEqual(rubricEstimate.missedConcepts, ['concurrency', 'worker threads']);
  assert.equal(heuristicEvaluate({ answer: 'long answer '.repeat(100), expectedConcepts: [] }).score, null);

  console.log('Phase 6 evaluation service tests passed.');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    config.ai.provider = originalConfig.provider;
    config.ai.apiKey = originalConfig.apiKey;
    config.ai.maxRetries = originalConfig.maxRetries;
    config.ai.baseUrl = originalConfig.baseUrl;
    config.ai.timeoutMs = originalConfig.timeoutMs;
    global.fetch = originalFetch;
  });

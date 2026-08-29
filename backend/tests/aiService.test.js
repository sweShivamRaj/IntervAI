const assert = require('node:assert/strict');

const config = require('../config/env');
const {
  generateInterviewQuestion,
  validateInterviewQuestion,
} = require('../services/aiService');

const original = {
  provider: config.ai.provider,
  apiKey: config.ai.apiKey,
  maxRetries: config.ai.maxRetries,
  timeoutMs: config.ai.timeoutMs,
  baseUrl: config.ai.baseUrl,
};
const originalFetch = global.fetch;

const context = {
  jobRole: 'Backend Developer',
  interviewType: 'technical',
  selectedSkills: ['Node.js'],
  currentTopic: 'Node.js',
  currentDifficulty: 2,
};

async function run() {
  config.ai.provider = 'mock';
  config.ai.apiKey = '';
  const valid = await generateInterviewQuestion(context);
  assert.equal(typeof valid.question, 'string');
  assert.equal(valid.topic, 'Node.js');
  assert.equal(valid.difficulty, 'medium');
  assert.ok(Array.isArray(valid.expectedConcepts));
  assert.doesNotMatch(valid.question, /interview\s+question\s+\d+/i);

  config.ai.provider = 'fallback';
  const fallback = await generateInterviewQuestion(context);
  assert.equal(typeof fallback.question, 'string');
  assert.doesNotMatch(fallback.question, /interview\s+question\s+\d+/i);

  const invalid = validateInterviewQuestion({
    question: 'Too short',
    topic: 'Node.js',
    difficulty: 'medium',
    type: 'conceptual',
    expectedConcepts: ['one', 'two'],
  }, context);
  assert.equal(invalid.valid, false, 'invalid AI questions must be rejected');

  config.ai.provider = 'openai';
  config.ai.apiKey = 'test-key';
  config.ai.maxRetries = 0;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { choices: [{ message: { content: JSON.stringify({ question: 'invalid' }) } }] };
    },
  });
  const invalidResponse = await generateInterviewQuestion(context);
  assert.equal(typeof invalidResponse.question, 'string');
  assert.equal(invalidResponse.topic, 'Node.js');

  config.ai.timeoutMs = 1;
  global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      const error = new Error('The operation was aborted.');
      error.name = 'AbortError';
      reject(error);
    }, { once: true });
  });
  const timedOut = await generateInterviewQuestion(context);
  assert.equal(typeof timedOut.question, 'string');
  assert.equal(timedOut.topic, 'Node.js');

  global.fetch = async () => {
    throw new Error('provider unavailable');
  };
  const unavailable = await generateInterviewQuestion(context);
  assert.equal(typeof unavailable.question, 'string');
  assert.equal(unavailable.topic, 'Node.js');

  console.log('AI question validation, timeout, unavailable-provider, and fallback tests passed.');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    config.ai.provider = original.provider;
    config.ai.apiKey = original.apiKey;
    config.ai.maxRetries = original.maxRetries;
    config.ai.timeoutMs = original.timeoutMs;
    config.ai.baseUrl = original.baseUrl;
    global.fetch = originalFetch;
  });

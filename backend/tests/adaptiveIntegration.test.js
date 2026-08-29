const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://localhost:5013/api';

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json();
  return { status: response.status, body };
}

function authOptions(token, body) {
  return {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  };
}

async function run() {
  const email = `adaptive-${Date.now()}@example.com`;
  const registered = await request('/auth/register', authOptions('', {
    name: 'Adaptive Tester',
    email,
    password: 'Password123!',
  }));
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  const token = registered.body.token;

  const created = await request('/interviews', authOptions(token, {
    jobRole: 'Backend Developer',
    skills: ['Node.js'],
    questionCount: 4,
    startingDifficulty: 1,
  }));
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const interviewId = created.body.interview._id;

  const started = await request(`/interviews/${interviewId}/start`, authOptions(token));
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.currentQuestion.difficulty, 1);

  const strongAnswer = [
    'Node.js core principles include the event loop, non-blocking I/O, the call stack, task queues, and asynchronous operations.',
    'For a production use case, these concepts let a server handle many requests; CPU-heavy work can use worker threads.',
    'A good solution starts with problem diagnosis and solution design, then protects maintainability, reliability, performance, and observability.',
    'I would define an implementation approach, test edge cases, use testing and error handling, and explain trade-offs clearly.',
  ].join(' ');
  const weakAnswer = 'It runs JavaScript code.';

  let question = started.body.currentQuestion;
  const observed = [question.difficulty];
  for (const answerText of [strongAnswer, strongAnswer, weakAnswer]) {
    const submitted = await request(
      `/questions/${question._id}/answer`,
      authOptions(token, { interviewId, userAnswer: answerText })
    );
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    question = submitted.body.nextQuestion;
    observed.push(question.difficulty);
  }
  assert.deepEqual(observed, [1, 2, 3, 2], `unexpected difficulty sequence: ${observed}`);

  const final = await request(
    `/questions/${question._id}/answer`,
    authOptions(token, { interviewId, userAnswer: strongAnswer })
  );
  assert.equal(final.status, 200, JSON.stringify(final.body));
  assert.equal(final.body.completed, true);

  const report = await request(`/interviews/${interviewId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(report.status, 200, JSON.stringify(report.body));
  assert.deepEqual(
    report.body.report.difficultyProgression.map((step) => step.difficultyLabel),
    ['Easy', 'Medium', 'Hard', 'Medium']
  );

  console.log(JSON.stringify({
    interviewId,
    progression: report.body.report.difficultyProgression.map((step) => ({
      question: step.order,
      topic: step.topic,
      difficulty: step.difficultyLabel,
      score: step.score,
    })),
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://localhost:5012/api';

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
  const email = `phase6-fallback-${Date.now()}@example.com`;
  const registered = await request('/auth/register', authOptions('', {
    name: 'Phase Six Fallback Tester',
    email,
    password: 'Password123!',
  }));
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  const token = registered.body.token;

  const created = await request('/interviews', authOptions(token, {
    jobRole: 'Backend Developer',
    skills: ['Node.js'],
    questionCount: 3,
  }));
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const interviewId = created.body.interview._id;
  const started = await request(`/interviews/${interviewId}/start`, authOptions(token));
  assert.equal(started.status, 200, JSON.stringify(started.body));

  const submitted = await request(
    `/questions/${started.body.currentQuestion._id}/answer`,
    authOptions(token, {
      interviewId,
      userAnswer: 'The event loop handles callbacks after asynchronous I/O completes.',
    })
  );
  assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
  assert.equal(submitted.body.evaluation.status, 'failed');
  assert.equal(typeof submitted.body.evaluation.score, 'number');
  assert.match(submitted.body.evaluation.safeMessage, /temporarily unavailable/);
  assert.ok(submitted.body.nextQuestion, 'interview should continue after provider failure');

  const detail = await request(`/interviews/${interviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(detail.status, 200, JSON.stringify(detail.body));
  assert.equal(detail.body.answers.length, 1);
  assert.equal(detail.body.answers[0].evaluationStatus, 'failed');
  assert.equal(detail.body.answers[0].userAnswer, 'The event loop handles callbacks after asynchronous I/O completes.');

  console.log(JSON.stringify({
    interviewId,
    status: submitted.body.evaluation.status,
    answerSaved: detail.body.answers.length === 1,
    interviewContinued: Boolean(submitted.body.nextQuestion),
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

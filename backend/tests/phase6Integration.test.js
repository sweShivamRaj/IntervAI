const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://localhost:5011/api';

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
  const email = `phase6-${Date.now()}@example.com`;
  const registered = await request('/auth/register', authOptions('', {
    name: 'Phase Six Tester',
    email,
    password: 'Password123!',
  }));
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  const token = registered.body.token;

  const created = await request('/interviews', authOptions(token, {
    jobRole: 'Backend Developer',
    skills: ['Node.js'],
    questionCount: 3,
    startingDifficulty: 2,
  }));
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const interviewId = created.body.interview._id;

  const started = await request(`/interviews/${interviewId}/start`, authOptions(token));
  assert.equal(started.status, 200, JSON.stringify(started.body));
  const firstQuestion = started.body.currentQuestion;
  assert.ok(firstQuestion);
  assert.equal('expectedConcepts' in firstQuestion, false, 'expected concepts leaked');

  const empty = await request(
    `/questions/${firstQuestion._id}/answer`,
    authOptions(token, { interviewId, userAnswer: '   ' })
  );
  assert.equal(empty.status, 400, JSON.stringify(empty.body));

  const strongAnswer = [
    'Node.js uses the event loop, call stack, and task queues to coordinate non-blocking I/O.',
    'This supports concurrency without a thread per request, while CPU-heavy work can use worker threads.',
    'In production I would monitor latency and handle errors carefully.',
  ].join(' ');
  const firstAnswer = await request(
    `/questions/${firstQuestion._id}/answer`,
    authOptions(token, { interviewId, userAnswer: strongAnswer, score: 0 })
  );
  assert.equal(firstAnswer.status, 200, JSON.stringify(firstAnswer.body));
  const evaluation = firstAnswer.body.evaluation;
  assert.equal(evaluation.status, 'completed');
  assert.equal(typeof evaluation.score, 'number');
  assert.equal(firstAnswer.body.answer.score, evaluation.score);
  for (const field of ['correctness', 'relevance', 'technicalDepth', 'clarity', 'completeness']) {
    assert.equal(typeof evaluation[field], 'number', `${field} missing`);
  }
  assert.equal(typeof evaluation.feedback, 'string');
  assert.ok(Array.isArray(evaluation.strengths));
  assert.equal(typeof evaluation.improvementSuggestion, 'string');

  const duplicate = await request(
    `/questions/${firstQuestion._id}/answer`,
    authOptions(token, { interviewId, userAnswer: 'second submission' })
  );
  assert.equal(duplicate.status, 400, JSON.stringify(duplicate.body));

  let nextQuestion = firstAnswer.body.nextQuestion;
  for (let order = 2; order <= 3; order += 1) {
    const submitted = await request(
      `/questions/${nextQuestion._id}/answer`,
      authOptions(token, {
        interviewId,
        userAnswer: order === 3
          ? 'A short answer mentioning Node.js.'
          : 'The event loop and non-blocking I/O coordinate callbacks through queues and the call stack.',
      })
    );
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    if (order < 3) nextQuestion = submitted.body.nextQuestion;
    else {
      assert.equal(submitted.body.completed, true);
      assert.ok(submitted.body.report);
    }
  }

  const report = await request(`/interviews/${interviewId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(report.status, 200, JSON.stringify(report.body));
  assert.equal(report.body.report.questions.length, 3);
  assert.equal(report.body.report.questions[0].evaluation.status, 'completed');
  assert.ok(report.body.report.questions[0].evaluation.feedback);

  console.log(JSON.stringify({
    interviewId,
    score: evaluation.score,
    emptyStatus: empty.status,
    duplicateStatus: duplicate.status,
    completed: true,
    reportQuestions: report.body.report.questions.length,
    expectedConceptsLeaked: false,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

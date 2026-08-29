const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://localhost:5018/api';

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
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

async function run() {
  const email = `phase8-${Date.now()}@example.com`;
  const registered = await request('/auth/register', authOptions('', {
    name: 'Phase Eight Tester',
    email,
    password: 'Password123!',
  }));
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  const token = registered.body.token;

  const completedCreate = await request('/interviews', authOptions(token, {
    jobRole: 'Full Stack Developer',
    skills: ['JavaScript', 'DSA'],
    questionCount: 3,
    startingDifficulty: 1,
  }));
  assert.equal(completedCreate.status, 201, JSON.stringify(completedCreate.body));
  const completedId = completedCreate.body.interview._id;

  let started = await request(`/interviews/${completedId}/start`, authOptions(token));
  assert.equal(started.status, 200, JSON.stringify(started.body));
  let question = started.body.currentQuestion;
  for (let index = 0; index < 3; index += 1) {
    const submitted = await request(
      `/questions/${question._id}/answer`,
      authOptions(token, {
        interviewId: completedId,
        userAnswer: 'JavaScript uses clear concepts, examples, complexity, and trade-offs in a practical implementation.',
      })
    );
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    if (index < 2) {
      assert.ok(submitted.body.nextQuestion);
      question = submitted.body.nextQuestion;
    } else {
      assert.equal(submitted.body.completed, true);
    }
  }

  const report = await request(`/interviews/${completedId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(report.status, 200, JSON.stringify(report.body));
  assert.equal(report.body.report.questionCount, 3);
  assert.equal(report.body.report.numberOfQuestions, 3);
  assert.equal(typeof report.body.report.overallScore, 'number');
  assert.equal(typeof report.body.report.averageScore, 'number');
  assert.equal(report.body.report.skillAnalysis.length > 0, true);
  assert.equal(report.body.report.questionAnalysis.length, 3);
  assert.equal(report.body.report.difficultyProgression.length, 3);
  assert.equal(typeof report.body.report.overallFeedback, 'string');

  const resultAlias = await request(`/interviews/${completedId}/result`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(resultAlias.status, 200, JSON.stringify(resultAlias.body));

  const secondCreate = await request('/interviews', authOptions(token, {
    jobRole: 'Data Analyst',
    skills: ['SQL'],
    questionCount: 3,
    startingDifficulty: 2,
  }));
  assert.equal(secondCreate.status, 201, JSON.stringify(secondCreate.body));
  const secondId = secondCreate.body.interview._id;
  const secondStarted = await request(`/interviews/${secondId}/start`, authOptions(token));
  assert.equal(secondStarted.status, 200, JSON.stringify(secondStarted.body));
  question = secondStarted.body.currentQuestion;
  for (let index = 0; index < 3; index += 1) {
    const submitted = await request(
      `/questions/${question._id}/answer`,
      authOptions(token, {
        interviewId: secondId,
        userAnswer: 'SQL joins, indexes, transactions, and query planning help build reliable data access.',
      })
    );
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    if (index < 2) question = submitted.body.nextQuestion;
  }

  const incompleteCreate = await request('/interviews', authOptions(token, {
    jobRole: 'Frontend Developer',
    skills: ['React'],
    questionCount: 3,
  }));
  assert.equal(incompleteCreate.status, 201, JSON.stringify(incompleteCreate.body));
  const incompleteId = incompleteCreate.body.interview._id;

  const history = await request('/interviews', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(history.status, 200, JSON.stringify(history.body));
  assert.equal(history.body.interviews.length >= 2, true);
  const historyCompleted = history.body.interviews.find((item) => String(item._id) === String(completedId));
  const historyIncomplete = history.body.interviews.find((item) => String(item._id) === String(incompleteId));
  assert.equal(historyCompleted.numberOfQuestions, 3);
  assert.equal(historyCompleted.status, 'completed');
  assert.equal(historyIncomplete.status, 'created');

  const dashboard = await request('/analytics/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(dashboard.status, 200, JSON.stringify(dashboard.body));
  assert.equal(dashboard.body.stats.totalInterviews >= 2, true);
  assert.equal(dashboard.body.stats.completedInterviews, 2);
  assert.equal(typeof dashboard.body.stats.averageScore, 'number');
  assert.equal(typeof dashboard.body.stats.bestScore, 'number');
  assert.equal(Array.isArray(dashboard.body.skillPerformance), true);
  assert.equal(dashboard.body.performanceOverTime.length, 2);
  assert.notEqual(dashboard.body.stats.strongestSkill, '—');
  assert.notEqual(dashboard.body.stats.weakestSkill, '—');

  const skills = await request('/analytics/skills', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(skills.status, 200, JSON.stringify(skills.body));
  assert.equal(skills.body.skills.length > 0, true);
  assert.equal(typeof skills.body.skills[0].attempts, 'number');
  assert.equal(typeof skills.body.skills[0].averageScore, 'number');
  assert.equal(typeof skills.body.skills[0].bestScore, 'number');

  const emptyEmail = `phase8-empty-${Date.now()}@example.com`;
  const emptyRegistered = await request('/auth/register', authOptions('', {
    name: 'Empty History Tester',
    email: emptyEmail,
    password: 'Password123!',
  }));
  assert.equal(emptyRegistered.status, 201, JSON.stringify(emptyRegistered.body));
  const emptyToken = emptyRegistered.body.token;
  const emptyDashboard = await request('/analytics/dashboard', {
    headers: { Authorization: `Bearer ${emptyToken}` },
  });
  assert.equal(emptyDashboard.status, 200, JSON.stringify(emptyDashboard.body));
  assert.equal(emptyDashboard.body.stats.totalInterviews, 0);
  assert.equal(emptyDashboard.body.stats.completedInterviews, 0);
  assert.deepEqual(emptyDashboard.body.skillPerformance, []);
  assert.deepEqual(emptyDashboard.body.performanceOverTime, []);

  console.log(JSON.stringify({
    reportQuestions: report.body.report.questionCount,
    historyItems: history.body.interviews.length,
    completedInterviews: dashboard.body.stats.completedInterviews,
    skills: skills.body.skills.map((item) => item.skill),
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

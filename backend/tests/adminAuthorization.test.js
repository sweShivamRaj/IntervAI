const assert = require('node:assert/strict');
const http = require('http');
const app = require('../app');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const config = require('../config/env');

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

function withAuth(token, extra = {}) {
  return {
    headers: { Authorization: `Bearer ${token}`, ...(extra.headers || {}) },
    ...extra,
  };
}

async function ensureAdmin() {
  let admin = await User.findOne({ email: config.admin.email });
  if (!admin) {
    admin = await User.create({
      name: 'Platform Admin',
      email: config.admin.email,
      password: config.admin.password,
      role: 'admin',
    });
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }
  return admin;
}

async function run() {
  await connectDB();
  await ensureAdmin();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  try {
    const candidateEmail = `admin-auth-${Date.now()}@example.com`;
    const registered = await request(base, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Candidate User',
        email: candidateEmail,
        password: 'Password123!',
      }),
    });
    assert.equal(registered.status, 201, JSON.stringify(registered.body));
    assert.equal(registered.body.user.role, 'candidate');
    const candidateToken = registered.body.token;

    const unauthenticated = await request(base, '/admin/users');
    assert.equal(unauthenticated.status, 401);

    const candidateAdminPaths = [
      ['GET', '/admin/dashboard'],
      ['GET', '/admin/users'],
      ['GET', '/admin/interviews'],
      ['GET', '/admin/questions'],
    ];
    for (const [method, path] of candidateAdminPaths) {
      const blocked = await request(base, path, withAuth(candidateToken, { method }));
      assert.equal(blocked.status, 403, `${path} should be forbidden for candidates: ${JSON.stringify(blocked.body)}`);
    }

    const candidateCreate = await request(base, '/admin/questions', withAuth(candidateToken, {
      method: 'POST',
      body: JSON.stringify({
        questionText: 'Candidate should not be able to create this fallback question at all.',
        topic: 'JavaScript',
        difficulty: 1,
        expectedConcepts: 'scope',
      }),
    }));
    assert.equal(candidateCreate.status, 403);

    const candidateUpdate = await request(base, '/admin/questions/000000000000000000000000', withAuth(candidateToken, {
      method: 'PUT',
      body: JSON.stringify({ questionText: 'Still forbidden for candidates even with a valid looking id.' }),
    }));
    assert.equal(candidateUpdate.status, 403);

    const candidateDelete = await request(base, '/admin/questions/000000000000000000000000', withAuth(candidateToken, {
      method: 'DELETE',
    }));
    assert.equal(candidateDelete.status, 403);

    const createdInterview = await request(base, '/interviews', withAuth(candidateToken, {
      method: 'POST',
      body: JSON.stringify({
        jobRole: 'Frontend Developer',
        skills: ['React'],
        questionCount: 5,
      }),
    }));
    assert.equal(createdInterview.status, 201, JSON.stringify(createdInterview.body));

    const adminLogin = await request(base, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: config.admin.email,
        password: config.admin.password,
      }),
    });
    assert.equal(adminLogin.status, 200, JSON.stringify(adminLogin.body));
    assert.equal(adminLogin.body.user.role, 'admin');
    const adminToken = adminLogin.body.token;

    const dashboard = await request(base, '/admin/dashboard', withAuth(adminToken));
    assert.equal(dashboard.status, 200, JSON.stringify(dashboard.body));
    assert.equal(typeof dashboard.body.stats.totalUsers, 'number');
    assert.equal(typeof dashboard.body.stats.totalInterviews, 'number');
    assert.ok(Array.isArray(dashboard.body.stats.mostPopularSkills));
    assert.ok(Array.isArray(dashboard.body.recentInterviews));

    const users = await request(base, '/admin/users', withAuth(adminToken));
    assert.equal(users.status, 200);
    const listedCandidate = users.body.users.find((user) => user.email === candidateEmail);
    assert.ok(listedCandidate, 'Admin user list should include the candidate');
    assert.equal(listedCandidate.role, 'candidate');
    assert.ok('skills' in listedCandidate);
    assert.ok(listedCandidate.createdAt);

    const interviews = await request(base, '/admin/interviews', withAuth(adminToken));
    assert.equal(interviews.status, 200);
    assert.ok(interviews.body.interviews.some((item) => String(item._id) === String(createdInterview.body.interview._id)));

    const uniqueText = `Admin authorization test question ${Date.now()} covering closures and lexical scope in JavaScript.`;
    const createdQuestion = await request(base, '/admin/questions', withAuth(adminToken, {
      method: 'POST',
      body: JSON.stringify({
        questionText: uniqueText,
        topic: 'JavaScript',
        difficulty: 2,
        questionType: 'conceptual',
        expectedConcepts: ['closures', 'scope'],
      }),
    }));
    assert.equal(createdQuestion.status, 201, JSON.stringify(createdQuestion.body));
    const questionId = createdQuestion.body.question._id;

    const filtered = await request(
      base,
      '/admin/questions?skill=JavaScript&difficulty=2',
      withAuth(adminToken)
    );
    assert.equal(filtered.status, 200, JSON.stringify(filtered.body));
    assert.ok(filtered.body.questions.some((item) => String(item._id) === String(questionId)));
    assert.ok(filtered.body.questions.every((item) => item.difficulty === 2));

    const updated = await request(base, `/admin/questions/${questionId}`, withAuth(adminToken, {
      method: 'PUT',
      body: JSON.stringify({ difficulty: 3 }),
    }));
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.question.difficulty, 3);

    const deleted = await request(base, `/admin/questions/${questionId}`, withAuth(adminToken, {
      method: 'DELETE',
    }));
    assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

    const candidateHistory = await request(base, '/interviews', withAuth(candidateToken));
    assert.equal(candidateHistory.status, 200);
    assert.ok(candidateHistory.body.interviews.length >= 1);

    console.log('Admin authorization tests passed.');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    await require('mongoose').disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

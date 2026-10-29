const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';
process.env.AI_API_KEY = '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-comprehensive-secret-0123456789';

const app = require('../app');
const config = require('../config/env');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const SkillPerformance = require('../models/SkillPerformance');
const FallbackQuestion = require('../models/FallbackQuestion');
const { heuristicEvaluate } = require('../data/fallbackQuestions');

const created = {
  users: [],
  interviews: [],
  fallbackQuestions: [],
};
const originalFetch = global.fetch;
const originalAiConfig = { ...config.ai };

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

function auth(token, method = 'GET', body) {
  return {
    method,
    headers: { Authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

async function register(base, email, password = 'SecurePass123!') {
  const response = await request(base, '/auth/register', {
    ...auth('', 'POST', { name: email.split('@')[0], email, password }),
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.body.user.role, 'candidate');
  assert.equal('password' in response.body.user, false);
  created.users.push(response.body.user.id);
  return response;
}

async function run() {
  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  try {
    const suffix = Date.now();
    const candidateAEmail = `comprehensive-a-${suffix}@example.com`;
    const candidateBEmail = `comprehensive-b-${suffix}@example.com`;

    const missingPassword = await request(base, '/auth/register', {
      ...auth('', 'POST', { name: 'Missing Password', email: `missing-${suffix}@example.com` }),
    });
    assert.equal(missingPassword.status, 400);

    const weakPassword = await request(base, '/auth/register', {
      ...auth('', 'POST', { name: 'Weak Password', email: `weak-${suffix}@example.com`, password: '123' }),
    });
    assert.equal(weakPassword.status, 400);

    const invalidEmail = await request(base, '/auth/register', {
      ...auth('', 'POST', { name: 'Invalid Email', email: 'not-an-email', password: 'SecurePass123!' }),
    });
    assert.equal(invalidEmail.status, 400);

    const candidateA = await register(base, candidateAEmail);
    const candidateB = await register(base, candidateBEmail);
    const duplicate = await request(base, '/auth/register', {
      ...auth('', 'POST', { name: 'Duplicate', email: candidateAEmail, password: 'SecurePass123!' }),
    });
    assert.equal(duplicate.status, 400);

    const invalidLogin = await request(base, '/auth/login', {
      ...auth('', 'POST', { email: candidateAEmail, password: 'WrongPassword123!' }),
    });
    assert.equal(invalidLogin.status, 401);

    const login = await request(base, '/auth/login', {
      ...auth('', 'POST', { email: candidateAEmail, password: 'SecurePass123!' }),
    });
    assert.equal(login.status, 200, JSON.stringify(login.body));
    const candidateAToken = login.body.token;
    const candidateAId = candidateA.body.user.id;
    const candidateBToken = (await request(base, '/auth/login', {
      ...auth('', 'POST', { email: candidateBEmail, password: 'SecurePass123!' }),
    })).body.token;

    const protectedWithoutToken = await request(base, '/auth/me');
    assert.equal(protectedWithoutToken.status, 401);
    const invalidToken = await request(base, '/auth/me', auth('not-a-jwt'));
    assert.equal(invalidToken.status, 401);
    assert.equal(invalidToken.body.code, 'TOKEN_INVALID');
    const expiredToken = jwt.sign({ id: candidateAId }, config.jwtSecret, { expiresIn: -1 });
    const expired = await request(base, '/auth/me', auth(expiredToken));
    assert.equal(expired.status, 401);
    assert.equal(expired.body.code, 'TOKEN_EXPIRED');

    const loggedOut = await request(base, '/auth/logout', auth(candidateAToken, 'POST'));
    assert.equal(loggedOut.status, 200);

    const invalidInterview = await request(base, '/interviews', auth(candidateAToken, 'POST', {
      skills: ['Node.js'], questionCount: 3,
    }));
    assert.equal(invalidInterview.status, 400);

    const interviewCreated = await request(base, '/interviews', auth(candidateAToken, 'POST', {
      jobRole: 'Backend Developer', skills: ['Node.js'], questionCount: 3, initialDifficulty: 'easy',
    }));
    assert.equal(interviewCreated.status, 201, JSON.stringify(interviewCreated.body));
    const interviewId = interviewCreated.body.interview._id;
    created.interviews.push(interviewId);

    const started = await request(base, `/interviews/${interviewId}/start`, auth(candidateAToken, 'POST'));
    assert.equal(started.status, 200, JSON.stringify(started.body));
    assert.ok(started.body.currentQuestion);
    const firstQuestion = started.body.currentQuestion;

    config.ai.provider = 'openai';
    config.ai.apiKey = 'test-only-key';
    config.ai.maxRetries = 0;
    let failFirstEvaluation = true;
    global.fetch = async (input, options = {}) => {
      const url = String(input);
      if (!url.startsWith(`${config.ai.baseUrl}/chat/completions`)) {
        return originalFetch(input, options);
      }
      const payload = JSON.parse(options.body);
      const schemaName = payload.response_format?.json_schema?.name;
      if (schemaName === 'interview_answer_evaluation' && failFirstEvaluation) {
        failFirstEvaluation = false;
        return {
          ok: false,
          status: 429,
          async json() {
            return { error: { code: 'insufficient_quota', message: 'Test quota failure.' } };
          },
        };
      }
      let content;
      if (schemaName === 'interview_question') {
        const prompt = payload.messages[1].content;
        const difficulty = prompt.match(/^Required difficulty: (easy|medium|hard)\./m)?.[1] || 'medium';
        content = {
          question: 'Explain a design choice you would make in a Node.js service and how you would test its trade-offs.',
          topic: 'Node.js',
          difficulty,
          type: 'design',
          expectedConcepts: ['design approach', 'trade-offs'],
        };
      } else if (schemaName === 'interview_answer_evaluation') {
        const prompt = payload.messages[1].content;
        const expectedLine = prompt.match(/^Expected concepts: (.+)$/m)?.[1] || '[]';
        const expectedConcepts = JSON.parse(expectedLine);
        content = {
          correctness: 90,
          relevance: 85,
          technicalDepth: 80,
          clarity: 90,
          completeness: 85,
          feedback: 'Mocked provider feedback based on the submitted answer and rubric.',
          strengths: ['Addressed the question directly'],
          weaknesses: ['Add a concrete example'],
          improvementSuggestion: 'Include an implementation example and its trade-offs.',
          nextFocus: 'Explain one implementation trade-off.',
          keyConceptsCovered: expectedConcepts,
          keyConceptsMissed: [],
        };
      } else {
        content = { feedback: 'Mocked overall feedback.' };
      }
      return {
        ok: true,
        status: 200,
        async json() {
          return { choices: [{ message: { content: JSON.stringify(content) } }] };
        },
      };
    };

    const otherOwner = await request(base, `/interviews/${interviewId}`, auth(candidateBToken));
    assert.equal(otherOwner.status, 404);
    const otherQuestions = await request(base, `/interviews/${interviewId}/questions`, auth(candidateBToken));
    assert.equal(otherQuestions.status, 404);

    const invalidId = await request(base, '/interviews/not-an-object-id', auth(candidateAToken));
    assert.equal(invalidId.status, 404);

    const emptyAnswer = await request(base, `/questions/${firstQuestion._id}/answer`, auth(candidateAToken, 'POST', {
      interviewId, userAnswer: '   ',
    }));
    assert.equal(emptyAnswer.status, 400);

    const firstAnswer = await request(base, `/questions/${firstQuestion._id}/answer`, auth(candidateAToken, 'POST', {
      interviewId, userAnswer: 'The event loop and non-blocking I/O coordinate callbacks through queues and the call stack.',
    }));
    assert.equal(firstAnswer.status, 200, JSON.stringify(firstAnswer.body));
    assert.equal(firstAnswer.body.answer.evaluationStatus, 'failed');
    assert.equal(firstAnswer.body.evaluation.scoringMethod, 'expected-concept-coverage');
    assert.equal(firstAnswer.body.evaluation.correctness, null, 'fallback must not invent AI subscores');
    assert.ok(firstAnswer.body.nextQuestion);

    const firstQuestionRecord = await Question.findById(firstQuestion._id);
    const fallbackExpectedScore = heuristicEvaluate({
      answer: firstAnswer.body.answer.userAnswer,
      expectedConcepts: firstQuestionRecord.expectedConcepts,
    }).score;
    assert.equal(firstAnswer.body.evaluation.score, fallbackExpectedScore);

    const unauthorizedRetry = await request(base, `/questions/${firstQuestion._id}/evaluation/retry`, auth(candidateBToken, 'POST'));
    assert.equal(unauthorizedRetry.status, 404);
    const retried = await request(base, `/questions/${firstQuestion._id}/evaluation/retry`, auth(candidateAToken, 'POST'));
    assert.equal(retried.status, 200, JSON.stringify(retried.body));
    assert.equal(retried.body.evaluation.status, 'completed');
    assert.equal(retried.body.evaluation.provider, 'openai');
    const duplicateRetry = await request(base, `/questions/${firstQuestion._id}/evaluation/retry`, auth(candidateAToken, 'POST'));
    assert.equal(duplicateRetry.status, 200);
    assert.equal(duplicateRetry.body.evaluation.status, 'completed');
    const afterRetryAnswers = await Answer.find({ interviewId });
    assert.equal(afterRetryAnswers.length, 1, 'retry must update the existing answer, not create another');
    const retriedSkill = await SkillPerformance.findOne({ user: candidateAId, skill: 'Node.js' });
    assert.equal(retriedSkill.attempts, 1, 'retry must not increment attempts');

    const duplicateAnswer = await request(base, `/questions/${firstQuestion._id}/answer`, auth(candidateAToken, 'POST', {
      interviewId, userAnswer: 'A second submission should be rejected.',
    }));
    assert.equal(duplicateAnswer.status, 400);

    let nextQuestion = firstAnswer.body.nextQuestion;
    for (let order = 2; order <= 3; order += 1) {
      const submitted = await request(base, `/questions/${nextQuestion._id}/answer`, auth(candidateAToken, 'POST', {
        interviewId,
        userAnswer: 'A practical answer with implementation details, testing, trade-offs, and error handling.',
      }));
      assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
      if (order === 2) nextQuestion = submitted.body.nextQuestion;
      else assert.equal(submitted.body.completed, true);
    }

    const report = await request(base, `/interviews/${interviewId}/report`, auth(candidateAToken));
    assert.equal(report.status, 200, JSON.stringify(report.body));
    assert.equal(report.body.report.questions.length, 3);
    const detail = await request(base, `/interviews/${interviewId}`, auth(candidateAToken));
    assert.equal(detail.status, 200);
    assert.equal(detail.body.answers.length, 3);

    const storedUser = await User.findById(candidateAId).select('+password');
    const storedInterview = await Interview.findById(interviewId);
    const storedQuestions = await Question.find({ interviewId }).sort({ order: 1 });
    const storedAnswers = await Answer.find({ interviewId }).sort({ submittedAt: 1 });
    assert.ok(storedUser.password.startsWith('$2'));
    assert.equal(storedInterview.status, 'completed');
    assert.equal(storedQuestions.length, 3);
    assert.equal(storedAnswers.length, 3);

    const adminEmail = `comprehensive-admin-${suffix}@example.com`;
    const admin = await User.create({
      name: 'Comprehensive Admin', email: adminEmail, password: 'AdminSecurePass123!', role: 'admin',
    });
    created.users.push(admin._id);
    const adminLogin = await request(base, '/auth/login', {
      ...auth('', 'POST', { email: adminEmail, password: 'AdminSecurePass123!' }),
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.user.role, 'admin');
    const adminToken = adminLogin.body.token;

    for (const path of ['/admin/dashboard', '/admin/users', '/admin/interviews', '/admin/questions']) {
      const blocked = await request(base, path, auth(candidateAToken));
      assert.equal(blocked.status, 403, `${path} should reject candidates`);
    }
    const dashboard = await request(base, '/admin/dashboard', auth(adminToken));
    assert.equal(dashboard.status, 200);
    assert.equal(typeof dashboard.body.stats.totalUsers, 'number');
    assert.equal(typeof dashboard.body.stats.totalInterviews, 'number');
    assert.ok(Array.isArray(dashboard.body.stats.mostPopularSkills));
    assert.ok(Array.isArray(dashboard.body.recentInterviews));
    const users = await request(base, '/admin/users', auth(adminToken));
    assert.equal(users.status, 200);
    assert.ok(users.body.users.some((user) => user.email === candidateAEmail));
    const interviews = await request(base, '/admin/interviews', auth(adminToken));
    assert.equal(interviews.status, 200);
    assert.ok(interviews.body.interviews.some((item) => String(item._id) === String(interviewId)));

    const questionText = `Comprehensive test fallback question ${suffix} covering reliable Node.js service design and testing.`;
    const createdQuestion = await request(base, '/admin/questions', auth(adminToken, 'POST', {
      questionText,
      topic: 'Node.js', difficulty: 2, questionType: 'conceptual', expectedConcepts: ['reliability', 'testing'],
    }));
    assert.equal(createdQuestion.status, 201, JSON.stringify(createdQuestion.body));
    const fallbackQuestionId = createdQuestion.body.question._id;
    created.fallbackQuestions.push(fallbackQuestionId);
    const filtered = await request(base, '/admin/questions?skill=Node.js&difficulty=2', auth(adminToken));
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.questions.some((question) => String(question._id) === String(fallbackQuestionId)));
    assert.ok(filtered.body.questions.every((question) => question.difficulty === 2));
    const updated = await request(base, `/admin/questions/${fallbackQuestionId}`, auth(adminToken, 'PUT', { difficulty: 3 }));
    assert.equal(updated.status, 200);
    assert.equal(updated.body.question.difficulty, 3);
    const deleted = await request(base, `/admin/questions/${fallbackQuestionId}`, auth(adminToken, 'DELETE'));
    assert.equal(deleted.status, 200);

    console.log(JSON.stringify({
      authentication: 'passed',
      interview: 'passed',
      database: 'passed',
      ownership: 'passed',
      adminAuthorization: 'passed',
      fallbackQuestionCrud: 'passed',
      reportQuestions: report.body.report.questions.length,
      evaluationRetry: 'passed',
    }, null, 2));
  } finally {
    await Promise.all([
      Answer.deleteMany({ interviewId: { $in: created.interviews } }),
      Question.deleteMany({ interviewId: { $in: created.interviews } }),
      Interview.deleteMany({ _id: { $in: created.interviews } }),
      SkillPerformance.deleteMany({ user: { $in: created.users } }),
      FallbackQuestion.deleteMany({ _id: { $in: created.fallbackQuestions } }),
      User.deleteMany({ _id: { $in: created.users } }),
    ]);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await mongoose.disconnect();
    global.fetch = originalFetch;
    Object.assign(config.ai, originalAiConfig);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

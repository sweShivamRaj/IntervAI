const mongoose = require('mongoose');
const User = require('../models/User');
const Interview = require('../models/Interview');
const { sanitizeUser } = require('../utils/token');
const {
  listFallbackQuestions,
  createFallbackQuestion,
  updateFallbackQuestion,
  deleteFallbackQuestion,
} = require('./fallbackQuestionService');

function roundScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.round(score * 10) / 10 : 0;
}

function serializeInterview(interview) {
  const value = interview?.toObject ? interview.toObject() : interview;
  const candidate = value.user && typeof value.user === 'object'
    ? { _id: value.user._id, name: value.user.name, email: value.user.email }
    : null;
  return {
    _id: value._id,
    user: candidate,
    candidate: candidate?.name || 'Unknown candidate',
    jobRole: value.jobRole,
    skills: Array.isArray(value.skills) ? value.skills : [],
    score: value.scoreAverage,
    scoreAverage: value.scoreAverage,
    status: value.status,
    questionCount: value.questionCount,
    completedQuestions: value.completedQuestions || 0,
    date: value.completedAt || value.createdAt,
    createdAt: value.createdAt,
    completedAt: value.completedAt,
  };
}

async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map(sanitizeUser);
}

async function listInterviews() {
  const interviews = await Interview.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return interviews.map(serializeInterview);
}

async function getDashboard() {
  const [totalUsers, totalInterviews, averageResult, popularSkills, recent] = await Promise.all([
    User.countDocuments(),
    Interview.countDocuments(),
    Interview.aggregate([
      { $match: { status: 'completed', scoreAverage: { $ne: null } } },
      { $group: { _id: null, averageScore: { $avg: '$scoreAverage' } } },
    ]),
    Interview.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    Interview.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  return {
    stats: {
      totalUsers,
      totalInterviews,
      averageInterviewScore: roundScore(averageResult[0]?.averageScore),
      averageScore: roundScore(averageResult[0]?.averageScore),
      mostPopularSkills: popularSkills.map((item) => ({ skill: item._id, count: item.count })),
    },
    recentInterviews: recent.map(serializeInterview),
  };
}

module.exports = {
  getDashboard,
  listUsers,
  listInterviews,
  listFallbackQuestions,
  createFallbackQuestion,
  updateFallbackQuestion,
  deleteFallbackQuestion,
  serializeInterview,
};

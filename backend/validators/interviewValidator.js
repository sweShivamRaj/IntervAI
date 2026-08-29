const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorMiddleware');

const INTERVIEW_TYPES = new Set(['technical', 'behavioral', 'mixed']);
const DIFFICULTIES = new Set(['adaptive', 'easy', 'medium', 'hard']);
const MAX_ANSWER_LENGTH = 8000;

function validateInterviewCreate(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request data.', 400, 'VALIDATION_ERROR');
  }
  const jobRole = String(body.jobRole || '').trim();
  if (!jobRole || jobRole.length > 80) {
    throw new AppError('A valid job role is required.', 400);
  }

  const skills = Array.isArray(body.skills)
    ? body.skills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];
  if (!skills.length) {
    throw new AppError('Select at least one skill.', 400);
  }
  if (skills.length > 20 || skills.some((skill) => skill.length > 80)) {
    throw new AppError('Skill list is invalid.', 400);
  }

  const interviewType = String(body.interviewType || 'technical').trim().toLowerCase();
  if (!INTERVIEW_TYPES.has(interviewType)) {
    throw new AppError('Interview type is invalid.', 400);
  }

  const initialDifficulty = String(body.initialDifficulty || 'adaptive').trim().toLowerCase();
  if (!DIFFICULTIES.has(initialDifficulty)) {
    throw new AppError('Starting difficulty is invalid.', 400);
  }

  const questionCount = Number(body.questionCount);
  if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 15) {
    throw new AppError('Question count must be between 3 and 15.', 400);
  }

  return {
    jobRole,
    skills,
    interviewType,
    initialDifficulty,
    questionCount,
    startingDifficulty: body.startingDifficulty,
  };
}

function validateAnswerPayload(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request data.', 400, 'VALIDATION_ERROR');
  }
  const userAnswer = String(body.userAnswer ?? body.text ?? '').trim();
  if (!userAnswer) {
    throw new AppError('An answer is required.', 400);
  }
  if (userAnswer.length > MAX_ANSWER_LENGTH) {
    throw new AppError('Answer is too long.', 400);
  }

  let interviewId;
  if (body.interviewId) {
    if (!mongoose.isValidObjectId(body.interviewId)) {
      throw new AppError('Interview not found.', 404);
    }
    interviewId = String(body.interviewId);
  }

  return { userAnswer, interviewId };
}

function validateObjectIdParam(id, label = 'Record') {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`${label} not found.`, 404);
  }
  return id;
}

module.exports = {
  validateInterviewCreate,
  validateAnswerPayload,
  validateObjectIdParam,
  MAX_ANSWER_LENGTH,
};

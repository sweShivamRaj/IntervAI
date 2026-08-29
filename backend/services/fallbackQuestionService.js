const mongoose = require('mongoose');
const FallbackQuestion = require('../models/FallbackQuestion');
const { QUESTION_BANK, getFallbackQuestion } = require('../data/fallbackQuestions');

const DIFFICULTY_BY_LABEL = { easy: 1, medium: 2, hard: 3 };
const QUESTION_TYPES = new Set(['conceptual', 'scenario', 'coding', 'design']);

function normalizeDifficulty(value, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return required ? null : undefined;
  }
  if (typeof value === 'string' && DIFFICULTY_BY_LABEL[value.trim().toLowerCase()]) {
    return DIFFICULTY_BY_LABEL[value.trim().toLowerCase()];
  }
  const numeric = Number(value);
  return [1, 2, 3].includes(numeric) ? numeric : null;
}

function difficultyLabel(value) {
  return { 1: 'Easy', 2: 'Medium', 3: 'Hard' }[Number(value)] || 'Medium';
}

function cleanString(value, field, { min = 1, max = 200 } = {}) {
  const cleaned = String(value ?? '').trim();
  if (cleaned.length < min || cleaned.length > max) {
    const error = new Error(`${field} must be between ${min} and ${max} characters.`);
    error.code = 'INVALID_FALLBACK_QUESTION';
    throw error;
  }
  return cleaned;
}

function normalizeQuestionPayload(payload = {}, { partial = false } = {}) {
  const normalized = {};

  if (!partial || payload.questionText !== undefined) {
    normalized.questionText = cleanString(payload.questionText, 'questionText', { min: 20, max: 600 });
  }
  if (!partial || payload.topic !== undefined) {
    normalized.topic = cleanString(payload.topic, 'topic', { min: 1, max: 80 });
  }
  if (!partial || payload.difficulty !== undefined) {
    const difficulty = normalizeDifficulty(payload.difficulty, { required: true });
    if (!difficulty) {
      const error = new Error('difficulty must be Easy, Medium, or Hard.');
      error.code = 'INVALID_FALLBACK_QUESTION';
      throw error;
    }
    normalized.difficulty = difficulty;
  }
  if (!partial || payload.questionType !== undefined || payload.type !== undefined) {
    const questionType = String(payload.questionType || payload.type || 'conceptual').trim().toLowerCase();
    if (!QUESTION_TYPES.has(questionType)) {
      const error = new Error('questionType must be conceptual, scenario, coding, or design.');
      error.code = 'INVALID_FALLBACK_QUESTION';
      throw error;
    }
    normalized.questionType = questionType;
  }
  if (!partial || payload.expectedConcepts !== undefined) {
    const concepts = Array.isArray(payload.expectedConcepts)
      ? payload.expectedConcepts
      : String(payload.expectedConcepts || '').split(',');
    normalized.expectedConcepts = [...new Set(concepts.map((item) => String(item).trim()).filter(Boolean))];
    if (!normalized.expectedConcepts.length || normalized.expectedConcepts.length > 8) {
      const error = new Error('expectedConcepts must contain between 1 and 8 items.');
      error.code = 'INVALID_FALLBACK_QUESTION';
      throw error;
    }
    if (normalized.expectedConcepts.some((item) => item.length > 100)) {
      const error = new Error('Each expected concept must be at most 100 characters.');
      error.code = 'INVALID_FALLBACK_QUESTION';
      throw error;
    }
  }

  return normalized;
}

function serializeFallbackQuestion(question) {
  const value = question?.toObject ? question.toObject() : question;
  return {
    _id: value._id,
    questionText: value.questionText,
    topic: value.topic,
    difficulty: value.difficulty,
    difficultyLabel: difficultyLabel(value.difficulty),
    questionType: value.questionType,
    expectedConcepts: Array.isArray(value.expectedConcepts) ? value.expectedConcepts : [],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function seedFallbackQuestions() {
  if (mongoose.connection.readyState !== 1) return false;

  const existingCount = await FallbackQuestion.estimatedDocumentCount();
  if (existingCount > 0) return false;

  await FallbackQuestion.insertMany(
    QUESTION_BANK.map((question) => ({
      questionText: question.questionText,
      topic: question.topic,
      difficulty: question.difficulty,
      questionType: question.questionType,
      expectedConcepts: question.expectedConcepts,
    })),
    { ordered: false }
  );
  return true;
}

async function listFallbackQuestions(filters = {}) {
  await seedFallbackQuestions();
  const query = {};
  const topic = String(filters.topic || filters.skill || '').trim();
  const difficulty = normalizeDifficulty(filters.difficulty);

  if (topic) query.topic = { $regex: escapeRegExp(topic), $options: 'i' };
  if (filters.difficulty && !difficulty) throw new Error('difficulty must be Easy, Medium, or Hard.');
  if (difficulty) query.difficulty = difficulty;

  const questions = await FallbackQuestion.find(query)
    .sort({ topic: 1, difficulty: 1, createdAt: -1 })
    .lean();
  return questions.map(serializeFallbackQuestion);
}

async function createFallbackQuestion(payload) {
  await seedFallbackQuestions();
  const normalized = normalizeQuestionPayload(payload);
  const question = await FallbackQuestion.create(normalized);
  return serializeFallbackQuestion(question);
}

async function updateFallbackQuestion(id, payload) {
  if (!mongoose.isValidObjectId(id)) throw new Error('Fallback question not found.');
  const normalized = normalizeQuestionPayload(payload, { partial: true });
  if (!Object.keys(normalized).length) {
    const error = new Error('At least one question field is required.');
    error.code = 'INVALID_FALLBACK_QUESTION';
    throw error;
  }
  const question = await FallbackQuestion.findByIdAndUpdate(id, normalized, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!question) throw new Error('Fallback question not found.');
  return serializeFallbackQuestion(question);
}

async function deleteFallbackQuestion(id) {
  if (!mongoose.isValidObjectId(id)) throw new Error('Fallback question not found.');
  const question = await FallbackQuestion.findByIdAndDelete(id);
  if (!question) throw new Error('Fallback question not found.');
  return serializeFallbackQuestion(question);
}

async function getManagedFallbackQuestion({ topic, skill, difficulty, usedQuestionTexts = [] } = {}) {
  const requestedTopic = String(topic || skill || '').trim().toLowerCase();
  const targetDifficulty = Number(difficulty) || 2;

  if (mongoose.connection.readyState === 1) {
    try {
      const managed = await FallbackQuestion.find({
        topic: { $regex: `^${escapeRegExp(requestedTopic)}$`, $options: 'i' },
        difficulty: targetDifficulty,
      }).lean();
      const used = new Set(usedQuestionTexts);
      const unused = managed.filter((question) => !used.has(question.questionText));
      const pool = unused.length ? unused : managed;
      if (pool.length) {
        const selected = pool[Math.floor(Math.random() * pool.length)];
        let questionText = selected.questionText;
        let variant = 1;
        while (used.has(questionText)) {
          questionText = `${selected.questionText} Follow-up ${variant}: include a different example or trade-off.`;
          variant += 1;
        }
        return {
          ...selected,
          questionText,
          text: questionText,
          source: 'managed',
        };
      }
    } catch (error) {
      console.warn(`[fallbackQuestionService] Managed fallback lookup failed: ${error.message}`);
    }
  }

  return getFallbackQuestion({ topic, skill, difficulty, usedQuestionTexts });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  difficultyLabel,
  normalizeDifficulty,
  normalizeQuestionPayload,
  seedFallbackQuestions,
  listFallbackQuestions,
  createFallbackQuestion,
  updateFallbackQuestion,
  deleteFallbackQuestion,
  getManagedFallbackQuestion,
  serializeFallbackQuestion,
};

const { difficultyLabel } = require('./adaptiveService');
const { getManagedFallbackQuestion } = require('./fallbackQuestionService');
const config = require('../config/env');
const { evaluateCandidateAnswer } = require('./evaluationService');

const QUESTION_TYPES = new Set(['conceptual', 'scenario', 'coding', 'design']);
const INAPPROPRIATE_CONTENT = /\b(?:sex(?:ual)?|porn(?:ography)?|racist|racism|hate speech|dating|religion|politic(?:s|al)?|weapon|drug(?:s)?|violence|violent)\b/i;
const AMBIGUOUS_LANGUAGE = /\b(?:anything|something|various things|tell me about|what do you think about)\b/i;

const QUESTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['question', 'topic', 'difficulty', 'type', 'expectedConcepts'],
  properties: {
    question: { type: 'string', minLength: 20, maxLength: 600 },
    topic: { type: 'string', minLength: 1, maxLength: 80 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    type: { type: 'string', enum: ['conceptual', 'scenario', 'coding', 'design'] },
    expectedConcepts: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: { type: 'string', minLength: 1, maxLength: 100 },
    },
  },
};

/**
 * Generate exactly one validated interview question.
 *
 * This module is intentionally database-free. It returns a plain object; the
 * interview service owns order, state, difficulty persistence, and storage.
 */
async function generateInterviewQuestion(context = {}) {
  const normalizedContext = normalizeContext(context);
  const provider = String(config.ai.provider || 'fallback').trim().toLowerCase();

  if (provider === 'mock') {
    const mock = validateInterviewQuestion(
      buildMockQuestion(normalizedContext),
      normalizedContext
    );
    if (mock.valid) return mock.value;
    console.warn(`[aiService] Mock question failed validation: ${mock.reason}`);
    return await buildFallbackResponse(normalizedContext);
  }

  if (provider === 'openai' && config.ai.apiKey) {
    const retryCount = getRetryCount(config.ai.maxRetries);
    let lastError = null;

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        const rawQuestion = await generateWithOpenAI(normalizedContext);
        const validated = validateInterviewQuestion(rawQuestion, normalizedContext);
        if (validated.valid) {
          return validated.value;
        }

        lastError = new Error(validated.reason);
        console.warn(
          `[aiService] Invalid question response on attempt ${attempt + 1}/${retryCount + 1}: ${validated.reason}`
        );
      } catch (error) {
        lastError = error;
        console.warn(
          `[aiService] Question generation attempt ${attempt + 1}/${retryCount + 1} failed: ${error.message}`
        );
      }
    }

    console.warn(
      `[aiService] AI question generation unavailable after retries; using fallback: ${lastError?.message || 'unknown error'}`
    );
    return await buildFallbackResponse(normalizedContext);
  }

  if (provider === 'openai' && !config.ai.apiKey) {
    console.warn('[aiService] AI_PROVIDER=openai but AI_API_KEY is missing; using fallback question.');
  } else if (provider !== 'fallback' && provider !== 'mock') {
    console.warn(`[aiService] Unsupported AI_PROVIDER=${provider}; using fallback question.`);
  }

  return await buildFallbackResponse(normalizedContext);
}

function normalizeContext(context) {
  const selectedSkills = (context.selectedSkills || context.skills || [])
    .map(String)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const currentTopic = String(
    context.currentTopic || context.topic || context.skill || selectedSkills[0] || 'General Software Engineering'
  ).trim();
  const currentDifficulty = normalizeDifficulty(
    context.currentDifficulty ?? context.difficulty ?? 'medium'
  );
  const previousQuestions = (context.previousQuestions || [])
    .map((previous) => {
      if (typeof previous === 'string') return previous.trim();
      return String(previous?.questionText || previous?.question || previous?.text || '').trim();
    })
    .filter(Boolean)
    .slice(-20);
  const recentPerformance = (context.recentPerformance || context.recentScores || [])
    .map((item) => (typeof item === 'number' ? item : item?.score))
    .map(Number)
    .filter(Number.isFinite)
    .slice(-10);

  return {
    jobRole: String(context.jobRole || 'Software Developer').trim(),
    interviewType: String(context.interviewType || 'technical').trim().toLowerCase(),
    selectedSkills,
    currentTopic,
    currentDifficulty,
    difficulty: difficultyLabel(currentDifficulty).toLowerCase(),
    previousQuestions,
    recentPerformance,
  };
}

function normalizeDifficulty(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'easy') return 1;
    if (normalized === 'hard') return 3;
    if (normalized === 'medium') return 2;
  }

  const numeric = Number(value);
  return numeric === 1 || numeric === 3 ? numeric : 2;
}

function getRetryCount(value) {
  const retries = Number(value);
  if (!Number.isFinite(retries)) return 2;
  return Math.max(0, Math.min(3, Math.floor(retries)));
}

async function buildFallbackResponse(context) {
  const fallback = await getManagedFallbackQuestion({
    topic: context.currentTopic,
    difficulty: context.currentDifficulty,
    usedQuestionTexts: context.previousQuestions,
  });

  return {
    question: fallback.questionText,
    topic: fallback.topic,
    difficulty: difficultyLabel(context.currentDifficulty).toLowerCase(),
    type: fallback.questionType,
    expectedConcepts: fallback.expectedConcepts,
  };
}

function buildMockQuestion(context) {
  const topic = context.currentTopic;
  const role = context.jobRole;
  const questionNumber = context.previousQuestions.length + 1;
  const templates = [
    {
      type: 'conceptual',
      question: `For a ${role} role, explain the core principles of ${topic} and when you would use them in a production system.`,
      expectedConcepts: ['core principles', 'production use case', 'trade-offs'],
    },
    {
      type: 'scenario',
      question: `In a ${role} project, how would you diagnose and solve a difficult ${topic} problem while keeping the solution maintainable?`,
      expectedConcepts: ['problem diagnosis', 'solution design', 'maintainability'],
    },
    {
      type: 'design',
      question: `How would you design a ${topic} solution for a ${role} application, and how would you validate its reliability and performance?`,
      expectedConcepts: ['design approach', 'reliability', 'performance'],
    },
    {
      type: 'coding',
      question: `What implementation approach would you choose for a ${topic} task in a ${role} role, and which edge cases would you test?`,
      expectedConcepts: ['implementation approach', 'edge cases', 'testing'],
    },
  ];
  const selected = templates[(questionNumber - 1) % templates.length];

  return {
    question: `${selected.question} This is interview question ${questionNumber}.`,
    topic,
    difficulty: context.difficulty,
    type: selected.type,
    expectedConcepts: [topic, ...selected.expectedConcepts],
  };
}

function validateInterviewQuestion(raw, context = {}) {
  context = normalizeContext(context);
  const parsed = parseQuestionJson(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, reason: 'response must be one JSON object' };
  }

  const expectedKeys = ['question', 'topic', 'difficulty', 'type', 'expectedConcepts'];
  const keys = Object.keys(parsed).sort();
  if (keys.length !== expectedKeys.length || !expectedKeys.every((key) => keys.includes(key))) {
    return { valid: false, reason: 'response must contain exactly the required fields' };
  }

  const question = typeof parsed.question === 'string' ? parsed.question.trim() : '';
  const topic = typeof parsed.topic === 'string' ? parsed.topic.trim() : '';
  const difficulty = typeof parsed.difficulty === 'string'
    ? parsed.difficulty.trim().toLowerCase()
    : '';
  const type = typeof parsed.type === 'string' ? parsed.type.trim().toLowerCase() : '';
  const expectedConcepts = Array.isArray(parsed.expectedConcepts)
    ? parsed.expectedConcepts.map((concept) => String(concept).trim()).filter(Boolean)
    : null;

  if (question.length < 20 || question.length > 600) {
    return { valid: false, reason: 'question length is invalid' };
  }
  if (!topic) return { valid: false, reason: 'topic is required' };
  if (difficulty !== context.difficulty) {
    return { valid: false, reason: 'difficulty does not match the requested difficulty' };
  }
  if (normalizeLabel(topic) !== normalizeLabel(context.currentTopic)) {
    return { valid: false, reason: 'topic does not match the current topic' };
  }
  if (
    context.selectedSkills.length > 0 &&
    !context.selectedSkills.some((skill) => normalizeLabel(skill) === normalizeLabel(topic))
  ) {
    return { valid: false, reason: 'topic is not one of the selected skills' };
  }
  if (!QUESTION_TYPES.has(type)) return { valid: false, reason: 'question type is invalid' };
  if (!expectedConcepts || expectedConcepts.length < 2 || expectedConcepts.length > 8) {
    return { valid: false, reason: 'expectedConcepts must contain between 2 and 8 concepts' };
  }
  if (new Set(expectedConcepts.map(normalizeLabel)).size !== expectedConcepts.length) {
    return { valid: false, reason: 'expectedConcepts must be unique' };
  }
  if (INAPPROPRIATE_CONTENT.test(question) || INAPPROPRIATE_CONTENT.test(topic)) {
    return { valid: false, reason: 'question contains inappropriate content' };
  }
  if (AMBIGUOUS_LANGUAGE.test(question)) {
    return { valid: false, reason: 'question is too ambiguous' };
  }
  if (isNearDuplicate(question, context.previousQuestions)) {
    return { valid: false, reason: 'question is a duplicate or near-duplicate' };
  }

  return {
    valid: true,
    value: {
      question,
      topic,
      difficulty,
      type,
      expectedConcepts,
    },
  };
}

function parseQuestionJson(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeLabel(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeQuestionText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function questionTokens(value) {
  return new Set(normalizeQuestionText(value).split(' ').filter((token) => token.length > 2));
}

function isNearDuplicate(candidate, previousQuestions = []) {
  const candidateNormalized = normalizeQuestionText(candidate);
  const candidateTokens = questionTokens(candidate);
  if (!candidateNormalized || candidateTokens.size < 4) return false;

  return previousQuestions.some((previous) => {
    const previousNormalized = normalizeQuestionText(previous);
    if (!previousNormalized) return false;
    if (candidateNormalized === previousNormalized) return true;
    if (candidateNormalized.includes(previousNormalized) || previousNormalized.includes(candidateNormalized)) {
      return true;
    }

    const previousTokens = questionTokens(previous);
    const intersection = [...candidateTokens].filter((token) => previousTokens.has(token)).length;
    const union = new Set([...candidateTokens, ...previousTokens]).size;
    return union > 0 && intersection / union >= 0.78;
  });
}

async function generateWithOpenAI(context) {
  const prompt = [
    `Generate exactly one interview question for a ${context.jobRole} candidate.`,
    `Interview type: ${context.interviewType}.`,
    `Selected skills: ${context.selectedSkills.join(', ') || context.currentTopic}.`,
    `Current topic: ${context.currentTopic}.`,
    `Required difficulty: ${context.difficulty}.`,
    'The question must be specific, unambiguous, professional, and relevant to the role and topic.',
    'Do not ask about personal characteristics, protected traits, politics, religion, or unrelated subjects.',
    'Avoid the previous questions and any near-duplicate wording.',
    `Previous questions: ${JSON.stringify(context.previousQuestions)}`,
    `Recent candidate performance scores: ${JSON.stringify(context.recentPerformance)}`,
    'Return only the requested structured object. Do not include markdown, explanations, or multiple questions.',
  ].join('\n');

  const content = await callOpenAIChat(
    [
      {
        role: 'system',
        content: 'You are a professional technical interviewer who writes one clear, role-relevant question at a time.',
      },
      { role: 'user', content: prompt },
    ],
    {
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'interview_question',
          strict: true,
          schema: QUESTION_JSON_SCHEMA,
        },
      },
      max_tokens: 350,
      temperature: 0.2,
    }
  );

  return parseQuestionJson(content);
}

async function callOpenAIChat(messages, options = {}) {
  const baseUrl = String(config.ai.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(config.ai.timeoutMs) || 15000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages,
        ...options,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI provider HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      return content.map((part) => part.text || '').join('').trim();
    }
    return typeof content === 'string' ? content.trim() : null;
  } finally {
    clearTimeout(timeout);
  }
}

// Compatibility adapter for the earlier service surface. The implementation
// now delegates to the dedicated evaluator so there is only one evaluation
// contract and one place where provider failures are handled.
async function evaluateAnswer({ question, answer, jobRole, skill, difficulty }) {
  const result = await evaluateCandidateAnswer({
    question,
    candidateAnswer: answer,
    candidateRole: jobRole,
    topic: skill,
    difficulty,
  });

  return {
    score: result.score,
    feedback: result.evaluation.feedback,
    strengths: result.evaluation.strengths,
    improvements: result.evaluation.weaknesses,
  };
}

function isAiConfigured() {
  return (config.ai.provider === 'mock') ||
    (config.ai.provider === 'openai' && Boolean(config.ai.apiKey));
}

// Compatibility adapter for the previous generateQuestion({ skill, difficulty }) API.
async function generateQuestion(context = {}) {
  const generated = await generateInterviewQuestion(context);
  const provider = String(config.ai.provider || 'fallback').trim().toLowerCase();
  return {
    text: generated.question,
    source: provider === 'mock' || (provider === 'openai' && config.ai.apiKey)
      ? 'ai'
      : 'fallback',
    topic: generated.topic,
    difficulty: generated.difficulty,
    questionType: generated.type,
    expectedConcepts: generated.expectedConcepts,
  };
}

module.exports = {
  generateInterviewQuestion,
  generateQuestion,
  validateInterviewQuestion,
  isAiConfigured,
  // Kept as a compatibility export; the interview engine uses the dedicated
  // evaluation service directly.
  evaluateAnswer,
};

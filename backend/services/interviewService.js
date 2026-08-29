const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const SkillPerformance = require('../models/SkillPerformance');
const { AppError } = require('../middleware/errorMiddleware');
const { getManagedFallbackQuestion } = require('./fallbackQuestionService');
const { generateInterviewQuestion } = require('./aiService');
const {
  evaluateCandidateAnswer,
  buildFallbackResult,
  SAFE_FAILURE_MESSAGE,
} = require('./evaluationService');
const { generateOverallFeedback } = require('./reportService');
const { buildReportAnalytics } = require('./analyticsService');
const {
  clampDifficulty,
  computeAdaptiveDecision,
  difficultyLabel,
  getTopicDifficulty,
  selectNextTopic,
  setTopicDifficulty,
} = require('./adaptiveService');

async function createInterview(userId, payload) {
  const {
    jobRole,
    skills,
    questionCount,
    startingDifficulty,
    interviewType,
    initialDifficulty,
  } = payload;

  const cleanedSkills = Array.isArray(skills)
    ? skills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];
  if (!jobRole || cleanedSkills.length === 0) {
    throw new AppError('jobRole and at least one skill are required.', 400);
  }

  let numericDifficulty = 2;
  if (initialDifficulty === 'easy' || startingDifficulty === 1) numericDifficulty = 1;
  else if (initialDifficulty === 'hard' || startingDifficulty === 3) numericDifficulty = 3;
  else if (startingDifficulty) numericDifficulty = clampDifficulty(startingDifficulty);

  return Interview.create({
    user: userId,
    jobRole: String(jobRole).trim(),
    skills: cleanedSkills,
    interviewType: interviewType || 'technical',
    initialDifficulty: initialDifficulty || 'adaptive',
    questionCount: Number(questionCount) || 5,
    currentDifficulty: numericDifficulty,
    topicDifficulties: cleanedSkills.map((topic) => ({
      topic,
      difficulty: numericDifficulty,
    })),
    difficultyProgression: [],
    completedQuestions: 0,
    status: 'created',
  });
}

async function listInterviews(userId) {
  const interviews = await Interview.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return interviews.map((interview) => ({
    ...interview,
    numberOfQuestions: interview.questionCount,
    date: interview.completedAt || interview.createdAt,
  }));
}

async function getInterviewForUser(interviewId, userId, { allowAdmin = false, userRole } = {}) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw new AppError('Interview not found.', 404);
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) throw new AppError('Interview not found.', 404);
  if (!allowAdmin || userRole !== 'admin') {
    if (String(interview.user) !== String(userId)) {
      throw new AppError('Interview not found.', 404);
    }
  }
  return interview;
}

function serializeQuestion(question, answeredQuestionIds = new Set()) {
  if (!question) return null;
  return {
    _id: question._id,
    interviewId: question.interviewId,
    questionText: question.questionText,
    topic: question.topic,
    difficulty: question.difficulty,
    questionType: question.questionType,
    order: question.order,
    createdAt: question.createdAt,
    answered: answeredQuestionIds.has(String(question._id)),
    // Deliberately omit expectedConcepts from every candidate-facing response.
  };
}

async function getAnswerState(interviewId) {
  const answers = await Answer.find({ interviewId })
    .sort({ submittedAt: 1 })
    .select('questionId score evaluation evaluationStatus userAnswer submittedAt');
  return {
    answers,
    answeredQuestionIds: new Set(answers.map((answer) => String(answer.questionId))),
    answeredCount: answers.length,
  };
}

async function startInterview(interviewId, userId) {
  const interview = await getInterviewForUser(interviewId, userId);

  if (interview.status === 'completed') {
    return {
      interview,
      question: null,
      currentQuestion: null,
      completed: true,
      progress: { current: interview.questionCount, total: interview.questionCount, answered: interview.completedQuestions },
    };
  }

  const { answeredQuestionIds, answeredCount } = await getAnswerState(interview._id);
  const currentOrder = answeredCount + 1;

  if (interview.status !== 'in_progress') {
    interview.status = 'in_progress';
    interview.startedAt = interview.startedAt || new Date();
  }
  interview.completedQuestions = answeredCount;

  if (currentOrder > interview.questionCount) {
    const report = await completeInterview(interview);
    return {
      interview,
      question: null,
      currentQuestion: null,
      completed: true,
      report,
      progress: { current: interview.questionCount, total: interview.questionCount, answered: answeredCount },
    };
  }

  const question = await createNextQuestion(interview, currentOrder);
  await interview.save();

  const publicQuestion = serializeQuestion(question, answeredQuestionIds);
  return {
    interview,
    question: publicQuestion,
    currentQuestion: publicQuestion,
    completed: false,
    progress: { current: currentOrder, total: interview.questionCount, answered: answeredCount },
  };
}

async function createNextQuestion(interview, order) {
  const existing = await Question.findOne({ interviewId: interview._id, order });
  if (existing) {
    recordDifficultyProgression(interview, existing);
    return existing;
  }

  const existingQuestions = await Question.find({ interviewId: interview._id })
    .select('questionText topic difficulty')
    .sort({ order: 1 });
  const allAnswers = await Answer.find({ interviewId: interview._id })
    .select('questionId score evaluationStatus submittedAt')
    .sort({ submittedAt: 1 });
  const questionTopics = new Map(
    existingQuestions.map((question) => [String(question._id), question.topic])
  );
  const adaptiveAnswers = allAnswers.map((answer) => ({
    score: answer.score,
    evaluationStatus: answer.evaluationStatus,
    topic: questionTopics.get(String(answer.questionId)),
  }));
  const topic = selectNextTopic({
    skills: interview.skills,
    order,
    answers: adaptiveAnswers,
  });
  const difficulty = getTopicDifficulty(
    interview.topicDifficulties,
    topic,
    interview.currentDifficulty
  );
  let generated;

  try {
    generated = await generateInterviewQuestion({
      jobRole: interview.jobRole,
      interviewType: interview.interviewType,
      selectedSkills: interview.skills,
      currentTopic: topic,
      currentDifficulty: difficulty,
      previousQuestions: existingQuestions,
      recentPerformance: allAnswers.slice(-10).map((answer) => answer.score),
    });
  } catch (error) {
    // The AI service normally catches provider errors itself. Keep this final
    // guard so a service/configuration error can never interrupt an interview.
    console.warn(`[interviewService] AI question service failed; using fallback: ${error.message}`);
    const fallback = await getManagedFallbackQuestion({
      topic,
      difficulty,
      usedQuestionTexts: existingQuestions.map((question) => question.questionText),
    });
    generated = {
      question: fallback.questionText,
      topic,
      difficulty,
      type: fallback.questionType,
      expectedConcepts: fallback.expectedConcepts,
      source: 'fallback',
    };
  }

  try {
    const question = await Question.create({
      interviewId: interview._id,
      questionText: generated.question,
      // Topic and difficulty are owned by the backend, even when the AI
      // returns those fields in its validated response.
      topic,
      difficulty,
      questionType: generated.type,
      expectedConcepts: generated.expectedConcepts,
      order,
    });
    interview.topicDifficulties = interview.topicDifficulties || [];
    setTopicDifficulty(interview.topicDifficulties, topic, difficulty);
    recordDifficultyProgression(interview, question);
    return question;
  } catch (error) {
    // A second start request may race the first one. Reuse the question created by it.
    if (error?.code === 11000) {
      const racedQuestion = await Question.findOne({ interviewId: interview._id, order });
      if (racedQuestion) {
        recordDifficultyProgression(interview, racedQuestion);
        return racedQuestion;
      }
    }
    throw error;
  }
}

function recordDifficultyProgression(interview, question, score = undefined) {
  interview.difficultyProgression = interview.difficultyProgression || [];
  let entry = interview.difficultyProgression.find((item) => item.order === question.order);
  if (!entry) {
    entry = {
      order: question.order,
      topic: question.topic,
      difficulty: question.difficulty,
      score: null,
    };
    interview.difficultyProgression.push(entry);
  } else {
    entry.topic = question.topic;
    entry.difficulty = question.difficulty;
  }
  if (score !== undefined && score !== null && Number.isFinite(Number(score))) {
    entry.score = Number(score);
  }
}

async function getInterviewQuestions(interviewId, userId) {
  const interview = await getInterviewForUser(interviewId, userId);
  let { answeredQuestionIds, answeredCount } = await getAnswerState(interview._id);
  let questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });

  if (interview.status === 'in_progress' && answeredCount < interview.questionCount) {
    const currentQuestion = await createNextQuestion(interview, answeredCount + 1);
    if (!questions.some((question) => String(question._id) === String(currentQuestion._id))) {
      questions = [...questions, currentQuestion].sort((a, b) => a.order - b.order);
    }
    await interview.save();
  }

  const currentQuestion = questions.find((question) => question.order === answeredCount + 1);
  return {
    interview,
    questions: questions.map((question) => serializeQuestion(question, answeredQuestionIds)),
    currentQuestion: serializeQuestion(currentQuestion, answeredQuestionIds),
    completed: interview.status === 'completed',
    progress: {
      current: Math.min(answeredCount + 1, interview.questionCount),
      total: interview.questionCount,
      answered: answeredCount,
    },
  };
}

async function submitAnswer(questionId, userId, payload = {}) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw new AppError('Question not found.', 404);
  }

  const userAnswer = payload.userAnswer ?? payload.text;
  if (!userAnswer || !String(userAnswer).trim()) {
    throw new AppError('An answer is required.', 400);
  }

  const question = await Question.findById(questionId);
  if (!question) throw new AppError('Question not found.', 404);

  const interview = await getInterviewForUser(question.interviewId, userId);
  if (payload.interviewId && String(payload.interviewId) !== String(interview._id)) {
    throw new AppError('Question does not belong to this interview.', 400);
  }
  if (interview.status !== 'in_progress') {
    throw new AppError('Interview is not in progress.', 400);
  }

  const existingAnswer = await Answer.findOne({ questionId: question._id });
  if (existingAnswer) throw new AppError('Question already answered.', 400);

  const { answeredCount } = await getAnswerState(interview._id);
  if (question.order !== answeredCount + 1) {
    throw new AppError('That is not the current interview question.', 400);
  }

  let answer;
  try {
    // Persist the answer before calling an external provider. A provider
    // outage must never discard candidate work.
    answer = await Answer.create({
      interviewId: interview._id,
      questionId: question._id,
      userAnswer: String(userAnswer).trim(),
      evaluationStatus: 'pending',
      evaluation: {
        feedback: 'Evaluation is in progress.',
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('Question already answered.', 400);
    }
    throw error;
  }

  let evaluationResult;
  try {
    evaluationResult = await evaluateCandidateAnswer({
      question,
      expectedConcepts: question.expectedConcepts,
      candidateAnswer: answer.userAnswer,
      candidateRole: interview.jobRole,
      topic: question.topic,
      difficulty: question.difficulty,
    });
  } catch (error) {
    // This is a final guard for unexpected evaluator errors. The answer is
    // already durable, so mark it failed and continue the interview safely.
    console.warn(`[interviewService] Answer evaluation failed; using fallback: ${error.message}`);
    evaluationResult = buildFallbackResult({
      question,
      expectedConcepts: question.expectedConcepts,
      candidateAnswer: answer.userAnswer,
      candidateRole: interview.jobRole,
      topic: question.topic,
      difficulty: question.difficulty,
    }, error.message);
  }

  answer.score = evaluationResult.score ?? null;
  answer.evaluationStatus = evaluationResult.status === 'completed' ? 'completed' : 'failed';
  answer.evaluation = evaluationResult.evaluation;
  await answer.save();

  const previousDifficulty = interview.currentDifficulty;
  const allAnswers = await Answer.find({ interviewId: interview._id }).sort({ submittedAt: 1 });
  const allQuestions = await Question.find({ interviewId: interview._id })
    .select('_id topic')
    .sort({ order: 1 });
  const questionTopics = new Map(
    allQuestions.map((item) => [String(item._id), item.topic])
  );
  const adaptiveAnswers = allAnswers.map((item) => ({
    score: item.score,
    evaluationStatus: item.evaluationStatus,
    topic: questionTopics.get(String(item.questionId)),
  }));
  const completed = allAnswers.length >= interview.questionCount;
  const nextTopic = completed
    ? question.topic
    : selectNextTopic({
        skills: interview.skills,
        order: allAnswers.length + 1,
        answers: adaptiveAnswers,
      });
  const decision = computeAdaptiveDecision({
    currentDifficulty: previousDifficulty,
    nextTopic,
    answeredTopic: question.topic,
    answers: adaptiveAnswers,
    topicDifficulties: interview.topicDifficulties,
  });
  const nextDifficulty = decision.nextDifficulty;

  recordDifficultyProgression(interview, question, answer.score);
  interview.topicDifficulties = interview.topicDifficulties || [];
  setTopicDifficulty(
    interview.topicDifficulties,
    question.topic,
    decision.updatedAnsweredTopicDifficulty
  );
  if (!completed) {
    setTopicDifficulty(interview.topicDifficulties, nextTopic, nextDifficulty);
  }

  if (Number.isFinite(answer.score)) {
    await updateSkillPerformance(
      userId,
      question.topic,
      answer.score,
      interview._id,
      question.difficulty
    );
  }

  interview.currentDifficulty = nextDifficulty;
  interview.completedQuestions = allAnswers.length;
  interview.status = completed ? 'completed' : 'in_progress';

  let nextQuestion = null;
  let report = null;
  if (completed) {
    report = await completeInterview(interview, allAnswers);
  } else {
    nextQuestion = serializeQuestion(
      await createNextQuestion(interview, allAnswers.length + 1)
    );
    await interview.save();
  }

  return {
    answer: {
      _id: answer._id,
      interviewId: answer.interviewId,
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      score: answer.score,
      evaluation: answer.evaluation,
      evaluationStatus: answer.evaluationStatus,
      submittedAt: answer.submittedAt,
    },
    evaluation: {
      score: answer.score,
      status: answer.evaluationStatus,
      ...serializeEvaluation(answer.evaluation),
      // Keep feedback as a compatibility alias for the earlier frontend/API shape.
      feedback: answer.evaluation?.feedback || SAFE_FAILURE_MESSAGE,
      ...(evaluationResult.safeMessage ? { safeMessage: evaluationResult.safeMessage } : {}),
    },
    previousDifficulty,
    nextDifficulty,
    completed,
    nextQuestion,
    report,
  };
}

async function completeInterview(interview, answers) {
  const completedAnswers = answers || (await Answer.find({ interviewId: interview._id }));
  const questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });
  const reportAnalytics = buildReportAnalytics({
    interview,
    questions,
    answers: completedAnswers,
  });
  const average = Math.round(reportAnalytics.averageScore);

  let recommendation = 'Keep practicing consistently across your selected skills.';
  if (average >= 80) recommendation = 'Strong performance — try harder difficulty next session.';
  else if (average < 50) recommendation = 'Focus on fundamentals and review weak skill areas.';

  let overallFeedback = reportAnalytics.averageScore >= 80
    ? 'Strong overall performance. Keep building depth with production examples and trade-off discussions.'
    : reportAnalytics.averageScore < 50
      ? 'Review the fundamentals in the recommended topics, then practice explaining each concept with a small example.'
      : 'You have a developing foundation. Strengthen the recommended topics and make each answer more precise with implementation examples.';
  let overallFeedbackStatus = 'failed';
  try {
    const feedbackResult = await generateOverallFeedback({
      jobRole: interview.jobRole,
      overallScore: reportAnalytics.overallScore,
      skillAnalysis: reportAnalytics.skillAnalysis,
      strengths: reportAnalytics.strengths,
      weaknesses: reportAnalytics.weaknesses,
      recommendedTopics: reportAnalytics.recommendedTopics,
    });
    overallFeedback = feedbackResult.feedback || overallFeedback;
    overallFeedbackStatus = feedbackResult.status === 'completed' ? 'completed' : 'failed';
  } catch (error) {
    // Report generation must never make a completed interview unavailable.
    console.warn(`[interviewService] Overall feedback failed; using safe fallback: ${error.message}`);
  }

  interview.status = 'completed';
  interview.completedAt = interview.completedAt || new Date();
  interview.completedQuestions = completedAnswers.length;
  interview.scoreAverage = average;
  interview.summary = {
    strengths: reportAnalytics.strengths,
    weaknesses: reportAnalytics.weaknesses,
    recommendation,
    recommendedTopics: reportAnalytics.recommendedTopics,
    overallFeedback,
    overallFeedbackStatus,
  };
  await interview.save();

  return buildReport(interview, completedAnswers);
}

async function buildReport(interview, answers) {
  const questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });
  const reportAnswers = Array.isArray(answers)
    ? answers
    : await Answer.find({ interviewId: interview._id }).sort({ submittedAt: 1 });
  const answerByQuestion = new Map(reportAnswers.map((answer) => [String(answer.questionId), answer]));
  const reportAnalytics = buildReportAnalytics({
    interview,
    questions,
    answers: reportAnswers,
  });

  return {
    interviewId: interview._id,
    jobRole: interview.jobRole,
    skills: interview.skills,
    overallScore: reportAnalytics.overallScore,
    scoreAverage: reportAnalytics.overallScore,
    averageScore: reportAnalytics.averageScore,
    questionCount: reportAnalytics.questionCount,
    numberOfQuestions: reportAnalytics.questionCount,
    completedQuestions: reportAnalytics.completedQuestions,
    skillAnalysis: reportAnalytics.skillAnalysis,
    questionAnalysis: reportAnalytics.questionAnalysis,
    summary: interview.summary,
    strengths: reportAnalytics.strengths,
    weaknesses: reportAnalytics.weaknesses,
    recommendedTopics: interview.summary?.recommendedTopics?.length
      ? interview.summary.recommendedTopics
      : reportAnalytics.recommendedTopics,
    overallFeedback: interview.summary?.overallFeedback ||
      'Overall feedback is not available for this report yet.',
    completedAt: interview.completedAt,
    difficultyProgression: serializeDifficultyProgression(interview, questions, reportAnswers),
    questions: questions.map((question) => {
      const answer = answerByQuestion.get(String(question._id));
      return {
        order: question.order,
        topic: question.topic,
        skill: question.topic,
        difficulty: question.difficulty,
        questionText: question.questionText,
        text: question.questionText,
        score: answer?.score ?? null,
        userAnswer: answer?.userAnswer ?? null,
        evaluation: answer
          ? {
              status: answer.evaluationStatus || 'completed',
              ...serializeEvaluation(answer.evaluation),
            }
          : null,
        evaluationStatus: answer?.evaluationStatus || null,
        feedback: answer ? serializeEvaluation(answer.evaluation).feedback : null,
        strengths: answer ? serializeEvaluation(answer.evaluation).strengths : [],
        weaknesses: answer ? serializeEvaluation(answer.evaluation).weaknesses : [],
        improvementSuggestion: answer
          ? serializeEvaluation(answer.evaluation).improvementSuggestion
          : null,
      };
    }),
  };
}

function serializeDifficultyProgression(interview, questions, answers = []) {
  const storedProgression = Array.isArray(interview.difficultyProgression)
    ? interview.difficultyProgression
    : [];
  const storedByOrder = new Map(
    storedProgression.map((entry) => [entry.order, entry])
  );
  const answerByQuestion = new Map(
    answers.map((answer) => [String(answer.questionId), answer])
  );

  return questions.map((question) => {
    const stored = storedByOrder.get(question.order);
    const answer = answerByQuestion.get(String(question._id));
    const difficulty = question.difficulty ?? stored?.difficulty;
    return {
      order: question.order,
      topic: question.topic ?? stored?.topic,
      difficulty,
      difficultyLabel: difficultyLabel(difficulty),
      score: answer?.score ?? stored?.score ?? null,
    };
  });
}

async function getReport(interviewId, userId) {
  const interview = await getInterviewForUser(interviewId, userId);
  if (interview.status !== 'completed') {
    throw new AppError('Report available only after interview completion.', 400);
  }
  const answers = await Answer.find({ interviewId: interview._id }).sort({ submittedAt: 1 });
  return buildReport(interview, answers);
}

async function getInterviewDetail(interviewId, userId, userRole) {
  const interview = await getInterviewForUser(interviewId, userId, {
    allowAdmin: true,
    userRole,
  });
  const questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });
  const { answeredQuestionIds } = await getAnswerState(interview._id);
  const answers = await Answer.find({ interviewId: interview._id }).sort({ submittedAt: 1 });
  return {
    interview,
    questions: questions.map((question) => serializeQuestion(question, answeredQuestionIds)),
    answers: answers.map((answer) => ({
      _id: answer._id,
      interviewId: answer.interviewId,
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      score: answer.score,
      evaluation: {
        status: answer.evaluationStatus || 'completed',
        ...serializeEvaluation(answer.evaluation),
      },
      evaluationStatus: answer.evaluationStatus || 'completed',
      submittedAt: answer.submittedAt,
    })),
  };
}

function serializeEvaluation(evaluation) {
  const source = evaluation && typeof evaluation === 'object' ? evaluation : {};
  const legacyFeedback = typeof evaluation === 'string' ? evaluation : '';
  return {
    correctness: Number.isFinite(source.correctness) ? source.correctness : null,
    relevance: Number.isFinite(source.relevance) ? source.relevance : null,
    technicalDepth: Number.isFinite(source.technicalDepth) ? source.technicalDepth : null,
    clarity: Number.isFinite(source.clarity) ? source.clarity : null,
    completeness: Number.isFinite(source.completeness) ? source.completeness : null,
    feedback: String(source.feedback || legacyFeedback || ''),
    strengths: Array.isArray(source.strengths) ? source.strengths.map(String) : [],
    weaknesses: Array.isArray(source.weaknesses) ? source.weaknesses.map(String) : [],
    improvementSuggestion: String(source.improvementSuggestion || ''),
  };
}

function uniqueEvaluationItems(answers, field) {
  return [...new Set(
    answers.flatMap((answer) => {
      const evaluation = serializeEvaluation(answer.evaluation);
      return evaluation[field];
    })
  )].slice(0, 5);
}

async function updateSkillPerformance(userId, skill, score, interviewId, difficulty) {
  let record = await SkillPerformance.findOne({
    skill,
    $or: [{ user: userId }, { userId }],
  });
  if (!record) {
    record = new SkillPerformance({ user: userId, userId, skill });
  }

  const attempts = record.attempts + 1;
  record.averageScore = Math.round(
    (record.averageScore * record.attempts + score) / attempts
  );
  record.attempts = attempts;
  record.bestScore = Math.max(Number(record.bestScore) || 0, score);
  record.userId = record.userId || userId;
  record.lastDifficulty = difficulty;
  record.history.push({ interview: interviewId, score, date: new Date() });
  if (record.history.length > 50) record.history = record.history.slice(-50);
  await record.save();
}

module.exports = {
  createInterview,
  listInterviews,
  startInterview,
  getInterviewQuestions,
  submitAnswer,
  getReport,
  getInterviewDetail,
};

const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { difficultyLabel } = require('./adaptiveService');

function roundScore(value) {
  const number = numericScore(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : null;
}

function getFiniteScores(answers = []) {
  return answers
    .map((answer) => numericScore(answer.score))
    .filter((score) => score !== null);
}

function average(scores) {
  return scores.length
    ? roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
}

function serializeEvaluation(evaluation) {
  const source = evaluation && typeof evaluation === 'object' ? evaluation : {};
  return {
    feedback: String(source.feedback || ''),
    strengths: Array.isArray(source.strengths) ? source.strengths.map(String) : [],
    weaknesses: Array.isArray(source.weaknesses) ? source.weaknesses.map(String) : [],
    improvementSuggestion: String(source.improvementSuggestion || ''),
  };
}

function groupSkillScores(questions = [], answers = []) {
  const answerByQuestion = new Map(
    answers.map((answer) => [String(answer.questionId), answer])
  );
  const grouped = new Map();

  questions.forEach((question) => {
    const skill = String(question.topic || 'General').trim() || 'General';
    const answer = answerByQuestion.get(String(question._id));
    const existing = grouped.get(skill) || { skill, scores: [], attempts: 0, bestScore: null };
    existing.attempts += answer ? 1 : 0;
    const score = numericScore(answer?.score);
    if (score !== null) {
      existing.scores.push(score);
      existing.bestScore = existing.bestScore === null ? score : Math.max(existing.bestScore, score);
    }
    grouped.set(skill, existing);
  });

  return grouped;
}

function buildSkillAnalysis(questions = [], answers = []) {
  return [...groupSkillScores(questions, answers).values()].map((item) => ({
    skill: item.skill,
    attempts: item.attempts,
    averageScore: average(item.scores),
    bestScore: roundScore(item.bestScore),
  }));
}

function buildQuestionAnalysis(questions = [], answers = []) {
  const answerByQuestion = new Map(
    answers.map((answer) => [String(answer.questionId), answer])
  );

  return questions.map((question) => {
    const answer = answerByQuestion.get(String(question._id));
    return {
      order: question.order,
      questionId: question._id,
      topic: question.topic,
      skill: question.topic,
      difficulty: question.difficulty,
      difficultyLabel: difficultyLabel(question.difficulty),
      questionText: question.questionText,
      score: numericScore(answer?.score),
      evaluationStatus: answer?.evaluationStatus || null,
      answered: Boolean(answer),
      feedback: answer ? serializeEvaluation(answer.evaluation).feedback : '',
      strengths: answer ? serializeEvaluation(answer.evaluation).strengths : [],
      weaknesses: answer ? serializeEvaluation(answer.evaluation).weaknesses : [],
      improvementSuggestion: answer
        ? serializeEvaluation(answer.evaluation).improvementSuggestion
        : '',
    };
  });
}

function getEvaluationItems(answers = [], field) {
  return [...new Set(
    answers.flatMap((answer) => serializeEvaluation(answer.evaluation)[field])
  )].filter(Boolean).slice(0, 6);
}

function buildRecommendedTopics(skillAnalysis, selectedSkills = []) {
  const weakSkills = skillAnalysis
    .filter((item) => item.averageScore !== null && item.averageScore < 70)
    .sort((a, b) => a.averageScore - b.averageScore)
    .map((item) => item.skill);

  if (weakSkills.length) return [...new Set(weakSkills)].slice(0, 5);
  return selectedSkills.length
    ? [...new Set(selectedSkills.map(String))].slice(0, 3)
    : ['Continue practicing the assessed topics'];
}

function buildReportAnalytics({ interview, questions = [], answers = [] }) {
  const scores = getFiniteScores(answers);
  const skillAnalysis = buildSkillAnalysis(questions, answers);
  const questionAnalysis = buildQuestionAnalysis(questions, answers);
  const difficultyProgression = questionAnalysis.map((question) => ({
    order: question.order,
    topic: question.topic,
    difficulty: question.difficulty,
    difficultyLabel: question.difficultyLabel,
    score: question.score,
  }));
  const strengths = getEvaluationItems(answers, 'strengths');
  const weaknesses = getEvaluationItems(answers, 'weaknesses');
  const scoreAverage = average(scores);

  if (!strengths.length && scoreAverage !== null && scoreAverage >= 70) {
    strengths.push('Demonstrated understanding across the assessed topics');
  }
  if (!weaknesses.length && scoreAverage !== null && scoreAverage < 70) {
    weaknesses.push('Add more detail, examples, and trade-offs to technical answers');
  }

  return {
    overallScore: roundScore(interview?.scoreAverage) ?? scoreAverage ?? 0,
    averageScore: scoreAverage ?? roundScore(interview?.scoreAverage) ?? 0,
    questionCount: questions.length || Number(interview?.questionCount) || 0,
    completedQuestions: answers.length,
    skillAnalysis,
    questionAnalysis,
    difficultyProgression,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    recommendedTopics: buildRecommendedTopics(skillAnalysis, interview?.skills || []),
  };
}

function numericScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function buildHistoricalAnalytics(userId) {
  const allInterviews = await Interview.find({ user: userId }).sort({ createdAt: -1 });
  const completedInterviews = allInterviews.filter((interview) => interview.status === 'completed');
  const entries = await Promise.all(
    completedInterviews.map(async (interview) => {
      const [questions, answers] = await Promise.all([
        Question.find({ interviewId: interview._id }).sort({ order: 1 }),
        Answer.find({ interviewId: interview._id }).sort({ submittedAt: 1 }),
      ]);
      return { interview, questions, answers };
    })
  );

  const groupedSkills = new Map();
  entries.forEach(({ interview, questions, answers }) => {
    groupSkillScores(questions, answers).forEach((item, skill) => {
      const aggregate = groupedSkills.get(skill) || {
        skill,
        scores: [],
        attempts: 0,
        bestScore: null,
        updatedAt: null,
      };
      aggregate.scores.push(...item.scores);
      aggregate.attempts += item.attempts;
      aggregate.bestScore = item.bestScore === null
        ? aggregate.bestScore
        : aggregate.bestScore === null
          ? item.bestScore
          : Math.max(aggregate.bestScore, item.bestScore);
      const completedAt = interview.completedAt;
      if (completedAt && (!aggregate.updatedAt || new Date(completedAt) > new Date(aggregate.updatedAt))) {
        aggregate.updatedAt = completedAt;
      }
      groupedSkills.set(skill, aggregate);
    });
  });

  const skillPerformance = [...groupedSkills.values()]
    .map((item) => ({
      skill: item.skill,
      attempts: item.attempts,
      averageScore: average(item.scores) ?? 0,
      bestScore: roundScore(item.bestScore) ?? 0,
      updatedAt: item.updatedAt,
    }))
    .sort((a, b) => b.averageScore - a.averageScore || a.skill.localeCompare(b.skill));

  const completedScores = entries
    .map(({ interview, answers }) => {
      const score = numericScore(interview.scoreAverage);
      return score !== null ? score : average(getFiniteScores(answers));
    })
    .filter((score) => score !== null);
  const orderedEntries = entries
    .slice()
    .sort((a, b) => new Date(a.interview.completedAt || a.interview.createdAt) - new Date(b.interview.completedAt || b.interview.createdAt));
  const trendScores = orderedEntries
    .map(({ interview, answers }) => {
      const score = numericScore(interview.scoreAverage);
      return score !== null ? score : average(getFiniteScores(answers));
    })
    .filter((score) => score !== null);
  const firstScore = trendScores[0] ?? null;
  const lastScore = trendScores[trendScores.length - 1] ?? null;
  const improvementValue = firstScore === null || lastScore === null
    ? 0
    : roundScore(lastScore - firstScore);

  const recentInterviews = allInterviews.slice(0, 10).map((interview) => ({
    _id: interview._id,
    jobRole: interview.jobRole,
    interviewType: interview.interviewType || 'technical',
    skills: interview.skills,
    status: interview.status,
    scoreAverage: interview.scoreAverage,
    questionCount: interview.questionCount,
    numberOfQuestions: interview.questionCount,
    completedQuestions: interview.completedQuestions || 0,
    completedAt: interview.completedAt,
    createdAt: interview.createdAt,
  }));

  return {
    allInterviews,
    completedInterviews,
    stats: {
      totalInterviews: allInterviews.length,
      completedInterviews: completedInterviews.length,
      averageScore: average(completedScores) ?? 0,
      bestScore: completedScores.length ? Math.max(...completedScores) : 0,
      strongestSkill: skillPerformance[0]?.skill || '—',
      weakestSkill: skillPerformance.length ? skillPerformance[skillPerformance.length - 1].skill : '—',
      improvementTrend: {
        value: improvementValue,
        direction: improvementValue > 0 ? 'up' : improvementValue < 0 ? 'down' : 'flat',
        firstScore,
        lastScore,
      },
      improvementTrendValue: improvementValue,
    },
    performanceOverTime: orderedEntries
      .map(({ interview, answers }) => {
        const score = numericScore(interview.scoreAverage);
        const resolvedScore = score !== null ? score : average(getFiniteScores(answers));
        return resolvedScore === null
          ? null
          : {
              interviewId: interview._id,
              date: interview.completedAt || interview.createdAt,
              score: resolvedScore,
              jobRole: interview.jobRole,
            };
      })
      .filter(Boolean),
    skillPerformance,
    recentInterviews,
  };
}

module.exports = {
  average,
  buildSkillAnalysis,
  buildQuestionAnalysis,
  buildRecommendedTopics,
  buildReportAnalytics,
  buildHistoricalAnalytics,
};

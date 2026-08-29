const DIFFICULTY = { EASY: 1, MEDIUM: 2, HARD: 3 };
const RECENT_SCORE_LIMIT = 3;

/**
 * The adaptive engine is deliberately deterministic and database-free.
 * InterviewService supplies persisted answers/questions and owns all writes.
 */

function getEvaluatedAnswers(answers = []) {
  return answers.filter((answer) => {
    const score = Number(answer?.score ?? answer);
    const status = answer?.evaluationStatus;
    const legacyEvaluation = typeof answer?.evaluation === 'string';
    return Number.isFinite(score) && (status !== 'pending' || legacyEvaluation);
  });
}

function getRecentScores(answersOrScores = [], limit = RECENT_SCORE_LIMIT) {
  const values = answersOrScores.map((item) => Number(item?.score ?? item));
  return values
    .filter(Number.isFinite)
    .slice(-Math.max(1, Number(limit) || RECENT_SCORE_LIMIT));
}

function calculateRecentAverage(answersOrScores = [], limit = RECENT_SCORE_LIMIT) {
  const scores = getRecentScores(answersOrScores, limit);
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/** Apply the global score rules to at most the last three evaluated scores. */
function computeNextDifficulty(currentDifficulty, recentScores = []) {
  const current = clampDifficulty(currentDifficulty);
  const scores = getRecentScores(recentScores, RECENT_SCORE_LIMIT);
  if (scores.length === 0) return current;

  const recentAverage = calculateRecentAverage(scores, RECENT_SCORE_LIMIT);
  if (recentAverage >= 80) return clampDifficulty(current + 1);
  if (recentAverage < 50) return clampDifficulty(current - 1);
  return current;
}

function getTopicPerformance(answers = [], topic, limit = RECENT_SCORE_LIMIT) {
  const normalizedTopic = normalizeTopic(topic);
  const topicAnswers = getEvaluatedAnswers(answers).filter(
    (answer) => normalizeTopic(answer.topic) === normalizedTopic
  );
  const scores = getRecentScores(topicAnswers, limit);
  return {
    topic: topic || '',
    count: topicAnswers.length,
    scores,
    average: calculateRecentAverage(scores, limit),
    latestScore: scores.length ? scores[scores.length - 1] : null,
  };
}

function buildTopicPerformance(answers = [], skills = []) {
  const topics = normalizeSkills(skills);
  return topics.reduce((result, topic) => {
    result[topic] = getTopicPerformance(answers, topic);
    return result;
  }, {});
}

/**
 * Prefer a topic with recent poor performance so the candidate gets more
 * fundamentals there. Otherwise retain the predictable selected-skill order.
 */
function selectNextTopic({ skills = [], order = 1, answers = [] } = {}) {
  const topics = normalizeSkills(skills);
  if (topics.length === 0) return '';

  const performance = topics.map((topic, index) => ({
    topic,
    index,
    stats: getTopicPerformance(answers, topic),
  }));
  const weakTopics = performance
    .filter(({ stats }) =>
      stats.average !== null && (stats.average < 50 || stats.latestScore < 50)
    )
    .sort((left, right) =>
      Number(left.stats.average >= 50) - Number(right.stats.average >= 50) ||
      left.stats.average - right.stats.average ||
      left.stats.count - right.stats.count ||
      left.index - right.index
    );

  if (weakTopics.length > 0) return weakTopics[0].topic;
  return topics[(Math.max(1, Number(order) || 1) - 1) % topics.length];
}

function getTopicDifficulty(topicDifficulties = [], topic, fallbackDifficulty = DIFFICULTY.MEDIUM) {
  const normalizedTopic = normalizeTopic(topic);
  const entry = Array.isArray(topicDifficulties)
    ? topicDifficulties.find((item) => normalizeTopic(item?.topic) === normalizedTopic)
    : topicDifficulties?.[topic];
  return clampDifficulty(entry?.difficulty ?? fallbackDifficulty);
}

function setTopicDifficulty(topicDifficulties = [], topic, difficulty) {
  const normalizedTopic = String(topic || '').trim();
  if (!normalizedTopic) return topicDifficulties;
  const nextDifficulty = clampDifficulty(difficulty);
  const entries = Array.isArray(topicDifficulties) ? topicDifficulties : [];
  const existing = entries.find(
    (item) => normalizeTopic(item?.topic) === normalizeTopic(normalizedTopic)
  );
  if (existing) {
    existing.topic = normalizedTopic;
    existing.difficulty = nextDifficulty;
  } else {
    entries.push({ topic: normalizedTopic, difficulty: nextDifficulty });
  }
  return entries;
}

/**
 * Decide the difficulty for the next selected topic.
 *
 * A topic with its own history uses its own recent scores, which prevents a
 * poor DSA result from reducing an otherwise untested or strong JavaScript
 * topic. For a new topic, a strong global run may raise its baseline, while a
 * poor result is not propagated into that topic until it has evidence of its
 * own difficulty.
 */
function computeAdaptiveDecision({
  currentDifficulty,
  nextTopic,
  answeredTopic,
  answers = [],
  topicDifficulties = [],
} = {}) {
  const evaluatedAnswers = getEvaluatedAnswers(answers);
  const recentScores = getRecentScores(evaluatedAnswers);
  const recentAverage = calculateRecentAverage(recentScores);
  const globalNextDifficulty = computeNextDifficulty(currentDifficulty, recentScores);
  const topicPerformance = getTopicPerformance(evaluatedAnswers, nextTopic);
  const answeredTopicPerformance = getTopicPerformance(evaluatedAnswers, answeredTopic);
  const answeredTopicDifficulty = getTopicDifficulty(
    topicDifficulties,
    answeredTopic,
    currentDifficulty
  );
  const nextTopicBaseline = getTopicDifficulty(
    topicDifficulties,
    nextTopic,
    currentDifficulty
  );

  let updatedAnsweredTopicDifficulty = answeredTopicDifficulty;
  if (answeredTopicPerformance.count > 0) {
    updatedAnsweredTopicDifficulty = computeTopicDifficulty(
      answeredTopicDifficulty,
      answeredTopicPerformance
    );
  }

  let nextDifficulty = nextTopicBaseline;
  let reason = 'topic baseline maintained';
  if (topicPerformance.count > 0) {
    nextDifficulty = computeTopicDifficulty(nextTopicBaseline, topicPerformance);
    reason = topicPerformance.average < 50
      ? 'topic performance below 50'
      : topicPerformance.average >= 80
        ? 'topic performance at or above 80'
        : 'topic performance maintained';
  } else if (recentAverage !== null && recentAverage >= 80) {
    nextDifficulty = clampDifficulty(nextTopicBaseline + 1);
    reason = 'global recent average at or above 80';
  } else if (recentAverage !== null && recentAverage < 50) {
    // Do not spread a weak skill result to a topic without evidence of its
    // own performance. Its initialized topic difficulty is safer.
    reason = 'new topic protected from another topic\'s low score';
  } else if (globalNextDifficulty !== currentDifficulty) {
    nextDifficulty = globalNextDifficulty;
    reason = 'global recent average adjusted difficulty';
  }

  // When the candidate reaches Hard and the latest answer is poor, step down
  // for the next question even if older scores keep the three-answer average
  // in the neutral band. This gives the engine a deterministic recovery step
  // for the documented 90, 85, 40 progression.
  if (
    topicPerformance.count > 0 &&
    topicPerformance.latestScore < 50 &&
    nextTopicBaseline === DIFFICULTY.HARD &&
    nextDifficulty === DIFFICULTY.HARD
  ) {
    nextDifficulty = DIFFICULTY.MEDIUM;
    reason = 'latest topic result below 50; recovery step from Hard';
  }

  return {
    currentDifficulty: clampDifficulty(currentDifficulty),
    nextDifficulty: clampDifficulty(nextDifficulty),
    recentScores,
    recentAverage,
    globalNextDifficulty,
    nextTopic,
    topicPerformance,
    answeredTopicPerformance,
    updatedAnsweredTopicDifficulty: clampDifficulty(updatedAnsweredTopicDifficulty),
    reason,
  };
}

function computeTopicDifficulty(currentDifficulty, performance) {
  const base = computeNextDifficulty(currentDifficulty, performance.scores);
  if (
    performance.latestScore < 50 &&
    currentDifficulty === DIFFICULTY.HARD &&
    base === DIFFICULTY.HARD
  ) {
    return DIFFICULTY.MEDIUM;
  }
  return base;
}

function clampDifficulty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DIFFICULTY.MEDIUM;
  return Math.min(DIFFICULTY.HARD, Math.max(DIFFICULTY.EASY, Math.round(numeric)));
}

function difficultyLabel(value) {
  const map = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
  return map[clampDifficulty(value)];
}

function normalizeSkills(skills = []) {
  const source = Array.isArray(skills) ? skills : [skills];
  const seen = new Set();
  return source
    .map((skill) => String(skill || '').trim())
    .filter((skill) => {
      const key = normalizeTopic(skill);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeTopic(topic) {
  return String(topic || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

module.exports = {
  DIFFICULTY,
  RECENT_SCORE_LIMIT,
  buildTopicPerformance,
  calculateRecentAverage,
  clampDifficulty,
  computeAdaptiveDecision,
  computeNextDifficulty,
  difficultyLabel,
  getEvaluatedAnswers,
  getRecentScores,
  getTopicDifficulty,
  getTopicPerformance,
  normalizeSkills,
  selectNextTopic,
  setTopicDifficulty,
};

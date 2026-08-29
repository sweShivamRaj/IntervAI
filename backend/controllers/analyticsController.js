const { asyncHandler } = require('../middleware/errorMiddleware');
const { buildHistoricalAnalytics } = require('../services/analyticsService');

/*
 * Analytics are calculated from completed interview answers so an abandoned
 * session cannot inflate a candidate's historical skill performance.
 */
const dashboard = asyncHandler(async (req, res) => {
  const analytics = await buildHistoricalAnalytics(req.user._id);
  const { allInterviews, completedInterviews, ...publicAnalytics } = analytics;
  res.json(publicAnalytics);
});

/* GET /api/analytics/overview (compatibility endpoint) */
const overview = asyncHandler(async (req, res) => {
  const analytics = await buildHistoricalAnalytics(req.user._id);
  const recent = analytics.recentInterviews
    .filter((interview) => interview.status === 'completed')
    .map((interview) => ({
      id: interview._id,
      jobRole: interview.jobRole,
      scoreAverage: interview.scoreAverage,
      completedAt: interview.completedAt,
    }));

  res.json({
    totalCompleted: analytics.stats.completedInterviews,
    averageScore: analytics.stats.averageScore,
    recent,
    performanceOverTime: analytics.performanceOverTime,
    improvementTrend: analytics.stats.improvementTrend,
    stats: analytics.stats,
  });
});

/* GET /api/analytics/skills */
const skills = asyncHandler(async (req, res) => {
  const analytics = await buildHistoricalAnalytics(req.user._id);
  res.json({ skills: analytics.skillPerformance });
});

module.exports = { dashboard, overview, skills };

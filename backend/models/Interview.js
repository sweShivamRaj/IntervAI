const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
  {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendation: { type: String, default: '' },
    recommendedTopics: [{ type: String }],
    overallFeedback: { type: String, default: '' },
    overallFeedbackStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { _id: false }
);

const topicDifficultySchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
  },
  { _id: false }
);

const difficultyProgressionSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 1 },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
    score: { type: Number, min: 0, max: 100, default: null },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobRole: { type: String, required: true, trim: true },
    interviewType: {
      type: String,
      enum: ['technical', 'behavioral', 'mixed'],
      default: 'technical',
    },
    skills: {
      type: [{ type: String, trim: true }],
      validate: [(v) => v.length > 0, 'At least one skill is required'],
    },
    status: {
      type: String,
      enum: ['created', 'setup', 'in_progress', 'completed'],
      default: 'created',
    },
    initialDifficulty: {
      type: String,
      enum: ['adaptive', 'easy', 'medium', 'hard'],
      default: 'adaptive',
    },
    currentDifficulty: { type: Number, min: 1, max: 3, default: 2 },
    topicDifficulties: { type: [topicDifficultySchema], default: [] },
    difficultyProgression: { type: [difficultyProgressionSchema], default: [] },
    questionCount: { type: Number, min: 3, max: 15, default: 5 },
    completedQuestions: { type: Number, default: 0 },
    scoreAverage: { type: Number, min: 0, max: 100, default: null },
    summary: { type: summarySchema, default: () => ({}) },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

interviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Interview', interviewSchema);

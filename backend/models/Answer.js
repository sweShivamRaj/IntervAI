const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      unique: true,
      index: true,
    },
    userAnswer: { type: String, required: true, trim: true },
    // A score can be unavailable while a provider failure is being recorded.
    // The interview answer is persisted independently of its evaluation.
    score: { type: Number, default: null, min: 0, max: 100 },
    // Mixed keeps legacy string evaluations readable while new submissions
    // store the validated structured evaluation object from evaluationService.
    evaluation: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

answerSchema.index({ interviewId: 1, submittedAt: 1 });

module.exports = mongoose.model('Answer', answerSchema);

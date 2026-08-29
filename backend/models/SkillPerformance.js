const mongoose = require('mongoose');

const historyItemSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    score: { type: Number, min: 0, max: 100 },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const skillPerformanceSchema = new mongoose.Schema(
  {
    // user is retained for compatibility with existing records and queries.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    skill: { type: String, required: true, trim: true },
    attempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, min: 0, max: 100, default: 0 },
    lastDifficulty: { type: Number, min: 1, max: 3, default: 2 },
    history: { type: [historyItemSchema], default: [] },
  },
  { timestamps: true }
);

skillPerformanceSchema.index({ user: 1, skill: 1 }, { unique: true });

skillPerformanceSchema.pre('validate', function syncUserIds() {
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;
  if (!this.user && !this.userId) {
    throw new Error('A userId is required for skill performance.');
  }
});

module.exports = mongoose.model('SkillPerformance', skillPerformanceSchema);

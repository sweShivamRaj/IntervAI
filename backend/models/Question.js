const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionText: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
    questionType: { type: String, trim: true, default: 'conceptual' },
    expectedConcepts: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    order: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

questionSchema.index({ interviewId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);

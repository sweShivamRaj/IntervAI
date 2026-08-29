const mongoose = require('mongoose');

const fallbackQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 600,
      unique: true,
    },
    topic: { type: String, required: true, trim: true, maxlength: 80 },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
    questionType: {
      type: String,
      enum: ['conceptual', 'scenario', 'coding', 'design'],
      default: 'conceptual',
    },
    expectedConcepts: {
      type: [{ type: String, trim: true, maxlength: 100 }],
      validate: [(value) => value.length > 0, 'At least one expected concept is required'],
    },
  },
  { timestamps: true, versionKey: false }
);

fallbackQuestionSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.model('FallbackQuestion', fallbackQuestionSchema);

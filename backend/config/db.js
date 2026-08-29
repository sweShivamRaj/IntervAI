const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const { seedFallbackQuestions } = require('../services/fallbackQuestionService');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });
  await removeLegacyInterviewIndexes();
  try {
    await seedFallbackQuestions();
  } catch (error) {
    console.warn(`Fallback question seed skipped: ${error.message}`);
  }
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

async function removeLegacyInterviewIndexes() {
  // Question and Answer field names changed in Phase 4. Remove indexes left by
  // the earlier schema so old null-valued fields cannot block new documents.
  const legacyIndexes = [
    ['questions', 'interview_1_order_1'],
    ['answers', 'question_1'],
  ];

  for (const [collectionName, indexName] of legacyIndexes) {
    try {
      await mongoose.connection.db.collection(collectionName).dropIndex(indexName);
    } catch (error) {
      if (!['IndexNotFound', 'NamespaceNotFound'].includes(error.codeName)) {
        throw error;
      }
    }
  }
}

module.exports = { connectDB };

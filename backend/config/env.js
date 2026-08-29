require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adaptive_interview',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 15000,
    maxRetries: Number(process.env.AI_MAX_RETRIES) || 2,
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@interview.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
};

const WEAK_SECRETS = new Set([
  'change_this_to_a_long_random_secret',
  'dev_only_change_me',
  'secret',
  'jwt_secret',
  'changeme',
]);

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}. Copy backend/.env.example to backend/.env.`);
    process.exit(1);
  }

  const jwtSecret = String(process.env.JWT_SECRET).trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (jwtSecret.length < 32 || WEAK_SECRETS.has(jwtSecret.toLowerCase())) {
      console.error('JWT_SECRET is missing or too weak for production. Use at least 32 random characters.');
      process.exit(1);
    }
  } else if (jwtSecret.length < 16 || WEAK_SECRETS.has(jwtSecret.toLowerCase())) {
    console.warn('JWT_SECRET looks weak. Generate a long random value before any shared or production use.');
  }

  if (isProduction && (!process.env.AI_API_KEY || String(process.env.AI_PROVIDER).toLowerCase() === 'mock')) {
    console.info('Production is running without a live AI provider. Fallback questions and evaluations will be used.');
  }

  console.info('AI question generation is backend-configured; fallback questions are used when unavailable.');
}

module.exports = { validateEnv };

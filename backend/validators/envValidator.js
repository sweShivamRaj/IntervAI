/**
 * Lightweight env validation for Phase 1 setup.
 * Does not fail the process for optional AI keys.
 */
function validateEnv() {
  const required = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

  if (missing.length > 0) {
    console.warn(
      `Warning: missing env vars (${missing.join(', ')}). Defaults may be used. See backend/.env.example.`
    );
  }

  console.info('AI question generation is backend-configured; fallback questions are used when unavailable.');
}

module.exports = { validateEnv };

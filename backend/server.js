const app = require('./app');
const { connectDB } = require('./config/db');
const { port } = require('./config/env');
const { validateEnv } = require('./validators/envValidator');

async function start() {
  validateEnv();

  try {
    await connectDB();
  } catch (err) {
    console.warn(`MongoDB connection failed: ${err.message}`);
    console.warn('API is starting anyway. /api/health will work; DB routes need MongoDB.');
  }

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

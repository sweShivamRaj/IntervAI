const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const { clientUrl, isProduction, nodeEnv } = require('./config/env');
const { notFound, errorHandler, AppError } = require('./middleware/errorMiddleware');
const { requireDatabase } = require('./middleware/dbMiddleware');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const questionRoutes = require('./routes/questionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const metaRoutes = require('./routes/metaRoutes');

const app = express();

app.disable('x-powered-by');
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = String(clientUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait and try again.' },
  skip: () => nodeEnv === 'test',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait and try again.' },
  skip: () => nodeEnv === 'test',
});

app.use('/api', healthRoutes);
app.use('/api/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    message: dbReady ? 'Database connected' : 'Database not connected',
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api', metaRoutes);
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/profile', requireDatabase, profileRoutes);
app.use('/api/interviews', requireDatabase, interviewRoutes);
app.use('/api/questions', requireDatabase, questionRoutes);
app.use('/api/analytics', requireDatabase, analyticsRoutes);
app.use('/api/admin', requireDatabase, adminRoutes);

app.use(notFound);
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return errorHandler(new AppError('Origin not allowed.', 403, 'CORS'), req, res, next);
  }
  return errorHandler(err, req, res, next);
});

module.exports = app;

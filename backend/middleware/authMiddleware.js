const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const { AppError, asyncHandler } = require('./errorMiddleware');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw new AppError('Not authorized. Token missing.', 401, 'TOKEN_MISSING');
  }

  if (!jwtSecret) {
    throw new AppError('Authentication is not configured.', 503, 'AUTH_MISCONFIGURED');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please sign in again.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Not authorized. Invalid token.', 401, 'TOKEN_INVALID');
  }

  if (!decoded?.id) {
    throw new AppError('Not authorized. Invalid token.', 401, 'TOKEN_INVALID');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Not authorized. Invalid token.', 401, 'TOKEN_INVALID');
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden. Insufficient permissions.', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { protect, authorize };

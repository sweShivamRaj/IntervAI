const mongoose = require('mongoose');
const { AppError } = require('./errorMiddleware');

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(
      new AppError('Service temporarily unavailable. Please try again.', 503, 'DB_UNAVAILABLE')
    );
  }
  next();
}

module.exports = { requireDatabase };

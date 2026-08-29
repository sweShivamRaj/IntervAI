class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[errorHandler]', err.message);
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.code ? { code: err.code } : {}),
  });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };

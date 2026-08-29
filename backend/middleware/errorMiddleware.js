class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  next(new AppError('Route not found.', 404, 'NOT_FOUND'));
}

function publicErrorMessage(err) {
  if (err.name === 'CastError') {
    return { status: 400, message: 'Invalid identifier.', code: 'INVALID_ID' };
  }
  if (err.name === 'ValidationError') {
    return { status: 400, message: 'Invalid request data.', code: 'VALIDATION_ERROR' };
  }
  if (err.code === 11000) {
    return { status: 400, message: 'That value is already in use.', code: 'DUPLICATE' };
  }
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return { status: 400, message: 'Invalid JSON in request body.', code: 'INVALID_JSON' };
  }

  const status = err.statusCode || 500;
  if (err instanceof AppError && status < 500) {
    return { status, message: err.message || 'Request failed.', code: err.code };
  }
  if (err instanceof AppError && status === 503) {
    return { status, message: err.message || 'Service temporarily unavailable.', code: err.code };
  }

  return {
    status: status >= 400 ? status : 500,
    message: 'Something went wrong. Please try again.',
    code: err.code && status < 500 ? err.code : 'INTERNAL_ERROR',
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const { status, message, code } = publicErrorMessage(err);

  if (status >= 500) {
    console.error('[errorHandler]', err.message);
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };

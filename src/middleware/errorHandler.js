/**
 * Global error handler middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Database constraint violation (unique, not null, etc.)
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.*?)\)/)?.[1] || 'field';
    return res.status(409).json({
      error: `${field} already exists or violates unique constraint`,
    });
  }

  // Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Invalid reference to related data',
    });
  }

  // Not null violation
  if (err.code === '23502') {
    const column = err.detail?.match(/column "(.*?)"/)?.[1] || 'field';
    return res.status(400).json({
      error: `${column} is required`,
    });
  }

  // Invalid input
  if (err.code === '22P02' || err.code === '22001') {
    return res.status(400).json({
      error: 'Invalid input format',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err }),
  });
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};

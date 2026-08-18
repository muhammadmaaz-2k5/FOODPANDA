const { errorResponse } = require('../utils/response.util');

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Prisma Known Request Error
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target || 'field';
        return errorResponse(res, `A unique constraint failed on: ${target}`, 409);
      }
      case 'P2025':
        return errorResponse(res, 'Record requested for operation does not exist', 404);
      case 'P2003':
        return errorResponse(res, 'Foreign key constraint violated', 400);
      default:
        return errorResponse(res, `Database error: ${err.message}`, 400);
    }
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Uploaded file exceeds 10MB size limit', 400);
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;

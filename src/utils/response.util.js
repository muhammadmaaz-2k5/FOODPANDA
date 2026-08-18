/**
 * Standard Success Response Helper
 * @param {Response} res 
 * @param {string} message 
 * @param {*} data 
 * @param {number} statusCode 
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard Paginated Response Helper
 * @param {Response} res 
 * @param {string} message 
 * @param {Array} data 
 * @param {number} total 
 * @param {number} page 
 * @param {number} limit 
 */
const paginatedResponse = (res, message = 'Success', data = [], total = 0, page = 1, limit = 10) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Standard Error Response Helper
 * @param {Response} res 
 * @param {string} message 
 * @param {number} statusCode 
 * @param {*} errors 
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse,
};

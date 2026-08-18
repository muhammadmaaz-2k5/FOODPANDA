const { errorResponse } = require('../utils/response.util');

/**
 * Require specific Role(s)
 * @param  {...string} allowedRoles 
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized access', 401);
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins bypass all role gates
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

/**
 * Require specific Permission(s)
 * @param  {...string} requiredPermissions 
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized access', 401);
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins bypass all permission checks
    }

    const hasPermission = requiredPermissions.every((perm) =>
      req.user.permissions && req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return errorResponse(
        res,
        `Forbidden. Missing required permissions: [${requiredPermissions.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
};

const prisma = require('../config/database');
const { verifyAccessToken } = require('../utils/token.util');
const { errorResponse } = require('../utils/response.util');

/**
 * Authentication Middleware: Verify JWT and attach user object with roles and permissions to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please refresh your token', 401);
      }
      return errorResponse(res, 'Invalid authentication token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User account not found', 401);
    }

    if (user.status === 'BANNED') {
      return errorResponse(res, 'Your account has been suspended or banned', 403);
    }

    if (user.status === 'PENDING') {
      return errorResponse(res, 'Your account is pending verification', 403);
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed: ' + error.message, 500);
  }
};

/**
 * Optional Authentication Middleware (e.g. for guest viewing with optional personalized experience)
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });
      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role.name,
          roleId: user.roleId,
        };
      }
    }
    next();
  } catch (error) {
    // Continue without req.user for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};

const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { generateAccessToken, generateRefreshToken, hashRefreshToken } = require('../../utils/token.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * Register User (Customer, Restaurant Owner, Rider)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, roleName = 'CUSTOMER' } = req.body;

    if (!email || !password || !firstName) {
      return errorResponse(res, 'Email, password, and first name are required', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 409);
    }

    let role = await prisma.role.findUnique({ where: { name: roleName.toUpperCase() } });
    if (!role) {
      // Fallback or create default role
      role = await prisma.role.create({
        data: {
          name: roleName.toUpperCase(),
          description: `${roleName} default role`,
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        roleId: role.id,
      },
      include: {
        role: true,
      },
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role.name });
    const { token: refreshToken, hash: tokenHash, expiresAt } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return successResponse(
      res,
      'Registration successful',
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role.name,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login User
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (user.status === 'BANNED') {
      return errorResponse(res, 'Account is suspended or banned', 403);
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role.name });
    const { token: refreshToken, hash: tokenHash, expiresAt } = generateRefreshToken();

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return successResponse(res, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => p.permission.key),
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 */
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    // Revoke old token & rotate to a new one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      role: storedToken.user.role.name,
    });
    const { token: newRefreshToken, hash: newHash, expiresAt: newExpiresAt } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newHash,
        expiresAt: newExpiresAt,
      },
    });

    return successResponse(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout User
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        addresses: true,
        rider: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const { passwordHash, ...safeUser } = user;
    return successResponse(res, 'User profile retrieved', safeUser);
  } catch (error) {
    next(error);
  }
};

/**
 * RBAC: Get All Roles & Permissions
 */
const getRolesAndPermissions = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    const permissions = await prisma.permission.findMany();
    return successResponse(res, 'Roles and permissions retrieved', { roles, permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * RBAC: Create Role
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description, permissionKeys = [] } = req.body;
    if (!name) return errorResponse(res, 'Role name is required', 400);

    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description,
      },
    });

    if (permissionKeys.length > 0) {
      for (const key of permissionKeys) {
        let perm = await prisma.permission.findUnique({ where: { key } });
        if (!perm) {
          perm = await prisma.permission.create({ data: { key, description: key } });
        }
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }

    return successResponse(res, 'Role created successfully', role, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  getRolesAndPermissions,
  createRole,
};

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Public Auth Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshTokenHandler);
router.post('/logout', authController.logout);

// Protected Auth Endpoints
router.get('/me', authenticate, authController.getMe);

// RBAC Endpoints (Admin only)
router.get('/roles', authenticate, requireRole('ADMIN'), authController.getRolesAndPermissions);
router.post('/roles', authenticate, requireRole('ADMIN'), authController.createRole);

module.exports = router;

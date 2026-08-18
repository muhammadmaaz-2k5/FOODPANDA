const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// User Profile
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

// User Addresses
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, userController.createAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);

// Admin User Management
router.get('/', authenticate, requireRole('ADMIN'), userController.listUsers);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), userController.updateUserStatus);

module.exports = router;

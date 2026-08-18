const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { optionalAuthenticate, authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

router.get('/', optionalAuthenticate, settingsController.getSettings);
router.post('/', authenticate, requireRole('ADMIN'), settingsController.setSetting);

module.exports = router;

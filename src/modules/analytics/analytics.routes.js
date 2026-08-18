const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

router.use(authenticate);

router.get('/dashboard', requireRole('ADMIN', 'RESTAURANT_OWNER'), analyticsController.getDashboardMetrics);

module.exports = router;

const express = require('express');
const router = express.Router();
const riderController = require('./rider.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

router.use(authenticate);

router.post('/register', riderController.registerRider);
router.get('/profile', requireRole('RIDER', 'ADMIN'), riderController.getRiderProfile);
router.patch('/status', requireRole('RIDER', 'ADMIN'), riderController.updateRiderStatus);
router.post('/location', requireRole('RIDER', 'ADMIN'), riderController.updateLocation);
router.get('/deliveries/available', requireRole('RIDER', 'ADMIN'), riderController.getAvailableDeliveries);
router.post('/deliveries/accept', requireRole('RIDER', 'ADMIN'), riderController.acceptAssignment);
router.patch('/orders/:orderId/pickup', requireRole('RIDER', 'ADMIN'), riderController.markPickedUp);
router.patch('/orders/:orderId/deliver', requireRole('RIDER', 'ADMIN'), riderController.markDelivered);

module.exports = router;

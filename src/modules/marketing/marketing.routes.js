const express = require('express');
const router = express.Router();
const marketingController = require('./marketing.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Public coupons / promotions / banners
router.get('/promotions', optionalAuthenticate, marketingController.getPromotions);
router.get('/banners', optionalAuthenticate, marketingController.getBanners);

// Protected coupon apply
router.post('/coupons/validate', authenticate, marketingController.validateCoupon);

// Management routes
router.get('/coupons', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), marketingController.getCoupons);
router.post('/coupons', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), marketingController.createCoupon);
router.delete('/coupons/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), marketingController.deleteCoupon);
router.post('/promotions', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), marketingController.createPromotion);
router.post('/banners', authenticate, requireRole('ADMIN'), marketingController.createBanner);
router.delete('/banners/:id', authenticate, requireRole('ADMIN'), marketingController.deleteBanner);

module.exports = router;

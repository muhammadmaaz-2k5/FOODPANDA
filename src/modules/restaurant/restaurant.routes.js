const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Public listing, details and categories
router.get('/', optionalAuthenticate, restaurantController.getRestaurants);
router.get('/categories', restaurantController.getRestaurantCategories);
router.get('/delivery-zones', restaurantController.getDeliveryZones);
router.get('/:id', optionalAuthenticate, restaurantController.getRestaurantById);

// Restaurant creation & modification (Admin or Restaurant Owner)
router.post('/categories', authenticate, requireRole('ADMIN'), restaurantController.createRestaurantCategory);
router.post('/', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.createRestaurant);
router.put('/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.updateRestaurant);
router.patch('/:id/status', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.updateRestaurantStatus);

// Staff management
router.get('/:id/staff', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.listStaff);
router.post('/:id/staff', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.addStaff);
router.delete('/:id/staff/:userId', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), restaurantController.removeStaff);

// Delivery Zones (Admin)
router.post('/delivery-zones', authenticate, requireRole('ADMIN'), restaurantController.createDeliveryZone);

module.exports = router;

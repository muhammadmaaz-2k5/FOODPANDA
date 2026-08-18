const express = require('express');
const router = express.Router();
const menuController = require('./menu.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Food Categories
router.get('/restaurants/:restaurantId/categories', menuController.getCategories);
router.post('/categories', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.createCategory);
router.put('/categories/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.updateCategory);
router.delete('/categories/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.deleteCategory);

// Food Items
router.get('/items/:id', optionalAuthenticate, menuController.getFoodItemById);
router.post('/items', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.createFoodItem);
router.put('/items/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.updateFoodItem);
router.patch('/items/:id/status', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.toggleFoodItemStatus);
router.delete('/items/:id', authenticate, requireRole('ADMIN', 'RESTAURANT_OWNER'), menuController.deleteFoodItem);

module.exports = router;

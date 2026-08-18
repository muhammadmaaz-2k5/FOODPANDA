const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');

// Public reviews lookup
router.get('/restaurants/:restaurantId', optionalAuthenticate, reviewController.getRestaurantReviews);

// Protected review & favorite actions
router.post('/', authenticate, reviewController.submitReview);
router.get('/favorites/my', authenticate, reviewController.getFavorites);
router.post('/favorites/:restaurantId', authenticate, reviewController.toggleFavorite);

module.exports = router;

const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');

router.get('/', optionalAuthenticate, searchController.searchFoodAndRestaurants);

module.exports = router;

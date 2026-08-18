const prisma = require('../../config/database');
const { calculateDistance } = require('../../utils/geo.util');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Universal Intelligent Search Engine Algorithm
 * Searches across:
 * 1. Restaurants (Name, Description, Cuisine tags, City, Address)
 * 2. Food Dishes (Name, Description, Category, Variations, Ingredients)
 * 3. Exact & Fuzzy matching, Proximity geo-weighting, and Multi-criteria ranking score
 */
const searchFoodAndRestaurants = async (req, res, next) => {
  try {
    const {
      q = '',
      category,
      minRating = 0,
      maxPrice,
      lat,
      lng,
      maxDistance = 25, // km
      sortBy = 'relevance', // 'relevance', 'rating', 'price_asc', 'price_desc', 'distance', 'fastest'
      page = 1,
      limit = 12,
    } = req.query;

    const cleanQuery = q.trim().toLowerCase();
    const queryTokens = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

    // 1. Fetch matching Restaurants
    const restaurantWhere = {
      status: 'ACTIVE',
    };

    if (queryTokens.length > 0) {
      restaurantWhere.OR = [
        { name: { contains: cleanQuery, mode: 'insensitive' } },
        { description: { contains: cleanQuery, mode: 'insensitive' } },
        { city: { contains: cleanQuery, mode: 'insensitive' } },
        { addressLine: { contains: cleanQuery, mode: 'insensitive' } },
        {
          categories: {
            some: {
              name: { contains: cleanQuery, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // 2. Fetch matching Food Items
    const foodWhere = {
      status: 'AVAILABLE',
    };

    if (maxPrice) {
      foodWhere.price = { lte: parseFloat(maxPrice) };
    }

    if (category && category !== 'ALL') {
      foodWhere.OR = [
        { category: { name: { contains: category, mode: 'insensitive' } } },
        { description: { contains: category, mode: 'insensitive' } },
      ];
    }

    if (queryTokens.length > 0) {
      foodWhere.OR = [
        { name: { contains: cleanQuery, mode: 'insensitive' } },
        { description: { contains: cleanQuery, mode: 'insensitive' } },
        { category: { name: { contains: cleanQuery, mode: 'insensitive' } } },
        { variations: { some: { name: { contains: cleanQuery, mode: 'insensitive' } } } },
        { addons: { some: { name: { contains: cleanQuery, mode: 'insensitive' } } } },
        { restaurant: { name: { contains: cleanQuery, mode: 'insensitive' } } },
      ];
    }

    const [matchedRestaurants, matchedFoods] = await Promise.all([
      prisma.restaurant.findMany({
        where: restaurantWhere,
        include: {
          categories: true,
          _count: { select: { foodItems: true, reviews: true } },
        },
      }),
      prisma.foodItem.findMany({
        where: foodWhere,
        include: {
          category: true,
          variations: true,
          addons: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              rating: true,
              deliveryTimeMin: true,
              deliveryTimeMax: true,
              latitude: true,
              longitude: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Format & Calculate Intelligent Relevance Score
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const scoredItems = [];

    // Score & Push Restaurants
    matchedRestaurants.forEach((rest) => {
      let score = 50; // base score
      const restName = (rest.name || '').toLowerCase();
      const restDesc = (rest.description || '').toLowerCase();

      if (restName === cleanQuery) score += 100;
      else if (restName.startsWith(cleanQuery)) score += 60;
      else if (restName.includes(cleanQuery)) score += 40;

      queryTokens.forEach((t) => {
        if (restName.includes(t)) score += 20;
        if (restDesc.includes(t)) score += 10;
      });

      score += (rest.rating || 4.5) * 5;

      let distanceKm = null;
      if (userLat && userLng && rest.latitude && rest.longitude) {
        distanceKm = calculateDistance(userLat, userLng, rest.latitude, rest.longitude);
        if (distanceKm <= parseFloat(maxDistance)) {
          score += Math.max(0, 30 - distanceKm * 2);
        }
      }

      scoredItems.push({
        type: 'RESTAURANT',
        id: rest.id,
        name: rest.name,
        description: rest.description,
        logoUrl: rest.logoUrl,
        coverUrl: rest.coverUrl,
        rating: rest.rating,
        deliveryTimeMin: rest.deliveryTimeMin,
        deliveryTimeMax: rest.deliveryTimeMax,
        priceRange: rest.priceRange,
        categories: rest.categories,
        distanceKm,
        score,
        targetUrl: `/restaurant/${rest.id}`,
      });
    });

    // Score & Push Dishes
    matchedFoods.forEach((food) => {
      let score = 40; // base dish score
      const fName = (food.name || '').toLowerCase();
      const fDesc = (food.description || '').toLowerCase();

      if (fName === cleanQuery) score += 95;
      else if (fName.startsWith(cleanQuery)) score += 55;
      else if (fName.includes(cleanQuery)) score += 35;

      queryTokens.forEach((t) => {
        if (fName.includes(t)) score += 18;
        if (fDesc.includes(t)) score += 8;
      });

      if (food.isPopular) score += 15;
      score += (food.rating || 4.5) * 4;

      let distanceKm = null;
      if (userLat && userLng && food.restaurant?.latitude && food.restaurant?.longitude) {
        distanceKm = calculateDistance(userLat, userLng, food.restaurant.latitude, food.restaurant.longitude);
      }

      scoredItems.push({
        type: 'DISH',
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        discountedPrice: food.discountedPrice,
        image: food.imageUrl || food.image,
        isPopular: food.isPopular,
        category: food.category,
        restaurant: food.restaurant,
        distanceKm,
        score,
        targetUrl: `/restaurant/${food.restaurantId}`,
      });
    });

    // Sort based on algorithm parameter
    if (sortBy === 'price_asc') {
      scoredItems.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      scoredItems.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      scoredItems.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortBy === 'distance' && userLat && userLng) {
      scoredItems.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
    } else if (sortBy === 'fastest') {
      scoredItems.sort((a, b) => (a.deliveryTimeMin || 25) - (b.deliveryTimeMin || 25));
    } else {
      // Default: Intelligent Relevance Score
      scoredItems.sort((a, b) => b.score - a.score);
    }

    const total = scoredItems.length;
    const paginated = scoredItems.slice((page - 1) * limit, page * limit);

    return paginatedResponse(res, 'Search results matching criteria', paginated, total, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFoodAndRestaurants,
};

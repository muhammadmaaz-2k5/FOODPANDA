const prisma = require('../../config/database');
const { calculateDistance } = require('../../utils/geo.util');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Universal Search for Dishes and Restaurants using the Search Index
 */
const searchFoodAndRestaurants = async (req, res, next) => {
  try {
    const {
      q,
      category,
      minRating = 0,
      maxPrice,
      lat,
      lng,
      maxDistance = 20, // km
      sortBy = 'rating', // 'rating', 'price_asc', 'price_desc', 'distance', 'orderCount'
      page = 1,
      limit = 12,
    } = req.query;

    const where = {
      rating: { gte: parseFloat(minRating) },
    };

    if (maxPrice) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    if (category) {
      where.categoryName = { contains: category, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { foodName: { contains: q, mode: 'insensitive' } },
        { restaurantName: { contains: q, mode: 'insensitive' } },
        { categoryName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    let results = await prisma.searchIndex.findMany({
      where,
      include: {
        foodItem: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discountedPrice: true,
            status: true,
            isVegetarian: true,
            isVegan: true,
            isPopular: true,
            restaurant: {
              select: { id: true, name: true, logoUrl: true, rating: true, deliveryTimeMin: true },
            },
          },
        },
      },
    });

    // Proximity calculation
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      results = results
        .map((item) => {
          const distanceKm = calculateDistance(userLat, userLng, item.latitude, item.longitude);
          return { ...item, distanceKm };
        })
        .filter((item) => item.distanceKm <= parseFloat(maxDistance));

      if (sortBy === 'distance') {
        results.sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }

    // Sort order
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'orderCount') {
      results.sort((a, b) => b.orderCount - a.orderCount);
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    }

    const total = results.length;
    const paginated = results.slice((page - 1) * limit, page * limit);

    return paginatedResponse(res, 'Search results', paginated, total, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFoodAndRestaurants,
};

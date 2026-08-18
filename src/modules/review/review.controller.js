const prisma = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Submit Review for Restaurant / Food Item / Order
 */
const submitReview = async (req, res, next) => {
  try {
    const { restaurantId, foodItemId, orderId, rating, comment, images = [] } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    if (!restaurantId && !foodItemId) {
      return errorResponse(res, 'Either restaurantId or foodItemId is required', 400);
    }

    // Check if order already reviewed
    if (orderId) {
      const existing = await prisma.review.findUnique({ where: { orderId } });
      if (existing) {
        return errorResponse(res, 'You have already reviewed this order', 400);
      }
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId: req.user.id,
          restaurantId: restaurantId || null,
          foodItemId: foodItemId || null,
          orderId: orderId || null,
          rating: Number(rating),
          comment,
          images,
        },
      });

      // Update restaurant rating
      if (restaurantId) {
        const agg = await tx.review.aggregate({
          where: { restaurantId, isApproved: true },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.restaurant.update({
          where: { id: restaurantId },
          data: {
            rating: parseFloat((agg._avg.rating || 0).toFixed(1)),
            ratingCount: agg._count.rating || 0,
          },
        });
      }

      // Update food item rating
      if (foodItemId) {
        const aggFood = await tx.review.aggregate({
          where: { foodItemId, isApproved: true },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.foodItem.update({
          where: { id: foodItemId },
          data: {
            rating: parseFloat((aggFood._avg.rating || 0).toFixed(1)),
            ratingCount: aggFood._count.rating || 0,
          },
        });
      }

      return newReview;
    });

    return successResponse(res, 'Review submitted successfully', review, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Reviews for a Restaurant
 */
const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = { restaurantId, isApproved: true };
    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return paginatedResponse(res, 'Restaurant reviews retrieved', reviews, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get User's Favorite Restaurants
 */
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: {
          include: { categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Favorite restaurants retrieved', favorites.map((f) => f.restaurant));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle / Add Favorite
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_restaurantId: { userId: req.user.id, restaurantId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return successResponse(res, 'Removed from favorites', { isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          restaurantId,
        },
      });
      return successResponse(res, 'Added to favorites', { isFavorite: true });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReview,
  getRestaurantReviews,
  getFavorites,
  toggleFavorite,
};

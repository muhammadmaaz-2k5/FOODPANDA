const prisma = require('../../config/database');
const { syncSearchIndex } = require('../../utils/searchIndex.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * List Food Categories for a Restaurant
 */
const getCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const categories = await prisma.foodCategory.findMany({
      where: { restaurantId },
      include: {
        _count: { select: { foodItems: true } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, 'Food categories retrieved', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Create Food Category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, restaurantId } = req.body;
    if (!name || !restaurantId) {
      return errorResponse(res, 'Category name and restaurantId are required', 400);
    }

    const category = await prisma.foodCategory.create({
      data: {
        name,
        description,
        restaurantId,
      },
    });

    return successResponse(res, 'Food category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Food Category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.foodCategory.update({
      where: { id },
      data: { name, description },
    });

    return successResponse(res, 'Food category updated', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Food Category
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.foodCategory.delete({ where: { id } });
    return successResponse(res, 'Food category deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Food Item by ID
 */
const getFoodItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const foodItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        variations: true,
        addons: true,
        category: true,
        restaurant: {
          select: { id: true, name: true, logoUrl: true, rating: true, deliveryTimeMin: true },
        },
      },
    });

    if (!foodItem) {
      return errorResponse(res, 'Food item not found', 404);
    }

    return successResponse(res, 'Food item details retrieved', foodItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Create Food Item (with Variations and Addons)
 */
const createFoodItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discountedPrice,
      restaurantId,
      categoryId,
      isVegetarian = false,
      isVegan = false,
      isPopular = false,
      preparationTime,
      calories,
      variations = [],
      addons = [],
    } = req.body;

    if (!name || price === undefined || !restaurantId) {
      return errorResponse(res, 'Name, price, and restaurantId are required', 400);
    }

    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        restaurantId,
        categoryId: categoryId || null,
        isVegetarian: Boolean(isVegetarian),
        isVegan: Boolean(isVegan),
        isPopular: Boolean(isPopular),
        preparationTime: preparationTime ? Number(preparationTime) : null,
        calories: calories ? Number(calories) : null,
        variations: variations.length > 0
          ? {
              create: variations.map((v) => ({
                name: v.name,
                price: parseFloat(v.price),
              })),
            }
          : undefined,
        addons: addons.length > 0
          ? {
              create: addons.map((a) => ({
                name: a.name,
                price: parseFloat(a.price),
              })),
            }
          : undefined,
      },
      include: {
        variations: true,
        addons: true,
        category: true,
      },
    });

    // Synchronize denormalized search index
    await syncSearchIndex(foodItem.id);

    return successResponse(res, 'Food item created successfully', foodItem, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Food Item
 */
const updateFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      discountedPrice,
      categoryId,
      status,
      isVegetarian,
      isVegan,
      isPopular,
      preparationTime,
      calories,
    } = req.body;

    const updated = await prisma.foodItem.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        discountedPrice: discountedPrice !== undefined ? (discountedPrice ? parseFloat(discountedPrice) : null) : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        status: status ? status.toUpperCase() : undefined,
        isVegetarian: isVegetarian !== undefined ? Boolean(isVegetarian) : undefined,
        isVegan: isVegan !== undefined ? Boolean(isVegan) : undefined,
        isPopular: isPopular !== undefined ? Boolean(isPopular) : undefined,
        preparationTime: preparationTime ? Number(preparationTime) : undefined,
        calories: calories ? Number(calories) : undefined,
      },
      include: {
        variations: true,
        addons: true,
      },
    });

    // Update search index
    await syncSearchIndex(updated.id);

    return successResponse(res, 'Food item updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Food Item Availability
 */
const toggleFoodItemStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'AVAILABLE' | 'UNAVAILABLE'

    if (!['AVAILABLE', 'UNAVAILABLE'].includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const updated = await prisma.foodItem.update({
      where: { id },
      data: { status },
    });

    return successResponse(res, `Food item status changed to ${status}`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Food Item
 */
const deleteFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.foodItem.delete({ where: { id } });
    await syncSearchIndex(id); // cleans search_index
    return successResponse(res, 'Food item deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  toggleFoodItemStatus,
  deleteFoodItem,
};

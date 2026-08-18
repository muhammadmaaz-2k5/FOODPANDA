const prisma = require('../config/database');

/**
 * Synchronize a FoodItem into the search_index table
 * @param {string} foodItemId 
 */
const syncSearchIndex = async (foodItemId) => {
  try {
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
      include: {
        restaurant: true,
        category: true,
      },
    });

    if (!foodItem) {
      // Remove from search index if food item was deleted
      await prisma.searchIndex.deleteMany({
        where: { foodItemId },
      });
      return;
    }

    const data = {
      entityType: 'FOOD',
      entityId: foodItem.id,
      foodItemId: foodItem.id,
      restaurantId: foodItem.restaurantId,
      restaurantName: foodItem.restaurant.name,
      foodName: foodItem.name,
      categoryName: foodItem.category ? foodItem.category.name : null,
      description: foodItem.description || null,
      rating: foodItem.rating,
      orderCount: foodItem.orderCount,
      latitude: foodItem.restaurant.latitude,
      longitude: foodItem.restaurant.longitude,
      deliveryTimeMin: foodItem.restaurant.deliveryTimeMin || 25,
      price: foodItem.discountedPrice || foodItem.price,
    };

    await prisma.searchIndex.upsert({
      where: { foodItemId: foodItem.id },
      create: data,
      update: data,
    });
  } catch (error) {
    console.error('Failed to sync search index:', error.message);
  }
};

module.exports = {
  syncSearchIndex,
};

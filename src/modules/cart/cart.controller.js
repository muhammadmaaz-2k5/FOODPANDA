const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * Get User's Active Cart
 */
const getCart = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const where = {
      userId: req.user.id,
      status: 'ACTIVE',
    };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const cart = await prisma.cart.findFirst({
      where,
      include: {
        restaurant: {
          select: { id: true, name: true, logoUrl: true, deliveryTimeMin: true },
        },
        items: {
          include: {
            foodItem: {
              select: { id: true, name: true, price: true, discountedPrice: true, status: true },
            },
          },
        },
      },
    });

    if (!cart) {
      return successResponse(res, 'No active cart', { items: [], subtotal: 0 });
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    return successResponse(res, 'Active cart retrieved', {
      ...cart,
      subtotal: parseFloat(subtotal.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Item to Cart
 */
const addToCart = async (req, res, next) => {
  try {
    const {
      foodItemId,
      restaurantId,
      quantity = 1,
      variationId,
      addonIds = [],
      specialInstructions,
    } = req.body;

    if (!foodItemId || !restaurantId) {
      return errorResponse(res, 'foodItemId and restaurantId are required', 400);
    }

    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
      include: { variations: true, addons: true },
    });

    if (!foodItem || foodItem.status !== 'AVAILABLE') {
      return errorResponse(res, 'Food item is currently unavailable', 400);
    }

    if (foodItem.restaurantId !== restaurantId) {
      return errorResponse(res, 'Food item does not belong to the selected restaurant', 400);
    }

    // Calculate item unit price (base/discounted price + variation + addons)
    let unitPrice = foodItem.discountedPrice || foodItem.price;

    if (variationId) {
      const variation = foodItem.variations.find((v) => v.id === variationId);
      if (variation) {
        unitPrice = variation.price;
      }
    }

    if (addonIds && addonIds.length > 0) {
      const selectedAddons = foodItem.addons.filter((a) => addonIds.includes(a.id));
      const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
      unitPrice += addonsPrice;
    }

    const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

    // Find or create active cart for user & restaurant
    let cart = await prisma.cart.findFirst({
      where: {
        userId: req.user.id,
        restaurantId,
        status: 'ACTIVE',
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: req.user.id,
          restaurantId,
          status: 'ACTIVE',
        },
      });
    }

    // Check if identical item (same variation and addons) already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        foodItemId,
        variationId: variationId || null,
        addonIds: { equals: addonIds },
      },
    });

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + Number(quantity);
      const newTotalPrice = parseFloat((unitPrice * newQuantity).toFixed(2));
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          totalPrice: newTotalPrice,
          specialInstructions: specialInstructions || existingItem.specialInstructions,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodItemId,
          quantity: Number(quantity),
          variationId: variationId || null,
          addonIds,
          specialInstructions,
          unitPrice,
          totalPrice,
        },
      });
    }

    return successResponse(res, 'Item added to cart', cartItem, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Cart Item
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    const existing = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!existing || existing.cart.userId !== req.user.id) {
      return errorResponse(res, 'Cart item not found', 404);
    }

    if (Number(quantity) <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return successResponse(res, 'Item removed from cart');
    }

    const totalPrice = parseFloat((existing.unitPrice * Number(quantity)).toFixed(2));
    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: Number(quantity),
        totalPrice,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : existing.specialInstructions,
      },
    });

    return successResponse(res, 'Cart item updated', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Cart Item
 */
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const existing = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!existing || existing.cart.userId !== req.user.id) {
      return errorResponse(res, 'Cart item not found', 404);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return successResponse(res, 'Cart item removed');
  } catch (error) {
    next(error);
  }
};

/**
 * Clear Active Cart
 */
const clearCart = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const where = { userId: req.user.id, status: 'ACTIVE' };
    if (restaurantId) where.restaurantId = restaurantId;

    await prisma.cart.deleteMany({ where });
    return successResponse(res, 'Cart cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};

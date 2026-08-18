const prisma = require('../../config/database');
const { calculateDistance, calculateDeliveryFee } = require('../../utils/geo.util');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Helper to generate human-readable unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FP-${timestamp}-${random}`;
};

/**
 * Checkout & Place Order
 */
const checkout = async (req, res, next) => {
  try {
    const {
      restaurantId,
      deliveryAddressId,
      type = 'DELIVERY',
      deliveryTier = 'STANDARD',
      paymentMethod = 'CARD',
      couponCode,
      deliveryInstructions,
    } = req.body;

    if (!restaurantId) {
      return errorResponse(res, 'restaurantId is required', 400);
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.status !== 'ACTIVE') {
      return errorResponse(res, 'Restaurant is currently unavailable', 400);
    }

    // Get active cart for user
    const cart = await prisma.cart.findFirst({
      where: {
        userId: req.user.id,
        restaurantId,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            foodItem: {
              include: { variations: true, addons: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Cart is empty', 400);
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      let itemUnitPrice = item.foodItem.discountedPrice || item.foodItem.price;
      let variationName = null;
      const addonNames = [];

      if (item.variationId) {
        const v = item.foodItem.variations.find((v) => v.id === item.variationId);
        if (v) {
          itemUnitPrice = v.price;
          variationName = v.name;
        }
      }

      if (item.addonIds && item.addonIds.length > 0) {
        const addons = item.foodItem.addons.filter((a) => item.addonIds.includes(a.id));
        addons.forEach((a) => {
          itemUnitPrice += a.price;
          addonNames.push(a.name);
        });
      }

      const itemTotal = parseFloat((itemUnitPrice * item.quantity).toFixed(2));
      subtotal += itemTotal;

      orderItemsData.push({
        foodItemId: item.foodItemId,
        name: item.foodItem.name,
        quantity: item.quantity,
        unitPrice: itemUnitPrice,
        variationName,
        addonNames,
        totalPrice: itemTotal,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Handle Address & Delivery calculation
    let deliveryFee = 0;
    let deliveryLatitude = null;
    let deliveryLongitude = null;

    if (type === 'DELIVERY') {
      let address;
      if (deliveryAddressId) {
        address = await prisma.address.findUnique({ where: { id: deliveryAddressId } });
      } else {
        address = await prisma.address.findFirst({
          where: { userId: req.user.id, isDefault: true },
        });
      }

      if (!address) {
        return errorResponse(res, 'Delivery address is required for delivery orders', 400);
      }

      deliveryLatitude = address.latitude;
      deliveryLongitude = address.longitude;

      const distanceKm = calculateDistance(
        restaurant.latitude,
        restaurant.longitude,
        deliveryLatitude,
        deliveryLongitude
      );

      deliveryFee = calculateDeliveryFee(distanceKm, deliveryTier);
    }

    // Handle Coupon / Discount
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        appliedCoupon &&
        appliedCoupon.isActive &&
        subtotal >= appliedCoupon.minOrderValue &&
        (!appliedCoupon.endDate || new Date() <= appliedCoupon.endDate) &&
        (!appliedCoupon.restaurantId || appliedCoupon.restaurantId === restaurantId)
      ) {
        if (appliedCoupon.type === 'PERCENTAGE') {
          discountAmount = (subtotal * appliedCoupon.value) / 100;
          if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
            discountAmount = appliedCoupon.maxDiscount;
          }
        } else if (appliedCoupon.type === 'FIXED') {
          discountAmount = Math.min(appliedCoupon.value, subtotal);
        } else if (appliedCoupon.type === 'FREE_DELIVERY') {
          discountAmount = deliveryFee;
        }
      }
    }

    discountAmount = parseFloat(discountAmount.toFixed(2));
    const taxAmount = parseFloat(((subtotal - discountAmount) * 0.05).toFixed(2)); // 5% tax
    const total = parseFloat((subtotal + deliveryFee - discountAmount + taxAmount).toFixed(2));

    // Create Order with Transaction
    const orderNumber = generateOrderNumber();

    // 1. Create order with nested relations
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        restaurantId,
        status: 'PENDING',
        type,
        deliveryTier,
        subtotal,
        deliveryFee,
        discountAmount,
        taxAmount,
        total,
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
        paymentMethod,
        deliveryAddressId: deliveryAddressId || null,
        deliveryLatitude,
        deliveryLongitude,
        deliveryInstructions,
        estimatedPrepTime: restaurant.deliveryTimeMin || 25,
        estimatedDeliveryTime: (restaurant.deliveryTimeMin || 25) + 15,
        items: {
          create: orderItemsData,
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            note: 'Order placed by customer',
            createdBy: req.user.id,
          },
        },
        payment: {
          create: {
            amount: total,
            status: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
            method: paymentMethod,
            transactionId: `TXN-${Date.now()}`,
            gateway: paymentMethod === 'CASH' ? 'CASH_ON_DELIVERY' : 'MOCK_STRIPE',
            paidAt: paymentMethod === 'CASH' ? null : new Date(),
          },
        },
        conversation: {
          create: {
            type: 'CUSTOMER_RESTAURANT',
            status: 'OPEN',
            participants: {
              create: [
                { userId: req.user.id, role: 'CUSTOMER' },
                { userId: restaurant.ownerId, role: 'RESTAURANT' },
              ],
            },
          },
        },
      },
      include: {
        items: true,
        payment: true,
        restaurant: { select: { id: true, name: true, phone: true } },
        statusHistory: true,
      },
    });

    // 2. Record coupon usage if applied
    if (appliedCoupon && discountAmount > 0) {
      await prisma.couponUsage.create({
        data: {
          couponId: appliedCoupon.id,
          userId: req.user.id,
          orderId: order.id,
          discountAmount,
        },
      }).catch(err => console.error('Coupon usage log error:', err.message));

      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { totalUsage: { increment: 1 } },
      }).catch(err => console.error('Coupon count increment error:', err.message));
    }

    // 3. Clear customer active cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    }).catch(err => console.error('Cart clear error:', err.message));

    // 4. Update food item & restaurant order counts
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { orderCount: { increment: 1 } },
    }).catch(err => console.error('Restaurant count update error:', err.message));

    for (const item of orderItemsData) {
      await prisma.foodItem.update({
        where: { id: item.foodItemId },
        data: { orderCount: { increment: item.quantity } },
      }).catch(err => console.error('FoodItem count update error:', err.message));
    }

    // Real-time notification through Socket.io if initialized
    if (global.io) {
      global.io.to(`restaurant_${restaurantId}`).emit('new_order', order);
      global.io.to(`restaurant_${restaurantId}`).emit('new_order_placed', order);
      global.io.to(`user_${req.user.id}`).emit('order_created', order);
      global.io.emit('new_order_placed', order);
      global.io.emit('order_status_changed', { orderId: order.id, status: order.status });
    }

    return successResponse(res, 'Order placed successfully', order, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List User Orders or Restaurant Orders
 */
const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, restaurantId } = req.query;
    const where = {};

    if (req.user.role === 'CUSTOMER') {
      where.userId = req.user.id;
    } else if (req.user.role === 'RESTAURANT_OWNER') {
      if (restaurantId) {
        where.restaurantId = restaurantId;
      } else {
        where.restaurant = { ownerId: req.user.id };
      }
    } else if (req.user.role === 'RIDER') {
      where.riderAssignment = {
        rider: { userId: req.user.id },
      };
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        items: true,
        restaurant: {
          select: { id: true, name: true, logoUrl: true, addressLine: true, phone: true },
        },
        deliveryAddress: true,
        payment: true,
        riderAssignment: {
          include: {
            rider: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return paginatedResponse(res, 'Orders list retrieved', orders, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Order by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        restaurant: true,
        deliveryAddress: true,
        payment: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        riderAssignment: {
          include: {
            rider: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
              },
            },
          },
        },
        conversation: true,
      },
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    return successResponse(res, 'Order details retrieved', order);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
      'PENDING',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'PICKED_UP',
      'ENROUTE',
      'DELIVERED',
      'CANCELLED',
      'REJECTED',
    ];

    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid order status', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const orderUpdate = { status };
      if (status === 'DELIVERED') {
        orderUpdate.actualDeliveryTime = new Date();
        orderUpdate.paymentStatus = 'PAID';
      }

      const o = await tx.order.update({
        where: { id },
        data: orderUpdate,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || `Status updated to ${status}`,
          createdBy: req.user.id,
        },
      });

      return o;
    });

    // Emit real-time status update via Socket.io
    if (global.io) {
      global.io.to(`order_${id}`).emit('order_status_changed', { orderId: id, status, note });
      global.io.to(`user_${order.userId}`).emit('order_notification', {
        orderId: id,
        status,
        message: `Your order #${order.orderNumber} is now ${status}`,
      });
    }

    return successResponse(res, `Order status updated to ${status}`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorResponse(res, 'Order not found', 404);

    if (['DELIVERED', 'CANCELLED', 'PICKED_UP'].includes(order.status)) {
      return errorResponse(res, `Cannot cancel order with status ${order.status}`, 400);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Cancelled by user',
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'CANCELLED',
        note: reason || 'Cancelled by user',
        createdBy: req.user.id,
      },
    });

    if (global.io) {
      global.io.to(`order_${id}`).emit('order_status_changed', {
        orderId: id,
        status: 'CANCELLED',
        reason,
      });
    }

    return successResponse(res, 'Order cancelled successfully', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};

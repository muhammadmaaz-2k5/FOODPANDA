const prisma = require('../../config/database');
const { successResponse } = require('../../utils/response.util');

/**
 * Platform / Restaurant Analytics Dashboard KPIs
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const isVendor = req.user.role === 'RESTAURANT_OWNER';
    const filterRestaurantId = isVendor
      ? (await prisma.restaurant.findFirst({ where: { ownerId: req.user.id } }))?.id
      : restaurantId;

    const orderWhere = {
      status: 'DELIVERED',
    };
    if (filterRestaurantId) orderWhere.restaurantId = filterRestaurantId;

    // Total Revenue & Delivered orders
    const ordersAgg = await prisma.order.aggregate({
      where: orderWhere,
      _sum: { total: true, subtotal: true, deliveryFee: true, discountAmount: true },
      _count: { id: true },
    });

    // Total orders by status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: filterRestaurantId ? { restaurantId: filterRestaurantId } : undefined,
      _count: { id: true },
    });

    // Counts
    const totalUsers = await prisma.user.count();
    const totalRestaurants = await prisma.restaurant.count({ where: { status: 'ACTIVE' } });
    const activeRiders = await prisma.rider.count({ where: { status: { in: ['AVAILABLE', 'BUSY', 'ON_DELIVERY'] } } });

    // Top Selling Food Items
    const topFoodItems = await prisma.foodItem.findMany({
      where: filterRestaurantId ? { restaurantId: filterRestaurantId } : undefined,
      orderBy: { orderCount: 'desc' },
      take: 5,
      select: { id: true, name: true, price: true, orderCount: true, rating: true },
    });

    // Recent 5 Orders
    const recentOrders = await prisma.order.findMany({
      where: filterRestaurantId ? { restaurantId: filterRestaurantId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        restaurant: { select: { name: true } },
      },
    });

    return successResponse(res, 'Dashboard metrics retrieved', {
      totalRevenue: ordersAgg._sum.total || 0,
      totalDeliveredOrders: ordersAgg._count.id || 0,
      subtotalSales: ordersAgg._sum.subtotal || 0,
      totalDeliveryFees: ordersAgg._sum.deliveryFee || 0,
      totalDiscountsGiven: ordersAgg._sum.discountAmount || 0,
      totalUsers,
      totalRestaurants,
      activeRiders,
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {}),
      topFoodItems,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};

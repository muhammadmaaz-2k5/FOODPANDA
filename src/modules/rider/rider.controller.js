const prisma = require('../../config/database');
const { calculateDistance } = require('../../utils/geo.util');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Register as Rider
 */
const registerRider = async (req, res, next) => {
  try {
    const { vehicleType = 'BIKE', vehiclePlate, documentsUrl } = req.body;

    const existingRider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
    });

    if (existingRider) {
      return errorResponse(res, 'You are already registered as a rider', 400);
    }

    const rider = await prisma.rider.create({
      data: {
        userId: req.user.id,
        vehicleType,
        vehiclePlate,
        documentsUrl,
        status: 'OFFLINE',
        isApproved: true, // auto-approve for testing or admin flag
      },
    });

    return successResponse(res, 'Rider profile registered successfully', rider, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Rider Profile & Stats
 */
const getRiderProfile = async (req, res, next) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        assignments: {
          take: 10,
          orderBy: { assignedAt: 'desc' },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                deliveryFee: true,
                status: true,
                deliveryAddress: true,
                restaurant: { select: { name: true, addressLine: true } },
              },
            },
          },
        },
      },
    });

    if (!rider) {
      return errorResponse(res, 'Rider profile not found', 404);
    }

    return successResponse(res, 'Rider profile retrieved', rider);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Rider Status (OFFLINE / AVAILABLE / BUSY)
 */
const updateRiderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['OFFLINE', 'AVAILABLE', 'BUSY', 'ON_DELIVERY'].includes(status)) {
      return errorResponse(res, 'Invalid rider status', 400);
    }

    const updated = await prisma.rider.update({
      where: { userId: req.user.id },
      data: {
        status,
        lastSeenAt: new Date(),
      },
    });

    return successResponse(res, `Rider status updated to ${status}`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Rider GPS Location & Store in Location History
 */
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, heading, speedKmh, orderId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
    });

    if (!rider) {
      return errorResponse(res, 'Rider not found', 404);
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Update current location
    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        latitude: lat,
        longitude: lng,
        heading: heading ? parseFloat(heading) : null,
        speedKmh: speedKmh ? parseFloat(speedKmh) : null,
        locationUpdatedAt: new Date(),
      },
    });

    // Record in historical trail
    await prisma.riderLocationHistory.create({
      data: {
        riderId: rider.id,
        latitude: lat,
        longitude: lng,
        heading: heading ? parseFloat(heading) : null,
        speedKmh: speedKmh ? parseFloat(speedKmh) : null,
      },
    });

    // Stream real-time coordinates over Socket.io
    if (global.io) {
      const locationPayload = {
        riderId: rider.id,
        latitude: lat,
        longitude: lng,
        heading,
        speedKmh,
        timestamp: new Date(),
      };

      if (orderId) {
        global.io.to(`order_${orderId}`).emit('rider_location_update', locationPayload);
      }
      global.io.emit('rider_live_stream', locationPayload);
    }

    return successResponse(res, 'Location updated');
  } catch (error) {
    next(error);
  }
};

/**
 * List Available Orders for Delivery in Proximity
 */
const getAvailableDeliveries = async (req, res, next) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
    });

    if (!rider) return errorResponse(res, 'Rider profile required', 403);

    // Find orders in READY or ACCEPTED status without an active rider assignment
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['READY', 'PREPARING', 'ACCEPTED'] },
        type: 'DELIVERY',
        riderAssignment: null,
      },
      include: {
        restaurant: {
          select: { id: true, name: true, latitude: true, longitude: true, addressLine: true, phone: true },
        },
        deliveryAddress: true,
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate distance to restaurant if rider has location
    const formatted = orders.map((o) => {
      let distanceToRestaurantKm = null;
      if (rider.latitude && rider.longitude) {
        distanceToRestaurantKm = calculateDistance(
          rider.latitude,
          rider.longitude,
          o.restaurant.latitude,
          o.restaurant.longitude
        );
      }
      return {
        ...o,
        distanceToRestaurantKm,
      };
    });

    return successResponse(res, 'Available deliveries retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Delivery Assignment
 */
const acceptAssignment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return errorResponse(res, 'orderId is required', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
    });

    if (!rider) return errorResponse(res, 'Rider not found', 404);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { riderAssignment: true },
    });

    if (!order) return errorResponse(res, 'Order not found', 404);
    if (order.riderAssignment) return errorResponse(res, 'Order is already assigned to a rider', 400);

    const assignment = await prisma.riderAssignment.create({
      data: {
        orderId,
        riderId: rider.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: { order: true },
    });

    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        status: 'BUSY',
        activeOrderCount: { increment: 1 },
      },
    });

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('rider_assigned', {
        orderId,
        rider: {
          id: rider.id,
          name: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
          phone: req.user.phone,
          vehicleType: rider.vehicleType,
          vehiclePlate: rider.vehiclePlate,
          rating: rider.rating,
        },
      });
    }

    return successResponse(res, 'Delivery assignment accepted', assignment);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Order as Picked Up
 */
const markPickedUp = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const rider = await prisma.rider.findUnique({ where: { userId: req.user.id } });

    const assignment = await prisma.riderAssignment.findFirst({
      where: { orderId, riderId: rider.id },
    });

    if (!assignment) return errorResponse(res, 'Assignment not found for this rider', 404);

    await prisma.riderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ENROUTE' },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'ENROUTE',
        note: 'Order picked up by rider and enroute to destination',
        createdBy: req.user.id,
      },
    });

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status: 'ENROUTE',
        note: 'Order is on the way',
      });
    }

    return successResponse(res, 'Order marked as picked up & enroute', order);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Order as Delivered
 */
const markDelivered = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const rider = await prisma.rider.findUnique({ where: { userId: req.user.id } });

    const assignment = await prisma.riderAssignment.findFirst({
      where: { orderId, riderId: rider.id },
    });

    if (!assignment) return errorResponse(res, 'Assignment not found for this rider', 404);

    await prisma.riderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        actualDeliveryTime: new Date(),
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'DELIVERED',
        note: 'Order safely delivered to recipient',
        createdBy: req.user.id,
      },
    });

    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        status: 'AVAILABLE',
        activeOrderCount: { decrement: 1 },
        totalDeliveries: { increment: 1 },
      },
    });

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status: 'DELIVERED',
      });
    }

    return successResponse(res, 'Order marked as delivered successfully', order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerRider,
  getRiderProfile,
  updateRiderStatus,
  updateLocation,
  getAvailableDeliveries,
  acceptAssignment,
  markPickedUp,
  markDelivered,
};

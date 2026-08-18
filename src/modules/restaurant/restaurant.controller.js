const prisma = require('../../config/database');
const { calculateDistance, isPointInPolygon } = require('../../utils/geo.util');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * List Restaurants with proximity calculation and filters
 */
const getRestaurants = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'ACTIVE',
      categoryId,
      lat,
      lng,
      maxDistance = 15, // km
      sortBy = 'rating', // 'rating', 'deliveryTime', 'distance'
    } = req.query;

    const where = {};
    if (status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categories = {
        some: { id: categoryId },
      };
    }

    let restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        categories: true,
        deliveryZone: true,
        _count: {
          select: { foodItems: true, reviews: true },
        },
      },
    });

    // Distance calculation and spatial filtering if user lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      restaurants = restaurants
        .map((r) => {
          const distanceKm = calculateDistance(userLat, userLng, r.latitude, r.longitude);
          const inZone = r.deliveryZone ? isPointInPolygon(userLat, userLng, r.deliveryZone.polygon) : true;
          return {
            ...r,
            distanceKm,
            inDeliveryZone: inZone,
          };
        })
        .filter((r) => r.distanceKm <= parseFloat(maxDistance));

      // Sorting
      if (sortBy === 'distance') {
        restaurants.sort((a, b) => a.distanceKm - b.distanceKm);
      } else if (sortBy === 'deliveryTime') {
        restaurants.sort((a, b) => (a.deliveryTimeMin || 30) - (b.deliveryTimeMin || 30));
      } else {
        restaurants.sort((a, b) => b.rating - a.rating);
      }
    }

    const total = restaurants.length;
    const paginated = restaurants.slice((page - 1) * limit, page * limit);

    return paginatedResponse(res, 'Restaurants list retrieved', paginated, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Restaurant by ID with menu categories & items
 */
const getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: true,
        deliveryZone: true,
        foodCategories: {
          include: {
            foodItems: {
              where: { status: 'AVAILABLE' },
              include: {
                variations: true,
                addons: true,
              },
            },
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!restaurant) {
      return errorResponse(res, 'Restaurant not found', 404);
    }

    return successResponse(res, 'Restaurant details retrieved', restaurant);
  } catch (error) {
    next(error);
  }
};

/**
 * Create Restaurant (Owner / Admin)
 */
const createRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      logoUrl,
      coverUrl,
      deliveryTimeMin,
      deliveryTimeMax,
      priceRange = 1,
      latitude,
      longitude,
      addressLine,
      city,
      postalCode,
      categoryIds = [],
      deliveryZoneId,
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'Name, latitude, and longitude are required', 400);
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        phone,
        email,
        logoUrl,
        coverUrl,
        deliveryTimeMin: deliveryTimeMin ? Number(deliveryTimeMin) : 20,
        deliveryTimeMax: deliveryTimeMax ? Number(deliveryTimeMax) : 40,
        priceRange: Number(priceRange) || 1,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        addressLine,
        city,
        postalCode,
        ownerId: req.user.id,
        deliveryZoneId: deliveryZoneId || null,
        categories: categoryIds.length > 0
          ? { connect: categoryIds.map((id) => ({ id })) }
          : undefined,
        status: req.user.role === 'ADMIN' ? 'ACTIVE' : 'PENDING',
      },
      include: {
        categories: true,
        deliveryZone: true,
      },
    });

    return successResponse(res, 'Restaurant created successfully', restaurant, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Restaurant
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.restaurant.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse(res, 'Restaurant not found', 404);
    }

    // Only owner or admin can update
    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Unauthorized to update this restaurant', 403);
    }

    const {
      name,
      description,
      phone,
      email,
      logoUrl,
      coverUrl,
      deliveryTimeMin,
      deliveryTimeMax,
      priceRange,
      latitude,
      longitude,
      addressLine,
      city,
      postalCode,
      status,
      categoryIds,
      deliveryZoneId,
    } = req.body;

    const data = {
      name,
      description,
      phone,
      email,
      logoUrl,
      coverUrl,
      deliveryTimeMin: deliveryTimeMin ? Number(deliveryTimeMin) : undefined,
      deliveryTimeMax: deliveryTimeMax ? Number(deliveryTimeMax) : undefined,
      priceRange: priceRange ? Number(priceRange) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      addressLine,
      city,
      postalCode,
      status: req.user.role === 'ADMIN' && status ? status : undefined,
      deliveryZoneId: deliveryZoneId !== undefined ? deliveryZoneId : undefined,
    };

    if (categoryIds) {
      data.categories = {
        set: categoryIds.map((catId) => ({ id: catId })),
      };
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data,
      include: { categories: true, deliveryZone: true },
    });

    return successResponse(res, 'Restaurant updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Restaurant Status (Admin or Owner to open/close)
 */
const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return errorResponse(res, 'Invalid restaurant status', 400);
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    if (restaurant.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Unauthorized to change restaurant status', 403);
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: { status },
    });

    return successResponse(res, `Restaurant status changed to ${status}`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurant Staff Management: Add Staff
 */
const addStaff = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;
    const { email, position = 'STAFF' } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 'User with this email not found', 404);

    const staff = await prisma.restaurantStaff.create({
      data: {
        userId: user.id,
        restaurantId,
        position,
      },
      include: { user: true },
    });

    return successResponse(res, 'Staff member added', staff, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurant Staff Management: List Staff
 */
const listStaff = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;
    const staff = await prisma.restaurantStaff.findMany({
      where: { restaurantId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
      },
    });
    return successResponse(res, 'Staff list retrieved', staff);
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurant Staff Management: Remove Staff
 */
const removeStaff = async (req, res, next) => {
  try {
    const { id: restaurantId, userId } = req.params;
    await prisma.restaurantStaff.delete({
      where: {
        userId_restaurantId: { userId, restaurantId },
      },
    });
    return successResponse(res, 'Staff removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delivery Zones: List & Create
 */
const getDeliveryZones = async (req, res, next) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      include: { _count: { select: { restaurants: true } } },
    });
    return successResponse(res, 'Delivery zones retrieved', zones);
  } catch (error) {
    next(error);
  }
};

const createDeliveryZone = async (req, res, next) => {
  try {
    const { name, description, polygon, centerLat, centerLng, radius } = req.body;
    if (!name || !polygon) {
      return errorResponse(res, 'Name and GeoJSON polygon boundary are required', 400);
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        description,
        polygon,
        centerLat: centerLat ? parseFloat(centerLat) : null,
        centerLng: centerLng ? parseFloat(centerLng) : null,
        radius: radius ? parseFloat(radius) : null,
      },
    });

    return successResponse(res, 'Delivery zone created', zone, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
  addStaff,
  listStaff,
  removeStaff,
  getDeliveryZones,
  createDeliveryZone,
};

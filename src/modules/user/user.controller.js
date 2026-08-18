const prisma = require('../../config/database');
const { geocodeAddress } = require('../../config/mapbox');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response.util');

/**
 * Get Profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        status: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
    return successResponse(res, 'Profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatarUrl, gender, dateOfBirth } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
        avatarUrl,
        gender: gender ? gender.toUpperCase() : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        status: true,
      },
    });
    return successResponse(res, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * List Addresses for User
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return successResponse(res, 'Addresses retrieved', addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * Create New Address (with automatic Mapbox geocoding if lat/lng missing)
 */
const createAddress = async (req, res, next) => {
  try {
    const { label, line1, line2, city, postalCode, notes, isDefault } = req.body;
    let { latitude, longitude } = req.body;

    if (!line1 || !city) {
      return errorResponse(res, 'Address line1 and city are required', 400);
    }

    // If coordinates not provided, geocode address via Mapbox
    if (!latitude || !longitude) {
      const fullAddress = `${line1}, ${city} ${postalCode || ''}`;
      const geoResults = await geocodeAddress(fullAddress);
      if (geoResults && geoResults.length > 0) {
        latitude = geoResults[0].latitude;
        longitude = geoResults[0].longitude;
      } else {
        // Fallback default coordinates (e.g. city center)
        latitude = latitude || 14.5995;
        longitude = longitude || 120.9842;
      }
    }

    // If marked as default, reset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        label: label || 'Home',
        line1,
        line2,
        city,
        postalCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        notes,
        isDefault: Boolean(isDefault),
      },
    });

    return successResponse(res, 'Address created successfully', address, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Address
 */
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, line1, line2, city, postalCode, latitude, longitude, notes, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return errorResponse(res, 'Address not found', 404);
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label,
        line1,
        line2,
        city,
        postalCode,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
      },
    });

    return successResponse(res, 'Address updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Address
 */
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return errorResponse(res, 'Address not found', 404);
    }

    await prisma.address.delete({ where: { id } });
    return successResponse(res, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: List All Users
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const where = {};

    if (status) where.status = status.toUpperCase();
    if (role) where.role = { name: role.toUpperCase() };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return paginatedResponse(res, 'Users list retrieved', users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update User Status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) return errorResponse(res, 'Status is required', 400);
    const upperStatus = status.toUpperCase();

    // Map SUSPENDED to BANNED if needed to match UserStatus Prisma enum
    let normalizedStatus;
    if (upperStatus === 'SUSPENDED' || upperStatus === 'BANNED') {
      normalizedStatus = 'BANNED';
    } else if (upperStatus === 'ACTIVE') {
      normalizedStatus = 'ACTIVE';
    } else if (upperStatus === 'PENDING') {
      normalizedStatus = 'PENDING';
    } else {
      return errorResponse(res, 'Invalid status value. Valid statuses are ACTIVE, BANNED, SUSPENDED, PENDING', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: normalizedStatus },
      select: { id: true, email: true, status: true },
    });

    return successResponse(res, 'User status updated', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  updateUserStatus,
};

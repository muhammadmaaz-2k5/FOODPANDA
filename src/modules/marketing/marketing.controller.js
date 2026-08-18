const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * Validate and Calculate Coupon Discount
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, restaurantId, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      return errorResponse(res, 'Coupon code and subtotal are required', 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return errorResponse(res, 'Invalid or inactive coupon code', 404);
    }

    if (coupon.endDate && new Date() > coupon.endDate) {
      return errorResponse(res, 'This coupon has expired', 400);
    }

    if (coupon.restaurantId && coupon.restaurantId !== restaurantId) {
      return errorResponse(res, 'This coupon is not valid for this restaurant', 400);
    }

    const orderSubtotal = parseFloat(subtotal);
    if (orderSubtotal < coupon.minOrderValue) {
      return errorResponse(res, `Minimum order amount for this coupon is $${coupon.minOrderValue}`, 400);
    }

    // Check user usage limit
    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: req.user.id },
    });

    if (userUsageCount >= coupon.maxUsagePerUser) {
      return errorResponse(res, 'You have reached the maximum usage limit for this coupon', 400);
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED') {
      discountAmount = Math.min(coupon.value, orderSubtotal);
    } else if (coupon.type === 'FREE_DELIVERY') {
      discountAmount = 0; // Handled in checkout delivery fee waiver
    }

    return successResponse(res, 'Coupon is valid', {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
      },
      discountAmount: parseFloat(discountAmount.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List & Create Coupons
 */
const getCoupons = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const where = {};
    if (restaurantId) where.restaurantId = restaurantId;

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Coupons list retrieved', coupons);
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      type, // 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY' | 'BUY_ONE_GET_ONE'
      value,
      minOrderValue = 0,
      maxDiscount,
      restaurantId,
      startDate = new Date(),
      endDate,
      maxUsage = 100,
      maxUsagePerUser = 1,
      stackable = false,
    } = req.body;

    if (!code || !type || value === undefined) {
      return errorResponse(res, 'Code, type, and value are required', 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: type.toUpperCase(),
        value: parseFloat(value),
        minOrderValue: parseFloat(minOrderValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        restaurantId: restaurantId || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxUsage: Number(maxUsage),
        maxUsagePerUser: Number(maxUsagePerUser),
        stackable: Boolean(stackable),
      },
    });

    return successResponse(res, 'Coupon created successfully', coupon, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List & Create Promotions
 */
const getPromotions = async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        restaurant: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Active promotions retrieved', promotions);
  } catch (error) {
    next(error);
  }
};

const createPromotion = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      scope = 'RESTAURANT',
      value,
      restaurantId,
      startDate,
      endDate,
      minOrderValue = 0,
      bannerUrl,
    } = req.body;

    if (!title || !type || value === undefined || !startDate || !endDate) {
      return errorResponse(res, 'Title, type, value, startDate, and endDate are required', 400);
    }

    const promo = await prisma.promotion.create({
      data: {
        title,
        description,
        type: type.toUpperCase(),
        scope: scope.toUpperCase(),
        value: parseFloat(value),
        restaurantId: restaurantId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minOrderValue: parseFloat(minOrderValue),
        bannerUrl,
      },
    });

    return successResponse(res, 'Promotion created', promo, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Banners Management
 */
const getBanners = async (req, res, next) => {
  try {
    const { placement = 'HOME' } = req.query;
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        placement: placement.toUpperCase(),
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(res, 'Banners retrieved', banners);
  } catch (error) {
    next(error);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const { title, imageUrl, placement = 'HOME', linkType, linkValue, startDate = new Date(), endDate, sortOrder = 0 } = req.body;

    if (!title || !imageUrl) {
      return errorResponse(res, 'Banner title and imageUrl are required', 400);
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        placement: placement.toUpperCase(),
        linkType,
        linkValue,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        sortOrder: Number(sortOrder),
      },
    });

    return successResponse(res, 'Banner created successfully', banner, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  getPromotions,
  createPromotion,
  getBanners,
  createBanner,
};

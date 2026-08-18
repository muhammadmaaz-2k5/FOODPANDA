const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * Get Public or All Settings
 */
const getSettings = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const where = isAdmin ? {} : { isPublic: true };

    const settings = await prisma.platformSetting.findMany({ where });
    const formatted = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return successResponse(res, 'Settings retrieved', { settings, dictionary: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Upsert Setting (Admin only)
 */
const setSetting = async (req, res, next) => {
  try {
    const { key, value, type = 'string', category = 'general', isPublic = false } = req.body;

    if (!key || value === undefined) {
      return errorResponse(res, 'Key and value are required', 400);
    }

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: String(value), type, category, isPublic: Boolean(isPublic) },
      update: { value: String(value), type, category, isPublic: Boolean(isPublic) },
    });

    return successResponse(res, 'Setting saved successfully', setting);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  setSetting,
};

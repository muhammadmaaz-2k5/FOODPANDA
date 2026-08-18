const prisma = require('../../config/database');
const { successResponse, paginatedResponse } = require('../../utils/response.util');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };

    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    return paginatedResponse(res, 'Notifications retrieved', notifications, total, page, limit);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return successResponse(res, 'All notifications marked as read');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return successResponse(res, 'Notification marked as read', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};

const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * List User Conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: req.user.id },
        },
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse(res, 'Conversations retrieved', conversations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Messages in a Conversation
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some((p) => p.userId === req.user.id);
    if (!isParticipant && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      take: Number(limit),
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(res, 'Messages retrieved', messages);
  } catch (error) {
    next(error);
  }
};

/**
 * Send Message in Conversation
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { body, imageUrl, type = 'TEXT' } = req.body;

    if (!body && !imageUrl) {
      return errorResponse(res, 'Message body or image is required', 400);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        body,
        imageUrl,
        type: imageUrl ? 'IMAGE' : type,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Touch conversation updated_at
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast message via Socket.io
    if (global.io) {
      global.io.to(`conversation_${conversationId}`).emit('new_message', message);
    }

    return successResponse(res, 'Message sent', message, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token.util');
const prisma = require('../config/database');

/**
 * Initialize Socket.io Server
 * @param {import('http').Server} httpServer 
 */
const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          socket.user = decoded;
        } catch (err) {
          console.warn('Socket unauthenticated connection (guest)');
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}, User: ${socket.user?.userId || 'Guest'}`);

    // Automatically join user personal notification room if authenticated
    if (socket.user?.userId) {
      socket.join(`user_${socket.user.userId}`);
    }

    // Join Restaurant Room for vendors
    socket.on('join_restaurant', (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant_${restaurantId}`);
    });

    // Join Order Tracking Room (for Customer, Restaurant & Rider)
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order_${orderId}`);
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`Socket ${socket.id} left order_${orderId}`);
    });

    // Join Conversation Chat Room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Typing Indicators
    socket.on('typing', ({ conversationId, isTyping, userName }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', { isTyping, userName });
    });

    // Rider Location Broadcast
    socket.on('rider_location', async (data) => {
      const { riderId, latitude, longitude, heading, speedKmh, orderId } = data;
      const locationPayload = {
        riderId,
        latitude,
        longitude,
        heading,
        speedKmh,
        timestamp: new Date(),
      };

      if (orderId) {
        socket.to(`order_${orderId}`).emit('rider_location_update', locationPayload);
      }
      io.emit('rider_live_stream', locationPayload);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
    });
  });

  global.io = io;
  return io;
};

module.exports = {
  initSocketServer,
};

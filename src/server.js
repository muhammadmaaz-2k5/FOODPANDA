const http = require('http');
require('dotenv').config();
const app = require('./app');
const { initSocketServer } = require('./sockets/socket.server');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

// Start Server
server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Food Delivery Platform Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSockets: Ready for real-time tracking & chat`);
  console.log(`====================================================`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('\nGracefully shutting down...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP & WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

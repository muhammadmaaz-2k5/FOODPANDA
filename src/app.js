const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middlewares/error.middleware');
const setupSwagger = require('./config/swagger');

// Import Routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const restaurantRoutes = require('./modules/restaurant/restaurant.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const searchRoutes = require('./modules/search/search.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/order/order.routes');
const riderRoutes = require('./modules/rider/rider.routes');
const marketingRoutes = require('./modules/marketing/marketing.routes');
const reviewRoutes = require('./modules/review/review.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const mediaRoutes = require('./modules/media/media.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

const app = express();

// Global Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger Interactive API Documentation
setupSwagger(app);

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'Food Delivery Platform API',
    version: '1.0.0',
    status: 'ONLINE',
    docs: '/api-docs',
    timestamp: new Date(),
  });
});

app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// API Routes Mounting
const prefix = process.env.API_PREFIX || '/api/v1';
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/users`, userRoutes);
app.use(`${prefix}/restaurants`, restaurantRoutes);
app.use(`${prefix}/menu`, menuRoutes);
app.use(`${prefix}/search`, searchRoutes);
app.use(`${prefix}/cart`, cartRoutes);
app.use(`${prefix}/orders`, orderRoutes);
app.use(`${prefix}/riders`, riderRoutes);
app.use(`${prefix}/marketing`, marketingRoutes);
app.use(`${prefix}/reviews`, reviewRoutes);
app.use(`${prefix}/chat`, chatRoutes);
app.use(`${prefix}/notifications`, notificationRoutes);
app.use(`${prefix}/analytics`, analyticsRoutes);
app.use(`${prefix}/media`, mediaRoutes);
app.use(`${prefix}/settings`, settingsRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

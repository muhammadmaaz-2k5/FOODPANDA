const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Food Delivery Platform API',
    version: '1.0.0',
    description: 'Comprehensive, High-Performance Food Delivery Backend API with Prisma ORM, Cloudinary, Mapbox & WebSockets',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  phone: { type: 'string', example: '+123456789' },
                  roleName: { type: 'string', example: 'CUSTOMER' },
                },
                required: ['email', 'password', 'firstName'],
              },
            },
          },
        },
        responses: { 201: { description: 'Registration successful' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful with JWT tokens' } },
      },
    },
    '/restaurants': {
      get: {
        summary: 'List restaurants with spatial filtering & search',
        tags: ['Restaurants'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'lat', in: 'query', schema: { type: 'number' } },
          { name: 'lng', in: 'query', schema: { type: 'number' } },
          { name: 'maxDistance', in: 'query', schema: { type: 'number', default: 15 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['rating', 'distance', 'deliveryTime'] } },
        ],
        responses: { 200: { description: 'List of restaurants' } },
      },
    },
    '/search': {
      get: {
        summary: 'Universal search across food items and restaurants',
        tags: ['Search'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minRating', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
        ],
        responses: { 200: { description: 'Search results' } },
      },
    },
    '/orders/checkout': {
      post: {
        summary: 'Checkout and place order',
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  restaurantId: { type: 'string' },
                  deliveryAddressId: { type: 'string' },
                  type: { type: 'string', enum: ['DELIVERY', 'PICKUP'] },
                  deliveryTier: { type: 'string', enum: ['STANDARD', 'EXPRESS', 'PRIORITY'] },
                  paymentMethod: { type: 'string', enum: ['CARD', 'CASH', 'WALLET'] },
                  couponCode: { type: 'string' },
                },
                required: ['restaurantId'],
              },
            },
          },
        },
        responses: { 201: { description: 'Order created' } },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = setupSwagger;

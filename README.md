# 🍔 FOODPANDA — Full-Stack Food Delivery Platform

A modern, full-stack food delivery platform inspired by real-world food ordering and delivery systems.

The platform provides a complete ecosystem for **customers, restaurants, restaurant staff, delivery riders, and administrators**, including restaurant discovery, menu management, cart and checkout, promotions, order management, rider tracking, geospatial delivery zones, real-time communication, media uploads, reviews, favorites, analytics, and role-based access control.

> **Note:** This project is an independent educational/portfolio implementation inspired by food delivery platforms. It is not affiliated with or endorsed by the Foodpanda brand.

---

## 🌐 Live Demo

### Frontend

**Live Application:**
https://foodpandaclone-nu.vercel.app

### API Documentation

When running the backend locally:

```text
http://localhost:5000/api-docs
```

### GitHub Repository

https://github.com/muhammadmaaz-2k5/FOODPANDA

---

# ✨ Features

## 🔐 Authentication & Authorization

* JWT-based authentication
* Access token authentication
* Refresh token rotation
* Database-backed refresh token management
* Secure password hashing with `bcryptjs`
* Dynamic Role-Based Access Control (RBAC)
* Granular permission management
* Multiple platform roles:

  * `ADMIN`
  * `RESTAURANT_OWNER`
  * `RESTAURANT_STAFF`
  * `CUSTOMER`
  * `RIDER`
* User account status management
* Protected API routes
* Admin role and permission management

---

# 🏪 Restaurant Management

Restaurant owners and administrators can manage:

* Restaurant onboarding
* Restaurant profiles
* Restaurant status
* Restaurant staff
* Restaurant categories
* Food menus
* Food items
* Food item availability
* Delivery zones
* Restaurant information
* Restaurant discovery
* Restaurant filtering
* Restaurant proximity search

Supported restaurant statuses include:

```text
ACTIVE
INACTIVE
SUSPENDED
```

---

# 🍕 Menu & Food Management

The platform supports complete menu management.

### Food Categories

* Create categories
* Update categories
* Delete categories
* Restaurant-specific categories

### Food Items

* Create food items
* Update food items
* Delete food items
* Food item availability
* Custom variations
* Add-ons
* Special instructions
* Food images/media
* Search index synchronization

Food availability can be dynamically changed between:

```text
AVAILABLE
UNAVAILABLE
```

---

# 🔎 Search & Discovery

The platform includes a dedicated search system designed for fast restaurant and food discovery.

Features include:

* Fuzzy search
* Food search
* Restaurant search
* Category filtering
* Rating filtering
* Price filtering
* Distance filtering
* Location-based search
* Sorting
* Denormalized search index

Supported search parameters include:

```text
q
category
minRating
maxPrice
lat
lng
maxDistance
sortBy
```

---

# 🗺️ Geospatial & Location Services

The platform integrates mapping and geolocation capabilities.

### Mapbox Integration

Used for:

* Forward geocoding
* Reverse geocoding
* Route/distance calculations
* Location-based delivery logic
* Routing matrix calculations

### Delivery Zone Validation

Restaurant delivery zones support GeoJSON polygons.

The backend uses a **Point-in-Polygon ray-casting algorithm** to determine whether a customer's location is inside a restaurant's delivery zone.

### Distance Calculation

The platform also uses the **Haversine formula** for calculating geographical distance between coordinates.

This information can be used for:

* Delivery eligibility
* Restaurant proximity
* Rider proximity
* Dynamic delivery fee calculation

---

# 🛒 Cart Management

Customers can manage their active shopping cart.

Supported operations include:

* Add food items
* Update quantities
* Remove items
* Clear cart
* Select variations
* Select add-ons
* Add special instructions
* Calculate subtotal

Example cart flow:

```text
Restaurant
    ↓
Food Item
    ↓
Variation / Add-ons
    ↓
Cart
    ↓
Checkout
    ↓
Order
```

---

# 💳 Checkout & Orders

The checkout system handles the complete order creation workflow.

During checkout, the system can calculate:

* Food subtotal
* Item quantities
* Variations
* Add-ons
* Coupons
* Promotions
* Discounts
* Tax
* Delivery fee
* Final order total

The current backend applies a **5% tax** during checkout.

---

# 📦 Order Lifecycle

Orders follow a structured state machine.

Supported statuses include:

```text
ACCEPTED
PREPARING
READY
ENROUTE
DELIVERED
CANCELLED
```

The system maintains an order status history for auditing and tracking.

Example:

```text
ACCEPTED
   ↓
PREPARING
   ↓
READY
   ↓
ENROUTE
   ↓
DELIVERED
```

Customers can:

* Place orders
* View orders
* View order details
* Track order status
* Cancel orders
* View delivery information

Restaurants can:

* View incoming orders
* Accept orders
* Update preparation status
* Mark orders ready

Riders can:

* View available deliveries
* Accept delivery assignments
* Pick up orders
* Deliver orders

---

# 🛵 Rider Management

The platform includes a complete rider workflow.

Riders can:

* Register as delivery riders
* Provide vehicle information
* Manage rider status
* View rider profile
* View rider statistics
* View nearby available deliveries
* Accept delivery assignments
* Mark orders as picked up
* Mark orders as delivered
* Broadcast live GPS coordinates

Supported rider statuses:

```text
OFFLINE
AVAILABLE
BUSY
ON_DELIVERY
```

---

# 📍 Real-Time Rider GPS Tracking

The platform uses **Socket.IO** for real-time rider location streaming.

The rider can continuously send GPS coordinates to the server.

The backend:

1. Receives the rider location
2. Stores location history
3. Broadcasts the location
4. Sends the update to the appropriate order room

This enables real-time delivery tracking for active orders.

---

# 💬 Real-Time Chat

The platform provides order-based real-time communication.

Supported conversations include:

* Customer ↔ Restaurant
* Customer ↔ Rider

Socket.IO is used for real-time messaging.

Supported functionality includes:

* Conversation rooms
* Message history
* Real-time messages
* Typing indicators
* Order-specific conversations

---

# 🔌 WebSocket Events

| Event                   | Direction       | Description                       |
| ----------------------- | --------------- | --------------------------------- |
| `join_restaurant`       | Client → Server | Join a restaurant live-order room |
| `join_order`            | Client → Server | Join an order tracking room       |
| `join_conversation`     | Client → Server | Join a conversation room          |
| `rider_location`        | Rider → Server  | Send rider GPS coordinates        |
| `order_status_changed`  | Server → Room   | Broadcast order status changes    |
| `rider_location_update` | Server → Room   | Broadcast live rider location     |
| `new_message`           | Server → Room   | Broadcast a new chat message      |
| `user_typing`           | Server → Room   | Broadcast typing indicator        |

---

# 🎟️ Coupons & Promotions

The marketing system supports:

### Coupons

* Percentage discounts
* Fixed amount discounts
* Free delivery
* Minimum order requirements
* Expiration dates
* Per-user usage limits
* Coupon validation

### Promotions

* Promotional campaigns
* Promotional deals
* Dynamic promotional banners
* Carousel banners

---

# ⭐ Reviews & Favorites

Customers can interact with restaurants and food items through reviews and favorites.

### Reviews

* Submit reviews
* Rating system
* Restaurant reviews
* Food item reviews
* Review photos
* Approved review listing

### Favorites

Customers can:

* Add restaurants to favorites
* Remove restaurants from favorites
* View favorite restaurants

---

# 🖼️ Media Management

The platform uses **Cloudinary** for media storage.

Supported functionality:

* Image uploads
* Video uploads
* Media database records
* Cloudinary media deletion
* Polymorphic media relationships
* Food/vendor media management

Configured Cloudinary upload preset:

```text
vendor-food
```

---

# 📊 Analytics & Dashboard

The platform includes dashboard analytics for administrators and vendors.

Available metrics include:

* Total revenue
* Total orders
* Orders by status
* Top food items
* Active riders

The analytics API provides dashboard data through:

```text
GET /api/v1/analytics/dashboard
```

---

# ⚙️ Platform Settings

Administrators can manage platform-level settings.

Supported operations:

```text
GET  /api/v1/settings
POST /api/v1/settings
```

Settings can be used for public or system-level configuration.

---

# 🛠️ Tech Stack

## Backend

* **Node.js**
* **Express.js**
* **JavaScript**
* **Prisma ORM**
* **PostgreSQL**
* **Socket.IO**
* **JWT**
* **bcryptjs**
* **Cloudinary**
* **Mapbox**
* **Swagger / OpenAPI**
* **Multer**
* **Helmet**
* **Express Rate Limit**
* **Morgan**
* **CORS**

The backend package configuration uses Node.js/Express, Prisma, PostgreSQL, Socket.IO, Cloudinary, Mapbox-related integrations, Swagger UI, Helmet, rate limiting, and other supporting packages.

## Frontend

* **Next.js 16**
* **React 19**
* **JavaScript**
* **Axios**
* **Tailwind CSS**
* **Framer Motion**
* **Mapbox GL**
* **Leaflet**
* **React Leaflet**
* **Socket.IO Client**
* **Lucide React**
* **ESLint**

The frontend package configuration confirms Next.js 16, React 19, Axios, Framer Motion, Mapbox GL, Leaflet/React Leaflet, Socket.IO Client, Tailwind CSS tooling, and related dependencies.

---

# 🏗️ Project Architecture

The repository is organized as a full-stack application with separate frontend and backend concerns.

```text
FOODPANDA/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── ...
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── server.js
│
├── tests/
│   └── api.test.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

The repository currently contains separate `frontend`, `src`, `prisma`, and `tests` directories alongside the root configuration files.

---

# 🔄 Application Architecture

```text
                    ┌─────────────────────┐
                    │      Customer       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │   React Application │
                    └──────────┬──────────┘
                               │
                         REST / WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │     Node.js         │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ PostgreSQL  │   │  Cloudinary │   │   Mapbox    │
      │   Prisma    │   │    Media    │   │  Location   │
      └─────────────┘   └─────────────┘   └─────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Socket.IO      │
                    │ Real-Time Tracking  │
                    │       & Chat        │
                    └─────────────────────┘
```

---

# 📁 API Structure

The backend uses versioned REST APIs under:

```text
/api/v1
```

Main API modules include:

```text
/api/v1/auth
/api/v1/users
/api/v1/restaurants
/api/v1/menu
/api/v1/search
/api/v1/cart
/api/v1/orders
/api/v1/riders
/api/v1/marketing
/api/v1/reviews
/api/v1/chat
/api/v1/media
/api/v1/analytics
/api/v1/settings
```

---

# 📚 API Endpoints

## Authentication & RBAC

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/auth/roles
POST   /api/v1/auth/roles
```

---

## Users & Addresses

```text
GET    /api/v1/users/profile
PUT    /api/v1/users/profile

GET    /api/v1/users/addresses
POST   /api/v1/users/addresses
PUT    /api/v1/users/addresses/:id
DELETE /api/v1/users/addresses/:id

GET    /api/v1/users
PATCH  /api/v1/users/:id/status
```

---

## Restaurants

```text
GET    /api/v1/restaurants
GET    /api/v1/restaurants/:id
POST   /api/v1/restaurants
PUT    /api/v1/restaurants/:id
PATCH  /api/v1/restaurants/:id/status

GET    /api/v1/restaurants/:id/staff
POST   /api/v1/restaurants/:id/staff
DELETE /api/v1/restaurants/:id/staff/:userId

GET    /api/v1/restaurants/delivery-zones
POST   /api/v1/restaurants/delivery-zones
```

---

## Menu & Food Items

```text
GET    /api/v1/menu/restaurants/:restaurantId/categories

POST   /api/v1/menu/categories
PUT    /api/v1/menu/categories/:id
DELETE /api/v1/menu/categories/:id

GET    /api/v1/menu/items/:id
POST   /api/v1/menu/items
PUT    /api/v1/menu/items/:id
PATCH  /api/v1/menu/items/:id/status
DELETE /api/v1/menu/items/:id
```

---

## Search

```text
GET /api/v1/search
```

Supported filters:

```text
q
category
minRating
maxPrice
lat
lng
maxDistance
sortBy
```

---

## Cart

```text
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
DELETE /api/v1/cart/clear
```

---

## Orders

```text
POST   /api/v1/orders/checkout
GET    /api/v1/orders
GET    /api/v1/orders/:id
PATCH  /api/v1/orders/:id/status
POST   /api/v1/orders/:id/cancel
```

---

## Riders

```text
POST   /api/v1/riders/register
GET    /api/v1/riders/profile
PATCH  /api/v1/riders/status
POST   /api/v1/riders/location

GET    /api/v1/riders/deliveries/available
POST   /api/v1/riders/deliveries/accept

PATCH  /api/v1/riders/orders/:orderId/pickup
PATCH  /api/v1/riders/orders/:orderId/deliver
```

---

## Marketing

```text
POST /api/v1/marketing/coupons/validate

GET  /api/v1/marketing/coupons
POST /api/v1/marketing/coupons

GET  /api/v1/marketing/promotions
POST /api/v1/marketing/promotions

GET  /api/v1/marketing/banners
POST /api/v1/marketing/banners
```

---

## Reviews & Favorites

```text
POST /api/v1/reviews
GET  /api/v1/reviews/restaurants/:restaurantId

GET  /api/v1/reviews/favorites/my
POST /api/v1/reviews/favorites/:restaurantId
```

---

## Chat

```text
GET  /api/v1/chat/conversations
GET  /api/v1/chat/conversations/:conversationId/messages
POST /api/v1/chat/conversations/:conversationId/messages
```

---

## Media

```text
POST   /api/v1/media/upload
DELETE /api/v1/media/delete
```

---

## Analytics

```text
GET /api/v1/analytics/dashboard
```

---

## Settings

```text
GET  /api/v1/settings
POST /api/v1/settings
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1

CLIENT_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foodpanda_db?schema=public"

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret

JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=vendor-food

# Optional Cloudinary URL
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

> **Security:** Never commit real API keys, database passwords, JWT secrets, Cloudinary credentials, or Mapbox tokens to GitHub.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 18+
* npm
* PostgreSQL
* Git
* Cloudinary account
* Mapbox account/token

---

# 1. Clone the Repository

```bash
git clone https://github.com/muhammadmaaz-2k5/FOODPANDA.git
```

```bash
cd FOODPANDA
```

---

# 2. Install Backend Dependencies

```bash
npm install
```

The root project provides scripts for starting the backend, generating Prisma Client, synchronizing the database, seeding data, running Prisma Studio, and executing tests.

---

# 3. Configure Environment Variables

Create:

```text
.env
```

Copy the values from:

```text
.env.example
```

Then configure your:

* PostgreSQL connection
* JWT secrets
* Cloudinary credentials
* Mapbox access token
* Frontend URL

---

# 4. Generate Prisma Client

```bash
npm run prisma:generate
```

---

# 5. Setup PostgreSQL Database

Push the Prisma schema to your database:

```bash
npm run prisma:push
```

---

# 6. Seed Database

Run:

```bash
npm run prisma:seed
```

This creates the default development/seed data such as:

* Roles
* Permissions
* Users
* Sample restaurants
* Menus
* Coupons
* Delivery zones

---

# 7. Start Backend

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api-docs
```

---

# 8. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

# 9. Configure Frontend Environment

Create:

```text
frontend/.env.local
```

Configure the frontend API URL and required client-side services according to the frontend implementation.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

---

# 10. Start Frontend

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

---

# 🧪 Testing

Run backend verification tests:

```bash
npm test
```

The project includes a test suite under:

```text
tests/
```

---

# 🗄️ Prisma Commands

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Push Database Schema

```bash
npm run prisma:push
```

### Create Prisma Migration

```bash
npm run prisma:migrate
```

### Seed Database

```bash
npm run prisma:seed
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

---

# 🔑 Seed Accounts

For local development, the seed configuration provides accounts for the major platform roles.

| Role             | Email                  | Password       |
| ---------------- | ---------------------- | -------------- |
| Admin            | `admin@foodpanda.com`  | `Password123!` |
| Customer         | `customer@example.com` | `Password123!` |
| Restaurant Owner | `vendor@example.com`   | `Password123!` |
| Delivery Rider   | `rider@example.com`    | `Password123!` |

> These credentials are intended for local development/testing only. Change or remove seeded passwords before using the project in a real production environment.

---

# 🔒 Security

The backend includes several security-oriented components:

* JWT authentication
* Refresh token rotation
* Password hashing
* Dynamic RBAC
* Granular permissions
* Helmet security headers
* CORS configuration
* Express rate limiting
* Protected API routes
* Environment-based secrets

The backend dependencies explicitly include `helmet` and `express-rate-limit` alongside JWT, bcrypt, CORS, and related security packages.

---

# 📱 User Roles

## 👑 Administrator

Administrators can manage:

* Users
* Roles
* Permissions
* Restaurants
* Restaurant staff
* Orders
* Riders
* Coupons
* Promotions
* Banners
* Analytics
* Platform settings

---

## 🏪 Restaurant Owner

Restaurant owners can manage:

* Restaurant profile
* Restaurant staff
* Categories
* Food items
* Variations
* Add-ons
* Food availability
* Orders
* Promotions

---

## 👨‍🍳 Restaurant Staff

Restaurant staff can participate in restaurant operations based on their assigned permissions.

---

## 👤 Customer

Customers can:

* Register/login
* Manage profiles
* Manage addresses
* Discover restaurants
* Search food
* Browse menus
* Add food to cart
* Apply coupons
* Place orders
* Track orders
* Chat
* Review restaurants/food
* Favorite restaurants

---

## 🛵 Delivery Rider

Riders can:

* Register
* Manage availability
* Receive delivery assignments
* Accept deliveries
* Update GPS location
* Pick up orders
* Deliver orders
* View rider statistics

---

# 🔄 Complete Order Flow

```text
Customer
   │
   ▼
Select Location
   │
   ▼
Search Restaurants
   │
   ▼
Open Restaurant
   │
   ▼
Select Food
   │
   ▼
Choose Variations / Add-ons
   │
   ▼
Add to Cart
   │
   ▼
Apply Coupon
   │
   ▼
Checkout
   │
   ▼
Create Order
   │
   ▼
Restaurant Accepts
   │
   ▼
Preparing
   │
   ▼
Ready
   │
   ▼
Rider Assigned
   │
   ▼
Rider Picks Up
   │
   ▼
Enroute
   │
   ▼
Live GPS Tracking
   │
   ▼
Delivered
```

---

# 📍 Real-Time Tracking Flow

```text
Rider GPS
    │
    ▼
Socket.IO
    │
    ▼
Backend
    │
    ├── Save Location History
    │
    └── Broadcast Location
             │
             ▼
       Active Order Room
             │
        ┌────┴────┐
        ▼         ▼
    Customer   Restaurant
```

---

# 💬 Real-Time Chat Flow

```text
Customer
    │
    ▼
Conversation
    │
    ▼
Socket.IO Room
    │
    ├───────────────┐
    ▼               ▼
Restaurant         Rider
```

---

# 🧩 Main Backend Modules

```text
Authentication
Users
RBAC
Restaurants
Restaurant Staff
Delivery Zones
Categories
Food Items
Search
Cart
Orders
Payments
Riders
GPS Tracking
Coupons
Promotions
Banners
Reviews
Favorites
Chat
Media
Analytics
Settings
```

---

# ☁️ Deployment

The repository includes a `vercel.json` configuration and the project has a deployed frontend at:

```text
https://foodpandaclone-nu.vercel.app
```

The repository metadata identifies the default branch as `main`, uses JavaScript as its primary language, and lists the Vercel deployment as the project homepage.

For production deployment, configure environment variables through your hosting provider rather than committing `.env` files.

---

# 🌍 Production Environment Checklist

Before deploying to production:

* [ ] Configure production PostgreSQL
* [ ] Configure secure JWT secrets
* [ ] Configure Cloudinary production credentials
* [ ] Configure Mapbox production token
* [ ] Configure frontend API URL
* [ ] Configure CORS origins
* [ ] Enable HTTPS
* [ ] Verify rate limiting
* [ ] Verify authentication flows
* [ ] Run database migrations
* [ ] Run seed only when appropriate
* [ ] Run automated tests
* [ ] Verify Socket.IO connections
* [ ] Verify rider GPS tracking
* [ ] Verify Cloudinary uploads
* [ ] Verify Mapbox services
* [ ] Verify Swagger documentation
* [ ] Remove development credentials

---

# 🧹 Code Quality

The project follows a modular backend architecture intended to keep business logic separated from routing, controllers, middleware, database access, and utility functions.

Recommended development practices:

* Keep secrets in environment variables
* Validate incoming requests
* Protect authenticated routes
* Apply appropriate RBAC permissions
* Use database transactions for critical workflows
* Keep controllers lightweight
* Move business logic into services
* Maintain order status history
* Log important errors
* Add tests for critical workflows

---

# 🚀 Available Scripts

## Backend

```bash
npm start
npm run dev
npm run build

npm run prisma:generate
npm run prisma:migrate
npm run prisma:push
npm run prisma:seed
npm run prisma:studio

npm test
```

## Frontend

```bash
cd frontend

npm run dev
npm run build
npm run start
npm run lint
```

The available frontend scripts are defined in the repository's frontend package configuration.

---

# 📖 API Documentation

Swagger/OpenAPI documentation is available when the backend is running:

```text
http://localhost:5000/api-docs
```

Use Swagger to explore and test available API endpoints.

---

# 📌 Project Highlights

This project demonstrates practical experience with:

* Full-stack JavaScript development
* REST API architecture
* Next.js applications
* React applications
* Node.js backend development
* Express.js
* PostgreSQL
* Prisma ORM
* JWT authentication
* Role-Based Access Control
* Real-time WebSockets
* Socket.IO
* GPS tracking
* Geospatial algorithms
* Mapbox APIs
* Cloudinary
* Search systems
* E-commerce/order workflows
* Coupon systems
* Restaurant management
* Delivery logistics
* Real-time chat
* API documentation
* Database design
* Production-oriented architecture

---

# 👨‍💻 Author

## Muhammad Maaz

Full Stack Developer specializing in modern web applications, scalable backend systems, and production-ready software.

### Connect With Me

* **GitHub:** https://github.com/muhammadmaaz-2k5
* **LinkedIn:** https://www.linkedin.com/in/muhammad-maaz-a9277435b/
* **Portfolio:** https://my-portfolio-topaz-seven-21.vercel.app/

---

# ⭐ Support

If you find this project useful or interesting:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report bugs
* 💡 Suggest improvements
* 🔀 Open pull requests

---

# 📄 License

This project currently does not specify an open-source license in the repository metadata.

If you plan to distribute or reuse this project publicly, add an appropriate `LICENSE` file to define the permitted usage.

---

# 🙌 Acknowledgements

This project was built as a full-stack learning and portfolio project demonstrating the architecture and workflows commonly found in modern food delivery platforms.

Technologies used include:

* Node.js
* Express.js
* Next.js
* React
* PostgreSQL
* Prisma
* Socket.IO
* Cloudinary
* Mapbox
* Tailwind CSS

---

## 🍔 FOODPANDA Full-Stack Platform

**Restaurant Management • Food Ordering • Cart • Checkout • Coupons • Riders • GPS Tracking • Real-Time Chat • Reviews • Favorites • Analytics • RBAC**

Built with ❤️ using modern JavaScript technologies.

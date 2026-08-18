# 🍔 Food Delivery Platform Backend

A complete, production-grade, modular Node.js backend built with **Express.js**, **Prisma ORM (PostgreSQL)**, **Cloudinary** for polymorphic media storage, **Mapbox** for geospatial geocoding & routing matrix, and **Socket.io** for real-time order tracking, rider live GPS streaming, and customer-vendor chat.

---

## 🚀 Key Features

1. **Robust Authentication & Dynamic RBAC**:
   - Access Token (JWT) & Refresh Token rotation mechanism stored in DB (`refresh_tokens`).
   - Dynamic Roles (`ADMIN`, `RESTAURANT_OWNER`, `RESTAURANT_STAFF`, `CUSTOMER`, `RIDER`) and granular Permissions (`users:read`, `restaurants:manage`, `orders:manage`, etc.).
   - Password hashing with `bcryptjs`.

2. **Restaurants & Menus Management**:
   - Restaurant onboarding, categories, delivery zone polygon integration.
   - Food Categories, Food Items with customizable variations and add-ons.
   - Dynamic availability status toggle (`AVAILABLE` / `UNAVAILABLE`).

3. **Geospatial & Search Engine**:
   - Denormalized `search_index` synchronization for high-speed fuzzy search.
   - Mapbox forward/reverse geocoding & directions matrix routing.
   - Ray-casting algorithm for Point-in-Polygon delivery zone boundary verification.
   - Haversine formula calculation for real-time distance and dynamic tiered delivery fee computation.

4. **Cart & Orders Lifecycle**:
   - Multi-item carts with variations, addons, and special instructions.
   - Checkout with automatic coupon & promotion validation, tax (5%), delivery fee, and discount deductions.
   - Order status state machine with history audit trail (`order_status_history`).

5. **Rider Logistics & GPS Tracking**:
   - Rider registration, approval, and online/offline status management.
   - Real-time GPS location broadcasting with historical coordinate trail (`rider_location_history`).
   - Order assignment acceptance, pickup, and delivery milestones.

6. **Marketing & Promotions**:
   - Coupons (Percentage, Fixed amount, Free Delivery) with minimum order values, expiration dates, and per-user usage limits.
   - Promotional campaigns & dynamic banners.

7. **Real-time WebSockets (Socket.IO)**:
   - Order status notifications.
   - Live Rider GPS coordinates streamed to customer & restaurant.
   - Real-time 1-on-1 chat for orders (Customer <-> Restaurant & Customer <-> Rider).

8. **Cloudinary Media Storage**:
   - Integrated with upload preset `vendor-food` and polymorphic `Media` entity storage.

---

## 🛠️ Tech Stack & Environment

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Real-Time Engine**: Socket.IO
- **Cloud Storage**: Cloudinary SDK v2
- **Maps & Geolocation**: Mapbox Geocoding & Matrix API
- **API Documentation**: Swagger UI / OpenAPI 3.0 (`/api-docs`)

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CLIENT_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foodpanda_db?schema=public"

# JWT Authentication
JWT_SECRET=supersecret_foodpanda_jwt_key_2026_dev
JWT_REFRESH_SECRET=supersecret_foodpanda_refresh_jwt_key_2026_dev
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=vendor-food
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Sync Database Schema & Seed Data
```bash
# Push schema to your PostgreSQL database
npm run prisma:push

# Seed default roles, admin, sample restaurants, menus, coupons, delivery zones
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
# or
npm start
```

Server will be running at:
- **Base URL**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/api-docs`

### 5. Run Verification Tests
```bash
npm test
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@foodpanda.com` | `Password123!` |
| **Customer** | `customer@example.com` | `Password123!` |
| **Restaurant Owner** | `vendor@example.com` | `Password123!` |
| **Delivery Rider** | `rider@example.com` | `Password123!` |

---

## 📚 Complete API Endpoints Overview

### Auth & RBAC (`/api/v1/auth`)
- `POST /register` - Register new user (Customer, Owner, Rider)
- `POST /login` - Login with email & password, returns JWT & Refresh Token
- `POST /refresh-token` - Rotate refresh token & issue new access token
- `POST /logout` - Revoke refresh token
- `GET /me` - Get current authenticated user profile
- `GET /roles` - List RBAC roles and permissions (Admin)
- `POST /roles` - Create custom RBAC role (Admin)

### Users & Addresses (`/api/v1/users`)
- `GET /profile` - Retrieve user profile
- `PUT /profile` - Update user profile (name, avatar, phone, etc.)
- `GET /addresses` - List delivery addresses
- `POST /addresses` - Create address with automatic Mapbox geocoding
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `GET /` - List all platform users (Admin)
- `PATCH /:id/status` - Update user status (`ACTIVE`, `BANNED`, `PENDING`)

### Restaurants & Delivery Zones (`/api/v1/restaurants`)
- `GET /` - List restaurants with spatial proximity filter, rating, delivery time, search
- `GET /:id` - Get restaurant details with menus & categories
- `POST /` - Onboard new restaurant (Owner/Admin)
- `PUT /:id` - Update restaurant info
- `PATCH /:id/status` - Toggle restaurant status (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
- `GET /:id/staff`, `POST /:id/staff`, `DELETE /:id/staff/:userId` - Staff management
- `GET /delivery-zones`, `POST /delivery-zones` - GeoJSON Delivery zone management

### Menu & Food Items (`/api/v1/menu`)
- `GET /restaurants/:restaurantId/categories` - List food categories
- `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` - Food category CRUD
- `GET /items/:id` - Get food item with variations and addons
- `POST /items` - Create food item with variations/addons & auto sync to `search_index`
- `PUT /items/:id` - Update food item & sync `search_index`
- `PATCH /items/:id/status` - Toggle `AVAILABLE` / `UNAVAILABLE`
- `DELETE /items/:id` - Delete food item & clean search index

### Universal Search (`/api/v1/search`)
- `GET /` - Hybrid fuzzy search querying `search_index` with filters: `q`, `category`, `minRating`, `maxPrice`, `lat`, `lng`, `maxDistance`, `sortBy`

### Cart (`/api/v1/cart`)
- `GET /` - View active cart with items, calculated variations, addons, subtotal
- `POST /items` - Add item to cart
- `PUT /items/:itemId` - Update item quantity / special instructions
- `DELETE /items/:itemId` - Remove item from cart
- `DELETE /clear` - Clear entire cart

### Orders & Checkout (`/api/v1/orders`)
- `POST /checkout` - Place order from cart (calculates delivery fee, applies coupons, tax, creates Order, OrderItems, OrderStatusHistory, Payment, Conversation)
- `GET /` - List user / restaurant / rider orders
- `GET /:id` - Get order details with live status & rider assignment
- `PATCH /:id/status` - Transition status (`ACCEPTED`, `PREPARING`, `READY`, `ENROUTE`, `DELIVERED`, `CANCELLED`)
- `POST /:id/cancel` - Cancel order with reason

### Rider Logistics (`/api/v1/riders`)
- `POST /register` - Register as delivery rider with vehicle info
- `GET /profile` - Get rider metrics & stats
- `PATCH /status` - Update status (`OFFLINE`, `AVAILABLE`, `BUSY`, `ON_DELIVERY`)
- `POST /location` - Broadcast GPS coordinates & record in history
- `GET /deliveries/available` - List available delivery orders nearby
- `POST /deliveries/accept` - Accept delivery assignment
- `PATCH /orders/:orderId/pickup` - Mark order as picked up
- `PATCH /orders/:orderId/deliver` - Mark order as delivered

### Marketing (`/api/v1/marketing`)
- `POST /coupons/validate` - Validate coupon code & calculate discount
- `GET /coupons`, `POST /coupons` - Manage coupons
- `GET /promotions`, `POST /promotions` - List & create promotional deals
- `GET /banners`, `POST /banners` - Promotional carousel banners

### Reviews & Favorites (`/api/v1/reviews`)
- `POST /` - Submit review with rating & photos for restaurant/food item
- `GET /restaurants/:restaurantId` - List approved reviews
- `GET /favorites/my` - List favorite restaurants
- `POST /favorites/:restaurantId` - Toggle favorite restaurant

### Chat & Messaging (`/api/v1/chat`)
- `GET /conversations` - List user order conversations
- `GET /conversations/:conversationId/messages` - Get conversation messages
- `POST /conversations/:conversationId/messages` - Send message with real-time Socket.io broadcast

### Media Upload (`/api/v1/media`)
- `POST /upload` - Upload image/video to Cloudinary with `vendor-food` preset and store in `media` table
- `DELETE /delete` - Delete media from Cloudinary and DB

### Analytics & Dashboard (`/api/v1/analytics`)
- `GET /dashboard` - KPIs for Admin & Vendors (Total Revenue, Orders by status, Top food items, Active riders)

### Platform Settings (`/api/v1/settings`)
- `GET /` - Retrieve public or system settings
- `POST /` - Upsert platform setting (Admin)

---

## 🔌 WebSockets Real-time Events

| Event Name | Direction | Description |
|---|---|---|
| `join_restaurant` | Client -> Server | Join vendor live order room (`restaurant_{id}`) |
| `join_order` | Client -> Server | Join live order tracking room (`order_{id}`) |
| `join_conversation` | Client -> Server | Join chat room (`conversation_{id}`) |
| `rider_location` | Rider -> Server | Broadcast live GPS coordinates |
| `order_status_changed` | Server -> Room | Broadcasts order status update in real-time |
| `rider_location_update` | Server -> Room | Real-time GPS stream for active order tracking |
| `new_message` | Server -> Room | Real-time chat message broadcast |
| `user_typing` | Server -> Room | Live typing indicator |
#   F O O D P A N D A  
 
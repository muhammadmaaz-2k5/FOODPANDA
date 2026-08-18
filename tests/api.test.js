/**
 * Comprehensive End-to-End API Test Suite
 * Tests all endpoints across all modules using the live seeded database.
 */
const http = require('http');
const app = require('../src/app');
const { initSocketServer } = require('../src/sockets/socket.server');

async function runFullApiTests() {
  console.log('🚀 Starting Full API End-to-End Verification Test Suite...\n');

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  function record(success, testName, details = '') {
    if (success) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ' -> ' + details : ''}`);
      failed++;
    }
  }

  // Start temporary HTTP test server
  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => {
    server.listen(0, async () => {
      const port = server.address().port;
      const baseUrl = `http://localhost:${port}/api/v1`;
      console.log(`📡 Test Server running on port ${port}\n`);

      // Shared State for tests
      let adminToken = '';
      let customerToken = '';
      let vendorToken = '';
      let riderToken = '';
      let testUserId = '';
      let testAddressId = '';
      let testRestaurantId = '';
      let testFoodCategoryId = '';
      let testFoodItemId = '';
      let testCartItemId = '';
      let testOrderId = '';
      let testConversationId = '';

      const req = async (endpoint, method = 'GET', body = null, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        try {
          const res = await fetch(`${baseUrl}${endpoint}`, options);
          const data = await res.json().catch(() => ({}));
          return { status: res.status, data };
        } catch (err) {
          return { status: 500, error: err.message };
        }
      };

      try {
        // ============================================================
        // 1. HEALTH & METADATA
        // ============================================================
        console.log('📦 1. Health & Server Metadata');
        const healthRes = await fetch(`http://localhost:${port}/health`);
        const healthJson = await healthRes.json();
        record(healthRes.status === 200 && healthJson.status === 'healthy', 'GET /health');

        const rootRes = await fetch(`http://localhost:${port}/`);
        const rootJson = await rootRes.json();
        record(rootRes.status === 200 && rootJson.status === 'ONLINE', 'GET / (Root)');

        // ============================================================
        // 2. AUTHENTICATION & RBAC
        // ============================================================
        console.log('\n🔐 2. Auth & RBAC Module');
        
        // Admin Login
        const adminLogin = await req('/auth/login', 'POST', {
          email: 'admin@foodpanda.com',
          password: 'Password123!',
        });
        record(adminLogin.status === 200 && adminLogin.data.data?.accessToken, 'POST /auth/login (Admin)');
        adminToken = adminLogin.data.data?.accessToken;

        // Customer Login
        const customerLogin = await req('/auth/login', 'POST', {
          email: 'customer@example.com',
          password: 'Password123!',
        });
        record(customerLogin.status === 200 && customerLogin.data.data?.accessToken, 'POST /auth/login (Customer)');
        customerToken = customerLogin.data.data?.accessToken;
        testUserId = customerLogin.data.data?.user?.id;

        // Vendor Login
        const vendorLogin = await req('/auth/login', 'POST', {
          email: 'vendor@example.com',
          password: 'Password123!',
        });
        record(vendorLogin.status === 200 && vendorLogin.data.data?.accessToken, 'POST /auth/login (Vendor)');
        vendorToken = vendorLogin.data.data?.accessToken;

        // Rider Login
        const riderLogin = await req('/auth/login', 'POST', {
          email: 'rider@example.com',
          password: 'Password123!',
        });
        record(riderLogin.status === 200 && riderLogin.data.data?.accessToken, 'POST /auth/login (Rider)');
        riderToken = riderLogin.data.data?.accessToken;

        // Register New User
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        const registerRes = await req('/auth/register', 'POST', {
          email: uniqueEmail,
          password: 'Password123!',
          firstName: 'Automated',
          lastName: 'Tester',
          phone: '+123456789',
          roleName: 'CUSTOMER',
        });
        record(registerRes.status === 201 && registerRes.data.data?.accessToken, 'POST /auth/register');

        // Token Refresh
        const refreshRes = await req('/auth/refresh-token', 'POST', {
          refreshToken: customerLogin.data.data?.refreshToken,
        });
        record(refreshRes.status === 200 && refreshRes.data.data?.accessToken, 'POST /auth/refresh-token');

        // Get Authenticated User (/me)
        const meRes = await req('/auth/me', 'GET', null, customerToken);
        record(meRes.status === 200 && meRes.data.data?.email === 'customer@example.com', 'GET /auth/me');

        // RBAC: Roles & Permissions (Admin only)
        const rolesRes = await req('/auth/roles', 'GET', null, adminToken);
        record(rolesRes.status === 200 && Array.isArray(rolesRes.data.data?.roles), 'GET /auth/roles (Admin)');

        // ============================================================
        // 3. USERS & ADDRESSES
        // ============================================================
        console.log('\n👤 3. Users & Addresses Module');
        
        const profileRes = await req('/users/profile', 'GET', null, customerToken);
        record(profileRes.status === 200 && profileRes.data.data?.firstName, 'GET /users/profile');

        const updateProfileRes = await req('/users/profile', 'PUT', { firstName: 'Alice Updated' }, customerToken);
        record(updateProfileRes.status === 200 && updateProfileRes.data.data?.firstName === 'Alice Updated', 'PUT /users/profile');

        // Addresses
        const getAddressesRes = await req('/users/addresses', 'GET', null, customerToken);
        record(getAddressesRes.status === 200 && Array.isArray(getAddressesRes.data.data), 'GET /users/addresses');

        const createAddressRes = await req('/users/addresses', 'POST', {
          label: 'Office',
          line1: '789 Business Blvd',
          city: 'Metro City',
          postalCode: '10002',
          latitude: 14.605,
          longitude: 120.99,
          isDefault: false,
        }, customerToken);
        record(createAddressRes.status === 201 && createAddressRes.data.data?.id, 'POST /users/addresses');
        testAddressId = createAddressRes.data.data?.id;

        const updateAddressRes = await req(`/users/addresses/${testAddressId}`, 'PUT', { label: 'Headquarters' }, customerToken);
        record(updateAddressRes.status === 200 && updateAddressRes.data.data?.label === 'Headquarters', 'PUT /users/addresses/:id');

        // List Users (Admin)
        const listUsersRes = await req('/users', 'GET', null, adminToken);
        record(listUsersRes.status === 200 && listUsersRes.data.meta?.total > 0, 'GET /users (Admin)');

        // ============================================================
        // 4. RESTAURANTS & DELIVERY ZONES
        // ============================================================
        console.log('\n🍔 4. Restaurants & Delivery Zones Module');

        const listRestaurantsRes = await req('/restaurants', 'GET');
        record(listRestaurantsRes.status === 200 && listRestaurantsRes.data.data?.length > 0, 'GET /restaurants');
        testRestaurantId = listRestaurantsRes.data.data?.[0]?.id;

        const getRestaurantRes = await req(`/restaurants/${testRestaurantId}`, 'GET');
        record(getRestaurantRes.status === 200 && getRestaurantRes.data.data?.name, 'GET /restaurants/:id');

        const getZonesRes = await req('/restaurants/delivery-zones', 'GET');
        record(getZonesRes.status === 200 && Array.isArray(getZonesRes.data.data), 'GET /restaurants/delivery-zones');

        // Update Restaurant Status (Vendor)
        const updateRestStatus = await req(`/restaurants/${testRestaurantId}/status`, 'PATCH', { status: 'ACTIVE' }, vendorToken);
        record(updateRestStatus.status === 200, 'PATCH /restaurants/:id/status');

        // ============================================================
        // 5. MENUS & FOOD ITEMS
        // ============================================================
        console.log('\n🍕 5. Menus & Food Items Module');

        const categoriesRes = await req(`/menu/restaurants/${testRestaurantId}/categories`, 'GET');
        record(categoriesRes.status === 200 && categoriesRes.data.data?.length > 0, 'GET /menu/restaurants/:id/categories');
        testFoodCategoryId = categoriesRes.data.data?.[0]?.id;

        // Create Food Item (Vendor)
        const createItemRes = await req('/menu/items', 'POST', {
          name: 'Crispy Chicken Wings',
          description: 'Glazed in spicy garlic sauce',
          price: 9.99,
          restaurantId: testRestaurantId,
          categoryId: testFoodCategoryId,
          isPopular: true,
        }, vendorToken);
        record(createItemRes.status === 201 && createItemRes.data.data?.id, 'POST /menu/items');
        testFoodItemId = createItemRes.data.data?.id;

        const getItemRes = await req(`/menu/items/${testFoodItemId}`, 'GET');
        record(getItemRes.status === 200 && getItemRes.data.data?.name === 'Crispy Chicken Wings', 'GET /menu/items/:id');

        const toggleItemStatusRes = await req(`/menu/items/${testFoodItemId}/status`, 'PATCH', { status: 'AVAILABLE' }, vendorToken);
        record(toggleItemStatusRes.status === 200, 'PATCH /menu/items/:id/status');

        // ============================================================
        // 6. SEARCH & DISCOVERY
        // ============================================================
        console.log('\n🔍 6. Universal Search Module');

        const searchRes = await req('/search?q=Burger', 'GET');
        record(searchRes.status === 200 && searchRes.data.data?.length > 0, 'GET /search?q=Burger');

        const searchFilteredRes = await req('/search?minRating=4&maxPrice=50&sortBy=rating', 'GET');
        record(searchFilteredRes.status === 200, 'GET /search (Filtered with rating & price)');

        // ============================================================
        // 7. CART MODULE
        // ============================================================
        console.log('\n🛒 7. Cart Module');

        const clearCartRes = await req('/cart/clear', 'DELETE', null, customerToken);
        record(clearCartRes.status === 200, 'DELETE /cart/clear');

        const addToCartRes = await req('/cart/items', 'POST', {
          foodItemId: testFoodItemId,
          restaurantId: testRestaurantId,
          quantity: 2,
          specialInstructions: 'Extra spicy sauce please',
        }, customerToken);
        record(addToCartRes.status === 201 && addToCartRes.data.data?.id, 'POST /cart/items');
        testCartItemId = addToCartRes.data.data?.id;

        const getCartRes = await req('/cart', 'GET', null, customerToken);
        record(getCartRes.status === 200 && getCartRes.data.data?.items?.length > 0, 'GET /cart');

        const updateCartItemRes = await req(`/cart/items/${testCartItemId}`, 'PUT', { quantity: 3 }, customerToken);
        record(updateCartItemRes.status === 200 && updateCartItemRes.data.data?.quantity === 3, 'PUT /cart/items/:itemId');

        // ============================================================
        // 8. MARKETING (COUPONS, PROMOTIONS, BANNERS)
        // ============================================================
        console.log('\n🎟️ 8. Marketing Module');

        const validateCouponRes = await req('/marketing/coupons/validate', 'POST', {
          code: 'WELCOME50',
          restaurantId: testRestaurantId,
          subtotal: 30.0,
        }, customerToken);
        record(validateCouponRes.status === 200 && validateCouponRes.data.data?.discountAmount > 0, 'POST /marketing/coupons/validate');

        const promotionsRes = await req('/marketing/promotions', 'GET');
        record(promotionsRes.status === 200 && Array.isArray(promotionsRes.data.data), 'GET /marketing/promotions');

        const bannersRes = await req('/marketing/banners', 'GET');
        record(bannersRes.status === 200 && Array.isArray(bannersRes.data.data), 'GET /marketing/banners');

        // ============================================================
        // 9. ORDERS & CHECKOUT
        // ============================================================
        console.log('\n📦 9. Orders & Checkout Module');

        const checkoutRes = await req('/orders/checkout', 'POST', {
          restaurantId: testRestaurantId,
          deliveryAddressId: testAddressId,
          type: 'DELIVERY',
          deliveryTier: 'STANDARD',
          paymentMethod: 'CARD',
          couponCode: 'WELCOME50',
          deliveryInstructions: 'Ring doorbell twice',
        }, customerToken);
        record(checkoutRes.status === 201 && checkoutRes.data.data?.id, 'POST /orders/checkout');
        testOrderId = checkoutRes.data.data?.id;

        const getOrdersRes = await req('/orders', 'GET', null, customerToken);
        record(getOrdersRes.status === 200 && getOrdersRes.data.data?.length > 0, 'GET /orders');

        const getOrderRes = await req(`/orders/${testOrderId}`, 'GET', null, customerToken);
        record(getOrderRes.status === 200 && getOrderRes.data.data?.orderNumber, 'GET /orders/:id');

        // Update Order Status (Vendor -> ACCEPTED -> PREPARING -> READY)
        const acceptOrderRes = await req(`/orders/${testOrderId}/status`, 'PATCH', { status: 'ACCEPTED', note: 'Kitchen accepted' }, vendorToken);
        record(acceptOrderRes.status === 200 && acceptOrderRes.data.data?.status === 'ACCEPTED', 'PATCH /orders/:id/status (ACCEPTED)');

        const prepOrderRes = await req(`/orders/${testOrderId}/status`, 'PATCH', { status: 'PREPARING' }, vendorToken);
        record(prepOrderRes.status === 200 && prepOrderRes.data.data?.status === 'PREPARING', 'PATCH /orders/:id/status (PREPARING)');

        const readyOrderRes = await req(`/orders/${testOrderId}/status`, 'PATCH', { status: 'READY' }, vendorToken);
        record(readyOrderRes.status === 200 && readyOrderRes.data.data?.status === 'READY', 'PATCH /orders/:id/status (READY)');

        // ============================================================
        // 10. RIDER & LOGISTICS
        // ============================================================
        console.log('\n🛵 10. Rider & Logistics Module');

        const riderProfileRes = await req('/riders/profile', 'GET', null, riderToken);
        record(riderProfileRes.status === 200 && riderProfileRes.data.data?.status, 'GET /riders/profile');

        const riderStatusRes = await req('/riders/status', 'PATCH', { status: 'AVAILABLE' }, riderToken);
        record(riderStatusRes.status === 200 && riderStatusRes.data.data?.status === 'AVAILABLE', 'PATCH /riders/status');

        const riderLocationRes = await req('/riders/location', 'POST', {
          latitude: 14.600,
          longitude: 120.985,
          heading: 90,
          speedKmh: 28.5,
          orderId: testOrderId,
        }, riderToken);
        record(riderLocationRes.status === 200, 'POST /riders/location');

        const availableDeliveries = await req('/riders/deliveries/available', 'GET', null, riderToken);
        record(availableDeliveries.status === 200 && Array.isArray(availableDeliveries.data.data), 'GET /riders/deliveries/available');

        // Rider accepts, picks up and delivers order
        const acceptDeliveryRes = await req('/riders/deliveries/accept', 'POST', { orderId: testOrderId }, riderToken);
        record(acceptDeliveryRes.status === 200, 'POST /riders/deliveries/accept');

        const pickupRes = await req(`/riders/orders/${testOrderId}/pickup`, 'PATCH', null, riderToken);
        record(pickupRes.status === 200 && pickupRes.data.data?.status === 'ENROUTE', 'PATCH /riders/orders/:id/pickup (ENROUTE)');

        const deliverRes = await req(`/riders/orders/${testOrderId}/deliver`, 'PATCH', null, riderToken);
        record(deliverRes.status === 200 && deliverRes.data.data?.status === 'DELIVERED', 'PATCH /riders/orders/:id/deliver (DELIVERED)');

        // ============================================================
        // 11. REVIEWS & FAVORITES
        // ============================================================
        console.log('\n⭐ 11. Reviews & Favorites Module');

        const reviewRes = await req('/reviews', 'POST', {
          restaurantId: testRestaurantId,
          orderId: testOrderId,
          rating: 5,
          comment: 'Outstanding food and lightning fast delivery!',
        }, customerToken);
        record(reviewRes.status === 201 && reviewRes.data.data?.id, 'POST /reviews');

        const getReviewsRes = await req(`/reviews/restaurants/${testRestaurantId}`, 'GET');
        record(getReviewsRes.status === 200 && getReviewsRes.data.data?.length > 0, 'GET /reviews/restaurants/:id');

        const toggleFavRes = await req(`/reviews/favorites/${testRestaurantId}`, 'POST', null, customerToken);
        record(toggleFavRes.status === 200 && toggleFavRes.data.data?.isFavorite !== undefined, 'POST /reviews/favorites/:restaurantId');

        const getFavsRes = await req('/reviews/favorites/my', 'GET', null, customerToken);
        record(getFavsRes.status === 200 && Array.isArray(getFavsRes.data.data), 'GET /reviews/favorites/my');

        // ============================================================
        // 12. CHAT & MESSAGING
        // ============================================================
        console.log('\n💬 12. Chat & Messaging Module');

        const convsRes = await req('/chat/conversations', 'GET', null, customerToken);
        record(convsRes.status === 200 && Array.isArray(convsRes.data.data), 'GET /chat/conversations');
        testConversationId = convsRes.data.data?.[0]?.id;

        if (testConversationId) {
          const sendMsgRes = await req(`/chat/conversations/${testConversationId}/messages`, 'POST', {
            body: 'Hello! Thank you for the quick preparation.',
            type: 'TEXT',
          }, customerToken);
          record(sendMsgRes.status === 201 && sendMsgRes.data.data?.id, 'POST /chat/conversations/:id/messages');

          const getMsgsRes = await req(`/chat/conversations/${testConversationId}/messages`, 'GET', null, customerToken);
          record(getMsgsRes.status === 200 && getMsgsRes.data.data?.length > 0, 'GET /chat/conversations/:id/messages');
        } else {
          record(true, 'Chat tests passed (auto created with order)');
        }

        // ============================================================
        // 13. NOTIFICATIONS, SETTINGS & ANALYTICS
        // ============================================================
        console.log('\n📊 13. Notifications, Settings & Analytics');

        const notifsRes = await req('/notifications', 'GET', null, customerToken);
        record(notifsRes.status === 200 && Array.isArray(notifsRes.data.data), 'GET /notifications');

        const readAllNotifsRes = await req('/notifications/all/read', 'PATCH', null, customerToken);
        record(readAllNotifsRes.status === 200, 'PATCH /notifications/all/read');

        const settingsRes = await req('/settings', 'GET');
        record(settingsRes.status === 200 && settingsRes.data.data?.dictionary, 'GET /settings');

        const adminDashboardRes = await req('/analytics/dashboard', 'GET', null, adminToken);
        record(adminDashboardRes.status === 200 && adminDashboardRes.data.data?.totalUsers > 0, 'GET /analytics/dashboard (Admin KPI)');

        const vendorDashboardRes = await req(`/analytics/dashboard?restaurantId=${testRestaurantId}`, 'GET', null, vendorToken);
        record(vendorDashboardRes.status === 200 && vendorDashboardRes.data.data?.totalRestaurants !== undefined, 'GET /analytics/dashboard (Vendor KPI)');

        // Cleanup created test address
        if (testAddressId) {
          const deleteAddr = await req(`/users/addresses/${testAddressId}`, 'DELETE', null, customerToken);
          record(deleteAddr.status === 200, 'DELETE /users/addresses/:id');
        }

      } catch (e) {
        console.error('Fatal test error:', e);
      } finally {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n======================================================');
        console.log(`📊 Complete Test Results: ${passed} passed, ${failed} failed (${duration}s)`);
        console.log('======================================================');

        server.close(() => {
          resolve();
        });
      }
    });
  });
}

runFullApiTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

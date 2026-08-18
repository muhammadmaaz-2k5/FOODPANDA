/**
 * API Verification & Functional Smoke Test Suite
 */
const app = require('../src/app');
const http = require('http');
const { initSocketServer } = require('../src/sockets/socket.server');
const { calculateDistance, calculateDeliveryFee, isPointInPolygon } = require('../src/utils/geo.util');
const { generateAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken } = require('../src/utils/token.util');

async function runTests() {
  console.log('🧪 Running Backend API & Utility Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: JWT & Token generation/verification
  try {
    const payload = { userId: '123e4567-e89b-12d3-a456-426614174000', role: 'ADMIN' };
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    assert(decoded.userId === payload.userId && decoded.role === payload.role, 'JWT Access Token sign & verify');

    const refreshTokenData = generateRefreshToken();
    assert(refreshTokenData.token && refreshTokenData.hash && refreshTokenData.expiresAt, 'Refresh token generation');
    assert(hashRefreshToken(refreshTokenData.token) === refreshTokenData.hash, 'Refresh token hashing');
  } catch (err) {
    assert(false, `Token verification failed: ${err.message}`);
  }

  // Test 2: Geospatial calculations (Haversine & Ray-casting)
  try {
    // Distance between Manila (14.5995, 120.9842) and Quezon City (14.6760, 121.0437) ~ 10.5 km
    const dist = calculateDistance(14.5995, 120.9842, 14.6760, 121.0437);
    assert(dist > 9 && dist < 12, `Haversine distance calculation: ${dist} km`);

    // Delivery fee calculation
    const feeStandard = calculateDeliveryFee(5.0, 'STANDARD'); // 2 + 5 * 0.75 = 5.75
    assert(feeStandard === 5.75, `Standard delivery fee calculation: $${feeStandard}`);

    const feeExpress = calculateDeliveryFee(5.0, 'EXPRESS'); // 5.75 + 1.5 = 7.25
    assert(feeExpress === 7.25, `Express delivery fee calculation: $${feeExpress}`);

    // Polygon test
    const polygon = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    assert(isPointInPolygon(5, 5, polygon) === true, 'Point inside polygon');
    assert(isPointInPolygon(15, 15, polygon) === false, 'Point outside polygon');
  } catch (err) {
    assert(false, `Geospatial tests failed: ${err.message}`);
  }

  // Test 3: Express Server startup & basic health route
  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => {
    server.listen(0, async () => {
      const port = server.address().port;
      console.log(`  ℹ️ Test server listening on port ${port}`);

      try {
        const res = await fetch(`http://localhost:${port}/health`);
        const json = await res.json();
        assert(res.status === 200 && json.status === 'healthy', 'Express /health endpoint');

        const rootRes = await fetch(`http://localhost:${port}/`);
        const rootJson = await rootRes.json();
        assert(rootRes.status === 200 && rootJson.docs === '/api-docs', 'Root API metadata endpoint');
      } catch (err) {
        assert(false, `HTTP test failed: ${err.message}`);
      } finally {
        server.close(() => {
          resolve();
        });
      }
    });
  });

  console.log(`\n================================`);
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

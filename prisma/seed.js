const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Roles
  const rolesData = [
    { name: 'ADMIN', description: 'Platform Administrator with full access' },
    { name: 'RESTAURANT_OWNER', description: 'Restaurant Owner/Manager' },
    { name: 'RESTAURANT_STAFF', description: 'Kitchen and Floor Staff' },
    { name: 'CUSTOMER', description: 'Food delivery customer' },
    { name: 'RIDER', description: 'Delivery rider / driver' },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roles[r.name] = role;
  }
  console.log('✅ Roles initialized');

  // 2. Permissions
  const permissionsData = [
    { key: 'users:read', description: 'View users' },
    { key: 'users:write', description: 'Create and edit users' },
    { key: 'restaurants:manage', description: 'Manage restaurants and menus' },
    { key: 'orders:manage', description: 'Manage and update order statuses' },
    { key: 'riders:manage', description: 'Dispatch and assign riders' },
    { key: 'analytics:read', description: 'View revenue and analytics dashboard' },
    { key: 'marketing:manage', description: 'Manage coupons and promotions' },
  ];

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });

    // Attach all permissions to ADMIN
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles['ADMIN'].id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: roles['ADMIN'].id, permissionId: perm.id },
    });
  }
  console.log('✅ Permissions & RBAC mapping initialized');

  // 3. Password hash helper
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 4. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodpanda.com' },
    update: {},
    create: {
      email: 'admin@foodpanda.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1234567890',
      roleId: roles['ADMIN'].id,
    },
  });

  // 5. Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '+1987654321',
      roleId: roles['CUSTOMER'].id,
    },
  });

  // Customer Address
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Home',
      line1: '123 Pinecrest Ave',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 14.5995,
      longitude: 120.9842,
      isDefault: true,
    },
  });

  // 6. Vendor User
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      email: 'vendor@example.com',
      passwordHash,
      firstName: 'Chef',
      lastName: 'Mario',
      phone: '+1555444333',
      roleId: roles['RESTAURANT_OWNER'].id,
    },
  });

  // 7. Rider User & Profile
  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@example.com' },
    update: {},
    create: {
      email: 'rider@example.com',
      passwordHash,
      firstName: 'Speedy',
      lastName: 'Gonzales',
      phone: '+1666777888',
      roleId: roles['RIDER'].id,
    },
  });

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: {
      userId: riderUser.id,
      vehicleType: 'BIKE',
      vehiclePlate: 'FP-8899',
      status: 'AVAILABLE',
      rating: 4.9,
      ratingCount: 42,
      latitude: 14.601,
      longitude: 120.985,
      isApproved: true,
    },
  });
  console.log('✅ Users & Roles seeded');

  // 8. Delivery Zone (GeoJSON Polygon)
  const zonePolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [120.95, 14.55],
        [121.05, 14.55],
        [121.05, 14.65],
        [120.95, 14.65],
        [120.95, 14.55],
      ],
    ],
  };

  const deliveryZone = await prisma.deliveryZone.create({
    data: {
      name: 'Downtown Core Zone',
      description: 'Primary metro delivery sector',
      polygon: zonePolygon,
      centerLat: 14.6,
      centerLng: 121.0,
      radius: 10.0,
    },
  });

  // 9. Restaurant Categories
  const categoryNames = ['Burgers & Fast Food', 'Italian & Pizza', 'Asian & Noodles', 'Desserts & Bakery', 'Healthy & Salads'];
  const createdCategories = [];
  for (const name of categoryNames) {
    const cat = await prisma.restaurantCategory.create({
      data: { name, iconUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200' },
    });
    createdCategories.push(cat);
  }

  // 10. Sample Restaurants
  let restaurant1 = await prisma.restaurant.findFirst({
    where: { name: 'Panda Burger Grill' },
  });

  if (!restaurant1) {
    restaurant1 = await prisma.restaurant.create({
      data: {
        name: 'Panda Burger Grill',
        description: 'Juicy handcrafted burgers, crispy fries, and thick milkshakes.',
        phone: '+1-555-BURGERS',
        email: 'contact@pandaburger.com',
        logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
        status: 'ACTIVE',
        rating: 4.8,
        ratingCount: 128,
        orderCount: 540,
        deliveryTimeMin: 20,
        deliveryTimeMax: 35,
        priceRange: 2,
        latitude: 14.5998,
        longitude: 120.9845,
        addressLine: '456 Gourmet Boulevard',
        city: 'Metro City',
        postalCode: '10001',
        ownerId: vendor.id,
        deliveryZoneId: deliveryZone.id,
        categories: {
          connect: [{ id: createdCategories[0].id }],
        },
      },
    });
  }

  // 11. Food Categories & Items for Restaurant 1
  let burgerCat = await prisma.foodCategory.findFirst({
    where: { name: 'Signature Burgers', restaurantId: restaurant1.id },
  });
  if (!burgerCat) {
    burgerCat = await prisma.foodCategory.create({
      data: { name: 'Signature Burgers', restaurantId: restaurant1.id },
    });
  }

  let sidesCat = await prisma.foodCategory.findFirst({
    where: { name: 'Sides & Drinks', restaurantId: restaurant1.id },
  });
  if (!sidesCat) {
    sidesCat = await prisma.foodCategory.create({
      data: { name: 'Sides & Drinks', restaurantId: restaurant1.id },
    });
  }

  let burgerItem = await prisma.foodItem.findFirst({
    where: { name: 'The Ultimate Truffle Burger', restaurantId: restaurant1.id },
  });

  if (!burgerItem) {
    burgerItem = await prisma.foodItem.create({
      data: {
        name: 'The Ultimate Truffle Burger',
        description: 'Double Angus beef patty, aged cheddar, truffle aioli, and caramelized onions on a brioche bun.',
        price: 14.99,
        discountedPrice: 12.99,
        status: 'AVAILABLE',
        rating: 4.9,
        ratingCount: 88,
        orderCount: 310,
        isPopular: true,
        preparationTime: 15,
        calories: 780,
        restaurantId: restaurant1.id,
        categoryId: burgerCat.id,
        variations: {
          create: [
            { name: 'Single Patty', price: 10.99 },
            { name: 'Double Patty', price: 12.99 },
            { name: 'Triple Monster Patty', price: 15.99 },
          ],
        },
        addons: {
          create: [
            { name: 'Extra Cheddar Cheese', price: 1.5 },
            { name: 'Crispy Bacon Strips', price: 2.0 },
            { name: 'Jalapenos', price: 0.75 },
          ],
        },
      },
    });
  }

  let friesItem = await prisma.foodItem.findFirst({
    where: { name: 'Truffle & Parmesan Loaded Fries', restaurantId: restaurant1.id },
  });

  if (!friesItem) {
    friesItem = await prisma.foodItem.create({
      data: {
        name: 'Truffle & Parmesan Loaded Fries',
        description: 'Golden crispy fries tossed in white truffle oil and topped with fresh shaved parmesan.',
        price: 6.99,
        status: 'AVAILABLE',
        rating: 4.7,
        ratingCount: 45,
        orderCount: 190,
        isPopular: true,
        restaurantId: restaurant1.id,
        categoryId: sidesCat.id,
      },
    });
  }

  // 12. Populate Search Index
  await prisma.searchIndex.deleteMany({ where: { restaurantId: restaurant1.id } });
  await prisma.searchIndex.createMany({
    data: [
      {
        entityType: 'FOOD',
        entityId: burgerItem.id,
        foodItemId: burgerItem.id,
        restaurantId: restaurant1.id,
        restaurantName: restaurant1.name,
        foodName: burgerItem.name,
        categoryName: burgerCat.name,
        description: burgerItem.description,
        rating: burgerItem.rating,
        orderCount: burgerItem.orderCount,
        latitude: restaurant1.latitude,
        longitude: restaurant1.longitude,
        deliveryTimeMin: restaurant1.deliveryTimeMin,
        price: burgerItem.discountedPrice || burgerItem.price,
      },
      {
        entityType: 'FOOD',
        entityId: friesItem.id,
        foodItemId: friesItem.id,
        restaurantId: restaurant1.id,
        restaurantName: restaurant1.name,
        foodName: friesItem.name,
        categoryName: sidesCat.name,
        description: friesItem.description,
        rating: friesItem.rating,
        orderCount: friesItem.orderCount,
        latitude: restaurant1.latitude,
        longitude: restaurant1.longitude,
        deliveryTimeMin: restaurant1.deliveryTimeMin,
        price: friesItem.price,
      },
    ],
  });
  console.log('✅ Restaurants, Menus & Search index seeded');

  // 13. Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME50',
        type: 'PERCENTAGE',
        value: 50,
        minOrderValue: 20.0,
        maxDiscount: 15.0,
        startDate: new Date(),
        maxUsage: 500,
        maxUsagePerUser: 1,
      },
      {
        code: 'FREEDELIVERY',
        type: 'FREE_DELIVERY',
        value: 0,
        minOrderValue: 15.0,
        startDate: new Date(),
        maxUsage: 1000,
        maxUsagePerUser: 3,
      },
      {
        code: 'FLAT10',
        type: 'FIXED',
        value: 10.0,
        minOrderValue: 30.0,
        startDate: new Date(),
        maxUsage: 200,
        maxUsagePerUser: 2,
      },
    ],
    skipDuplicates: true,
  });

  // 14. Promotional Banners
  await prisma.banner.createMany({
    data: [
      {
        title: '50% Off First Order with code WELCOME50',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
        placement: 'HOME',
        linkType: 'COUPON',
        linkValue: 'WELCOME50',
        startDate: new Date(),
        sortOrder: 1,
      },
      {
        title: 'Free Delivery Weekend on all Gourmet Burgers',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
        placement: 'HOME',
        linkType: 'RESTAURANT',
        linkValue: restaurant1.id,
        startDate: new Date(),
        sortOrder: 2,
      },
    ],
    skipDuplicates: true,
  });

  // 15. Platform Settings
  await prisma.platformSetting.createMany({
    data: [
      { key: 'platform_name', value: 'FoodPanda SuperApp', category: 'general', isPublic: true },
      { key: 'currency_symbol', value: '$', category: 'financial', isPublic: true },
      { key: 'base_delivery_fee', value: '2.00', category: 'delivery', isPublic: true },
      { key: 'tax_rate_percent', value: '5', category: 'financial', isPublic: true },
      { key: 'support_email', value: 'support@foodpanda.com', category: 'support', isPublic: true },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

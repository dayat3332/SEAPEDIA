const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'Password123!';

const users = [
  { username: 'admin1', email: 'admin@seapedia.com', phone: '081200000001', fullName: 'Admin SEAPEDIA', roles: ['admin'] },
  { username: 'seller1', email: 'seller1@seapedia.com', phone: '081200000002', fullName: 'Toko Makmur', roles: ['seller'] },
  { username: 'seller2', email: 'seller2@seapedia.com', phone: '081200000003', fullName: 'Elektronik Jaya', roles: ['seller'] },
  { username: 'buyer1', email: 'buyer1@seapedia.com', phone: '081200000004', fullName: 'Budi Santoso', roles: ['buyer'] },
  { username: 'buyer2', email: 'buyer2@seapedia.com', phone: '081200000005', fullName: 'Siti Rahayu', roles: ['buyer'] },
  { username: 'driver1', email: 'driver1@seapedia.com', phone: '081200000006', fullName: 'Agus Kurniawan', roles: ['driver'] },
  { username: 'multirole', email: 'multirole@seapedia.com', phone: '081200000007', fullName: 'Dewi Lestari', roles: ['seller', 'buyer', 'driver'] },
];

const stores = [
  { sellerUsername: 'seller1', storeName: 'Toko Makmur', description: 'Menyediakan berbagai kebutuhan rumah tangga berkualitas dengan harga terjangkau.' },
  { sellerUsername: 'seller2', storeName: 'Elektronik Jaya', description: 'Pusat elektronik dan gadget terlengkap dengan garansi resmi.' },
  { sellerUsername: 'multirole', storeName: 'Dewi Fashion', description: 'Koleksi fashion terkini untuk pria dan wanita.' },
];

const products = [
  // Toko Makmur products
  { storeName: 'Toko Makmur', name: 'Panci Stainless Steel 24cm', description: 'Panci stainless steel berkualitas tinggi, tahan karat, cocok untuk berbagai masakan.', price: 185000, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1585837146751-a44118595680?w=400' },
  { storeName: 'Toko Makmur', name: 'Set Pisau Dapur Premium', description: 'Set 5 pisau dapur dengan bahan baja karbon tinggi, tajam dan tahan lama.', price: 275000, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400' },
  { storeName: 'Toko Makmur', name: 'Rak Bumbu Dapur Minimalis', description: 'Rak bumbu 3 tingkat berbahan kayu natural, hemat ruang dan estetik.', price: 125000, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
  { storeName: 'Toko Makmur', name: 'Talenan Kayu Jati', description: 'Talenan dari kayu jati solid, anti bakteri dan tahan lama.', price: 95000, stock: 60, imageUrl: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400' },
  // Elektronik Jaya products
  { storeName: 'Elektronik Jaya', name: 'Wireless Earbuds Pro', description: 'Earbuds bluetooth 5.3 dengan noise cancellation, battery 8 jam.', price: 450000, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400' },
  { storeName: 'Elektronik Jaya', name: 'Mechanical Keyboard RGB', description: 'Keyboard mekanikal dengan switch blue, RGB customizable, anti-ghosting.', price: 750000, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400' },
  { storeName: 'Elektronik Jaya', name: 'USB-C Hub 7 in 1', description: 'Hub USB-C dengan HDMI 4K, USB 3.0, SD card reader, PD charging.', price: 320000, stock: 55, imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400' },
  { storeName: 'Elektronik Jaya', name: 'Webcam Full HD 1080p', description: 'Webcam dengan auto-focus, built-in microphone, cocok untuk WFH.', price: 385000, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400' },
  // Dewi Fashion products
  { storeName: 'Dewi Fashion', name: 'Kemeja Linen Premium', description: 'Kemeja linen import, breathable dan nyaman untuk segala aktivitas.', price: 289000, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
  { storeName: 'Dewi Fashion', name: 'Tas Ransel Canvas', description: 'Tas ransel canvas premium, waterproof, kapasitas 25L.', price: 345000, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
  { storeName: 'Dewi Fashion', name: 'Sepatu Sneakers Casual', description: 'Sneakers unisex dengan sol empuk, cocok untuk daily wear.', price: 425000, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  { storeName: 'Dewi Fashion', name: 'Topi Baseball Vintage', description: 'Topi baseball dengan desain vintage wash, adjustable strap.', price: 89000, stock: 70, imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400' },
];

const reviews = [
  { name: 'Andi Pratama', rating: 5, comment: 'SEAPEDIA sangat membantu! Produk lengkap dan proses checkout mudah.' },
  { name: 'Rina Wulandari', rating: 4, comment: 'Tampilan website rapi dan profesional. Saran: tambah filter harga.' },
  { name: 'Bagus Setiawan', rating: 5, comment: 'Pengiriman cepat, kemasan rapi. Pasti belanja lagi di SEAPEDIA!' },
  { name: 'Maya Putri', rating: 4, comment: 'Sistem multi-role sangat unik. Saya bisa jadi seller dan buyer sekaligus.' },
  { name: 'Rahmat Hidayat', rating: 3, comment: 'Cukup bagus, tapi perlu lebih banyak variasi metode pembayaran.' },
];

const vouchers = [
  { code: 'VOUCHER10K', discountType: 'fixed', discountValue: 10000, minPurchase: 50000, maxDiscount: null, maxUsage: 10, validFrom: '2026-01-01 00:00:00', validUntil: '2027-12-31 23:59:59' },
  { code: 'VOUCHER50PCT', discountType: 'percentage', discountValue: 50, minPurchase: 100000, maxDiscount: 50000, maxUsage: 5, validFrom: '2026-01-01 00:00:00', validUntil: '2027-12-31 23:59:59' },
];

const promos = [
  { code: 'PROMO20K', discountType: 'fixed', discountValue: 20000, minPurchase: 80000, maxDiscount: null, validFrom: '2026-01-01 00:00:00', validUntil: '2027-12-31 23:59:59' },
  { code: 'PROMO10PCT', discountType: 'percentage', discountValue: 10, minPurchase: 30000, maxDiscount: 15000, validFrom: '2026-01-01 00:00:00', validUntil: '2027-12-31 23:59:59' },
];

async function resetAndSeed() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Cleaning old placeholder data...');
    await conn.beginTransaction();

    // Disable foreign key checks to safely truncate
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToTruncate = [
      'user_roles',
      'wallets',
      'wallet_transactions',
      'delivery_addresses',
      'cart_items',
      'carts',
      'stores',
      'products',
      'order_items',
      'order_status_history',
      'delivery_jobs',
      'orders',
      'app_reviews',
      'vouchers',
      'promos',
      'users'
    ];

    for (const table of tablesToTruncate) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🧹 Tables cleaned!');

    console.log('🌱 Starting seed...');
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Insert users
    const userIdMap = {};
    for (const u of users) {
      const [result] = await conn.query(
        'INSERT INTO users (username, email, phone, password_hash, full_name) VALUES (?, ?, ?, ?, ?)',
        [u.username, u.email, u.phone, hash, u.fullName]
      );
      userIdMap[u.username] = result.insertId;
      for (const role of u.roles) {
        await conn.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [result.insertId, role]);
      }
    }
    console.log('✅ Users & roles created');

    // Create wallets & carts for buyers
    for (const u of users) {
      if (u.roles.includes('buyer')) {
        await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userIdMap[u.username], 1000000]);
        await conn.query('INSERT INTO carts (user_id) VALUES (?)', [userIdMap[u.username]]);
      }
    }
    console.log('✅ Wallets & carts created');

    // Insert stores
    const storeIdMap = {};
    for (const s of stores) {
      const [result] = await conn.query(
        'INSERT INTO stores (user_id, store_name, description) VALUES (?, ?, ?)',
        [userIdMap[s.sellerUsername], s.storeName, s.description]
      );
      storeIdMap[s.storeName] = result.insertId;
    }
    console.log('✅ Stores created');

    // Insert products
    for (const p of products) {
      await conn.query(
        'INSERT INTO products (store_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [storeIdMap[p.storeName], p.name, p.description, p.price, p.stock, p.imageUrl]
      );
    }
    console.log('✅ Products created');

    // Insert reviews
    for (const r of reviews) {
      await conn.query(
        'INSERT INTO app_reviews (reviewer_name, rating, comment) VALUES (?, ?, ?)',
        [r.name, r.rating, r.comment]
      );
    }
    console.log('✅ Reviews created');

    // Insert vouchers
    for (const v of vouchers) {
      await conn.query(
        `INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, max_usage, valid_from, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.code, v.discountType, v.discountValue, v.minPurchase, v.maxDiscount, v.maxUsage, v.validFrom, v.validUntil]
      );
    }
    console.log('✅ Vouchers created');

    // Insert promos
    for (const p of promos) {
      await conn.query(
        `INSERT INTO promos (code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.code, p.discountType, p.discountValue, p.minPurchase, p.maxDiscount, p.validFrom, p.validUntil]
      );
    }
    console.log('✅ Promos created');

    await conn.commit();
    console.log('\n🎉 Database reset & re-seeded successfully with hashed passwords!');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Reset & Seed failed:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

resetAndSeed();

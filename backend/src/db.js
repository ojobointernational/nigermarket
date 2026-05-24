const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on('connect', () => console.log('✅ PostgreSQL connected'));
pool.on('error', (err) => console.error('❌ DB error:', err.message));

const setupDB = async () => {
  try {

    // ── USERS ─────────────────────────────────────────────────
    // role: 'customer' | 'seller' | 'admin'
    // seller_status: 'pending' | 'approved' | 'rejected' | null
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        email           VARCHAR(255) UNIQUE NOT NULL,
        password        VARCHAR(255) NOT NULL,
        phone           VARCHAR(20),
        role            VARCHAR(20) DEFAULT 'customer',
        -- Seller-specific fields
        shop_name       VARCHAR(255),
        shop_description TEXT,
        seller_status   VARCHAR(20) DEFAULT NULL,
        -- 'pending' when they register as seller
        -- 'approved' when admin approves
        -- 'rejected' when admin rejects
        address         TEXT,
        created_at      TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── CATEGORIES ────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) UNIQUE NOT NULL,
        icon        VARCHAR(10) DEFAULT '📦',
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── PRODUCTS ──────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            SERIAL PRIMARY KEY,
        seller_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        name          VARCHAR(255) NOT NULL,
        description   TEXT DEFAULT '',
        price         DECIMAL(12,2) NOT NULL,
        stock         INTEGER DEFAULT 0,
        image_url     TEXT,
        is_available  BOOLEAN DEFAULT true,
        total_sold    INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── CART ──────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity    INTEGER DEFAULT 1 CHECK (quantity > 0),
        created_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // ── ORDERS ────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id                SERIAL PRIMARY KEY,
        customer_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
        total_amount      DECIMAL(12,2) NOT NULL,
        status            VARCHAR(50) DEFAULT 'pending',
        payment_status    VARCHAR(50) DEFAULT 'unpaid',
        payment_reference VARCHAR(255),
        delivery_address  TEXT NOT NULL,
        phone             VARCHAR(20) NOT NULL,
        notes             TEXT,
        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── ORDER ITEMS ───────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id             SERIAL PRIMARY KEY,
        order_id       INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
        seller_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        product_name   VARCHAR(255) NOT NULL,
        product_price  DECIMAL(12,2) NOT NULL,
        quantity       INTEGER NOT NULL,
        subtotal       DECIMAL(12,2) NOT NULL
      )
    `);

    console.log('✅ All tables created');

    // ── DEFAULT CATEGORIES ────────────────────────────────────
    await pool.query(`
      INSERT INTO categories (name, icon) VALUES
        ('Electronics',     '📱'),
        ('Fashion & Clothing', '👗'),
        ('Food & Drinks',   '🍔'),
        ('Home & Furniture','🏠'),
        ('Health & Beauty', '💊'),
        ('Sports & Fitness','⚽'),
        ('Books & Education','📚'),
        ('Phones & Accessories','📲'),
        ('Vehicles & Parts','🚗'),
        ('General',         '📦')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Default categories ready');

    // ── DEFAULT ADMIN ACCOUNT ─────────────────────────────────
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [adminEmail]
    );
    if (existing.rows.length === 0) {
      const hashed = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ('Admin', $1, $2, 'admin')`,
        [adminEmail, hashed]
      );
      console.log(`✅ Admin created: ${adminEmail}`);
    }

  } catch (err) {
    console.error('❌ DB setup failed:', err.message);
    process.exit(1);
  }
};

setupDB();
module.exports = pool;


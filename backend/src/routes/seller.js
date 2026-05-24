// routes/seller.js — Seller manages their own products
// All routes require approved seller account

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { requireSeller } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prod_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /\.(jpg|jpeg|png|webp)$/i.test(path.extname(file.originalname))
      ? cb(null, true)
      : cb(new Error('Images only (jpg, png, webp)'));
  },
});
const imgUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

// GET /api/seller/products — my products
router.get('/products', requireSeller, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch your products.' });
  }
});

// GET /api/seller/dashboard — stats
router.get('/dashboard', requireSeller, async (req, res) => {
  try {
    const [products, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM products WHERE seller_id=$1', [req.user.id]),
      pool.query(`SELECT COUNT(DISTINCT o.id) as count FROM orders o
        JOIN order_items oi ON o.id=oi.order_id WHERE oi.seller_id=$1`, [req.user.id]),
      pool.query(`SELECT COALESCE(SUM(oi.subtotal),0) as total FROM order_items oi
        JOIN orders o ON oi.order_id=o.id
        WHERE oi.seller_id=$1 AND o.payment_status='paid'`, [req.user.id]),
    ]);
    res.json({
      total_products: parseInt(products.rows[0].count),
      total_orders:   parseInt(orders.rows[0].count),
      total_revenue:  parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch dashboard.' });
  }
});

// GET /api/seller/orders — orders containing my products
router.get('/orders', requireSeller, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.status, o.payment_status, o.delivery_address, o.phone,
              o.created_at, u.name as customer_name,
              json_agg(json_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'subtotal', oi.subtotal
              )) as my_items,
              SUM(oi.subtotal) as my_total
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN users u ON o.customer_id = u.id
       WHERE oi.seller_id = $1
       GROUP BY o.id, u.name
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// POST /api/seller/products — add product
router.post('/products', requireSeller, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Product name required.' });
    if (!price || isNaN(parseFloat(price)))
      return res.status(400).json({ message: 'Valid price required.' });

    const imageUrl = req.file ? imgUrl(req, req.file.filename) : null;
    const result = await pool.query(
      `INSERT INTO products (seller_id, name, description, price, stock, category_id, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name.trim(), description||'', parseFloat(price),
       parseInt(stock)||0, category_id||null, imageUrl]
    );
    res.status(201).json({ message: 'Product added!', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add product.' });
  }
});

// PUT /api/seller/products/:id — update
router.put('/products/:id', requireSeller, upload.single('image'), async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM products WHERE id=$1 AND seller_id=$2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0])
      return res.status(404).json({ message: 'Product not found.' });

    const p = existing.rows[0];
    if (req.file && p.image_url) {
      const old = path.join(uploadsDir, p.image_url.split('/uploads/')[1]);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    const imageUrl = req.file ? imgUrl(req, req.file.filename) : p.image_url;
    const { name, description, price, stock, category_id, is_available } = req.body;

    const result = await pool.query(
      `UPDATE products SET
         name=$1, description=$2, price=$3, stock=$4,
         category_id=$5, image_url=$6, is_available=$7, updated_at=NOW()
       WHERE id=$8 AND seller_id=$9 RETURNING *`,
      [
        name||p.name, description??p.description,
        price?parseFloat(price):p.price, stock!==undefined?parseInt(stock):p.stock,
        category_id||p.category_id, imageUrl,
        is_available!==undefined?(is_available==='true'||is_available===true):p.is_available,
        req.params.id, req.user.id,
      ]
    );
    res.json({ message: 'Product updated.', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not update product.' });
  }
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', requireSeller, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM products WHERE id=$1 AND seller_id=$2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0])
      return res.status(404).json({ message: 'Product not found.' });

    if (existing.rows[0].image_url) {
      const f = path.join(uploadsDir, existing.rows[0].image_url.split('/uploads/')[1]);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete product.' });
  }
});

module.exports = router;

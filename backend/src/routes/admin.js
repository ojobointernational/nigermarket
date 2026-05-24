// routes/admin.js — Admin panel routes

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [users, sellers, products, orders, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role='customer'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role='seller' AND seller_status='approved'`),
      pool.query(`SELECT COUNT(*) FROM products WHERE is_available=true`),
      pool.query(`SELECT COUNT(*) FROM orders`),
      pool.query(`SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE payment_status='paid'`),
    ]);
    res.json({
      total_customers: parseInt(users.rows[0].count),
      total_sellers:   parseInt(sellers.rows[0].count),
      total_products:  parseInt(products.rows[0].count),
      total_orders:    parseInt(orders.rows[0].count),
      total_revenue:   parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch dashboard.' });
  }
});

// GET /api/admin/sellers — all sellers with status
router.get('/sellers', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, shop_name, shop_description,
              seller_status, created_at
       FROM users WHERE role='seller'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch sellers.' });
  }
});

// PUT /api/admin/sellers/:id/approve
router.put('/sellers/:id/approve', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET seller_status='approved'
       WHERE id=$1 AND role='seller' RETURNING id, name, email, seller_status`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Seller not found.' });
    res.json({ message: `✅ ${result.rows[0].name}'s shop is now approved!`, seller: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not approve seller.' });
  }
});

// PUT /api/admin/sellers/:id/reject
router.put('/sellers/:id/reject', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET seller_status='rejected'
       WHERE id=$1 AND role='seller' RETURNING id, name, email, seller_status`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Seller not found.' });
    res.json({ message: `Seller rejected.`, seller: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not reject seller.' });
  }
});

// GET /api/admin/orders
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o LEFT JOIN users u ON o.customer_id=u.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const r = await pool.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: 'Status updated.', order: r.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not update status.' });
  }
});

module.exports = router;

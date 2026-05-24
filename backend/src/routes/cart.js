// routes/cart.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.quantity,
              p.id as product_id, p.name, p.price, p.image_url,
              p.stock, p.is_available,
              u.shop_name as seller_shop_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    const items = result.rows;
    const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    res.json({ items, total: total.toFixed(2), count: items.length });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch cart.' });
  }
});

// POST /api/cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ message: 'Product ID required.' });

    const prod = await pool.query(
      `SELECT p.*, u.seller_status FROM products p
       JOIN users u ON p.seller_id=u.id
       WHERE p.id=$1 AND p.is_available=true AND u.seller_status='approved'`,
      [product_id]
    );
    if (!prod.rows[0]) return res.status(404).json({ message: 'Product not available.' });
    if (prod.rows[0].stock < quantity)
      return res.status(400).json({ message: `Only ${prod.rows[0].stock} in stock.` });

    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + $3`,
      [req.user.id, product_id, parseInt(quantity)]
    );
    res.status(201).json({ message: 'Added to cart! 🛒' });
  } catch (err) {
    res.status(500).json({ message: 'Could not add to cart.' });
  }
});

// PUT /api/cart/:productId
router.put('/:productId', requireAuth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1)
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    const r = await pool.query(
      'UPDATE cart SET quantity=$1 WHERE user_id=$2 AND product_id=$3 RETURNING *',
      [parseInt(quantity), req.user.id, req.params.productId]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Item not in cart.' });
    res.json({ message: 'Updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update.' });
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id=$1 AND product_id=$2',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Removed from cart.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove.' });
  }
});

// DELETE /api/cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not clear cart.' });
  }
});

module.exports = router;

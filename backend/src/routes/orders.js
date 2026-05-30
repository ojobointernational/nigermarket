// routes/orders.js — Customer order history

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/orders — my orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
         json_agg(json_build_object(
           'product_name', oi.product_name,
           'quantity', oi.quantity,
           'price', oi.product_price,
           'subtotal', oi.subtotal
         )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const o = await pool.query(
      'SELECT * FROM orders WHERE id=$1 AND customer_id=$2',
      [req.params.id, req.user.id]
    );
    if (!o.rows[0]) return res.status(404).json({ message: 'Order not found.' });
    const items = await pool.query(
      'SELECT * FROM order_items WHERE order_id=$1', [req.params.id]
    );
    res.json({ ...o.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch order.' });
  }
});

// POST /api/orders — create order
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { items, total_amount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    await client.query('BEGIN');

    // 1. create order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, total_amount, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [req.user.id, total_amount]
    );

    const order = orderResult.rows[0];

    // 2. insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
        (order_id, product_name, product_price, quantity, subtotal)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          item.product_name,
          item.product_price,
          item.quantity,
          item.product_price * item.quantity
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order_id: order.id
    });

  } catch (err) {
  await client.query('ROLLBACK').catch(() => {});

  console.error('🔥 ORDER ERROR DETAILS:', {
    message: err.message,
    detail: err.detail,
    hint: err.hint,
    code: err.code
  });

  return res.status(500).json({
    message: 'Could not create order.',
    error: err.message
  });
}
});

module.exports = router;
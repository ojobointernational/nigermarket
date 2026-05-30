// routes/orders.js — Customer order system

const express = require('express');
const router = express.Router();

const pool = require('../db');
const { requireAuth } = require('../middleware/auth');


// ─────────────────────────────────────────────
// GET /api/orders — Get user orders
// ─────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'price', oi.product_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET ORDERS ERROR:', err);
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});


// ─────────────────────────────────────────────
// GET /api/orders/:id — Get single order
// ─────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id=$1 AND customer_id=$2`,
      [req.params.id, req.user.id]
    );

    if (!orderResult.rows[0]) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id=$1`,
      [req.params.id]
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });

  } catch (err) {
    console.error('GET ORDER ERROR:', err);
    res.status(500).json({ message: 'Could not fetch order.' });
  }
});


// ─────────────────────────────────────────────
// POST /api/orders — Create order (FIXED VERSION)
// ─────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      items,
      total_amount,
      delivery_address,
      phone,
      notes
    } = req.body;

    // Validate input
    if (!delivery_address || !phone) {
      return res.status(400).json({
        message: 'Delivery address and phone are required.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'No items in order.'
      });
    }

    await client.query('BEGIN');

    // 1. Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        customer_id,
        total_amount,
        delivery_address,
        phone,
        notes,
        status,
        payment_status
      )
      VALUES ($1,$2,$3,$4,$5,'pending','unpaid')
      RETURNING *`,
      [
        req.user.id,
        total_amount,
        delivery_address,
        phone,
        notes || null
      ]
    );

    const order = orderResult.rows[0];

    // 2. Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id,
          product_name,
          product_price,
          quantity,
          subtotal
        )
        VALUES ($1,$2,$3,$4,$5)`,
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

    console.error('🔥 ORDER ERROR:', err);

    res.status(500).json({
      message: 'Could not create order.',
      error: err.message
    });

  } finally {
    client.release();
  }
});

module.exports = router;
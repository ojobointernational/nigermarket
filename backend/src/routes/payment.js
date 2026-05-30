const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
require('dotenv').config();

const PAYSTACK = 'https://api.paystack.co';
const headers = {
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
};

// ── POST /api/payment/initialize ────────────────────────────
// Creates order and returns Paystack payment URL
router.post('/initialize', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_address, phone, notes } = req.body;

    if (!delivery_address || !phone) {
      return res.status(400).json({
        message: 'Delivery address and phone are required.',
      });
    }

    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(
      `SELECT c.quantity, p.id as product_id, p.name,
              p.price, p.stock, p.seller_id
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    const items = cartResult.rows;

    // Check stock for all items
    for (const item of items) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `"${item.name}" only has ${item.stock} left in stock.`,
        });
      }
    }

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    );

    // Create order with unpaid status
    const orderResult = await client.query(
      `INSERT INTO orders
         (customer_id, total_amount, delivery_address, phone,
          notes, payment_status, status)
       VALUES ($1, $2, $3, $4, $5, 'unpaid', 'pending')
       RETURNING *`,
      [req.user.id, total.toFixed(2), delivery_address, phone, notes || null]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, seller_id, product_name,
            product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id, item.product_id, item.seller_id,
          item.name, item.price, item.quantity,
          parseFloat(item.price) * item.quantity,
        ]
      );
    }

    await client.query('COMMIT');

    // Initialize Paystack — amount must be in KOBO (naira × 100)
    const amountInKobo = Math.round(total * 100);
    const reference = `NM_${order.id}_${Date.now()}`;

    const paystackRes = await axios.post(
      `${PAYSTACK}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInKobo,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
        metadata: {
          order_id: order.id,
          customer_name: req.user.name,
        },
      },
      { headers }
    );

    // Save reference to order
    await pool.query(
      'UPDATE orders SET payment_reference = $1 WHERE id = $2',
      [reference, order.id]
    );

    res.json({
      message: 'Payment initialized.',
      authorization_url: paystackRes.data.data.authorization_url,
      reference,
      order_id: order.id,
      amount: total,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Payment init error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Could not initialize payment.' });
  } finally {
    client.release();
  }
});

// ── POST /api/payment/verify ─────────────────────────────────
// Verifies payment after redirect from Paystack
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required.' });
    }

    // Verify with Paystack
    const verify = await axios.get(
      `${PAYSTACK}/transaction/verify/${reference}`,
      { headers }
    );

    const data = verify.data.data;

    if (data.status !== 'success') {
      return res.status(400).json({ message: 'Payment was not successful.' });
    }

    // Update order to paid
    const order = await pool.query(
      `UPDATE orders SET
         payment_status = 'paid',
         status = 'confirmed',
         updated_at = NOW()
       WHERE payment_reference = $1
       RETURNING *`,
      [reference]
    );

    if (!order.rows[0]) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Reduce stock and update total sold
    const items = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.rows[0].id]
    );

    for (const item of items.rows) {
      await pool.query(
        `UPDATE products
         SET stock = stock - $1, total_sold = total_sold + $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Clear customer cart
    await pool.query(
      'DELETE FROM cart WHERE user_id = $1',
      [order.rows[0].customer_id]
    );

    res.json({
      message: '🎉 Payment successful! Order confirmed.',
      order: order.rows[0],
    });
  } catch (err) {
    console.error('Verify error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Could not verify payment.' });
  }
});

// ── GET /api/payment/public-key ──────────────────────────────
// Sends public key to frontend safely
router.get('/public-key', (req, res) => {
  res.json({ public_key: process.env.PAYSTACK_PUBLIC_KEY });
});

module.exports = router;
// routes/auth.js — Register and login for all 3 roles

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
require('dotenv').config();

const makeToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      seller_status: user.seller_status,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// ── POST /api/auth/register ──────────────────────────────────
// role: 'customer' (default) or 'seller'
// Sellers also need: shop_name
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, shop_name, shop_description } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Full name is required.' });
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required.' });
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const userRole = role === 'seller' ? 'seller' : 'customer';

    if (userRole === 'seller' && !shop_name?.trim()) {
      return res.status(400).json({ message: 'Shop name is required for sellers.' });
    }

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    // Check duplicate
    const dup = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (dup.rows.length > 0)
      return res.status(400).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
         (name, email, password, phone, role, shop_name, shop_description, seller_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, phone, role, shop_name, seller_status`,
      [
        name.trim(),
        email.toLowerCase(),
        hashed,
        phone || null,
        userRole,
        shop_name?.trim() || null,
        shop_description?.trim() || null,
        userRole === 'seller' ? 'pending' : null, // Sellers start as pending
      ]
    );

    const user = result.rows[0];
    const token = makeToken(user);

    const message = userRole === 'seller'
      ? 'Seller account created! Please wait for admin approval before listing products.'
      : 'Account created! Welcome to Naija Market 🎉';

    res.status(201).json({ message, token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ message: 'No account found with this email.' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Incorrect password.' });

    const token = makeToken(user);
    res.json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shop_name: user.shop_name,
        seller_status: user.seller_status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, address, role,
              shop_name, shop_description, seller_status, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch profile.' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, address, shop_name, shop_description } = req.body;
    const result = await pool.query(
      `UPDATE users SET
         name             = COALESCE($1, name),
         phone            = COALESCE($2, phone),
         address          = COALESCE($3, address),
         shop_name        = COALESCE($4, shop_name),
         shop_description = COALESCE($5, shop_description)
       WHERE id = $6
       RETURNING id, name, email, phone, address, role, shop_name, seller_status`,
      [name||null, phone||null, address||null, shop_name||null, shop_description||null, req.user.id]
    );
    res.json({ message: 'Profile updated.', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

module.exports = router;

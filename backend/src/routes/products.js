// routes/products.js — PUBLIC product browsing (no auth needed)

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch categories.' });
  }
});

// GET /api/products — browse with filters
// ?search=  ?category=  ?seller=  ?minPrice=  ?maxPrice=  ?sort=
router.get('/', async (req, res) => {
  try {
    const { search='', category, seller, minPrice, maxPrice, sort='newest' } = req.query;
    const params = [];
    let where = `WHERE p.is_available = true AND u.seller_status = 'approved'`;

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }
    if (category) {
      params.push(parseInt(category));
      where += ` AND p.category_id = $${params.length}`;
    }
    if (seller) {
      params.push(parseInt(seller));
      where += ` AND p.seller_id = $${params.length}`;
    }
    if (minPrice) {
      params.push(parseFloat(minPrice));
      where += ` AND p.price >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      where += ` AND p.price <= $${params.length}`;
    }

    const sortMap = {
      newest:    'p.created_at DESC',
      price_low: 'p.price ASC',
      price_high:'p.price DESC',
      popular:   'p.total_sold DESC',
      name_az:   'p.name ASC',
    };

    const result = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon,
              u.shop_name as seller_shop_name, u.name as seller_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       ${where}
       ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon,
              u.shop_name as seller_shop_name, u.name as seller_name,
              u.phone as seller_phone
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch product.' });
  }
});

module.exports = router;

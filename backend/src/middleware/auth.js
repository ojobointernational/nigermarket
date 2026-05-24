// middleware/auth.js — JWT verification + role checking

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token
const requireAuth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, role, seller_status }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid session. Please log in.';
    return res.status(401).json({ message: msg });
  }
};

// Must be logged in AND be an approved seller
const requireSeller = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seller account required.' });
    }
    if (req.user.role === 'seller' && req.user.seller_status !== 'approved') {
      return res.status(403).json({
        message: req.user.seller_status === 'pending'
          ? 'Your seller account is pending admin approval.'
          : 'Your seller account has not been approved.',
      });
    }
    next();
  });
};

// Must be admin
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
  });
};

module.exports = { requireAuth, requireSeller, requireAdmin };

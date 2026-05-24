const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/seller', require('./src/routes/seller'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/payment', require('./src/routes/payment'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/health', (req, res) =>
  res.json({ status: 'ok', app: 'Naija Market API', time: new Date() })
);

app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Naija Market API running on port ${PORT}`);
});

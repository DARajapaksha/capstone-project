const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const verificationRoutes = require('./verification');
const blockchainRoutes = require('./blockchain');

// Example route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/verification', verificationRoutes);
router.use('/blockchain', blockchainRoutes);

module.exports = router;

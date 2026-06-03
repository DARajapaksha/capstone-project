const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const verificationRoutes = require('./verification');
const adminRoutes = require('./admin');
const settingsRoutes = require('./settings');
const examRoutes = require('./exam');
const verifierRoutes = require('./verifier');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/verification', verificationRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/exam', examRoutes);
router.use('/verifier', verifierRoutes);

module.exports = router;


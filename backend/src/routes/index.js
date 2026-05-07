const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Example route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

router.use('/auth', authRoutes);

module.exports = router;

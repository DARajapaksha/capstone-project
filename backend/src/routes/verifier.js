const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  verifierLogin,
  getVerifierProfile,
  updateVerifierProfile,
  getVerifierQueue,
  getVerifierHistory,
  decideVerification,
  getVerifierStats,
} = require('../controllers/verifierController');

// Public — no auth required
router.post('/login', verifierLogin);

// Protected — JWT required
router.get('/profile/:id', authMiddleware, getVerifierProfile);
router.put('/profile/:id', authMiddleware, updateVerifierProfile);

router.get('/queue', authMiddleware, getVerifierQueue);
router.put('/queue/:id/decide', authMiddleware, decideVerification);

router.get('/history', authMiddleware, getVerifierHistory);
router.get('/stats', authMiddleware, getVerifierStats);

module.exports = router;

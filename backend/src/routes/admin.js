const express = require('express');
const router = express.Router();
const { getAllVerifications, updateVerificationStatus } = require('../controllers/adminController');
// Assuming there might be an authMiddleware in the future, it would be added here like:
// const authMiddleware = require('../middlewares/authMiddleware');

// Get all verification requests
router.get('/verifications', getAllVerifications);

// Update status of a specific verification request
router.put('/verifications/:id/status', updateVerificationStatus);

module.exports = router;

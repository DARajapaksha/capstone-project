const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Dashboard route protected by JWT middleware
router.get('/dashboard', authMiddleware, userController.getStudentDashboard);

// Update Profile route protected by JWT middleware
router.patch('/profile', authMiddleware, userController.updateProfile);

// Home Aggregator route protected by JWT middleware
router.get('/home', authMiddleware, userController.getDashboardData);

module.exports = router;

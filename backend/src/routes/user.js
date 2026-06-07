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

// Enroll in an exam
router.post('/enroll', authMiddleware, userController.enrollExam);

// Cancel enrollment
router.delete('/enroll/:examId', authMiddleware, userController.cancelEnrollment);

module.exports = router;

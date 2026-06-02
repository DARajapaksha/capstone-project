const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// OTP Routes for Registration
router.post('/send-otp', authController.sendRegistrationOTP);
router.post('/verify-otp', authController.verifyOTPAndRegister);

// Login route
router.post('/login', authController.login);

// Google Login route
router.post('/google-login', authController.googleLogin);

module.exports = router;

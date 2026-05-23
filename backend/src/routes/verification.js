const express = require('express');
const router = express.Router();
const multer = require('multer');
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure Multer to use memory storage (buffer will be passed to Firebase)
const upload = multer({ storage: multer.memoryStorage() });

// Upload verification images endpoint protected by JWT middleware
router.post(
  '/upload',
  authMiddleware,
  upload.fields([
    { name: 'id_image', maxCount: 1 },
    { name: 'selfie_image', maxCount: 1 }
  ]),
  verificationController.uploadVerificationImages
);

module.exports = router;

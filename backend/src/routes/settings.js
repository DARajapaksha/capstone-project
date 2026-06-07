const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

// Get all system settings
router.get('/', getSettings);

// Update system settings
router.put('/', updateSettings);

module.exports = router;

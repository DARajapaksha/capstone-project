const express = require('express');
const router = express.Router();
const { adminLogin, getAllVerifications, updateVerificationStatus, updateAdminProfile, getAllStudents, getAllAudits, updateStudentVerificationStatus } = require('../controllers/adminController');
const { createVerifier, deleteVerifier, listVerifiers } = require('../controllers/verifierController');
// Assuming there might be an authMiddleware in the future, it would be added here like:
// const authMiddleware = require('../middlewares/authMiddleware');

// Admin Login
router.post('/login', adminLogin);

// Get all verification requests
router.get('/verifications', getAllVerifications);

// Update status of a specific verification request
router.put('/verifications/:id/status', updateVerificationStatus);

// Update admin profile
router.put('/profile/:id', updateAdminProfile);

// Get all students
router.get('/students', getAllStudents);

router.put('/students/:id/verify', updateStudentVerificationStatus);

// Get all audits
router.get('/audits', getAllAudits);

// Get all verifiers (reads from Verifiers/ node)
router.get('/verifiers', listVerifiers);

// Create a new verifier
router.post('/verifiers', createVerifier);

// Delete a verifier
router.delete('/verifiers/:id', deleteVerifier);

module.exports = router;

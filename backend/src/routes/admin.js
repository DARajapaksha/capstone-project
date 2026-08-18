const express = require('express');
const router = express.Router();
const { adminLogin, getAllVerifications, updateVerificationStatus, updateAdminProfile, getAllStudents, getAllAudits, updateStudentVerificationStatus, deleteStudent } = require('../controllers/adminController');
const { createVerifier, deleteVerifier, listVerifiers, updateVerifier, updateVerifierRole } = require('../controllers/verifierController');
const { cache, invalidateCache } = require('../middlewares/responseCache');

// Cache TTL for admin read endpoints (30s) — reduces Firestore reads dramatically
// The admin dashboard polls every 60s; with a 30s cache only 1 Firestore hit per window
const ADMIN_CACHE_TTL = 30;

// Admin Login
router.post('/login', adminLogin);

// Get all verification requests (cached)
router.get('/verifications', cache(ADMIN_CACHE_TTL), getAllVerifications);

// Update status of a specific verification request
router.put('/verifications/:id/status', (req, res, next) => { invalidateCache('/api/admin/verifications'); next(); }, updateVerificationStatus);

// Update admin profile
router.put('/profile/:id', updateAdminProfile);

// Get all students (cached)
router.get('/students', cache(ADMIN_CACHE_TTL), getAllStudents);

router.put('/students/:id/verify', (req, res, next) => { invalidateCache('/api/admin/students'); next(); }, updateStudentVerificationStatus);
router.delete('/students/:id', (req, res, next) => { invalidateCache('/api/admin/students'); next(); }, deleteStudent);

// Get all audits (cached)
router.get('/audits', cache(ADMIN_CACHE_TTL), getAllAudits);

// Get all verifiers (cached)
router.get('/verifiers', cache(ADMIN_CACHE_TTL), listVerifiers);

// Create a new verifier
router.post('/verifiers', createVerifier);

// Update a verifier
router.put('/verifiers/:id', updateVerifier);

// Update a verifier's role
router.put('/verifiers/:id/role', updateVerifierRole);

// Delete a verifier
router.delete('/verifiers/:id', deleteVerifier);

module.exports = router;

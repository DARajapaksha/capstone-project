/**
 * blockchain.js (route)
 * ----------------------
 * Registers the blockchain API endpoints.
 *
 * All routes are mounted at /api/blockchain (see routes/index.js).
 * The authMiddleware ensures only authenticated users (with a valid JWT)
 * can trigger blockchain transactions.
 *
 * POST /api/blockchain/store-verification
 *   - Receives { studentId, documentHash } from the frontend
 *   - Calls the smart contract on Polygon Amoy
 *   - Returns the on-chain transactionHash
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const blockchainController = require('../controllers/blockchainController');

// POST /api/blockchain/store-verification
// Protected route — a valid JWT is required (student must be logged in)
router.post(
  '/store-verification',
  authMiddleware,
  blockchainController.storeVerification
);

module.exports = router;

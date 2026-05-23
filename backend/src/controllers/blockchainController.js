/**
 * blockchainController.js
 * ------------------------
 * Express controller that receives a POST request from the frontend
 * after AI verification is complete, then calls blockchainService to
 * anchor the SHA-256 hash permanently on the Polygon Amoy blockchain.
 *
 * Route: POST /api/blockchain/store-verification
 * Auth: Required (JWT via authMiddleware)
 *
 * Request body: { studentId: string, documentHash: string }
 * Response 200: { success: true, transactionHash: "0x..." }
 * Response 400: Missing studentId or documentHash
 * Response 500: Blockchain transaction failed
 */

const { storeHashOnBlockchain } = require('../services/blockchainService');

const storeVerification = async (req, res) => {
  // --- Request body validation ---
  const { studentId, documentHash } = req.body;

  if (!studentId || !documentHash) {
    return res.status(400).json({
      error: 'Bad Request: Both "studentId" and "documentHash" are required in the request body.'
    });
  }

  // Basic validation — SHA-256 hex strings are 64 characters
  if (documentHash.length < 10) {
    return res.status(400).json({
      error: 'Bad Request: "documentHash" appears to be invalid. Expected a SHA-256 hash string.'
    });
  }

  try {
    console.log(`[BlockchainCtrl] Received store request — student: ${studentId}, requester uid: ${req.user.uid}`);

    // Call the ethers.js service to send the blockchain transaction.
    // This waits for 1 block confirmation before resolving.
    const transactionHash = await storeHashOnBlockchain(studentId, documentHash);

    // Return the on-chain transaction hash to the frontend so it can display it
    return res.status(200).json({
      success: true,
      message: 'Verification hash stored successfully on the Polygon Amoy blockchain.',
      transactionHash,
      // Convenience URL for PolygonScan Amoy — students/admins can verify on-chain
      explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`
    });

  } catch (error) {
    console.error('[BlockchainCtrl] Error storing verification hash:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error: The blockchain transaction failed. Please try again.',
      // Safe message only — do not expose internal error details to the client
      detail: error.message
    });
  }
};

module.exports = {
  storeVerification,
};

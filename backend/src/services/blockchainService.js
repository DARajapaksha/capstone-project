/**
 * blockchainService.js
 * 
 * Handles SHA-256 hash generation and Polygon Amoy testnet anchoring.
 * Bridges the Node.js backend to the deployed IdentityVerification smart contract.
 * 
 * Privacy: Only metadata (IDs, scores, timestamps) is hashed — NEVER raw biometric data.
 */

const crypto = require('crypto');
const { Web3 } = require('web3');

const RPC_URL      = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY  = process.env.PRIVATE_KEY;
const CONTRACT_ADDR = process.env.CONTRACT_ADDRESS;

// Minimal ABI — only the storeVerification function we need
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "verificationHash", "type": "string" },
      { "internalType": "string", "name": "requestId",        "type": "string" }
    ],
    "name": "storeVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "requestId", "type": "string" }],
    "name": "getVerification",
    "outputs": [
      { "internalType": "string", "name": "verificationHash", "type": "string" },
      { "internalType": "uint256", "name": "timestamp",       "type": "uint256" },
      { "internalType": "address", "name": "verifier",        "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Generates a deterministic SHA-256 hash from verification metadata.
 * The same inputs always produce the same hash — enabling independent verification.
 * 
 * @param {Object} payload - { requestId, studentId, decision, decidedBy, decidedAt, faceScore }
 * @returns {string} hex SHA-256 hash
 */
function generateVerificationHash(payload) {
  const canonical = JSON.stringify({
    requestId:  payload.requestId  || '',
    studentId:  payload.studentId  || '',
    decision:   payload.decision   || '',
    decidedBy:  payload.decidedBy  || '',
    decidedAt:  String(payload.decidedAt  || ''),
    faceScore:  String(payload.faceScore  || '0'),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Anchors a verification event on the Polygon Amoy testnet.
 * 1. Generates SHA-256 hash from metadata
 * 2. Signs and broadcasts a transaction to the smart contract
 * 3. Returns the transaction hash (Tx Hash) for storage in Firebase
 * 
 * @param {Object} payload - verification metadata
 * @returns {Promise<string>} transaction hash or null if blockchain unavailable
 */
async function anchorVerification(payload) {
  if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDR) {
    console.warn('[Blockchain] Missing env vars — skipping blockchain anchor.');
    return null;
  }

  const verificationHash = generateVerificationHash(payload);
  console.log(`[Blockchain] SHA-256 hash: ${verificationHash}`);

  const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

  const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY.replace(/^0x/, ''));
  web3.eth.accounts.wallet.add(account);

  const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDR);

  // Estimate gas dynamically
  const gasEstimate = await contract.methods
    .storeVerification(verificationHash, payload.requestId)
    .estimateGas({ from: account.address });

  const gasPrice = await web3.eth.getGasPrice();

  const receipt = await contract.methods
    .storeVerification(verificationHash, payload.requestId)
    .send({
      from:     account.address,
      gas:      Math.ceil(Number(gasEstimate) * 1.2), // 20% buffer
      gasPrice: gasPrice,
    });

  const txHash = receipt.transactionHash;
  console.log(`[Blockchain] Transaction confirmed: ${txHash}`);
  return txHash;
}

/**
 * Retrieves a stored verification hash from the smart contract for auditing.
 * Allows any auditor to independently verify the cryptographic record.
 * 
 * @param {string} requestId
 * @returns {Promise<Object>} { verificationHash, timestamp, verifier }
 */
async function getVerificationRecord(requestId) {
  if (!RPC_URL || !CONTRACT_ADDR) return null;

  const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
  const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDR);

  const result = await contract.methods.getVerification(requestId).call();
  return {
    verificationHash: result[0],
    timestamp:        Number(result[1]),
    verifier:         result[2],
  };
}

/**
 * Utility: regenerate the hash from stored metadata and compare against chain.
 * Returns true if the on-chain hash matches — proving data integrity.
 */
async function verifyIntegrity(payload, requestId) {
  const localHash = generateVerificationHash(payload);
  const onChain   = await getVerificationRecord(requestId);
  if (!onChain) return false;
  return localHash === onChain.verificationHash;
}

module.exports = {
  generateVerificationHash,
  anchorVerification,
  getVerificationRecord,
  verifyIntegrity,
};

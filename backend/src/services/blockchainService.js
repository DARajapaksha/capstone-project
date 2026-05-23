/**
 * blockchainService.js
 * ---------------------
 * This service is the bridge between the Express backend and the deployed
 * IdentityVerification smart contract on the Polygon Amoy Testnet.
 *
 * It uses ethers.js v6 to:
 *   1. Connect to the Polygon Amoy network via a JSON-RPC provider (Alchemy/Infura)
 *   2. Instantiate the "System Admin Wallet" — the wallet that PAYS gas fees
 *      (this is NOT the student's wallet; no student PII is on-chain)
 *   3. Talk to the deployed smart contract using its address + ABI
 *   4. Send the `storeVerificationHash` transaction and wait for confirmation
 *
 * SECURITY NOTE:
 *   - The PRIVATE_KEY in .env belongs to the "system admin wallet" used only
 *     to pay gas fees. It is never exposed to students.
 *   - Only a SHA-256 hash of the verification result is stored on-chain,
 *     never any PII (photos, names, NIC numbers, etc.)
 */

const { ethers } = require('ethers');
const path = require('path');

// Load the compiled ABI from the config folder
// (copied from blockchain/artifacts/contracts/IdentityVerification.sol/IdentityVerification.json)
const contractArtifact = require('../config/IdentityVerification.json');
const CONTRACT_ABI = contractArtifact.abi;

/**
 * Creates and returns a connected contract instance.
 * Separating this allows easy re-use and makes unit testing simpler.
 * @returns {ethers.Contract}
 */
function getContract() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      'Missing blockchain config. Ensure POLYGON_AMOY_RPC_URL, PRIVATE_KEY, ' +
      'and CONTRACT_ADDRESS are set in backend/.env'
    );
  }

  // ethers v6 — JsonRpcProvider (NOT ethers.providers.JsonRpcProvider, which is v5)
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // The system admin wallet — pays gas fees for every verification tx
  const wallet = new ethers.Wallet(privateKey, provider);

  // Connect to the deployed smart contract
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

  return contract;
}

/**
 * Stores a verification hash on the Polygon Amoy blockchain.
 *
 * @param {string} studentId    - The university index number (e.g. "22CIS0329")
 * @param {string} documentHash - The SHA-256 hash of the AI verification result
 * @returns {Promise<string>}    - The transaction hash (TxHash) on Polygon Amoy
 */
async function storeHashOnBlockchain(studentId, documentHash) {
  try {
    console.log(`[Blockchain] Sending tx — studentId: ${studentId}, hash: ${documentHash}`);

    const contract = getContract();

    // Call the smart contract function — this sends the transaction to the network
    const tx = await contract.storeVerificationHash(studentId, documentHash);

    console.log(`[Blockchain] Transaction submitted. TxHash: ${tx.hash}`);
    console.log(`[Blockchain] Waiting for block confirmation on Polygon Amoy...`);

    // Wait for 1 block confirmation before declaring success.
    // This ensures the transaction is actually included in a mined block,
    // not just broadcast to the mempool.
    const receipt = await tx.wait(1);

    console.log(`[Blockchain] ✅ Confirmed in block: ${receipt.blockNumber}`);

    return tx.hash;

  } catch (error) {
    // Log the detailed error server-side for debugging
    console.error('[Blockchain] ❌ Transaction failed:', error.message || error);

    // Re-throw a clean error so the controller can return a safe 500 response
    throw new Error(`Blockchain transaction failed: ${error.reason || error.message}`);
  }
}

module.exports = {
  storeHashOnBlockchain,
};

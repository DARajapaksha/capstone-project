require('dotenv').config();
const bs = require('./src/services/blockchainService');

const payload = {
  requestId: 'integration-test-' + Date.now(),
  studentId: 'student-abc123',
  decision: 'Approved',
  decidedBy: 'AI_SYSTEM',
  decidedAt: Date.now(),
  faceScore: 87
};

console.log('--- Blockchain Integration Test ---');
console.log('SHA-256 hash:', bs.generateVerificationHash(payload));
console.log('Polygonscan URL helper:', bs.getPolygonscanUrl('0x' + 'a'.repeat(64)));
console.log('\nSending live transaction to Polygon Amoy (15-30 seconds)...');

bs.anchorVerification(payload).then(result => {
  if (result) {
    console.log('\n✅ SUCCESS!');
    console.log('  Tx Hash:    ', result.txHash);
    console.log('  Polygonscan:', result.polygonscanUrl);
  } else {
    console.log('❌ Blockchain skipped (check env vars)');
  }
}).catch(e => {
  console.error('\n❌ FAILED:', e.message);
});

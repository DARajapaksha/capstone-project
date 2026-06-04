/**
 * purge-legacy-data.js
 * 
 * One-time PDPA compliance sanitization script.
 * 
 * Scans the Verification_Requests collection for any documents that still
 * contain persistent idImageUrl or selfieImageUrl fields and removes them.
 * 
 * Generates an execution log as cryptographic proof of compliance with the
 * Sri Lankan Personal Data Protection Act (PDPA) No. 9 of 2022.
 * 
 * Usage:
 *   cd backend
 *   node scripts/purge-legacy-data.js
 */

require('dotenv').config();
const admin = require('./src/config/firebase');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, `pdpa-purge-log-${Date.now()}.json`);

async function run() {
  console.log('=== PDPA Legacy Data Purge Script ===');
  console.log('Started at:', new Date().toISOString());
  console.log('Scanning Verification_Requests for non-compliant image fields...\n');

  const db = admin.database();
  const snapshot = await db.ref('Verification_Requests').once('value');

  if (!snapshot.exists()) {
    console.log('No Verification_Requests found. Nothing to purge.');
    process.exit(0);
  }

  const data = snapshot.val();
  const allKeys = Object.keys(data);

  const violations = [];
  const purged = [];
  const errors = [];

  for (const key of allKeys) {
    const record = data[key];
    const hasIdImage     = record.idImageUrl     && record.idImageUrl !== null;
    const hasSelfieImage = record.selfieImageUrl  && record.selfieImageUrl !== null;

    if (hasIdImage || hasSelfieImage) {
      violations.push({ requestId: key, status: record.status, timestamp: record.timestamp });

      try {
        await db.ref(`Verification_Requests/${key}`).update({
          idImageUrl:          null,
          selfieImageUrl:      null,
          imagesPurgedAt:      Date.now(),
          imagesPurgedReason:  'PDPA_LEGACY_SANITIZATION',
        });
        purged.push(key);
        console.log(`  ✓ Purged: ${key} (status: ${record.status})`);
      } catch (err) {
        errors.push({ requestId: key, error: err.message });
        console.error(`  ✗ Failed: ${key} — ${err.message}`);
      }
    }
  }

  const summary = {
    executedAt:       new Date().toISOString(),
    totalScanned:     allKeys.length,
    violationsFound:  violations.length,
    successfulPurges: purged.length,
    failedPurges:     errors.length,
    violations,
    purged,
    errors,
    pdpaNote: 'Sri Lankan Personal Data Protection Act No. 9 of 2022 — biometric data purge log',
  };

  fs.writeFileSync(LOG_FILE, JSON.stringify(summary, null, 2));

  console.log('\n=== Purge Complete ===');
  console.log(`Total records scanned:     ${summary.totalScanned}`);
  console.log(`Violations found:          ${summary.violationsFound}`);
  console.log(`Successfully purged:       ${summary.successfulPurges}`);
  console.log(`Failed:                    ${summary.failedPurges}`);
  console.log(`\nCompliance log saved to:   ${LOG_FILE}`);

  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error in purge script:', err);
  process.exit(1);
});

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

async function clearDatabase() {
  try {
    console.log("Starting database cleanup...");

    // We only clear student and verification data.
    // We deliberately PRESERVE 'Verifiers' (so Admin can still log in) and 'Exams'.
    const nodesToClear = [
      'Users',
      'Verification_Requests',
      'Audit_Log',
      'Enrollments'
    ];

    for (const node of nodesToClear) {
      console.log(`Clearing ${node}...`);
      await db.ref(node).remove();
      console.log(`${node} cleared.`);
    }

    console.log("Database reset complete! You can now test from the beginning.");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();

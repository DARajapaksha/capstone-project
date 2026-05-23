const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Try loading credentials from environment variables first, then fall back to serviceAccountKey.json
const fs = require('fs');

let serviceAccount;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else {
  const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  } else {
    console.error('\x1b[31m%s\x1b[0m', '--------------------------------------------------------------------------------');
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Firebase Service Account credentials not found!');
    console.error('\x1b[31m%s\x1b[0m', '--------------------------------------------------------------------------------');
    console.error('To run the backend, you need to do one of the following:\n');
    console.error('👉 OPTION 1: Download the JSON file from Firebase Console');
    console.error('   1. Go to Firebase Console (https://console.firebase.google.com/)');
    console.error('   2. Select your project: "identity-verification-sy-dd573"');
    console.error('   3. Click the Gear Icon (Project Settings) > "Service accounts" tab');
    console.error('   4. Click "Generate new private key", and download the JSON file');
    console.error('   5. Save the downloaded file as "serviceAccountKey.json" directly in the "/backend" directory.\n');
    console.error('👉 OPTION 2: Add credentials to your "/backend/.env" file');
    console.error('   FIREBASE_PROJECT_ID=your-project-id');
    console.error('   FIREBASE_CLIENT_EMAIL=your-client-email');
    console.error('   FIREBASE_PRIVATE_KEY="your-private-key"');
    console.error('\x1b[31m%s\x1b[0m', '--------------------------------------------------------------------------------\n');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id || serviceAccount.projectId}.appspot.com`,
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://identity-verification-sy-dd573-default-rtdb.asia-southeast1.firebasedatabase.app"
});

module.exports = admin;

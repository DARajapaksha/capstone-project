const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// The serviceAccountKey.json should be in the backend directory
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://identity-verification-sy-dd573-default-rtdb.asia-southeast1.firebasedatabase.app"
});

module.exports = admin;

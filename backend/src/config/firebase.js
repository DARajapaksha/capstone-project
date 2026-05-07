const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// The serviceAccountKey.json should be in the backend directory
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;

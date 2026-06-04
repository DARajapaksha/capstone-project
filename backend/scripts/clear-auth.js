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

async function clearAuthUsers() {
  try {
    console.log("Starting Firebase Auth cleanup...");
    let nextPageToken;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map(user => user.uid);
      if (uids.length > 0) {
        await admin.auth().deleteUsers(uids);
        console.log(`Deleted ${uids.length} users from Firebase Auth.`);
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log("Firebase Auth cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing Firebase Auth:", error);
    process.exit(1);
  }
}

clearAuthUsers();

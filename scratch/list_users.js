const admin = require('../backend/src/config/firebase');

async function listUsers() {
  try {
    const db = admin.database();
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.once('value');
    console.log('--- ALL USERS IN DATABASE ---');
    if (snapshot.exists()) {
      console.log(JSON.stringify(snapshot.val(), null, 2));
    } else {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();

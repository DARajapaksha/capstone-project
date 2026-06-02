const admin = require('../backend/src/config/firebase');

async function deleteUser() {
  const emailToDelete = 'janiduviduranga78@gmail.com';
  try {
    const db = admin.database();
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.once('value');
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      let deleteCount = 0;
      for (const uid in users) {
        if (users[uid].email === emailToDelete) {
          console.log(`Deleting user record for ${emailToDelete} with UID: ${uid}`);
          await db.ref(`Users/${uid}`).remove();
          deleteCount++;
        }
      }
      console.log(`Deleted ${deleteCount} records.`);
    } else {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    process.exit(0);
  }
}

deleteUser();

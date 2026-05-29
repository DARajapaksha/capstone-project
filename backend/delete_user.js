const admin = require('./src/config/firebase'); 

async function deleteUser() { 
  const email = 'damajithrajapaksha@gmail.com'; 
  
  try { 
    const user = await admin.auth().getUserByEmail(email); 
    await admin.auth().deleteUser(user.uid); 
    console.log('✅ Successfully deleted from Firebase Auth'); 
  } catch (e) { 
    console.log('⚠️ Not found in Firebase Auth'); 
  } 
  
  const db = admin.database(); 
  const snap = await db.ref('Users').orderByChild('email').equalTo(email).once('value'); 
  
  if (snap.exists()) { 
    let userKey; 
    snap.forEach(child => { userKey = child.key; }); 
    await db.ref(`Users/${userKey}`).remove(); 
    console.log('✅ Successfully deleted from Realtime Database (Users node)'); 
  } else { 
    console.log('⚠️ Not found in Realtime Database'); 
  } 
  
  process.exit(0); 
} 

deleteUser();

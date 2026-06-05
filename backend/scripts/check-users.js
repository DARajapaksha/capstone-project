const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

async function checkUsers() {
  const db = admin.firestore();
  const snap = await db.collection('Users').get();
  console.log(`Total users in Firestore 'Users' collection: ${snap.size}`);
  snap.docs.forEach(doc => {
    const d = doc.data();
    console.log(` - [${doc.id}] email: ${d.email}, name: ${d.name}, studentId: ${d.studentId}`);
  });
  process.exit(0);
}

checkUsers().catch(err => { console.error(err); process.exit(1); });

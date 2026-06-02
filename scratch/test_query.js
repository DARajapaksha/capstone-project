const admin = require('../backend/src/config/firebase');

async function testQuery() {
  try {
    const db = admin.database();
    const usersRef = db.ref('Users');

    // Test with an existing email
    const email1 = 'janiduviduranga78@gmail.com';
    const snapshot1 = await usersRef.orderByChild('email').equalTo(email1).once('value');
    console.log(`Query for "${email1}" exists?`, snapshot1.exists());

    // Test with a non-existing email
    const email2 = 'nonexistent_test_email_12345@gmail.com';
    const snapshot2 = await usersRef.orderByChild('email').equalTo(email2).once('value');
    console.log(`Query for "${email2}" exists?`, snapshot2.exists());

  } catch (error) {
    console.error('Error during query test:', error);
  } finally {
    process.exit(0);
  }
}

testQuery();

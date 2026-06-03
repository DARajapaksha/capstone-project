const admin = require('../src/config/firebase');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('--- Create New Admin ---');
  
  const name = await question('Enter Admin Name: ');
  const email = await question('Enter Admin Email (must be @ms.sab.ac.lk): ');
  
  if (!email.endsWith('@ms.sab.ac.lk')) {
    console.error('\nError: Email must end with @ms.sab.ac.lk');
    rl.close();
    process.exit(1);
  }

  const phone = await question('Enter Phone Number: ');
  const department = await question('Enter Department: ');
  const employeeId = await question('Enter Employee ID: ');

  const password = await question('Enter Password: ');
  
  if (password.length < 6) {
    console.error('\nError: Password must be at least 6 characters long');
    rl.close();
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const db = admin.database();
    const adminsRef = db.ref('Admins');
    const newAdminRef = adminsRef.push();

    await newAdminRef.set({
      id: newAdminRef.key,
      name,
      email,
      phone,
      department,
      employeeId,
      password: hashedPassword,
      role: 'Admin',
      createdAt: admin.database.ServerValue.TIMESTAMP,
      lastLogin: null
    });

    console.log(`\nSuccess! Admin created with ID: ${newAdminRef.key}`);
  } catch (error) {
    console.error('\nError creating admin:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdmin();

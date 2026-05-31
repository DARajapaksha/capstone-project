/**
 * scripts/seedVerifier.js
 * Run once to create verifier account(s) in Firebase /Verifiers node:
 *   node scripts/seedVerifier.js
 *
 * You can add more verifiers to the `verifiers` array below before running.
 */
require('dotenv').config({ path: '../.env' });
const admin = require('../src/config/firebase');
const bcrypt = require('bcryptjs');

const verifiers = [
  {
    name: 'John Smith',
    email: 'john.smith@ms.sab.ac.lk',
    password: 'Verifier@123',
    department: 'Student Affairs',
    employeeId: 'VER-001',
    role: 'verifier',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@ms.sab.ac.lk',
    password: 'Verifier@123',
    department: 'Academic Registry',
    employeeId: 'VER-002',
    role: 'verifier',
  },
];

async function seedVerifiers() {
  const db = admin.database();
  const verifiersRef = db.ref('Verifiers');

  console.log('🌱 Seeding verifier accounts into Firebase...\n');

  for (const verifier of verifiers) {
    // Check if verifier with this email already exists
    const existing = await verifiersRef
      .orderByChild('email')
      .equalTo(verifier.email)
      .once('value');

    if (existing.exists()) {
      console.log(`⚠️  Skipping ${verifier.email} — already exists.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(verifier.password, 12);
    const newRef = verifiersRef.push();
    const now = Date.now();

    await newRef.set({
      id: newRef.key,
      name: verifier.name,
      email: verifier.email,
      password: hashedPassword,
      department: verifier.department,
      employeeId: verifier.employeeId,
      role: verifier.role,
      createdAt: now,
      lastLogin: null,
    });

    console.log(`   ✅ Created verifier: ${verifier.name} <${verifier.email}>`);
    console.log(`      Password: ${verifier.password}`);
    console.log(`      Employee ID: ${verifier.employeeId}\n`);
  }

  console.log('✨ Verifier seeding complete!');
  console.log('\n📋 Login credentials summary:');
  verifiers.forEach((v) => {
    console.log(`   Email: ${v.email}  |  Password: ${v.password}`);
  });

  process.exit(0);
}

seedVerifiers().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

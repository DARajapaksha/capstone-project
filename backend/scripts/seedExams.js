/**
 * scripts/seedExams.js
 * Run once to populate initial exam data:
 *   node scripts/seedExams.js
 */
require('dotenv').config({ path: '../.env' });
const admin = require('../src/config/firebase');

const exams = [
  {
    courseCode: 'MATH-401',
    courseName: 'Advanced Mathematics Final',
    description: 'Comprehensive final exam covering calculus, linear algebra, and differential equations.',
    date: '2026-03-15',
    time: '10:00 AM',
    duration: 3,
    proctoring: 'Online Proctored',
    capacity: 50,
    enrolled: 0,
    status: 'Open',
  },
  {
    courseCode: 'CS-302',
    courseName: 'Computer Science Theory',
    description: 'Exam on algorithms, data structures, and computational complexity.',
    date: '2026-03-18',
    time: '2:00 PM',
    duration: 2.5,
    proctoring: 'Online Proctored',
    capacity: 40,
    enrolled: 0,
    status: 'Open',
  },
  {
    courseCode: 'MKT-201',
    courseName: 'Digital Marketing Fundamentals',
    description: 'Assessment of digital marketing strategies, SEO, and social media marketing.',
    date: '2026-03-20',
    time: '9:00 AM',
    duration: 2,
    proctoring: 'Online Proctored',
    capacity: 60,
    enrolled: 0,
    status: 'Open',
  },
  {
    courseCode: 'DS-501',
    courseName: 'Data Science with Python',
    description: 'Practical exam on data analysis, machine learning, and Python programming.',
    date: '2026-03-22',
    time: '11:00 AM',
    duration: 4,
    proctoring: 'Online Proctored',
    capacity: 35,
    enrolled: 0,
    status: 'Open',
  },
  {
    courseCode: 'LAW-301',
    courseName: 'Business Law & Ethics',
    description: 'Examination covering business regulations, contracts, and professional ethics.',
    date: '2026-03-25',
    time: '1:00 PM',
    duration: 2,
    proctoring: 'Online Proctored',
    capacity: 45,
    enrolled: 0,
    status: 'Open',
  },
  {
    courseCode: 'WEB-401',
    courseName: 'Web Development Certification',
    description: 'Assessment including React, Node.js, databases, and full-stack development.',
    date: '2026-03-28',
    time: '3:00 PM',
    duration: 3,
    proctoring: 'Online Proctored',
    capacity: 30,
    enrolled: 0,
    status: 'Open',
  },
];

async function seedExams() {
  const db = admin.database();
  const examsRef = db.ref('Exams');

  // Check if exams already exist
  const snapshot = await examsRef.once('value');
  if (snapshot.exists()) {
    const count = Object.keys(snapshot.val()).length;
    console.log(`⚠️  ${count} exam(s) already exist in Firebase. Skipping seed.`);
    console.log('   Delete /Exams in Firebase Console first if you want to re-seed.');
    process.exit(0);
  }

  console.log('🌱 Seeding exams into Firebase...\n');
  const now = new Date().toISOString();

  for (const exam of exams) {
    const newRef = examsRef.push();
    await newRef.set({ ...exam, createdAt: now, updatedAt: now });
    console.log(`   ✅ ${exam.courseCode} — ${exam.courseName}`);
  }

  console.log(`\n✨ Successfully seeded ${exams.length} exams into Firebase /Exams node!`);
  process.exit(0);
}

seedExams().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

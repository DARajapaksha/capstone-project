const admin = require('./src/config/firebase');

async function testEnroll() {
  const db = admin.database();
  const userId = 'xcHHfTu2L9ddcYLiEdhwYzc3R9F3'; // the user ID from the login log

  console.log("Seeding student exams in Firebase...");
  
  const studentExamsRef = db.ref(`Student_Exams/${userId}`);
  
  // Enrolling in MATH-401 (date: "2026-5-29", time: "10:00 PM")
  await studentExamsRef.child('-Othvg5hi3PQxk42sWc8').set({
    courseCode: 'MATH-401',
    courseName: 'Advanced Mathematics Final',
    description: 'Comprehensive final exam covering calculus, linear algebra, and differential equations.',
    date: '2026-5-29',
    time: '10:00 PM',
    duration: 3,
    proctoring: 'Online Proctored',
    status: 'upcoming',
    verificationStatus: 'required',
    badge: 'Verify Required',
    badgeColor: 'yellow',
    verificationMessage: 'You must verify your identity before taking this exam'
  });

  // Enrolling in CS-302 (date: "2026-06-15", time: "2:00 PM")
  await studentExamsRef.child('-Othvg7l0vrsNFFBmOwA').set({
    courseCode: 'CS-302',
    courseName: 'Computer Science Theory',
    description: 'Exam on algorithms, data structures, and computational complexity.',
    date: '2026-06-15',
    time: '2:00 PM',
    duration: 2.5,
    proctoring: 'Online Proctored',
    status: 'upcoming',
    verificationStatus: 'verified',
    badge: 'Verified',
    badgeColor: 'green',
    verificationMessage: 'Verified'
  });

  console.log("Seeding complete. Verifying getStudentDashboard output...");

  // Mocking req and res to run controller logic
  const { getStudentDashboard } = require('./src/controllers/userController');
  const req = {
    user: { uid: userId }
  };
  const res = {
    status: (code) => {
      console.log("Response Status:", code);
      return {
        json: (data) => {
          console.log("Response JSON:", JSON.stringify(data, null, 2));
        }
      };
    }
  };

  await getStudentDashboard(req, res);
  process.exit(0);
}

testEnroll().catch(err => {
  console.error(err);
  process.exit(1);
});

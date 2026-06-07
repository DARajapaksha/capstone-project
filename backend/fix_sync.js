const admin = require('./src/config/firebase');

async function syncExams() {
  try {
    console.log('Starting sync...');
    const db = admin.firestore();
    const usersSnapshot = await db.collection('Users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      const enrollmentsSnapshot = await db.collection('Enrollments').doc(userId).collection('exams').get();
      
      for (const examDoc of enrollmentsSnapshot.docs) {
        const examId = examDoc.id;
        const enrollmentData = examDoc.data();
        
        const studentExamRef = db.collection('Student_Exams').doc(userId).collection('exams').doc(examId);
        const studentExamDoc = await studentExamRef.get();
        
        if (studentExamDoc.exists) {
          const seData = studentExamDoc.data();
          if (seData.verificationStatus !== enrollmentData.verificationStatus) {
            console.log(`Syncing user ${userId} exam ${examId}: ${seData.verificationStatus} -> ${enrollmentData.verificationStatus}`);
            
            // Map 'failed' to 'rejected' for Student_Exams if needed, but let's just use what's in Enrollment or map it properly
            let newStatus = enrollmentData.verificationStatus;
            if (newStatus === 'failed') newStatus = 'rejected';
            
            await studentExamRef.update({
              verificationStatus: newStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    }
    console.log('Sync complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing:', error);
    process.exit(1);
  }
}

syncExams();

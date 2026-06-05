const admin = require('../config/firebase');

const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const db = admin.firestore();

    // 1. Fetch user data
    const userDoc = await db.collection('Users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Jan 15, 2026';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const userData = userDoc.data();
    const userInfo = {
      name: userData.name || '',
      studentId: userData.studentId || '',
      nic: userData.nic || '',
      email: userData.email || '',
      avatar: userData.avatar || '',
      phone: userData.phone || '',
      department: userData.department || '',
      enrolledSince: formatDate(userData.createdAt)
    };

    // 2. Retrieve the latest status from Verification_Requests collection
    const verReqQuery = await db.collection('Verification_Requests')
      .where('userId', '==', userId)
      .get();

    let latestStatus = 'Not Submitted';
    let latestTimestamp = 0;

    if (!verReqQuery.empty) {
      verReqQuery.docs.forEach((doc) => {
        const reqData = doc.data();
        const ts = reqData.timestamp ? (reqData.timestamp.toMillis ? reqData.timestamp.toMillis() : reqData.timestamp) : 0;
        if (ts >= latestTimestamp) {
          latestTimestamp = ts;
          latestStatus = reqData.status || 'Pending';
        }
      });
    }

    // 3. Fetch the 5 most recent activities for this user
    // Note: No .orderBy() here to avoid needing a composite Firestore index — we sort in JS
    const auditQuery = await db.collection('Audit_log')
      .where('userId', '==', userId)
      .get();

    const recentActivities = auditQuery.docs
      .map(doc => {
        const d = doc.data();
        return { ...d, timestamp: d.timestamp ? d.timestamp.toMillis() : null };
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    return res.status(200).json({
      profile: userInfo,
      verificationStatus: latestStatus,
      recentActivity: recentActivities
    });

  } catch (error) {
    console.error('Error in getStudentDashboard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const { name, nic, studentId, email, avatar, phone, department } = req.body;

    if (!name && !nic && !studentId && !email && !avatar && !phone && !department) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    const db = admin.firestore();
    const userRef = db.collection('Users').doc(userId);

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (nic !== undefined) updates.nic = nic;
    if (studentId !== undefined) updates.studentId = studentId;
    if (email !== undefined) updates.email = email;
    if (avatar !== undefined) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;

    await userRef.update(updates);

    // Sanitize updates for the audit log
    const auditDetails = { ...updates };
    if (auditDetails.avatar) {
      auditDetails.avatar = `[Base64 Image - Size: ${Math.round(auditDetails.avatar.length / 1024)} KB]`;
    }

    await db.collection('Audit_log').add({
      userId: userId,
      event: 'Profile Updated',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: auditDetails
    });

    const updatedDoc = await userRef.get();
    const updatedUser = updatedDoc.data();

    if (updatedUser.password) {
      delete updatedUser.password;
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const db = admin.firestore();

    // 1. Fetch Audit Logs — no .orderBy() to avoid composite index requirement
    const auditQuery = await db.collection('Audit_log')
      .where('userId', '==', userId)
      .get();

    const allActivities = auditQuery.docs
      .map(doc => {
        const d = doc.data();
        return { ...d, timestamp: d.timestamp ? d.timestamp.toMillis() : null };
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const recentActivity = allActivities.slice(0, 4);

    // 2. Fetch Verification details
    const verReqQuery = await db.collection('Verification_Requests')
      .where('userId', '==', userId)
      .get();

    let latestFaceMatchScore = null;
    let latestBlockchainHash = null;
    let latestTimestamp = 0;

    if (!verReqQuery.empty) {
      verReqQuery.docs.forEach((doc) => {
        const reqData = doc.data();
        const ts = reqData.timestamp ? (reqData.timestamp.toMillis ? reqData.timestamp.toMillis() : reqData.timestamp) : 0;
        if (ts >= latestTimestamp) {
          latestTimestamp = ts;
          latestFaceMatchScore = reqData.faceMatchScore || null;
          latestBlockchainHash = reqData.blockchainHash || null;
        }
      });
    }

    // 3. Fetch Student Exams
    const examsQuery = await db.collection('Student_Exams').doc(userId).collection('exams').get();

    let allExams = [];
    if (!examsQuery.empty) {
      allExams = examsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const now = new Date().getTime();

    const upcomingExams = allExams.filter(exam => {
      const examTime = new Date(exam.date).getTime();
      return examTime >= now;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastExams = allExams.filter(exam => {
      const examTime = new Date(exam.date).getTime();
      return examTime < now;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const nextTwoExams = upcomingExams.slice(0, 2);

    return res.status(200).json({
      overview: {
        upcomingExams: nextTwoExams,
        recentActivity: recentActivity
      },
      verification: {
        faceMatchScore: latestFaceMatchScore,
        blockchainHash: latestBlockchainHash
      },
      myExams: {
        upcoming: upcomingExams,
        past: pastExams
      },
      activity: {
        history: allActivities
      }
    });

  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const enrollExam = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { examId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }
    if (!examId) {
      return res.status(400).json({ error: 'examId is required.' });
    }

    const db = admin.firestore();
    const examRef = db.collection('Exams').doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const examData = examDoc.data();
    if (examData.status === 'Full' || examData.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot enroll: exam is ${examData.status}.` });
    }

    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : { email: '' };

    const enrolledAt = new Date().toISOString();
    
    // Write to Enrollments collection (for verification workflow)
    await db.collection('Enrollments').doc(userId).collection('exams').doc(examId).set({
      examId,
      enrolledAt,
      verificationStatus: 'pending',
      studentId: userId,
      studentEmail: userData.email || ''
    });

    // Write to Student_Exams collection (for dashboard)
    await db.collection('Student_Exams').doc(userId).collection('exams').doc(examId).set({
      ...examData,
      verificationStatus: 'pending',
      enrolledAt,
      verifiedAt: null
    });

    // Increment enrolled count
    await examRef.update({
      enrolled: admin.firestore.FieldValue.increment(1)
    });

    // Audit log
    await db.collection('Audit_log').add({
      userId: userId,
      event: `Enrolled in ${examData.courseCode}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { examId, courseCode: examData.courseCode }
    });

    return res.status(200).json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Error in enrollExam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { examId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = admin.firestore();
    
    // Check if enrolled
    const studentExamRef = db.collection('Student_Exams').doc(userId).collection('exams').doc(examId);
    const studentExamDoc = await studentExamRef.get();
    
    if (!studentExamDoc.exists) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }
    const examData = studentExamDoc.data();

    await studentExamRef.delete();
    await db.collection('Enrollments').doc(userId).collection('exams').doc(examId).delete();

    // Decrement enrolled count
    const examRef = db.collection('Exams').doc(examId);
    const examDoc = await examRef.get();
    if (examDoc.exists) {
      const currentEnrolled = examDoc.data().enrolled || 0;
      if (currentEnrolled > 0) {
        await examRef.update({
          enrolled: admin.firestore.FieldValue.increment(-1)
        });
      }
    }

    // Audit log
    await db.collection('Audit_log').add({
      userId: userId,
      event: `Cancelled enrollment for ${examData.courseCode || examId}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { examId, courseCode: examData.courseCode || '' }
    });

    return res.status(200).json({ message: 'Enrollment cancelled' });
  } catch (error) {
    console.error('Error in cancelEnrollment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getStudentDashboard,
  updateProfile,
  getDashboardData,
  enrollExam,
  cancelEnrollment
};

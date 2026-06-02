const admin = require('../config/firebase');

const getStudentDashboard = async (req, res) => {
  try {
    // Extract user ID from the decoded JWT token attached by authMiddleware
    // Depending on authController.js, the uid is stored in req.user.uid
    const userId = req.user.uid || req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const db = admin.database();

    // Fetch all database queries concurrently to minimize latency (Promise.all)
    const [
      userSnapshot,
      verReqSnapshot,
      auditLogSnapshot,
      examsSnapshot,
      masterExamsSnapshot
    ] = await Promise.all([
      db.ref(`Users/${userId}`).once('value'),
      db.ref('Verification_Requests').orderByChild('userId').equalTo(userId).once('value'),
      db.ref('Audit_Log').orderByChild('userId').equalTo(userId).once('value'),
      db.ref(`Student_Exams/${userId}`).once('value'),
      db.ref('Exams').once('value')
    ]);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Jan 15, 2026';
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const userData = userSnapshot.val();
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

    let latestStatus = 'Not Submitted';
    let latestTimestamp = 0;

    if (verReqSnapshot.exists()) {
      verReqSnapshot.forEach((childSnapshot) => {
        const reqData = childSnapshot.val();
        const reqTimestamp = reqData.timestamp || 0;
        
        // Find the most recent verification request
        if (reqTimestamp >= latestTimestamp) {
          latestTimestamp = reqTimestamp;
          latestStatus = reqData.status || 'Pending';
        }
      });
    }

    let activities = [];
    if (auditLogSnapshot.exists()) {
      auditLogSnapshot.forEach((childSnapshot) => {
        activities.push(childSnapshot.val());
      });
    }

    // Sort activities descending by timestamp
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Get the top 5 most recent activities
    const recentActivities = activities.slice(0, 5);

    const masterExamsMap = masterExamsSnapshot.val() || {};
    
    let enrolledExams = [];
    let completedCount = 0;
    let enrolledCount = 0;
    let nextExamStr = 'None';

    if (examsSnapshot.exists()) {
      examsSnapshot.forEach((childSnapshot) => {
        const studentExamVal = childSnapshot.val();
        const examId = childSnapshot.key;
        const masterExam = masterExamsMap[examId];

        const exam = {
          id: examId,
          ...studentExamVal,
          ...(masterExam || {}), // Overrides details with the latest master copy (e.g. courseName, courseCode, date, time, duration, proctoring, description)
          status: studentExamVal.status
        };
        enrolledExams.push(exam);
        if (exam.status === 'upcoming') {
          enrolledCount++;
        } else if (exam.status === 'completed') {
          completedCount++;
        }
      });
    }

    const getExamTimestamp = (exam) => {
      try {
        if (exam.date) {
          const parts = exam.date.trim().split('-');
          const normalizedDate = parts.length === 3
            ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
            : exam.date;
          const timeStr = exam.time ? exam.time.trim() : '00:00';
          const parsed = new Date(`${normalizedDate} ${timeStr}`);
          if (!isNaN(parsed.getTime())) {
            return parsed.getTime();
          }
          const fallback = new Date(normalizedDate);
          if (!isNaN(fallback.getTime())) {
            return fallback.getTime();
          }
        }
      } catch (err) {
        // ignore
      }
      return 0;
    };

    const now = Date.now();

    // Sort upcoming exams chronologically by date and time
    const sortedUpcoming = enrolledExams
      .filter(exam => {
        const examTime = getExamTimestamp(exam);
        
        // Scenario 1: It's in the future
        if (examTime >= now) {
          return exam.status === 'upcoming';
        }
        
        // Scenario 2: It's in the past (by at most 2 days) and verificationStatus is not verified
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if (now - examTime <= twoDaysMs && exam.verificationStatus !== 'verified') {
          return exam.status === 'upcoming';
        }
        
        return false;
      })
      .sort((a, b) => getExamTimestamp(a) - getExamTimestamp(b));

    if (sortedUpcoming.length > 0) {
      const nextExam = sortedUpcoming.find(exam => getExamTimestamp(exam) >= now) || sortedUpcoming[0];
      const nextDate = new Date(nextExam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      nextExamStr = `${nextExam.courseCode} (${nextDate})`;
    }

    const upcomingExams = sortedUpcoming.slice(0, 5);

    // Dynamically generate notifications for approaching exams
    let notifications = [];
    
    enrolledExams.forEach(exam => {
      if (exam.status === 'upcoming') {
        const examTime = getExamTimestamp(exam);
        const diffMs = examTime - now;

        if (diffMs > 0) {
          if (diffMs <= 60 * 60 * 1000) {
            // Starts in 1 hour
            notifications.push({
              id: `exam-1h-${exam.id}`,
              type: 'warning',
              title: 'Exam Starts in 1 Hour!',
              body: `Your exam ${exam.courseCode} starts in less than an hour at ${exam.time}. Please prepare your identity verification.`,
              time: '1 hour remaining',
              read: false
            });
          } else if (diffMs <= 24 * 60 * 60 * 1000) {
            // Starts today
            notifications.push({
              id: `exam-today-${exam.id}`,
              type: 'info',
              title: 'Exam Scheduled Today',
              body: `Your exam ${exam.courseCode} (${exam.courseName}) is scheduled for today at ${exam.time}.`,
              time: 'Today',
              read: false
            });
          } else if (diffMs <= 48 * 60 * 60 * 1000) {
            // Starts tomorrow / in 1 day
            notifications.push({
              id: `exam-1d-${exam.id}`,
              type: 'info',
              title: 'Exam Starting in 1 Day',
              body: `Your exam ${exam.courseCode} (${exam.courseName}) starts tomorrow at ${exam.time}.`,
              time: '1 day remaining',
              read: false
            });
          }
        } else {
          // Missed exam notification if past but within 2 days and not verified
          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
          if (now - examTime <= twoDaysMs && exam.verificationStatus !== 'verified') {
            notifications.push({
              id: `exam-missed-${exam.id}`,
              type: 'warning',
              title: 'Verification Missed',
              body: `You did not complete identity verification for ${exam.courseCode}. Registration is suspended.`,
              time: 'Expired',
              read: false
            });
          }
        }
      }
    });

    // Add notifications from Audit logs
    activities.forEach(activity => {
      const eventTime = activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      if (activity.event === 'Identity Verification Successful') {
        notifications.push({
          id: `audit-${activity.timestamp || Math.random()}`,
          type: 'success',
          title: 'Verification Successful',
          body: `Your identity has been verified successfully for ${activity.details?.courseCode || 'your exam'}.`,
          time: eventTime,
          read: true
        });
      } else if (activity.event === 'Identity Verification Failed') {
        notifications.push({
          id: `audit-${activity.timestamp || Math.random()}`,
          type: 'warning',
          title: 'Verification Failed',
          body: `Identity verification failed. Reason: ${activity.details?.reason || 'unspecified'}.`,
          time: eventTime,
          read: false
        });
      }
    });

    // Return the combined dashboard data
    return res.status(200).json({
      profile: userInfo,
      verificationStatus: latestStatus,
      recentActivity: recentActivities,
      enrolledExams: enrolledExams,
      upcomingExams: upcomingExams,
      notifications: notifications,
      stats: {
        enrolledCount: enrolledCount,
        completedCount: completedCount,
        nextExam: nextExamStr
      }
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
      return res.status(400).json({ error: 'At least one field (name, nic, studentId, email, avatar, phone, or department) is required to update' });
    }

    const db = admin.database();
    const userRef = db.ref(`Users/${userId}`);
    
    const userSnapshot = await userRef.once('value');
    if (!userSnapshot.exists()) {
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

    // Sanitize updates for the audit log to prevent storing huge base64 image strings
    const auditDetails = { ...updates };
    if (auditDetails.avatar) {
      auditDetails.avatar = `[Base64 Image - Size: ${Math.round(auditDetails.avatar.length / 1024)} KB]`;
    }

    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: userId,
      event: 'Profile Updated',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: auditDetails
    });

    const updatedUserSnapshot = await userRef.once('value');
    const updatedUser = updatedUserSnapshot.val();

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

    const db = admin.database();

    // 1. Fetch Audit Logs (Activity & Overview)
    const auditLogRef = db.ref('Audit_Log');
    const auditLogSnapshot = await auditLogRef.orderByChild('userId').equalTo(userId).once('value');
    
    let allActivities = [];
    if (auditLogSnapshot.exists()) {
      auditLogSnapshot.forEach((childSnapshot) => {
        allActivities.push(childSnapshot.val());
      });
    }

    // Sort descending by timestamp
    allActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Overview needs last 4 logs, Activity needs full history
    const recentActivity = allActivities.slice(0, 4);

    // 2. Fetch Verification details
    const verReqRef = db.ref('Verification_Requests');
    const verReqSnapshot = await verReqRef.orderByChild('userId').equalTo(userId).once('value');
    
    let latestFaceMatchScore = null;
    let latestBlockchainHash = null;
    let latestTimestamp = 0;

    if (verReqSnapshot.exists()) {
      verReqSnapshot.forEach((childSnapshot) => {
        const reqData = childSnapshot.val();
        const reqTimestamp = reqData.timestamp || 0;
        
        if (reqTimestamp >= latestTimestamp) {
          latestTimestamp = reqTimestamp;
          latestFaceMatchScore = reqData.faceMatchScore || null;
          latestBlockchainHash = reqData.blockchainHash || null;
        }
      });
    }

    // 3. Fetch Exams (My Exams & Overview)
    const examsRef = db.ref(`Student_Exams/${userId}`);
    const examsSnapshot = await examsRef.once('value');
    
    let allExams = [];
    if (examsSnapshot.exists()) {
      examsSnapshot.forEach((childSnapshot) => {
        allExams.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
    }

    const now = new Date().getTime();

    // Categorize by date: Upcoming vs Past
    // Using a simplistic check: if exam timestamp > now, it's upcoming
    // Assuming exam.date is a valid date string or timestamp
    const upcomingExams = allExams.filter(exam => {
      const examTime = new Date(exam.date).getTime();
      return examTime >= now;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastExams = allExams.filter(exam => {
      const examTime = new Date(exam.date).getTime();
      return examTime < now;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Overview needs next 2 upcoming exams
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

const getAvailableExams = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const db = admin.database();
    
    // Fetch all exams from Exams node
    const examsSnapshot = await db.ref('Exams').once('value');
    let exams = [];
    if (examsSnapshot.exists()) {
      examsSnapshot.forEach((childSnapshot) => {
        exams.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
    }

    // Fetch student's enrolled exams to check enrollment status
    const enrolledSnapshot = await db.ref(`Student_Exams/${userId}`).once('value');
    const enrolledIds = new Set();
    if (enrolledSnapshot.exists()) {
      enrolledSnapshot.forEach((childSnapshot) => {
        enrolledIds.add(childSnapshot.key);
      });
    }

    // Map through exams and set enrolled status and capacity status
    const result = exams.map(exam => {
      const isEnrolled = enrolledIds.has(exam.id);
      const isFull = (exam.enrolled || 0) >= (exam.capacity || 0);
      
      // Determine display status for the frontend
      let displayStatus = 'Available';
      if (isEnrolled) {
        displayStatus = 'Enrolled';
      } else if (isFull) {
        displayStatus = 'Full';
      }

      return {
        ...exam,
        isEnrolled,
        isFull,
        displayStatus
      };
    });

    return res.status(200).json({ exams: result });
  } catch (error) {
    console.error('Error in getAvailableExams:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const enrollInExam = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { examId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const db = admin.database();
    
    // Get exam details
    const examSnapshot = await db.ref(`Exams/${examId}`).once('value');
    if (!examSnapshot.exists()) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    const exam = examSnapshot.val();

    // Check if already enrolled
    const studentExamRef = db.ref(`Student_Exams/${userId}/${examId}`);
    const studentExamSnapshot = await studentExamRef.once('value');
    if (studentExamSnapshot.exists()) {
      return res.status(400).json({ error: 'You are already enrolled in this exam' });
    }

    // Check capacity
    const enrolledCount = exam.enrolled || 0;
    const capacity = exam.capacity || 0;
    if (enrolledCount >= capacity) {
      return res.status(400).json({ error: 'This exam is full' });
    }

    // Perform transaction to increment enrolled count and verify capacity
    let enrollmentSucceeded = false;
    const examRef = db.ref(`Exams/${examId}`);
    await examRef.transaction((currentData) => {
      // If currentData is null (not yet cached locally), fallback to the database values we just fetched
      const data = currentData || { enrolled: exam.enrolled || 0, capacity: exam.capacity || 0 };
      const currentEnrolled = data.enrolled || 0;
      const currentCapacity = data.capacity || 0;
      
      if (currentEnrolled < currentCapacity) {
        data.enrolled = currentEnrolled + 1;
        enrollmentSucceeded = true;
        return {
          ...exam,
          ...data
        };
      }
      return; // Abort transaction if really full
    });

    if (!enrollmentSucceeded) {
      return res.status(400).json({ error: 'Enrollment failed: Exam is full' });
    }

    // Create entry in Student_Exams
    const newEnrollment = {
      courseCode: exam.courseCode,
      courseName: exam.courseName,
      description: exam.description,
      date: exam.date,
      time: exam.time,
      duration: exam.duration,
      proctoring: exam.proctoring,
      status: 'upcoming',
      verificationStatus: 'required',
      badge: 'Verify Required',
      badgeColor: 'yellow',
      verificationMessage: 'You must verify your identity before taking this exam'
    };
    await studentExamRef.set(newEnrollment);

    // Add entry to Audit_Log
    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: userId,
      event: `Enrolled in ${exam.courseCode}`,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { examId, courseCode: exam.courseCode }
    });

    return res.status(200).json({
      message: `Successfully enrolled in ${exam.courseName}`,
      exam: { id: examId, ...newEnrollment }
    });
  } catch (error) {
    console.error('Error in enrollInExam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { examId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const db = admin.database();

    // Check if enrolled
    const studentExamRef = db.ref(`Student_Exams/${userId}/${examId}`);
    const studentExamSnapshot = await studentExamRef.once('value');
    if (!studentExamSnapshot.exists()) {
      return res.status(400).json({ error: 'You are not enrolled in this exam' });
    }

    // Get exam details
    const examSnapshot = await db.ref(`Exams/${examId}`).once('value');
    const exam = examSnapshot.exists() ? examSnapshot.val() : null;

    if (exam) {
      // Perform transaction to decrement enrolled count
      const examRef = db.ref(`Exams/${examId}`);
      await examRef.transaction((currentData) => {
        const data = currentData || { enrolled: exam.enrolled || 0, capacity: exam.capacity || 0 };
        const currentEnrolled = data.enrolled || 0;
        data.enrolled = Math.max(0, currentEnrolled - 1);
        return {
          ...exam,
          ...data
        };
      });
    }

    const courseCode = exam ? exam.courseCode : studentExamSnapshot.val()?.courseCode || 'Unknown';
    const courseName = exam ? exam.courseName : studentExamSnapshot.val()?.courseName || 'Unknown';

    // Delete entry in Student_Exams
    await studentExamRef.remove();

    // Add entry to Audit_Log
    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: userId,
      event: `Cancelled enrollment in ${courseCode}`,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { examId, courseCode }
    });

    return res.status(200).json({
      message: `Successfully cancelled enrollment in ${courseName}`
    });
  } catch (error) {
    console.error('Error in cancelEnrollment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getStudentDashboard,
  updateProfile,
  getDashboardData,
  getAvailableExams,
  enrollInExam,
  cancelEnrollment
};

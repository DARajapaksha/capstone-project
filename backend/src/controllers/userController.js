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

    // 1. Fetch user's name, NIC, and email from Firebase Users collection
    const userRef = db.ref(`Users/${userId}`);
    const userSnapshot = await userRef.once('value');
    
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

    // 2. Retrieve the latest status from Verification_Requests collection
    const verReqRef = db.ref('Verification_Requests');
    // Fetch all requests for this user
    const verReqSnapshot = await verReqRef.orderByChild('userId').equalTo(userId).once('value');
    
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

    // 3. Fetch the 5 most recent activities from Audit_Log specifically for this user
    const auditLogRef = db.ref('Audit_Log');
    const auditLogSnapshot = await auditLogRef.orderByChild('userId').equalTo(userId).once('value');
    
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

    // Return the combined dashboard data
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

module.exports = {
  getStudentDashboard,
  updateProfile,
  getDashboardData
};

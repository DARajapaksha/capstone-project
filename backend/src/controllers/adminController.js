const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!email.endsWith('@ms.sab.ac.lk')) {
      return res.status(403).json({ error: 'Access denied: Invalid domain' });
    }

    const db = admin.firestore();

    // Find admin by email in Firestore
    const snapshot = await db.collection('Admins').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const adminDoc = snapshot.docs[0];
    const adminUser = adminDoc.data();
    const adminKey = adminDoc.id;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin
    await db.collection('Admins').doc(adminKey).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate JWT
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    
    // Generate Firebase Custom Token for frontend onSnapshot
    const firebaseToken = await admin.auth().createCustomToken(adminKey, { role: adminUser.role });

    return res.status(200).json({
      message: 'Login successful',
      token,
      firebaseToken,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone || '',
        department: adminUser.department || '',
        employeeId: adminUser.employeeId || '',
        role: adminUser.role,
        createdAt: adminUser.createdAt
      }
    });

  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllVerifications = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('Verification_Requests').get();

    if (snapshot.empty) {
      return res.status(200).json({ verifications: [] });
    }

    const verificationsList = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        timestamp: d.timestamp ? (d.timestamp.toMillis ? d.timestamp.toMillis() : d.timestamp) : null
      };
    });

    verificationsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return res.status(200).json({ verifications: verificationsList });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Request ID and new status are required' });
    }

    const allowedStatuses = ['Approved', 'Rejected', 'Pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }

    const db = admin.firestore();
    const reqRef = db.collection('Verification_Requests').doc(id);

    const doc = await reqRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    await reqRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add entry to Audit_Log
    await db.collection('Audit_log').add({
      userId: req.user ? (req.user.uid || req.user.userId) : 'admin',
      event: `Status Updated to ${status}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { requestId: id }
    });

    return res.status(200).json({
      message: `Verification request ${id} updated to ${status}`,
      id,
      status
    });

  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, department } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    const db = admin.firestore();
    const adminRef = db.collection('Admins').doc(id);

    const doc = await adminRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await adminRef.update({
      name: name || doc.data().name,
      phone: phone || '',
      department: department || ''
    });

    const updatedDoc = await adminRef.get();
    const updatedAdmin = updatedDoc.data();

    return res.status(200).json({
      message: 'Profile updated successfully',
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone || '',
        department: updatedAdmin.department || '',
        employeeId: updatedAdmin.employeeId || '',
        role: updatedAdmin.role,
        createdAt: updatedAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('Users').get();

    if (snapshot.empty) {
      return res.status(200).json({ students: [] });
    }

    const studentsList = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        // Convert Firestore Timestamp to milliseconds so frontend can do new Date(createdAt)
        createdAt: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt) : null,
        verifiedAt: d.verifiedAt ? (d.verifiedAt.toMillis ? d.verifiedAt.toMillis() : d.verifiedAt) : null,
      };
    });

    return res.status(200).json({ students: studentsList });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllAudits = async (req, res) => {
  try {
    const db = admin.firestore();
    // No .orderBy() to avoid needing a composite Firestore index — sort in JS instead
    const snapshot = await db.collection('Audit_log').get();

    if (snapshot.empty) {
      return res.status(200).json({ audits: [] });
    }

    const auditList = snapshot.docs
      .map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          timestamp: d.timestamp ? (d.timestamp.toMillis ? d.timestamp.toMillis() : d.timestamp) : null
        };
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return res.status(200).json({ audits: auditList });
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllVerifiers = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('Admins').get();

    if (snapshot.empty) {
      return res.status(200).json({ verifiers: [] });
    }

    const adminsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ verifiers: adminsList });
  } catch (error) {
    console.error('Error fetching verifiers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateStudentVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    if (!verificationStatus) {
      return res.status(400).json({ error: 'verificationStatus is required' });
    }

    const db = admin.firestore();
    const studentRef = db.collection('Users').doc(id);

    const doc = await studentRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const isVerified = verificationStatus === 'Verified';

    await studentRef.update({
      isVerified: isVerified,
      verificationStatus: verificationStatus,
      verifiedAt: isVerified ? admin.firestore.FieldValue.serverTimestamp() : null
    });

    // Add entry to Audit_Log
    await db.collection('Audit_log').add({
      userId: req.user ? (req.user.uid || req.user.userId) : 'admin',
      event: `Manual Student Status: ${verificationStatus}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { studentId: id, newStatus: verificationStatus }
    });

    return res.status(200).json({ message: 'Student verification status updated successfully' });
  } catch (error) {
    console.error('Error updating student verification status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Student ID is required' });

    const db = admin.firestore();

    // 1. Delete from Firebase Auth to free up the email
    try {
      await admin.auth().deleteUser(id);
      console.log(`[deleteStudent] User ${id} deleted from Firebase Auth`);
    } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    // 2. Cascade delete from Student_Exams subcollections
    const studentExamsRef = db.collection('Student_Exams').doc(id).collection('exams');
    const examsSnapshot = await studentExamsRef.get();
    if (!examsSnapshot.empty) {
      const batch = db.batch();
      examsSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    await db.collection('Student_Exams').doc(id).delete();

    // 3. Delete from Users collection
    await db.collection('Users').doc(id).delete();
    console.log(`[deleteStudent] User ${id} deleted from Firestore`);

    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  adminLogin,
  getAllVerifications,
  updateVerificationStatus,
  updateAdminProfile,
  getAllStudents,
  getAllAudits,
  getAllVerifiers,
  updateStudentVerificationStatus,
  deleteStudent
};

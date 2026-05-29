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

    const db = admin.database();
    const adminsRef = db.ref('Admins');
    
    // Find admin by email
    const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');
    
    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const adminsData = snapshot.val();
    const adminKey = Object.keys(adminsData)[0];
    const adminUser = adminsData[adminKey];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin
    await adminsRef.child(adminKey).update({
      lastLogin: admin.database.ServerValue.TIMESTAMP
    });

    // Generate JWT
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Return success
    return res.status(200).json({
      message: 'Login successful',
      token,
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
    const db = admin.database();
    const verReqRef = db.ref('Verification_Requests');
    const snapshot = await verReqRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(200).json({ verifications: [] });
    }

    const verificationsData = snapshot.val();
    const verificationsList = Object.keys(verificationsData).map(key => ({
      id: key,
      ...verificationsData[key]
    }));

    // Optionally sort by timestamp descending
    verificationsList.sort((a, b) => b.timestamp - a.timestamp);

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

    const db = admin.database();
    const specificReqRef = db.ref(`Verification_Requests/${id}`);
    
    const snapshot = await specificReqRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    await specificReqRef.update({
      status: status,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    // Add entry to Audit_Log
    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: req.user ? (req.user.uid || req.user.userId) : 'admin',
      event: `Status Updated to ${status}`,
      timestamp: admin.database.ServerValue.TIMESTAMP,
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

    const db = admin.database();
    const adminRef = db.ref(`Admins/${id}`);
    
    const snapshot = await adminRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Update fields
    await adminRef.update({
      name: name || snapshot.val().name,
      phone: phone || '',
      department: department || ''
    });

    // Get updated data to return
    const updatedSnapshot = await adminRef.once('value');
    const updatedAdmin = updatedSnapshot.val();

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
    const db = admin.database();
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(200).json({ students: [] });
    }

    const usersData = snapshot.val();
    const studentsList = Object.keys(usersData).map(key => ({
      id: key,
      ...usersData[key]
    }));

    return res.status(200).json({ students: studentsList });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllAudits = async (req, res) => {
  try {
    const db = admin.database();
    const auditRef = db.ref('Audit_Log');
    const snapshot = await auditRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(200).json({ audits: [] });
    }

    const auditData = snapshot.val();
    const auditList = Object.keys(auditData).map(key => ({
      id: key,
      ...auditData[key]
    }));

    // Sort descending by timestamp
    auditList.sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json({ audits: auditList });
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllVerifiers = async (req, res) => {
  try {
    const db = admin.database();
    const adminsRef = db.ref('Admins');
    const snapshot = await adminsRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(200).json({ verifiers: [] });
    }

    const adminsData = snapshot.val();
    const adminsList = Object.keys(adminsData).map(key => ({
      id: key,
      ...adminsData[key]
    }));

    return res.status(200).json({ verifiers: adminsList });
  } catch (error) {
    console.error('Error fetching verifiers:', error);
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
  getAllVerifiers
};

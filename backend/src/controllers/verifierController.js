const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { purgeImageFields } = require('./verificationController');
const blockchainService = require('../services/blockchainService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// POST /api/verifier/login
const verifierLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = admin.database();
    const verifiersRef = db.ref('Verifiers');

    const snapshot = await verifiersRef.orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const verifiersData = snapshot.val();
    const verifierKey = Object.keys(verifiersData)[0];
    const verifierUser = verifiersData[verifierKey];

    const isPasswordValid = await bcrypt.compare(password, verifierUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin
    await verifiersRef.child(verifierKey).update({
      lastLogin: admin.database.ServerValue.TIMESTAMP,
    });

    const token = jwt.sign(
      { id: verifierUser.id, email: verifierUser.email, role: 'verifier' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      verifier: {
        id: verifierUser.id,
        name: verifierUser.name,
        email: verifierUser.email,
        phone: verifierUser.phone || '',
        department: verifierUser.department || '',
        employeeId: verifierUser.employeeId || '',
        role: verifierUser.role || 'verifier',
        createdAt: verifierUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in verifierLogin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/verifier/profile/:id
const getVerifierProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.database();
    const verifierRef = db.ref(`Verifiers/${id}`);
    const snapshot = await verifierRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    const v = snapshot.val();
    return res.status(200).json({
      verifier: {
        id: v.id,
        name: v.name,
        email: v.email,
        phone: v.phone || '',
        department: v.department || '',
        employeeId: v.employeeId || '',
        role: v.role || 'verifier',
        createdAt: v.createdAt,
        lastLogin: v.lastLogin || null,
      },
    });
  } catch (error) {
    console.error('Error in getVerifierProfile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/verifier/profile/:id
const updateVerifierProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, department } = req.body;

    const db = admin.database();
    const verifierRef = db.ref(`Verifiers/${id}`);
    const snapshot = await verifierRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    await verifierRef.update({
      name: name || snapshot.val().name,
      phone: phone || '',
      department: department || '',
    });

    const updated = (await verifierRef.once('value')).val();
    return res.status(200).json({
      message: 'Profile updated',
      verifier: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        department: updated.department || '',
        employeeId: updated.employeeId || '',
        role: updated.role || 'verifier',
      },
    });
  } catch (error) {
    console.error('Error in updateVerifierProfile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/verifier/queue  — pending verification requests joined with student data
const getVerifierQueue = async (req, res) => {
  try {
    const db = admin.database();

    // Fetch all pending verification requests
    const verReqRef = db.ref('Verification_Requests');
    const snapshot = await verReqRef.orderByChild('status').equalTo('Pending').once('value');

    if (!snapshot.exists()) {
      return res.status(200).json({ queue: [] });
    }

    const rawRequests = snapshot.val();
    const requestIds = Object.keys(rawRequests);

    // Fetch all students once for efficient joining
    const usersSnapshot = await db.ref('Users').once('value');
    const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

    const queue = requestIds.map((key) => {
      const req = rawRequests[key];
      const student = usersData[req.userId] || usersData[req.studentId] || {};
      return {
        id: key,
        userId: req.userId || req.studentId || '',
        name: student.name || student.displayName || 'Unknown Student',
        nic: student.nic || student.nicNumber || '—',
        program: student.program || student.course || '—',
        email: student.email || '',
        idImageUrl: req.idImageUrl || null,
        selfieImageUrl: req.selfieImageUrl || null,
        score: req.score || null,
        status: req.status || 'Pending',
        timestamp: req.timestamp || null,
        submitted: req.timestamp
          ? new Date(req.timestamp).toLocaleString('en-US', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })
          : '—',
      };
    });

    // Sort newest first
    queue.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return res.status(200).json({ queue });
  } catch (error) {
    console.error('Error in getVerifierQueue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/verifier/history  — decisions made by this verifier
const getVerifierHistory = async (req, res) => {
  try {
    const verifierId = req.user.id || req.user.uid;
    const db = admin.database();

    const verReqRef = db.ref('Verification_Requests');
    const snapshot = await verReqRef.orderByChild('decidedBy').equalTo(verifierId).once('value');

    if (!snapshot.exists()) {
      return res.status(200).json({ history: [] });
    }

    const rawData = snapshot.val();
    const usersSnapshot = await db.ref('Users').once('value');
    const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

    const history = Object.keys(rawData).map((key) => {
      const item = rawData[key];
      const student = usersData[item.userId] || usersData[item.studentId] || {};
      return {
        id: key,
        userId: item.userId || item.studentId || '',
        name: student.name || student.displayName || 'Unknown Student',
        nic: student.nic || student.nicNumber || '—',
        program: student.program || student.course || '—',
        decision: item.status,
        decidedAt: item.decidedAt
          ? new Date(item.decidedAt).toLocaleString('en-US', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })
          : '—',
        notes: item.verifierNotes || '',
      };
    });

    history.sort((a, b) => (b.decidedAt || '').localeCompare(a.decidedAt || ''));
    return res.status(200).json({ history });
  } catch (error) {
    console.error('Error in getVerifierHistory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/verifier/queue/:id/decide
const decideVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;
    const verifierId = req.user.id || req.user.uid;
    const verifierEmail = req.user.email || '';

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be Approved or Rejected' });
    }

    const db = admin.database();
    const reqRef = db.ref(`Verification_Requests/${id}`);
    const snapshot = await reqRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const now = Date.now();
    const reqData = snapshot.val();
    const studentId = reqData.userId || reqData.studentId;
    const examId = reqData.examId;

    // ── Step 1: Generate SHA-256 hash of verification event data ─────────────
    // Raw biometric images are STRICTLY excluded — only metadata is hashed
    let blockchainTxHash = null;
    try {
      const hashPayload = {
        requestId: id,
        studentId: studentId || 'unknown',
        decision,
        decidedBy: verifierId,
        decidedAt: now,
        faceScore: reqData.faceScore || reqData.score || 0,
      };
      blockchainTxHash = await blockchainService.anchorVerification(hashPayload);
      console.log(`[Blockchain] Tx anchored: ${blockchainTxHash}`);
    } catch (bcErr) {
      console.error('[Blockchain] Anchoring failed (non-fatal):', bcErr.message);
      // Non-fatal — continue with DB update even if blockchain is unavailable
    }

    // ── Step 2: Update the verification request status ───────────────────────
    await reqRef.update({
      status: decision,
      decidedBy: verifierId,
      decidedByEmail: verifierEmail,
      decidedAt: now,
      verifierNotes: notes || '',
      updatedAt: admin.database.ServerValue.TIMESTAMP,
      blockchainTxHash: blockchainTxHash || null,
      // ── PDPA: clear any residual image fields ──
      idImageUrl: null,
      selfieImageUrl: null,
    });

    // ── Step 3: PDPA — purge biometric image fields from DB ──────────────────
    await purgeImageFields(db, id);

    // ── Step 4: Update student status ────────────────────────────────────────
    if (studentId && decision === 'Approved') {
      await db.ref(`Users/${studentId}`).update({
        isVerified: true,
        verificationStatus: 'Verified',
        verifiedAt: admin.database.ServerValue.TIMESTAMP,
        blockchainTxHash: blockchainTxHash || null,
      });
      if (examId) {
        await db.ref(`Enrollments/${studentId}/${examId}`).update({
          verificationStatus: 'verified',
          verifiedAt: admin.database.ServerValue.TIMESTAMP
        });
      }
    } else if (studentId && decision === 'Rejected') {
      await db.ref(`Users/${studentId}`).update({
        verificationStatus: 'Rejected',
      });
      if (examId) {
        await db.ref(`Enrollments/${studentId}/${examId}`).update({
          verificationStatus: 'rejected'
        });
      }
    }

    // ── Step 5: Audit logs ───────────────────────────────────────────────────
    await db.ref('Audit_Log').push({
      userId: verifierId,
      event: `Verifier ${decision} Verification`,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { requestId: id, studentId, decision, notes: notes || '', blockchainTxHash },
    });

    if (studentId) {
      await db.ref('Audit_Log').push({
        userId: studentId,
        event: decision === 'Approved' ? 'Identity Verification Successful' : 'Identity Verification Failed',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { requestId: id, verifierId, notes: notes || '', blockchainTxHash },
      });
    }

    return res.status(200).json({
      message: `Verification ${decision.toLowerCase()} successfully`,
      id,
      decision,
      blockchainTxHash,
    });
  } catch (error) {
    console.error('Error in decideVerification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/verifier/stats/:id  — quick stats for verifier profile page
const getVerifierStats = async (req, res) => {
  try {
    const verifierId = req.user.id || req.user.uid;
    const db = admin.database();

    const verReqRef = db.ref('Verification_Requests');
    const snapshot = await verReqRef.orderByChild('decidedBy').equalTo(verifierId).once('value');

    let total = 0, approved = 0, rejected = 0;
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.values(data).forEach((item) => {
        total++;
        if (item.status === 'Approved') approved++;
        else if (item.status === 'Rejected') rejected++;
      });
    }

    return res.status(200).json({ total, approved, rejected });
  } catch (error) {
    console.error('Error in getVerifierStats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/admin/verifiers — list all verifier accounts from Verifiers/ node
const listVerifiers = async (req, res) => {
  try {
    const db = admin.database();
    const verifiersRef = db.ref('Verifiers');
    const snapshot = await verifiersRef.once('value');

    if (!snapshot.exists()) {
      return res.status(200).json({ verifiers: [] });
    }

    const data = snapshot.val();
    const verifiers = Object.keys(data).map(key => {
      const v = data[key];
      // don't send password
      return {
        id: v.id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        department: v.department,
        employeeId: v.employeeId,
        role: v.role || 'verifier',
        createdAt: v.createdAt,
        lastLogin: v.lastLogin || null,
      };
    });

    return res.status(200).json({ verifiers });
  } catch (error) {
    console.error('Error in listVerifiers:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateVerifier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department, employeeId } = req.body;
    
    const db = admin.database();
    const verifierRef = db.ref(`Verifiers/${id}`);
    const snapshot = await verifierRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    const updates = { name, email, department, employeeId };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    await verifierRef.update(updates);

    return res.status(200).json({ message: 'Verifier updated successfully' });
  } catch (error) {
    console.error('Error in updateVerifier:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateVerifierRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const db = admin.database();
    const verifierRef = db.ref(`Verifiers/${id}`);
    const snapshot = await verifierRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    await verifierRef.update({ role });

    return res.status(200).json({ message: 'Verifier role updated successfully' });
  } catch (error) {
    console.error('Error in updateVerifierRole:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/admin/verifiers — create a new verifier account
const createVerifier = async (req, res) => {
  try {
    const { name, email, password, department, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = admin.database();
    const verifiersRef = db.ref('Verifiers');

    // Check if email already exists
    const existing = await verifiersRef.orderByChild('email').equalTo(email).once('value');
    if (existing.exists()) {
      return res.status(409).json({ error: 'A verifier with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newRef = verifiersRef.push();
    const now = Date.now();

    await newRef.set({
      id: newRef.key,
      name,
      email,
      password: hashedPassword,
      department: department || '',
      employeeId: employeeId || '',
      role: 'verifier',
      createdAt: now,
      lastLogin: null,
    });

    // Audit log
    await db.ref('Audit_Log').push({
      userId: req.user ? (req.user.id || req.user.uid) : 'admin',
      event: 'Verifier Account Created',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { verifierId: newRef.key, email },
    });

    return res.status(201).json({
      message: 'Verifier created successfully',
      verifier: { id: newRef.key, name, email, department: department || '', employeeId: employeeId || '', role: 'verifier', createdAt: now },
    });
  } catch (error) {
    console.error('Error in createVerifier:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /api/admin/verifiers/:id — remove a verifier account
const deleteVerifier = async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.database();
    const verifierRef = db.ref(`Verifiers/${id}`);

    const snapshot = await verifierRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    const verifierData = snapshot.val();
    await verifierRef.remove();

    // Audit log
    await db.ref('Audit_Log').push({
      userId: req.user ? (req.user.id || req.user.uid) : 'admin',
      event: 'Verifier Account Deleted',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { verifierId: id, email: verifierData.email },
    });

    return res.status(200).json({ message: 'Verifier deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVerifier:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  verifierLogin,
  getVerifierProfile,
  updateVerifierProfile,
  getVerifierQueue,
  getVerifierHistory,
  decideVerification,
  getVerifierStats,
  listVerifiers,
  createVerifier,
  deleteVerifier,
  updateVerifier,
  updateVerifierRole
};

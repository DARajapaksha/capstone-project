const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { purgeImageFields } = require('./verificationController');
const blockchainService = require('../services/blockchainService');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// POST /api/verifier/login
const verifierLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('Verifiers').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const verifierDoc = snapshot.docs[0];
    const verifierUser = verifierDoc.data();
    const verifierKey = verifierDoc.id;

    const isPasswordValid = await bcrypt.compare(password, verifierUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin
    await db.collection('Verifiers').doc(verifierKey).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
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
    const db = admin.firestore();
    const doc = await db.collection('Verifiers').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    const v = doc.data();
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

    const db = admin.firestore();
    const verifierRef = db.collection('Verifiers').doc(id);
    const doc = await verifierRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    await verifierRef.update({
      name: name || doc.data().name,
      phone: phone || '',
      department: department || '',
    });

    const updated = (await verifierRef.get()).data();
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

// GET /api/verifier/queue — pending verification requests joined with student data
const getVerifierQueue = async (req, res) => {
  try {
    const db = admin.firestore();

    // Fetch all pending verification requests
    const snapshot = await db.collection('Verification_Requests')
      .where('status', '==', 'Pending')
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ queue: [] });
    }

    // Fetch all students once for efficient joining
    const usersSnapshot = await db.collection('Users').get();
    const usersData = {};
    usersSnapshot.docs.forEach(doc => { usersData[doc.id] = doc.data(); });

    const queue = snapshot.docs.map((doc) => {
      const r = doc.data();
      const student = usersData[r.userId] || usersData[r.studentId] || {};
      const ts = r.timestamp ? (r.timestamp.toMillis ? r.timestamp.toMillis() : r.timestamp) : null;
      return {
        id: doc.id,
        userId: r.userId || r.studentId || '',
        name: student.name || student.displayName || 'Unknown Student',
        nic: student.nic || student.nicNumber || '—',
        program: student.program || student.course || '—',
        email: student.email || '',
        idImageUrl: r.idImageUrl || null,
        selfieImageUrl: r.selfieImageUrl || null,
        score: r.score || null,
        status: r.status || 'Pending',
        timestamp: ts,
        submitted: ts
          ? new Date(ts).toLocaleString('en-US', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })
          : '—',
      };
    });

    // Sort newest first
    queue.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Deduplicate by userId to ensure we only show the latest pending request per student
    const uniqueQueueMap = new Map();
    queue.forEach(item => {
      if (!uniqueQueueMap.has(item.userId)) {
        uniqueQueueMap.set(item.userId, item);
      }
    });
    
    const uniqueQueue = Array.from(uniqueQueueMap.values());

    return res.status(200).json({ queue: uniqueQueue });
  } catch (error) {
    console.error('Error in getVerifierQueue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/verifier/history — decisions made by this verifier
const getVerifierHistory = async (req, res) => {
  try {
    const verifierId = req.user.id || req.user.uid;
    const db = admin.firestore();

    const snapshot = await db.collection('Verification_Requests')
      .where('decidedBy', '==', verifierId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ history: [] });
    }

    const usersSnapshot = await db.collection('Users').get();
    const usersData = {};
    usersSnapshot.docs.forEach(doc => { usersData[doc.id] = doc.data(); });

    const history = snapshot.docs.map((doc) => {
      const item = doc.data();
      const student = usersData[item.userId] || usersData[item.studentId] || {};
      return {
        id: doc.id,
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

    const db = admin.firestore();
    const reqRef = db.collection('Verification_Requests').doc(id);
    const doc = await reqRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const now = Date.now();
    const reqData = doc.data();
    const studentId = reqData.userId || reqData.studentId;
    const examId = reqData.examId;

    // ── Step 1: Generate blockchain anchor ────────────────────────────────────
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
    }

    // ── Step 2: Update the verification request status ────────────────────────
    // Delete temporary images from Cloudinary if they exist
    try {
      if (reqData.idImagePublicId) {
        await cloudinary.uploader.destroy(reqData.idImagePublicId);
      }
      if (reqData.selfieImagePublicId) {
        await cloudinary.uploader.destroy(reqData.selfieImagePublicId);
      }
    } catch (err) {
      console.error('Error deleting images from Cloudinary:', err);
    }

    await reqRef.update({
      status: decision,
      decidedBy: verifierId,
      decidedByEmail: verifierEmail,
      decidedAt: now,
      verifierNotes: notes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      blockchainTxHash: blockchainTxHash || null,
      idImageUrl: admin.firestore.FieldValue.delete(),
      selfieImageUrl: admin.firestore.FieldValue.delete(),
      idImagePublicId: admin.firestore.FieldValue.delete(),
      selfieImagePublicId: admin.firestore.FieldValue.delete(),
    });

    // ── Step 3: PDPA — purge biometric image fields ───────────────────────────
    await purgeImageFields(db, id);

    // ── Step 3.5: Cancel other pending requests for this student ──────────────
    if (studentId) {
      const otherPending = await db.collection('Verification_Requests')
        .where('userId', '==', studentId)
        .where('status', '==', 'Pending')
        .get();

      if (!otherPending.empty) {
        const batch = db.batch();
        otherPending.docs.forEach(d => {
          if (d.id !== id) {
            batch.update(d.ref, {
              status: 'Superseded',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        });
        await batch.commit();
      }
    }

    // ── Step 4: Update student status ─────────────────────────────────────────
    if (studentId && decision === 'Approved') {
      await db.collection('Users').doc(studentId).update({
        isVerified: true,
        verificationStatus: 'Verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        blockchainTxHash: blockchainTxHash || null,
      });
      if (examId) {
        await db.collection('Enrollments').doc(studentId).collection('exams').doc(examId).update({
          verificationStatus: 'verified',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('Student_Exams').doc(studentId).collection('exams').doc(examId).update({
          verificationStatus: 'verified',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          txHash: blockchainTxHash || null
        });
      }
    } else if (studentId && decision === 'Rejected') {
      await db.collection('Users').doc(studentId).update({
        verificationStatus: 'Rejected',
        isVerified: false,
      });
      if (examId) {
        await db.collection('Enrollments').doc(studentId).collection('exams').doc(examId).update({
          verificationStatus: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('Student_Exams').doc(studentId).collection('exams').doc(examId).update({
          verificationStatus: 'rejected',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // ── Step 5: Audit logs ────────────────────────────────────────────────────
    await db.collection('Audit_log').add({
      userId: verifierId,
      event: `Verifier ${decision} Verification`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { requestId: id, studentId, decision, notes: notes || '', blockchainTxHash },
    });

    if (studentId) {
      await db.collection('Audit_log').add({
        userId: studentId,
        event: decision === 'Approved' ? 'Identity Verification Successful' : 'Identity Verification Failed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
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

// GET /api/verifier/stats/:id
const getVerifierStats = async (req, res) => {
  try {
    const verifierId = req.user.id || req.user.uid;
    const db = admin.firestore();

    const snapshot = await db.collection('Verification_Requests')
      .where('decidedBy', '==', verifierId)
      .get();

    let total = 0, approved = 0, rejected = 0;
    if (!snapshot.empty) {
      snapshot.docs.forEach((doc) => {
        const item = doc.data();
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

// GET /api/admin/verifiers — list all verifier accounts from Verifiers collection
const listVerifiers = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('Verifiers').get();

    if (snapshot.empty) {
      return res.status(200).json({ verifiers: [] });
    }

    const verifiers = snapshot.docs.map(doc => {
      const v = doc.data();
      return {
        id: v.id || doc.id,
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

    const db = admin.firestore();
    const verifierRef = db.collection('Verifiers').doc(id);
    const doc = await verifierRef.get();

    if (!doc.exists) {
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

    const db = admin.firestore();
    const verifierRef = db.collection('Verifiers').doc(id);
    const doc = await verifierRef.get();

    if (!doc.exists) {
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

    const db = admin.firestore();

    // Check if email already exists
    const existing = await db.collection('Verifiers').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A verifier with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newRef = db.collection('Verifiers').doc();
    const now = Date.now();

    await newRef.set({
      id: newRef.id,
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
    await db.collection('Audit_log').add({
      userId: req.user ? (req.user.id || req.user.uid) : 'admin',
      event: 'Verifier Account Created',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { verifierId: newRef.id, email },
    });

    return res.status(201).json({
      message: 'Verifier created successfully',
      verifier: { id: newRef.id, name, email, department: department || '', employeeId: employeeId || '', role: 'verifier', createdAt: now },
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
    const db = admin.firestore();
    const verifierRef = db.collection('Verifiers').doc(id);

    const doc = await verifierRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Verifier not found' });
    }

    const verifierData = doc.data();
    await verifierRef.delete();

    // Audit log
    await db.collection('Audit_log').add({
      userId: req.user ? (req.user.id || req.user.uid) : 'admin',
      event: 'Verifier Account Deleted',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
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

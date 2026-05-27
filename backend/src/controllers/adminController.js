const admin = require('../config/firebase');

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

module.exports = {
  getAllVerifications,
  updateVerificationStatus
};

const admin = require('../config/firebase');
const blockchainService = require('../services/blockchainService');

// ─── Helper: purge biometric images for a verification request ────────────────
// Deletes id_image and selfie_image fields from the Realtime DB document.
// The system uses in-memory base64 transmission (no Storage bucket uploads),
// so we only need to strip the URL fields from the document itself.
const purgeImageFields = async (db, requestId) => {
  try {
    const reqRef = db.ref(`Verification_Requests/${requestId}`);
    await reqRef.update({
      idImageUrl: null,
      selfieImageUrl: null,
      imagesPurgedAt: Date.now(),
      imagesPurgedReason: 'PDPA_COMPLIANCE'
    });
    console.log(`[PDPA] Purged image fields for request ${requestId}`);
  } catch (err) {
    console.error(`[PDPA] Failed to purge images for ${requestId}:`, err.message);
    // Non-fatal — log but do not block the decision response
  }
};

// POST /api/verification/upload
// Accepts base64 images in-memory (no Firebase Storage upload) and creates a
// Pending record. Images are NOT persisted in the database — they are sent
// directly to the AI service and discarded.
const uploadVerificationImages = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    if (!req.files || !req.files.id_image) {
      return res.status(400).json({ error: 'id_image is required' });
    }

    // Create a Pending record WITHOUT storing any image data
    const db = admin.database();
    const newReqRef = db.ref('Verification_Requests').push();

    await newReqRef.set({
      userId,
      status: 'Pending',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      // ⚠ NO idImageUrl / selfieImageUrl stored here — PDPA compliance
    });

    // Audit log
    await db.ref('Audit_Log').push({
      userId,
      event: 'Verification Upload Initiated',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { requestId: newReqRef.key }
    });

    return res.status(201).json({
      message: 'Verification request created',
      requestId: newReqRef.key,
      status: 'Pending'
    });

  } catch (error) {
    console.error('Error in uploadVerificationImages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/verification/result
// Called by the frontend after the AI service responds.
// Stores the AI scores only — never the raw images.
const submitVerificationResult = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    // We ignore the client-provided 'hash' for security; we generate it securely on the backend
    const { status, score, examId, examCode, requestId } = req.body;
    const db = admin.database();

    if (status === 'success') {
      let newKey = requestId;
      let blockchainTxHash = null;

      // Ensure we have a request key before anchoring
      if (!newKey) {
        newKey = db.ref('Verification_Requests').push().key;
      }

      // Generate secure blockchain anchor
      try {
        const hashPayload = {
          requestId: newKey,
          studentId: userId,
          decision: 'Approved',
          decidedBy: 'AI_SYSTEM',
          decidedAt: Date.now(),
          faceScore: score,
        };
        blockchainTxHash = await blockchainService.anchorVerification(hashPayload);
        console.log(`[Blockchain] AI auto-approval anchored: ${blockchainTxHash}`);
      } catch (bcErr) {
        console.error('[Blockchain] Anchoring failed (non-fatal):', bcErr.message);
      }

      const updateData = {
        userId,
        status: 'Approved',
        faceScore: score,
        examId: examId || null,
        examCode: examCode || 'Unknown',
        blockchainTxHash: blockchainTxHash || null,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
        idImageUrl: null,
        selfieImageUrl: null,
      };

      if (requestId) {
        await db.ref(`Verification_Requests/${newKey}`).update(updateData);
      } else {
        updateData.timestamp = admin.database.ServerValue.TIMESTAMP;
        await db.ref(`Verification_Requests/${newKey}`).set(updateData);
      }

      if (examId) {
        await db.ref(`Enrollments/${userId}/${examId}`).update({
          verificationStatus: 'verified',
          verifiedAt: admin.database.ServerValue.TIMESTAMP
        });
      }

      // Update User profile
      await db.ref(`Users/${userId}`).update({
        isVerified: true,
        verificationStatus: 'Verified',
        verifiedAt: admin.database.ServerValue.TIMESTAMP,
        blockchainTxHash: blockchainTxHash || null,
      });

      await db.ref('Audit_Log').push({
        userId,
        event: 'Identity Verification Successful',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { requestId: newKey, txHash: blockchainTxHash || null }
      });

      return res.status(200).json({ 
        message: 'Verification synced', 
        requestId: newKey,
        blockchainTxHash 
      });

    } else if (status === 'review') {
      let newKey = requestId;

      if (requestId) {
        await db.ref(`Verification_Requests/${requestId}`).update({
          faceScore: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          status: 'Pending',
          updatedAt: admin.database.ServerValue.TIMESTAMP,
          // Clear any accidental image fields
          idImageUrl: null,
          selfieImageUrl: null,
        });
      } else {
        const newRef = db.ref('Verification_Requests').push();
        newKey = newRef.key;
        await newRef.set({
          userId,
          status: 'Pending',
          faceScore: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          timestamp: admin.database.ServerValue.TIMESTAMP,
          // ⚠ No image fields — PDPA compliance
        });
      }

      await db.ref('Audit_Log').push({
        userId,
        event: 'Manual Review Requested',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { requestId: newKey, reason: 'AI confidence below threshold' }
      });

      return res.status(200).json({ message: 'Sent to manual review', requestId: newKey });

    } else {
      // Failed
      await db.ref('Audit_Log').push({
        userId,
        event: 'Identity Verification Failed',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { reason: status }
      });
      return res.status(200).json({ message: 'Failed verification logged' });
    }

  } catch (error) {
    console.error('Error in submitVerificationResult:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  uploadVerificationImages,
  submitVerificationResult,
  purgeImageFields, // exported so verifierController can call it
};

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

const uploadVerificationImages = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    // 1. Structural Validation
    if (!req.files || !req.files.id_image || !req.files.id_image[0]) {
      return res.status(400).json({ error: 'id_image is required' });
    }
    if (!req.files.selfie_image || !req.files.selfie_image[0]) {
      return res.status(400).json({ error: 'selfie_image is required' });
    }

    // 2. Safely Convert Buffer to In-Memory Base64 Data URI strings
    const idFileObj = req.files.id_image[0];
    const selfieFileObj = req.files.selfie_image[0];

    const idImageBase64 = `data:${idFileObj.mimetype};base64,${idFileObj.buffer.toString('base64')}`;
    const selfieImageBase64 = `data:${selfieFileObj.mimetype};base64,${selfieFileObj.buffer.toString('base64')}`;

    // Create a Pending record WITHOUT storing any image data
    const db = admin.database();
    const newReqRef = db.ref('Verification_Requests').push();

    await newReqRef.set({
      userId,
      status: 'Pending',
      timestamp: admin.database.ServerValue.TIMESTAMP,
    });

    // Audit log
    await db.ref('Audit_Log').push({
      userId,
      event: 'Verification Upload Initiated',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { requestId: newReqRef.key }
    });

    // ── Call Flask AI service with both in-memory strings ────────────────
    let aiStatus = 'failed';
    let aiScore = 0;

    try {
      const aiResponse = await fetch('http://localhost:5001/match-faces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nic_image: idImageBase64,
          selfie_image: selfieImageBase64
        })
      });

      const aiResult = await aiResponse.json();
      console.log('Flask match-faces result:', aiResult); 

      if (aiResult.error) {
        console.error('Flask error:', aiResult.error);
        return res.status(503).json({
          error: `AI service error: ${aiResult.error}`,
          requestId: newReqRef.key
        });
      }

      aiScore = Math.round((aiResult.face_score || 0) * 100);

      // If the score is 55% or higher, let's approve it automatically
      if (aiResult.match === true || aiScore >= 55) {
        aiStatus = 'success';
      } else if (aiScore > 40) {
        aiStatus = 'review';
      } else {
        aiStatus = 'failed';
      }

      await newReqRef.update({
        status: (aiStatus === 'success' || aiStatus === 'review') ? 'Approved' : 'Failed', 
        score: aiScore,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      });

    } catch (aiError) {
      console.error('Flask AI service error:', aiError);
      return res.status(503).json({
        error: 'AI service unavailable. Make sure Flask is running on port 5001.',
        requestId: newReqRef.key
      });
    }

    return res.status(201).json({
      message: 'Verification images uploaded successfully',
      requestId: newReqRef.key,
      status: aiStatus,
      score: aiScore
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

const checkLiveness = async (req, res) => {
  try {
    const { frames } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'frames array is required' });
    }
    const aiResponse = await fetch('http://localhost:5001/check-liveness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames })
    });
    const result = await aiResponse.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(500).json({ status: 'fake', error: 'Liveness service unavailable' });
  }
};

module.exports = {
  uploadVerificationImages,
  submitVerificationResult,
  checkLiveness,
  purgeImageFields,
};

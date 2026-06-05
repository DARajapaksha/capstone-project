const admin = require('../config/firebase');
const blockchainService = require('../services/blockchainService');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── Helper: purge biometric images for a verification request ────────────────
const purgeImageFields = async (db, requestId) => {
  try {
    const reqRef = db.collection('Verification_Requests').doc(requestId);
    await reqRef.update({
      idImageUrl: admin.firestore.FieldValue.delete(),
      selfieImageUrl: admin.firestore.FieldValue.delete(),
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

    // Create a Pending record WITHOUT storing any image data (PDPA compliance)
    const db = admin.firestore();
    const newReqRef = db.collection('Verification_Requests').doc();

    await newReqRef.set({
      userId,
      status: 'Pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      // ⚠ NO idImageUrl / selfieImageUrl stored here — PDPA compliance
    });

    // Audit log
    await db.collection('Audit_log').add({
      userId,
      event: 'Verification Upload Initiated',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { requestId: newReqRef.id }
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
          requestId: newReqRef.id
        });
      }

      aiScore = Math.round((aiResult.face_score || 0) * 100);

      // Determine verification outcome based on confidence threshold
      if (aiResult.match === true || aiScore >= 55) {
        aiStatus = 'success';
      } else if (aiScore > 40) {
        aiStatus = 'review';
      } else {
        aiStatus = 'failed';
      }

      // Update the request with computed results
      await newReqRef.update({
        status: (aiStatus === 'success' || aiStatus === 'review') ? 'Approved' : 'Failed', 
        score: aiScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (aiError) {
      console.error('Flask AI service error:', aiError);
      return res.status(503).json({
        error: 'AI service unavailable. Make sure Flask is running on port 5001.',
        requestId: newReqRef.id
      });
    }

    return res.status(201).json({
      message: 'Verification images uploaded successfully',
      requestId: newReqRef.id,
      status: aiStatus,
      score: aiScore
    });
    
  } catch (error) {
    console.error('Error in uploadVerificationImages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/verification/result
const submitVerificationResult = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { status, score, examId, examCode, requestId } = req.body;
    const db = admin.firestore();

    if (status === 'success') {
      let docId = requestId;
      let blockchainTxHash = null;

      if (!docId) {
        docId = db.collection('Verification_Requests').doc().id;
      }

      // Generate secure blockchain anchor
      try {
        const hashPayload = {
          requestId: docId,
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        idImageUrl: admin.firestore.FieldValue.delete(),
        selfieImageUrl: admin.firestore.FieldValue.delete(),
      };

      if (requestId) {
        await db.collection('Verification_Requests').doc(docId).update(updateData);
      } else {
        updateData.timestamp = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('Verification_Requests').doc(docId).set(updateData);
      }

      if (examId) {
        await db.collection('Enrollments').doc(userId).collection('exams').doc(examId).update({
          verificationStatus: 'verified',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('Student_Exams').doc(userId).collection('exams').doc(examId).update({
          verificationStatus: 'verified',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          txHash: blockchainTxHash || null
        });
      }

      // Update User profile
      await db.collection('Users').doc(userId).update({
        isVerified: true,
        verificationStatus: 'Verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        blockchainTxHash: blockchainTxHash || null,
      });

      await db.collection('Audit_log').add({
        userId,
        event: 'Identity Verification Successful',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { requestId: docId, txHash: blockchainTxHash || null }
      });

      return res.status(200).json({
        message: 'Verification synced',
        requestId: docId,
        blockchainTxHash
      });

    } else if (status === 'review') {
      const { idImage, selfieImage } = req.body;
      let docId = requestId;
      
      let uploadedIdUrl = null;
      let uploadedSelfieUrl = null;
      let idImagePublicId = null;
      let selfieImagePublicId = null;

      try {
        if (idImage) {
          const resId = await cloudinary.uploader.upload(idImage, { folder: 'verification_temp' });
          uploadedIdUrl = resId.secure_url;
          idImagePublicId = resId.public_id;
        }
        if (selfieImage) {
          const resSelfie = await cloudinary.uploader.upload(selfieImage, { folder: 'verification_temp' });
          uploadedSelfieUrl = resSelfie.secure_url;
          selfieImagePublicId = resSelfie.public_id;
        }
      } catch (err) {
        console.error('Cloudinary upload error:', err);
      }

      if (requestId) {
        await db.collection('Verification_Requests').doc(requestId).update({
          faceScore: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          status: 'Pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          idImageUrl: uploadedIdUrl || admin.firestore.FieldValue.delete(),
          selfieImageUrl: uploadedSelfieUrl || admin.firestore.FieldValue.delete(),
          idImagePublicId: idImagePublicId || admin.firestore.FieldValue.delete(),
          selfieImagePublicId: selfieImagePublicId || admin.firestore.FieldValue.delete(),
        });
      } else {
        const newRef = db.collection('Verification_Requests').doc();
        docId = newRef.id;
        await newRef.set({
          userId,
          status: 'Pending',
          faceScore: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          idImageUrl: uploadedIdUrl || null,
          selfieImageUrl: uploadedSelfieUrl || null,
          idImagePublicId: idImagePublicId || null,
          selfieImagePublicId: selfieImagePublicId || null,
        });
      }

      await db.collection('Audit_log').add({
        userId,
        event: 'Manual Review Requested',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { requestId: docId, reason: 'AI confidence below threshold' }
      });

      return res.status(200).json({ message: 'Sent to manual review', requestId: docId });

    } else {
      // Failed
      if (requestId) {
        await db.collection('Verification_Requests').doc(requestId).update({
          status: 'Failed',
          faceScore: score,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          idImageUrl: admin.firestore.FieldValue.delete(),
          selfieImageUrl: admin.firestore.FieldValue.delete(),
        });
      }

      if (examId) {
        await db.collection('Enrollments').doc(userId).collection('exams').doc(examId).update({
          verificationStatus: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('Student_Exams').doc(userId).collection('exams').doc(examId).update({
          verificationStatus: 'rejected',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await db.collection('Audit_log').add({
        userId,
        event: 'Identity Verification Failed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
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
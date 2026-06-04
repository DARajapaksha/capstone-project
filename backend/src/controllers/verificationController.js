const admin = require('../config/firebase');

const uploadVerificationImages = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    
    if (!req.files || !req.files.id_image) {
      return res.status(400).json({ error: 'id_image is required' });
    }

    const idImage = req.files.id_image[0];
    const selfieImage = req.files.selfie_image ? req.files.selfie_image[0] : null;

    // Convert image buffers to Base64 data URIs — no Storage bucket needed
    const toDataUri = (file) => {
      const b64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${b64}`;
    };

    const idImageUrl = toDataUri(idImage);
    const selfieImageUrl = selfieImage
      ? toDataUri(selfieImage)
      : null;

    // Create a new record in Verification_Requests
    const db = admin.database();
    const verReqRef = db.ref('Verification_Requests');
    const newReqRef = verReqRef.push();
    
    const requestData = {
      userId: userId,
      idImageUrl,
      selfieImageUrl,
      status: 'Pending',
      timestamp: admin.database.ServerValue.TIMESTAMP
    };
    
    await newReqRef.set(requestData);

    // Add entry to Audit_Log
    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: userId,
      event: 'Images Uploaded',
      timestamp: admin.database.ServerValue.TIMESTAMP,
      details: { requestId: newReqRef.key }
    });

    // ── Call Flask AI service with both images ──────────────────────────
    // Call Flask /match-faces (liveness already done separately in Step 3)
    let aiStatus = 'failed';
    let aiScore = 0;

    try {
      const aiResponse = await fetch('http://localhost:5001/match-faces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nic_image: idImageUrl,
          selfie_image: selfieImageUrl
        })
      });

      const aiResult = await aiResponse.json();
      console.log('Flask match-faces result:', aiResult); // helpful for debugging

      // aiResult = { match: true/false, face_score: 0.87, distance: 0.13, threshold: 0.6 }

      if (aiResult.error) {
        // Flask returned an error (no face detected etc.)
        console.error('Flask error:', aiResult.error);
        return res.status(503).json({
          error: `AI service error: ${aiResult.error}`,
          requestId: newReqRef.key
        });
      }

      aiScore = Math.round((aiResult.face_score || 0) * 100);

      if (aiResult.match === true) {
        aiStatus = 'success';
      } else if ((aiResult.face_score || 0) > 0.4) {
        aiStatus = 'review';   // partial match → manual review
      } else {
        aiStatus = 'failed';
      }

      await newReqRef.update({
        status: aiStatus === 'success' ? 'Approved' : 'Pending',
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
      message: 'Verification complete',
      requestId: newReqRef.key,
      status: aiStatus,
      score: aiScore
    });
    
  } catch (error) {
    console.error('Error in uploadVerificationImages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const submitVerificationResult = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    const { status, score, examId, examCode, hash, requestId } = req.body;
    const db = admin.database();

    if (status === 'success') {
      let reqRef;
      let newKey = requestId;
      if (requestId) {
        reqRef = db.ref(`Verification_Requests/${requestId}`);
        await reqRef.update({
          status: 'Approved',
          score: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          blockchainTx: hash,
          event: 'Verification Issued',
          updatedAt: admin.database.ServerValue.TIMESTAMP
        });
      } else {
        const verReqRef = db.ref('Verification_Requests');
        reqRef = verReqRef.push();
        newKey = reqRef.key;
        
        await reqRef.set({
          studentId: userId,
          status: 'Approved',
          timestamp: admin.database.ServerValue.TIMESTAMP,
          score: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          blockchainTx: hash,
          event: 'Verification Issued',
          ip: req.ip || '192.168.1.1',
          type: 'Verification'
        });
      }
      
      if (examId) {
        await db.ref(`Enrollments/${userId}/${examId}`).update({
          verificationStatus: 'verified',
          verifiedAt: admin.database.ServerValue.TIMESTAMP
        });
      }
      
      await db.ref('Audit_Log').push({
        userId: userId,
        event: 'Identity Verification Successful',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { requestId: newKey, txHash: hash }
      });

      return res.status(200).json({ message: 'Verification synced successfully', requestId: newKey });
    } else if (status === 'review') {
      let newKey = requestId;
      if (requestId) {
        const reqRef = db.ref(`Verification_Requests/${requestId}`);
        await reqRef.update({
          score: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          event: 'Manual Review Requested',
          updatedAt: admin.database.ServerValue.TIMESTAMP
        });
      } else {
        const verReqRef = db.ref('Verification_Requests');
        const reqRef = verReqRef.push();
        newKey = reqRef.key;
        
        await reqRef.set({
          studentId: userId,
          status: 'Pending',
          timestamp: admin.database.ServerValue.TIMESTAMP,
          score: score,
          examId: examId || null,
          examCode: examCode || 'Unknown',
          event: 'Manual Review Requested',
          ip: req.ip || '192.168.1.1',
          type: 'Verification',
          idImageUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80',
          selfieImageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
        });
      }
      
      await db.ref('Audit_Log').push({
        userId: userId,
        event: 'Manual Review Requested',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { requestId: newKey, reason: 'AI Confidence too low' }
      });

      return res.status(200).json({ message: 'Sent to manual review', requestId: newKey });
    } else {
      await db.ref('Audit_Log').push({
        userId: userId,
        event: 'Identity Verification Failed',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        details: { reason: status }
      });
      return res.status(200).json({ message: 'Failed verification logged' });
    }
  } catch (error) {
    console.error('Error submitting verification result:', error);
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
  checkLiveness
};

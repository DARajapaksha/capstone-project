const admin = require('../config/firebase');

const uploadVerificationImages = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;
    
    if (!req.files || !req.files.id_image || !req.files.selfie_image) {
      return res.status(400).json({ error: 'Both id_image and selfie_image are required' });
    }

    const idImage = req.files.id_image[0];
    const selfieImage = req.files.selfie_image[0];

    const bucket = admin.storage().bucket();
    
    // Helper function to upload a file to Firebase Storage
    const uploadToFirebase = async (file, fileType) => {
      const ext = file.originalname.split('.').pop() || 'jpg';
      const fileName = `${fileType}_${Date.now()}.${ext}`;
      const fileRef = bucket.file(`verification/${userId}/${fileName}`);
      
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });
      
      // Generate a signed URL for secure access
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '01-01-2100' // Far in the future
      });
      
      return url;
    };

    // Upload both images
    const idImageUrl = await uploadToFirebase(idImage, 'id_image');
    const selfieImageUrl = await uploadToFirebase(selfieImage, 'selfie_image');

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

    return res.status(201).json({
      message: 'Verification images uploaded successfully',
      requestId: newReqRef.key,
      status: 'Pending',
      idImageUrl,
      selfieImageUrl
    });

  } catch (error) {
    console.error('Error in uploadVerificationImages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  uploadVerificationImages
};

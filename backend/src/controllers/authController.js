const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const crypto = require('crypto');

const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword, name, studentId, nic } = req.body;
    console.log('Incoming verify & register data:', { email, otp, name, studentId, nic });

    if (!email || !otp || !password || !confirmPassword || !name || !studentId || !nic) {
      return res.status(400).json({ error: 'All fields (Email, OTP, Password, Name, Student ID, and NIC) are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = admin.firestore();
    const emailKey = cleanEmail.replace(/\./g, '_');

    // Check OTP in Firestore
    const otpRef = db.collection('Temporary_OTPs').doc(emailKey);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return res.status(400).json({ error: 'No verification code requested or it has expired' });
    }

    const { otp: storedOtp, expiresAt } = otpSnap.data();

    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > expiresAt) {
      await otpRef.delete();
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Clear the OTP
    await otpRef.delete();

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: cleanEmail,
      password,
      emailVerified: true
    });

    // Hash password for Firestore
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Firestore under the "Users" collection
    await db.collection('Users').doc(userRecord.uid).set({
      email: userRecord.email,
      password: hashedPassword,
      name: name,
      studentId: studentId,
      nic: nic,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: name,
        studentId: studentId,
        nic: nic
      }
    });
  } catch (error) {
    console.error('Error in verifyOTPAndRegister:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Incoming login data:', { email, password });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Query Firestore Users collection
    const db = admin.firestore();
    const usersQuery = await db.collection('Users').where('email', '==', email).limit(1).get();

    if (usersQuery.empty) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (!userData || !userData.password) {
      return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { uid: userId, email: userData.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    // Record login event in Audit_Log
    await db.collection('Audit_log').add({
      userId: userId,
      event: 'login',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      email: email
    });

    return res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { idToken, isRegister } = req.body;

    // Verify the incoming token signature against Google's security keys
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    const db = admin.firestore();

    // Check if the user's email already exists in the Users collection
    const usersQuery = await db.collection('Users').where('email', '==', email).limit(1).get();

    let finalUid = uid;

    if (usersQuery.empty) {
      // If the email is not registered in the database
      if (!isRegister) {
        try {
          await admin.auth().deleteUser(uid);
          console.log(`Successfully deleted unregistered Google user ${email} (${uid}) from Firebase Auth.`);
        } catch (deleteError) {
          console.error("Failed to delete Firebase Auth user on unregistered Google login:", deleteError);
        }
        return res.status(404).json({ error: 'Account not found. Please register first.' });
      }

      // If they are registering, initialize their Firestore document
      await db.collection('Users').doc(uid).set({
        email: email,
        name: name || "New Student",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isVerified: false
      });
    } else {
      // If the user already exists in the database
      if (isRegister) {
        return res.status(400).json({ error: 'Account already registered' });
      }

      finalUid = usersQuery.docs[0].id;
    }

    // Generate your application's JWT session token
    const token = jwt.sign(
      { uid: finalUid, email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({ message: 'Google authentication successful', token });
  } catch (error) {
    console.error('Error in googleLogin:', error);
    res.status(401).json({ error: 'Invalid or expired Google token' });
  }
};

const sendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Only official Gmail addresses are allowed' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in Firestore
    const db = admin.firestore();
    const userQuery = await db.collection('Users').where('email', '==', cleanEmail).limit(1).get();

    if (!userQuery.empty) {
      return res.status(400).json({ error: 'Account already registered' });
    }

    // Check if user already exists in Firebase Authentication
    try {
      await admin.auth().getUserByEmail(cleanEmail);
      return res.status(400).json({ error: 'Account already registered' });
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    // 1. Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Code expires in 5 minutes

    // 2. Save temporarily to Firestore
    const emailKey = cleanEmail.replace(/\./g, '_');
    await db.collection('Temporary_OTPs').doc(emailKey).set({ otp, expiresAt });

    // 3. Send OTP via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      await resend.emails.send({
        from: `Identity Verification System <${fromEmail}>`,
        to: [cleanEmail],
        subject: 'Your Identity Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1d4ed8; margin-bottom: 8px;">🎓 Identity Verification System</h2>
            <p style="color: #374151;">Your One-Time Password (OTP) for account registration is:</p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">If you did not request this code, please ignore this email.</p>
          </div>
        `
      });
      console.log(`[Resend] OTP email sent to ${cleanEmail}`);
    } else {
      console.log(`[DEVELOPMENT MODE] OTP for ${cleanEmail} is: ${otp}`);
    }

    res.status(200).json({ message: 'OTP sent successfully to your Gmail address' });
  } catch (error) {
    console.error('🔴 SMTP ERROR:', error);
    console.error('Error in sendRegistrationOTP:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

module.exports = {
  sendRegistrationOTP,
  verifyOTPAndRegister,
  login,
  googleLogin,
};

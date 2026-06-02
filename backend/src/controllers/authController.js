const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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
    const db = admin.database();
    const emailKey = cleanEmail.replace(/\./g, '_');
    const otpRef = db.ref(`Temporary_OTPs/${emailKey}`);
    const snapshot = await otpRef.once('value');

    if (!snapshot.exists()) {
      return res.status(400).json({ error: 'No verification code requested or it has expired' });
    }

    const { otp: storedOtp, expiresAt } = snapshot.val();

    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > expiresAt) {
      await otpRef.remove();
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Clear the OTP
    await otpRef.remove();

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: cleanEmail,
      password,
      emailVerified: true // Mark verified since they successfully completed the email OTP check!
    });

    // Hash password for Realtime Database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Realtime Database under the "Users" node
    await db.ref(`Users/${userRecord.uid}`).set({
      email: userRecord.email,
      password: hashedPassword,
      name: name,
      studentId: studentId,
      nic: nic,
      createdAt: admin.database.ServerValue.TIMESTAMP
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

    // Query Firebase Realtime Database Users collection
    const db = admin.database();
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    let userData = null;
    let userId = null;

    snapshot.forEach((childSnapshot) => {
      userData = childSnapshot.val();
      userId = childSnapshot.key;
    });

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
    const auditLogRef = db.ref('Audit_Log');
    await auditLogRef.push({
      userId: userId,
      event: 'login',
      timestamp: admin.database.ServerValue.TIMESTAMP,
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

    const db = admin.database();
    
    // Check if the user's email already exists in the Users database node
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

    let finalUid = uid;

    if (!snapshot.exists()) {
      // If the email is not registered in the database
      if (!isRegister) {
        // Since Firebase Auth client SDK automatically created a Firebase Auth user entry
        // during signInWithPopup, we should delete it if they don't have a database account!
        try {
          await admin.auth().deleteUser(uid);
          console.log(`Successfully deleted unregistered Google user ${email} (${uid}) from Firebase Auth.`);
        } catch (deleteError) {
          console.error("Failed to delete Firebase Auth user on unregistered Google login:", deleteError);
        }
        return res.status(404).json({ error: 'Account not found. Please register first.' });
      }

      // If they are registering, initialize their database entry
      const userRef = db.ref(`Users/${uid}`);
      await userRef.set({
        email: email,
        name: name || "New Student",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        isVerified: false // Default state before your Face Match system runs
      });
    } else {
      // If the user already exists in the database
      if (isRegister) {
        return res.status(400).json({ error: 'Account already registered' });
      }

      // Get the existing UID from the snapshot to ensure we use the correct node path
      let existingUid = null;
      snapshot.forEach((childSnapshot) => {
        existingUid = childSnapshot.key;
      });
      finalUid = existingUid;
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

    // Check if user already exists in Firebase Realtime Database
    const db = admin.database();
    const userSnapshot = await db.ref('Users').orderByChild('email').equalTo(cleanEmail).once('value');

    if (userSnapshot.exists()) {
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

    // 2. Save temporarily to Firebase Realtime Database
    // Clean the email string to use as a Firebase key (replace dots)
    const emailKey = cleanEmail.replace(/\./g, '_');
    await db.ref(`Temporary_OTPs/${emailKey}`).set({ otp, expiresAt });

    // 3. Configure Gmail Transporter (Use your App Password here)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail address
          pass: process.env.EMAIL_PASS  // Your Google App Password
        }
      });

      // 4. Send the Email
      await transporter.sendMail({
        from: `"Identity Verification System" <${process.env.EMAIL_USER}>`,
        to: cleanEmail,
        subject: 'Your Identity System Verification Code',
        text: `Your One-Time Password (OTP) for account registration is: ${otp}. It is valid for 5 minutes.`
      });
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



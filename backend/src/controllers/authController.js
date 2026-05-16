const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    console.log('Incoming register data:', { email, password, confirmPassword });

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Email, password, and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Hash password for Realtime Database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Realtime Database under the "Users" node
    const db = admin.database();
    await db.ref(`Users/${userRecord.uid}`).set({
      email: userRecord.email,
      password: hashedPassword,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
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
      return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
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
      { expiresIn: '1h' }
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

module.exports = {
  register,
  login,
};

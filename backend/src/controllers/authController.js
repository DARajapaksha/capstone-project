const admin = require('../config/firebase');

const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

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

module.exports = {
  register,
};

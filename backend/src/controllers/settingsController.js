const admin = require('../config/firebase');

const defaultSettings = {
  notifications: {
    emailAlerts: true,
    lowGasAlerts: true,
    queueAlerts: true
  },
  security: {
    twoFactor: true,
    sessionTimeout: true,
    ipWhitelist: false
  },
  blockchain: {
    rpcUrl: 'https://polygon-rpc.com',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f6bEb1',
    gasLimit: 200000,
    lowBalanceThreshold: 15
  },
  credentials: {
    privateKey: '******************************',
    aiApiKey: '******************************',
    smtpConfig: 'smtp.university.lk:587'
  }
};

const getSettings = async (req, res) => {
  try {
    const db = admin.database();
    const settingsRef = db.ref('SystemSettings');
    const snapshot = await settingsRef.once('value');

    if (!snapshot.exists()) {
      // Create defaults if they don't exist
      await settingsRef.set(defaultSettings);
      return res.status(200).json(defaultSettings);
    }

    return res.status(200).json(snapshot.val());
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { notifications, security, blockchain, credentials } = req.body;

    const db = admin.database();
    const settingsRef = db.ref('SystemSettings');

    // Only update provided sections
    const updates = {};
    if (notifications) updates.notifications = notifications;
    if (security) updates.security = security;
    if (blockchain) updates.blockchain = blockchain;
    if (credentials) updates.credentials = credentials;

    await settingsRef.update(updates);

    const snapshot = await settingsRef.once('value');
    return res.status(200).json({ message: 'Settings updated successfully', settings: snapshot.val() });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};

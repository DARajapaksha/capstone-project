require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Allowed origins — trims trailing slashes so http://localhost:3000/ == http://localhost:3000
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    const normalised = origin.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(normalised)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" is not allowed.`));
    }
  },
  credentials: true
})); // Allows your frontend to talk to your backend.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main router
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`AI Identity Verification Backend running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT or stop the process using it.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

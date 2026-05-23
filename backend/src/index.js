require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
})); // This allows your frontend to talk to your backend.
app.use(express.json());

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

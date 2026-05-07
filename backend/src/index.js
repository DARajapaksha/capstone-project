require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());

// Main router
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Identity Verification Backend running on port ${PORT}`);
});

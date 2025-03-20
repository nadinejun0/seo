const express = require('express');
const app = express();
const port = 3001;

// Enable JSON parsing
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Simple test endpoint
app.post('/api/test', (req, res) => {
  console.log('Request body:', req.body);
  res.json({ message: 'Test endpoint successful!', received: req.body });
});

// Start the server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('To test the server, run:');
  console.log('curl -X POST -H "Content-Type: application/json" -d \'{"test":"data"}\' http://localhost:3001/api/test');
});
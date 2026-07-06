const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware that handles all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Debug: log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
  });
  next();
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

// Make supabase available to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});

// Supabase connection test
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('id, question_text')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Supabase query failed',
        error: error.message
      });
    }

    res.json({
      status: 'success',
      message: 'Supabase connection working',
      data: data
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Supabase connection error',
      error: err.message
    });
  }
});

// Import routes
const typingRoutes = require('./routes/typing');
const triviaRoutes = require('./routes/trivia');
const cosmetics = require('./routes/cosmetics');

// Register routes
app.use('/api/typing', typingRoutes);
app.use('/api/trivia', triviaRoutes);
app.use('/api/cosmetics', cosmetics);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ HASKii Games Backend running on http://localhost:${PORT}`);
  console.log(`🔓 CORS enabled for all origins`);
  console.log(`📊 Supabase connected: ${process.env.SUPABASE_URL}`);
  console.log(`🎮 Ready for: Typing Master + QuickFire Trivia`);
});

module.exports = app;

// server.js – Task-On Express entry point
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { renderApiDocumentation } = require('./docsView');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-on';
let isDbConnecting = false;

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) return;
  if (isDbConnecting) return;
  isDbConnecting = true;
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected to Task-On');
  } catch (err) {
    console.warn('⚠️ MongoDB connection notice:', err.message);
  } finally {
    isDbConnecting = false;
  }
}

// Initial connection attempt
ensureDbConnected();

// Middleware to ensure DB is connected on serverless invocations
app.use(async (req, res, next) => {
  await ensureDbConnected();
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// API Health Check & Documentation
app.get('/api', (req, res) => {
  const wantsJson = req.query.format === 'json' || 
                    (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'));

  if (wantsJson) {
    return res.json({
      app: 'Task-On API',
      status: 'online',
      version: '1.0.0',
      platform: 'Vercel Serverless Functions',
      database: 'MongoDB Atlas Cloud Cluster',
      frontendUrl: 'https://task-on-71a95.web.app',
      endpoints: {
        auth: ['POST /api/auth/register', 'POST /api/auth/login'],
        tasks: ['GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id', 'DELETE /api/tasks/:id']
      }
    });
  }

  // Render frontend-matching UI documentation in browser
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderApiDocumentation({ isApiEndpoint: true }));
});

// Root Landing & API UI
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderApiDocumentation({ isApiEndpoint: false }));
});

// Export for Vercel Serverless
module.exports = app;

// Only listen locally if not running in Serverless / Vercel / Cloud Functions environment
if (!process.env.VERCEL && !process.env.K_SERVICE && !process.env.FUNCTION_NAME) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Task-On Server listening on http://localhost:${PORT}`);
  });
}

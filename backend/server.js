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

// API Health Check
app.get('/api', (req, res) => {
  res.json({
    app: 'Task-On API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      tasks: ['GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id', 'DELETE /api/tasks/:id']
    }
  });
});

// Serve frontend build if available, otherwise serve a clean Task-On landing page
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Task-On Local Server</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 9999px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
            border: 1px solid rgba(52, 211, 153, 0.3);
          }
          .badge-dot {
            width: 8px;
            height: 8px;
            background: #34d399;
            border-radius: 50%;
            box-shadow: 0 0 10px #34d399;
          }
          h1 {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #94a3b8;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 28px;
          }
          .actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 28px;
          }
          .btn {
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">
            <span class="badge-dot"></span>
            Task-On Backend Active
          </div>
          <h1>Task-On Local Server</h1>
          <p>Your full-stack Task-On backend server is running smoothly on port 5000. Access the API or launch the Vite frontend UI.</p>
          
          <div class="actions">
            <a href="http://localhost:5173" class="btn btn-primary" target="_blank">🚀 Open Frontend UI (:5173)</a>
            <a href="/api" class="btn btn-secondary">⚡ Check API JSON</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

// Export for Vercel Serverless
module.exports = app;

// Only listen locally if not running in Serverless / Vercel / Cloud Functions environment
if (!process.env.VERCEL && !process.env.K_SERVICE && !process.env.FUNCTION_NAME) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Task-On Server listening on http://localhost:${PORT}`);
  });
}

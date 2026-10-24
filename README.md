# Task-On — MERN Stack Task Management System

**Task-On** is a full-stack task and productivity management application designed with a warm, minimalist aesthetic. Built with the MERN stack (MongoDB, Express, React, Node.js), featuring secure authentication, real-time status counters, priority categorization, and responsive design.

---

## 🌐 Live Deployments

- **Frontend (Firebase Hosting):** [https://task-on-app.web.app](https://task-on-app.web.app) *(also accessible via [https://task-on-71a95.web.app](https://task-on-71a95.web.app))*
- **Backend API (Vercel):** [https://backend-taupe-mu-58.vercel.app](https://backend-taupe-mu-58.vercel.app)
- **Database:** MongoDB Atlas Cloud Cluster

---

## ✨ Features

- **Authentication & Security:** Register & Sign in with JWT authentication and bcrypt password encryption.
- **Productivity Dashboard:** Key statistics overview (Total Tasks, Active, Completed, Completion Rate).
- **Task Management:**
  - Create tasks with custom priority levels (Low, Medium, High).
  - Quick inline toggle between Pending and Done.
  - Filter tasks by status (All, Active, Completed).
  - Delete and organize tasks with instant UI updates.
- **Warm Editorial Aesthetic:**
  - Cream and forest green palette (`#F7F5F0`, `#285642`, `#18352A`).
  - Serif headers (`Lora`), clean sans-serif body typography (`Inter`).
  - Custom favicon and logo emblem in deep forest green.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Custom CSS Design System
- **Hosting:** Firebase Hosting

### Backend
- **Runtime:** Node.js 24 + Express
- **Database ORM:** Mongoose with MongoDB Atlas
- **Auth:** JSON Web Tokens (JWT) & bcryptjs
- **Hosting:** Vercel Serverless Functions

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/251sc006kasc/Task-On.git
cd Task-On
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5000
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

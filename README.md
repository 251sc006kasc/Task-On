# Task-On — Smart MERN Productivity & Task Management System

**Task-On** is a full-stack MERN (MongoDB, Express, React, Node.js) task and productivity management web application designed with an editorial, minimalist aesthetic. Built with secure user authentication, cloud database persistence on MongoDB Atlas, real-time statistics calculation, priority tagging, and serverless cloud deployment.

---

## 🌐 Live Deployment Links

- **Production Frontend (Firebase Hosting):** [https://task-on-app.web.app](https://task-on-app.web.app)
  *(Mirror domain: [https://task-on-71a95.web.app](https://task-on-71a95.web.app))*
- **Production Backend API (Vercel):** [https://backend-taupe-mu-58.vercel.app](https://backend-taupe-mu-58.vercel.app)
- **Interactive API Documentation & Live JSON:** [https://backend-taupe-mu-58.vercel.app/#json](https://backend-taupe-mu-58.vercel.app/#json)
- **GitHub Repository:** [https://github.com/251sc006kasc/Task-On](https://github.com/251sc006kasc/Task-On)

---

## ✨ Features Implemented

1. **User Authentication & Authorization:**
   - User registration and login powered by JSON Web Tokens (JWT) and `bcryptjs` password encryption (10 salt rounds).
   - Centered authentication card with togglable Sign In / Register tabs.
   - Persistent session storage in `localStorage` with automatic token attachment via Axios request interceptors.
   - Secure Logout action that clears tokens and returns to the authentication gate.

2. **Personal Productivity Dashboard:**
   - Dynamic real-time statistics cards: **Active Tasks**, **Completed Tasks**, and **Completion Rate (%)** with animated progress indicator.
   - User identity profile badge displaying avatar initials.

3. **Task Management (Full CRUD):**
   - **Create:** Single-row quick-add bar allowing immediate task entry with Priority tags (`High`, `Medium`, `Low`) and optional due date selection.
   - **Read:** Live query of user tasks filtered strictly by authenticated User ID.
   - **Update:** Instant checkbox toggle between `Pending` and `Completed` with optimistic UI animations; full edit modal for updating title, priority, or due dates.
   - **Delete:** Hover trash icon button to permanently delete tasks with instant counter updates.
   - **Filter & Search:** Filter tabs (`All`, `Active`, `Completed`) with real-time numeric badges and search filtering.

4. **Warm Editorial UI Design:**
   - Bespoke color system: Warm cream background (`#F7F5F0`), crisp white cards (`#FFFEFC`), deep forest green accents (`#285642`), and dark forest typography (`#18352A`).
   - Clean serif headers (`Lora`) paired with modern sans-serif body typography (`Inter`).
   - Custom forest green `[T]` emblem logo and favicon.

5. **Cloud Infrastructure:**
   - Serverless Node.js 24 execution on **Vercel**.
   - Cloud database clustering with TLS/SSL encryption on **MongoDB Atlas**.
   - Global CDN asset delivery with automatic HTTPS on **Firebase Hosting**.

---

## 🛠️ Technologies Used

### Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios with Request Interceptors
- **Hosting:** Firebase Hosting (Multi-site CDN)

### Backend
- **Runtime:** Node.js 24
- **Framework:** Express.js
- **Database & ODM:** MongoDB Atlas with Mongoose
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Hosting:** Vercel Serverless Functions

---

## ⚙️ Required Environment Variables

Below are the environment variable names required to run the project. **Secret values must never be committed to public version control.**

### Backend (`backend/.env`)
| Variable Name | Description | Example / Format |
| :--- | :--- | :--- |
| `PORT` | Local server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<username>:<password>@cluster.mongodb.net/task-on?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `<random_secure_hex_string>` |

### Frontend (`frontend/.env.production` / `frontend/.env`)
| Variable Name | Description | Example / Format |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Base URL of the deployed or local backend API | `https://backend-taupe-mu-58.vercel.app` (or `http://localhost:5000`) |

---

## 🚀 Local Installation and Setup Steps

### 1. Clone the Repository
```bash
git clone https://github.com/251sc006kasc/Task-On.git
cd Task-On
```

### 2. Configure Backend
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` with:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```
Start the backend development server:
```bash
npm start
# Server listens at http://localhost:5000
```

### 3. Configure Frontend
Open a second terminal window:
```bash
cd frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
# App will open at http://localhost:5173
```

---

## 📡 REST API Endpoint Overview

All endpoints are hosted at `https://backend-taupe-mu-58.vercel.app` and mapped to MongoDB Atlas:

| Method | Endpoint | Auth Required | Description & Frontend UI Usage |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/auth/register` | No | Creates a new user account with hashed password and returns a JWT token. Used on the Auth Card **Register** tab. |
| **`POST`** | `/api/auth/login` | No | Validates user credentials and issues JWT token. Used on the Auth Card **Sign In** tab. |
| **`GET`** | `/api/tasks` | Yes (`Bearer`) | Retrieves all tasks belonging to the authenticated user. Used when loading the dashboard and calculating statistics. |
| **`POST`** | `/api/tasks` | Yes (`Bearer`) | Creates a new task with title, priority (`Low`/`Medium`/`High`), and optional due date. Used by the single-row quick-add bar. |
| **`PUT`** | `/api/tasks/:id` | Yes (`Bearer`) | Updates task fields or toggles completion status (`Pending` ↔ `Completed`). Used by the row checkbox and Edit modal. |
| **`DELETE`** | `/api/tasks/:id` | Yes (`Bearer`) | Permanently deletes a task. Used by the hover trash icon button on task rows. |
| **`GET`** | `/api` | No | Health check and API documentation. Returns live JSON when queried with `?format=json`. |

---

## 📸 Project Screenshots (JPEG)

All screenshots are stored in this submission directory in JPEG format:

### 1. Registration Page
![Registration Page](01_registration_page.jpeg)

### 2. Login Page
![Login Page](02_login_page.jpeg)

### 3. Dashboard Overview
![Dashboard Overview](03_dashboard.jpeg)

### 4. Task Creation Form
![Task Creation Form](04_task_creation_form.jpeg)

### 5. Task List with Priority Badges & Status
![Task List](05_task_list.jpeg)

### 6. Analytics Overview
![Analytics Overview](06_analytics_overview.jpeg)

---

## 🎥 Project Demonstration Video (MP4)

A 2-minute walkthrough showing account registration, login, task creation, status toggles, editing, deletion, and cloud deployment is included:

- **Filename:** `task_on_walkthrough.mp4` (Full HD 1080p, H.264/AAC MP4 format)
- **File Location:** `submission guidelines/task_on_walkthrough.mp4`

---

## 📄 License
This project is open-source under the [MIT License](../LICENSE).

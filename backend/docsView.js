// docsView.js – Generates the frontend-matching UI for Task-On Backend API
function renderApiDocumentation({ isApiEndpoint = false, rawJson = null } = {}) {
  const apiData = rawJson || {
    app: "Task-On API",
    status: "online",
    version: "1.0.0",
    platform: "Vercel Serverless Functions",
    database: "MongoDB Atlas Cloud Cluster",
    frontendUrl: "https://task-on-app.web.app",
    endpoints: {
      auth: [
        {
          method: "POST",
          path: "/api/auth/register",
          title: "User Registration",
          uiUsage: "Invoked when a user fills out the 'Register' tab in the centered authentication card with Full Name, Email, and Password. Creates a user document with a bcrypt-hashed password and issues a signed JWT token.",
          authRequired: false,
          requestBody: { name: "Vishal", email: "user@example.com", password: "securePassword123" },
          response: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: { id: "6719b4...", name: "Vishal", email: "user@example.com" } }
        },
        {
          method: "POST",
          path: "/api/auth/login",
          title: "User Authentication (Sign In)",
          uiUsage: "Invoked when a returning user enters their Email and Password on the auth card. Returns a JWT token saved to browser localStorage for authenticated requests.",
          authRequired: false,
          requestBody: { email: "user@example.com", password: "securePassword123" },
          response: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: { id: "6719b4...", name: "Vishal", email: "user@example.com" } }
        }
      ],
      tasks: [
        {
          method: "GET",
          path: "/api/tasks",
          title: "Fetch User Tasks & Calculate Stats",
          uiUsage: "Executed when the dashboard mounts to fetch all tasks belonging to the authenticated user. Feeds data to the 3 statistics cards (Total, Active, Completed, Rate) and populates the task list.",
          authRequired: true,
          requestBody: null,
          response: [
            { _id: "6719b9a1e0b...", title: "Deploy MERN Stack to Firebase and MongoDB Atlas", priority: "High", status: "Completed", dueDate: "2026-10-25" }
          ]
        },
        {
          method: "POST",
          path: "/api/tasks",
          title: "Create Task from Quick-Add Bar",
          uiUsage: "Triggered by the single-row quick-add bar at the top of the dashboard. Allows the user to specify task title, priority tag (Low, Medium, High), and due date with immediate UI addition.",
          authRequired: true,
          requestBody: { title: "Prepare database backup", priority: "Medium", dueDate: "2026-10-31" },
          response: { _id: "6719b9e2c4d...", title: "Prepare database backup", priority: "Medium", status: "Pending", user: "6719b4..." }
        },
        {
          method: "PUT",
          path: "/api/tasks/:id",
          title: "Toggle Status or Update Task Details",
          uiUsage: "Triggered whenever a user clicks the circular checkbox on a task row to toggle between Pending and Completed, or submits the Edit Task modal.",
          authRequired: true,
          requestBody: { status: "Completed" },
          response: { _id: "6719b9e2c4d...", title: "Prepare database backup", status: "Completed", priority: "Medium" }
        },
        {
          method: "DELETE",
          path: "/api/tasks/:id",
          title: "Delete Task Permanently",
          uiUsage: "Invoked when clicking the trash can icon button visible on task row hover. Immediately removes the item from the state and decrements the task count.",
          authRequired: true,
          requestBody: null,
          response: { message: "Task deleted successfully" }
        }
      ]
    }
  };

  const jsonString = JSON.stringify(apiData, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task-On API & Documentation</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23285642'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='central' text-anchor='middle' font-family='serif' font-weight='bold' font-size='20' fill='%23ffffff'%3ET%3C/text%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #F7F5F0;
      --card-bg: #FFFEFC;
      --primary-green: #285642;
      --primary-green-hover: #1e4233;
      --muted-green: #DCE9E1;
      --dark-text: #18352A;
      --secondary-text: #77736C;
      --border-color: #E5DED2;
      --radius: 8px;
      --radius-sm: 6px;
      --shadow-subtle: 0 1px 3px rgba(24, 53, 42, 0.04);
      --shadow-card: 0 4px 20px rgba(24, 53, 42, 0.06);
      --font-serif: 'Lora', Georgia, serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: var(--dark-text);
      font-family: var(--font-sans);
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px 48px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      width: 100%;
      max-width: 860px;
    }

    /* Top Brand Header */
    .brand-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      text-align: center;
    }

    .brand-logo-wrap {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      margin-bottom: 12px;
    }

    .brand-logo-mark {
      width: 32px;
      height: 32px;
      background-color: var(--primary-green);
      color: #FFFEFC;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 18px;
      line-height: 1;
    }

    .brand-logo-text {
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 22px;
      color: var(--dark-text);
      letter-spacing: -0.3px;
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background-color: var(--muted-green);
      color: var(--primary-green);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      background-color: var(--primary-green);
      border-radius: 50%;
      display: inline-block;
    }

    /* Main Card */
    .hero-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 32px;
      box-shadow: var(--shadow-card);
      margin-bottom: 24px;
      text-align: center;
    }

    .hero-title {
      font-family: var(--font-serif);
      font-size: 26px;
      font-weight: 600;
      color: var(--dark-text);
      letter-spacing: -0.4px;
      margin-bottom: 8px;
    }

    .hero-subtitle {
      color: var(--secondary-text);
      font-size: 14px;
      max-width: 580px;
      margin: 0 auto 24px;
    }

    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 0 18px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background-color: var(--primary-green);
      color: #FFFEFC;
    }

    .btn-primary:hover {
      background-color: var(--primary-green-hover);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background-color: var(--bg-color);
      color: var(--dark-text);
      border-color: var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--primary-green);
      color: var(--primary-green);
      background-color: #FFFEFC;
    }

    /* Navigation Tabs */
    .nav-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 4px;
      margin-bottom: 24px;
      gap: 4px;
    }

    .tab-btn {
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 4px;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text);
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
    }

    .tab-btn:hover {
      color: var(--dark-text);
    }

    .tab-btn.active {
      background-color: var(--primary-green);
      color: #FFFEFC;
      font-weight: 600;
    }

    /* Content Panels */
    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
    }

    /* Section Headers */
    .section-title {
      font-family: var(--font-serif);
      font-size: 18px;
      font-weight: 600;
      color: var(--dark-text);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Endpoint Card */
    .endpoint-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 20px 22px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-subtle);
      transition: border-color 0.15s ease;
    }

    .endpoint-card:hover {
      border-color: #D0C6B8;
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .method-tag {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .method-post {
      background-color: #DCE9E1;
      color: #1E5E41;
    }

    .method-get {
      background-color: #E0EBF7;
      color: #1E4F8A;
    }

    .method-put {
      background-color: #FDF1D6;
      color: #925C08;
    }

    .method-delete {
      background-color: #FCE8E6;
      color: #A32D22;
    }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 13.5px;
      font-weight: 600;
      color: var(--dark-text);
    }

    .auth-badge {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 3px;
      background-color: var(--bg-color);
      color: var(--secondary-text);
      border: 1px solid var(--border-color);
    }

    .endpoint-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--dark-text);
      margin-bottom: 6px;
    }

    .ui-usage-box {
      background-color: #FAF8F4;
      border-left: 3px solid var(--primary-green);
      padding: 10px 14px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin: 10px 0 14px;
      font-size: 12.5px;
      color: var(--dark-text);
      line-height: 1.5;
    }

    .ui-usage-box strong {
      color: var(--primary-green);
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .code-accordion {
      margin-top: 10px;
    }

    .code-accordion-title {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }

    pre.code-block {
      background-color: #18352A;
      color: #E9F4EE;
      font-family: var(--font-mono);
      font-size: 11.5px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      line-height: 1.45;
    }

    /* JSON Viewer Panel */
    .json-box {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }

    .json-header {
      background-color: #FAF8F4;
      border-bottom: 1px solid var(--border-color);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .json-header-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text);
      font-family: var(--font-mono);
    }

    .copy-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--secondary-text);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11.5px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--font-sans);
    }

    .copy-btn:hover {
      border-color: var(--primary-green);
      color: var(--primary-green);
      background-color: #FFFEFC;
    }

    .json-content {
      background-color: #18352A;
      color: #E9F4EE;
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 20px;
      overflow-x: auto;
      max-height: 520px;
      line-height: 1.5;
    }

    /* Footer */
    .page-footer {
      text-align: center;
      margin-top: 36px;
      font-size: 12px;
      color: var(--secondary-text);
    }

    .page-footer a {
      color: var(--primary-green);
      text-decoration: none;
      font-weight: 600;
    }

    .page-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .hero-card {
        padding: 24px 18px;
      }
      .nav-tabs {
        grid-template-columns: 1fr;
      }
      .endpoint-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Brand Header -->
    <header class="brand-header">
      <a href="${apiData.frontendUrl}" class="brand-logo-wrap" title="Go to Task-On Frontend">
        <span class="brand-logo-mark">T</span>
        <span class="brand-logo-text">Task-On</span>
      </a>
      <div class="badge-status">
        <span class="status-dot"></span>
        API Online & Synced with MongoDB Atlas
      </div>
    </header>

    <!-- Hero Card -->
    <div class="hero-card">
      <h1 class="hero-title">Task-On Backend API</h1>
      <p class="hero-subtitle">
        Production RESTful API running on Vercel Serverless Functions with persistent MongoDB Atlas cloud database. Powers user authentication, task organization, priority tracking, and analytics.
      </p>
      <div class="btn-group">
        <a href="${apiData.frontendUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
          🚀 Open Frontend UI
        </a>
        <button type="button" class="btn btn-secondary" id="checkApiBtn" onclick="switchTab('json')">
          ⚡ Check API JSON
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <button class="tab-btn ${isApiEndpoint ? '' : 'active'}" id="tabBtnDocs" onclick="switchTab('docs')">
        📖 API Endpoints & UI Usage
      </button>
      <button class="tab-btn ${isApiEndpoint ? 'active' : ''}" id="tabBtnJson" onclick="switchTab('json')">
        ⚡ Live JSON Output
      </button>
    </div>

    <!-- Panel 1: API Endpoints & Frontend Usage -->
    <div class="tab-panel ${isApiEndpoint ? '' : 'active'}" id="panelDocs">
      <h2 class="section-title">
        🔐 Authentication & Session
      </h2>

      ${apiData.endpoints.auth.map(ep => `
        <div class="endpoint-card">
          <div class="endpoint-header">
            <div class="endpoint-left">
              <span class="method-tag method-${ep.method.toLowerCase()}">${ep.method}</span>
              <span class="endpoint-path">${ep.path}</span>
            </div>
            <span class="auth-badge">${ep.authRequired ? 'Bearer Token Required' : 'Public Endpoint'}</span>
          </div>
          <div class="endpoint-name">${ep.title}</div>
          <div class="ui-usage-box">
            <strong>Frontend UI Integration</strong>
            ${ep.uiUsage}
          </div>
          <div class="code-accordion">
            <div class="code-accordion-title">Sample Request Body</div>
            <pre class="code-block">${JSON.stringify(ep.requestBody, null, 2)}</pre>
          </div>
        </div>
      `).join('')}

      <h2 class="section-title" style="margin-top: 28px;">
        📋 Tasks & Dashboard Management
      </h2>

      ${apiData.endpoints.tasks.map(ep => `
        <div class="endpoint-card">
          <div class="endpoint-header">
            <div class="endpoint-left">
              <span class="method-tag method-${ep.method.toLowerCase()}">${ep.method}</span>
              <span class="endpoint-path">${ep.path}</span>
            </div>
            <span class="auth-badge">${ep.authRequired ? 'Bearer Token Required' : 'Public Endpoint'}</span>
          </div>
          <div class="endpoint-name">${ep.title}</div>
          <div class="ui-usage-box">
            <strong>Frontend UI Integration</strong>
            ${ep.uiUsage}
          </div>
          ${ep.requestBody ? `
            <div class="code-accordion">
              <div class="code-accordion-title">Sample Request Body</div>
              <pre class="code-block">${JSON.stringify(ep.requestBody, null, 2)}</pre>
            </div>
          ` : ''}
          <div class="code-accordion">
            <div class="code-accordion-title">Expected Response</div>
            <pre class="code-block">${JSON.stringify(ep.response, null, 2)}</pre>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Panel 2: Live JSON Viewer -->
    <div class="tab-panel ${isApiEndpoint ? 'active' : ''}" id="panelJson">
      <div class="json-box">
        <div class="json-header">
          <span class="json-header-title">GET /api?format=json</span>
          <div style="display: flex; gap: 8px;">
            <a href="/api?format=json" target="_blank" class="copy-btn" style="text-decoration: none;">Raw JSON ↗</a>
            <button type="button" class="copy-btn" id="copyJsonBtn" onclick="copyJsonToClipboard()">Copy JSON</button>
          </div>
        </div>
        <pre class="json-content" id="jsonBlock">${jsonString}</pre>
      </div>
    </div>

    <!-- Page Footer -->
    <footer class="page-footer">
      <p>Task-On MERN Architecture • Deployed on <a href="https://vercel.com" target="_blank">Vercel</a> & <a href="https://firebase.google.com" target="_blank">Firebase</a> • Connected to MongoDB Atlas</p>
    </footer>
  </div>

  <script>
    function switchTab(tab) {
      const panelDocs = document.getElementById('panelDocs');
      const panelJson = document.getElementById('panelJson');
      const tabBtnDocs = document.getElementById('tabBtnDocs');
      const tabBtnJson = document.getElementById('tabBtnJson');

      if (tab === 'json') {
        panelDocs.classList.remove('active');
        panelJson.classList.add('active');
        tabBtnDocs.classList.remove('active');
        tabBtnJson.classList.add('active');
        window.location.hash = 'json';
      } else {
        panelJson.classList.remove('active');
        panelDocs.classList.add('active');
        tabBtnJson.classList.remove('active');
        tabBtnDocs.classList.add('active');
        history.replaceState(null, null, ' ');
      }
    }

    function copyJsonToClipboard() {
      const text = document.getElementById('jsonBlock').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyJsonBtn');
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = 'Copy JSON'; }, 2000);
      });
    }

    // Auto-switch to JSON tab if hash is #json or requested
    if (window.location.hash === '#json') {
      switchTab('json');
    }
  </script>
</body>
</html>`;
}

module.exports = { renderApiDocumentation };

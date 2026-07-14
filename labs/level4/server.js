const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')
const { pageTemplate } = require('../shared/template')

const app = express()
const PORT = process.env.PORT || 3004
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || ''
const JWT_SECRET = process.env.JWT_SECRET || 'sd_admin_panel_secret_2024'

const INITIAL_USERS = [
  { id: 1, email: 'admin@solsticedynamics.internal', name: 'System Admin', role: 'admin', department: 'IT Security', lastLogin: '2025-09-10T14:30:00Z' },
  { id: 2, email: 'ops@solsticedynamics.internal', name: 'Operations Manager', role: 'operator', department: 'Operations', lastLogin: '2025-09-12T09:15:00Z' },
]

let users = JSON.parse(JSON.stringify(INITIAL_USERS))
let auditLog = []

// Customer data — only accessible to admin role
const FLAG = 'SDX{priv_escalate-5d9e1b}'
const customerData = [
  { id: 1001, name: 'Meridian Logistics', contact: 'sarah@meridian.com', contract_value: 240000, status: 'Active' },
  { id: 1002, name: 'Apex Manufacturing', contact: 'james@apex-mfg.com', contract_value: 180000, status: 'Active' },
  { id: 1003, name: 'Cascade Retail', contact: 'diana@cascade.com', contract_value: 95000, status: 'Pending Renewal' },
]

function authenticate(req, res, next) {
  const token = req.query.token || req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // VULNERABILITY: Server trusts the role from the JWT without checking against the user database
    // The JWT is signed with the app's secret, but the profile update endpoint lets users set their own role
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function requireAdmin(req, res, next) {
  // VULNERABILITY: This checks req.user.role which comes from the JWT,
  // which was set from the client-controllable profile update
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')))

// Allow cross-origin iframe embedding from any origin
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options')
  res.setHeader('Content-Security-Policy', "frame-ancestors *")
  next()
})

app.get('/static/app.js', (_req, res) => {
  res.type('application/javascript').send(`
const API = 'http://localhost:${PORT}';

function getToken() { return localStorage.getItem('admin_token'); }

async function login(token) {
  const res = await fetch(API + '/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (data.valid) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    window.location.href = '/dashboard';
  } else {
    showError(data.error || 'Invalid token');
  }
}

async function loadDashboard() {
  const token = getToken();
  const [profileRes, statsRes] = await Promise.all([
    fetch(API + '/api/profile?token=' + token),
    fetch(API + '/api/stats?token=' + token)
  ]);
  const profile = await profileRes.json();
  const stats = await statsRes.json();
  renderDashboard(profile, stats);
}

function renderDashboard(profile, stats) {
  document.getElementById('user-name').textContent = profile.name;
  document.getElementById('user-role').textContent = profile.role;
  document.getElementById('user-role').className = 'badge ' + (profile.role === 'admin' ? 'badge-admin' : 'badge-user');
  document.getElementById('total-users').textContent = stats.totalUsers;
  document.getElementById('active-sessions').textContent = stats.activeSessions;
  document.getElementById('system-health').textContent = stats.systemHealth;

  if (profile.role === 'admin') {
    document.getElementById('admin-section').style.display = 'block';
  }
}

async function updateProfile() {
  const token = getToken();
  const role = document.getElementById('new-role').value;
  const res = await fetch(API + '/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, token })
  });
  const data = await res.json();
  if (data.user) {
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    showSuccess('Profile updated. Role: ' + data.user.role);
    loadDashboard();
  } else {
    showError(data.error || 'Update failed');
  }
}

async function exportData() {
  const token = getToken();
  const res = await fetch(API + '/api/admin/export?token=' + token);
  const data = await res.json();
  if (data.error) { showError(data.error); return; }
  renderExport(data);
}

function renderExport(data) {
  const el = document.getElementById('export-results');
  let html = '<div class="card" style="border-color:var(--sd-danger)"><h3 style="margin-bottom:12px;color:var(--sd-danger)">Data Export — Confidential</h3>';
  html += '<div class="code-block" style="margin-bottom:12px">';
  for (const [key, val] of Object.entries(data.export_metadata)) {
    html += '<div>' + key + ': ' + val + '</div>';
  }
  html += '</div>';
  html += '<table><thead><tr><th>Customer</th><th>Contact</th><th>Value</th><th>Status</th></tr></thead><tbody>';
  for (const c of data.customers) {
    html += '<tr><td>' + c.name + '</td><td>' + c.contact + '</td><td>$' + c.contract_value.toLocaleString() + '</td><td>' + c.status + '</td></tr>';
  }
  html += '</tbody></table>';
  html += '<div class="code-block" style="margin-top:12px;border:2px solid var(--sd-danger)">';
  html += '<div style="color:var(--sd-danger);font-weight:bold">EXFILTRATION FLAG: ' + data.flag + '</div>';
  html += '</div></div>';
  el.innerHTML = html;
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showSuccess(msg) {
  const el = document.getElementById('success-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = '/login';
}
`)
})

// Login
app.get('/login', (_req, res) => {
  res.send(pageTemplate(
    'Admin Panel',
    'Administration',
    [['/login', 'Access']],
    `
    <div style="max-width:480px;margin:60px auto">
      <div class="card">
        <div style="text-align:center;margin-bottom:24px">
          <div class="header-logo" style="width:48px;height:48px;font-size:20px;margin:0 auto 12px">SD</div>
          <h2 style="margin-bottom:4px">Admin Panel</h2>
          <p style="font-size:13px;color:var(--sd-muted)">Solstice Dynamics — System Administration</p>
        </div>
        <div id="error-msg" class="alert alert-error" style="display:none"></div>
        <form onsubmit="event.preventDefault(); login(document.getElementById('token-input').value)">
          <div class="form-group">
            <label>Admin Access Token</label>
            <input type="text" id="token-input" placeholder="Enter admin panel access token" required
              style="font-family:monospace;font-size:13px">
            <p style="font-size:11px;color:var(--sd-muted);margin-top:4px">Obtain this token from the File Manager config.</p>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Access Admin Panel</button>
        </form>
      </div>
    </div>
    <script src="/static/app.js"></script>
    `
  ))
})

// Dashboard
app.get('/dashboard', (req, res) => {
  const token = req.query.token
  if (!token) return res.redirect('/login')
  try { jwt.verify(token, JWT_SECRET) } catch { return res.redirect('/login') }

  res.send(pageTemplate(
    'Dashboard',
    'Administration',
    [['/dashboard', 'Dashboard'], ['#', 'Logout']],
    `
    <div class="card">
      <div class="card-header">
        <h2>System Dashboard</h2>
        <div><span id="user-name" style="font-weight:600"></span> <span id="user-role" class="badge"></span></div>
      </div>
      <div id="error-msg" class="alert alert-error" style="display:none"></div>
      <div id="success-msg" class="alert alert-success" style="display:none"></div>
      <div class="two-col" style="margin-bottom:20px">
        <div style="padding:16px;background:var(--sd-bg);border-radius:6px;text-align:center">
          <div style="font-size:24px;font-weight:700" id="total-users">-</div>
          <div style="font-size:12px;color:var(--sd-muted)">Registered Users</div>
        </div>
        <div style="padding:16px;background:var(--sd-bg);border-radius:6px;text-align:center">
          <div style="font-size:24px;font-weight:700" id="active-sessions">-</div>
          <div style="font-size:12px;color:var(--sd-muted)">Active Sessions</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">Profile Settings</h3>
      <p style="font-size:13px;color:var(--sd-muted);margin-bottom:12px">Update your account role. Changes take effect immediately.</p>
      <div style="display:flex;gap:8px;align-items:end">
        <div class="form-group" style="flex:1;margin-bottom:0">
          <label>Role</label>
          <select id="new-role">
            <option value="operator">Operator</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="updateProfile()">Update</button>
      </div>
    </div>

    <div class="card" id="admin-section" style="display:none;border-color:var(--sd-danger)">
      <h3 style="margin-bottom:12px;color:var(--sd-danger)">Admin Tools</h3>
      <p style="font-size:13px;color:var(--sd-muted);margin-bottom:12px">Export sensitive customer data. Restricted to administrator role.</p>
      <button class="btn btn-danger" onclick="exportData()">Export Customer Data</button>
    </div>
    <div id="export-results"></div>

    <script>
      document.querySelector('.header-nav').innerHTML = '<a href="/dashboard">Dashboard</a><a href="#" onclick="logout()">Logout</a>';
      loadDashboard();
    </script>
    `
  ))
})

// API: Verify token
app.post('/api/verify', (req, res) => {
  const { token } = req.body
  if (!token) return res.json({ valid: false, error: 'Token required' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = users.find(u => u.id === payload.id)
    if (!user) return res.json({ valid: false, error: 'User not found' })
    res.json({ valid: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
  } catch {
    res.json({ valid: false, error: 'Invalid token' })
  }
})

// API: Get profile (safe — reads from server-side user record)
app.get('/api/profile', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department })
})

// API: Update profile — VULNERABLE: accepts role from client without server-side verification
app.put('/api/profile', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  // VULNERABILITY: Server accepts role from client request body
  // In a secure app, role should never be client-editable
  const { role, name, department } = req.body

  if (role) user.role = role  // <-- THE FLAW: trusts client-provided role
  if (name) user.name = name
  if (department) user.department = department

  // Issue a new JWT with the updated role
  const newToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
    JWT_SECRET, { expiresIn: '1h' }
  )

  auditLog.push({ userId: user.id, action: 'profile_update', changes: req.body, timestamp: new Date().toISOString() })

  res.json({ user: { id: user.id, name: user.name, role: user.role }, token: newToken })
})

// API: Stats (safe)
app.get('/api/stats', authenticate, (_req, res) => {
  res.json({ totalUsers: users.length, activeSessions: 3, systemHealth: 'Healthy' })
})

// API: Admin data export — requires admin role
app.get('/api/admin/export', authenticate, requireAdmin, (req, res) => {
  auditLog.push({ userId: req.user.id, action: 'data_export', timestamp: new Date().toISOString() })

  res.json({
    customers: customerData,
    flag: FLAG,
    export_metadata: {
      exported_by: req.user.email,
      export_time: new Date().toISOString(),
      record_count: customerData.length,
      classification: 'CONFIDENTIAL',
    },
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', level: 4, name: 'Admin Panel', port: PORT })
})

// Internal reset endpoint
app.post('/__internal/reset', (req, res) => {
  if (!INTERNAL_TOKEN || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  users = JSON.parse(JSON.stringify(INITIAL_USERS))
  auditLog = []
  res.json({ status: 'ok', message: 'Level 4 reset to initial state' })
})

app.get('/', (_req, res) => res.redirect('/login'))

app.listen(PORT, () => {
  console.log(`Level 4 — Admin Panel running on http://localhost:${PORT}`)
  console.log(`  JWT secret: ${JWT_SECRET}`)
})

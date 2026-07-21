const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')
const { pageTemplate } = require('../shared/template')

const app = express()
const PORT = process.env.PORT || 3001
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || ''

// IMPORTANT: This secret is intentionally weak — a realistic "junior dev" mistake.
// It's leaked via console.log in the client-side JS (see /static/app.js).
const JWT_SECRET = process.env.JWT_SECRET || 'solstice_jwt_secret_2024'

const INITIAL_EMPLOYEES = [
  { id: 1, email: 'm.chen@solsticedynamics.internal', password: 'Welcome1!', name: 'Michelle Chen', role: 'admin', department: 'Engineering', title: 'VP of Engineering' },
  { id: 2, email: 'j.park@solsticedynamics.internal', password: 'SecurePass99', name: 'James Park', role: 'user', department: 'Engineering', title: 'Senior Developer' },
  { id: 3, email: 'a.garcia@solsticedynamics.internal', password: 'Hello2024!', name: 'Ana Garcia', role: 'user', department: 'HR', title: 'HR Coordinator' },
  { id: 4, email: 'r.williams@solsticedynamics.internal', password: 'Passw0rd!', name: 'Rachel Williams', role: 'user', department: 'Finance', title: 'Financial Analyst' },
  { id: 5, email: 'd.okonkwo@solsticedynamics.internal', password: 'Summer2024', name: 'David Okonkwo', role: 'user', department: 'Operations', title: 'Ops Manager' },
]

let employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES))

// The flag — only visible to admin role on /directory
const HR_SERVICE_CREDENTIAL = 'SDX{auth_bypass-7f3a9c}'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')))

const ALLOWED_ORIGIN = process.env.ALLOWED_FRAME_ORIGIN || '*'
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options')
  res.setHeader('Content-Security-Policy', `frame-ancestors ${ALLOWED_ORIGIN}`)
  next()
})

// Client-side JS — contains the intentional leak
app.get('/static/app.js', (_req, res) => {
  res.type('application/javascript').send(`
// Solstice Dynamics Employee Portal — Client Logic
// TODO: Remove debug logging before production deploy — M.Chen

const API = 'http://localhost:${PORT}';

async function login(email, password) {
  const res = await fetch(API + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    console.log('Login successful');
    console.log('JWT Token:', data.token);
    // DEBUG: Verify token structure
    const payload = JSON.parse(atob(data.token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('JWT Secret (for dev testing):', '${JWT_SECRET}');
    localStorage.setItem('sd_token', data.token);
    window.location.href = '/profile';
  } else {
    showError(data.error || 'Login failed');
  }
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function logout() {
  localStorage.removeItem('sd_token');
  window.location.href = '/login';
}
`)
})

// Login page
app.get('/login', (_req, res) => {
  res.send(pageTemplate(
    'Employee Portal',
    'Internal Access',
    [['/login', 'Login']],
    `
    <div style="max-width:400px;margin:60px auto">
      <div class="card">
        <div style="text-align:center;margin-bottom:24px">
          <div class="header-logo" style="width:48px;height:48px;font-size:20px;margin:0 auto 12px">SD</div>
          <h2 style="margin-bottom:4px">Employee Portal</h2>
          <p style="font-size:13px;color:var(--sd-muted)">Sign in with your Solstice Dynamics credentials</p>
        </div>
        <div id="error-msg" class="alert alert-error" style="display:none"></div>
        <form onsubmit="event.preventDefault(); login(document.getElementById('email').value, document.getElementById('password').value)">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="email" placeholder="name@solsticedynamics.internal" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Sign In</button>
        </form>
      </div>
      <p style="text-align:center;font-size:12px;color:var(--sd-muted);margin-top:16px">
        Solstice Dynamics IT Support: helpdesk@solsticedynamics.internal
      </p>
    </div>
    <script src="/static/app.js"></script>
    `
  ))
})

// Profile page
app.get('/profile', (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1]
  if (!token) return res.redirect('/login')

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const emp = employees.find(e => e.id === payload.id)
    if (!emp) return res.redirect('/login')

    res.send(pageTemplate(
      'My Profile',
      'Employee Portal',
      [['/profile', 'Profile'], ['/directory', 'Directory'], ['#', 'Logout']],
      `
      <div class="card">
        <div class="card-header">
          <h2>${emp.name}</h2>
          <span class="badge ${emp.role === 'admin' ? 'badge-admin' : 'badge-user'}">${emp.role}</span>
        </div>
        <table>
          <tr><th>Email</th><td>${emp.email}</td></tr>
          <tr><th>Department</th><td>${emp.department}</td></tr>
          <tr><th>Title</th><td>${emp.title}</td></tr>
          <tr><th>Employee ID</th><td>SD-${String(emp.id).padStart(4, '0')}</td></tr>
        </table>
      </div>
      ${emp.role === 'admin' ? `
      <div class="card" style="border-color:var(--sd-accent)">
        <p style="font-size:13px;color:var(--sd-muted)">
          <strong>Admin Notice:</strong> You have access to the <a href="/directory" style="color:var(--sd-primary-light)">Internal Directory</a>.
        </p>
      </div>
      ` : ''}
      <script>document.querySelector('.header-nav').innerHTML = '<a href="/profile">Profile</a><a href="/directory">Directory</a><a href="#" onclick="logout()">Logout</a>';</script>
      `
    ))
  } catch {
    res.redirect('/login')
  }
})

// Directory page — only accessible with admin role
app.get('/directory', (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1]
  if (!token) return res.redirect('/login')

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    // VULNERABILITY: Server trusts the JWT role claim without verifying against DB
    // The JWT is signed with a weak secret, so an attacker can forge it
    if (payload.role !== 'admin') {
      return res.send(pageTemplate(
        'Access Denied',
        'Employee Portal',
        [['/profile', 'Profile'], ['#', 'Logout']],
        `
        <div class="card" style="text-align:center;padding:48px">
          <h2 style="color:var(--sd-danger);margin-bottom:8px">403 — Access Denied</h2>
          <p>You do not have permission to view the internal directory.</p>
          <p style="font-size:12px;color:var(--sd-muted);margin-top:12px">Required role: <strong>admin</strong></p>
          <a href="/profile" class="btn btn-primary" style="margin-top:16px">Back to Profile</a>
        </div>
        `
      ))
    }

    // Admin directory — contains the HR portal credential (the flag)
    res.send(pageTemplate(
      'Internal Directory',
      'Employee Portal',
      [['/profile', 'Profile'], ['/directory', 'Directory'], ['#', 'Logout']],
      `
      <div class="card">
        <h2 style="margin-bottom:16px">Internal Directory — Confidential</h2>
        <p style="font-size:13px;color:var(--sd-muted);margin-bottom:16px">This directory is restricted to authorized personnel only.</p>
        <table>
          <thead>
            <tr><th>Name</th><th>Department</th><th>Contact</th></tr>
          </thead>
          <tbody>
            <tr><td>Michelle Chen</td><td>Engineering</td><td>m.chen@solsticedynamics.internal</td></tr>
            <tr><td>James Park</td><td>Engineering</td><td>j.park@solsticedynamics.internal</td></tr>
            <tr><td>Ana Garcia</td><td>HR</td><td>a.garcia@solsticedynamics.internal</td></tr>
            <tr><td>Rachel Williams</td><td>Finance</td><td>r.williams@solsticedynamics.internal</td></tr>
            <tr><td>David Okonkwo</td><td>Operations</td><td>d.okonkwo@solsticedynamics.internal</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card" style="border-color:var(--sd-accent)">
        <h3 style="font-size:15px;margin-bottom:12px">Internal Service Accounts</h3>
        <p style="font-size:13px;color:var(--sd-muted);margin-bottom:12px">These credentials are used for inter-system communication. Do not share externally.</p>
        <div class="code-block">
          <div style="margin-bottom:8px"><span style="color:#68d391">HR Portal Service Account:</span></div>
          <div>URL: http://hr-portal.solsticedynamics.internal:3002</div>
          <div>Username: hr_service@solsticedynamics.internal</div>
          <div>Password: ${HR_SERVICE_CREDENTIAL}</div>
        </div>
        <p style="font-size:11px;color:var(--sd-muted);margin-top:8px">Contact IT Security if you need to rotate these credentials.</p>
      </div>
      <script>document.querySelector('.header-nav').innerHTML = '<a href="/profile">Profile</a><a href="/directory">Directory</a><a href="#" onclick="logout()">Logout</a>';</script>
      `
    ))
  } catch {
    res.redirect('/login')
  }
})

// API: Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  // Parameterized-style lookup (Array.find is safe here — no SQL injection possible)
  const emp = employees.find(e => e.email === email && e.password === password)
  if (!emp) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: emp.id, email: emp.email, name: emp.name, role: emp.role, department: emp.department },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({ token, user: { id: emp.id, name: emp.name, email: emp.email, role: emp.role } })
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', level: 1, name: 'Employee Portal', port: PORT })
})

// Root redirect
app.get('/', (_req, res) => res.redirect('/login'))

// Internal reset endpoint
app.post('/__internal/reset', (req, res) => {
  if (!INTERNAL_TOKEN || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES))
  res.json({ status: 'ok', message: 'Level 1 reset to initial state' })
})

app.listen(PORT, () => {
  console.log(`Level 1 — Employee Portal running on http://localhost:${PORT}`)
  console.log(`  Login at: http://localhost:${PORT}/login`)
})

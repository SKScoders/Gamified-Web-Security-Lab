const express = require('express')
const jwt = require('jsonwebtoken')
const initSqlJs = require('sql.js')
const path = require('path')
const { pageTemplate } = require('../shared/template')

const app = express()
const PORT = process.env.PORT || 3002
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || ''
const JWT_SECRET = process.env.JWT_SECRET || 'hr_portal_internal_2024'
const FLAG_TOKEN = 'SDX{sql_inject-3e8b2d}'

let db
let SQL

function seedDatabase() {
  db.run('DROP TABLE IF EXISTS employees')
  db.run('DROP TABLE IF EXISTS service_accounts')

  db.run(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      salary INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE service_accounts (
      id INTEGER PRIMARY KEY,
      service_name TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      auth_token TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `)

  const employees = [
    [1, 'Michelle', 'Chen', 'm.chen@solsticedynamics.internal', 'Engineering', 'VP of Engineering', '2019-03-15', 185000],
    [2, 'James', 'Park', 'j.park@solsticedynamics.internal', 'Engineering', 'Senior Developer', '2021-07-22', 125000],
    [3, 'Ana', 'Garcia', 'a.garcia@solsticedynamics.internal', 'HR', 'HR Coordinator', '2022-01-10', 72000],
    [4, 'Rachel', 'Williams', 'r.williams@solsticedynamics.internal', 'Finance', 'Financial Analyst', '2020-11-05', 95000],
    [5, 'David', 'Okonkwo', 'd.okonkwo@solsticedynamics.internal', 'Operations', 'Ops Manager', '2018-06-01', 115000],
    [6, 'Sarah', 'Kim', 's.kim@solsticedynamics.internal', 'Engineering', 'Junior Developer', '2024-02-15', 82000],
    [7, 'Marcus', 'Thompson', 'm.thompson@solsticedynamics.internal', 'Finance', 'Controller', '2017-09-20', 140000],
    [8, 'Elena', 'Rodriguez', 'e.rodriguez@solsticedynamics.internal', 'HR', 'HR Director', '2016-04-08', 135000],
    [9, 'Tom', 'Bradley', 't.bradley@solsticedynamics.internal', 'Operations', 'Logistics Coordinator', '2023-08-01', 68000],
    [10, 'Priya', 'Patel', 'p.patel@solsticedynamics.internal', 'Engineering', 'DevOps Engineer', '2022-05-18', 118000],
  ]
  for (const e of employees) {
    db.run('INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?)', e)
  }

  db.run('INSERT INTO service_accounts VALUES (?, ?, ?, ?, ?)', [1, 'File Server API', 'http://file-manager.solsticedynamics.internal:3003', FLAG_TOKEN, 'Internal file server access token'])
  db.run('INSERT INTO service_accounts VALUES (?, ?, ?, ?, ?)', [2, 'Email Gateway', 'smtp://mail.solsticedynamics.internal', 'sg_mK9x2pL7vQ3nR8w', 'Internal mail relay'])
  db.run('INSERT INTO service_accounts VALUES (?, ?, ?, ?, ?)', [3, 'Monitoring Agent', 'http://monitoring.solsticedynamics.internal:9090', 'mon_aB4cD5eF6gH7i', 'System health monitoring'])
}

async function startServer() {
  SQL = await initSqlJs()
  db = new SQL.Database()

  seedDatabase()

  function authenticate(req, res, next) {
    const token = req.query.token || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    try {
      req.user = jwt.verify(token, JWT_SECRET)
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')))

const ALLOWED_ORIGIN = process.env.ALLOWED_FRAME_ORIGIN || '*'
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options')
  res.setHeader('Content-Security-Policy', `frame-ancestors ${ALLOWED_ORIGIN}`)
  next()
})

  app.get('/static/app.js', (_req, res) => {
    res.type('application/javascript').send(`
const API = '';
async function login(email, password) {
  const res = await fetch(API + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('hr_token', data.token);
    window.location.href = '/search';
  } else {
    showError(data.error || 'Login failed');
  }
}
async function searchEmployees(query) {
  const token = localStorage.getItem('hr_token');
  const res = await fetch(API + '/api/search?q=' + encodeURIComponent(query) + '&token=' + token);
  const data = await res.json();
  displayResults(data);
}
function displayResults(data) {
  const el = document.getElementById('results');
  if (!data.results || data.results.length === 0) {
    el.innerHTML = '<div class="alert alert-info">No employees found.</div>';
    return;
  }
  let html = '<table><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Title</th></tr></thead><tbody>';
  for (const row of data.results) {
    html += '<tr><td>' + (row.first_name||'') + ' ' + (row.last_name||'') + '</td><td>' + (row.email||'') + '</td><td>' + (row.department||'') + '</td><td>' + (row.title||'') + '</td></tr>';
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}
function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
`)
  })

  app.get('/login', (_req, res) => {
    res.send(pageTemplate(
      'HR Portal',
      'Human Resources',
      [['/login', 'Login']],
      `
      <div style="max-width:400px;margin:60px auto">
        <div class="card">
          <div style="text-align:center;margin-bottom:24px">
            <div class="header-logo" style="width:48px;height:48px;font-size:20px;margin:0 auto 12px">SD</div>
            <h2 style="margin-bottom:4px">HR Portal</h2>
            <p style="font-size:13px;color:var(--sd-muted)">Solstice Dynamics — Human Resources</p>
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
      </div>
      <script src="/static/app.js"></script>
      `
    ))
  })

  app.get('/search', (req, res) => {
    const token = req.query.token
    if (!token) return res.redirect('/login')
    try { jwt.verify(token, JWT_SECRET) } catch { return res.redirect('/login') }
    res.send(pageTemplate(
      'Employee Search',
      'HR Portal',
      [['/search', 'Search'], ['#', 'Logout']],
      `
      <div class="card">
        <h2 style="margin-bottom:16px">Employee Directory Search</h2>
        <p style="font-size:13px;color:var(--sd-muted);margin-bottom:16px">Search by name, department, or email.</p>
        <div style="display:flex;gap:8px">
          <input type="text" id="search-input" placeholder="Search employees..." style="flex:1;padding:10px 12px;border:1px solid var(--sd-border);border-radius:6px;font-size:14px"
            onkeydown="if(event.key==='Enter')searchEmployees(this.value)">
          <button class="btn btn-primary" onclick="searchEmployees(document.getElementById('search-input').value)">Search</button>
        </div>
      </div>
      <div id="results"></div>
      `
    ))
  })

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    // Parameterized query — safe
    const rows = db.exec('SELECT * FROM employees WHERE email = ?', [email])
    const emp = rows.length > 0 && rows[0].values.length > 0
      ? Object.fromEntries(rows[0].columns.map((c, i) => [c, rows[0].values[0][i]]))
      : null

    const validPasswords = {
      'a.garcia@solsticedynamics.internal': 'Hello2024!',
      'e.rodriguez@solsticedynamics.internal': 'HRDirector1',
    }
    if (!emp || validPasswords[email] !== password) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: emp.id, email: emp.email, name: emp.first_name + ' ' + emp.last_name, role: 'hr_staff' },
      JWT_SECRET, { expiresIn: '8h' }
    )
    res.json({ token, user: { id: emp.id, name: emp.first_name + ' ' + emp.last_name } })
  })

  // VULNERABLE: String concatenation SQL injection
  app.get('/api/search', authenticate, (req, res) => {
    const q = req.query.q
    if (!q) return res.json({ results: [] })

    // VULNERABILITY: Direct string interpolation — attacker can inject SQL
    const sql = `SELECT * FROM employees WHERE first_name LIKE '%${q}%' OR last_name LIKE '%${q}%' OR email LIKE '%${q}%' OR department LIKE '%${q}%'`

    try {
      const rows = db.exec(sql)
      const results = rows.length > 0
        ? rows[0].values.map(row => Object.fromEntries(rows[0].columns.map((c, i) => [c, row[i]])))
        : []
      res.json({ results })
    } catch (err) {
      res.status(400).json({ error: 'Search failed', detail: err.message })
    }
  })

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', level: 2, name: 'HR Portal', port: PORT })
  })

  // Internal reset endpoint
  app.post('/__internal/reset', (req, res) => {
    if (!INTERNAL_TOKEN || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    seedDatabase()
    res.json({ status: 'ok', message: 'Level 2 reset to initial state' })
  })

  app.get('/', (_req, res) => res.redirect('/login'))

  app.listen(PORT, () => {
    console.log(`Level 2 — HR Portal running on http://localhost:${PORT}`)
    console.log(`  Login: a.garcia@solsticedynamics.internal / Hello2024!`)
  })
}

startServer().catch(console.error)

const express = require('express')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { pageTemplate } = require('../shared/template')

const app = express()
const PORT = process.env.PORT || 3003
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || ''
const JWT_SECRET = process.env.JWT_SECRET || 'file_server_token_2024'

// The flag is in config/.env.production — the attacker must traverse to read it
const SHARED_DOCS_DIR = path.join(__dirname, 'shared-docs')
const CONFIG_DIR = path.join(__dirname, 'config')

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

// Client-side JS
app.get('/static/app.js', (_req, res) => {
  res.type('application/javascript').send(`
const API = 'http://localhost:${PORT}';

async function login(token) {
  const res = await fetch(API + '/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (data.valid) {
    localStorage.setItem('fm_token', token);
    localStorage.setItem('fm_user', JSON.stringify(data.user));
    window.location.href = '/browse';
  } else {
    showError(data.error || 'Invalid token');
  }
}

async function listFiles(dir) {
  const token = localStorage.getItem('fm_token');
  const url = API + '/api/files?path=' + encodeURIComponent(dir || '') + '&token=' + token;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) { showError(data.error); return; }
  displayFiles(data);
}

async function downloadFile(filename, currentDir) {
  const token = localStorage.getItem('fm_token');
  const url = API + '/api/download?file=' + encodeURIComponent(filename) + '&dir=' + encodeURIComponent(currentDir || '') + '&token=' + token;
  window.open(url, '_blank');
}

function displayFiles(data) {
  const el = document.getElementById('file-list');
  if (!data.files || data.files.length === 0) {
    el.innerHTML = '<div class="alert alert-info">Directory is empty.</div>';
    return;
  }
  let html = '<table><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Actions</th></tr></thead><tbody>';
  if (data.parentDir !== null) {
    html += '<tr><td><a href="#" onclick="listFiles(\\'' + data.parentDir + '\\')">&#x2191; ..</a></td><td>Directory</td><td>-</td><td></td></tr>';
  }
  for (const f of data.files) {
    if (f.isDir) {
      html += '<tr><td>&#128193; <a href="#" onclick="listFiles(\\'' + (data.currentDir ? data.currentDir + '/' + f.name : f.name) + '\\')">' + f.name + '</a></td><td>Directory</td><td>-</td><td></td></tr>';
    } else {
      html += '<tr><td>&#128196; ' + f.name + '</td><td>File</td><td>' + f.size + '</td><td><a href="#" onclick="downloadFile(\\'' + f.name + '\\', \\'' + (data.currentDir || '') + '\\')">Download</a></td></tr>';
    }
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function logout() {
  localStorage.removeItem('fm_token');
  localStorage.removeItem('fm_user');
  window.location.href = '/login';
}
`)
})

// Login page
app.get('/login', (_req, res) => {
  res.send(pageTemplate(
    'File Manager',
    'Internal File Server',
    [['/login', 'Access']],
    `
    <div style="max-width:480px;margin:60px auto">
      <div class="card">
        <div style="text-align:center;margin-bottom:24px">
          <div class="header-logo" style="width:48px;height:48px;font-size:20px;margin:0 auto 12px">SD</div>
          <h2 style="margin-bottom:4px">File Manager</h2>
          <p style="font-size:13px;color:var(--sd-muted)">Solstice Dynamics — Internal File Server</p>
        </div>
        <div id="error-msg" class="alert alert-error" style="display:none"></div>
        <form onsubmit="event.preventDefault(); login(document.getElementById('token-input').value)">
          <div class="form-group">
            <label>Access Token</label>
            <input type="text" id="token-input" placeholder="Enter file server access token" required
              style="font-family:monospace;font-size:13px">
            <p style="font-size:11px;color:var(--sd-muted);margin-top:4px">Obtain this token from the HR Portal service accounts table.</p>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Access File Server</button>
        </form>
      </div>
    </div>
    <script src="/static/app.js"></script>
    `
  ))
})

// Browse page
app.get('/browse', (req, res) => {
  const token = req.query.token
  if (!token) return res.redirect('/login')
  try { jwt.verify(token, JWT_SECRET) } catch { return res.redirect('/login') }

  res.send(pageTemplate(
    'Browse Files',
    'File Manager',
    [['/browse', 'Browse'], ['#', 'Logout']],
    `
    <div class="card">
      <div class="card-header">
        <h2>Shared Documents</h2>
        <span style="font-size:12px;color:var(--sd-muted)">solsticedynamics.internal/fileserver</span>
      </div>
      <div id="error-msg" class="alert alert-error" style="display:none"></div>
      <div id="file-list">
        <p style="color:var(--sd-muted);font-size:13px">Loading files...</p>
      </div>
    </div>
    <div class="alert alert-info">
      <strong>Note:</strong> All file access is logged and audited. Unauthorized access attempts will be reported to IT Security.
    </div>
    <script>
      document.querySelector('.header-nav').innerHTML = '<a href="/browse">Browse</a><a href="#" onclick="logout()">Logout</a>';
      listFiles('');
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
    res.json({ valid: true, user: { name: payload.name, service: payload.service } })
  } catch {
    res.json({ valid: false, error: 'Invalid or expired token' })
  }
})

// API: List files (safe — properly sandboxed)
app.get('/api/files', authenticate, (req, res) => {
  const requestedPath = req.query.path || ''

  // SAFE: Resolve and verify the path stays within SHARED_DOCS_DIR
  const resolved = path.resolve(SHARED_DOCS_DIR, requestedPath)
  if (!resolved.startsWith(SHARED_DOCS_DIR)) {
    return res.status(403).json({ error: 'Access denied' })
  }

  try {
    const items = fs.readdirSync(resolved, { withFileTypes: true })
    const files = items.map(item => ({
      name: item.name,
      isDir: item.isDirectory(),
      size: item.isDirectory() ? '-' : `${fs.statSync(path.join(resolved, item.name)).size} bytes`,
    })).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })

    const parentDir = requestedPath
      ? path.dirname(requestedPath) === '.' ? '' : path.dirname(requestedPath)
      : null

    res.json({ files, currentDir: requestedPath, parentDir })
  } catch (err) {
    res.status(404).json({ error: 'Directory not found' })
  }
})

// API: Download file — VULNERABLE to path traversal
app.get('/api/download', authenticate, (req, res) => {
  const { file, dir } = req.query
  if (!file) return res.status(400).json({ error: 'File parameter required' })

  // VULNERABILITY: No sanitization of path traversal sequences (../)
  // The attacker can use: ../../../config/.env.production
  const filePath = path.join(SHARED_DOCS_DIR, dir || '', file)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    res.type('text/plain').send(content)
  } catch (err) {
    res.status(404).json({ error: 'File not found' })
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', level: 3, name: 'File Manager', port: PORT })
})

app.get('/', (_req, res) => res.redirect('/login'))

// Internal reset endpoint (files are static on disk, nothing to reset)
app.post('/__internal/reset', (req, res) => {
  if (!INTERNAL_TOKEN || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  res.json({ status: 'ok', message: 'Level 3 reset to initial state' })
})

app.listen(PORT, () => {
  console.log(`Level 3 — File Manager running on http://localhost:${PORT}`)
  console.log(`  JWT secret: ${JWT_SECRET}`)
})

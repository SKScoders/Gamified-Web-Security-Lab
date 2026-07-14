import type {
  User,
  Level,
  Progress,
  Hint,
  HintUsage,
  AuditLogEntry,
  LeaderboardEntry,
  UserProfile,
  LevelReportData,
  DiffLine,
  LevelCardData,
  UserStats,
} from '@/types'

export const currentUser: User = {
  id: 'usr_a1b2c3d4',
  email: 'alex.rivera@example.com',
  displayName: 'Alex Rivera',
  avatar: 'AR',
  createdAt: '2025-01-15T00:00:00Z',
}

export const levels: Level[] = [
  {
    id: 'lvl_001',
    orderIndex: 1,
    title: 'Authentication Bypass',
    description: 'Exploit weak session management to access protected admin panels without valid credentials.',
    vulnCategory: 'Broken Authentication',
    owaspCategory: 'A07:2021',
    mitreTechniqueId: 'T1078',
    mitreTechniqueName: 'Valid Accounts',
    cvssBaseVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
    cvssScore: 8.1,
    cweId: 'CWE-287',
    cweTitle: 'Improper Authentication',
    difficulty: 'Intermediate',
    points: 250,
    expectedFlag: 'SC{auth_byp4ss_m4ster}',
  },
  {
    id: 'lvl_002',
    orderIndex: 2,
    title: 'SQL Injection',
    description: 'Find and exploit a SQL injection vulnerability in the login form to extract admin credentials.',
    vulnCategory: 'Injection',
    owaspCategory: 'A03:2021',
    mitreTechniqueId: 'T1190',
    mitreTechniqueName: 'Exploit Public-Facing Application',
    cvssBaseVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cvssScore: 9.8,
    cweId: 'CWE-89',
    cweTitle: "Improper Neutralization of Special Elements used in an SQL Command",
    difficulty: 'Intermediate',
    points: 350,
    expectedFlag: 'SC{sql_1nj3ct10n_pr0}',
  },
  {
    id: 'lvl_003',
    orderIndex: 3,
    title: 'Server-Side Vulnerability',
    description: 'Identify and exploit a Server-Side Request Forgery (SSRF) to access internal services and read sensitive files.',
    vulnCategory: 'SSRF',
    owaspCategory: 'A10:2021',
    mitreTechniqueId: 'T1190',
    mitreTechniqueName: 'Exploit Public-Facing Application',
    cvssBaseVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N',
    cvssScore: 8.6,
    cweId: 'CWE-918',
    cweTitle: 'Server-Side Request Forgery',
    difficulty: 'Hard',
    points: 400,
    expectedFlag: 'SC{ssrf_s3rv3r_0wn3d}',
  },
  {
    id: 'lvl_004',
    orderIndex: 4,
    title: 'Privilege Escalation',
    description: 'Chain an IDOR vulnerability with a JWT forgery technique to escalate from user to admin and dump the flag.',
    vulnCategory: 'Broken Access Control',
    owaspCategory: 'A01:2021',
    mitreTechniqueId: 'T1078.004',
    mitreTechniqueName: 'Valid Accounts: Cloud Accounts',
    cvssBaseVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cvssScore: 8.8,
    cweId: 'CWE-639',
    cweTitle: 'Authorization Bypass Through User-Controlled Key',
    difficulty: 'Hard',
    points: 500,
    expectedFlag: 'SC{pr1v_3sc_l3g3nd}',
  },
]

export const progress: Progress[] = [
  {
    id: 'prg_001',
    userId: 'usr_a1b2c3d4',
    levelId: 'lvl_001',
    status: 'solved',
    attempts: 2,
    score: 250,
    startedAt: '2025-07-09T10:00:00Z',
    completedAt: '2025-07-09T10:23:45Z',
    bestTime: '23m 45s',
  },
  {
    id: 'prg_002',
    userId: 'usr_a1b2c3d4',
    levelId: 'lvl_002',
    status: 'solved',
    attempts: 3,
    score: 300,
    startedAt: '2025-07-09T11:00:00Z',
    completedAt: '2025-07-09T11:34:12Z',
    bestTime: '34m 12s',
  },
  {
    id: 'prg_003',
    userId: 'usr_a1b2c3d4',
    levelId: 'lvl_003',
    status: 'in-progress',
    attempts: 1,
    score: 0,
    startedAt: '2025-07-10T14:00:00Z',
    completedAt: null,
    bestTime: null,
  },
  {
    id: 'prg_004',
    userId: 'usr_a1b2c3d4',
    levelId: 'lvl_004',
    status: 'locked',
    attempts: 0,
    score: 0,
    startedAt: null,
    completedAt: null,
    bestTime: null,
  },
]

export const hints: Record<string, Hint[]> = {
  lvl_001: [
    { id: 'hnt_001', levelId: 'lvl_001', hintOrder: 1, title: 'Session Tokens', content: 'Inspect the session token structure after a failed login attempt. The token format may reveal the encoding used for the user role claim.', scorePenalty: 5 },
    { id: 'hnt_002', levelId: 'lvl_001', hintOrder: 2, title: 'Cookie Manipulation', content: 'Try decoding the role parameter from base64 and re-encoding it with "admin" as the value. The server trusts this client-side value.', scorePenalty: 10 },
    { id: 'hnt_003', levelId: 'lvl_001', hintOrder: 3, title: 'Endpoint Discovery', content: 'After modifying your role, navigate to /admin to access the flag. The admin panel has no server-side role verification.', scorePenalty: 20 },
  ],
  lvl_002: [
    { id: 'hnt_004', levelId: 'lvl_002', hintOrder: 1, title: 'Input Analysis', content: 'The login form does not sanitize special SQL characters. Try injecting a single quote (\' ) in the username field and observe the error.', scorePenalty: 5 },
    { id: 'hnt_005', levelId: 'lvl_002', hintOrder: 2, title: 'Comment Syntax', content: 'SQL comments (-- or /* */) can be used to terminate the rest of the query. Use this to bypass the password check entirely.', scorePenalty: 10 },
    { id: 'hnt_006', levelId: 'lvl_002', hintOrder: 3, title: 'UNION Extraction', content: 'Combine UNION SELECT with INFORMATION_SCHEMA.TABLES to enumerate tables, then extract columns containing the flag.', scorePenalty: 20 },
  ],
  lvl_003: [
    { id: 'hnt_007', levelId: 'lvl_003', hintOrder: 1, title: 'URL Parameter', content: 'The /fetch endpoint takes a URL parameter and loads it server-side. Test with internal addresses like 127.0.0.1.', scorePenalty: 5 },
    { id: 'hnt_008', levelId: 'lvl_003', hintOrder: 2, title: 'Internal Network', content: 'Scan the internal network range (192.168.x.x) to find an admin panel. The response times will differ between open and closed ports.', scorePenalty: 10 },
    { id: 'hnt_009', levelId: 'lvl_003', hintOrder: 3, title: 'File Protocol', content: 'The SSRF filter only blocks http and https. Try using file:///etc/passwd or the gopher:// protocol to access local files.', scorePenalty: 20 },
  ],
  lvl_004: [
    { id: 'hnt_010', levelId: 'lvl_004', hintOrder: 1, title: 'API Enumeration', content: 'The /api/users endpoint accepts a numeric ID parameter. Try changing your own user ID to another value and observe the response.', scorePenalty: 5 },
    { id: 'hnt_011', levelId: 'lvl_004', hintOrder: 2, title: 'JWT Weakness', content: 'The JWT secret used for signing tokens is weak. Try cracking it with common passwords. The "alg: none" bypass may also work.', scorePenalty: 10 },
    { id: 'hnt_012', levelId: 'lvl_004', hintOrder: 3, title: 'Admin Endpoint', content: 'Forge a JWT with role="admin" using the cracked secret. Call /api/admin/flag with the forged token in the Authorization header.', scorePenalty: 20 },
  ],
}

export const hintUsage: HintUsage[] = [
  { id: 'hu_001', userId: 'usr_a1b2c3d4', hintId: 'hnt_004', requestedAt: '2025-07-09T11:15:00Z' },
]

export const auditLog: AuditLogEntry[] = [
  { id: 'aud_001', userId: 'usr_a1b2c3d4', eventType: 'level_started', payloadJson: '{"levelId":"lvl_003"}', prevHash: '0', entryHash: 'a1b2c3', createdAt: '2025-07-10T14:00:00Z' },
  { id: 'aud_002', userId: 'usr_a1b2c3d4', eventType: 'attempt_failed', payloadJson: '{"levelId":"lvl_003","reason":"flag_not_found"}', prevHash: 'a1b2c3', entryHash: 'd4e5f6', createdAt: '2025-07-10T14:12:30Z' },
  { id: 'aud_003', userId: 'usr_a1b2c3d4', eventType: 'hint_revealed', payloadJson: '{"levelId":"lvl_003","hintOrder":1}', prevHash: 'd4e5f6', entryHash: 'g7h8i9', createdAt: '2025-07-10T14:20:00Z' },
  { id: 'aud_004', userId: 'usr_a1b2c3d4', eventType: 'level_completed', payloadJson: '{"levelId":"lvl_002","score":300}', prevHash: 'g7h8i9', entryHash: 'j0k1l2', createdAt: '2025-07-09T11:34:12Z' },
  { id: 'aud_005', userId: 'usr_a1b2c3d4', eventType: 'level_started', payloadJson: '{"levelId":"lvl_002"}', prevHash: 'j0k1l2', entryHash: 'm3n4o5', createdAt: '2025-07-09T11:00:00Z' },
]

export const leaderboardAllTime: LeaderboardEntry[] = [
  { rank: 1, userId: 'usr_x1', displayName: 'Alex Chen', avatar: 'AC', score: 4850, levelsCompleted: 4, totalTime: '2h 34m' },
  { rank: 2, userId: 'usr_x2', displayName: 'Jordan Smith', avatar: 'JS', score: 4720, levelsCompleted: 4, totalTime: '3h 12m' },
  { rank: 3, userId: 'usr_x3', displayName: 'Casey Williams', avatar: 'CW', score: 4650, levelsCompleted: 4, totalTime: '3h 28m' },
  { rank: 4, userId: 'usr_x4', displayName: 'Morgan Lee', avatar: 'ML', score: 4200, levelsCompleted: 3, totalTime: '2h 15m' },
  { rank: 5, userId: 'usr_x5', displayName: 'Taylor Brown', avatar: 'TB', score: 3950, levelsCompleted: 3, totalTime: '2h 48m' },
  { rank: 6, userId: 'usr_x6', displayName: 'Riley Davis', avatar: 'RD', score: 3800, levelsCompleted: 3, totalTime: '3h 05m' },
  { rank: 7, userId: 'usr_x7', displayName: 'Jamie Wilson', avatar: 'JW', score: 3650, levelsCompleted: 2, totalTime: '1h 56m' },
  { rank: 8, userId: 'usr_x8', displayName: 'Cameron Moore', avatar: 'CM', score: 3500, levelsCompleted: 2, totalTime: '2h 22m' },
  { rank: 9, userId: 'usr_x9', displayName: 'Avery Taylor', avatar: 'AT', score: 3350, levelsCompleted: 2, totalTime: '2h 41m' },
  { rank: 10, userId: 'usr_x10', displayName: 'Quinn Anderson', avatar: 'QA', score: 3200, levelsCompleted: 2, totalTime: '2h 18m' },
]

export const leaderboardWeek: LeaderboardEntry[] = [
  { rank: 1, userId: 'usr_y1', displayName: 'Sam Patel', avatar: 'SP', score: 1500, levelsCompleted: 2, totalTime: '1h 12m' },
  { rank: 2, userId: 'usr_y2', displayName: 'Dana Kim', avatar: 'DK', score: 1350, levelsCompleted: 2, totalTime: '1h 45m' },
  { rank: 3, userId: 'usr_y3', displayName: 'Robin Fox', avatar: 'RF', score: 1200, levelsCompleted: 1, totalTime: '32m' },
  { rank: 4, userId: 'usr_y4', displayName: 'Pat Lopez', avatar: 'PL', score: 950, levelsCompleted: 1, totalTime: '48m' },
  { rank: 5, userId: 'usr_y5', displayName: 'Chris Ng', avatar: 'CN', score: 800, levelsCompleted: 1, totalTime: '1h 02m' },
]

export const currentUserLeaderboard: LeaderboardEntry = {
  rank: 42,
  userId: 'usr_a1b2c3d4',
  displayName: 'Alex Rivera',
  avatar: 'AR',
  score: 550,
  levelsCompleted: 2,
  totalTime: '58m',
  isCurrentUser: true,
}

export const userProfile: UserProfile = {
  user: currentUser,
  totalScore: 550,
  levelsSolved: 2,
  rank: 42,
  streak: 3,
  certificates: [
    { id: 'cert_001', levelId: 'lvl_001', levelTitle: 'Authentication Bypass', completedAt: '2025-07-09T10:23:45Z', score: 250 },
    { id: 'cert_002', levelId: 'lvl_002', levelTitle: 'SQL Injection', completedAt: '2025-07-09T11:34:12Z', score: 300 },
  ],
}

export const userStats: UserStats = {
  totalPoints: 550,
  levelsSolved: 2,
  streak: 3,
  rank: 42,
}

export const levelReports: LevelReportData[] = [
  {
    level: levels[0],
    progress: progress[0],
    hintsUsed: [],
    remediation: 'Implemented session token signing with HMAC-SHA256 and server-side role verification. All admin endpoints now check the signed JWT claim rather than trusting client-provided data.',
  },
  {
    level: levels[1],
    progress: progress[1],
    hintsUsed: [hintUsage[0]],
    remediation: 'Replaced string interpolation with parameterized queries using prepared statements. Added server-side input validation and a Web Application Firewall rule set to block common injection patterns.',
  },
]

export const levelCards: LevelCardData[] = [
  {
    id: 'lvl_001',
    title: 'Authentication Bypass',
    description: 'Exploit weak session management to access protected admin panels without valid credentials.',
    category: 'Broken Authentication',
    owasp: 'A07:2021',
    difficulty: 'Intermediate',
    status: 'solved',
    order: 1,
    points: 250,
    attempts: 2,
    bestTime: '23m 45s',
    completedAt: '2 days ago',
  },
  {
    id: 'lvl_002',
    title: 'SQL Injection',
    description: 'Find and exploit a SQL injection vulnerability in the login form to extract admin credentials.',
    category: 'Injection',
    owasp: 'A03:2021',
    difficulty: 'Intermediate',
    status: 'solved',
    order: 2,
    points: 350,
    attempts: 3,
    bestTime: '34m 12s',
    completedAt: '2 days ago',
  },
  {
    id: 'lvl_003',
    title: 'Server-Side Vulnerability',
    description: 'Identify and exploit a Server-Side Request Forgery to access internal services and read sensitive files.',
    category: 'SSRF',
    owasp: 'A10:2021',
    difficulty: 'Hard',
    status: 'in-progress',
    order: 3,
    points: 400,
    attempts: 1,
  },
  {
    id: 'lvl_004',
    title: 'Privilege Escalation',
    description: 'Chain an IDOR vulnerability with JWT forgery to escalate from user to admin and dump the flag.',
    category: 'Broken Access Control',
    owasp: 'A01:2021',
    difficulty: 'Hard',
    status: 'locked',
    order: 4,
    points: 500,
  },
]

export const reviewDiffLines: Record<string, { vulnerable: DiffLine[]; patched: DiffLine[] }> = {
  lvl_001: {
    vulnerable: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const jwt = require('jsonwebtoken');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.post('/login', (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { username, password } = req.body;', type: 'unchanged' },
      { line: 6, content: '  const role = req.cookies.role;', type: 'removed', note: 'VULNERABLE: Role is read from a client-controlled cookie, not verified server-side.' },
      { line: 7, content: '  const token = jwt.sign({ username, role }, "secret");', type: 'removed', note: 'VULNERABLE: Weak secret and role comes from untrusted cookie.' },
      { line: 8, content: "  res.cookie('role', role);", type: 'unchanged' },
      { line: 9, content: '  res.json({ token });', type: 'unchanged' },
      { line: 10, content: '});', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const jwt = require('jsonwebtoken');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.post('/login', (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { username, password } = req.body;', type: 'unchanged' },
      { line: 6, content: '  const role = authenticateUser(username, password);', type: 'added', note: 'FIXED: Role is determined server-side after credential verification.' },
      { line: 7, content: '  const token = jwt.sign({ username, role }, process.env.JWT_SECRET, { expiresIn: "1h" });', type: 'added', note: 'FIXED: Uses a secure secret from environment variables with token expiration.' },
      { line: 8, content: '  res.json({ token });', type: 'unchanged' },
      { line: 9, content: '});', type: 'unchanged' },
    ],
  },
  lvl_002: {
    vulnerable: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const db = require('./db');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.post('/login', (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { username, password } = req.body;', type: 'unchanged' },
      { line: 6, content: "  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;", type: 'removed', note: 'VULNERABLE: Direct string interpolation allows SQL injection. User input is not sanitized or parameterized.' },
      { line: 7, content: '  db.query(query, (err, results) => {', type: 'unchanged' },
      { line: 8, content: "    if (err) res.status(500).send('Error');", type: 'unchanged' },
      { line: 9, content: '    if (results.length > 0) {', type: 'unchanged' },
      { line: 10, content: "      res.send('Login successful');", type: 'unchanged' },
      { line: 11, content: '    }', type: 'unchanged' },
      { line: 12, content: '  });', type: 'unchanged' },
      { line: 13, content: '});', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const db = require('./db');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.post('/login', (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { username, password } = req.body;', type: 'unchanged' },
      { line: 6, content: "  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';", type: 'added', note: 'FIXED: Parameterized query using placeholders (?) instead of string interpolation.' },
      { line: 7, content: '  db.query(query, [username, password], (err, results) => {', type: 'added', note: 'FIXED: Parameters are passed separately, preventing SQL injection.' },
      { line: 8, content: "    if (err) res.status(500).send('Error');", type: 'unchanged' },
      { line: 9, content: '    if (results.length > 0) {', type: 'unchanged' },
      { line: 10, content: "      res.send('Login successful');", type: 'unchanged' },
      { line: 11, content: '    }', type: 'unchanged' },
      { line: 12, content: '  });', type: 'unchanged' },
      { line: 13, content: '});', type: 'unchanged' },
    ],
  },
  lvl_003: {
    vulnerable: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const fetch = require('node-fetch');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.get('/fetch', async (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { url } = req.query;', type: 'removed', note: 'VULNERABLE: URL parameter is taken directly from user input with no validation.' },
      { line: 6, content: '  const response = await fetch(url);', type: 'removed', note: 'VULNERABLE: Fetches any URL including internal network addresses (SSRF).' },
      { line: 7, content: '  const data = await response.text();', type: 'unchanged' },
      { line: 8, content: '  res.send(data);', type: 'unchanged' },
      { line: 9, content: '});', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const fetch = require('node-fetch');", type: 'unchanged' },
      { line: 3, content: "const { URL } = require('url');", type: 'added', note: 'FIXED: Import URL parser for validation.' },
      { line: 4, content: "app.get('/fetch', async (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const { url } = req.query;', type: 'unchanged' },
      { line: 6, content: '  const parsed = new URL(url);', type: 'added', note: 'FIXED: Parse and validate the URL before fetching.' },
      { line: 7, content: '  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateIP(parsed.hostname)) {', type: 'added', note: 'FIXED: Only allow http/https protocols and block private IP ranges.' },
      { line: 8, content: '    return res.status(400).send("Invalid URL");', type: 'added' },
      { line: 9, content: '  }', type: 'unchanged' },
      { line: 10, content: '  const response = await fetch(url);', type: 'unchanged' },
      { line: 11, content: '  const data = await response.text();', type: 'unchanged' },
      { line: 12, content: '  res.send(data);', type: 'unchanged' },
      { line: 13, content: '});', type: 'unchanged' },
    ],
  },
  lvl_004: {
    vulnerable: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const jwt = require('jsonwebtoken');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.get('/api/users/:id', (req, res) => {", type: 'unchanged' },
      { line: 5, content: '  const userId = req.params.id;', type: 'removed', note: 'VULNERABLE: User ID is taken from URL params with no ownership check (IDOR).' },
      { line: 6, content: '  const user = db.getUser(userId);', type: 'unchanged' },
      { line: 7, content: '  res.json(user);', type: 'unchanged' },
      { line: 8, content: '});', type: 'unchanged' },
      { line: 9, content: '', type: 'unchanged' },
      { line: 10, content: "app.get('/api/admin/flag', (req, res) => {", type: 'unchanged' },
      { line: 11, content: '  const token = req.headers.authorization?.split(" ")[1];', type: 'unchanged' },
      { line: 12, content: '  const payload = jwt.decode(token);', type: 'removed', note: 'VULNERABLE: Decodes without verifying the signature. Attacker can forge any payload.' },
      { line: 13, content: '  if (payload.role === "admin") {', type: 'unchanged' },
      { line: 14, content: '    res.json({ flag: process.env.FLAG });', type: 'unchanged' },
      { line: 15, content: '  }', type: 'unchanged' },
      { line: 16, content: '});', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "const express = require('express');", type: 'unchanged' },
      { line: 2, content: "const jwt = require('jsonwebtoken');", type: 'unchanged' },
      { line: 3, content: '', type: 'unchanged' },
      { line: 4, content: "app.get('/api/users/:id', authMiddleware, (req, res) => {", type: 'added', note: 'FIXED: Route requires authentication middleware.' },
      { line: 5, content: '  const userId = req.params.id;', type: 'unchanged' },
      { line: 6, content: '  if (req.user.id !== userId && req.user.role !== "admin") {', type: 'added', note: 'FIXED: Ownership check — users can only access their own data unless admin.' },
      { line: 7, content: '    return res.status(403).send("Forbidden");', type: 'added' },
      { line: 8, content: '  }', type: 'unchanged' },
      { line: 9, content: '  const user = db.getUser(userId);', type: 'unchanged' },
      { line: 10, content: '  res.json(user);', type: 'unchanged' },
      { line: 11, content: '});', type: 'unchanged' },
      { line: 12, content: '', type: 'unchanged' },
      { line: 13, content: "app.get('/api/admin/flag', authMiddleware, requireAdmin, (req, res) => {", type: 'added', note: 'FIXED: Double middleware — auth verification + admin role check.' },
      { line: 14, content: '  res.json({ flag: process.env.FLAG });', type: 'unchanged' },
      { line: 15, content: '});', type: 'unchanged' },
    ],
  },
}

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}

export function getProgressForLevel(id: string): Progress | undefined {
  return progress.find((p) => p.levelId === id)
}

export function getHintsForLevel(id: string): Hint[] {
  return hints[id] || []
}

export function getLevelCardById(id: string): LevelCardData | undefined {
  return levelCards.find((l) => l.id === id)
}

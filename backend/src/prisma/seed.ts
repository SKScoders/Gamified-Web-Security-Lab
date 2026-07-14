import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defensiveReviews: Record<number, object> = {
  1: {
    vulnerable: [
      { line: 1, content: "const JWT_SECRET = process.env.JWT_SECRET || 'solstice_jwt_secret_2024'", type: 'removed', note: 'VULNERABLE: Hardcoded fallback secret is guessable. The weak secret is also leaked to the client via console.log in the browser JS.' },
      { line: 2, content: '', type: 'unchanged' },
      { line: 3, content: "app.post('/api/login', (req, res) => {", type: 'unchanged' },
      { line: 4, content: '  const { email, password } = req.body;', type: 'unchanged' },
      { line: 5, content: '  const emp = employees.find(e => e.email === email && e.password === password)', type: 'unchanged' },
      { line: 6, content: '  if (!emp) return res.status(401).json({ error: "Invalid credentials" })', type: 'unchanged' },
      { line: 7, content: '', type: 'unchanged' },
      { line: 8, content: '  const token = jwt.sign(', type: 'unchanged' },
      { line: 9, content: '    { id: emp.id, email: emp.email, name: emp.name, role: emp.role },', type: 'removed', note: 'VULNERABLE: Role is embedded directly from the employee record into the JWT. Because the secret is weak, an attacker can forge a token with role:"admin".' },
      { line: 10, content: '    JWT_SECRET,', type: 'unchanged' },
      { line: 11, content: '    { expiresIn: "24h" }', type: 'unchanged' },
      { line: 12, content: '  )', type: 'unchanged' },
      { line: 13, content: '  res.json({ token })', type: 'unchanged' },
      { line: 14, content: '})', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: 'const JWT_SECRET = process.env.JWT_SECRET  // No hardcoded fallback — must be set in env', type: 'added', note: 'FIXED: Secret is loaded exclusively from environment variables. No guessable default exists.' },
      { line: 2, content: '', type: 'unchanged' },
      { line: 3, content: "app.post('/api/login', (req, res) => {", type: 'unchanged' },
      { line: 4, content: '  const { email, password } = req.body;', type: 'unchanged' },
      { line: 5, content: '  const emp = employees.find(e => e.email === email && e.password === password)', type: 'unchanged' },
      { line: 6, content: '  if (!emp) return res.status(401).json({ error: "Invalid credentials" })', type: 'unchanged' },
      { line: 7, content: '', type: 'unchanged' },
      { line: 8, content: '  const token = jwt.sign(', type: 'unchanged' },
      { line: 9, content: '    { id: emp.id, email: emp.email, name: emp.name, role: emp.role },', type: 'unchanged' },
      { line: 10, content: '    JWT_SECRET,  // Strong secret from env, never leaked to client', type: 'added', note: 'FIXED: Cryptographic secret from environment. No console.log leaks the secret to browser console.' },
      { line: 11, content: '    { expiresIn: "1h" }  // Shorter expiry reduces token replay window', type: 'added', note: 'FIXED: Shorter token lifetime limits exposure if a token is compromised.' },
      { line: 12, content: '  )', type: 'unchanged' },
      { line: 13, content: '  res.json({ token })', type: 'unchanged' },
      { line: 14, content: '})', type: 'unchanged' },
    ],
    bestPractices: "Replace the hardcoded or weak JWT secret with a cryptographically random string of at least 256 bits. Better yet, use asymmetric signing (RS256/ES256). Never derive the secret from guessable values. Ensure secrets are never leaked via source maps, debug logs, or client-side JavaScript. Rotate secrets periodically.",
  },
  2: {
    vulnerable: [
      { line: 1, content: "app.get('/api/search', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 2, content: '  const q = req.query.q', type: 'unchanged' },
      { line: 3, content: '  if (!q) return res.json({ results: [] })', type: 'unchanged' },
      { line: 4, content: '', type: 'unchanged' },
      { line: 5, content: '  // VULNERABILITY: Direct string interpolation', type: 'unchanged' },
      { line: 6, content: "  const sql = `SELECT * FROM employees WHERE first_name LIKE '%${q}%' OR last_name LIKE '%${q}%'`", type: 'removed', note: 'VULNERABLE: User input is interpolated directly into the SQL string. An attacker can inject UNION SELECT to extract data from other tables like service_accounts.' },
      { line: 7, content: '', type: 'unchanged' },
      { line: 8, content: '  try {', type: 'unchanged' },
      { line: 9, content: '    const rows = db.exec(sql)', type: 'unchanged' },
      { line: 10, content: '    res.json({ results })', type: 'unchanged' },
      { line: 11, content: '  } catch (err) {', type: 'unchanged' },
      { line: 12, content: "    res.status(400).json({ error: 'Search failed', detail: err.message })", type: 'removed', note: 'VULNERABLE: Leaking the raw SQL error message confirms the injection vector to the attacker.' },
      { line: 13, content: '  }', type: 'unchanged' },
      { line: 14, content: '})', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "app.get('/api/search', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 2, content: '  const q = req.query.q', type: 'unchanged' },
      { line: 3, content: '  if (!q) return res.json({ results: [] })', type: 'unchanged' },
      { line: 4, content: '', type: 'unchanged' },
      { line: 5, content: "  // Parameterized query — user input never touches the SQL string", type: 'unchanged' },
      { line: 6, content: "  const sql = `SELECT * FROM employees WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR department LIKE ?`", type: 'added', note: 'FIXED: Query uses ? placeholders. The database driver handles escaping, preventing injection regardless of input content.' },
      { line: 7, content: '  const like = `%${q}%`', type: 'added', note: 'FIXED: The LIKE pattern is built separately and passed as a parameter, not concatenated into the query.' },
      { line: 8, content: '', type: 'unchanged' },
      { line: 9, content: '  try {', type: 'unchanged' },
      { line: 10, content: '    const rows = db.exec(sql, [like, like, like, like])', type: 'added', note: 'FIXED: Parameters are passed as a separate array to the database driver.' },
      { line: 11, content: '    res.json({ results })', type: 'unchanged' },
      { line: 12, content: '  } catch (err) {', type: 'unchanged' },
      { line: 13, content: "    res.status(400).json({ error: 'Search failed' })  // No detail leaked", type: 'added', note: 'FIXED: Error message is generic. No SQL internals exposed to the client.' },
      { line: 14, content: '  }', type: 'unchanged' },
      { line: 15, content: '})', type: 'unchanged' },
    ],
    bestPractices: "Use parameterized queries (prepared statements) for ALL database interactions. Input validation alone is insufficient. Use an ORM that enforces parameterization by default. Apply least privilege to database accounts. Suppress detailed error messages in production.",
  },
  3: {
    vulnerable: [
      { line: 1, content: "const SHARED_DOCS_DIR = path.join(__dirname, 'shared-docs')", type: 'unchanged' },
      { line: 2, content: '', type: 'unchanged' },
      { line: 3, content: "app.get('/api/download', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 4, content: '  const { file, dir } = req.query', type: 'unchanged' },
      { line: 5, content: '  if (!file) return res.status(400).json({ error: "File parameter required" })', type: 'unchanged' },
      { line: 6, content: '', type: 'unchanged' },
      { line: 7, content: '  // VULNERABILITY: No sanitization of path traversal sequences', type: 'unchanged' },
      { line: 8, content: "  const filePath = path.join(SHARED_DOCS_DIR, dir || '', file)", type: 'removed', note: 'VULNERABLE: path.join does NOT prevent traversal. An attacker can use "../../../config/.env.production" to escape the sandbox and read arbitrary files.' },
      { line: 9, content: '', type: 'unchanged' },
      { line: 10, content: '  try {', type: 'unchanged' },
      { line: 11, content: '    const content = fs.readFileSync(filePath, "utf-8")', type: 'unchanged' },
      { line: 12, content: '    res.type("text/plain").send(content)', type: 'unchanged' },
      { line: 13, content: '  } catch (err) {', type: 'unchanged' },
      { line: 14, content: '    res.status(404).json({ error: "File not found" })', type: 'unchanged' },
      { line: 15, content: '  }', type: 'unchanged' },
      { line: 16, content: '})', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: "const SHARED_DOCS_DIR = path.join(__dirname, 'shared-docs')", type: 'unchanged' },
      { line: 2, content: '', type: 'unchanged' },
      { line: 3, content: "app.get('/api/download', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 4, content: '  const { file, dir } = req.query', type: 'unchanged' },
      { line: 5, content: '  if (!file) return res.status(400).json({ error: "File parameter required" })', type: 'unchanged' },
      { line: 6, content: '', type: 'unchanged' },
      { line: 7, content: '  // Resolve the full path and verify it stays within the sandbox', type: 'unchanged' },
      { line: 8, content: '  const filePath = path.resolve(SHARED_DOCS_DIR, dir || "", file)', type: 'added', note: 'FIXED: path.resolve canonicalizes the path, resolving any "../" sequences into a single absolute path.' },
      { line: 9, content: '  if (!filePath.startsWith(SHARED_DOCS_DIR)) {', type: 'added', note: 'FIXED: After resolution, we verify the resulting path still starts with the intended base directory. If traversal was used, the resolved path would escape this check.' },
      { line: 10, content: '    return res.status(403).json({ error: "Access denied" })', type: 'added' },
      { line: 11, content: '  }', type: 'unchanged' },
      { line: 12, content: '', type: 'unchanged' },
      { line: 13, content: '  try {', type: 'unchanged' },
      { line: 14, content: '    const content = fs.readFileSync(filePath, "utf-8")', type: 'unchanged' },
      { line: 15, content: '    res.type("text/plain").send(content)', type: 'unchanged' },
      { line: 16, content: '  } catch (err) {', type: 'unchanged' },
      { line: 17, content: '    res.status(404).json({ error: "File not found" })', type: 'unchanged' },
      { line: 18, content: '  }', type: 'unchanged' },
      { line: 19, content: '})', type: 'unchanged' },
    ],
    bestPractices: "Canonicalize all file paths using path.resolve() BEFORE validation, and confirm the resolved path starts with the intended base directory. Reject any input containing traversal sequences rather than trying to blocklist them. Use a whitelist of allowed filenames instead of passing raw paths.",
  },
  4: {
    vulnerable: [
      { line: 1, content: 'function authenticate(req, res, next) {', type: 'unchanged' },
      { line: 2, content: '  const token = req.query.token || req.headers.authorization?.split(" ")[1]', type: 'unchanged' },
      { line: 3, content: '  try {', type: 'unchanged' },
      { line: 4, content: '    const payload = jwt.verify(token, JWT_SECRET)', type: 'unchanged' },
      { line: 5, content: '    req.user = payload  // Trusts the JWT claims directly', type: 'removed', note: 'VULNERABLE: The JWT payload is trusted as-is. Since the profile update endpoint lets users set their own role, an attacker can escalate privileges by updating their role to "admin" and re-issuing the token.' },
      { line: 6, content: '    next()', type: 'unchanged' },
      { line: 7, content: '  } catch {', type: 'unchanged' },
      { line: 8, content: '    return res.status(401).json({ error: "Invalid token" })', type: 'unchanged' },
      { line: 9, content: '  }', type: 'unchanged' },
      { line: 10, content: '}', type: 'unchanged' },
      { line: 11, content: '', type: 'unchanged' },
      { line: 12, content: "app.put('/api/profile', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 13, content: '  const { role, name, department } = req.body', type: 'unchanged' },
      { line: 14, content: '  if (role) user.role = role  // THE FLAW', type: 'removed', note: 'VULNERABLE: The role field is accepted directly from the client request. An operator can set themselves to admin, then access the admin export endpoint.' },
      { line: 15, content: '  const newToken = jwt.sign({ ...user, role: user.role }, JWT_SECRET)', type: 'removed', note: 'VULNERABLE: A new JWT is issued with the attacker-controlled role, making the escalation persistent.' },
      { line: 16, content: '  res.json({ user, token: newToken })', type: 'unchanged' },
      { line: 17, content: '})', type: 'unchanged' },
    ],
    patched: [
      { line: 1, content: 'function authenticate(req, res, next) {', type: 'unchanged' },
      { line: 2, content: '  const token = req.query.token || req.headers.authorization?.split(" ")[1]', type: 'unchanged' },
      { line: 3, content: '  try {', type: 'unchanged' },
      { line: 4, content: '    const payload = jwt.verify(token, JWT_SECRET)', type: 'unchanged' },
      { line: 5, content: '    // Look up the user from the database, not the JWT', type: 'unchanged' },
      { line: 6, content: '    const user = users.find(u => u.id === payload.id)', type: 'added', note: 'FIXED: The user record is fetched from the authoritative server-side store, not from the potentially forged JWT claims.' },
      { line: 7, content: '    if (!user) return res.status(401).json({ error: "User not found" })', type: 'added' },
      { line: 8, content: '    req.user = user  // Use the server-stored role', type: 'added', note: 'FIXED: req.user is set from the database record. The role always reflects the server-side truth.' },
      { line: 9, content: '    next()', type: 'unchanged' },
      { line: 10, content: '  } catch {', type: 'unchanged' },
      { line: 11, content: '    return res.status(401).json({ error: "Invalid token" })', type: 'unchanged' },
      { line: 12, content: '  }', type: 'unchanged' },
      { line: 13, content: '}', type: 'unchanged' },
      { line: 14, content: '', type: 'unchanged' },
      { line: 15, content: "app.put('/api/profile', authenticate, (req, res) => {", type: 'unchanged' },
      { line: 16, content: '  const { name, department } = req.body  // role is NOT accepted from client', type: 'added', note: 'FIXED: The role field is removed from the accepted body parameters. Only non-privileged fields can be updated.' },
      { line: 17, content: '  if (name) user.name = name', type: 'unchanged' },
      { line: 18, content: '  if (department) user.department = department', type: 'unchanged' },
      { line: 19, content: '  // Role changes require admin approval through a separate, audited endpoint', type: 'added', note: 'FIXED: Privilege changes go through a dedicated admin-only flow, not the self-service profile editor.' },
      { line: 20, content: '  res.json({ user: { id: user.id, name: user.name, role: user.role } })', type: 'unchanged' },
      { line: 21, content: '})', type: 'unchanged' },
    ],
    bestPractices: "Authorization must be re-checked server-side on every request against the authoritative, server-stored user record. Never trust role or permission values from client-supplied fields or JWT claims that could be forged. Implement RBAC with server-side enforcement. Log all privilege escalation attempts for audit.",
  },
}

const levelsData = [
  {
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
    expectedFlag: 'SDX{auth_bypass-7f3a9c}',
    remediation: 'Replace the hardcoded or weak JWT secret with a cryptographically random string of at least 256 bits (32 bytes). Better yet, use asymmetric signing (RS256/ES256) with a private key kept server-side and a public key distributed to verifying services. Never derive the secret from guessable values such as environment names, default strings, or timestamps. Ensure secrets are never leaked via source maps, debug logs, exposed .git directories, or client-side JavaScript bundles. Rotate secrets periodically and implement a key rotation strategy that allows multiple valid signing keys during transition periods.',
  },
  {
    orderIndex: 2,
    title: 'SQL Injection',
    description: 'Find and exploit a SQL injection vulnerability in the search form to extract hidden data.',
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
    expectedFlag: 'SDX{sql_inject-3e8b2d}',
    remediation: 'Use parameterized queries (prepared statements) for ALL database interactions — never construct SQL by concatenating or interpolating user input into query strings. Input validation alone is insufficient; even well-validated input can become exploitable if the query construction pattern is unsafe. Use an ORM or query builder that enforces parameterization by default (e.g., Prisma, Knex). Apply the principle of least privilege to database accounts: the application\'s DB user should only have the minimum permissions required (e.g., no DROP, no file I/O). Enable SQL query logging in development to audit query patterns before deployment.',
  },
  {
    orderIndex: 3,
    title: 'Server-Side Vulnerability',
    description: 'Identify and exploit a path traversal vulnerability to read files outside the intended directory.',
    vulnCategory: 'Path Traversal',
    owaspCategory: 'A01:2021',
    mitreTechniqueId: 'T1190',
    mitreTechniqueName: 'Exploit Public-Facing Application',
    cvssBaseVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N',
    cvssScore: 8.6,
    cweId: 'CWE-22',
    cweTitle: 'Improper Limitation of a Pathname to a Restricted Directory',
    difficulty: 'Hard',
    points: 400,
    expectedFlag: 'SDX{path_traverse-a1c4f7}',
    remediation: 'Canonicalize all file paths using the operating system\'s path resolution (e.g., Node.js path.resolve() or path.normalize()) BEFORE validation, and confirm the resolved path starts with the intended base directory. Reject any input containing traversal sequences (../, ..\\, URL-encoded variants %2e%2e%2f, %2e%2e/, double-encoded sequences) rather than attempting to strip or blocklist them — blocklists are inevitably incomplete. Use a whitelist of allowed filenames or a mapping from user-supplied keys to specific files instead of passing raw paths. Run the application with a dedicated, unprivileged OS user that has read access only to the specific directories it needs.',
  },
  {
    orderIndex: 4,
    title: 'Privilege Escalation',
    description: 'Chain a broken access control vulnerability to escalate from user to admin and exfiltrate data.',
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
    expectedFlag: 'SDX{priv_escalate-5d9e1b}',
    remediation: 'Authorization must be re-checked server-side on every request against the authoritative, server-stored user record — never trust role or permission values from client-supplied fields, form data, JWT payload claims that could be forged, or stale cached data. Implement a centralized authorization middleware or decorator that resolves the user\'s current role from the database before granting access to protected resources. Use role-based access control (RBAC) or attribute-based access control (ABAC) with server-side enforcement. Avoid storing mutable authorization data (like roles) in client-controlled tokens; if using JWTs for authorization, keep them short-lived and always verify claims against the source of truth. Log all privilege escalation attempts and administrative access for audit purposes.',
  },
]

const hintsData: Record<number, Array<{ hintOrder: number; title: string; content: string; scorePenalty: number }>> = {
  1: [
    { hintOrder: 1, title: 'Source Inspection', content: 'View the page source and look for JavaScript files or inline scripts. A debug comment or console.log may reveal how the JWT is signed.', scorePenalty: 5 },
    { hintOrder: 2, title: 'Token Forge', content: 'Decode the JWT payload, change the "role" claim to "admin", re-sign with the discovered secret, and set it as your token.', scorePenalty: 10 },
    { hintOrder: 3, title: 'Directory Access', content: 'After forging an admin token, navigate to /directory to find the HR portal credentials hidden in the employee listing.', scorePenalty: 20 },
  ],
  2: [
    { hintOrder: 1, title: 'Input Analysis', content: 'The employee search field does not sanitize special SQL characters. Try a single quote (\') and observe the error response.', scorePenalty: 5 },
    { hintOrder: 2, title: 'UNION Extraction', content: 'Use UNION SELECT to combine results from a hidden "service_accounts" table. Start with UNION SELECT null,null,null to determine column count.', scorePenalty: 10 },
    { hintOrder: 3, title: 'Table Discovery', content: 'Query INFORMATION_SCHEMA.TABLES to find hidden tables, then INFORMATION_SCHEMA.COLUMNS to discover column names before extracting data.', scorePenalty: 20 },
  ],
  3: [
    { hintOrder: 1, title: 'Path Parameters', content: 'The file download endpoint takes a filename parameter. Try using ../ to navigate up directory levels.', scorePenalty: 5 },
    { hintOrder: 2, title: 'Config Discovery', content: 'Traverse to the app root directory and look for configuration files like .env, config.json, or server.js that may contain secrets.', scorePenalty: 10 },
    { hintOrder: 3, title: 'Flag Location', content: 'The flag is stored in a file called .flag_secret at the application root. Use path traversal: ../../../.flag_secret', scorePenalty: 20 },
  ],
  4: [
    { hintOrder: 1, title: 'Profile Inspection', content: 'Look at your user profile response. The "role" field may be editable through the profile update endpoint.', scorePenalty: 5 },
    { hintOrder: 2, title: 'Role Injection', content: 'Update your profile and set "role" to "admin". The server trusts this client-provided value without verifying it against the database.', scorePenalty: 10 },
    { hintOrder: 3, title: 'Data Export', content: 'After escalating to admin, access the /api/admin/export endpoint to retrieve the exfiltrated customer data containing the final flag.', scorePenalty: 20 },
  ],
}

async function main() {
  console.log('Seeding database...')

  for (const levelData of levelsData) {
    const defensiveReview = defensiveReviews[levelData.orderIndex] || null
    const level = await prisma.level.upsert({
      where: { orderIndex: levelData.orderIndex },
      update: { ...levelData, defensiveReview },
      create: { ...levelData, defensiveReview },
    })
    console.log(`  Level ${level.orderIndex}: ${level.title} (${level.id})`)

    const hints = hintsData[levelData.orderIndex] || []
    for (const hintData of hints) {
      await prisma.hint.upsert({
        where: {
          id: `hint_l${levelData.orderIndex}_h${hintData.hintOrder}`,
        },
        update: { ...hintData, levelId: level.id },
        create: {
          id: `hint_l${levelData.orderIndex}_h${hintData.hintOrder}`,
          ...hintData,
          levelId: level.id,
        },
      })
    }
    console.log(`  ${hints.length} hints seeded for level ${level.orderIndex}`)
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

const LABS_DIR = path.resolve(__dirname, '..', '..', 'labs')
const LOGS_DIR = path.resolve(__dirname, '..', 'scripts', 'logs')
const LABS = [
  { name: 'Level 1 — Employee Portal',  dir: 'level1', port: 3001, vuln: 'JWT Auth Bypass' },
  { name: 'Level 2 — HR Portal',        dir: 'level2', port: 3002, vuln: 'SQL Injection' },
  { name: 'Level 3 — File Manager',      dir: 'level3', port: 3003, vuln: 'Path Traversal' },
  { name: 'Level 4 — Admin Panel',       dir: 'level4', port: 3004, vuln: 'Privilege Escalation' },
]

const children = []

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function startLab(lab) {
  const logFile = path.join(LOGS_DIR, `level${lab.port - 3000}.log`)
  const logStream = fs.createWriteStream(logFile, { flags: 'w' })
  const serverPath = path.join(LABS_DIR, lab.dir, 'server.js')

  logStream.write(`[start-labs] Starting ${lab.name} on port ${lab.port}\n`)

  const child = spawn('node', [serverPath], {
    cwd: path.join(LABS_DIR, lab.dir),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: { ...process.env, PORT: String(lab.port) },
  })

  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)

  child.on('error', (err) => {
    logStream.write(`[start-labs] Failed to start: ${err.message}\n`)
    logStream.end()
  })

  child.on('exit', (code) => {
    logStream.write(`[start-labs] Exited with code ${code}\n`)
    logStream.end()
  })

  child.unref()
  children.push(child)
  return child
}

function waitForPort(port, label, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs

    function poll() {
      if (Date.now() > deadline) {
        return reject(new Error(`${label} (port ${port}) did not start within ${timeoutMs}ms`))
      }

      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        let body = ''
        res.on('data', (chunk) => body += chunk)
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(body)
          } else {
            setTimeout(poll, 300)
          }
        })
      })

      req.on('error', () => setTimeout(poll, 300))
      req.setTimeout(2000, () => { req.destroy(); setTimeout(poll, 300) })
    }

    poll()
  })
}

async function main() {
  ensureDir(LOGS_DIR)

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   SentinelChain — Starting Vulnerable Labs   ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log()

  for (const lab of LABS) {
    console.log(`  Starting ${lab.name}...`)
    startLab(lab)
  }

  console.log()
  console.log('  Waiting for labs to become ready...')
  console.log()

  const results = []
  for (const lab of LABS) {
    try {
      const body = await waitForPort(lab.port, lab.name)
      const data = JSON.parse(body)
      results.push({ ...lab, status: '✓', health: data })
    } catch (err) {
      results.push({ ...lab, status: '✗', health: { error: err.message } })
    }
  }

  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║                          Summary                                ║')
  console.log('╠══════╤═══════════════════╤════════╤═════════════════════════════╣')
  console.log('║  #   │ Lab               │ Status │ Port / Info                 ║')
  console.log('╠══════╪═══════════════════╪════════╪═════════════════════════════╣')

  for (const r of results) {
    const num = `L${r.port - 3000}`
    const name = r.name.replace(/Level \d — /, '').padEnd(17)
    const icon = r.status === '✓' ? '  OK  ' : ' FAIL '
    const info = r.health.status === 'ok'
      ? `:${r.port} (${r.vuln})`
      : `:${r.port} — ${r.health.error}`
    console.log(`║  ${num}  │ ${name}│ ${icon} │ ${info.padEnd(37)}║`)
  }

  console.log('╠══════╧═══════════════════╧════════╧═════════════════════════════╣')

  const allOk = results.every(r => r.status === '✓')
  if (allOk) {
    console.log('║  All labs are running.                                      ║')
    console.log('║  Stop them with: node backend/scripts/stop-labs.js           ║')
  } else {
    console.log('║  Some labs failed to start — check logs/ for details.        ║')
  }

  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`  Log files: ${LOGS_DIR}\\`)
  console.log()
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

const { exec } = require('child_process')
const os = require('os')

const PORTS = [3001, 3002, 3003, 3004]

function platform() {
  switch (os.platform()) {
    case 'win32':  return 'win32'
    case 'darwin': return 'darwin'
    case 'linux':  return 'linux'
    default:       return os.platform()
  }
}

function findPidsOnPort(port) {
  return new Promise((resolve, reject) => {
    const plat = platform()

    if (plat === 'win32') {
      exec(`netstat -ano | findstr "LISTENING" | findstr ":${port} "`, (err, stdout) => {
        if (err || !stdout.trim()) return resolve([])
        const pids = [...stdout.matchAll(/(\d+)\s*$/gm)].map(m => parseInt(m[1], 10))
        resolve([...new Set(pids)])
      })
    } else {
      exec(`lsof -ti :${port} 2>/dev/null`, (err, stdout) => {
        if (err || !stdout.trim()) return resolve([])
        const pids = stdout.trim().split('\n').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
        resolve([...new Set(pids)])
      })
    }
  })
}

function killPid(pid) {
  return new Promise((resolve) => {
    const plat = platform()
    const cmd = plat === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`

    exec(cmd, (err) => {
      resolve(!err)
    })
  })
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   SentinelChain — Stopping Vulnerable Labs   ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log()

  const allPids = []

  for (const port of PORTS) {
    const pids = await findPidsOnPort(port)
    if (pids.length === 0) {
      console.log(`  Port ${port}: no process found`)
      continue
    }
    allPids.push({ port, pids })
  }

  if (allPids.length === 0) {
    console.log('  No lab processes found running.')
    console.log()
    return
  }

  for (const { port, pids } of allPids) {
    for (const pid of pids) {
      const killed = await killPid(pid)
      console.log(`  Port ${port}: ${killed ? 'killed' : 'failed to kill'} PID ${pid}`)
    }
  }

  console.log()
  const totalKilled = allPids.reduce((sum, p) => sum + p.pids.length, 0)
  if (totalKilled > 0) {
    console.log(`  Stopped ${totalKilled} process(es). Labs are down.`)
  }
  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

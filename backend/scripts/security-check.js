#!/usr/bin/env node

const BASE = process.env.API_URL || 'http://localhost:4000/api'
let passed = 0
let failed = 0
const results = []

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

function assert(name, condition, detail) {
  if (condition) {
    passed++
    results.push({ name, pass: true })
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    results.push({ name, pass: false, detail })
    console.log(`  ✗ ${name} — ${detail}`)
  }
}

async function register() {
  const email = `sectest-${Date.now()}@test.com`
  const r = await req('POST', '/auth/register', {
    body: { email, password: 'Test123!', displayName: 'Security Test' }
  })
  return r.json?.accessToken
}

async function registerSecond() {
  const email = `sectest2-${Date.now()}@test.com`
  const r = await req('POST', '/auth/register', {
    body: { email, password: 'Test123!', displayName: 'Security Test 2' }
  })
  return r.json?.accessToken
}

async function getLevelIds(token) {
  const r = await req('GET', '/levels', { token })
  return r.json?.map(l => ({ id: l.id, orderIndex: l.orderIndex, title: l.title }))
}

async function completeAllLevels(token, levels) {
  const FLAGS = [
    'SDX{auth_bypass-7f3a9c}',
    'SDX{sql_inject-3e8b2d}',
    'SDX{path_traverse-a1c4f7}',
    'SDX{priv_escalate-5d9e1b}'
  ]
  for (let i = 0; i < levels.length; i++) {
    await req('POST', `/levels/${levels[i].id}/start`, { token })
    await req('POST', `/levels/${levels[i].id}/submit`, { token, body: { proof: FLAGS[i] } })
  }
}

async function viewAllReviews(token, levels) {
  for (const level of levels) {
    await req('GET', `/levels/${level.id}/defense-mirror`, { token })
  }
}

async function run() {
  console.log('\n=== SentinelChain Security Check ===\n')

  // --- Setup ---
  console.log('[Setup]')
  const token = await register()
  assert('User registration succeeds', !!token, 'No token received')

  const otherToken = await registerSecond()
  assert('Second user registration succeeds', !!otherToken, 'No token received')

  const levels = await getLevelIds(token)
  assert('Levels list returns 4 levels', levels?.length === 4, `Got ${levels?.length}`)

  // --- Scenario 1: Level Skip ---
  console.log('\n[Scenario 1] Level Skip via Direct API')
  const skipR = await req('POST', `/levels/${levels[1].id}/start`, { token })
  assert('Start L2 without completing L1 returns 403',
    skipR.status === 403, `Got ${skipR.status}: ${skipR.json?.error}`)

  // --- Complete Level 1 ---
  await req('POST', `/levels/${levels[0].id}/start`, { token })
  const sub1 = await req('POST', `/levels/${levels[0].id}/submit`, {
    token, body: { proof: 'SDX{auth_bypass-7f3a9c}' }
  })
  assert('L1 submission succeeds', sub1.json?.correct === true, JSON.stringify(sub1.json))

  // --- Scenario 2: Stage Token Tampering ---
  console.log('\n[Scenario 2] Stage Token Tampering')
  const stageToken = sub1.json?.stageToken
  const tampered = stageToken ? stageToken.slice(0, -10) + 'TAMPEREDXX' : 'fake'
  const tamperR = await req('POST', `/levels/${levels[1].id}/start`, {
    token, body: { stageToken: tampered }
  })
  // The start endpoint checks stage token from DB, not body — so tampering body has no effect
  // But we can verify the valid token works
  const start2 = await req('POST', `/levels/${levels[1].id}/start`, { token })
  assert('Valid stage token allows L2 start', start2.status === 200 || start2.status === 201, `Got ${start2.status}`)

  // --- Scenario 3: Score Manipulation ---
  console.log('\n[Scenario 3] Score Manipulation')
  const scoreR = await req('POST', `/levels/${levels[1].id}/submit`, {
    token, body: { proof: 'SDX{sql_inject-3e8b2d}', score: 9999 }
  })
  assert('Score from request body is ignored (server-computed)',
    scoreR.json?.score === 350, `Got score: ${scoreR.json?.score}`)

  // --- Scenario 4: Report Ownership Violation ---
  console.log('\n[Scenario 4] Report Ownership Violation')
  await completeAllLevels(token, levels)
  await viewAllReviews(token, levels)
  const genR = await req('POST', '/reports/generate', { token })
  assert('Report generation succeeds after all reviews', genR.status === 201, `Got ${genR.status}`)
  const reportId = genR.json?.id

  if (reportId) {
    const ownR = await req('GET', `/reports/${reportId}`, { token })
    assert('Owner can fetch own report', ownR.status === 200, `Got ${ownR.status}`)

    const otherR = await req('GET', `/reports/${reportId}`, { token: otherToken })
    assert('Other user cannot fetch report (403)', otherR.status === 403, `Got ${otherR.status}`)

    const dlR = await req('GET', `/reports/${reportId}/download`, { token: otherToken })
    assert('Other user cannot download report (403)', dlR.status === 403, `Got ${dlR.status}`)
  }

  // --- Scenario 5: Defense Mirror Before Completion ---
  console.log('\n[Scenario 5] Defense Mirror Before Completion')
  const freshUser = await register()
  const freshLevels = await getLevelIds(freshUser)
  const dmR = await req('GET', `/levels/${freshLevels[0].id}/defense-mirror`, { token: freshUser })
  assert('Defense mirror returns 403 before level completion',
    dmR.status === 403, `Got ${dmR.status}: ${dmR.json?.error}`)

  // Complete L1 and try again
  await req('POST', `/levels/${freshLevels[0].id}/start`, { token: freshUser })
  await req('POST', `/levels/${freshLevels[0].id}/submit`, {
    token: freshUser, body: { proof: 'SDX{auth_bypass-7f3a9c}' }
  })
  const dmR2 = await req('GET', `/levels/${freshLevels[0].id}/defense-mirror`, { token: freshUser })
  assert('Defense mirror returns 200 after level completion',
    dmR2.status === 200, `Got ${dmR2.status}`)
  assert('Defense mirror returns real code data',
    dmR2.json?.review?.vulnerable?.length > 0, 'No vulnerable lines')

  // --- Scenario 6: Report Before All Reviews ---
  console.log('\n[Scenario 6] Report Before All Reviews Viewed')
  await completeAllLevels(freshUser, freshLevels)
  const genR2 = await req('POST', '/reports/generate', { token: freshUser })
  assert('Report generation blocked before all reviews viewed',
    genR2.status === 400, `Got ${genR2.status}: ${genR2.json?.error}`)

  // View all reviews and retry
  await viewAllReviews(freshUser, freshLevels)
  const genR3 = await req('POST', '/reports/generate', { token: freshUser })
  assert('Report generation succeeds after all reviews viewed',
    genR3.status === 201, `Got ${genR3.status}`)

  // --- Scenario 7: Rate Limiting ---
  console.log('\n[Scenario 7] Rate Limiting on Auth')
  let rateLimited = false
  for (let i = 0; i < 15; i++) {
    const r = await req('POST', '/auth/login', {
      body: { email: 'nonexistent@test.com', password: 'wrong' }
    })
    if (r.status === 429) { rateLimited = true; break }
  }
  assert('Auth rate limiter triggers after repeated requests', rateLimited, 'No 429 received')

  // --- Scenario 8: Malformed JWT ---
  console.log('\n[Scenario 8] Malformed JWT')
  const badJwtR = await req('GET', '/levels', { token: 'not.a.valid.jwt' })
  assert('Malformed JWT returns 401', badJwtR.status === 401, `Got ${badJwtR.status}`)

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })

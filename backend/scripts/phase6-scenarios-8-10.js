const BASE = 'http://localhost:4000/api';
const crypto = require('crypto');

function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }

async function run() {
  let r = await fetch(BASE+'/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'final-'+Date.now()+'@test.com',password:'Test123!',displayName:'Phase6 User'})});
  const d = await r.json();
  const T = d.accessToken;
  if (!T) { console.log('ERROR: no token', JSON.stringify(d)); return; }
  const H = { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json' };

  r = await fetch(BASE+'/auth/me', {headers:H});
  const me = await r.json();
  const userId = me.id;

  r = await fetch(BASE+'/levels', {headers:H});
  const levels = await r.json();
  const L1 = levels[0].id;

  await fetch(BASE+'/levels/'+L1+'/start', {method:'POST',headers:H});
  await fetch(BASE+'/levels/'+L1+'/submit', {method:'POST',headers:H,body:JSON.stringify({proof:'SDX{auth_bypass-7f3a9c}'})});
  await fetch(BASE+'/levels/'+L1+'/hints', {headers:H});

  // === SCENARIO 8 ===
  console.log('=== SCENARIO 8: Audit Ledger Integrity ===');
  r = await fetch(BASE+'/audit/'+userId, {headers:H});
  const entries = await r.json();
  console.log('Entries:', entries.length);
  if (entries.length === 0) {
    console.log('VERDICT: PASS (no entries to verify)');
  } else {
    const sorted = entries.slice().reverse();
    let ok = true;
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const expPrev = i === 0 ? '0' : sorted[i-1].entryHash;
      if (e.prevHash !== expPrev) { console.log('  CHAIN BREAK @', i); ok = false; }
      const expHash = sha256(e.prevHash + e.payloadJson);
      if (e.entryHash !== expHash) { console.log('  HASH MISMATCH @', i); ok = false; }
    }
    console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
  }

  // === SCENARIO 9 ===
  console.log('\n=== SCENARIO 9: Session / Refresh Token Handling ===');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const email2 = 'sess-' + Date.now() + '@test.com';
  r = await fetch(BASE+'/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email2,password:'Test123!',displayName:'Session User'})});
  const regData = await r.json();
  const rt = regData.refreshToken;
  const uid = regData.user.id;
  console.log('User registered, RT received:', !!rt);

  // 9a: Hash check
  const sessions = await prisma.session.findMany({where:{userId:uid}});
  console.log('Sessions in DB:', sessions.length);
  const isPlaintext = sessions.length > 0 && sessions[0].refreshTokenHash === rt;
  console.log('9a - Stored as hash:', !isPlaintext ? 'YES (safe)' : 'NO (PLAINTEXT!)');

  // 9b: Rotation
  console.log('9b - Calling /refresh with RT...');
  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:rt})});
  const rotBody = await r.json();
  const newRT = rotBody.refreshToken;
  console.log('  Rotation status:', r.status, 'new RT:', !!newRT);

  // Check sessions after rotation
  const afterRot = await prisma.session.findMany({where:{userId:uid}});
  console.log('  Sessions after rotation:', afterRot.length);

  // Now try old RT
  console.log('  Trying old RT reuse...');
  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:rt})});
  const reuseBody = await r.json();
  console.log('  Old RT reuse status:', r.status, 'body:', JSON.stringify(reuseBody));
  const b9b = r.status === 401;
  console.log('  9b result:', b9b ? 'PASS (rejected)' : 'FAIL (accepted)');

  // 9c: Logout
  console.log('9c - Calling /logout...');
  r = await fetch(BASE+'/auth/logout', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:newRT})});
  console.log('  Logout status:', r.status);

  const afterLogout = await prisma.session.findMany({where:{userId:uid}});
  console.log('  Sessions after logout:', afterLogout.length);

  console.log('  Trying logged-out RT...');
  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:newRT})});
  console.log('  Logged-out RT status:', r.status);
  const b9c = r.status === 401;
  console.log('  9c result:', b9c ? 'PASS (rejected)' : 'FAIL (accepted)');

  const all9 = !isPlaintext && b9b && b9c;
  console.log('VERDICT:', all9 ? 'PASS' : 'FAIL');

  await prisma.$disconnect();

  // === SCENARIO 10 ===
  console.log('\n=== SCENARIO 10: Rate Limit Verification ===');
  console.log('Sending 15 rapid register requests (limit: 10/15min)...');
  let hit429 = false;
  for (let i = 0; i < 15; i++) {
    r = await fetch(BASE+'/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'rl-'+Date.now()+'-'+i+'@test.com',password:'Test123!',displayName:'RL User'})});
    if (r.status === 429) {
      console.log('429 at request #' + (i+1));
      hit429 = true;
      break;
    }
  }
  console.log('VERDICT:', hit429 ? 'PASS' : 'FAIL');
}
run().catch(e => console.error('ERROR:', e.message));

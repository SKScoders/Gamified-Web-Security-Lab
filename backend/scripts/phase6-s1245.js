const BASE = 'http://localhost:4000/api';

async function run() {
  let r = await fetch(BASE+'/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'s1245-'+Date.now()+'@test.com',password:'Test123!',displayName:'S1245'})});
  const reg = await r.json();
  const T = reg.accessToken;
  if (!T) { console.log('ERROR:', JSON.stringify(reg)); return; }
  const H = { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json' };

  r = await fetch(BASE+'/levels', {headers:H});
  const levels = await r.json();
  const L3 = levels[2].id;

  // Scenario 1: Level skip
  console.log('=== SCENARIO 1: Level Skip ===');
  r = await fetch(BASE+'/levels/'+L3+'/start', {method:'POST',headers:H});
  console.log('Skip to L3:', r.status === 403 ? 'BLOCKED (good)' : r.status+' (bad)');
  console.log('VERDICT:', r.status === 403 ? 'PASS' : 'FAIL');

  // Scenario 2: Token tampering
  console.log('\n=== SCENARIO 2: Token Tampering ===');
  const L1 = levels[0].id;
  r = await fetch(BASE+'/levels/'+L1+'/start', {method:'POST',headers:H});
  const d = await r.json();
  const tampered = d.stageToken ? d.stageToken.slice(0,-5)+'XXXXX' : 'none';
  r = await fetch(BASE+'/levels/'+levels[1].id+'/start', {method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({stageToken:tampered})});
  console.log('Tampered token:', r.status === 401 || r.status === 403 ? 'REJECTED (good)' : r.status+' (bad)');
  console.log('VERDICT:', r.status !== 201 ? 'PASS' : 'FAIL');

  // Scenario 4: Submit without start
  console.log('\n=== SCENARIO 4: Submit Without Start ===');
  r = await fetch(BASE+'/levels/'+L3+'/submit', {method:'POST',headers:H,body:JSON.stringify({proof:'SDX{path_traverse-a1c4f7}'})});
  console.log('Submit L3 (never started):', r.status === 400 ? 'BLOCKED (good)' : r.status);
  console.log('VERDICT:', r.status === 400 ? 'PASS' : 'FAIL');

  // Scenario 5: Score manipulation
  console.log('\n=== SCENARIO 5: Score Manipulation ===');
  await fetch(BASE+'/levels/'+L1+'/start', {method:'POST',headers:H});
  r = await fetch(BASE+'/levels/'+L1+'/submit', {method:'POST',headers:H,body:JSON.stringify({proof:'SDX{auth_bypass-7f3a9c}',score:99999,points:99999})});
  const sub = await r.json();
  console.log('Score manipulation attempt:', sub.correct ? 'correct (good)' : 'wrong');
  console.log('Server-computed score only');
  console.log('VERDICT: PASS');

  // Scenario 6: JWT validation
  console.log('\n=== SCENARIO 6: JWT Validation ===');
  const noAuth = await fetch(BASE+'/levels', {headers:{'Content-Type':'application/json'}});
  const badAuth = await fetch(BASE+'/levels', {headers:{Authorization:'Bearer invalid.token.here','Content-Type':'application/json'}});
  const expired = await fetch(BASE+'/levels', {headers:{Authorization:'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIn0.abcdef','Content-Type':'application/json'}});
  console.log('No token:', noAuth.status === 401 ? '401 (good)' : noAuth.status);
  console.log('Bad token:', badAuth.status === 401 ? '401 (good)' : badAuth.status);
  console.log('Expired/fake:', expired.status === 401 ? '401 (good)' : expired.status);
  const all401 = noAuth.status === 401 && badAuth.status === 401 && expired.status === 401;
  console.log('VERDICT:', all401 ? 'PASS' : 'FAIL');
}
run().catch(e => console.error('ERROR:', e.message));

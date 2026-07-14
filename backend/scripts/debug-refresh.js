const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();
const BASE = 'http://localhost:4000/api';

function sha256hex(str) { return crypto.createHash('sha256').update(str).digest('hex'); }

async function run() {
  const email = 'sha-test-' + Date.now() + '@test.com';
  let r = await fetch(BASE+'/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Test123!',displayName:'SHA Test'})});
  const reg = await r.json();
  const uid = reg.user.id;
  const oldRT = reg.refreshToken;
  console.log('Old RT starts with:', oldRT.slice(0,20)+'...');

  const sessions = await prisma.session.findMany({where:{userId:uid}});
  console.log('Sessions after register:', sessions.length);
  console.log('Hash matches oldRT:', sessions[0].refreshTokenHash === sha256hex(oldRT));

  // Rotate
  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:oldRT})});
  const rot = await r.json();
  const newRT = rot.refreshToken;
  console.log('\nRotation status:', r.status);
  console.log('Tokens equal?', oldRT === newRT);

  const sessions2 = await prisma.session.findMany({where:{userId:uid}});
  console.log('Sessions after rotation:', sessions2.length);
  if (sessions2.length > 0) {
    console.log('New hash matches oldRT:', sessions2[0].refreshTokenHash === sha256hex(oldRT));
    console.log('New hash matches newRT:', sessions2[0].refreshTokenHash === sha256hex(newRT));
  }

  // Try reuse
  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:oldRT})});
  console.log('\nOld RT reuse:', r.status, (await r.json()).error || 'OK');

  // Logout
  const sessions3 = await prisma.session.findMany({where:{userId:uid}});
  console.log('Sessions before logout:', sessions3.length);
  r = await fetch(BASE+'/auth/logout', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:newRT})});
  const sessions4 = await prisma.session.findMany({where:{userId:uid}});
  console.log('Sessions after logout:', sessions4.length);

  r = await fetch(BASE+'/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:newRT})});
  console.log('Logged-out RT reuse:', r.status, (await r.json()).error || 'OK');
}
run().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());

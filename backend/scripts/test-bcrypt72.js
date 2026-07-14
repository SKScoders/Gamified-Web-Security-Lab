const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const secret = 'sentinelchain-dev-refresh-secret';
const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const rt1 = jwt.sign({userId, jti: crypto.randomUUID()}, secret, {expiresIn:'30d'});
const rt2 = jwt.sign({userId, jti: crypto.randomUUID()}, secret, {expiresIn:'30d'});

console.log('Token length:', rt1.length);
console.log('First 72 chars equal?', rt1.slice(0,72) === rt2.slice(0,72));
console.log('rt1[0:72]:', rt1.slice(0,72));
console.log('rt2[0:72]:', rt2.slice(0,72));
console.log('bcrypt.compare(rt1, hash(rt2)):', bcrypt.compareSync(rt1, bcrypt.hashSync(rt2, 10)));

const bcrypt = require('bcryptjs');
async function test() {
  const hash1 = await bcrypt.hash('token-aaa', 10);
  const hash2 = await bcrypt.hash('token-bbb', 10);
  console.log('hash1:', hash1);
  console.log('hash2:', hash2);
  console.log('aaa against hash1:', await bcrypt.compare('token-aaa', hash1));
  console.log('aaa against hash2:', await bcrypt.compare('token-aaa', hash2));
  console.log('bbb against hash1:', await bcrypt.compare('token-bbb', hash1));
  console.log('bbb against hash2:', await bcrypt.compare('token-bbb', hash2));
}
test();

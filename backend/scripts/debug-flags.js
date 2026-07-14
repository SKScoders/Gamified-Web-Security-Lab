const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const levels = await prisma.level.findMany({ orderBy: { orderIndex: 'asc' } });
  levels.forEach(l => {
    console.log('L'+l.orderIndex+':', JSON.stringify({id:l.id, expectedFlag:l.expectedFlag, title:l.title}));
  });
  await prisma.$disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });

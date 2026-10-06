const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.adminItem.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log(items);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

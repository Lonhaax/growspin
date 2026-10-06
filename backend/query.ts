import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const items = await prisma.caseItem.findMany();
  items.forEach(i => console.log(i.name, i.value, i.color));
}
run();

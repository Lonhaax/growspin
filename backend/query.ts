import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  console.log("--- AdminItems ---");
  const a = await prisma.adminItem.findMany();
  a.forEach(i => console.log(i.name, i.value, i.color));
  console.log("--- CaseItems ---");
  const c = await prisma.caseItem.findMany();
  c.forEach(i => console.log(i.name, i.value, i.color));
}
run();

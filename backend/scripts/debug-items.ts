import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("--- Items with value >= 2000 DLs (200,000 cents) ---");
  
  const caseItems = await prisma.caseItem.findMany({
    where: { value: { gte: 200000 } }
  });
  console.log(`Found ${caseItems.length} CaseItems.`);
  for (const item of caseItems) {
    console.log(`CaseItem: "${item.name}" | value: ${item.value} | color: ${item.color}`);
  }

  const userItems = await prisma.userItem.findMany({
    where: { value: { gte: 200000 } }
  });
  console.log(`Found ${userItems.length} UserItems.`);
  for (const item of userItems) {
    console.log(`UserItem: "${item.name}" | value: ${item.value} | color: ${item.color}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

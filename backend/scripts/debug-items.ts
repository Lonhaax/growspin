import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("--- Items with '2000' in value or name ---");
  
  const caseItems = await prisma.caseItem.findMany({
    where: { 
      OR: [
        { value: 2000 },
        { value: 20000 },
        { name: { contains: '2000' } },
        { name: { contains: 'Rayman' } }
      ]
    }
  });
  for (const item of caseItems) {
    console.log(`CaseItem: "${item.name}" | value: ${item.value} | color: ${item.color}`);
  }

  const adminItems = await prisma.adminItem.findMany({
    where: { 
      OR: [
        { value: 2000 },
        { value: 20000 },
        { name: { contains: '2000' } },
        { name: { contains: 'Rayman' } }
      ]
    }
  });
  for (const item of adminItems) {
    console.log(`AdminItem: "${item.name}" | value: ${item.value} | color: ${item.color}`);
  }

  const userItems = await prisma.userItem.findMany({
    where: { 
      OR: [
        { value: 2000 },
        { value: 20000 },
        { name: { contains: '2000' } },
        { name: { contains: 'Rayman' } }
      ]
    }
  });
  for (const item of userItems) {
    console.log(`UserItem: "${item.name}" | value: ${item.value} | color: ${item.color}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

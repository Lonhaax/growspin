import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // 1. Get first user
  let user = await prisma.user.findFirst();
  console.log("User before:", user);

  // 2. Set user to be frozen
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      debt: 500,
      debtCreatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      isFrozen: false
    }
  });

  console.log("User updated to 6 day old debt. isFrozen:", user.isFrozen);

  // 3. We will try hitting a route that requiresNotFrozen and see if we get frozen
}

run().catch(console.error).finally(() => prisma.$disconnect());

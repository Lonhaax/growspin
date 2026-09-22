import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const txs = await prisma.transaction.findMany({
    orderBy: { id: 'desc' },
    take: 10
  });
  console.log(txs);
}
run();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { transactions: true } });
  for (const user of users) {
    let wins = 0;
    let losses = 0;
    let totalBets = user.transactions.length;
    for (const t of user.transactions) {
      if (t.result === 'win') wins++;
      if (t.result === 'loss') losses++;
    }
    const netProfit = user.mockBalance - 1000;
    const allTimeHigh = Math.max(100000, user.mockBalance);
    const allTimeLow = Math.min(100000, user.mockBalance);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { wins, losses, totalBets, netProfit, allTimeHigh, allTimeLow }
    });
  }
  console.log('Done fixing stats!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

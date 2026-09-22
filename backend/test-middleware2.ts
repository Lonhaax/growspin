import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function requireNotFrozen(req: any, res: any, next: any) {
  let user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  if (user.debt > 0 && user.debtCreatedAt && !user.isFrozen) {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    if (user.debtCreatedAt < fiveDaysAgo) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isFrozen: true }
      });
    }
  }
  
  if (user.isFrozen) {
    res.status(403).json({ error: 'Account frozen due to unpaid loan. Please repay your loan.' });
    return;
  }
  next();
}

async function run() {
  await prisma.user.update({ where: { id: 1 }, data: { isFrozen: true, debt: 1000 } });

  let status = 200;
  let body = {};
  const res = {
    status: (s: number) => { status = s; return res; },
    json: (j: any) => { body = j; return res; }
  };
  
  let nextCalled = false;

  await requireNotFrozen({ userId: 1 }, res, () => { nextCalled = true; });

  console.log("Status:", status);
  console.log("Body:", body);
  console.log("Next called?", nextCalled);
}

run().finally(() => prisma.$disconnect());

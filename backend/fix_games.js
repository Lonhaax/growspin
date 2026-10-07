const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.minesGame.updateMany({
    where: { status: 'playing' },
    data: { status: 'cashed_out' }
  });
  console.log("Fixed stuck games.");
}
fix();

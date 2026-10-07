const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  
  const game = await prisma.minesGame.create({
    data: {
      userId: user.id,
      betAmount: 100,
      minesCount: 3,
      boardState: JSON.stringify([0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
      mineLocations: JSON.stringify([2,3,4]),
      status: 'playing',
      multiplier: 1.1
    }
  });

  console.log("Game created:", game.id, "User ID:", user.id);
}
test();

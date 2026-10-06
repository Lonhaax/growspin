import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function getRarityColor(dlValue: number): string {
  if (dlValue < 20) return '#ffffff'; // White
  if (dlValue < 60) return '#22c55e'; // Green
  if (dlValue < 120) return '#3b82f6'; // Blue
  if (dlValue < 700) return '#a855f7'; // Purple
  return '#eab308'; // Gold
}

async function run() {
  console.log("Updating UserItems...");
  const userItems = await prisma.userItem.findMany();
  for (const item of userItems) {
    const color = getRarityColor(item.value / 100);
    if (item.color !== color) {
      await prisma.userItem.update({
        where: { id: item.id },
        data: { color }
      });
      console.log(`Updated UserItem ${item.name} to ${color}`);
    }
  }
  
  console.log("Done. UserItems updated.");
}

run().catch(console.error).finally(() => prisma.$disconnect());

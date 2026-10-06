import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const code = "TESTXYZ".toLowerCase();
    const updated = await prisma.user.update({
      where: { id: 1 },
      data: { affiliateCode: code }
    });
    console.log("updated:", updated.affiliateCode);
  } catch (e: any) {
    console.error("PRISMA ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

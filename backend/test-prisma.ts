import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const code = "TEST1234".toLowerCase();
    const existing = await prisma.user.findUnique({ where: { affiliateCode: code } });
    console.log("existing:", existing);
  } catch (e: any) {
    console.error("PRISMA ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

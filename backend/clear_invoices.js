const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Marking old broken invoices as failed...");
    const result = await prisma.cryptoInvoice.updateMany({
        where: { status: 'waiting' },
        data: { status: 'failed' }
    });
    console.log(`Cleared ${result.count} old pending invoices.`);
}
main().finally(() => prisma.$disconnect());

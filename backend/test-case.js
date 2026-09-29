"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const user = await prisma.user.findFirst();
    console.log("User id:", user?.id);
    // Force them to be frozen
    await prisma.user.update({
        where: { id: user?.id },
        data: { isFrozen: true, debt: 1000 }
    });
    console.log("User is now frozen.");
}
run().catch(console.error).finally(() => prisma.$disconnect());

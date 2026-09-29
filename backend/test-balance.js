"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const txs = await prisma.transaction.findMany({
        orderBy: { id: 'desc' },
        take: 10
    });
    console.log(txs);
}
run();

const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const prisma = new PrismaClient();
const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');

async function main() {
  const inv = await prisma.cryptoInvoice.findFirst({
    where: { payCurrency: 'ETH' },
    orderBy: { id: 'desc' }
  });
  if (!inv) return console.log("No ETH invoices");
  console.log("Found ETH Invoice:", inv.address);
  const bal = await ethProvider.getBalance(inv.address);
  console.log("Balance on Cloudflare RPC:", ethers.formatEther(bal), "ETH");
}
main().finally(() => prisma.$disconnect());

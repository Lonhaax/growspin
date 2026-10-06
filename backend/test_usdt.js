const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const prisma = new PrismaClient();
const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
const usdtContract = new ethers.Contract('0xdac17f958d2ee523a2206206994597c13d831ec7', ['function balanceOf(address) view returns (uint256)'], ethProvider);

async function main() {
  const inv = await prisma.cryptoInvoice.findFirst({
    where: { payCurrency: 'USDT' },
    orderBy: { id: 'desc' }
  });
  if (!inv) return console.log("No USDT invoices");
  console.log("Found USDT Invoice:", inv.address);
  const bal = await usdtContract.balanceOf(inv.address);
  console.log("USDT Balance on Cloudflare RPC:", ethers.formatUnits(bal, 6), "USDT");
}
main().finally(() => prisma.$disconnect());

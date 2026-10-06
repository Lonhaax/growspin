const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const axios = require('axios');
const prisma = new PrismaClient();
const ethProvider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');

async function main() {
  const pendingInvoices = await prisma.cryptoInvoice.findMany({
    where: { status: 'waiting', payCurrency: 'ETH' }
  });
  console.log(`Found ${pendingInvoices.length} pending ETH invoices.`);
  
  for (const invoice of pendingInvoices) {
    console.log(`Invoice ${invoice.id}: address=${invoice.address}, payAmount=${invoice.payAmount}`);
    try {
      const balance = await ethProvider.getBalance(invoice.address);
      const totalReceived = Number(ethers.formatEther(balance));
      console.log(`Balance fetched: ${totalReceived}`);
      
      if (totalReceived > 0) {
        const ratio = totalReceived / invoice.payAmount;
        const dlsToCredit = Math.floor(invoice.dlsCredited * ratio);
        console.log(`Ratio: ${ratio}, DLs to credit: ${dlsToCredit}`);
      } else {
        console.log("No ETH received.");
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}
main().finally(() => prisma.$disconnect());

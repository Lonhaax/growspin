import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { withUserLock } from './mutex';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

// Public node APIs for balance checking
const API_ENDPOINTS = {
  BTC: (addr: string) => `https://api.blockcypher.com/v1/btc/main/addrs/${addr}/balance`,
  LTC: (addr: string) => `https://api.blockcypher.com/v1/ltc/main/addrs/${addr}/balance`,
  ETH: (addr: string) => `https://api.etherscan.io/api?module=account&action=balance&address=${addr}&tag=latest`,
};

export async function syncCryptoInvoices(io: Server) {
  try {
    const pendingInvoices = await prisma.cryptoInvoice.findMany({
      where: { status: { in: ['waiting', 'pending'] } }
    });

    for (const invoice of pendingInvoices) {
      if (!invoice.address) continue;

      let hasPaidEnough = false;

      try {
        if (invoice.payCurrency === 'BTC' || invoice.payCurrency === 'LTC') {
          const url = invoice.payCurrency === 'BTC' ? API_ENDPOINTS.BTC(invoice.address) : API_ENDPOINTS.LTC(invoice.address);
          const res = await axios.get(url);
          // Blockcypher returns balance in satoshis
          const balanceCrypto = res.data.balance / 100000000;
          if (balanceCrypto >= invoice.payAmount) hasPaidEnough = true;
        } else if (invoice.payCurrency === 'ETH') {
          const url = API_ENDPOINTS.ETH(invoice.address);
          const res = await axios.get(url);
          // Etherscan returns wei
          if (res.data.status === '1') {
            const balanceCrypto = Number(res.data.result) / 1e18;
            if (balanceCrypto >= invoice.payAmount) hasPaidEnough = true;
          }
        }
      } catch (err: any) {
        console.error(`Failed to check balance for ${invoice.address} (${invoice.payCurrency}):`, err.message);
        continue; // Skip and try next time
      }

      if (hasPaidEnough) {
        // Process deposit
        await withUserLock(invoice.userId, async () => {
          const freshInvoice = await prisma.cryptoInvoice.findUnique({ where: { id: invoice.id } });
          if (freshInvoice?.status === 'finished') return;

          await prisma.cryptoInvoice.update({
            where: { id: invoice.id },
            data: { status: 'finished' }
          });

          await prisma.user.update({
            where: { id: invoice.userId },
            data: { mockBalance: { increment: invoice.dlsCredited } }
          });
        });
        
        io.to(`user-${invoice.userId}`).emit('crypto_deposit_success', { amount: invoice.dlsCredited });
      }
    }
  } catch (err) {
    console.error('Error syncing crypto invoices:', err);
  }
}

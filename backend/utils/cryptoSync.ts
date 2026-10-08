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

function chunkArray(arr: any[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export async function checkAllBalances() {
  const totals = { BTC: 0, LTC: 0, ETH: 0 };
  const wallets: { address: string, currency: string, balance: number }[] = [];
  try {
    // Only get unique addresses
    const invoices = await prisma.cryptoInvoice.findMany({
      where: { address: { not: null } },
      distinct: ['address']
    });

    const btcAddrs = invoices.filter(i => i.payCurrency === 'BTC').map(i => i.address!);
    const ltcAddrs = invoices.filter(i => i.payCurrency === 'LTC').map(i => i.address!);
    const ethAddrs = invoices.filter(i => i.payCurrency === 'ETH').map(i => i.address!);

    // Check BTC
    for (const chunk of chunkArray(btcAddrs, 50)) {
      try {
        const url = `https://api.blockcypher.com/v1/btc/main/addrs/${chunk.join(',')}/balance`;
        const res = await axios.get(url);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        for (const item of data) {
          if (item.address && item.balance !== undefined) {
            const bal = item.balance / 100000000;
            totals.BTC += bal;
            wallets.push({ address: item.address, currency: 'BTC', balance: bal });
          }
        }
      } catch (e) { console.error("BTC chunk error", e); }
    }

    // Check LTC
    for (const chunk of chunkArray(ltcAddrs, 50)) {
      try {
        const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${chunk.join(',')}/balance`;
        const res = await axios.get(url);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        for (const item of data) {
          if (item.address && item.balance !== undefined) {
            const bal = item.balance / 100000000;
            totals.LTC += bal;
            wallets.push({ address: item.address, currency: 'LTC', balance: bal });
          }
        }
      } catch (e) { console.error("LTC chunk error", e); }
    }

    // Check ETH
    for (const chunk of chunkArray(ethAddrs, 20)) {
      try {
        const url = `https://api.etherscan.io/api?module=account&action=balancemulti&address=${chunk.join(',')}&tag=latest`;
        const res = await axios.get(url);
        if (res.data.status === '1' && Array.isArray(res.data.result)) {
          for (const item of res.data.result) {
            if (item.account && item.balance !== undefined) {
              const bal = Number(item.balance) / 1e18;
              totals.ETH += bal;
              wallets.push({ address: item.account, currency: 'ETH', balance: bal });
            }
          }
        }
      } catch (e) { console.error("ETH chunk error", e); }
    }

  } catch (e) {
    console.error("Error checking all balances:", e);
  }
  return { totals, wallets };
}


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
  USDT: (addr: string) => `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xdac17f958d2ee523a2206206994597c13d831ec7&address=${addr}&tag=latest`
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
        } else if (invoice.payCurrency === 'USDT') {
          const url = API_ENDPOINTS.USDT(invoice.address);
          const res = await axios.get(url);
          // USDT has 6 decimals
          if (res.data.status === '1') {
            const balanceCrypto = Number(res.data.result) / 1e6;
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
  const totals = { BTC: 0, LTC: 0, ETH: 0, USDT: 0 };
  const wallets: { address: string, currency: string, balance: number }[] = [];
  try {
    // Only get unique addresses
    const invoices = (await prisma.cryptoInvoice.findMany({
      distinct: ['address']
    })).filter(i => i.address && i.address.trim() !== '');

    // Initialize all wallets with 0 balance
    for (const inv of invoices) {
      if (inv.address) {
        wallets.push({ address: inv.address, currency: inv.payCurrency, balance: 0 });
      }
    }

    const btcAddrs = invoices.filter(i => i.payCurrency === 'BTC').map(i => i.address!);
    const ltcAddrs = invoices.filter(i => i.payCurrency === 'LTC').map(i => i.address!);
    const ethAddrs = invoices.filter(i => i.payCurrency === 'ETH').map(i => i.address!);
    const usdtAddrs = invoices.filter(i => i.payCurrency === 'USDT').map(i => i.address!);

    // Helper to update balance
    const setBal = (addr: string, bal: number, curr: string) => {
      if (bal > 0) {
        const w = wallets.find(w => w.address === addr);
        if (w) w.balance = bal;
        (totals as any)[curr] += bal;
      }
    };

    // Check BTC
    for (const chunk of chunkArray(btcAddrs, 50)) {
      try {
        const url = `https://api.blockcypher.com/v1/btc/main/addrs/${chunk.join(',')}/balance`;
        const res = await axios.get(url, { validateStatus: () => true });
        if (res.status === 200 && res.data) {
          const data = Array.isArray(res.data) ? res.data : [res.data];
          for (const item of data) {
            if (item.address && item.balance !== undefined) {
              setBal(item.address, item.balance / 100000000, 'BTC');
            }
          }
        }
      } catch (e) { console.error("BTC chunk error", (e as any).message); }
    }

    // Check LTC
    for (const chunk of chunkArray(ltcAddrs, 50)) {
      try {
        const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${chunk.join(',')}/balance`;
        const res = await axios.get(url, { validateStatus: () => true });
        if (res.status === 200 && res.data) {
          const data = Array.isArray(res.data) ? res.data : [res.data];
          for (const item of data) {
            if (item.address && item.balance !== undefined) {
              setBal(item.address, item.balance / 100000000, 'LTC');
            }
          }
        }
      } catch (e) { console.error("LTC chunk error", (e as any).message); }
    }

    // Check ETH
    for (const chunk of chunkArray(ethAddrs, 20)) {
      try {
        const url = `https://api.etherscan.io/api?module=account&action=balancemulti&address=${chunk.join(',')}&tag=latest`;
        const res = await axios.get(url, { validateStatus: () => true });
        if (res.status === 200 && res.data && res.data.status === '1' && Array.isArray(res.data.result)) {
          for (const item of res.data.result) {
            if (item.account && item.balance !== undefined) {
              setBal(item.account, Number(item.balance) / 1e18, 'ETH');
            }
          }
        }
      } catch (e) { console.error("ETH chunk error", (e as any).message); }
    }

    // Check USDT
    for (const chunk of chunkArray(usdtAddrs, 5)) { 
      try {
        await Promise.all(chunk.map(async (addr) => {
          try {
            const url = API_ENDPOINTS.USDT(addr);
            const res = await axios.get(url, { validateStatus: () => true });
            if (res.status === 200 && res.data && res.data.status === '1') {
              setBal(addr, Number(res.data.result) / 1e6, 'USDT');
            }
          } catch (e) {}
        }));
      } catch (e) { console.error("USDT chunk error", (e as any).message); }
    }

  } catch (e) {
    console.error("Error checking all balances:", e);
  }
  return { totals, wallets };
}


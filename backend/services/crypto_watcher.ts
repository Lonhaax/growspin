import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ethers } from 'ethers';

const prisma = new PrismaClient();
const POLL_INTERVAL = 30000; // 30 seconds

// ETH RPC providers
const ethMainnetProvider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
const ethBaseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');

const USDT_CONTRACT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const usdtAbi = ['function balanceOf(address) view returns (uint256)'];
const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, usdtAbi, ethMainnetProvider);

export function startCryptoWatcher() {
    console.log(`[CRYPTO WATCHER] Started blockchain polling for BTC, LTC, ETH, USDT`);

    setInterval(async () => {
        try {
            // Find all pending invoices that haven't expired (e.g., created in last 24h)
            const pendingInvoices = await prisma.cryptoInvoice.findMany({
                where: {
                    status: 'waiting',
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (pendingInvoices.length === 0) return;

            for (const invoice of pendingInvoices) {
                if (!invoice.address) continue;

                try {
                    let totalReceived = 0;

                    if (invoice.payCurrency === 'BTC') {
                        const res = await axios.get(`https://mempool.space/api/address/${invoice.address}`);
                        const sats = res.data.chain_stats.funded_txo_sum + res.data.mempool_stats.funded_txo_sum;
                        totalReceived = sats / 100000000;
                    } 
                    else if (invoice.payCurrency === 'LTC') {
                        const res = await axios.get(`https://litecoinspace.org/api/address/${invoice.address}`);
                        const lits = res.data.chain_stats.funded_txo_sum + res.data.mempool_stats.funded_txo_sum;
                        totalReceived = lits / 100000000;
                    }
                    else if (invoice.payCurrency === 'ETH') {
                        const [mainnetBalance, baseBalance] = await Promise.all([
                            ethMainnetProvider.getBalance(invoice.address).catch(() => 0n),
                            ethBaseProvider.getBalance(invoice.address).catch(() => 0n)
                        ]);
                        const totalEth = mainnetBalance + baseBalance;
                        totalReceived = Number(ethers.formatEther(totalEth));
                    }
                    else if (invoice.payCurrency === 'USDT') {
                        const balance = await usdtContract.balanceOf(invoice.address);
                        totalReceived = Number(ethers.formatUnits(balance, 6)); // USDT has 6 decimals
                    }

                    if (totalReceived > 0) {
                        const ratio = totalReceived / invoice.payAmount;
                        const dlsToCredit = Math.floor(invoice.dlsCredited * ratio);

                        if (dlsToCredit > 0) {
                            console.log(`[CRYPTO WATCHER] Payment received for Invoice ${invoice.id}: ${totalReceived} ${invoice.payCurrency} (Ratio: ${ratio.toFixed(2)})`);

                            await prisma.$transaction(async (db) => {
                                const current = await db.cryptoInvoice.findUnique({ where: { id: invoice.id } });
                                if (current?.status === 'waiting') {
                                    await db.cryptoInvoice.update({
                                        where: { id: invoice.id },
                                        data: { 
                                            status: 'finished',
                                            // Optionally, you could update dlsCredited here to reflect the actual amount
                                            dlsCredited: dlsToCredit 
                                        }
                                    });

                                    await db.user.update({
                                        where: { id: invoice.userId },
                                        data: { mockBalance: { increment: dlsToCredit } }
                                    });
                                    
                                    console.log(`[CRYPTO WATCHER] Credited ${dlsToCredit} DLs to User ${invoice.userId} (Partial/Full Payment)`);
                                }
                            });
                        } else {
                            console.log(`[CRYPTO WATCHER] Invoice ${invoice.id} received dust (${totalReceived} ${invoice.payCurrency}), not enough to credit 1 DL.`);
                        }
                    }
                } catch (invoiceErr: any) {
                    console.error(`[CRYPTO WATCHER] Error checking invoice ${invoice.id}:`, invoiceErr.message);
                }
            }
        } catch (error: any) {
            console.error("[CRYPTO WATCHER] Global polling error:", error.message);
        }
    }, POLL_INTERVAL);
}


import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ethers } from 'ethers';

const prisma = new PrismaClient();
const POLL_INTERVAL = 30000; // 30 seconds

// ETH RPC provider
const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
const USDT_CONTRACT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const usdtAbi = ['function balanceOf(address) view returns (uint256)'];
const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, usdtAbi, ethProvider);

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
                        const balance = await ethProvider.getBalance(invoice.address);
                        totalReceived = Number(ethers.formatEther(balance));
                    }
                    else if (invoice.payCurrency === 'USDT') {
                        const balance = await usdtContract.balanceOf(invoice.address);
                        totalReceived = Number(ethers.formatUnits(balance, 6)); // USDT has 6 decimals
                    }

                    if (totalReceived >= invoice.payAmount * 0.99) {
                        console.log(`[CRYPTO WATCHER] Payment received for Invoice ${invoice.id}: ${totalReceived} ${invoice.payCurrency}`);

                        await prisma.$transaction(async (db) => {
                            // Ensure it's still waiting to prevent double credit
                            const current = await db.cryptoInvoice.findUnique({ where: { id: invoice.id } });
                            if (current?.status === 'waiting') {
                                await db.cryptoInvoice.update({
                                    where: { id: invoice.id },
                                    data: { status: 'finished' }
                                });

                                await db.user.update({
                                    where: { id: invoice.userId },
                                    data: { mockBalance: { increment: invoice.dlsCredited } }
                                });
                                
                                console.log(`[CRYPTO WATCHER] Credited ${invoice.dlsCredited} DLs to User ${invoice.userId}`);
                            }
                        });
                    } else if (totalReceived > 0) {
                        console.log(`[CRYPTO WATCHER] Invoice ${invoice.id} received ${totalReceived} ${invoice.payCurrency}, but needs ${invoice.payAmount}`);
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


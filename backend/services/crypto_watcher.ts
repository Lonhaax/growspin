import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ethers } from 'ethers';

const prisma = new PrismaClient();
const POLL_INTERVAL = 30000; // 30 seconds

// ETH/EVM RPC providers
const ethMainnetProvider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
const ethBaseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const arbProvider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
const optProvider = new ethers.JsonRpcProvider('https://mainnet.optimism.io');
const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
const polyProvider = new ethers.JsonRpcProvider('https://polygon-rpc.com');

const evmProviders = [ethMainnetProvider, ethBaseProvider, arbProvider, optProvider, bscProvider, polyProvider];

// USDT Contract Addresses per chain
const USDT_CONTRACTS = [
    { provider: ethMainnetProvider, address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 }, // Mainnet
    { provider: ethBaseProvider, address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 }, // Base (Tether)
    { provider: arbProvider, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 }, // Arbitrum
    { provider: optProvider, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 }, // Optimism
    { provider: bscProvider, address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }, // BSC
    { provider: polyProvider, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }, // Polygon
];

const usdtAbi = ['function balanceOf(address) view returns (uint256)'];

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
                        const balances = await Promise.all(
                            evmProviders.map(provider => provider.getBalance(invoice.address!).catch(() => BigInt(0)))
                        );
                        const totalEth = balances.reduce((acc, bal) => acc + bal, BigInt(0));
                        totalReceived = Number(ethers.formatEther(totalEth));
                    }
                    else if (invoice.payCurrency === 'USDT') {
                        const balances = await Promise.all(
                            USDT_CONTRACTS.map(async (c) => {
                                try {
                                    const contract = new ethers.Contract(c.address, usdtAbi, c.provider);
                                    const bal = await contract.balanceOf(invoice.address!);
                                    return Number(ethers.formatUnits(bal, c.decimals));
                                } catch (e) {
                                    return 0;
                                }
                            })
                        );
                        totalReceived = balances.reduce((acc, bal) => acc + bal, 0);
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


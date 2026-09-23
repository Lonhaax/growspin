import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TronGrid API (TRC20 USDT)
// Master Wallet Address to watch for incoming deposits
const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS || "TYourMasterWalletAddressHere";
const TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // USDT on Tron
const POLL_INTERVAL = 30000; // 30 seconds

let lastTimestamp = Date.now();

export function startCryptoWatcher() {
    console.log(`[CRYPTO WATCHER] Started polling TRON network for ${MASTER_WALLET_ADDRESS}`);

    setInterval(async () => {
        try {
            // Note: In production, you would fetch from TronGrid API here:
            // const response = await axios.get(`https://api.trongrid.io/v1/accounts/${MASTER_WALLET_ADDRESS}/transactions/trc20?contract_address=${TRC20_CONTRACT}&min_timestamp=${lastTimestamp}`);
            // const transactions = response.data.data;
            
            const transactions: any[] = []; // Mock empty response for now

            for (const tx of transactions) {
                // If the transaction is incoming to our master wallet
                if (tx.to === MASTER_WALLET_ADDRESS) {
                    const amountInUSDT = parseInt(tx.value) / 1000000; // USDT has 6 decimals
                    
                    // The 'from' address or 'memo' can be used to identify the user
                    // E.g. find user by deposit address mapped to their account
                    const user = await prisma.user.findFirst({
                        where: { /* depositAddress: tx.from */ id: -1 } // Placeholder logic
                    });

                    if (user) {
                        const amountInCents = Math.floor(amountInUSDT * 100);

                        // Use transaction to ensure we don't double credit
                        await prisma.$transaction(async (db) => {
                            const existingInvoice = await db.cryptoInvoice.findUnique({
                                where: { paymentId: tx.transaction_id }
                            });

                            if (!existingInvoice) {
                                await db.cryptoInvoice.create({
                                    data: {
                                        userId: user.id,
                                        paymentId: tx.transaction_id,
                                        status: 'finished',
                                        payAmount: amountInUSDT,
                                        payCurrency: 'USDT_TRC20',
                                        dlsCredited: amountInCents
                                    }
                                });

                                await db.user.update({
                                    where: { id: user.id },
                                    data: { mockBalance: { increment: amountInCents } }
                                });

                                console.log(`[CRYPTO] Credited ${amountInCents} DLs to User ${user.id} from tx ${tx.transaction_id}`);
                            }
                        });
                    }
                }
            }

            lastTimestamp = Date.now();
        } catch (error) {
            console.error("[CRYPTO WATCHER] Error polling:", error);
        }
    }, POLL_INTERVAL);
}

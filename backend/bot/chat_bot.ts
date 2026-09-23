import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let activeTrivia: { question: string, answer: string, reward: number } | null = null;

// Trivia Questions
const TRIVIA_POOL = [
    { q: "What is 5 + 7?", a: "12" },
    { q: "What is the capital of France?", a: "paris" },
    { q: "What is 8 * 9?", a: "72" },
    { q: "Type 'GROWSPIN' backwards.", a: "nipsowrg" }
];

export function startChatBot(io: any) {
    // ─── TRIVIA BOT ─────────────────────────────────────────────────────────────
    setInterval(async () => {
        try {
            if (activeTrivia) return; // Wait until current trivia is solved
            
            // 5% chance every minute to start trivia (avg every 20 minutes)
            if (Math.random() > 0.05) return;

            const randomQ = TRIVIA_POOL[Math.floor(Math.random() * TRIVIA_POOL.length)];
            const reward = Math.floor(Math.random() * 500) + 500; // 500 to 1000 DLs (cents)
            
            activeTrivia = { question: randomQ.q, answer: randomQ.a.toLowerCase(), reward };

            const msg = await prisma.chatMessage.create({
                data: {
                    userId: 1, // System/Admin user
                    content: `🧠 TRIVIA: ${activeTrivia.question} (First to type the exact answer gets ${reward} DLs!)`
                },
                include: { user: { select: { username: true, totalWagered: true } } }
            });

            io.emit('chat_message', msg);
            console.log(`🧠 Trivia started: ${activeTrivia.question}`);

        } catch (error) {
            console.error("Trivia bot error:", error);
        }
    }, 60 * 1000);

    // ─── SOCKET LISTENER ────────────────────────────────────────────────────────
    io.on('connection', (socket: any) => {
        // Send current rain status to newly connected clients
        if (activeRain) {
            socket.emit('rain_started', {
                amount: activeRain.amount,
                endTime: activeRain.endTime,
                joinedCount: activeRain.joinedUserIds.size
            });
        }

        socket.on('join_rain', (data: { userId: number }) => {
            if (activeRain && data.userId) {
                activeRain.joinedUserIds.add(data.userId);
                io.emit('rain_update', { joinedCount: activeRain.joinedUserIds.size });
            }
        });

        socket.on('chat_message', async (data: any) => {
            if (activeTrivia && data.content && data.content.toLowerCase().trim() === activeTrivia.answer) {
                // Correct answer!
                try {
                    const winnerId = data.userId; // Ensure client sends userId or retrieve from socket auth
                    if (!winnerId) return;

                    const reward = activeTrivia.reward;
                    activeTrivia = null; // Clear trivia immediately

                    await prisma.$transaction(async (tx) => {
                        await tx.user.update({
                            where: { id: winnerId },
                            data: { mockBalance: { increment: reward } }
                        });

                        const winMsg = await tx.chatMessage.create({
                            data: {
                                userId: 1,
                                content: `🎉 Correct! A user just won ${reward} DLs.`
                            },
                            include: { user: { select: { username: true, totalWagered: true } } }
                        });

                        io.emit('chat_message', winMsg);
                        io.emit('balanceUpdate', { userId: winnerId, newBalance: reward }); // Tell client to refresh
                    });
                } catch (e) {
                    console.error("Failed to process trivia win", e);
                }
            }
        });
    });
}

// ─── RAIN BOT LOGIC ─────────────────────────────────────────────────────────
let activeRain: { amount: number, endTime: number, joinedUserIds: Set<number>, timeout: NodeJS.Timeout } | null = null;
let ioInstance: any = null;

export function setIoInstance(io: any) {
    ioInstance = io;
}

export async function triggerRain(amount: number) {
    if (!ioInstance) throw new Error("IO not initialized");
    if (activeRain) throw new Error("A Rain Drop is already active!");

    const durationSeconds = 60;
    const endTime = Date.now() + durationSeconds * 1000;

    // Post chat message announcing the rain
    const startMsg = await prisma.chatMessage.create({
        data: {
            userId: 1, // System
            content: `🌧️ Admin just dropped a ${amount} DLs Rain! Click 'JOIN RAIN' above chat to enter. Ends in 60s!`
        },
        include: { user: { select: { username: true, totalWagered: true } } }
    });
    ioInstance.emit('chat_message', startMsg);

    const timeout = setTimeout(async () => {
        if (!activeRain) return;
        const currentRain = activeRain;
        activeRain = null; // Clear state

        try {
            const joinedArray = Array.from(currentRain.joinedUserIds);
            if (joinedArray.length === 0) {
                // No one joined, refund or just ignore
                const noWinMsg = await prisma.chatMessage.create({
                    data: { userId: 1, content: `🌧️ The ${currentRain.amount} DLs Rain ended, but nobody joined!` },
                    include: { user: { select: { username: true, totalWagered: true } } }
                });
                ioInstance.emit('chat_message', noWinMsg);
                ioInstance.emit('rain_ended', { amount: 0, winners: 0 });
                return;
            }

            const amountPerUser = Math.floor(currentRain.amount / joinedArray.length);

            await prisma.$transaction(async (tx) => {
                await tx.user.updateMany({
                    where: { id: { in: joinedArray } },
                    data: { mockBalance: { increment: amountPerUser } }
                });

                const endMsg = await tx.chatMessage.create({
                    data: {
                        userId: 1,
                        content: `🌧️ Rain ended! ${joinedArray.length} players split the ${currentRain.amount} DLs pot (+${amountPerUser} DLs each).`
                    },
                    include: { user: { select: { username: true, totalWagered: true } } }
                });
                ioInstance.emit('chat_message', endMsg);
            });

            ioInstance.emit('rain_ended', { amount: currentRain.amount, winners: joinedArray.length, amountPerUser });
            
            // Notify clients individually to fetch balances
            for (const uid of joinedArray) {
                ioInstance.emit('balanceUpdate', { userId: uid });
            }

        } catch (e) {
            console.error("Rain resolution failed:", e);
        }
    }, durationSeconds * 1000);

    activeRain = { amount, endTime, joinedUserIds: new Set(), timeout };

    ioInstance.emit('rain_started', {
        amount,
        endTime,
        joinedCount: 0
    });
}

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
                    });
                } catch (e) {
                    console.error("Failed to process trivia win", e);
                }
            }
        });
    });
}

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Claim Rakeback
router.post('/rakeback/claim', requireAuth, async (req: any, res: any) => {
    try {
        const userId = req.user.id;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { rakebackBalance: true }
            });

            if (!user) {
                throw new Error("User not found");
            }

            if (user.rakebackBalance <= 0) {
                throw new Error("No rakeback available to claim");
            }

            const claimedAmount = user.rakebackBalance;

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    mockBalance: { increment: claimedAmount },
                    rakebackBalance: 0
                }
            });

            return { claimedAmount, newBalance: updatedUser.mockBalance };
        });

        res.json({ success: true, claimed: result.claimedAmount, newBalance: result.newBalance });
    } catch (error: any) {
        console.error('Rakeback claim error:', error);
        res.status(400).json({ error: error.message || 'Failed to claim rakeback' });
    }
});

// Claim Affiliate Earnings
router.post('/affiliate/claim', requireAuth, async (req: any, res: any) => {
    try {
        const userId = req.user.id;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { affiliateEarnings: true }
            });

            if (!user) {
                throw new Error("User not found");
            }

            if (user.affiliateEarnings <= 0) {
                throw new Error("No affiliate earnings available to claim");
            }

            const claimedAmount = user.affiliateEarnings;

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    mockBalance: { increment: claimedAmount },
                    affiliateEarnings: 0
                }
            });

            return { claimedAmount, newBalance: updatedUser.mockBalance };
        });

        res.json({ success: true, claimed: result.claimedAmount, newBalance: result.newBalance });
    } catch (error: any) {
        console.error('Affiliate claim error:', error);
        res.status(400).json({ error: error.message || 'Failed to claim affiliate earnings' });
    }
});

// Set Affiliate Code
router.post('/affiliate/set', requireAuth, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        if (!code || typeof code !== 'string' || code.length < 3 || code.length > 20) {
            return res.status(400).json({ error: 'Invalid affiliate code. Must be 3-20 characters.' });
        }

        const existing = await prisma.user.findUnique({
            where: { affiliateCode: code }
        });

        if (existing) {
            return res.status(400).json({ error: 'Affiliate code already taken.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { affiliateCode: code }
        });

        res.json({ success: true, affiliateCode: code });
    } catch (error: any) {
        console.error('Set affiliate code error:', error);
        res.status(500).json({ error: 'Failed to set affiliate code' });
    }
});

export default router;

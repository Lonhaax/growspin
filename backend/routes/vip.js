"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Claim Rakeback
router.post('/rakeback/claim', index_1.requireAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Rakeback claim error:', error);
        res.status(400).json({ error: error.message || 'Failed to claim rakeback' });
    }
});
// Claim Affiliate Earnings
router.post('/affiliate/claim', index_1.requireAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Affiliate claim error:', error);
        res.status(400).json({ error: error.message || 'Failed to claim affiliate earnings' });
    }
});
// Set Affiliate Code
router.post('/affiliate/set', index_1.requireAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Set affiliate code error:', error);
        res.status(500).json({ error: 'Failed to set affiliate code' });
    }
});
exports.default = router;

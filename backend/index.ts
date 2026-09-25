import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { withUserLock } from './utils/mutex';
import axios from 'axios';
import crypto from 'crypto';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
const app = express();
app.set('trust proxy', 1); // Trust first proxy (Caddy) to parse X-Forwarded-For
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || null;
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || 'your_api_key_here';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || 'your_ipn_secret_here';

const recentLiveBets: any[] = [];
const highRollerBets: any[] = [];
const luckyWins: any[] = [];

function emitLiveBet(ioInstance: any, betData: any) {
  // Recent bets
  recentLiveBets.unshift(betData);
  if (recentLiveBets.length > 10) recentLiveBets.pop();
  
  // High Rollers (Top 10 highest payout amounts)
  const payoutAmount = betData.profit > 0 ? betData.betAmount + betData.profit : 0;
  if (payoutAmount > 0) {
    // Add if it beats the lowest or we don't have 10 yet
    highRollerBets.push({ ...betData, payoutAmount });
    highRollerBets.sort((a, b) => b.payoutAmount - a.payoutAmount);
    if (highRollerBets.length > 10) highRollerBets.pop();
  }

  // Lucky Wins (Top 10 highest multipliers)
  if (betData.multiplier >= 1) {
    luckyWins.push(betData);
    luckyWins.sort((a, b) => b.multiplier - a.multiplier);
    if (luckyWins.length > 10) luckyWins.pop();
  }

  ioInstance.emit('live_bet', betData);
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  frameguard: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 auth requests per hour
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// app.use('/api/', apiLimiter);
// app.use('/api/auth/', authLimiter);

import vipRoutes from './routes/vip';
app.use('/api/vip', vipRoutes);

// ─── VIP Helpers & Tiers ──────────────────────────────────────────────────────
const VIP_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze',
    threshold: 0,
    rakeback: 0.01,
    color: '#cd7f32',
    gradient: 'from-amber-700 to-amber-900',
    caseName: 'Bronze Daily Case',
    caseDescription: 'Claimable every 24 hours for all players.',
    loot: [
      { name: '10 World Locks', value: 1000, color: '#3b82f6', weight: 45 },
      { name: '25 World Locks', value: 2500, color: '#3b82f6', weight: 30 },
      { name: '50 World Locks', value: 5000, color: '#8b5cf6', weight: 15 },
      { name: '1 Diamond Lock', value: 10000, color: '#06b6d4', weight: 8 },
      { name: '5 Diamond Locks', value: 50000, color: '#eab308', weight: 2 },
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    threshold: 1000000, // $10,000 wagered
    rakeback: 0.02,
    color: '#94a3b8',
    gradient: 'from-slate-400 to-slate-600',
    caseName: 'Silver Daily Case',
    caseDescription: 'Unlocked at 10,000 DLs wagered.',
    loot: [
      { name: '50 World Locks', value: 5000, color: '#8b5cf6', weight: 40 },
      { name: '1 Diamond Lock', value: 10000, color: '#06b6d4', weight: 35 },
      { name: '2 Diamond Locks', value: 20000, color: '#06b6d4', weight: 15 },
      { name: '5 Diamond Locks', value: 50000, color: '#eab308', weight: 8 },
      { name: '10 Diamond Locks', value: 100000, color: '#ec4899', weight: 2 },
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    threshold: 5000000, // $50,000 wagered
    rakeback: 0.03,
    color: '#eab308',
    gradient: 'from-yellow-400 to-amber-600',
    caseName: 'Gold Daily Case',
    caseDescription: 'Unlocked at 50,000 DLs wagered.',
    loot: [
      { name: '2 Diamond Locks', value: 20000, color: '#06b6d4', weight: 35 },
      { name: '5 Diamond Locks', value: 50000, color: '#eab308', weight: 35 },
      { name: '10 Diamond Locks', value: 100000, color: '#ec4899', weight: 20 },
      { name: '25 Diamond Locks', value: 250000, color: '#ec4899', weight: 8 },
      { name: 'Magplant 5000', value: 500000, color: '#ef4444', weight: 2 },
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    threshold: 25000000, // $250,000 wagered
    rakeback: 0.04,
    color: '#38bdf8',
    gradient: 'from-cyan-400 to-blue-600',
    caseName: 'Platinum Daily Case',
    caseDescription: 'Unlocked at 250,000 DLs wagered.',
    loot: [
      { name: '10 Diamond Locks', value: 100000, color: '#ec4899', weight: 35 },
      { name: '25 Diamond Locks', value: 250000, color: '#ec4899', weight: 35 },
      { name: '50 Diamond Locks', value: 500000, color: '#ef4444', weight: 20 },
      { name: 'Rayman 35k', value: 1000000, color: '#ef4444', weight: 8 },
      { name: '1 Blue Gem Lock', value: 2500000, color: '#a855f7', weight: 2 },
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond',
    threshold: 100000000, // $1,000,000 wagered
    rakeback: 0.05,
    color: '#a855f7',
    gradient: 'from-purple-400 to-indigo-600',
    caseName: 'Diamond Daily Case',
    caseDescription: 'Unlocked at 1,000,000 DLs wagered.',
    loot: [
      { name: '50 Diamond Locks', value: 500000, color: '#ef4444', weight: 40 },
      { name: '1 Blue Gem Lock', value: 2500000, color: '#a855f7', weight: 35 },
      { name: '2 Blue Gem Locks', value: 5000000, color: '#a855f7', weight: 15 },
      { name: 'Legendary Dragon Wings', value: 10000000, color: '#f59e0b', weight: 8 },
      { name: '5 Blue Gem Locks', value: 12500000, color: '#f59e0b', weight: 2 },
    ]
  }
];

function getVIPRakebackPercentage(totalWagered: number) {
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (totalWagered >= VIP_TIERS[i].threshold) {
      return VIP_TIERS[i].rakeback;
    }
  }
  return 0.01;
}

const PLINKO_PAYOUTS: any = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  9: {
    low: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    medium: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    high: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
  },
  10: {
    low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
  },
  11: {
    low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    medium: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    high: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  13: {
    low: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
    medium: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    high: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
  },
  14: {
    low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    medium: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  },
  15: {
    low: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
    medium: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    high: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

// Level calculation helper: Caps level at 100 and scales progressively.
// Requires 1,000 cents (10 DLs) base step scaling per level squared.
// Level 1: 0 XP
// Level 2: 1,000 XP (10 DLs wagered)
// Level 10: 81,000 XP (810 DLs wagered)
// Level 50: 2,401,000 XP (24,010 DLs wagered)
// Level 100: 9,801,000 XP (98,010 DLs wagered)
function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  const computed = Math.floor(Math.sqrt(xp / 1000)) + 1;
  return Math.min(100, Math.max(1, computed));
}

// Generates a provably fair random float between 0 and 1
async function generateProvablyFairFloat(tx: any, userId: number): Promise<{ float: number, pf: any, hmac: string }> {
  let pf = await tx.provablyFair.findFirst({ where: { userId, active: true } });
  if (!pf) {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const clientSeed = crypto.randomBytes(16).toString('hex');
    pf = await tx.provablyFair.create({
      data: { userId, serverSeed, serverHash, clientSeed, nonce: 0, active: true }
    });
  }

  pf = await tx.provablyFair.update({
    where: { id: pf.id },
    data: { nonce: { increment: 1 } }
  });

  const hmac = crypto.createHmac('sha256', pf.serverSeed).update(`${pf.clientSeed}-${pf.nonce}`).digest('hex');
  const hexSubstring = hmac.substring(0, 8); // 32 bits
  const float = parseInt(hexSubstring, 16) / 0xffffffff;
  
  return { float, pf, hmac };
}

// Calculate dynamic borrow credit limit based on user wagering and play activity (Level/XP).
// Base credit: 100 DLs (10,000 cents).
// Scales with 10% of total wagered plus 10 DLs per level achieved, capped by site global max.
function calculateUserBorrowLimit(user: { totalWagered?: number; level?: number; role?: string }, siteMaxLimit: number = 100000): number {
  if (user.role === 'admin') return siteMaxLimit;
  const baseLimit = 10000; // 100 DLs base credit
  const wagerBonus = Math.floor((user.totalWagered || 0) * 0.10); // 10% of total wagered
  const levelBonus = ((user.level || 1) - 1) * 1000; // 10 DLs per level gained
  const dynamicLimit = baseLimit + wagerBonus + levelBonus;
  return Math.min(dynamicLimit, siteMaxLimit);
}
// ─── Token Helpers ───────────────────────────────────────────────────────────
function generateAccessToken(userId: number) {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId: number) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true, // required for cross-domain
    sameSite: 'none', // required for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}


async function requireNotFrozen(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    if (user.debt > 0 && user.debtCreatedAt && !user.isFrozen) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      if (user.debtCreatedAt < fiveDaysAgo) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isFrozen: true }
        });
      }
    }
    
    if (user.isFrozen) {
      res.status(403).json({ error: 'Account frozen due to unpaid loan. Please repay your loan.' });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error checking freeze status.' });
  }
}

async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    // Auto-assign admin ONLY if it's the very first user on the site
    const userCount = await prisma.user.count();
    const role = (userCount === 0) ? 'admin' : 'user';

    const user = await prisma.user.create({
      data: { username, passwordHash, role },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken,
      user: { id: user.id, username: user.username, mockBalance: user.mockBalance, debt: user.debt, level: user.level, xp: user.xp, rakebackBalance: user.rakebackBalance, totalWagered: user.totalWagered, createdAt: user.createdAt },
    });
  } catch {
    res.status(400).json({ error: 'Username already taken.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Prune expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken,
      user: { id: user.id, username: user.username, mockBalance: user.mockBalance, debt: user.debt, level: user.level, xp: user.xp, rakebackBalance: user.rakebackBalance, totalWagered: user.totalWagered, createdAt: user.createdAt },
    });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: 'No refresh token.' });
    return;
  }
  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as { userId: number };
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      res.status(401).json({ error: 'Refresh token expired or revoked.' });
      return;
    }

    // Rotate refresh token
    const newRefresh = generateRefreshToken(payload.userId);
    await prisma.refreshToken.update({
      where: { token },
      data: {
        token: newRefresh,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    setRefreshCookie(res, newRefresh);
    res.json({
      accessToken: generateAccessToken(payload.userId),
      user: { id: user!.id, username: user!.username, mockBalance: user!.mockBalance, debt: user!.debt, level: user!.level, xp: user!.xp, rakebackBalance: user!.rakebackBalance, totalWagered: user!.totalWagered, createdAt: user!.createdAt },
    });
  } catch {
    res.clearCookie('refreshToken');
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => { });
  }
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

// ─── USER ROUTES (protected) ──────────────────────────────────────────────────

// GET /api/user/me
// ==========================================
// ==========================================
// GROWTOPIA DEPOSIT ENDPOINTS
// ==========================================

let activeDepositWorld = "UNKNOWN";

app.get('/api/internal/bot/status', async (req: Request, res: Response) => {
  try {
    const secret = req.query.secret as string;
    const worldName = req.query.worldName as string;
    
    if (secret !== 'GROWTOPIA_BOT_SECRET_2026') return res.status(401).json({ error: 'Unauthorized' });
    if (worldName && worldName !== "") {
      activeDepositWorld = worldName;
      console.log('Bot updated active deposit world to:', activeDepositWorld);
    }
    res.json({ success: true, activeDepositWorld });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

let globalNextIntentId = 1;
const globalInMemoryIntents: any[] = [];

app.post('/api/deposit/request', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  try {
    const { growId, amount } = req.body;
    if (!growId) return res.status(400).json({ error: 'growId is required' });

    const worldName = "longtbl";
    const botName = "Searching...";

    const intent = {
      id: globalNextIntentId++,
      userId: req.userId!,
      growId,
      amount: amount || 0,
      worldName,
      botName,
      status: 'PENDING',
      createdAt: new Date()
    };
    
    globalInMemoryIntents.push(intent);

    res.json({ success: true, intent });
  } catch (err: any) {
    console.error('Deposit Request Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/internal/bot/intents', async (req: Request, res: Response) => {
  try {
    const secret = req.headers.authorization;
    if (secret !== 'GROWTOPIA_BOT_SECRET_2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const intents = globalInMemoryIntents.filter(i => i.status === 'PENDING');

    res.json({ intents });
  } catch (err) {
    console.error('Internal Intents Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/internal/bot/assign', async (req: Request, res: Response) => {
  try {
    const secret = req.headers.authorization;
    if (secret !== 'GROWTOPIA_BOT_SECRET_2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { intentId, botName } = req.body;
    console.log(`[ASSIGN] Received assign request. intentId: ${intentId}, botName: ${botName}`);
    console.log(`[ASSIGN] Memory intents:`, globalInMemoryIntents.map(i => ({ id: i.id, userId: i.userId, status: i.status })));
    
    const intent = globalInMemoryIntents
      .filter(i => i.id == intentId || (i.userId == intentId && i.status === 'PENDING'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    
    if (intent) {
      console.log(`[ASSIGN] Found intent! Updating botName to ${botName}`);
      intent.botName = botName;
    } else {
      console.log(`[ASSIGN] Could not find matching intent in memory.`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Internal Assign Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/internal/bot/intent/:id', async (req: Request, res: Response) => {
  try {
    const secret = req.headers.authorization;
    if (secret !== 'GROWTOPIA_BOT_SECRET_2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const paramId = req.params.id as string;
    const intentId = parseInt(paramId) || paramId;
    const intent = globalInMemoryIntents.find(i => i.id == intentId || i.userId == intentId);
    
    if (intent) {
      res.json({ intent });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/internal/bot/credit', async (req: Request, res: Response) => {
  try {
    const secret = req.query.secret as string;
    const worldName = req.query.worldName as string;
    const amount = parseInt(req.query.amount as string || "0");
    const playerName = req.query.playerName as string;
    // VERY simple auth for the bot
    if (secret !== 'GROWTOPIA_BOT_SECRET_2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cleanPlayerName = (playerName || "").replace(/\^[0-9a-zA-Z]/g, '').replace(/[@#]/g, '').toLowerCase();

    const pendingIntents = globalInMemoryIntents
      .filter(i => i.worldName === worldName && i.status === 'PENDING')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const intent = pendingIntents.find(i => i.growId.toLowerCase() === cleanPlayerName);

    if (!intent) {
      return res.status(404).json({ error: 'No pending deposit found for player ' + cleanPlayerName + ' in this world' });
    }

    const newBalance = await withUserLock(intent.userId, async () => {
      const freshIntent = globalInMemoryIntents.find(i => i.id === intent.id);
      if (!freshIntent || freshIntent.status !== 'PENDING') {
        throw new Error('Intent already processed');
      }

      const updatedUser = await prisma.user.update({
        where: { id: freshIntent.userId },
        data: { mockBalance: { increment: amount } }
      });

      freshIntent.status = 'COMPLETED';
      freshIntent.amount = amount;

      return updatedUser.mockBalance;
    });

    res.json({ success: true, newBalance });
  } catch (err: any) {
    console.error('Bot Credit Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/deposit/crypto/request', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  try {
    const { amountUSD, payCurrency } = req.body;
    if (!amountUSD || amountUSD < 1) return res.status(400).json({ error: 'Minimum deposit is $1' });
    if (!payCurrency) return res.status(400).json({ error: 'payCurrency is required (e.g. ltc, btc)' });

    // 100 DLs = 2.6 USD (1 USD = ~38.46 DLs)
    const dlsCredited = Math.floor((amountUSD / 2.6) * 10000);

    const paymentId = crypto.randomBytes(16).toString('hex');

    const invoice = await prisma.cryptoInvoice.create({
      data: {
        userId: req.userId!,
        paymentId,
        payAmount: amountUSD,
        payCurrency: payCurrency.toLowerCase(),
        dlsCredited
      }
    });

    const npRes = await axios.post('https://api.nowpayments.io/v1/payment', {
      price_amount: amountUSD,
      price_currency: 'usd',
      pay_currency: payCurrency.toLowerCase(),
      ipn_callback_url: `${FRONTEND_URL}/api/crypto/ipn`, // We map /api in Caddy
      order_id: paymentId,
      order_description: `GrowSpin DL Deposit`
    }, {
      headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
    });

    res.json({ success: true, invoice: npRes.data, internalInvoiceId: invoice.id });
  } catch (err: any) {
    console.error('Crypto Request Error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate crypto invoice' });
  }
});

app.post('/api/deposit/crypto/ipn', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string;
    if (!signature) return res.status(400).json({ error: 'Missing signature' });

    // Verify HMAC signature
    const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET);
    hmac.update(JSON.stringify(req.body));
    if (hmac.digest('hex') !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { payment_status, order_id, actually_paid } = req.body;

    const invoice = await prisma.cryptoInvoice.findUnique({ where: { paymentId: order_id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (payment_status === 'finished' && invoice.status !== 'finished') {
      await withUserLock(invoice.userId, async () => {
        // Recheck status
        const freshInvoice = await prisma.cryptoInvoice.findUnique({ where: { paymentId: order_id } });
        if (freshInvoice?.status === 'finished') return;

        await prisma.cryptoInvoice.update({
          where: { paymentId: order_id },
          data: { status: 'finished' }
        });

        await prisma.user.update({
          where: { id: invoice.userId },
          data: { mockBalance: { increment: invoice.dlsCredited } }
        });
      });
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      await prisma.cryptoInvoice.update({
        where: { paymentId: order_id },
        data: { status: 'failed' }
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Crypto IPN Error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/api/deposit/crypto/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = Number(req.query.id);
    if (!invoiceId) return res.status(400).json({ error: 'Missing invoice id' });

    const invoice = await prisma.cryptoInvoice.findFirst({
      where: { id: invoiceId, userId: req.userId! }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json({ success: true, invoice });
  } catch (err: any) {
    console.error('Crypto Status Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/deposit/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const intent = globalInMemoryIntents
      .filter(i => i.userId === req.userId!)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
    res.json({ intent });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/deposit/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const intent = globalInMemoryIntents
      .filter(i => i.userId === req.userId! && i.status === 'PENDING')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
    if (!intent) return res.status(404).json({ error: 'No pending deposit found' });
    
    intent.status = 'CANCELLED';
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/withdraw', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, address } = req.body;

    if (!amount || typeof amount !== 'number' || amount < 5000) {
      return res.status(400).json({ error: "Minimum withdrawal is 50 DLs ($1.30)" });
    }
    if (!method || !['crypto', 'growtopia'].includes(method)) {
      return res.status(400).json({ error: "Invalid withdrawal method" });
    }
    if (!address || typeof address !== 'string' || address.trim().length < 3) {
      return res.status(400).json({ error: "Valid destination address or world name is required" });
    }

    // Wrap in transaction to deduct balance and create request safely
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId! } });
      if (!user) throw new Error("User not found");
      if (user.mockBalance < amount) throw new Error("Insufficient balance");

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { mockBalance: { decrement: amount } }
      });

      const request = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount,
          method,
          address: address.trim(),
          status: "pending"
        }
      });

      return { user: updatedUser, request };
    });

    res.json({ success: true, request: result.request, balance: result.user.mockBalance });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/user/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.userId },
      include: { transactions: { orderBy: { timestamp: 'desc' }, take: 20 } },
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } })
  ]);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { passwordHash, ...safeUser } = user;
  const siteMaxLimit = settings?.maxBorrowLimit ?? 100000;
  const borrowLimit = calculateUserBorrowLimit(user, siteMaxLimit);
  res.json({ ...safeUser, borrowLimit });
});

// POST /api/user/claim-rakeback
app.post('/api/user/claim-rakeback', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId } });
      if (!user) throw new Error('User not found');
      if (user.rakebackBalance <= 0) throw new Error('No rakeback to claim');

      const updatedUser = await tx.user.update({
        where: { id: req.userId },
        data: {
          mockBalance: { increment: user.rakebackBalance },
          rakebackBalance: 0
        }
      });
      return updatedUser;
    });
    const { passwordHash, ...safeUser } = result;
    res.json(safeUser);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/user/faucet
app.post('/api/user/faucet', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  try {
    const result = await withUserLock(req.userId!, () => prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId } });
      if (!user) throw new Error('User not found');

      // Check if 24 hours have passed
      if (user.lastFaucetClaim) {
        const timeSinceLastClaim = Date.now() - new Date(user.lastFaucetClaim).getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (timeSinceLastClaim < ONE_DAY) {
          throw new Error('You can only claim the faucet once every 24 hours.');
        }
      }

      const FaucetAmount = 5000; // $50.00

      const updatedUser = await tx.user.update({
        where: { id: req.userId },
        data: {
          mockBalance: { increment: FaucetAmount },
          lastFaucetClaim: new Date()
        }
      });
      return updatedUser;
    }));
    const { passwordHash, ...safeUser } = result;
    res.json(safeUser);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── VIP & Daily Rewards ───────────────────────────────────────────────────
app.get('/api/vip/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dailyClaims: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalWagered = user.totalWagered;

    // Determine current tier
    let currentTierIndex = 0;
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (totalWagered >= VIP_TIERS[i].threshold) {
        currentTierIndex = i;
        break;
      }
    }
    const currentTier = VIP_TIERS[currentTierIndex];
    const nextTier = currentTierIndex < VIP_TIERS.length - 1 ? VIP_TIERS[currentTierIndex + 1] : null;

    let progress = 100;
    let remainingToNext = 0;
    if (nextTier) {
      const range = nextTier.threshold - currentTier.threshold;
      const current = totalWagered - currentTier.threshold;
      progress = Math.min(100, Math.max(0, (current / range) * 100));
      remainingToNext = Math.max(0, nextTier.threshold - totalWagered);
    }

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const cases = VIP_TIERS.map((tier) => {
      const isUnlocked = totalWagered >= tier.threshold;
      const claim = user.dailyClaims.find(c => c.tier === tier.id);
      let canClaim = false;
      let cooldownRemainingSec = 0;
      let nextClaimAt: string | null = null;

      if (isUnlocked) {
        if (!claim) {
          canClaim = true;
        } else {
          const timeSinceClaim = now - new Date(claim.claimedAt).getTime();
          if (timeSinceClaim >= DAY_MS) {
            canClaim = true;
          } else {
            cooldownRemainingSec = Math.ceil((DAY_MS - timeSinceClaim) / 1000);
            nextClaimAt = new Date(new Date(claim.claimedAt).getTime() + DAY_MS).toISOString();
          }
        }
      }

      return {
        tierId: tier.id,
        tierName: tier.name,
        threshold: tier.threshold,
        rakeback: tier.rakeback,
        color: tier.color,
        gradient: tier.gradient,
        caseName: tier.caseName,
        caseDescription: tier.caseDescription,
        isUnlocked,
        canClaim,
        cooldownRemainingSec,
        nextClaimAt,
        loot: tier.loot,
      };
    });

    res.json({
      currentTier: {
        id: currentTier.id,
        name: currentTier.name,
        color: currentTier.color,
        gradient: currentTier.gradient,
        rakeback: currentTier.rakeback,
        threshold: currentTier.threshold,
      },
      nextTier: nextTier ? {
        id: nextTier.id,
        name: nextTier.name,
        color: nextTier.color,
        gradient: nextTier.gradient,
        rakeback: nextTier.rakeback,
        threshold: nextTier.threshold,
        remaining: remainingToNext,
      } : null,
      totalWagered,
      progress: progress,
      rakebackBalance: user.rakebackBalance,
      level: user.level,
      xp: user.xp,
      mockBalance: user.mockBalance,
      cases,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vip/claim-case', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { tier: tierId } = req.body;

  try {
    const responseData = await withUserLock(userId, async () => {
      const tier = VIP_TIERS.find(t => t.id === tierId);
      if (!tier) {
        throw new Error('Invalid VIP case tier');
      }

      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { dailyClaims: true }
        });
        if (!user) throw new Error('User not found');

        if (user.totalWagered < tier.threshold) {
          throw new Error(`Tier ${tier.name} is locked. Requires ${(tier.threshold / 100).toLocaleString()} DLs wagered.`);
        }

        const DAY_MS = 24 * 60 * 60 * 1000;
        const existingClaim = user.dailyClaims.find(c => c.tier === tier.id);
        if (existingClaim) {
          const timeSince = Date.now() - new Date(existingClaim.claimedAt).getTime();
          if (timeSince < DAY_MS) {
            const remainingSec = Math.ceil((DAY_MS - timeSince) / 1000);
            const minutes = Math.ceil(remainingSec / 60);
            throw new Error(`Daily case on cooldown. Available in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
          }
        }

        // Roll winning item by weight
        const totalWeight = tier.loot.reduce((sum, item) => sum + item.weight, 0);
        let rand = Math.random() * totalWeight;
        let winningItem = tier.loot[0];
        for (const item of tier.loot) {
          if (rand < item.weight) {
            winningItem = item;
            break;
          }
          rand -= item.weight;
        }

        // 60-item roller strip, winner placed at index 42
        const winningIndex = 42;
        const strip = Array.from({ length: 60 }).map((_, i) => {
          if (i === winningIndex) return winningItem;
          return tier.loot[Math.floor(Math.random() * tier.loot.length)];
        });

        // Upsert DailyClaim
        await tx.dailyClaim.upsert({
          where: {
            userId_tier: {
              userId,
              tier: tier.id,
            }
          },
          create: {
            userId,
            tier: tier.id,
            rewardName: winningItem.name,
            rewardValue: winningItem.value,
            rewardColor: winningItem.color,
            claimedAt: new Date(),
          },
          update: {
            rewardName: winningItem.name,
            rewardValue: winningItem.value,
            rewardColor: winningItem.color,
            claimedAt: new Date(),
          }
        });

        // Create item in inventory
        const createdItem = await tx.userItem.create({
          data: {
            userId,
            name: winningItem.name,
            value: winningItem.value,
            color: winningItem.color,
            status: 'inventory'
          }
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId,
            amount: winningItem.value,
            gameType: 'daily_reward',
            result: `claim_${tier.id}`
          }
        });

        // Announce in chat
        await tx.chatMessage.create({
          data: {
            userId,
            content: `🎁 Unboxed a ${winningItem.name} ($${(winningItem.value / 100).toFixed(2)}) from the Daily ${tier.name} Case!`
          }
        });

        return {
          winningItem,
          winningIndex,
          strip,
          createdItem,
          tierId: tier.id,
        };
      });
    });

    res.json(responseData);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim daily case' });
  }
});

// GET /api/leaderboard (public)
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        totalWagered: true,
        mockBalance: true
      }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── GAME ROUTES (protected) ──────────────────────────────────────────────────

app.get('/api/bets/live', (req: Request, res: Response) => {
  res.json({
    recent: recentLiveBets,
    highRollers: highRollerBets,
    luckyWins: luckyWins
  });
});

// POST /api/play/coinflip
app.post('/api/play/coinflip', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount, betOn } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount.' });
    return;
  }
  if (betOn !== 'heads' && betOn !== 'tails') {
    res.status(400).json({ error: 'betOn must be "heads" or "tails".' });
    return;
  }

  try {

    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        const settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
        const edge = settings?.coinflipHouseEdge ?? 0.05;

        const pfResult = await generateProvablyFairFloat(tx, userId);
        const outcome = pfResult.float < 0.5 ? 'heads' : 'tails';
        const win = outcome === betOn;
        // Normal payout is 1x profit. We deduct the house edge from the winnings.
        const profit = win ? Math.floor(amount * (1 - edge)) : -amount;

        // Level/XP calculation helper inside the transaction
        const newXp = user.xp + amount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered)); // dynamic rakeback

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: profit },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: amount }, /* POT_HOOK:amount */
            rakebackBalance: { increment: rakebackAmount }
          },
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        const transaction = await tx.transaction.create({
          data: { userId, amount, gameType: 'coinflip', result: win ? 'win' : 'loss' },
        });

        return { outcome, win, updatedUser, transaction, profit };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Coinflip', betAmount: amount, multiplier: result.win ? 2 : 0, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/crash
app.post('/api/play/crash', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount, cashoutMultiplier } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount.' });
    return;
  }
  if (!cashoutMultiplier || cashoutMultiplier < 1.01) {
    res.status(400).json({ error: 'Cashout multiplier must be at least 1.01x.' });
    return;
  }

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        // Generate crash point (house edge built in). 
        // Formula: e = 0.99, r = Math.random(), crash = max(1.00, e / (1 - r))
        const e = 0.95; // 5% house edge for crash
        const pfResult = await generateProvablyFairFloat(tx, userId);
        const r = pfResult.float;
        const rawCrash = e / (1 - r);
        const crashPoint = Math.max(1.00, Math.floor(rawCrash * 100) / 100);

        const win = cashoutMultiplier <= crashPoint;
        const profit = win ? (amount * cashoutMultiplier) - amount : -amount;

        // Level/XP calculation
        const newXp = user.xp + amount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = amount * getVIPRakebackPercentage(user.totalWagered);

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: profit },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: amount }, /* POT_HOOK:amount */
            rakebackBalance: { increment: rakebackAmount }
          }
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        await tx.transaction.create({
          data: { userId, amount, gameType: 'crash', result: win ? 'win' : 'loss' },
        });

        return { crashPoint, win, profit, updatedUser };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Crash', betAmount: amount, multiplier: result.win ? cashoutMultiplier : 0, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/dice
app.post('/api/play/dice', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount, winChance } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount.' });
    return;
  }
  if (!winChance || winChance < 1 || winChance > 98) {
    res.status(400).json({ error: 'Win chance must be between 1 and 98.' });
    return;
  }

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        // Dice logic: 99% payout (1% house edge)
        // Multiplier = 99 / winChance
        const multiplier = 99 / winChance;

        const pfResult = await generateProvablyFairFloat(tx, userId);
        const roll = pfResult.float * 100; // roll between 0 and 99.99...
        const win = roll < winChance;
        const profit = win ? Math.floor(amount * multiplier) - amount : -amount;

        // Level/XP calculation
        const newXp = user.xp + amount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered));

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: profit },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: amount }, /* POT_HOOK:amount */
            rakebackBalance: { increment: rakebackAmount }
          }
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        await tx.transaction.create({
          data: { userId, amount, gameType: 'dice', result: win ? 'win' : 'loss' },
        });

        return { roll, win, profit, multiplier, updatedUser };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Dice', betAmount: amount, multiplier: result.multiplier, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/roulette
app.post('/api/play/roulette', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount, betOn } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount.' });
    return;
  }
  if (!['red', 'black', 'green'].includes(betOn)) {
    res.status(400).json({ error: 'Bet must be red, black, or green.' });
    return;
  }

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        // Roulette math: 15 slots (0 to 14)
        // 0 = Green (14x)
        // 1 to 7 = Red (2x)
        // 8 to 14 = Black (2x)
        const pfResult = await generateProvablyFairFloat(tx, userId);
        const roll = Math.floor(pfResult.float * 15);

        let outcomeColor = 'green';
        if (roll >= 1 && roll <= 7) outcomeColor = 'red';
        else if (roll >= 8 && roll <= 14) outcomeColor = 'black';

        const settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
        const edge = settings?.rouletteHouseEdge ?? 0.05;

        const win = betOn === outcomeColor;
        let multiplier = 0;
        if (win) {
          multiplier = outcomeColor === 'green' ? 14 : 2;
          multiplier = multiplier * (1 - edge);
        }

        const profit = win ? Math.floor(amount * multiplier) - amount : -amount;

        // Level/XP calculation
        const newXp = user.xp + amount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = Math.floor(amount * getVIPRakebackPercentage(user.totalWagered));

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: profit },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: amount }, /* POT_HOOK:amount */
            rakebackBalance: { increment: rakebackAmount }
          }
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        await tx.transaction.create({
          data: { userId, amount, gameType: 'roulette', result: win ? 'win' : 'loss' },
        });

        return { roll, outcomeColor, win, profit, multiplier, updatedUser };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Roulette', betAmount: amount, multiplier: result.multiplier, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/mines/start
app.post('/api/play/mines/start', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { minesCount } = req.body;
  const amount = Number(req.body.amount);
  const userId = req.userId!;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  if (minesCount < 1 || minesCount > 24) return res.status(400).json({ error: 'Mines count must be between 1 and 24.' });

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        // Deduct bet amount upfront
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { mockBalance: { decrement: amount } }
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        // Generate mine locations using provably fair hash
        const pfResult = await generateProvablyFairFloat(tx, userId);
        let currentHash = pfResult.hmac;
        
        const allTiles = Array.from({ length: 25 }, (_, i) => i);
        const mineLocations: number[] = [];
        let hashIndex = 0;
        
        while (mineLocations.length < minesCount) {
          if (hashIndex >= currentHash.length - 2) {
             currentHash = crypto.createHmac('sha256', currentHash).update(pfResult.pf.serverSeed).digest('hex');
             hashIndex = 0;
          }
          const val = parseInt(currentHash.substring(hashIndex, hashIndex + 2), 16);
          hashIndex += 2;
          
          const tileIndex = val % allTiles.length;
          mineLocations.push(allTiles[tileIndex]);
          allTiles.splice(tileIndex, 1);
        }

        // Board state: array of 25 integers. 0 = hidden.
        const boardState = Array(25).fill(0);

        const game = await tx.minesGame.create({
          data: {
            userId,
            betAmount: amount,
            minesCount,
            boardState: JSON.stringify(boardState),
            mineLocations: JSON.stringify(mineLocations),
            status: "playing",
            multiplier: 1.0,
            profit: 0
          }
        });

        return { gameId: game.id, updatedUser };
      });
    });

    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/mines/click
app.post('/api/play/mines/click', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.body;
  const tileIndex = parseInt(req.body.tileIndex, 10);
  const userId = req.userId!;

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const game = await tx.minesGame.findUnique({ where: { id: gameId, userId } });
        if (!game) throw new Error('Game not found');
        if (game.status !== 'playing') throw new Error('Game is over');

        let boardState = JSON.parse(game.boardState);
        const mineLocations = JSON.parse(game.mineLocations);

        if (boardState[tileIndex] !== 0) throw new Error('Tile already revealed');

        // Check for mine
        if (mineLocations.includes(tileIndex)) {
          // Blown up!
          boardState[tileIndex] = 2; // 2 = explosion

          // Update user stats
          const user = await tx.user.findUnique({ where: { id: userId } });
          const newXp = user!.xp + game.betAmount;
          const newLevel = calculateLevel(newXp);
          const rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              xp: newXp,
              level: newLevel,
              totalWagered: { increment: game.betAmount }, /* POT_HOOK:game.betAmount */
              rakebackBalance: { increment: rakebackAmount }
            }
          });
        const potCut = Math.floor(game.betAmount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

          await tx.transaction.create({
            data: { userId, amount: game.betAmount, gameType: 'mines', result: 'loss' },
          });

          await tx.minesGame.update({
            where: { id: gameId },
            data: { status: 'blown_up', boardState: JSON.stringify(boardState) }
          });

          return { status: 'blown_up', boardState, mineLocations, updatedUser };
        }

        // Safe tile
        boardState[tileIndex] = 1; // 1 = safe

        // Calculate new multiplier
        const safeTilesRevealed = boardState.filter((t: number) => t === 1).length;

        // Math for mines multiplier: nCr(25, safe) / nCr(25-mines, safe)
        // A simplified approximation for the mock casino:
        const settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
        const houseEdge = 1.0 - (settings?.minesHouseEdge ?? 0.05);
        let newMultiplier = 1.0;
        let remainingSafe = 25 - game.minesCount;
        let available = 25;

        let probability = 1;
        for (let i = 0; i < safeTilesRevealed; i++) {
          probability *= (remainingSafe - i) / (available - i);
        }
        newMultiplier = (1 / probability) * houseEdge;

        const profit = Math.floor(game.betAmount * newMultiplier) - game.betAmount;

        await tx.minesGame.update({
          where: { id: gameId },
          data: {
            boardState: JSON.stringify(boardState),
            multiplier: newMultiplier,
            profit
          }
        });

        return { status: 'playing', boardState, multiplier: newMultiplier, profit };
      });
    });

    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/mines/cashout
app.post('/api/play/mines/cashout', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.body;
  const userId = req.userId!;

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const game = await tx.minesGame.findUnique({ where: { id: gameId, userId } });
        if (!game) throw new Error('Game not found');
        if (game.status !== 'playing') throw new Error('Game is over');
        if (game.multiplier <= 1.0) throw new Error('Cannot cashout at 1.0x'); // Must click at least one

        const totalWin = game.betAmount + game.profit;

        const user = await tx.user.findUnique({ where: { id: userId } });
        const newXp = user!.xp + game.betAmount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = Math.floor(game.betAmount * getVIPRakebackPercentage(user!.totalWagered));

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: totalWin },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: game.betAmount }, /* POT_HOOK:game.betAmount */
            rakebackBalance: { increment: rakebackAmount }
          }
        });
        const potCut = Math.floor(game.betAmount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        await tx.transaction.create({
          data: { userId, amount: game.betAmount, gameType: 'mines', result: 'win' },
        });

        const mineLocations = JSON.parse(game.mineLocations);

        await tx.minesGame.update({
          where: { id: gameId },
          data: { status: 'cashed_out' }
        });

        return { status: 'cashed_out', profit: game.profit, updatedUser, mineLocations, betAmount: game.betAmount };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Mines', betAmount: result.betAmount, multiplier: result.profit > 0 ? 1 : 0, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/play/plinko
app.post('/api/play/plinko', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount, rows: rawRows, risk: rawRisk } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  const rows = parseInt(rawRows) || 14;
  const risk = String(rawRisk || 'medium').toLowerCase();

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < amount) throw new Error('Insufficient balance');

        const pfResult = await generateProvablyFairFloat(tx, userId);
        let currentHash = pfResult.hmac;

        const path: number[] = [];
        let bucket = 0;

        for (let i = 0; i < rows; i++) {
          const val = parseInt(currentHash.substring(i * 2, i * 2 + 2), 16);
          const dir = (val % 2 === 0) ? 0 : 1;
          path.push(dir);
          if (dir === 1) bucket++;
        }

        const multipliers = PLINKO_PAYOUTS[rows]?.[risk] || PLINKO_PAYOUTS[14]['medium'];
        const multiplier = multipliers[bucket];

        const profit = (amount * multiplier) - amount;

        // Level/XP calculation
        const newXp = user.xp + amount;
        const newLevel = calculateLevel(newXp);
        const rakebackAmount = amount * getVIPRakebackPercentage(user.totalWagered);

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: profit },
            xp: newXp,
            level: newLevel,
            totalWagered: { increment: amount }, /* POT_HOOK:amount */
            rakebackBalance: { increment: rakebackAmount }
          }
        });
        const potCut = Math.floor(amount * 0.05);
        if (potCut > 0) {
          await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
        }

        await tx.transaction.create({
          data: { userId, amount, gameType: 'plinko', result: profit >= 0 ? 'win' : 'loss' },
        });

        return { path, bucket, multiplier, profit, updatedUser };
      });
    });

    emitLiveBet(io, { user: result.updatedUser.username, game: 'Plinko', betAmount: amount, multiplier: result.multiplier, profit: result.profit });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── CHAT ENDPOINTS ────────────────────────────────────────────────────────────

// GET /api/chat/messages
app.get('/api/chat/messages', async (req: Request, res: Response) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { username: true, totalWagered: true } }
      }
    });
    // Return in chronological order
    res.json(messages.reverse());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chat/send
app.post('/api/chat/send', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  const userId = req.userId!;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const msg = await prisma.chatMessage.create({
      data: { userId, content: content.trim() },
      include: { user: { select: { username: true, totalWagered: true } } }
    });
    
    // Broadcast the new message via Socket.io
    io.emit('chat_message', msg);
    
    res.json(msg);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── PROVABLY FAIR ENDPOINTS ───────────────────────────────────────────────────

// GET /api/provably-fair/current
app.get('/api/provably-fair/current', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    let pf = await prisma.provablyFair.findFirst({
      where: { userId, active: true }
    });

    if (!pf) {
      // Create one if it doesn't exist
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
      const clientSeed = crypto.randomBytes(16).toString('hex');

      pf = await prisma.provablyFair.create({
        data: { userId, serverSeed, serverHash, clientSeed, active: true }
      });
    }

    // Never return the active serverSeed
    res.json({
      serverHash: pf.serverHash,
      clientSeed: pf.clientSeed,
      nonce: pf.nonce
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/provably-fair/rotate
app.post('/api/provably-fair/rotate', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { newClientSeed } = req.body;

  if (!newClientSeed) return res.status(400).json({ error: 'Client seed is required.' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate current
      const oldPf = await tx.provablyFair.findFirst({ where: { userId, active: true } });
      if (oldPf) {
        await tx.provablyFair.update({
          where: { id: oldPf.id },
          data: { active: false }
        });
      }

      // Create new
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

      const newPf = await tx.provablyFair.create({
        data: { userId, serverSeed, serverHash, clientSeed: newClientSeed, active: true }
      });

      return {
        previous: oldPf ? {
          serverSeed: oldPf.serverSeed,
          serverHash: oldPf.serverHash,
          clientSeed: oldPf.clientSeed,
          nonce: oldPf.nonce
        } : null,
        current: {
          serverHash: newPf.serverHash,
          clientSeed: newPf.clientSeed,
          nonce: newPf.nonce
        }
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── VIP ENDPOINTS ────────────────────────────────────────────────────────────

app.post('/api/vip/claim-rakeback', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        
        if (user.rakebackBalance <= 0) {
          throw new Error('No rakeback available to claim');
        }

        const amount = user.rakebackBalance;

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { increment: amount },
            rakebackBalance: 0
          }
        });

        // Optionally record a transaction for the claim
        await tx.transaction.create({
          data: { userId, amount, gameType: 'rakeback_claim', result: 'claim' }
        });

        return { amount, updatedUser };
      });
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/cases
app.get('/api/cases', async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany({
      where: { active: true },
      include: { items: true }
    });
    res.json(cases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cases/:id
app.get('/api/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { items: true }
    });
    if (!caseData) return res.status(404).json({ error: 'Case not found' });
    res.json(caseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cases/open
app.post('/api/cases/open', async (req: Request, res: Response) => {
  const { caseId, demo } = req.body;

  try {
    const selectedCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
      include: { items: true }
    });
    if (!selectedCase || !selectedCase.active) throw new Error('Case not found');
    if (selectedCase.items.length === 0) throw new Error('Case is empty');

    // Split items into main pool and lucky star pool based on the new flag
    const mainPool = selectedCase.items.filter((i: any) => !i.isLuckyStarItem);
    const luckyStarPool = selectedCase.items.filter((i: any) => i.isLuckyStarItem);

    // Build the primary pool: main items + one synthetic "Lucky Star" trigger
    const primaryPool = [...mainPool];
    if (luckyStarPool.length > 0) {
      const lsWeight = luckyStarPool.reduce((acc: number, item: any) => acc + item.weight, 0);
      primaryPool.push({
        id: -999,
        caseId: selectedCase.id,
        name: 'Lucky Star',
        value: 0,
        color: '#3b82f6',
        weight: lsWeight,
        image: null,
        imageUrl: null,
        isLuckyStarItem: false
      });
    }
    
    // If primaryPool is empty (bad config), fallback to all items
    if (primaryPool.length === 0) {
      primaryPool.push(...selectedCase.items);
    }

    // Select primary item based on true mathematical weights from the primary pool
    const totalWeight = primaryPool.reduce((acc: number, item: any) => acc + item.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let winningItem = primaryPool[0];
    for (const item of primaryPool) {
      if (randomNum < item.weight) {
        winningItem = item;
        break;
      }
      randomNum -= item.weight;
    }

    let hitLuckyStar = false;
    let finalWonItem = winningItem;

    // If the winning item is the Lucky Star trigger, perform a sub-roll from the bonus pool
    if (winningItem.name.toLowerCase() === 'lucky star' && luckyStarPool.length > 0) {
      hitLuckyStar = true;
      const lsTotalWeight = luckyStarPool.reduce((acc: number, item: any) => acc + item.weight, 0);
      let lsRandomNum = Math.random() * lsTotalWeight;
      for (const item of luckyStarPool) {
        if (lsRandomNum < item.weight) {
          finalWonItem = item;
          break;
        }
        lsRandomNum -= item.weight;
      }
    }

    // Generate a 75-item strip for the spinning reel (winning item fixed at index 50)
    // The filler is drawn from the main pool, allowing the trigger to pass by visually.
    const winningIndex = 50;
    const safeFillerPool = primaryPool;
    
    const strip = Array.from({ length: 75 }).map((_, i) => {
      if (i === winningIndex) return winningItem; // if hitLuckyStar, this is the trigger item
      const rand = Math.floor(Math.random() * safeFillerPool.length);
      return safeFillerPool[rand];
    });

    // If demo spin, return immediately without touching user balance or database
    if (demo) {
      return res.json({
        winningItem: finalWonItem,
        hitLuckyStar,
        strip,
        winningIndex,
        isDemo: true,
      });
    }

    // Real open: requires valid authentication
    requireAuth(req as AuthRequest, res, async () => {
      requireNotFrozen(req as AuthRequest, res, async () => {
        const userId = (req as AuthRequest).userId!;
      const isBorrow = req.body.borrow === true;

      try {
        const result = await withUserLock(userId, async () => {
          return await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            let settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
            if (!settings) {
              settings = await tx.siteSettings.create({ data: { id: 1 } });
            }
            const siteMaxBorrow = settings.maxBorrowLimit ?? 100000;

            if (isBorrow) {
              if (!settings.borrowEnabled) {
                throw new Error('Case borrowing is currently disabled by administrator.');
              }
              const userCreditLimit = calculateUserBorrowLimit(user, siteMaxBorrow);

              if (user.debt + selectedCase.price > userCreditLimit) {
                const remaining = Math.max(0, userCreditLimit - user.debt);
                throw new Error(`Credit limit reached! Your current credit limit is ${(userCreditLimit / 100).toFixed(0)} DLs (increases as you play & wager). You currently owe ${(user.debt / 100).toFixed(2)} DLs (Available credit: ${(remaining / 100).toFixed(2)} DLs).`);
              }
            } else {
              if (user.mockBalance < selectedCase.price) throw new Error('Insufficient balance');
            }

            // Calculate XP and Rakeback (Loans do NOT award rakeback)
            const newXp = user.xp + selectedCase.price;
            const newLevel = calculateLevel(newXp);
            const rakebackAmount = isBorrow ? 0 : Math.floor(selectedCase.price * getVIPRakebackPercentage(user.totalWagered));

            // Create the item in inventory
            const createdItem = await tx.userItem.create({
              data: {
                userId,
                name: finalWonItem.name,
                value: finalWonItem.value,
                color: finalWonItem.color,
                imageUrl: finalWonItem.imageUrl,
                status: 'inventory',
                isBorrowed: isBorrow,
                borrowPrice: isBorrow ? selectedCase.price : 0
              }
            });

            const userUpdateData: any = {
              xp: newXp,
              level: newLevel,
              totalWagered: { increment: selectedCase.price }, /* POT_HOOK:selectedCase.price */
              rakebackBalance: { increment: rakebackAmount }
            };

            if (isBorrow) {
              const interest = Math.floor(selectedCase.price * 0.1);
              userUpdateData.debt = { increment: selectedCase.price + interest };
              if (user.debt === 0) { userUpdateData.debtCreatedAt = new Date(); }
              await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: interest } } });
            } else {
              userUpdateData.mockBalance = { decrement: selectedCase.price };
              const potCut = Math.floor(selectedCase.price * 0.05);
              if (potCut > 0) {
                await tx.siteSettings.update({ where: { id: 1 }, data: { casinoPot: { increment: potCut } } });
              }
            }

            const updatedUser = await tx.user.update({
              where: { id: userId },
              data: userUpdateData
            });

            await tx.transaction.create({
              data: {
                userId,
                amount: selectedCase.price,
                gameType: isBorrow ? 'case_borrow' : 'case_open',
                result: isBorrow ? 'borrowed' : 'wager'
              },
            });

            if (winningItem.value >= 10000) {
              await tx.chatMessage.create({
                data: {
                  userId,
                  content: `🎁 Just unboxed a ${winningItem.name} ($${(winningItem.value / 100).toFixed(2)}) from ${selectedCase.name}${isBorrow ? ' (Borrowed)' : ''}!`
                }
              });
            }

            return {
              winningItem: finalWonItem,
              hitLuckyStar,
              strip,
              winningIndex,
              updatedUser: {
                ...updatedUser,
                borrowLimit: calculateUserBorrowLimit(updatedUser, siteMaxBorrow)
              },
              createdItem,
              isDemo: false,
              isBorrow
            };
          });
        });

        if (!result.isDemo && !result.isBorrow) {
          emitLiveBet(io, { 
            user: result.updatedUser.username, 
            game: `Case (${selectedCase.name})`, 
            betAmount: selectedCase.price, 
            multiplier: result.winningItem.value / selectedCase.price, 
            profit: result.winningItem.value - selectedCase.price 
          });
        }

        res.json(result);
      } catch (txErr: any) {
        res.status(400).json({ error: txErr.message });
      }
      });
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── INVENTORY ENDPOINTS ───────────────────────────────────────────────────────

// POST /api/loan/repay-all
app.post('/api/loan/repay-all', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.debt <= 0) throw new Error('No debt to repay');
        if (user.mockBalance < user.debt) throw new Error('Insufficient balance to repay full debt');

        // Pay off debt
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { decrement: user.debt },
            debt: 0,
            debtCreatedAt: null,
            isFrozen: false
          }
        });

        // Set all borrowed items to unborrowed
        await tx.userItem.updateMany({
          where: { userId, isBorrowed: true },
          data: { isBorrowed: false, borrowPrice: 0 }
        });

        await tx.transaction.create({
          data: { userId, amount: user.debt, gameType: 'loan_repay_all', result: 'repaid' }
        });

        return updatedUser;
      });
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/inventory
app.get('/api/inventory', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.userItem.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/sell
app.post('/api/inventory/sell', requireAuth, async (req: AuthRequest, res: Response) => {
  const { itemIds } = req.body;
  const userId = req.userId!;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'No items selected.' });
  }

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        // Fetch items that are still in inventory
        const items = await tx.userItem.findMany({
          where: { id: { in: itemIds }, userId, status: 'inventory' }
        });

        if (items.length === 0) {
          throw new Error('No valid items found to sell.');
        }

        let totalPayout = 0;
        let totalDebtCleared = 0;

        for (const item of items) {
          if (item.isBorrowed && item.borrowPrice > 0) {
            // If borrowed, the sale price settles the borrow loan first; excess is profit
            const profit = Math.max(0, item.value - item.borrowPrice);
            totalPayout += profit;
            totalDebtCleared += item.borrowPrice;
          } else {
            totalPayout += item.value;
          }
        }

        // Mark as sold
        await tx.userItem.updateMany({
          where: { id: { in: items.map(i => i.id) } },
          data: { status: 'sold' }
        });

        const userUpdate: any = {};
        if (totalPayout > 0) {
          userUpdate.mockBalance = { increment: totalPayout };
        }
                if (totalDebtCleared > 0) {
          userUpdate.debt = { decrement: totalDebtCleared };
          const currentUser = await tx.user.findUnique({ where: { id: userId } });
          if (currentUser && currentUser.debt <= totalDebtCleared) {
            userUpdate.debtCreatedAt = null;
            userUpdate.isFrozen = false;
          }
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: userUpdate
        });

        return { soldCount: items.length, totalPayout, totalDebtCleared, updatedUser };
      });
    });

    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/inventory/repay
app.post('/api/inventory/repay', requireAuth, async (req: AuthRequest, res: Response) => {
  const { itemId } = req.body;
  const userId = req.userId!;

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        const item = await tx.userItem.findFirst({
          where: { id: parseInt(itemId), userId, status: 'inventory', isBorrowed: true }
        });

        if (!item) {
          throw new Error('Borrowed item not found.');
        }

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found.');
        if (user.mockBalance < item.borrowPrice) {
          throw new Error(`Insufficient balance to repay borrow loan (${item.borrowPrice / 100} DLs required).`);
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { decrement: item.borrowPrice },
            debt: { decrement: Math.min(user.debt, item.borrowPrice) },
            ...(user.debt <= item.borrowPrice ? { debtCreatedAt: null, isFrozen: false } : {})
          }
        });

        const updatedItem = await tx.userItem.update({
          where: { id: item.id },
          data: {
            isBorrowed: false,
            borrowPrice: 0
          }
        });

        await tx.transaction.create({
          data: {
            userId,
            amount: item.borrowPrice,
            gameType: 'borrow_repay',
            result: 'repaid'
          }
        });

        return { updatedItem, updatedUser };
      });
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── CASE BATTLES ENDPOINTS ──────────────────────────────────────────────────

// GET /api/battles
app.get('/api/battles', async (req: Request, res: Response) => {
  try {
    const battles = await prisma.battle.findMany({
      where: { status: { in: ['waiting', 'running'] } },
      include: { participants: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(battles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/battles/:id
app.get('/api/battles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const battle = await prisma.battle.findUnique({
      where: { id: parseInt(id as string) },
      include: { participants: true }
    });
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    res.json(battle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/battles/create
app.post('/api/battles/create', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { caseIds, mode, playerCount } = req.body;
  const userId = req.userId!;

  if (!Array.isArray(caseIds) || caseIds.length === 0 || caseIds.length > 50) {
    return res.status(400).json({ error: 'Invalid caseIds array. Max 50 cases.' });
  }
  if (!['normal', 'crazy', 'terminal'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
  if (![2, 3, 4].includes(playerCount)) return res.status(400).json({ error: 'Invalid player count' });

  try {
    const result = await withUserLock(userId, async () => {
      return await prisma.$transaction(async (tx) => {
        // Fetch all cases to calculate total price and ensure they exist
        const cases = await tx.case.findMany({
          where: { id: { in: caseIds.map((id: string) => parseInt(id)) }, active: true }
        });

        let entryFee = 0;
        for (const idStr of caseIds) {
          const c = cases.find(c => c.id === parseInt(idStr));
          if (!c) throw new Error(`Case ${idStr} not found or inactive`);
          entryFee += c.price;
        }

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.mockBalance < entryFee) throw new Error('Insufficient balance');

        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: {
            mockBalance: { decrement: entryFee },
            xp: { increment: entryFee },
            level: calculateLevel(user.xp + entryFee),
            totalWagered: { increment: entryFee }, /* POT_HOOK:entryFee */
            rakebackBalance: { increment: Math.floor(entryFee * getVIPRakebackPercentage(user.totalWagered)) }
          }
        });

        const battle = await tx.battle.create({
          data: {
            caseIds: JSON.stringify(caseIds),
            mode,
            targetPlayerCount: playerCount,
            entryFee,
            status: 'waiting',
            participants: {
              create: {
                userId: userId.toString(),
                position: 1
              }
            }
          },
          include: { participants: true }
        });

        await tx.transaction.create({
          data: { userId, amount: entryFee, gameType: 'battle_create', result: 'wager' },
        });

        return battle;
      });
    });

    io.emit('battle_updated', result);
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/battles/join
app.post('/api/battles/join', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { battleId } = req.body;
  const userId = req.userId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const battle = await tx.battle.findUnique({ where: { id: battleId }, include: { participants: true } });
      if (!battle) throw new Error('Battle not found');
      if (battle.status !== 'waiting') throw new Error('Battle already started');
      if (battle.participants.length >= battle.targetPlayerCount) throw new Error('Battle full');

      if (battle.participants.find(p => p.userId === userId.toString())) {
        throw new Error('Already in battle');
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.mockBalance < battle.entryFee) throw new Error('Insufficient balance');

      await tx.user.update({
        where: { id: userId },
        data: {
          mockBalance: { decrement: battle.entryFee },
          xp: { increment: battle.entryFee },
          level: calculateLevel(user.xp + battle.entryFee),
          totalWagered: { increment: battle.entryFee }, /* POT_HOOK:battle.entryFee */
          rakebackBalance: { increment: Math.floor(battle.entryFee * getVIPRakebackPercentage(user.totalWagered)) }
        }
      });

      const nextPosition = battle.participants.length + 1;

      const participant = await tx.battleParticipant.create({
        data: {
          battleId,
          userId: userId.toString(),
          position: nextPosition
        }
      });

      await tx.transaction.create({
        data: { userId, amount: battle.entryFee, gameType: 'battle_join', result: 'wager' },
      });

      return await tx.battle.findUnique({ where: { id: battleId }, include: { participants: true } });
    });

    io.emit('battle_updated', result);
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/battles/call-bots
app.post('/api/battles/call-bots', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { battleId, botCount } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const battle = await tx.battle.findUnique({ where: { id: battleId }, include: { participants: true } });
      if (!battle || battle.status !== 'waiting') throw new Error('Battle not available');
      
      const availableSpots = battle.targetPlayerCount - battle.participants.length;
      if (botCount > availableSpots) throw new Error('Cannot add that many bots');

      let nextPos = battle.participants.length + 1;
      for (let i = 0; i < botCount; i++) {
        await tx.battleParticipant.create({
          data: {
            battleId,
            userId: `bot-${Math.floor(Math.random() * 9999)}`,
            position: nextPos++
          }
        });
      }

      return await tx.battle.findUnique({ where: { id: battleId }, include: { participants: true } });
    });
    
    io.emit('battle_updated', result);
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/battles/start
app.post('/api/battles/start', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { battleId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const battle = await tx.battle.findUnique({ where: { id: battleId }, include: { participants: true } });
      if (!battle || battle.status !== 'waiting') throw new Error('Cannot start');

      const caseIds = JSON.parse(battle.caseIds) as string[];

      const cases = await tx.case.findMany({
        where: { id: { in: caseIds.map(id => parseInt(id)) } },
        include: { items: true }
      });

      await tx.battle.update({ where: { id: battleId }, data: { status: 'running' } });

      let totalPotValue = 0;

      // Structure: rounds[roundIndex] = [ rolls for each participant ]
      const rounds = [];
      const participantStats: Record<number, { total: number, lastPull: number, userId: string }> = {};

      battle.participants.forEach(p => {
        participantStats[p.id] = { total: 0, lastPull: 0, userId: p.userId };
      });

      for (let i = 0; i < caseIds.length; i++) {
        const c = cases.find(c => c.id === parseInt(caseIds[i]));
        if (!c || c.items.length === 0) continue;

        const mainPool = c.items.filter((i: any) => !i.isLuckyStarItem);
        const luckyStarPool = c.items.filter((i: any) => i.isLuckyStarItem);

        const primaryPool = [...mainPool];
        if (luckyStarPool.length > 0) {
          const lsWeight = luckyStarPool.reduce((acc: number, item: any) => acc + item.weight, 0);
          primaryPool.push({
            id: -999,
            caseId: c.id,
            name: 'Lucky Star',
            value: 0,
            color: '#3b82f6',
            weight: lsWeight,
            image: null,
            imageUrl: null,
            isLuckyStarItem: false
          } as any);
        }
        if (primaryPool.length === 0) primaryPool.push(...c.items);

        const roundRolls = [];
        for (const p of battle.participants) {
          const totalWeight = primaryPool.reduce((acc, item) => acc + item.weight, 0);
          
          let pfFloat = Math.random();
          if (!p.userId.startsWith('bot-')) {
            const pfRes = await generateProvablyFairFloat(tx, parseInt(p.userId));
            pfFloat = pfRes.float;
          }

          let randomNum = pfFloat * totalWeight;
          let winningItem = primaryPool[0];
          for (const item of primaryPool) {
            if (randomNum < item.weight) {
              winningItem = item;
              break;
            }
            randomNum -= item.weight;
          }

          let hitLuckyStar = false;
          let finalWonItem = winningItem;

          if (winningItem.name.toLowerCase() === 'lucky star') {
            hitLuckyStar = true;
            const safeLsPool = luckyStarPool.length > 0 ? luckyStarPool : c.items;
            const lsTotalWeight = safeLsPool.reduce((acc: number, item: any) => acc + item.weight, 0);
            
            let lsPfFloat = Math.random();
            if (!p.userId.startsWith('bot-')) {
              const lsPfRes = await generateProvablyFairFloat(tx, parseInt(p.userId));
              lsPfFloat = lsPfRes.float;
            }

            let lsRandomNum = lsPfFloat * lsTotalWeight;
            for (const item of safeLsPool) {
              if (lsRandomNum < item.weight) {
                finalWonItem = item;
                break;
              }
              lsRandomNum -= item.weight;
            }
          }

          participantStats[p.id].total += finalWonItem.value;
          participantStats[p.id].lastPull = finalWonItem.value;
          totalPotValue += finalWonItem.value;

          roundRolls.push({ 
            participantId: p.id, 
            userId: p.userId, 
            item: winningItem, 
            hitLuckyStar, 
            actualWinItem: hitLuckyStar ? finalWonItem : undefined 
          });
        }
        console.log("ROUND ROLLS: ", JSON.stringify(roundRolls, null, 2));
        rounds.push(roundRolls);
      }

      for (const p of battle.participants) {
        await tx.battleParticipant.update({
          where: { id: p.id },
          data: { lootTotal: participantStats[p.id].total }
        });
      }

      // Determine winner
      let winnerId = battle.participants[0].userId;
      let tiedPlayers: string[] = [];
      let isTie = false;

      const pStatsArr = Object.values(participantStats);
      if (battle.mode === 'crazy') {
        // Lowest overall wins
        const minLoot = Math.min(...pStatsArr.map(s => s.total));
        const tied = pStatsArr.filter(s => s.total === minLoot);
        tiedPlayers = tied.map(s => s.userId);
      } else if (battle.mode === 'terminal') {
        // Highest last pull wins. If tie, fallback to highest total.
        const maxLast = Math.max(...pStatsArr.map(s => s.lastPull));
        const tiedLast = pStatsArr.filter(s => s.lastPull === maxLast);
        if (tiedLast.length > 1) {
          const maxTotal = Math.max(...tiedLast.map(s => s.total));
          const tiedTotal = tiedLast.filter(s => s.total === maxTotal);
          tiedPlayers = tiedTotal.map(s => s.userId);
        } else {
          tiedPlayers = [tiedLast[0].userId];
        }
      } else {
        // Normal: Highest overall wins
        const maxLoot = Math.max(...pStatsArr.map(s => s.total));
        const tied = pStatsArr.filter(s => s.total === maxLoot);
        tiedPlayers = tied.map(s => s.userId);
      }

      if (tiedPlayers.length > 1) {
        isTie = true;
        // Randomly pick a winner from the tied players
        winnerId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
      } else {
        winnerId = tiedPlayers[0];
      }

      await tx.battle.update({
        where: { id: battleId },
        data: { status: 'finished', winnerId, totalPotValue }
      });

      // Award all unboxed items to the winner's inventory so they don't get raw DLs after the battle spins.
      // If they choose to sell, they can sell from their inventory for DLs.
      if (!winnerId.startsWith('bot-')) {
        const winnerIntId = parseInt(winnerId);
        const allItemsWon: any[] = [];
        rounds.forEach(round => {
          round.forEach((roll: any) => {
            const itemToAward = roll.hitLuckyStar && roll.actualWinItem ? roll.actualWinItem : roll.item;
            if (itemToAward && itemToAward.id !== -999) {
              allItemsWon.push(itemToAward);
            }
          });
        });

        if (allItemsWon.length > 0) {
          await tx.userItem.createMany({
            data: allItemsWon.map(item => ({
              userId: winnerIntId,
              name: item.name,
              value: item.value,
              color: item.color,
              imageUrl: item.imageUrl || null,
              status: 'inventory'
            }))
          });
        }
      }

      return { battleId, rounds, winnerId, totalPotValue, mode: battle.mode, isTie, tiedPlayers, entryFee: battle.entryFee, numPlayers: battle.participants.length };
    });

    if (!result.winnerId.startsWith('bot-')) {
      const winnerUser = await prisma.user.findUnique({ where: { id: parseInt(result.winnerId) } });
      if (winnerUser) {
        emitLiveBet(io, { 
          user: winnerUser.username, 
          game: 'Case Battle', 
          betAmount: result.entryFee, 
          multiplier: result.totalPotValue / (result.entryFee || 1), 
          profit: result.totalPotValue - result.entryFee 
        });
      }
    }

    io.emit('battle_started', result);
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── PVP JACKPOT ENDPOINTS ─────────────────────────────────────────────────────

// GET /api/jackpot
app.get('/api/jackpot', async (req: Request, res: Response) => {
  try {
    let round = await prisma.jackpotRound.findFirst({
      where: { status: { in: ['waiting', 'spinning'] } },
      include: { entries: true }
    });

    if (!round) {
      round = await prisma.jackpotRound.create({
        data: { status: 'waiting' },
        include: { entries: true }
      });
    }

    res.json(round);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jackpot/join
app.post('/api/jackpot/join', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.mockBalance < amount) throw new Error('Insufficient balance');

      let round = await tx.jackpotRound.findFirst({ where: { status: 'waiting' }, include: { entries: true } });
      if (!round) throw new Error('No active round');

      await tx.user.update({
        where: { id: userId },
        data: {
          mockBalance: { decrement: amount },
          xp: { increment: amount },
          level: calculateLevel(user.xp + amount),
          totalWagered: { increment: amount }, /* POT_HOOK:amount */
          rakebackBalance: { increment: Math.floor(amount * getVIPRakebackPercentage(user.totalWagered)) }
        }
      });

      const currentTotal = round.totalPotValue;
      const ticketMin = currentTotal;
      const ticketMax = currentTotal + amount - 1;

      await tx.jackpotEntry.create({
        data: { roundId: round.id, userId: userId.toString(), amount, ticketMin, ticketMax }
      });

      await tx.jackpotRound.update({
        where: { id: round.id },
        data: { totalPotValue: { increment: amount } }
      });

      await tx.transaction.create({
        data: { userId, amount, gameType: 'jackpot_join', result: 'wager' },
      });

      return await tx.jackpotRound.findUnique({ where: { id: round.id }, include: { entries: true } });
    });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/jackpot/roll
app.post('/api/jackpot/roll', requireAuth, requireNotFrozen, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.jackpotRound.findFirst({ where: { status: 'waiting' }, include: { entries: true } });
      if (!round || round.entries.length < 2) throw new Error('Not enough players to roll');

      // Calculate winner
      const totalPot = round.totalPotValue;
      const winningTicket = Math.floor(Math.random() * totalPot);

      let winnerId = round.entries[0].userId;

      for (const e of round.entries) {
        if (winningTicket >= e.ticketMin && winningTicket <= e.ticketMax) {
          winnerId = e.userId;
          break;
        }
      }

      await tx.jackpotRound.update({
        where: { id: round.id },
        data: { status: 'finished', winnerId, winningTicket, finishedAt: new Date() }
      });

      // Give pot to winner
      if (!winnerId.startsWith('bot-')) {
        await tx.user.update({
          where: { id: parseInt(winnerId) },
          data: { mockBalance: { increment: totalPot } }
        });
      }

      // Automatically create the next round
      await tx.jackpotRound.create({ data: { status: 'waiting' } });

      return { roundId: round.id, winnerId, winningTicket, totalPot };
    });
    res.json(result);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

// GET /api/admin/items
app.get('/api/admin/items', async (req, res) => {
  try {
    const items = await prisma.adminItem.findMany({ orderBy: { name: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/admin/items
app.post('/api/admin/items', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, value, color } = req.body;
  if (!name || typeof value !== 'number') return res.status(400).json({ error: 'Invalid data' });

  try {
    // Check if it exists
    const existing = await prisma.adminItem.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Item already exists' });

    // Fetch Image
    let imageUrl = req.body.customImageUrl || '';

    if (!imageUrl) {
      return res.status(400).json({ error: 'Fandom API is blocked. You must provide a direct Image URL.' });
    }

    // Download image
    const imageFilename = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const imagePath = path.join(__dirname, '../frontend/public/items', imageFilename);
    
    // Ensure dir exists
    fs.mkdirSync(path.join(__dirname, '../frontend/public/items'), { recursive: true });

    const imgStream = await axios.get(imageUrl, { responseType: 'stream', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const writer = fs.createWriteStream(imagePath);
    imgStream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(true));
      writer.on('error', reject);
    });

    const item = await prisma.adminItem.create({
      data: {
        name,
        value,
        color: color || '#ffffff',
        imageUrl: `/items/${imageFilename}`
      }
    });

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// DELETE /api/admin/items/:id
app.delete('/api/admin/items/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.adminItem.delete({
      where: { id: parseInt(req.params.id as string) }
    });
    // Try to delete image
    try {
      const imagePath = path.join(__dirname, '../frontend/public', item.imageUrl);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    } catch (e) {}
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /api/admin/cases
app.post('/api/admin/cases', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, price, image, items } = req.body;
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'Invalid case data' });
  try {
    const newCase = await prisma.case.create({
      data: {
        name,
        price,
        image: image || '',
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            name: item.name,
            imageUrl: item.imageUrl || '',
            weight: item.weight || 1,
            value: item.value || 1,
            color: item.color || '#ffffff',
            isLuckyStarItem: item.isLuckyStarItem || false
          }))
        } : undefined
      },
      include: { items: true }
    });
    res.json(newCase);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// PUT /api/admin/cases/:id
app.put('/api/admin/cases/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, price, image, items } = req.body;
  try {
    // Delete existing items for a clean sync
    await prisma.caseItem.deleteMany({ where: { caseId: parseInt(id as string) } });

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id as string) },
      data: {
        name,
        price,
        image: image || '',
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            name: item.name,
            imageUrl: item.imageUrl || '',
            weight: item.weight || 1,
            value: item.value || 1,
            color: item.color || '#ffffff',
            isLuckyStarItem: item.isLuckyStarItem || false
          }))
        } : undefined
      },
      include: { items: true }
    });
    res.json(updatedCase);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/cases/:id
app.delete('/api/admin/cases/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    // Delete all items first (Prisma doesn't cascade by default unless configured)
    await prisma.caseItem.deleteMany({ where: { caseId: parseInt(id as string) } });
    await prisma.case.delete({ where: { id: parseInt(id as string) } });
    res.json({ success: true });
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// POST /api/admin/cases/:id/items
app.post('/api/admin/cases/:id/items', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, value, color, weight, image, imageUrl } = req.body;
  if (!name || typeof value !== 'number' || typeof weight !== 'number') return res.status(400).json({ error: 'Invalid item data' });
  try {
    const newItem = await prisma.caseItem.create({
      data: {
        caseId: parseInt(id as string),
        name, value, color, weight, image: image || '', imageUrl: imageUrl || null
      }
    });
    res.json(newItem);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// PUT /api/admin/items/:id
app.put('/api/admin/items/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, value, color, weight, image, imageUrl } = req.body;
  try {
    const updatedItem = await prisma.caseItem.update({
      where: { id: parseInt(id as string) },
      data: { name, value, color, weight, image: image || '', imageUrl: imageUrl || null }
    });
    res.json(updatedItem);
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/items/:id
app.delete('/api/admin/items/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.caseItem.delete({ where: { id: parseInt(id as string) } });
    res.json({ success: true });
  } catch (error: any) {
    console.error("PUT ERROR:", error); res.status(400).json({ error: error.message });
  }
});

// GET /api/settings - Public site settings
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 1 } });
    }
    res.json({
      maintenanceMode: settings.maintenanceMode,
      borrowEnabled: settings.borrowEnabled,
      maxBorrowLimit: settings.maxBorrowLimit,
      coinflipEnabled: settings.coinflipEnabled,
      rouletteEnabled: settings.rouletteEnabled,
      minesEnabled: settings.minesEnabled,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/pot
app.get('/api/admin/pot', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    res.json({ casinoPot: settings?.casinoPot ?? 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch casino pot.' });
  }
});

// POST /api/admin/pot/withdraw
app.post('/api/admin/pot/withdraw', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const adminId = req.userId!;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
      const potAmount = settings?.casinoPot ?? 0;
      if (potAmount <= 0) throw new Error('Casino pot is empty.');

      // Reset pot to 0
      await tx.siteSettings.update({
        where: { id: 1 },
        data: { casinoPot: 0 }
      });

      // Give pot amount to admin
      const admin = await tx.user.update({
        where: { id: adminId },
        data: { mockBalance: { increment: potAmount } }
      });

      return { amount: potAmount, newBalance: admin.mockBalance };
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/settings
app.get('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      maintenanceMode,
      mockBalanceOnRegister,
      coinflipHouseEdge,
      rouletteHouseEdge,
      minesHouseEdge,
      coinflipEnabled,
      rouletteEnabled,
      minesEnabled,
      borrowEnabled,
      maxBorrowLimit,
      slotsEnabled,
      slotsHouseEdge
    } = req.body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : undefined,
        mockBalanceOnRegister: typeof mockBalanceOnRegister === 'number' ? mockBalanceOnRegister : undefined,
        coinflipHouseEdge: typeof coinflipHouseEdge === 'number' ? coinflipHouseEdge : undefined,
        rouletteHouseEdge: typeof rouletteHouseEdge === 'number' ? rouletteHouseEdge : undefined,
        minesHouseEdge: typeof minesHouseEdge === 'number' ? minesHouseEdge : undefined,
        coinflipEnabled: typeof coinflipEnabled === 'boolean' ? coinflipEnabled : undefined,
        rouletteEnabled: typeof rouletteEnabled === 'boolean' ? rouletteEnabled : undefined,
        minesEnabled: typeof minesEnabled === 'boolean' ? minesEnabled : undefined,
        borrowEnabled: typeof borrowEnabled === 'boolean' ? borrowEnabled : undefined,
        maxBorrowLimit: typeof maxBorrowLimit === 'number' ? Math.round(maxBorrowLimit) : undefined,
        slotsEnabled: typeof slotsEnabled === 'boolean' ? slotsEnabled : undefined,
        slotsHouseEdge: typeof slotsHouseEdge === 'number' ? slotsHouseEdge : undefined,
      },
      create: {
        id: 1,
        maintenanceMode: maintenanceMode ?? false,
        mockBalanceOnRegister: mockBalanceOnRegister ?? 100000,
        coinflipHouseEdge: coinflipHouseEdge ?? 0.05,
        rouletteHouseEdge: rouletteHouseEdge ?? 0.05,
        minesHouseEdge: minesHouseEdge ?? 0.05,
        coinflipEnabled: coinflipEnabled ?? true,
        rouletteEnabled: rouletteEnabled ?? true,
        minesEnabled: minesEnabled ?? true,
        borrowEnabled: borrowEnabled ?? true,
        maxBorrowLimit: maxBorrowLimit ?? 100000,
        slotsEnabled: slotsEnabled ?? true,
        slotsHouseEdge: slotsHouseEdge ?? 0.05,
      }
    });
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/chat/rain - Manually trigger a rain drop
app.post('/api/admin/chat/rain', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    await triggerRain(amount);

    res.json({ success: true, message: 'Rain initialized!' });
  } catch (error: any) {
    console.error("Admin rain error:", error);
    res.status(500).json({ error: error.message || "Failed to process manual rain drop" });
  }
});

// GET /api/admin/users - List players with search & pagination
app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const users = await prisma.user.findMany({
      where: q ? {
        username: { contains: q }
      } : undefined,
      select: {
        id: true,
        username: true,
        role: true,
        mockBalance: true,
        level: true,
        xp: true,
        rakebackBalance: true,
        totalWagered: true,
        createdAt: true,
        _count: {
          select: {
            inventory: true,
            transactions: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id - Edit player details (balance, role, level, xp, etc)
app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id));
    const { username, role, mockBalance, level, xp, rakebackBalance, totalWagered, newPassword } = req.body;

    const updateData: any = {};
    if (username && typeof username === 'string') updateData.username = username.trim();
    if (role && (role === 'user' || role === 'admin')) updateData.role = role;
    if (typeof mockBalance === 'number') updateData.mockBalance = Math.round(mockBalance);
    if (typeof level === 'number') updateData.level = Math.min(100, Math.max(1, Math.round(level)));
    if (typeof xp === 'number') updateData.xp = Math.max(0, Math.round(xp));
    if (typeof rakebackBalance === 'number') updateData.rakebackBalance = Math.round(rakebackBalance);
    if (typeof totalWagered === 'number') updateData.totalWagered = Math.round(totalWagered);

    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 4) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        mockBalance: true,
        level: true,
        xp: true,
        rakebackBalance: true,
        totalWagered: true,
        createdAt: true
      }
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete a user and associated data
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id));
    if (req.userId === userId) {
      return res.status(400).json({ error: "Cannot delete your own admin account!" });
    }

    // Cascade delete relations
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.userItem.deleteMany({ where: { userId } });
    await prisma.chatMessage.deleteMany({ where: { userId } });
    await prisma.provablyFair.deleteMany({ where: { userId } });
    await prisma.minesGame.deleteMany({ where: { userId } });
    await prisma.dailyClaim.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/freeze - Toggle user freeze (ban) status
app.post('/api/admin/users/:id/freeze', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id));
    if (req.userId === userId) {
      return res.status(400).json({ error: "Cannot freeze your own admin account!" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isFrozen: !user.isFrozen }
    });

    res.json({ message: updated.isFrozen ? 'User frozen successfully' : 'User unfrozen successfully', isFrozen: updated.isFrozen });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/withdrawals - Fetch pending withdrawals
app.get('/api/admin/withdrawals', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } }
      }
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/withdrawals/:id/approve - Approve withdrawal
app.post('/api/admin/withdrawals/:id/approve', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reqId = parseInt(String(req.params.id));
    const request = await prisma.withdrawalRequest.findUnique({ where: { id: reqId } });
    
    if (!request) return res.status(404).json({ error: "Withdrawal not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request is not pending" });

    const updated = await prisma.withdrawalRequest.update({
      where: { id: reqId },
      data: { status: "approved" }
    });

    res.json({ message: "Withdrawal approved", request: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/withdrawals/:id/reject - Reject withdrawal and refund
app.post('/api/admin/withdrawals/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reqId = parseInt(String(req.params.id));
    const request = await prisma.withdrawalRequest.findUnique({ where: { id: reqId } });
    
    if (!request) return res.status(404).json({ error: "Withdrawal not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request is not pending" });

    // Transaction to reject and refund
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id: reqId },
        data: { status: "rejected" }
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: { mockBalance: { increment: request.amount } }
      })
    ]);

    res.json({ message: "Withdrawal rejected and refunded" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/growtopia/search
app.get('/api/admin/growtopia/search', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    // 1. Search for titles
    const searchRes = await fetch(`https://growtopia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json`);
    const searchData = await searchRes.json();
    if (!searchData.query || !searchData.query.search) return res.json([]);

    // Top 5 titles
    const titles = searchData.query.search.slice(0, 5).map((s: any) => s.title);
    if (titles.length === 0) return res.json([]);

    // 2. Fetch images for those titles
    // We will do parallel parse requests because pageimages doesn't reliably return Growtopia sprites.
    const results = await Promise.all(titles.map(async (title: string) => {
      try {
        const parseRes = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`);
        const parseData = await parseRes.json();

        let imageUrl = null;
        if (parseData && parseData.parse && parseData.parse.text) {
          const html = parseData.parse.text['*'];
          // Look for <span class="growsprite"> or <div class="growsprite"> (wiki changed tag to span)
          // Keep the full /revision/latest/window-crop/... path — those are the per-item crop coords
          const spriteMatch = html.match(/<(?:div|span)[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is);
          if (spriteMatch && spriteMatch[1]) {
            // Strip only the ?format=webp&fill=... cache-buster, preserve the crop path
            imageUrl = spriteMatch[1].replace(/&amp;/g, '&').split('?')[0];
          } else {
            // Fallback to first nocookie static domain image
            const imgMatch = html.match(/<img[^>]*src="([^"]+static\.wikia\.nocookie\.net\/growtopia\/images[^"]+)"/i);
            if (imgMatch && imgMatch[1]) {
              imageUrl = imgMatch[1].replace(/&amp;/g, '&').split('?')[0];
            } else {
              // Further fallback: any .png
              const pngMatch = html.match(/<img[^>]*src="([^"]+\.png[^"]*)"/i);
              if (pngMatch && pngMatch[1]) {
                imageUrl = pngMatch[1].replace(/&amp;/g, '&').split('?')[0];
              }
            }
          }
        }
        return { name: title, imageUrl };
      } catch (err) {
        return { name: title, imageUrl: null };
      }
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/analytics - Aggregate analytics for the admin dashboard
app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── Overview KPIs ──
    const [totalUsers, settings, activeToday, newUsersToday, newUsersThisWeek, wageredAgg] = await Promise.all([
      prisma.user.count(),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
      prisma.transaction.findMany({
        where: { timestamp: { gte: oneDayAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.user.aggregate({ _sum: { totalWagered: true } }),
    ]);

    // ── Revenue by game type (last 30 days) ──
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTxs = await prisma.transaction.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { gameType: true, amount: true },
    });

    const gameMap: Record<string, { wagered: number; count: number }> = {};
    for (const tx of recentTxs) {
      const key = tx.gameType;
      if (!gameMap[key]) gameMap[key] = { wagered: 0, count: 0 };
      gameMap[key].wagered += tx.amount;
      gameMap[key].count += 1;
    }
    const revenueByGame = Object.entries(gameMap)
      .map(([game, stats]) => ({ game, ...stats }))
      .sort((a, b) => b.wagered - a.wagered);

    // ── Top 10 players by total wagered ──
    const topPlayers = await prisma.user.findMany({
      orderBy: { totalWagered: 'desc' },
      take: 10,
      select: { id: true, username: true, totalWagered: true, mockBalance: true, level: true, createdAt: true },
    });

    // ── 14-day registration trend ──
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });

    const regMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      regMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (regMap[key] !== undefined) regMap[key]++;
    }
    const registrationsTrend = Object.entries(regMap).map(([date, count]) => ({ date, count }));

    // ── 14-day wager trend (from Transaction table) ──
    const recentTxsForTrend = await prisma.transaction.findMany({
      where: { timestamp: { gte: fourteenDaysAgo } },
      select: { timestamp: true, amount: true },
    });

    const wagerMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      wagerMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const tx of recentTxsForTrend) {
      const key = tx.timestamp.toISOString().slice(0, 10);
      if (wagerMap[key] !== undefined) wagerMap[key] += tx.amount;
    }
    const wagerTrend = Object.entries(wagerMap).map(([date, wagered]) => ({ date, wagered }));

    // ── Game breakdown (all-time counts) ──
    const allTxGameTypes = await prisma.transaction.groupBy({
      by: ['gameType'],
      _count: { gameType: true },
      _sum: { amount: true },
    });

    const GAME_CATEGORIES: Record<string, string[]> = {
      mines: ['mines'],
      coinflip: ['coinflip'],
      roulette: ['roulette'],
      crash: ['crash'],
      dice: ['dice'],
      plinko: ['plinko'],
      slots: [], // catches slot_* prefix
      cases: ['case', 'cases'],
      battles: ['battle', 'battles'],
      jackpot: ['jackpot'],
    };

    const gameBreakdown: Record<string, number> = {
      mines: 0, coinflip: 0, roulette: 0, crash: 0, dice: 0,
      plinko: 0, slots: 0, cases: 0, battles: 0, jackpot: 0,
    };

    for (const row of allTxGameTypes) {
      const gt = row.gameType.toLowerCase();
      let matched = false;
      for (const [cat, keys] of Object.entries(GAME_CATEGORIES)) {
        if (cat === 'slots') continue;
        if (keys.some(k => gt.includes(k))) {
          gameBreakdown[cat] += row._count.gameType;
          matched = true;
          break;
        }
      }
      if (!matched && gt.startsWith('slot_')) {
        gameBreakdown.slots += row._count.gameType;
      }
    }

    // ── VIP tier distribution ──
    const VIP_THRESHOLDS = [
      { tier: 'Diamond', threshold: 1000000 },
      { tier: 'Platinum', threshold: 250000 },
      { tier: 'Gold', threshold: 50000 },
      { tier: 'Silver', threshold: 10000 },
      { tier: 'Bronze', threshold: 0 },
    ];

    const allWagered = await prisma.user.findMany({ select: { totalWagered: true } });
    const vipCounts: Record<string, number> = { Diamond: 0, Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
    for (const u of allWagered) {
      for (const tier of VIP_THRESHOLDS) {
        if (u.totalWagered >= tier.threshold) {
          vipCounts[tier.tier]++;
          break;
        }
      }
    }
    const vipDistribution = Object.entries(vipCounts).map(([tier, count]) => ({ tier, count }));

    res.json({
      overview: {
        totalUsers,
        totalWagered: wageredAgg._sum.totalWagered ?? 0,
        casinoPot: settings?.casinoPot ?? 0,
        activeToday: activeToday.length,
        newUsersToday,
        newUsersThisWeek,
      },
      revenueByGame,
      topPlayers,
      registrationsTrend,
      wagerTrend,
      gameBreakdown,
      vipDistribution,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BGAMING SLOTS PROXY ENGINE ───────────────────────────────────────────────

interface BgamingSession {
  userId: number;
  gameId: string;
  targetApi: string;
  csrfToken: string;
  cookieHeader: string;
  referer: string;
  createdAt: number;
  featureMultipliers?: Record<string, number>;
  lastTotalBet?: number;
  currentBets?: any;
  currentHand?: string;
  html?: string;
}

const bgamingSessions = new Map<string, BgamingSession>();
const globalFeatureMultipliers = new Map<string, Record<string, number>>([
  ['BonanzaBillion', { freespin_buy: 10000, freespin_chance: 125 }],
  ['PennyPelican', { freespin_buy: 7500, freespin_chance: 125 }]
]);

const BGAMING_GAMES = [
  // Slots
  { id: 'AlohaKingElvis', name: 'Aloha King Elvis', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AlohaKingElvis.png' },
  { id: 'ElvisFrog', name: 'Elvis Frog in Vegas', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/ElvisFrog.png' },
  { id: 'BonanzaBillion', name: 'Bonanza Billion', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/BonanzaBillion.png' },
  { id: 'LuckyLadyMoon', name: 'Lucky Lady Moon', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/LuckyLadyMoon.png' },
  { id: 'FruitMillion', name: 'Fruit Million', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/FruitMillion.png' },
  { id: 'JohnnyCash', name: 'Johnny Cash', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/JohnnyCash.png' },
  { id: 'AztecMagicDeluxe', name: 'Aztec Magic Deluxe', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AztecMagicDeluxe.png' },
  { id: 'MissCherryFruits', name: 'Miss Cherry Fruits', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/MissCherryFruits.png' },
  { id: 'HitTheRoute', name: 'Hit The Route', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/HitTheRoute.png' },
  { id: 'BookOfCats', name: 'Book Of Cats', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/BookOfCats.png' },
  { id: 'SnoopDoggDollars', name: 'Snoop Dogg Dollars', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/SnoopDoggDollars.png' },
  { id: 'PennyPelican', name: 'Penny Pelican', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/PennyPelican.png' },
  { id: 'WildCash', name: 'Wild Cash', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/WildCash.png' },
  { id: 'AztecMagicMegaways', name: 'Aztec Magic Megaways', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AztecMagicMegaways.png' },
  { id: 'LuckyFarmBonanza', name: 'Lucky Farm Bonanza', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/LuckyFarmBonanza.png' },
  { id: 'SweetRushMegaways', name: 'Sweet Rush Megaways', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/SweetRushMegaways.png' },

  { id: 'ElvisFrogTrueways', name: 'Elvis Frog TRUEWAYS', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/ElvisFrogTrueways.png' },

  { id: 'WildCashX9990', name: 'Wild Cash x9990', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/WildCashX9990.png' },
  { id: 'DomnitorsTreasure', name: 'Domnitors Treasure', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/DomnitorsTreasure.png' },

  // Table Games
  { id: 'MultihandBlackjack', name: 'Multihand Blackjack', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/MultihandBlackjack.png' },

  { id: 'EuropeanRoulette', name: 'European Roulette', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/EuropeanRoulette.png' },
  { id: 'FrenchRoulette', name: 'French Roulette', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/FrenchRoulette.png' },

  { id: 'CasinoHoldem', name: 'Casino Holdem', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/CasinoHoldem.png' },


  // Instant Win

  { id: 'ScratchDice', name: 'Scratch Dice', provider: 'BGaming', category: 'Instant Win', image: 'https://cdn.softswiss.net/i/s3/bgaming/ScratchDice.png' },
  { id: 'JogoDoBicho', name: 'Jogo Do Bicho', provider: 'BGaming', category: 'Instant Win', image: 'https://cdn.softswiss.net/i/s3/bgaming/JogoDoBicho.png' }
];

// GET /api/bgaming/games - List available BGaming slot titles
app.get('/api/bgaming/games', (req: Request, res: Response) => {
  res.json(BGAMING_GAMES);
});

// GET /api/bgaming/launch/:gameId - Launch game inside proxy iframe
app.get('/api/bgaming/launch/:gameId', async (req: Request, res: Response) => {
  const gameId = String(req.params.gameId);
  const token = req.query.token as string;
  let userId: number | null = null;

  if (token) {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET) as { userId: number };
      userId = payload.userId;
    } catch {
      // Invalid token
    }
  }

  if (!userId) {
    return res.status(401).send('<h1>Please log in to launch slots with your Diamond Locks.</h1>');
  }

  try {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).send('User not found');

    if (user.debt > 0 && user.debtCreatedAt && !user.isFrozen) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      if (user.debtCreatedAt < fiveDaysAgo) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isFrozen: true }
        });
      }
    }
    if (user.isFrozen) {
      return res.status(403).send('<h1>Account frozen due to unpaid loan. Please repay your loan.</h1>');
    }

    // Check for an existing valid session (less than 30 minutes old) to resume game state
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    for (const [sId, sData] of bgamingSessions.entries()) {
      if (sData.userId === userId && sData.gameId === gameId && sData.html && sData.createdAt > thirtyMinsAgo) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(sData.html);
      }
    }

    const demoUrl = `https://bgaming-network.com/play/${encodeURIComponent(gameId)}/FUN?server=demo`;
    const upstreamRes = await axios.get(demoUrl, {
      maxRedirects: 5,
      headers: {
        'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const cookies = upstreamRes.headers['set-cookie'] || [];
    const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');
    let html = upstreamRes.data as string;

    const startIdx = html.indexOf('window.__OPTIONS__ = ');
    if (startIdx === -1) {
      return res.status(502).send('Unable to parse game configuration from provider.');
    }

    const jsonStart = html.indexOf('{', startIdx);
    const scriptEnd = html.indexOf('</script>', jsonStart);
    if (jsonStart === -1 || scriptEnd === -1) {
      return res.status(502).send('Unable to parse game configuration from provider.');
    }

    let rawJson = html.substring(jsonStart, scriptEnd).trim().replace(/;$/, '');
    const options = JSON.parse(rawJson);

    // Register local session key
    const internalSessionId = crypto.randomBytes(16).toString('hex');
    bgamingSessions.set(internalSessionId, {
      userId,
      gameId,
      targetApi: options.api,
      csrfToken: options.csrfTokenHeaderValue,
      cookieHeader,
      referer: options.game_page_url,
      createdAt: Date.now()
    });

    // Prune expired sessions older than 24h
    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    for (const [sId, sData] of bgamingSessions.entries()) {
      if (sData.createdAt < oneDayAgo) bgamingSessions.delete(sId);
    }

    // Determine host protocol (use x-forwarded-host from Next.js proxy)
    const forwardedHost = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const localCallbackUrl = `${protocol}://${forwardedHost}/api/bgaming/callback/${internalSessionId}`;

    // Rewrite options to redirect callbacks to our local server and set currency to DL
    options.api = localCallbackUrl;
    options.currency = 'DL';
    if (options.rules && options.rules.currency) {
      options.rules.currency = {
        code: 'DL',
        symbol: 'DL',
        subunits: 100,
        exponent: 2
      };
    }

    // Reconstruct the HTML safely using exact indices
    const patchedJsonStr = JSON.stringify(options) + ';';
    html = html.substring(0, jsonStart) + patchedJsonStr + html.substring(scriptEnd);

    // Save the fully patched HTML to the session for fast resuming
    const s = bgamingSessions.get(internalSessionId);
    if (s) s.html = html;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    console.error('BGaming launch error:', error.message);
    res.status(500).send(`Failed to launch game: ${error.message}`);
  }
});

// ALL /api/bgaming/callback/:sessionId - Game action interceptor & balance settler
app.all('/api/bgaming/callback/:sessionId', async (req: Request, res: Response) => {
  const sessionId = String(req.params.sessionId);
  const session = bgamingSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ errors: [{ code: 404, desc: 'session_expired' }] });
  }

  const { userId, gameId, targetApi, csrfToken, cookieHeader, referer } = session;
  const command = req.body?.command;

  try {
    const responseData = await withUserLock(userId, async () => {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('user_not_found');
      }

      if (user.debt > 0 && user.debtCreatedAt && !user.isFrozen) {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        if (user.debtCreatedAt < fiveDaysAgo) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { isFrozen: true }
          });
        }
      }
      if (user.isFrozen) {
        throw new Error('frozen');
      }

      const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } }) || { slotsEnabled: true, slotsHouseEdge: 0.05 } as any;

      // Project the marginal bet BEFORE proxying to BGaming to prevent state desync
      let projectedMarginalBet = 0;
      if (command === 'deal') {
        if (req.body?.options) {
          for (const key of Object.keys(req.body.options)) {
            if (typeof req.body.options[key] === 'number') projectedMarginalBet += req.body.options[key];
          }
        }
      } else if (command === 'spin' || command === 'freespin' || command === 'play') {
        if (req.body?.options?.bet) projectedMarginalBet = req.body.options.bet;
        else if (Array.isArray(req.body?.options?.bets)) {
          projectedMarginalBet = req.body.options.bets.reduce((sum: number, b: any) => sum + (b.amount || b.chip || 0), 0);
        } else if (Array.isArray(req.body?.options)) {
          projectedMarginalBet = req.body.options.reduce((sum: number, b: any) => sum + (b.amount || b.chip || 0), 0);
        } else if (req.body?.options?.bets && typeof req.body.options.bets === 'object') {
          // e.g. {"0": 100} in PennyPelican
          projectedMarginalBet = Object.values(req.body.options.bets).reduce((sum: any, b: any) => Number(sum) + Number(b), 0) as number;
        } else if (req.body?.bets?.lines) {
          projectedMarginalBet = Object.values(req.body.bets.lines).reduce((sum: any, b: any) => Number(sum) + Number(b), 0) as number;
        }

        const purchasedFeature = req.body?.options?.purchased_feature || req.body?.options?.feature;
        const multipliers = session.featureMultipliers?.[purchasedFeature] ? session.featureMultipliers : globalFeatureMultipliers.get(gameId);
        if (purchasedFeature && multipliers?.[purchasedFeature]) {
          let multiplierRaw = multipliers[purchasedFeature] as any;
          const level = req.body?.options?.purchased_feature_level;
          if (typeof multiplierRaw === 'object' && level !== undefined) multiplierRaw = multiplierRaw[level];
          if (typeof multiplierRaw === 'number' && !isNaN(multiplierRaw)) {
            projectedMarginalBet = Math.round(projectedMarginalBet * (multiplierRaw / 100));
          } else {
            projectedMarginalBet = projectedMarginalBet * 100;
          }
        } else if (purchasedFeature) {
          projectedMarginalBet = projectedMarginalBet * 100;
        }
      } else if (command === 'split' || command === 'double') {
        const handId = req.body?.options?.hand_id || session.currentHand;
        if (handId && session.currentBets && session.currentBets[handId]) {
          projectedMarginalBet = session.currentBets[handId].chip || 0;
        }
      }

      if (projectedMarginalBet > 0 && user.mockBalance < projectedMarginalBet) {
        throw new Error('insufficient_funds');
      }

      // Proxy request to official BGaming API first so we can parse legacy free spins accurately
      const upstreamHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookieHeader,
        'Origin': 'https://demo.bgaming-network.com',
        'Referer': referer
      };

      let upstreamResponse = await axios.post(targetApi, req.body, {
        headers: upstreamHeaders,
        validateStatus: () => true
      });

      let responseData = upstreamResponse.data;

      // DEBUG LOG
      console.log(`

--- [BGAMING TRANSACTION] ---`);
      console.log(`COMMAND: ${command}`);
      console.log(`REQ BODY:`, JSON.stringify(req.body));
      console.log(`RESP DATA:`, JSON.stringify(responseData));
      console.log(`-----------------------------

`);
      let betVal = req.body?.options?.bet ?? responseData?.outcome?.bet ?? 0;
      if (betVal === 0 && Array.isArray(req.body?.options?.bets)) {
        betVal = req.body.options.bets.reduce((sum: number, b: any) => sum + (b.amount || b.chip || 0), 0);
      }
      if (betVal === 0 && Array.isArray(req.body?.options)) {
        betVal = req.body.options.reduce((sum: number, b: any) => sum + (b.amount || b.chip || 0), 0);
      }

      const currentTotalBet = responseData?.bets?.total ?? betVal;
      let marginalBet = betVal;

      if (command === 'deal') {
        marginalBet = currentTotalBet;
      } else if (['split', 'double'].includes(command)) {
        marginalBet = Math.max(0, currentTotalBet - (session.lastTotalBet || 0));
      } else if (command === 'play' && marginalBet === 0 && currentTotalBet > 0) {
        marginalBet = currentTotalBet;
      }

      let finalBetAmount = 0;
      if (!['init', 'close_session', 'freespin', 'bonus', 'finish', 'cashout', 'collect'].includes(command) && marginalBet > 0) {
        finalBetAmount = marginalBet;

        // Use exact feature multipliers to charge the precise cost for bonus buys.
        const purchasedFeature = req.body?.options?.purchased_feature || req.body?.options?.feature;
        const multipliers = session.featureMultipliers?.[purchasedFeature] ? session.featureMultipliers : globalFeatureMultipliers.get(gameId);
        if (purchasedFeature && multipliers?.[purchasedFeature]) {
          let multiplierRaw = multipliers[purchasedFeature] as any;
          const level = req.body?.options?.purchased_feature_level;
          if (typeof multiplierRaw === 'object' && level !== undefined) {
            multiplierRaw = multiplierRaw[level];
          }
          if (typeof multiplierRaw === 'number' && !isNaN(multiplierRaw)) {
            finalBetAmount = Math.round(marginalBet * (multiplierRaw / 100));
          } else {
            finalBetAmount = marginalBet * 100;
          }
        } else if (purchasedFeature) {
          finalBetAmount = marginalBet * 100;
        }
      }

      // Fallback legacy extraction if everything is 0 (for obscure slot schemas)
      if (finalBetAmount === 0 && ['spin', 'freespin', 'respin', 'play', 'deal', 'split', 'double'].includes(command)) {
        let fallbackBet = 0;
        if (req.body?.bets?.lines) {
          fallbackBet = Math.round(Number(Object.values(req.body.bets.lines as any).reduce((a: any, b: any) => Number(a) + Number(b), 0)));
        } else if (responseData?.bets?.lines) {
          fallbackBet = Math.round(Number(Object.values(responseData.bets.lines as any).reduce((a: any, b: any) => Number(a) + Number(b), 0)));
        } else if (responseData?.options?.bets?.lines) {
          fallbackBet = Math.round(Number(Object.values(responseData.options.bets.lines as any).reduce((a: any, b: any) => Number(a) + Number(b), 0)));
        }
        if (fallbackBet > 0) finalBetAmount = fallbackBet;
      }

      if (responseData?.game?.freespins_performed !== undefined) {
        finalBetAmount = 0;
      }

      // REDUNDANT LATE BALANCE CHECK using unified finalBetAmount
      if (finalBetAmount > 0 && user.mockBalance < finalBetAmount) {
        return res.status(200).json({
          errors: [{ code: 100, message: 'Insufficient funds' }],
          balance: { game: 0, wallet: user.mockBalance }
        });
      }

      // Cache current bets and hand for projecting next action's marginal bet (e.g. double, split)
      if (responseData?.bets) {
        session.currentBets = responseData.bets;
      }
      if (responseData?.game?.current_hand) {
        session.currentHand = responseData.game.current_hand;
      }

      // We can confidently update session.lastTotalBet now that balance has passed
      if (currentTotalBet > 0) {
        session.lastTotalBet = currentTotalBet;
      } else if (['finish', 'close_session'].includes(command)) {
        session.lastTotalBet = 0;
        session.currentBets = undefined;
        session.currentHand = undefined;
      }

      // Server-Side Re-roll Logic to enforce RTP/House Edge
      // We strictly avoid rerolling during free spins, bonus rounds, or feature buys to prevent state machine corruption.
      const isSafeToReroll = (
        ['spin', 'play'].includes(command) &&
        !responseData.game?.state?.includes('freespin') &&
        !responseData.flow?.state?.includes('freespin') &&
        responseData.game?.freespins_performed === undefined &&
        responseData.game?.freespins_left === undefined &&
        !JSON.stringify(req.body || {}).toLowerCase().includes('buy')
      );

      if (isSafeToReroll && upstreamResponse.status === 200 && responseData && !responseData.errors) {
        let winAmount = Math.round(responseData.outcome?.win ?? responseData.result?.total ?? 0);
        let retries = 0;

        // If the player won, roll against the house edge to decide whether to steal the win
        while (winAmount > 0 && Math.random() < settings.slotsHouseEdge && retries < 5) {
          upstreamResponse = await axios.post(targetApi, req.body, {
            headers: upstreamHeaders,
            validateStatus: () => true
          });
          responseData = upstreamResponse.data;
          if (upstreamResponse.status !== 200 || responseData?.errors) break;
          winAmount = Math.round(responseData.outcome?.win ?? responseData.result?.total ?? 0);
          retries++;
        }
      }

      // Track feature multipliers during init so we can perfectly charge bonus buys later
      if (command === 'init' && responseData.feature_options?.feature_multipliers) {
        session.featureMultipliers = responseData.feature_options.feature_multipliers;
        globalFeatureMultipliers.set(gameId, responseData.feature_options.feature_multipliers);
      }

      if (upstreamResponse.status !== 200 || !responseData || responseData.errors) {
        console.error('BGaming Upstream Error:', {
          status: upstreamResponse.status,
          command,
          responseData
        });
        if (responseData && typeof responseData === 'object') {
          responseData.balance = { game: 0, wallet: user.mockBalance };
        }
        return res.status(upstreamResponse.status).json(responseData);
      }

      const winAmount = Math.round(responseData.outcome?.win ?? responseData.result?.total ?? 0);

      let finalBalance = user.mockBalance;

      // Default to the instantaneous win for older V1 games
      let effectiveWinAmount = winAmount;

      // For V2 games, only award the win when the entire round is finished.
      // This perfectly isolates bonus buy costs so the UI drops by the exact amount,
      // and saves DB writes during intermediate free spins.
      if (responseData.flow?.state) {
        if (responseData.flow.state === 'closed') {
          effectiveWinAmount = typeof responseData.balance === 'object' ? (responseData.balance.game || 0) : winAmount;
        } else {
          effectiveWinAmount = 0;
        }
      }

      // Accept wins from ANY command (spin, freespin, bonus, pick, etc.) 
      // but only subtract bet if it's a known bet-charging command (which we enforced above)
      if (!['init', 'close_session'].includes(command) && (finalBetAmount > 0 || effectiveWinAmount > 0)) {
        console.log(`[DEBUG DB] command=${command}, finalBetAmount=${finalBetAmount}, effectiveWinAmount=${effectiveWinAmount}`);
        const profit = effectiveWinAmount - finalBetAmount;

        const updatedUser = await prisma.$transaction(async (tx) => {
          const u = await tx.user.findUnique({ where: { id: userId } });
          if (!u) throw new Error('User not found');

          const newXp = u.xp + finalBetAmount;
          const newLevel = calculateLevel(newXp);
          const rakebackAmount = Math.floor(finalBetAmount * getVIPRakebackPercentage(u.totalWagered));

          const updated = await tx.user.update({
            where: { id: userId },
            data: {
              mockBalance: { increment: profit },
              xp: newXp,
              level: newLevel,
              totalWagered: { increment: finalBetAmount }, /* POT_HOOK:finalBetAmount */
              rakebackBalance: { increment: rakebackAmount }
            }
          });

          await tx.transaction.create({
            data: {
              userId,
              amount: finalBetAmount,
              gameType: `slot_${gameId}`,
              result: effectiveWinAmount > 0 ? 'win' : 'loss'
            }
          });

          if (winAmount >= 10000) {
            await tx.chatMessage.create({
              data: {
                userId,
                content: `🎰 Won $${(winAmount / 100).toFixed(2)} on ${gameId} slot!`
              }
            });
          }

          return updated;
        });

        finalBalance = updatedUser.mockBalance;
      }

      // Override currency and balance to our real numbers
      if (responseData.balance !== undefined) {
        if (typeof responseData.balance === 'number') {
          responseData.balance = finalBalance;
        } else {
          responseData.balance.wallet = finalBalance - (responseData.balance.game || 0);
        }
      }
      if (responseData.options && responseData.options.currency) {
        responseData.options.currency = {
          code: 'DL',
          symbol: 'DL',
          subunits: 100,
          exponent: 2
        };
      }

      res.json(responseData);
    });
  } catch (error: any) {
    console.error('BGaming callback error:', error.message);
    if (error.message === 'insufficient_funds') {
      return res.status(200).json({
        errors: [{ code: 100, message: 'Insufficient funds' }]
      });
    }
    res.status(500).json({ errors: [{ code: 500, desc: error.message }] });
  }
});

// Seed default case if none exists
async function seedDefaultCase() {
  const settingsCount = await prisma.siteSettings.count();
  if (settingsCount === 0) {
    await prisma.siteSettings.create({ data: { id: 1 } });
  }

  const count = await prisma.case.count();
  if (count === 0) {
    console.log('Seeding default Classic case...');
    await prisma.case.create({
      data: {
        name: 'Classic Case',
        price: 1000,
        items: {
          create: [
            { name: 'Common Coin', value: 200, color: '#3b82f6', weight: 600 },
            { name: 'Rare Gem', value: 1500, color: '#7c3aed', weight: 300 },
            { name: 'Epic Gold', value: 5000, color: '#ef4444', weight: 90 },
            { name: 'Legendary Diamond', value: 50000, color: '#eab308', weight: 10 },
          ]
        }
      }
    });
  }
}
seedDefaultCase();

async function seedSystemUser() {
  const adminExists = await prisma.user.findUnique({ where: { id: 1 } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        id: 1,
        username: 'System',
        passwordHash: 'none',
        role: 'admin',
        mockBalance: 0
      }
    });
  }
}
seedSystemUser();

// ─── RAIN BOT ──────────────────────────────────────────────────────────────────
setInterval(async () => {
  try {
    // 5% chance every minute to trigger rain (avg every 20 minutes)
    if (Math.random() > 0.05) return;

    // Find users who chatted in the last 15 minutes to see if chat is active enough for rain
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentMessages = await prisma.chatMessage.findMany({
      where: { timestamp: { gte: fifteenMinsAgo } },
      select: { userId: true },
      distinct: ['userId']
    });

    if (recentMessages.length === 0) return;

    const totalRainAmount = 1000 * Math.floor(Math.random() * 5 + 1); // 1,000 to 5,000 cents (10 to 50 DLs)
    
    // Trigger the automated rain drop via the bot system
    try {
      await triggerRain(totalRainAmount);
      console.log(`🌧️ Rain Bot started a ${totalRainAmount} DL drop.`);
    } catch (e) {
      // Ignore if a rain drop is already active
    }
  } catch (error) {
    console.error("Rain bot error:", error);
  }
}, 60 * 1000);

const HOST = process.env.HOST || '0.0.0.0';

import { startChatBot, triggerRain, setIoInstance } from './bot/chat_bot';
import { startCryptoWatcher } from './services/crypto_watcher';

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

setIoInstance(io);
startChatBot(io);
startCryptoWatcher();

httpServer.listen(PORT, () => {
  console.log(`\n✅ Server running on http://0.0.0.0:${PORT}`);

  if (DISCORD_WEBHOOK_URL) {
    axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [{
        title: "🟢 System Online",
        description: "The GrowSpin backend has successfully started.",
        color: 0x00ff00,
        timestamp: new Date().toISOString()
      }]
    }).catch(err => console.error("Failed to send Discord webhook:", err.message));
  }
});

import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret123';

// Replicate middleware
async function requireAuth(req: any, res: any, next: any) {
  req.userId = 1; // force user ID 1
  next();
}

async function requireNotFrozen(req: any, res: any, next: any) {
  let user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
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
}

app.post('/api/cases/open', requireAuth, (req, res, next) => {
  requireNotFrozen(req, res, () => {
    res.json({ success: true, msg: "Spun!" });
  });
});

async function run() {
  // Ensure user 1 is frozen
  await prisma.user.update({
    where: { id: 1 },
    data: { isFrozen: true }
  });

  const res = await request(app).post('/api/cases/open');
  console.log("Status:", res.status);
  console.log("Body:", res.body);
}

run().finally(() => prisma.$disconnect());

import jwt from 'jsonwebtoken';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret123';

async function run() {
  try {
    const user = await prisma.user.findFirst();
    const token = jwt.sign({ userId: user!.id }, ACCESS_SECRET, { expiresIn: '15m' });
    
    // Freeze user manually
    await prisma.user.update({ where: { id: user!.id }, data: { isFrozen: true, debt: 1000 } });
    console.log("User is frozen in DB");

    const c = await prisma.case.findFirst();
    
    const res = await axios.post('http://localhost:3001/api/cases/open', 
      { caseId: c!.id, demo: false, borrow: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Success:", res.data);
  } catch (err: any) {
    console.error("Error:", err.response?.status, err.response?.data);
  }
}
run();

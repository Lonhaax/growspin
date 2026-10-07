import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export type CrashState = 'waiting' | 'running' | 'crashed';

export interface CrashPlayer {
  userId: number;
  username: string;
  avatar: string;
  amount: number;
  autoCashout: number; // 0 if none
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  profit: number | null;
}

export class CrashManager {
  private io: Server;
  public state: CrashState = 'waiting';
  public timer: number = 10;
  public currentMultiplier: number = 1.00;
  public crashPoint: number = 1.00;
  public serverSeed: string = '';
  public salt: string = '0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6'; // generic salt
  public players: Map<number, CrashPlayer> = new Map();
  public history: { id: string, crashPoint: number, hash: string }[] = [];
  public startTime: number = 0;
  private loopInterval: NodeJS.Timeout | null = null;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startWaiting();
  }

  private startWaiting() {
    this.state = 'waiting';
    this.timer = 10;
    this.currentMultiplier = 1.00;
    this.players.clear();

    this.io.emit('crash:state', { state: this.state, timer: this.timer, players: Array.from(this.players.values()) });

    this.loopInterval = setInterval(() => {
      this.timer--;
      this.io.emit('crash:timer', this.timer);

      if (this.timer <= 0) {
        if (this.loopInterval) clearInterval(this.loopInterval);
        this.startGame();
      }
    }, 1000);
  }

  private async startGame() {
    this.state = 'running';
    this.currentMultiplier = 1.00;
    this.startTime = Date.now();
    this.crashPoint = await this.generateCrashPoint();

    this.io.emit('crash:start', { state: this.state, multiplier: this.currentMultiplier });

    // Tick at 20fps for server-side state
    this.tickInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.currentMultiplier = Math.pow(Math.E, 0.1 * elapsed);

      // Auto cashout processing
      this.players.forEach((p, userId) => {
        if (!p.cashedOut && p.autoCashout > 1.00 && this.currentMultiplier >= p.autoCashout && p.autoCashout <= this.crashPoint) {
          this.cashoutPlayer(userId, p.autoCashout);
        }
      });

      if (this.currentMultiplier >= this.crashPoint) {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.currentMultiplier = this.crashPoint;
        this.crash();
      } else {
        this.io.emit('crash:tick', { multiplier: this.currentMultiplier });
      }
    }, 50);
  }

  private crash() {
    this.state = 'crashed';
    
    // Resolve players who didn't cash out
    this.players.forEach((p, userId) => {
      if (!p.cashedOut) {
        p.profit = -p.amount;
        // In a real app we might insert a loss record here or already deducted the bet.
        // We assume the bet was deducted at placement time.
        // totalWagered was also already updated.
        
        prisma.transaction.create({
          data: {
            userId,
            amount: p.amount,
            gameType: 'crash',
            result: 'loss'
          }
        }).catch(console.error);
      }
    });

    this.history.unshift({ id: Math.random().toString(36).substring(7), crashPoint: this.crashPoint, hash: this.serverSeed });
    if (this.history.length > 30) this.history.pop();

    this.io.emit('crash:crashed', { crashPoint: this.crashPoint, history: this.history, players: Array.from(this.players.values()) });

    setTimeout(() => {
      this.startWaiting();
    }, 4000); // Wait 4s before starting next round
  }

  private async generateCrashPoint() {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const edge = settings?.crashHouseEdge ?? 0.05;
    
    this.serverSeed = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHmac('sha256', this.serverSeed).update(this.salt).digest('hex');
    
    // 52 bits of randomness
    const h = parseInt(hash.slice(0, 13), 16);
    const eVal = Math.pow(2, 52);
    const r = h / eVal;

    if (r < edge) return 1.00; // instant crash based on house edge
    const rawCrash = (1 - edge) / (1 - r);
    return Math.max(1.00, Math.floor(rawCrash * 100) / 100);
  }

  public placeBet(userId: number, username: string, avatar: string, amount: number, autoCashout: number) {
    if (this.state !== 'waiting') throw new Error('Game is already running');
    if (this.players.has(userId)) throw new Error('Already bet');

    this.players.set(userId, {
      userId,
      username,
      avatar,
      amount,
      autoCashout,
      cashedOut: false,
      cashoutMultiplier: null,
      profit: null
    });

    this.io.emit('crash:players', Array.from(this.players.values()));
  }

  public async cashoutPlayer(userId: number, forceMultiplier?: number) {
    if (this.state !== 'running') throw new Error('Game is not running');
    const p = this.players.get(userId);
    if (!p) throw new Error('No active bet');
    if (p.cashedOut) throw new Error('Already cashed out');

    const mult = forceMultiplier || this.currentMultiplier;
    if (mult > this.crashPoint) throw new Error('Crashed');

    const winAmount = Math.floor(p.amount * mult);
    p.cashedOut = true;
    p.cashoutMultiplier = mult;
    p.profit = winAmount - p.amount;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        mockBalance: { increment: winAmount }
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount: p.amount,
        gameType: 'crash',
        result: 'win'
      }
    });

    this.players.set(userId, p);
    this.io.emit('crash:players', Array.from(this.players.values()));
    
    return { winAmount, multiplier: mult, profit: p.profit, username: p.username };
  }

  public getState() {
    return {
      state: this.state,
      timer: this.timer,
      multiplier: this.currentMultiplier,
      history: this.history,
      players: Array.from(this.players.values())
    };
  }
}

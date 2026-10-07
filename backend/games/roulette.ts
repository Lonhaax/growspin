import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export type RouletteState = 'waiting' | 'rolling' | 'rolled';

export interface RoulettePlayer {
  userId: number;
  username: string;
  avatar: string;
  amount: number;
  betOn: 'red' | 'black' | 'green';
}

export class RouletteManager {
  private io: Server;
  public state: RouletteState = 'waiting';
  public timer: number = 15;
  public players: Map<number, RoulettePlayer> = new Map();
  public history: string[] = []; // 'red', 'black', 'green'
  public serverSeed: string = '';
  public salt: string = '0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6'; // generic salt
  public currentRoll: number = 0; // 0 to 14
  
  private loopInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.history = Array(100).fill('black'); // Fill with mock data initially
    this.startWaiting();
  }

  private startWaiting() {
    this.state = 'waiting';
    this.timer = 15; // 15 seconds bet time
    this.players.clear();

    this.io.emit('roulette:state', this.getState());

    this.loopInterval = setInterval(() => {
      this.timer--;
      this.io.emit('roulette:timer', this.timer);

      if (this.timer <= 0) {
        if (this.loopInterval) clearInterval(this.loopInterval);
        this.startRoll();
      }
    }, 1000);
  }

  private async startRoll() {
    this.state = 'rolling';
    this.currentRoll = await this.generateRoll();
    
    // Determine color
    let outcomeColor: 'red' | 'black' | 'green' = 'red';
    if (this.currentRoll === 0) outcomeColor = 'green';
    else if (this.currentRoll >= 8) outcomeColor = 'black';

    this.io.emit('roulette:start', { state: this.state, target: this.currentRoll });

    // Wait for animation (5 seconds)
    setTimeout(async () => {
      await this.finishRoll(outcomeColor);
    }, 5000);
  }

  private async finishRoll(outcomeColor: 'red' | 'black' | 'green') {
    this.state = 'rolled';
    
    this.history.unshift(outcomeColor);
    if (this.history.length > 100) this.history.pop();

    // Payout players
    for (const [userId, p] of this.players.entries()) {
      if (p.betOn === outcomeColor) {
        const mult = outcomeColor === 'green' ? 14 : 2;
        const winAmount = Math.floor(p.amount * mult);
        await prisma.user.update({
          where: { id: userId },
          data: { mockBalance: { increment: winAmount } }
        });
        await prisma.transaction.create({
          data: { userId, amount: p.amount, gameType: 'roulette', result: 'win' }
        });
      } else {
        await prisma.transaction.create({
          data: { userId, amount: p.amount, gameType: 'roulette', result: 'loss' }
        });
      }
    }

    this.io.emit('roulette:rolled', { outcome: outcomeColor, history: this.history, hash: this.serverSeed, roll: this.currentRoll });

    setTimeout(() => {
      this.startWaiting();
    }, 4000);
  }

  private async generateRoll() {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const edge = settings?.rouletteHouseEdge ?? 0.05;
    
    this.serverSeed = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHmac('sha256', this.serverSeed).update(this.salt).digest('hex');
    
    const h = parseInt(hash.slice(0, 8), 16);
    
    // Provably fair calculation for 0-14
    let roll = h % 15;
    return roll;
  }

  public placeBet(userId: number, username: string, avatar: string, amount: number, betOn: 'red' | 'black' | 'green') {
    if (this.state !== 'waiting') throw new Error('Game is currently rolling');
    if (this.players.has(userId)) throw new Error('Already bet');

    this.players.set(userId, {
      userId,
      username,
      avatar,
      amount,
      betOn
    });

    this.io.emit('roulette:players', Array.from(this.players.values()));
  }

  public getState() {
    return {
      state: this.state,
      timer: this.timer,
      history: this.history,
      players: Array.from(this.players.values())
    };
  }
}

import { Client } from 'growtopia.js';
import axios from 'axios';

// ==========================================
// CONFIGURATION
// ==========================================
const BOT_USERNAME = process.env.GROWTOPIA_BOT_USERNAME || 'GrowSpinDeposit';
const BOT_PASSWORD = process.env.GROWTOPIA_BOT_PASSWORD || 'password123';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const BOT_SECRET = process.env.GROWTOPIA_BOT_SECRET || 'GROWTOPIA_BOT_SECRET_2026'; // Must match backend/index.ts

// The bot connects to Growtopia
const bot = new Client({
  mac: '00:00:00:00:00:00', // Spoofed mac
  tankIDName: BOT_USERNAME,
  tankIDPass: BOT_PASSWORD
});

let isLooping = false;
let currentWorld = '';

async function startWorldLoop() {
  if (isLooping) return;
  isLooping = true;
  
  while (true) {
    try {
      // Fetch pending intents from backend
      const res = await axios.get(`${BACKEND_URL}/api/internal/bot/intents`, {
        headers: { Authorization: BOT_SECRET }
      });
      const intents = res.data.intents;
      
      if (intents.length === 0) {
        // No pending deposits, wait 5 seconds before checking again
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      for (const intent of intents) {
        console.log(`[BOT] Joining deposit world: ${intent.worldName}`);
        currentWorld = intent.worldName;
        
        // Tell bot to join the world
        bot.send('action|join_request\nname|' + intent.worldName, 3);
        
        // Wait 15 seconds in this world to allow user to drop
        await new Promise(r => setTimeout(r, 15000));
        
        currentWorld = '';
      }
      
    } catch (err) {
      console.error('[BOT] Error in world loop:', err?.response?.data || err.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

bot.on('ready', () => {
  console.log(`✅ [BOT] Connected as ${bot.name}`);
  startWorldLoop();
});

// Listen for items dropped (Diamond Locks = item ID 1796)
bot.on('onDrop', async (data) => {
  console.log(`[BOT] Item Dropped: ID ${data.itemID}, Count ${data.count}`);
  
  if (data.itemID === 1796 && currentWorld) {
    const dlCount = data.count;
    // 1 DL = 100 subunits in the casino balance system
    const amountToCredit = dlCount * 100;
    
    console.log(`[BOT] Detected ${dlCount} DL drop in ${currentWorld}. Sending credit to backend...`);
    
    try {
      const res = await axios.post(`${BACKEND_URL}/api/internal/bot/credit`, {
        secret: BOT_SECRET,
        worldName: currentWorld, 
        amount: amountToCredit
      });
      
      console.log(`✅ [BOT] Successfully credited user for world ${currentWorld}. New balance: ${res.data.newBalance}`);
      
      // Optionally collect the DL (requires pathfinding)
      // bot.collect(data.netID);
    } catch (err) {
      console.error(`❌ [BOT] Failed to credit user:`, err?.response?.data || err.message);
    }
  }
});

bot.connect();

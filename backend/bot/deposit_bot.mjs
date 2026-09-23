import { Client } from 'growtopia.js';
import axios from 'axios';

// ==========================================
// CONFIGURATION
// ==========================================
const BOT_USERNAME = process.env.GROWTOPIA_BOT_USERNAME || 'GrowSpinDeposit';
const BOT_PASSWORD = process.env.GROWTOPIA_BOT_PASSWORD || 'password123';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const BOT_SECRET = process.env.GROWTOPIA_BOT_SECRET || 'GROWTOPIA_BOT_SECRET_2026';

const bot = new Client({
  mac: '00:00:00:00:00:00',
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
      const res = await axios.get(`${BACKEND_URL}/api/internal/bot/intents`, {
        headers: { Authorization: BOT_SECRET }
      });
      const intents = res.data.intents;
      
      if (intents && intents.length > 0) {
        for (const intent of intents) {
          console.log(`[BOT] Joining deposit world: ${intent.worldName}`);
          currentWorld = intent.worldName;
          
          bot.send('action|join_request\nname|' + intent.worldName, 3);
          
          // Wait 15 seconds for user to drop items
          await new Promise(r => setTimeout(r, 15000));
          currentWorld = '';
        }
      } else {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error('[BOT] Loop error:', err?.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

bot.on('ready', () => {
  console.log(`✅ [BOT] Connected and authenticated as ${bot.name}`);
  startWorldLoop();
});

bot.on('disconnect', () => {
  console.log('❌ [BOT] Disconnected! Reconnecting in 5s...');
  isLooping = false;
  setTimeout(() => bot.connect(), 5000);
});

// growtopia.js emits 'variant' for variant lists (OnConsoleMessage, OnDialogRequest, etc.)
bot.on('variant', (varlist) => {
    if (!varlist || !varlist[0]) return;
    const v0 = varlist[0];
    
    // Ignore spam
    if (v0 !== 'OnTalkBubble' && v0 !== 'OnConsoleMessage' && v0 !== 'OnSetBux') {
        console.log(`[BOT] Variant Received:`, varlist);
    }
    
    if (v0 === 'OnConsoleMessage') {
        const msg = varlist[1].toLowerCase();
        if (msg.includes('drop') || msg.includes('trade')) {
            console.log(`[BOT] Chat: ${varlist[1]}`);
        }
    }
});

// growtopia.js emits 'raw' for TankPackets (where object additions/drops happen)
bot.on('raw', (packet) => {
    // Type 4 = TankPacket, type 14 = Object Add
    if (packet.type === 4 && packet.data && packet.data.type === 14) {
        const itemID = packet.data.int3; // Typical for itemID
        const netID = packet.data.netID;
        console.log(`[BOT] Raw Drop Detected: ItemID=${itemID}, NetID=${netID}`);
        
        if (itemID === 1796 && currentWorld) {
            console.log(`[BOT] Found Diamond Lock drop! Crediting...`);
            // Credit logic would go here
            // axios.post(...)
        }
    }
});

console.log("[BOT] Starting headless client...");
bot.connect();

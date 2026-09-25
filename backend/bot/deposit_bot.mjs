import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { io } from 'socket.io-client';

// ==========================================
// CONFIGURATION
// ==========================================
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.growspin.lol';
const BOT_SECRET = process.env.GROWTOPIA_BOT_SECRET || 'GROWTOPIA_BOT_SECRET_2026';

// Define your fleet of bots here. Add as many as you are running in Lucifer.
const BOT_POOL = ['tflold', 'longs2', 'bot3', 'bot4', 'bot5'];

// State tracking for the bot pool
const botStates = {};
for (const botName of BOT_POOL) {
  botStates[botName] = { isBusy: false, currentIntentId: null };
}

// Queue for incoming intents when all bots are busy
const intentQueue = [];

// The path where the Lua script expects the JSON files
const BOTS_DIR = 'C:/Users/jake/Desktop/depo trade/httpserver/bots';

// ==========================================
// SOCKET CONNECTION
// ==========================================
const socket = io(BACKEND_URL, {
  reconnectionDelayMax: 10000,
});

socket.on('connect', () => {
  console.log(`[BRIDGE] Connected to backend via WebSockets!`);
  // On startup/reconnect, fetch pending intents just in case we missed any
  fetchPendingIntents();
});

socket.on('new_bot_intent', (intent) => {
  console.log(`[BRIDGE] ⚡ Instant dispatch received for user ${intent.userId || intent.id} (${intent.growId})!`);
  handleNewIntent(intent);
});

socket.on('cancel_bot_intent', (data) => {
  console.log(`[BRIDGE] ⚡ Instant cancel received for intent ${data.intentId}!`);
  // If it's in the queue, remove it
  const qIndex = intentQueue.findIndex(i => (i.id || i.userId) == data.intentId);
  if (qIndex !== -1) {
    intentQueue.splice(qIndex, 1);
    console.log(`[BRIDGE] Removed intent ${data.intentId} from queue.`);
  }

  // If a bot is processing it, we abort it immediately
  for (const botName of Object.keys(botStates)) {
    if (botStates[botName].currentIntentId == data.intentId) {
      console.log(`[BRIDGE] [${botName}] Aborting active intent via socket!`);
      const cancelPath = path.join(BOTS_DIR, `${botName}_cancel.txt`);
      fs.writeFile(cancelPath, 'cancel').catch(() => {});
    }
  }
});

// ==========================================
// CORE LOGIC
// ==========================================

async function fetchPendingIntents() {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/internal/bot/intents`, {
      headers: { Authorization: BOT_SECRET }
    });
    const activeIntents = res.data.intents || [];
    for (const intent of activeIntents) {
      handleNewIntent(intent);
    }
  } catch (err) {
    console.error('[BRIDGE] Error fetching initial intents:', err?.message);
  }
}

function handleNewIntent(intent) {
  const intentId = intent.userId || intent.userid || intent.id;
  
  // Check if this intent is already being processed or queued
  const isAlreadyAssigned = Object.values(botStates).some(b => b.currentIntentId == intentId);
  const isQueued = intentQueue.some(i => (i.userId || i.id) == intentId);
  
  if (isAlreadyAssigned || isQueued) return;

  // Find an idle bot
  const idleBotName = BOT_POOL.find(name => !botStates[name].isBusy);

  if (!idleBotName) {
    console.log(`[BRIDGE] No idle bots available. Queuing intent for user ${intentId}...`);
    intentQueue.push(intent);
    return;
  }

  // Assign and dispatch
  botStates[idleBotName].isBusy = true;
  botStates[idleBotName].currentIntentId = intentId;

  processIntentAsync(intent, idleBotName).catch(e => {
    console.error(`[BRIDGE] Unhandled error in async processor for ${idleBotName}:`, e);
  });
}

function processQueue() {
  if (intentQueue.length === 0) return;
  const idleBotName = BOT_POOL.find(name => !botStates[name].isBusy);
  if (idleBotName) {
    const nextIntent = intentQueue.shift();
    botStates[idleBotName].isBusy = true;
    botStates[idleBotName].currentIntentId = (nextIntent.userId || nextIntent.userid || nextIntent.id);
    console.log(`[BRIDGE] Popped intent from queue, assigning to ${idleBotName}.`);
    processIntentAsync(nextIntent, idleBotName).catch(console.error);
  }
}

async function processIntentAsync(intent, botName) {
  const targetPath = path.join(BOTS_DIR, `${botName}.json`);
  const statusPath = path.join(BOTS_DIR, `${botName}_status.json`);
  const intentId = intent.userId || intent.userid || intent.id;

  console.log(`[BRIDGE] [${botName}] Assigned intent for user ${intentId} (${intent.growId || intent.growid}), Amount: ${intent.amount}`);

  try {
    await axios.post(`${BACKEND_URL}/api/internal/bot/assign`, {
      intentId: intentId,
      botName: botName
    }, {
      headers: { Authorization: BOT_SECRET }
    });

    const payload = {
      active_bot: { name: botName },
      details: {
        mode: intent.mode || "addbalance",
        growid: intent.growId || intent.growid,
        amount: intent.amount,
        userid: intentId,
        start_time: Math.floor(Date.now() / 1000)
      }
    };

    await fs.writeFile(targetPath, JSON.stringify(payload, null, 2));
    console.log(`[BRIDGE] [${botName}] Job written. Waiting for Lucifer to process...`);

    let statusData = null;
    let waitTime = 0;
    const MAX_WAIT = 600; // 10 minutes timeout

    while (waitTime < MAX_WAIT) {
      // If socket event canceled it, botStates will have its intent cleared or we can just check if cancel file exists
      const cancelPath = path.join(BOTS_DIR, `${botName}_cancel.txt`);
      try {
        await fs.access(cancelPath);
        console.log(`[BRIDGE] [${botName}] Cancel file detected (triggered by socket). Aborting wait loop.`);
        break;
      } catch (e) {
        // file doesn't exist, continue
      }

      try {
        const content = await fs.readFile(statusPath, 'utf-8');
        statusData = JSON.parse(content);
        break; // Status file found and parsed
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
        waitTime++;
      }
    }

    if (statusData) {
      console.log(`[BRIDGE] [${botName}] Lucifer finished with status: ${statusData.status}`);
      if (statusData.status === 'SUCCESS') {
        console.log(`[BRIDGE] [${botName}] Crediting user ${intent.growId}...`);
        try {
          await axios.get(`${BACKEND_URL}/api/internal/bot/credit`, {
            params: {
              secret: BOT_SECRET,
              worldName: intent.worldName || "longtbl",
              amount: (statusData.amount || payload.details.amount || 0) * 100,
              playerName: intent.growId || intent.growid
            }
          });
          console.log(`[BRIDGE] [${botName}] User credited successfully!`);
        } catch (creditErr) {
          console.error(`[BRIDGE] [${botName}] Error crediting user:`, creditErr.message);
        }
      } else {
        console.log(`[BRIDGE] [${botName}] Trade expired or failed.`);
      }
    } else {
      console.log(`[BRIDGE] [${botName}] Timeout or socket abort.`);
    }

  } catch (err) {
    console.error(`[BRIDGE] [${botName}] Error processing intent:`, err.message);
  } finally {
    console.log(`[BRIDGE] [${botName}] Cleaning up job files and freeing bot...`);
    try { await fs.unlink(targetPath); } catch (e) { }
    await new Promise(r => setTimeout(r, 1500));
    try { await fs.unlink(statusPath); } catch (e) { }
    try { await fs.unlink(path.join(BOTS_DIR, `${botName}_cancel.txt`)); } catch (e) { }

    // Release the bot back to the pool
    botStates[botName].isBusy = false;
    botStates[botName].currentIntentId = null;
    
    // Check if there are queued intents to process now that a bot is free
    processQueue();
  }
}

console.log(`[BRIDGE] Starting Event-Driven Socket Bridge...`);
console.log(`[BRIDGE] Active Bot Pool: ${BOT_POOL.join(', ')}`);

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// ==========================================
// CONFIGURATION
// ==========================================
const BOT_USERNAME = process.env.GROWTOPIA_BOT_USERNAME || 'GrowSpinDeposit';
const BACKEND_URL = process.env.BACKEND_URL || 'https://growspin.lol';
const BOT_SECRET = process.env.GROWTOPIA_BOT_SECRET || 'GROWTOPIA_BOT_SECRET_2026';

// The path where the Lua script expects the JSON files
const BOTS_DIR = '/Users/jake/Desktop/depo trade/httpserver/bots';
const TARGET_PATH = path.join(BOTS_DIR, `${BOT_USERNAME}.json`);
const STATUS_PATH = path.join(BOTS_DIR, `${BOT_USERNAME}_status.json`);

let isProcessing = false;

async function checkIntents() {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    const res = await axios.get(`${BACKEND_URL}/api/internal/bot/intents`, {
      headers: { Authorization: BOT_SECRET }
    });
    const intents = res.data.intents;
    
    if (intents && intents.length > 0) {
      // Pick the first intent to process
      const intent = intents[0];
      
      console.log(`[BRIDGE] Found intent for user ${intent.userId || intent.userid || intent.id} (${intent.growId || intent.growid}), Amount: ${intent.amount}`);
      
      // Construct the JSON payload the Lua script expects
      const payload = {
        active_bot: { name: BOT_USERNAME },
        details: {
          mode: intent.mode || "addbalance", 
          growid: intent.growId || intent.growid,
          amount: intent.amount,
          userid: intent.userId || intent.userid || intent.id,
          start_time: Math.floor(Date.now() / 1000)
        }
      };
      
      // Write the job file for the Lua script
      await fs.writeFile(TARGET_PATH, JSON.stringify(payload, null, 2));
      console.log(`[BRIDGE] Job written to ${TARGET_PATH}. Waiting for Lucifer to process...`);
      
      // Wait for the Lua script to write the status file
      let statusData = null;
      let waitTime = 0;
      const MAX_WAIT = 600; // 10 minutes timeout
      
      while (waitTime < MAX_WAIT) {
        try {
          const content = await fs.readFile(STATUS_PATH, 'utf-8');
          statusData = JSON.parse(content);
          break; // Status file found and parsed
        } catch (e) {
          // File doesn't exist yet or is currently being written
          await new Promise(r => setTimeout(r, 1000));
          waitTime++;
        }
      }
      
      if (statusData) {
        console.log(`[BRIDGE] Lucifer finished with status: ${statusData.status}`);
        
        if (statusData.status === 'SUCCESS') {
          console.log(`[BRIDGE] Crediting user ${intent.growId}...`);
          try {
            await axios.get(`${BACKEND_URL}/api/internal/bot/credit`, {
              params: {
                secret: BOT_SECRET,
                worldName: intent.worldName,
                amount: payload.details.amount || 0, // Fallback if amount isn't known until trade
                playerName: intent.growId || intent.growid
              }
            });
            console.log(`[BRIDGE] User credited successfully!`);
          } catch (creditErr) {
            console.error(`[BRIDGE] Error crediting user:`, creditErr.message);
          }
        } else {
          console.log(`[BRIDGE] Trade expired or failed.`);
          // You could optionally notify your backend about expiration here
        }
      } else {
         console.log(`[BRIDGE] Timeout waiting for Lucifer to process job.`);
      }
      
      // Cleanup files so Lua script goes back to sleep
      console.log(`[BRIDGE] Cleaning up job files...`);
      try { await fs.unlink(TARGET_PATH); } catch (e) {}
      
      // Give Lucifer a moment to acknowledge deletion, then clean up status
      await new Promise(r => setTimeout(r, 1500));
      try { await fs.unlink(STATUS_PATH); } catch (e) {}
      
    }
  } catch (err) {
    console.error('[BRIDGE] Loop error:', err?.message);
    if (err.response) {
      console.error('[BRIDGE] Server Response:', err.response.data);
    }
  }
  
  isProcessing = false;
}

console.log("[BRIDGE] Starting HTTP-to-Lucifer bridge...");
// Run the check every 5 seconds
setInterval(checkIntents, 5000);
checkIntents();

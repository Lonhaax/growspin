import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// ==========================================
// CONFIGURATION
// ==========================================
const BOT_USERNAME = process.env.GROWTOPIA_BOT_USERNAME || 'GrowSpinDeposit';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.growspin.lol';
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
    // Filter out old ghost intents (anything older than September 24, 2026 18:40 UTC)
    const activeIntents = res.data.intents.filter(i => new Date(i.createdAt).getTime() > new Date('2026-09-24T18:40:00Z').getTime());
    
    if (activeIntents && activeIntents.length > 0) {
      // Pick the first intent to process
      const intent = activeIntents[0];
      // The backend assigns random bot names (BetBot9, etc)
      // Since you are only using one bot named 'tflold', force the bridge to write to tflold.json
      const targetBotName = "tflold";
      const targetPath = path.join(BOTS_DIR, `${targetBotName}.json`);
      const statusPath = path.join(BOTS_DIR, `${targetBotName}_status.json`);
      
      console.log(`[BRIDGE] Found intent for user ${intent.userId || intent.userid || intent.id} (${intent.growId || intent.growid}), Amount: ${intent.amount}, Forced Bot: ${targetBotName}`);
      
      // Construct the JSON payload the Lua script expects
      const payload = {
        active_bot: { name: targetBotName },
        details: {
          mode: intent.mode || "addbalance", 
          growid: intent.growId || intent.growid,
          amount: intent.amount,
          userid: intent.userId || intent.userid || intent.id,
          start_time: Math.floor(Date.now() / 1000)
        }
      };
      
      // Write the job file for the Lua script
      await fs.writeFile(targetPath, JSON.stringify(payload, null, 2));
      console.log(`[BRIDGE] Job written to ${targetPath}. Waiting for Lucifer to process...`);
      
      // Wait for the Lua script to write the status file
      let statusData = null;
      let waitTime = 0;
      const MAX_WAIT = 600; // 10 minutes timeout
      
      while (waitTime < MAX_WAIT) {
        try {
          const content = await fs.readFile(statusPath, 'utf-8');
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
                // Backend expects subunits (1 DL = 100 cents)
                amount: (statusData.amount || payload.details.amount || 0) * 100, 
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
      try { await fs.unlink(targetPath); } catch (e) {}
      
      // Give Lucifer a moment to acknowledge deletion, then clean up status
      await new Promise(r => setTimeout(r, 1500));
      try { await fs.unlink(statusPath); } catch (e) {}
      
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

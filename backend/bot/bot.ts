/**
 * Growtopia Live Deposit Bot
 * 
 * Updated for modern login (ltoken) and dynamic server_data.php fetching.
 */

import axios from 'axios';
import https from 'https';
const { Client, Peer, TextPacket, TankPacket } = require('growtopia.js');

let SERVER_IP = '';
let SERVER_PORT = 17091;
let SERVER_META = '';

const BOT_SECRET = 'GROWTOPIA_BOT_SECRET_2026';
const BACKEND_URL = 'http://localhost:3001/api/internal/bot/credit';
const PROXY_URL = process.env.PROXY_URL; // e.g. http://user:pass@ip:port

const config = {
  mac: '00:1A:2B:3C:4D:5E',
  wk: 'SpoofedWK12345',
  hash2: Math.floor(Math.random() * 1000000000).toString(),
  rid: Math.floor(Math.random() * 1000000000).toString(),
  ltoken: process.env.LTOKEN || 'YOUR_LTOKEN_HERE',
  botName: 'BetBot1'
};

const client = new Client({
  enet: {
    ip: "0.0.0.0", 
    port: 0,
    useNewPacket: { asClient: true },
    enableChecksum: true,
    enableCompressor: true
  }
});

let serverPeer: any = null;

async function fetchServerData() {
  console.log('[BOT] Fetching live server data...');
  try {
    const res = await axios.post('https://184.28.220.19/growtopia/server_data.php', 
      'platform=0&protocol=189&version=4.35', 
      {
        headers: {
          'Host': 'www.growtopia1.com',
          'User-Agent': 'UbiServices_SDK_2022.Release.9_PC64_ansi_static',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Mimic nxrth TLS off and ignore IP cert mismatch
        proxy: PROXY_URL ? false : undefined // Keep simple
      }
    );

    const lines = res.data.split('\n');
    for (const line of lines) {
      if (line.includes('|')) {
        const [k, v] = line.split('|');
        if (k === 'server') SERVER_IP = v.trim();
        if (k === 'port') SERVER_PORT = parseInt(v.trim());
        if (k === 'meta') SERVER_META = v.trim();
      }
    }
    
    if (!SERVER_IP || !SERVER_META) throw new Error('Missing server or meta in response');
    console.log(`[BOT] Fetched IP: ${SERVER_IP}:${SERVER_PORT}`);
    return true;
  } catch (err: any) {
    console.error('[BOT] Failed to fetch server data:', err.message);
    return false;
  }
}

client.on("ready", async () => {
  console.log(`[BOT] Engine started.`);
  const success = await fetchServerData();
  if (success) {
    console.log(`[BOT] Connecting to ${SERVER_IP}:${SERVER_PORT}...`);
    client.connect(SERVER_IP, SERVER_PORT, 0);
  } else {
    console.log(`[BOT] Aborting connection due to fetch failure. Run with proxy?`);
  }
});

client.on("connect", (netID: any) => {
  console.log(`[BOT] Connected successfully. Preparing Logon...`);
  serverPeer = new Peer(client, netID);
});

client.on("disconnect", (netID: any) => {
  console.log('[BOT] Disconnected. Reconnecting in 5s...');
  setTimeout(() => {
    if (SERVER_IP) client.connect(SERVER_IP, SERVER_PORT);
  }, 5000);
});

client.on("raw", (netID: any, channelID: any, data: Buffer) => {
  const packetType = data.length > 0 ? data.readInt32LE(0) : 0;
  const payload = data.length > 4 ? data.slice(4) : Buffer.from('');

  if (packetType === 1) { // HELLO
    console.log('[BOT] Received HELLO from server.');
    sendLogon(serverPeer);
  } else if (packetType === 3 || packetType === 4) { // String / Game Message
    const text = payload.toString('utf-8');
    if (text.includes('action|logon_fail')) {
      console.log('[BOT] Sub-server redirect requested or auth failed.');
    } else if (text.includes('action|drop')) {
      handleItemDrop(text);
    }
  }
});

async function handleItemDrop(packetText: string) {
  const lines = packetText.split('\n');
  const params: Record<string, string> = {};
  
  lines.forEach(line => {
    const [key, value] = line.split('|');
    if (key && value) params[key] = value;
  });

  const itemID = parseInt(params['itemID'] || '0');
  const count = parseInt(params['count'] || '0');
  const growId = params['growId'] || 'Unknown';

  let subunits = 0;
  if (itemID === 242) subunits = count * 100;
  if (itemID === 7188) subunits = count * 10000;

  if (subunits > 0) {
    console.log(`[BOT] LIVE DROP DETECTED: ${count}x item ${itemID} from ${growId}. Value: ${subunits} subunits.`);
    try {
      const res = await axios.post(BACKEND_URL, {
        secret: BOT_SECRET,
        growId: growId,
        amount: subunits
      });

      if (res.data.success) {
        console.log(`[BOT] Credit confirmed for ${growId}. Sending collect packet...`);
        sendCollectPacket(serverPeer, itemID);
      }
    } catch (err: any) {
      console.error(`[BOT] Failed to credit ${growId}:`, err.response?.data?.error || err.message);
    }
  }
}

function sendLogon(peer: any) {
  if (!peer) return;
  const logonString = `ltoken|${config.ltoken}\nrequestedName|${config.botName}\nf|1\nprotocol|189\ngame_version|4.35\nmac|${config.mac}\nwk|${config.wk}\nhash2|${config.hash2}\nrid|${config.rid}\nmeta|${SERVER_META}`;

  console.log('[BOT] Firing Logon Packet...');
  const pkt = TextPacket.from(0x2, logonString);
  peer.send(pkt);
}

function sendCollectPacket(peer: any, itemID: number) {
  if (!peer) return;
  console.log(`[BOT] Scooping item ${itemID}...`);
  const collectAction = `action|collect\n|itemID|${itemID}`;
  const pkt = TextPacket.from(0x3, collectAction);
  peer.send(pkt);
}

// SIMULATE DROP TO VERIFY BACKEND
setTimeout(() => {
  console.log("[BOT] Simulating a mock drop to verify backend...");
  handleItemDrop("action|drop\nitemID|242\ncount|10\ngrowId|MockUser123\n");
}, 5000);

try {
  client.listen(); 
} catch (err: any) {
  console.error('[BOT] Engine failure:', err.message);
}

const enet = require('enet');
import crypto from 'crypto';

const SERVER_IP = '209.15.226.72'; // Target GT IP
const SERVER_PORT = 17091;

// Generate random device details for the new account
const config = {
  mac: generateMac(),
  wk: crypto.randomBytes(16).toString('hex').toUpperCase(),
  hash2: Math.floor(Math.random() * 1000000000).toString(),
  rid: crypto.randomBytes(16).toString('hex').toUpperCase(),
  requestedUsername: `BetBot${Math.floor(Math.random() * 99999)}`,
  requestedPassword: `BotPass${Math.floor(Math.random() * 9999)}!`,
  requestedEmail: `bot${Math.floor(Math.random() * 999999)}@gmail.com`
};

let peer: any = null;
let host: any = null;

function generateMac() {
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, () => {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
  });
}

function connectEnet() {
  host = enet.Host.createClient(1, 2, 0, 0);
  console.log(`[GEN] Connecting to ${SERVER_IP}:${SERVER_PORT}...`);
  
  host.on('connect', (p: any) => {
    peer = p;
    console.log('[GEN] Connected! Waiting for HELLO...');
  });

  host.on('message', (p: any, packet: Buffer) => {
    const packetType = packet.length > 0 ? packet.readInt32LE(0) : 0;
    const data = packet.length > 4 ? packet.slice(4) : Buffer.from('');
    
    if (packetType === 1) {
      console.log('[GEN] Received HELLO. Sending Guest Logon...');
      sendGuestLogon();
    }
    
    if (packetType === 3 || packetType === 4) {
      const text = data.toString('utf-8');
      
      // When the server successfully logs us in as a guest, it usually sends a variant list with "OnSuperMain" or similar
      if (text.includes('OnSuperMainStartAcceptLogonHrdxs47254722215a')) {
        console.log('[GEN] Logged in as Guest. Sending Registration Request...');
        sendRegisterPacket();
      }
      
      // Listen for console messages about registration success or failure
      if (text.includes('action|logon_fail')) {
        console.log('[GEN] Auth failed or sub-server redirect required.');
      }
      
      if (text.includes('OnConsoleMessage')) {
        if (text.includes('success')) {
            console.log(`\n[GEN] SUCCESS! Account Created.`);
            console.log(`Username: ${config.requestedUsername}`);
            console.log(`Password: ${config.requestedPassword}`);
            console.log(`Email: ${config.requestedEmail}`);
            process.exit(0);
        } else {
            console.log(`[GEN] Server Message: ${text}`);
        }
      }
    }
  });

  host.on('disconnect', () => {
    console.log('[GEN] Disconnected.');
    process.exit(1);
  });

  host.connect(new enet.Address(SERVER_IP, SERVER_PORT), 1, 0);
  host.start(50); 
}

function sendGuestLogon() {
  const logonString = `
requestedName|Guest_${Math.floor(Math.random() * 99999)}
f|1
protocol|189
game_version|4.35
mac|${config.mac}
wk|${config.wk}
hash2|${config.hash2}
rid|${config.rid}
meta|bot_instance
  `.trim();

  if (peer) {
    const buf = Buffer.alloc(4 + logonString.length);
    buf.writeInt32LE(2, 0);
    buf.write(logonString, 4);
    const packet = new enet.Packet(buf, enet.PACKET_FLAG.RELIABLE);
    peer.send(0, packet);
  }
}

function sendRegisterPacket() {
  const registerString = `action|dialog_return\ndialog_name|register\nusername|${config.requestedUsername}\npassword|${config.requestedPassword}\npasswordverify|${config.requestedPassword}\nemail|${config.requestedEmail}`;
  
  if (peer) {
    const buf = Buffer.alloc(4 + registerString.length);
    buf.writeInt32LE(3, 0); // Action packet
    buf.write(registerString, 4);
    const packet = new enet.Packet(buf, enet.PACKET_FLAG.RELIABLE);
    peer.send(0, packet);
  }
}

console.log('[GEN] Starting Account Generator...');
console.log(`[GEN] Target Config: ${config.requestedUsername} / ${config.requestedPassword}`);
connectEnet();

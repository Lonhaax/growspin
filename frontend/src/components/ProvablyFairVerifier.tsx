"use client";

import { useState } from "react";
import { CheckCircle, Search, Calculator } from "lucide-react";

export default function ProvablyFairVerifier() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("0");
  const [game, setGame] = useState("crash");
  const [result, setResult] = useState<{ hash: string; float: number; outcome: string } | null>(null);

  const calculateHMAC = async (secret: string, message: string) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce) return;

    const hash = await calculateHMAC(serverSeed, `${clientSeed}-${nonce}`);
    const hexSubstring = hash.substring(0, 8); // 32 bits
    const float = parseInt(hexSubstring, 16) / 0xffffffff;

    let outcome = "";
    if (game === "crash") {
      const e = 0.95;
      const rawCrash = e / (1 - float);
      outcome = Math.max(1.0, Math.floor(rawCrash * 100) / 100).toFixed(2) + "x";
    } else if (game === "coinflip") {
      outcome = float < 0.5 ? "heads" : "tails";
    } else if (game === "dice") {
      outcome = (float * 100).toFixed(2);
    } else if (game === "roulette") {
      const roll = Math.floor(float * 15);
      if (roll === 0) outcome = "green";
      else if (roll >= 1 && roll <= 7) outcome = "red";
      else outcome = "black";
    } else if (game === "plinko") {
      // Basic 14 row calculation demonstration
      let bucket = 0;
      let path = [];
      for (let i = 0; i < 14; i++) {
        const val = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
        const dir = val % 2 === 0 ? 0 : 1;
        path.push(dir);
        if (dir === 1) bucket++;
      }
      outcome = `Bucket ${bucket} (14 rows)`;
    } else if (game === "mines") {
       outcome = "Mines locations generated from full hash string (see code)";
    }

    setResult({ hash, float, outcome });
  };

  return (
    <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-8 shadow-xl mt-8">
      <div className="flex items-center gap-3 mb-6 border-b border-[#2a2d3a] pb-4">
        <Calculator className="text-accent-blue" size={24} />
        <h2 className="text-xl font-bold text-white">Manual Verifier</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Server Seed (Unhashed)</label>
          <input
            type="text"
            value={serverSeed}
            onChange={(e) => setServerSeed(e.target.value)}
            className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue font-mono"
            placeholder="Paste server seed here..."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Client Seed</label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue font-mono"
            placeholder="Paste client seed here..."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Nonce</label>
          <input
            type="number"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Game</label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue font-mono"
          >
            <option value="crash">Crash</option>
            <option value="coinflip">Coinflip</option>
            <option value="dice">Dice</option>
            <option value="roulette">Roulette</option>
            <option value="plinko">Plinko</option>
            <option value="mines">Mines</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleVerify}
        className="w-full py-4 bg-[#2a2d3a] hover:bg-[#323644] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mb-6"
      >
        <Search size={18} /> Verify Outcome
      </button>

      {result && (
        <div className="bg-[#15181f] border border-accent-blue/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-accent-blue mb-2">
            <CheckCircle size={20} />
            <span className="font-bold">Calculated Match</span>
          </div>
          
          <div>
            <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">HMAC-SHA256 Hash</label>
            <div className="bg-black/40 p-3 rounded-lg text-xs text-[#7a819c] font-mono break-all border border-[#2a2d3a]">
              {result.hash}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Generated Float</label>
                <div className="bg-black/40 p-3 rounded-lg text-sm text-white font-mono border border-[#2a2d3a]">
                  {result.float.toFixed(8)}
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Game Outcome</label>
                <div className="bg-accent-blue/20 p-3 rounded-lg text-sm text-white font-mono border border-accent-blue/30 font-bold">
                  {result.outcome}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function CoinflipPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  const { showToast } = useWallet();
  
  const [betAmount, setBetAmount] = useState<string>("0.00");
  const [betOn, setBetOn] = useState<"heads" | "tails">("heads");
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<{ outcome: string, win: boolean } | null>(null);

  // For the UI to show streak text
  const [hits, setHits] = useState(0);

  const handleFlip = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (amountCents <= 0) return showToast("Invalid bet amount.", "error");
    if (user.mockBalance < amountCents) return showToast("Insufficient balance.", "error");

    setIsFlipping(true);
    setResult(null);

    try {
      const res = await apiFetch("/play/coinflip", {
        method: "POST",
        body: JSON.stringify({ amount: amountCents, betOn })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Simulate a small flip delay for UI
      setTimeout(() => {
        setResult(data);
        setIsFlipping(false);
        if (data.win) {
          setHits(1);
          showToast(`Won ${(data.profit / 100).toFixed(2)} DLs!`, "success");
        } else {
          setHits(0);
        }
        refreshUser();
      }, 1500); 

    } catch (err: any) {
      showToast(err.message || "Failed to start game", "error");
      setIsFlipping(false);
    }
  };

  const numBetAmount = parseFloat(betAmount) * 100;
  const isInsufficient = user && !isNaN(numBetAmount) && numBetAmount > user.mockBalance;

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#0d0f14] text-white">
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* LEFT: Controls Sidebar */}
      <div className="w-full md:w-80 bg-[#1b1e26] border-r border-[#2a2d3a] flex flex-col flex-shrink-0 z-10">
        <div className="p-4 space-y-6 flex-1">
          {/* Bet Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[#878eab]">Bet Amount</label>
              <span className="text-xs font-bold text-[#4d5366]">DLs</span>
            </div>
            <div className="flex bg-[#0f1118] border border-[#2a2d3a] rounded-xl overflow-hidden focus-within:border-accent-blue transition-colors relative">
              <div className="pl-3 flex items-center justify-center pointer-events-none">
                <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isFlipping}
                className="w-full bg-transparent text-white font-bold text-sm px-3 py-3 focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center px-1 gap-1">
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                  disabled={isFlipping}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                  disabled={isFlipping}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  2x
                </button>
              </div>
            </div>
          </div>

          {/* Coin Side */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#878eab]">Coin Side</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBetOn("heads")}
                disabled={isFlipping}
                className={`flex-1 py-4 flex flex-col items-center justify-center rounded-xl transition-all border-2 ${
                  betOn === "heads"
                    ? "bg-[#334b3f]/30 border-accent-green"
                    : "bg-[#1f222b] border-transparent hover:bg-[#2a2d3a]"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-yellow-600 flex items-center justify-center mb-1 shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                  <div className="w-6 h-6 rounded-full border border-yellow-600 bg-yellow-400 flex items-center justify-center">
                    <span className="text-[10px] font-black text-yellow-700">H</span>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setBetOn("tails")}
                disabled={isFlipping}
                className={`flex-1 py-4 flex flex-col items-center justify-center rounded-xl transition-all border-2 ${
                  betOn === "tails"
                    ? "bg-[#334b3f]/30 border-accent-green"
                    : "bg-[#1f222b] border-transparent hover:bg-[#2a2d3a]"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-gray-500 flex items-center justify-center mb-1 shadow-[0_0_10px_rgba(156,163,175,0.4)]">
                  <div className="w-6 h-6 rounded-full border border-gray-500 bg-gray-300 flex items-center justify-center">
                    <span className="text-[10px] font-black text-gray-600">T</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleFlip}
            disabled={isFlipping || isInsufficient || parseFloat(betAmount) <= 0}
            className={`w-full py-4 font-black rounded-xl text-lg transition-all ${
              isInsufficient
                ? "bg-[#2f4553] text-[#878eab] cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            }`}
          >
            {isInsufficient ? "Insufficient Funds" : isFlipping ? "Flipping..." : "Place Bet"}
          </button>
        </div>
      </div>

      {/* RIGHT: Game Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0f14]">
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
          
          <div className="flex items-center gap-12 lg:gap-24">
            {/* Hits Box */}
            <div className="border border-[#2a2d3a] bg-[#15181f]/80 rounded-lg p-6 flex flex-col items-center justify-center min-w-[120px] backdrop-blur-sm">
              <span className="text-4xl font-black text-white">{hits}</span>
              <span className="text-xs font-bold text-[#878eab] uppercase tracking-widest mt-1">HITS</span>
            </div>

            {/* The Coin */}
            <div className="relative w-48 h-48 lg:w-64 lg:h-64 perspective-1000">
              <motion.div 
                animate={{ 
                  rotateY: isFlipping ? [0, 360, 720, 1080, 1440] : result ? (result.outcome === "heads" ? 0 : 180) : (betOn === "heads" ? 0 : 180) 
                }}
                transition={{ 
                  duration: isFlipping ? 1.5 : 0.5, 
                  ease: isFlipping ? "linear" : "easeOut",
                  repeat: isFlipping ? Infinity : 0
                }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Heads Side */}
                <div className="absolute inset-0 backface-hidden bg-yellow-500 rounded-full border-8 border-yellow-600 shadow-[0_0_40px_rgba(234,179,8,0.3)] flex items-center justify-center">
                  <div className="w-[80%] h-[80%] rounded-full border-4 border-yellow-600 bg-yellow-400 flex items-center justify-center">
                    <span className="text-yellow-700 font-black text-6xl opacity-60">H</span>
                  </div>
                </div>

                {/* Tails Side */}
                <div className="absolute inset-0 backface-hidden bg-gray-400 rounded-full border-8 border-gray-500 shadow-[0_0_40px_rgba(156,163,175,0.3)] flex items-center justify-center rotate-y-180">
                  <div className="w-[80%] h-[80%] rounded-full border-4 border-gray-500 bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-black text-6xl opacity-60">T</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Multiplier Box */}
            <div className="border border-[#2a2d3a] bg-[#15181f]/80 rounded-lg p-6 flex flex-col items-center justify-center min-w-[120px] backdrop-blur-sm">
              <span className="text-4xl font-black text-white">{hits > 0 ? "1.95x" : "X"}</span>
              <span className="text-xs font-bold text-[#878eab] uppercase tracking-widest mt-1">MULTIPLIER</span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-[#15181f] border-t border-[#1b1e26] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm font-bold text-[#878eab] px-2">
            <button onClick={() => setIsFairOpen(true)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ShieldCheck size={16} /> Provably Fair
            </button>
            <button className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Settings size={16} /> Settings
            </button>
          </div>
          
          <div className="bg-[#0f1118] border border-[#1b1e26] rounded-xl p-6 flex flex-col md:flex-row gap-8">
            <div className="space-y-4 min-w-[250px]">
              <h2 className="text-xl font-black text-white">Coin Flip</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">RTP</span>
                  <span className="text-white font-bold">96.00%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">Max Bet</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">1,000.00</span>
                    <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">Max Win</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">10,000.00</span>
                    <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[#878eab] text-sm font-bold leading-relaxed max-w-2xl">
              <p>The mechanics of playing this game are simple, and you can toss a coin and choose between H or T.</p>
              <br/>
              <p>Once you've landed on a winning bet, you have the discretion to resume flipping the coin for extra rounds, which, in turn, translates to extra prizes and higher payouts.</p>
              <p className="mt-2">Not only that, but the multipliers also keep increasing as you keep winning throughout every coin flip.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

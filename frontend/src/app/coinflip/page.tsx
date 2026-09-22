"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Coins } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

export default function CoinflipPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const [betOn, setBetOn] = useState<"heads" | "tails">("heads");
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<{ outcome: string, win: boolean } | null>(null);
  const [error, setError] = useState("");

  const handleFlip = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setError("");
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (amountCents <= 0) return setError("Invalid bet amount.");
    if (user.mockBalance < amountCents) return setError("Insufficient balance.");

    setIsFlipping(true);
    setResult(null);

    try {
      const res = await apiFetch("/play/coinflip", {
        method: "POST",
        body: JSON.stringify({ amount: amountCents, betOn })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setTimeout(() => {
        setResult(data);
        setIsFlipping(false);
        refreshUser();
      }, 2000); 

    } catch (err: any) {
      setError(err.message || "Failed to start game");
      setIsFlipping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 flex flex-col lg:flex-row gap-8 pb-32">
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* LEFT: Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* Title Block */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1f222b] border border-[#2a2d3a] flex items-center justify-center text-yellow-500 shadow-lg">
              <Coins size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Coinflip</h1>
          </div>
          <button 
            onClick={() => setIsFairOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-[#7a819c] hover:text-white transition-colors bg-[#1f222b] px-3 py-2 rounded-lg border border-[#2a2d3a] hover:border-accent-blue"
          >
            <ShieldCheck size={16} /> Provably Fair
          </button>
        </div>

        {/* Controls Block */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Bet Amount</label>
              <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                    <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]" />
                  </span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isFlipping}
                    className="w-full bg-[#1f222b] border-2 border-[#2a2d3a] rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
                  />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Pick a side</label>
              <div className="flex bg-[#1f222b] border border-[#2a2d3a] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setBetOn("heads")}
                  disabled={isFlipping}
                  className={`flex-1 py-3 text-sm font-black rounded-lg transition-all uppercase tracking-wider ${
                    betOn === "heads" 
                      ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                      : "text-[#7a819c] hover:bg-[#2a2d3a] hover:text-white"
                  }`}
                >
                  Heads
                </button>
                <button
                  onClick={() => setBetOn("tails")}
                  disabled={isFlipping}
                  className={`flex-1 py-3 text-sm font-black rounded-lg transition-all uppercase tracking-wider ${
                    betOn === "tails" 
                      ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                      : "text-[#7a819c] hover:bg-[#2a2d3a] hover:text-white"
                  }`}
                >
                  Tails
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center shadow-inner">{error}</div>}

            <button
              onClick={handleFlip}
              disabled={isFlipping || !user}
              className="w-full py-4 mt-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-xl font-black text-lg hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
            >
              {isFlipping ? "FLIPPING..." : "FLIP COIN"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Game Area */}
      <div className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-3xl relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[500px]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        
        {/* Glow behind coin */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] rounded-full transition-all duration-1000 ${
            result ? (result.win ? 'bg-accent-green/20' : 'bg-red-500/20') : 'bg-yellow-500/10'
        }`} />

        <div className="relative z-10 perspective-1000">
          <motion.div 
            animate={{ 
              rotateY: isFlipping ? [0, 360, 720, 1080, 1440] : result ? (result.outcome === "heads" ? 0 : 180) : (betOn === "heads" ? 0 : 180) 
            }}
            transition={{ 
              duration: isFlipping ? 2 : 0.5, 
              ease: isFlipping ? "linear" : "easeOut",
              repeat: isFlipping ? Infinity : 0
            }}
            className="w-48 h-48 relative preserve-3d"
          >
            {/* Heads Side */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-8 border-yellow-700 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
              <div className="w-[85%] h-[85%] rounded-full border-4 border-yellow-500/50 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
                  <Coins size={48} className="text-yellow-100 opacity-80 mb-1" />
                  <span className="text-yellow-100 font-black text-2xl drop-shadow-md">HEADS</span>
              </div>
            </div>

            {/* Tails Side */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-bl from-gray-300 to-gray-600 rounded-full border-8 border-gray-700 flex items-center justify-center rotate-y-180 shadow-[0_0_50px_rgba(156,163,175,0.5)]">
              <div className="w-[85%] h-[85%] rounded-full border-4 border-gray-500/50 flex flex-col items-center justify-center bg-gradient-to-bl from-gray-400 to-gray-600">
                  <Coins size={48} className="text-gray-100 opacity-80 mb-1" />
                  <span className="text-gray-100 font-black text-2xl drop-shadow-md">TAILS</span>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && !isFlipping && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className={`absolute bottom-16 px-10 py-5 rounded-2xl border-2 backdrop-blur-md text-center shadow-2xl ${
                result.win 
                  ? "bg-accent-green/20 border-accent-green" 
                  : "bg-red-500/20 border-red-500"
              }`}
            >
              <h3 className={`text-3xl font-black uppercase tracking-widest ${result.win ? "text-accent-green" : "text-red-500"}`}>
                {result.win ? "You Won!" : "You Lost!"}
              </h3>
              {result.win && (
                <div className="text-white font-black mt-2 text-xl flex items-center justify-center gap-1.5">
                  <span className="text-accent-green">+</span>
                  <DLCurrency amount={parseFloat(betAmount) * 2} isRaw={true} size="lg" className="text-white" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

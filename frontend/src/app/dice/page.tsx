"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Dices } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

export default function DicePage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const [target, setTarget] = useState<number>(50); // Roll under this number to win (0-100)
  
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number, win: boolean, profit: number } | null>(null);
  const [visualResult, setVisualResult] = useState<{ roll: number, win: boolean | null } | null>(null);
  const [error, setError] = useState("");

  // Safely drive the chaotic rolling animation using React lifecycle
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setVisualResult({ roll: Math.random() * 100, win: null });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isRolling]);

  const handleRoll = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setError("");
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (amountCents <= 0) return setError("Invalid bet amount.");
    if (user.mockBalance < amountCents) return setError("Insufficient balance.");
    if (target < 2 || target > 98) return setError("Target must be between 2 and 98.");

    setIsRolling(true);
    setResult(null);

    // Initial dummy state to mount the marker immediately
    setVisualResult({ roll: 50, win: null });

    try {
      const res = await apiFetch("/play/dice", {
        method: "POST",
        body: JSON.stringify({ amount: amountCents, winChance })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Suspenseful wait before final reveal
      setTimeout(() => {
        setIsRolling(false);
        setVisualResult(data);
        setResult(data);
        refreshUser();
      }, 1500);

    } catch (err: any) {
      setIsRolling(false);
      setVisualResult(null);
      setError(err.message || "Failed to roll");
    }
  };

  const winChance = target;
  const multiplier = 99 / winChance;
  const potentialProfit = (parseFloat(betAmount) * multiplier) - parseFloat(betAmount);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* Title */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1f222b] border border-[#2a2d3a] flex items-center justify-center text-purple-500 shadow-lg">
            <Dices size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Dice</h1>
            <p className="text-[#7a819c] font-medium text-sm mt-1">Roll the dice and beat your target.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFairOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-[#7a819c] hover:text-white transition-colors bg-[#1f222b] px-3 py-2 rounded-lg border border-[#2a2d3a] hover:border-accent-blue"
        >
          <ShieldCheck size={16} /> Provably Fair
        </button>
      </div>

      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-8 shadow-2xl">
        
        {/* Slider Area */}
        <div className="mb-12 relative pt-12">
          {/* Result marker */}
          {visualResult && (
            <motion.div
              initial={{ scale: 0, y: 20, left: "50%" }}
              animate={{ scale: 1, y: 0, left: `${visualResult.roll}%` }}
              transition={{ type: "spring", stiffness: isRolling ? 400 : 100, damping: isRolling ? 25 : 15 }}
              className={`absolute top-0 -translate-x-1/2 flex flex-col items-center z-20 ${
                visualResult.win === null ? 'text-yellow-500' : (visualResult.win ? 'text-accent-green' : 'text-red-500')
              }`}
            >
              <div className={`px-3 py-1 rounded-lg font-black text-lg z-10 ${
                visualResult.win === null 
                  ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                  : (visualResult.win ? 'bg-accent-green text-black shadow-[0_0_15px_rgba(0,230,118,0.5)]' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]')
              }`}>
                {isRolling ? "???" : visualResult.roll.toFixed(2)}
              </div>
              <div className={`mt-1 -mb-2 z-0 ${
                visualResult.win === null
                  ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                  : (visualResult.win ? 'text-accent-green drop-shadow-[0_0_10px_rgba(0,230,118,0.8)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]')
              }`}>
                <Dices size={28} />
              </div>
            </motion.div>
          )}

          {/* Seamless Slider Container */}
          <div className="relative h-12 flex items-center w-full">
            {/* Visual Track */}
            <div className="absolute inset-x-0 h-4 rounded-full flex overflow-hidden shadow-inner bg-[#1f222b] pointer-events-none">
              <div className="h-full bg-accent-green shadow-[0_0_15px_rgba(0,230,118,0.8)]" style={{ width: `${target}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${100 - target}%` }} />
            </div>
            
            {/* Custom Thumb */}
            <div 
              className="w-8 h-8 bg-white rounded-lg shadow-xl absolute pointer-events-none flex items-center justify-center border-2 border-[#15181f] z-20 -translate-x-1/2"
              style={{ left: `${target}%` }}
            >
              <div className="w-1 h-4 bg-gray-300 rounded-full" />
            </div>

            {/* Invisible Native Input */}
            <input 
              type="range" 
              min="2" max="98" step="0.01"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              className="w-full absolute inset-0 h-full opacity-0 cursor-pointer z-30"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-[#1f222b] p-4 rounded-2xl border border-[#2a2d3a]">
          <div className="text-center border-r border-[#2a2d3a]">
            <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-1">Multiplier</div>
            <div className="text-white font-black text-xl">{multiplier.toFixed(2)}x</div>
          </div>
          <div className="text-center border-r border-[#2a2d3a]">
            <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-1">Roll Under</div>
            <div className="text-accent-blue font-black text-xl">{target.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-1">Win Chance</div>
            <div className="text-accent-green font-black text-xl">{winChance.toFixed(2)}%</div>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Bet Amount</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]" />
                </span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={isRolling}
                  className="w-full bg-[#1f222b] border-2 border-[#2a2d3a] rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-50"
                />
            </div>
            {error && <div className="text-red-500 text-xs font-bold mt-2">{error}</div>}
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Profit on Win</label>
            <div className="w-full bg-[#1f222b] border-2 border-[#2a2d3a] rounded-xl px-4 py-3 text-accent-green font-black flex items-center gap-2">
              <DLCurrency amount={isNaN(potentialProfit) ? 0 : potentialProfit} isRaw={true} size="md" className="text-accent-green" />
            </div>
          </div>
        </div>

        <button
          onClick={handleRoll}
          disabled={isRolling || !user}
          className="w-full mt-6 py-4 bg-accent-blue text-white rounded-xl font-black text-xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3"
        >
          {isRolling ? <Dices className="animate-bounce" /> : <Dices />}
          {isRolling ? "ROLLING..." : "ROLL DICE"}
        </button>

      </div>
    </div>
  );
}

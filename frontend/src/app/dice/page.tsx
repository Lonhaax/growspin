"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { apiFetch } from "@/lib/auth";
import { ShieldCheck, Dices, ArrowRightLeft } from "lucide-react";
import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { motion } from "framer-motion";

export default function DicePage() {
  const { balance, refreshUser, showToast } = useWallet();

  const [betAmount, setBetAmount] = useState<string>("0.00");
  const [target, setTarget] = useState<number>(50); // Roll under this number to win (0-100)
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true); // Currently, backend only supports roll under (roll < winChance)
  // We'll simulate Roll Over visually, but mathematically we'll just invert the target for backend if needed.
  // Actually, backend dice.ts uses `const win = roll < winChance;`. So it's always roll under.
  // We will just do Roll Under natively. To be perfectly matching screenshot, we just display the target.

  const [isRolling, setIsRolling] = useState(false);
  const [visualResult, setVisualResult] = useState<{ roll: number, win: boolean | null } | null>(null);
  
  const [pfModalOpen, setPfModalOpen] = useState(false);
  const [rtp, setRtp] = useState<string>("99.00"); // Dice is 1% edge by default in backend

  // Not checking backend /settings for dice yet unless added, default to 99%
  // But let's fetch just in case it is added in the future
  useEffect(() => {
    apiFetch("/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.diceHouseEdge !== undefined) {
          setRtp((100 - data.diceHouseEdge * 100).toFixed(2));
        }
      })
      .catch(console.error);
  }, []);

  // Safely drive the chaotic rolling animation using React lifecycle
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setVisualResult({ roll: Math.random() * 100, win: null });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRolling]);

  const handleRoll = async () => {
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (isNaN(amountCents) || amountCents <= 0) {
      showToast("Invalid bet amount.", "error");
      return;
    }
    if (amountCents > balance) {
      showToast("Insufficient balance.", "error");
      return;
    }
    if (target < 2 || target > 98) {
      showToast("Target must be between 2 and 98.", "error");
      return;
    }

    setIsRolling(true);

    // Initial dummy state to mount the marker immediately
    setVisualResult({ roll: 50, win: null });

    try {
      const winChance = target;
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
        refreshUser();
      }, 1000);

    } catch (err: any) {
      setIsRolling(false);
      setVisualResult(null);
      showToast(err.message || "Failed to roll", "error");
    }
  };

  const winChance = target;
  const multiplier = (100 / winChance) * (parseFloat(rtp) / 100);
  const potentialProfit = (parseFloat(betAmount) * multiplier) - parseFloat(betAmount);

  const numBetAmount = parseFloat(betAmount) * 100;
  const isInsufficient = !isNaN(numBetAmount) && numBetAmount > balance;

  // Handle Multiplier Input
  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMult = parseFloat(e.target.value);
    const fraction = parseFloat(rtp) / 100;
    if (!isNaN(newMult) && newMult >= (100/98)*fraction && newMult <= (100/2)*fraction) {
      setTarget((100 * fraction) / newMult);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#0d0f14] text-white">
      <ProvablyFairModal isOpen={pfModalOpen} onClose={() => setPfModalOpen(false)} />

      {/* Sidebar Controls */}
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
                disabled={isRolling}
                className="w-full bg-transparent text-white font-bold text-sm px-3 py-3 focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center px-1 gap-1">
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                  disabled={isRolling}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                  disabled={isRolling}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  2x
                </button>
              </div>
            </div>
          </div>

          {/* Profit on Win (Sidebar addition to match style) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[#878eab]">Profit on Win</label>
            </div>
            <div className="flex bg-[#0f1118] border border-[#2a2d3a] rounded-xl overflow-hidden pointer-events-none opacity-80">
              <div className="pl-3 flex items-center justify-center">
                <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" />
              </div>
              <input
                type="text"
                value={isNaN(potentialProfit) ? "0.00" : potentialProfit.toFixed(2)}
                readOnly
                className="w-full bg-transparent text-accent-green font-black text-sm px-3 py-3 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRoll}
            disabled={isInsufficient || isRolling || parseFloat(betAmount) <= 0}
            className={`w-full py-4 font-black rounded-xl text-lg transition-all ${
              isInsufficient
                ? "bg-[#2f4553] text-[#878eab] cursor-not-allowed"
                : "bg-accent-blue hover:bg-accent-blue/90 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            }`}
          >
            {isRolling ? "Rolling..." : (isInsufficient ? "Insufficient Funds" : "Place Bet")}
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          
          <div className="w-full max-w-3xl flex flex-col items-center gap-16">
            
            {/* The Dice Slider UI */}
            <div className="w-full relative px-6 py-12">
              
              {/* Markers */}
              <div className="absolute top-0 left-0 w-full flex justify-between text-[#878eab] text-sm font-bold px-6">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>

              {/* Slider Track */}
              <div className="relative h-3 w-full bg-[#1b1e26] rounded-full overflow-hidden flex shadow-inner shadow-black/50">
                <div className="h-full bg-accent-green" style={{ width: `${target}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${100 - target}%` }} />
              </div>

              {/* The Result Hover */}
              {visualResult && (
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0, left: `${visualResult.roll}%` }}
                  transition={{ type: "spring", stiffness: isRolling ? 300 : 100, damping: isRolling ? 25 : 15 }}
                  className="absolute top-8 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
                >
                  <div className={`px-4 py-2 rounded-xl font-black text-xl shadow-xl transition-colors ${
                    visualResult.win === null 
                      ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                      : (visualResult.win ? 'bg-accent-green text-black shadow-[0_0_20px_rgba(0,230,118,0.4)]' : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]')
                  }`}>
                    {isRolling ? "???" : visualResult.roll.toFixed(2)}
                  </div>
                </motion.div>
              )}

              {/* Native Range Input over the Track */}
              <div className="absolute inset-x-6 top-[28px] h-12 flex items-center group">
                <input
                  type="range"
                  min="2" max="98" step="0.01"
                  value={target}
                  onChange={(e) => setTarget(parseFloat(e.target.value))}
                  disabled={isRolling}
                  className="w-full absolute inset-0 opacity-0 cursor-pointer z-30"
                />
                {/* Visual Thumb */}
                <div 
                  className="w-12 h-12 rounded-xl bg-white shadow-xl shadow-black/50 flex flex-col items-center justify-center absolute pointer-events-none z-10 -translate-x-1/2 transition-transform group-hover:scale-110"
                  style={{ left: `${target}%` }}
                >
                  <div className="text-[10px] font-black text-black leading-none mt-1">{target.toFixed(0)}</div>
                  <div className="flex gap-1 mt-1">
                    <div className="w-1 h-2 rounded-full bg-gray-300" />
                    <div className="w-1 h-2 rounded-full bg-gray-300" />
                  </div>
                </div>
              </div>

            </div>

            {/* Inputs below slider */}
            <div className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl flex items-center p-2">
              <div className="flex-1 flex flex-col border-r border-[#2a2d3a] p-2">
                <label className="text-xs font-bold text-[#878eab] mb-1 px-2">Multiplier</label>
                <input
                  type="number"
                  value={multiplier.toFixed(2)}
                  onChange={handleMultiplierChange}
                  disabled={isRolling}
                  className="w-full bg-transparent text-white font-black px-2 outline-none"
                />
              </div>
              <div className="flex-1 flex flex-col relative p-2">
                <label className="text-xs font-bold text-[#878eab] mb-1 px-2">Roll Under</label>
                <input
                  type="number"
                  value={target.toFixed(2)}
                  onChange={(e) => setTarget(Math.min(98, Math.max(2, parseFloat(e.target.value) || 50)))}
                  disabled={isRolling}
                  className="w-full bg-transparent text-white font-black px-2 outline-none"
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#878eab] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  disabled={isRolling}
                  onClick={() => setIsRollUnder(!isRollUnder)}
                >
                  <ArrowRightLeft size={18} />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer info */}
        <div className="bg-[#15181f] border-t border-[#1b1e26] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm font-bold text-[#878eab]">
            <button onClick={() => setPfModalOpen(true)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ShieldCheck size={16} /> Provably Fair
            </button>
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-[#0d1016] rounded-xl border border-[#2a2d3a]">
            <div className="flex justify-between items-center text-sm border-b border-[#2a2d3a]/50 pb-2">
              <span className="text-[#878eab] font-bold">House Edge</span>
              <span className="text-white font-black">{(100 - parseFloat(rtp)).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-[#878eab] font-bold">RTP</span>
              <span className="text-accent-green font-black">{rtp}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

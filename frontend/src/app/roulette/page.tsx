"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, CircleDot } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

export default function RoulettePage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [betAmount, setBetAmount] = useState<string>("10.00");
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ roll: number, win: boolean, profit: number, outcomeColor: string } | null>(null);
  const [error, setError] = useState("");

  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelOffset, setWheelOffset] = useState(0);

  // Hardcode 15 items in a sequence (0 green, 1-7 red, 8-14 black)
  const TILE_WIDTH = 80;
  const generateStrip = () => {
    const strip = [];
    for (let i = 0; i < 100; i++) {
      const num = i % 15;
      let color = 'bg-red-500';
      if (num === 0) color = 'bg-accent-green text-black';
      else if (num >= 8) color = 'bg-[#1f222b]';
      strip.push({ num, color });
    }
    return strip;
  };
  const [strip] = useState(generateStrip());

  const handleBet = async (color: 'red' | 'black' | 'green') => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setError("");
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (amountCents <= 0) return setError("Invalid bet amount.");
    if (user.mockBalance < amountCents) return setError("Insufficient balance.");

    setIsSpinning(true);
    setResult(null);

    try {
      const res = await apiFetch("/play/roulette", {
        method: "POST",
        body: JSON.stringify({ amount: amountCents, betOn: color })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Find the target number in the latter half of the strip
      const targetNum = data.roll;
      let targetIndex = 0;
      for (let i = 70; i < 90; i++) {
        if (strip[i].num === targetNum) {
          targetIndex = i;
          break;
        }
      }

      // Calculate translation
      const containerWidth = wheelRef.current ? wheelRef.current.clientWidth : 800;
      const centerOffset = (containerWidth / 2) - (TILE_WIDTH / 2);
      const randomJitter = Math.random() * 40 - 20; 
      const finalTranslate = -(targetIndex * TILE_WIDTH) + centerOffset + randomJitter;

      setWheelOffset(finalTranslate);

      setTimeout(() => {
        setResult(data);
        setIsSpinning(false);
        refreshUser();
      }, 5500);

    } catch (err: any) {
      setError(err.message || "Failed to start game");
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* Title */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1f222b] border border-[#2a2d3a] flex items-center justify-center text-red-500 shadow-lg">
            <CircleDot size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Roulette</h1>
            <p className="text-[#7a819c] font-medium text-sm mt-1">Spin the wheel and pick your color.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFairOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-[#7a819c] hover:text-white transition-colors bg-[#1f222b] px-3 py-2 rounded-lg border border-[#2a2d3a] hover:border-accent-blue"
        >
          <ShieldCheck size={16} /> Provably Fair
        </button>
      </div>

      {/* Wheel Area */}
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Target Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white z-20 shadow-[0_0_15px_rgba(255,255,255,1)]" />
        
        {/* Glows */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#15181f] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#15181f] to-transparent z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-blue/10 blur-[80px] rounded-full pointer-events-none" />

        <div ref={wheelRef} className="w-full h-32 overflow-hidden relative">
          <motion.div
            className="flex items-center h-full absolute left-0"
            animate={{ x: wheelOffset }}
            transition={{ duration: 5, ease: [0.12, 0.8, 0.15, 1] }}
          >
            {strip.map((item, idx) => (
              <div 
                key={idx} 
                className="w-20 h-24 flex-shrink-0 flex items-center justify-center p-1"
              >
                <div className={`w-full h-full rounded-2xl flex items-center justify-center shadow-lg transform transition-transform ${item.color} ${item.num === 0 ? 'border-2 border-green-400' : 'border border-black/20'}`}>
                  <span className="text-white font-black text-2xl drop-shadow-md">{item.num}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Result Alert */}
      <AnimatePresence>
        {result && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-5 rounded-2xl border-2 text-center shadow-xl ${
              result.win ? "bg-accent-green/20 border-accent-green" : "bg-red-500/20 border-red-500"
            }`}
          >
            <h2 className={`text-2xl font-black uppercase tracking-widest ${result.win ? "text-accent-green" : "text-red-500"}`}>
              {result.win ? "You Won!" : "You Lost!"}
            </h2>
            {result.win && (
              <div className="text-white font-black text-xl mt-1 flex items-center justify-center gap-1">
                <span className="text-accent-green">+</span>
                <DLCurrency amount={result.profit} size="md" className="text-white" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Bet Amount</label>
              <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                    <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]" />
                  </span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isSpinning}
                    className="w-full bg-[#15181f] border-2 border-[#2a2d3a] rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-50"
                  />
              </div>
              {error && <div className="text-red-500 text-xs font-bold mt-2">{error}</div>}
            </div>

            <div className="w-full md:w-2/3 flex gap-3">
              <button
                onClick={() => handleBet('red')}
                disabled={isSpinning || !user}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black text-lg hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
              >
                BET RED (2x)
              </button>
              <button
                onClick={() => handleBet('green')}
                disabled={isSpinning || !user}
                className="flex-1 py-4 bg-accent-green text-black rounded-xl font-black text-lg hover:bg-[#00e676] transition-all shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:shadow-[0_0_30px_rgba(0,230,118,0.5)] disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
              >
                BET GREEN (14x)
              </button>
              <button
                onClick={() => handleBet('black')}
                disabled={isSpinning || !user}
                className="flex-1 py-4 bg-[#15181f] border border-[#3a3d4a] text-white rounded-xl font-black text-lg hover:bg-[#2a2d3a] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
              >
                BET BLACK (2x)
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

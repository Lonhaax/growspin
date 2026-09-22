"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Flame, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

export default function JackpotPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const [gameState, setGameState] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rolling, setRolling] = useState(false);
  const [finalWinner, setFinalWinner] = useState<any>(null);

  const controls = useAnimation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [strip, setStrip] = useState<any[]>([]);

  const fetchState = async () => {
    try {
      const res = await apiFetch("/play/jackpot/state");
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchState();
    const int = setInterval(fetchState, 5000);
    return () => clearInterval(int);
  }, []);

  const handleJoin = async () => {
    if (!user) return openAuthModal("login");
    setError("");
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    if (amountCents <= 0) return setError("Invalid bet amount.");
    
    setLoading(true);
    try {
      const res = await apiFetch("/play/jackpot/join", {
        method: "POST", body: JSON.stringify({ amount: amountCents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGameState(data);
      refreshUser();
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleRoll = async () => {
    if (!gameState || gameState.participants.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch("/play/jackpot/roll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Build strip
      const newStrip = [];
      const parts = data.gameState.participants;
      for (let i = 0; i < 60; i++) {
        if (i === 50) {
          const winnerPart = parts.find((p:any) => p.userId === data.winnerId);
          newStrip.push(winnerPart);
        } else {
          newStrip.push(parts[Math.floor(Math.random() * parts.length)]);
        }
      }
      setStrip(newStrip);
      setRolling(true);

      setTimeout(async () => {
        await controls.set({ x: 0 });
        const containerWidth = trackRef.current ? trackRef.current.clientWidth : 800;
        const itemWidth = 100;
        const targetIndex = 50;
        const itemCenter = (targetIndex * itemWidth) + (itemWidth / 2);
        const randomJitter = (Math.random() - 0.5) * 60;
        const targetX = (containerWidth / 2) - itemCenter + randomJitter;

        await controls.start({
          x: targetX,
          transition: { duration: 5, ease: [0.12, 0.8, 0.15, 1] }
        });

        setTimeout(() => {
          setFinalWinner(parts.find((p:any) => p.userId === data.winnerId));
          setRolling(false);
          refreshUser();
          setTimeout(() => {
            setFinalWinner(null);
            fetchState();
          }, 5000);
        }, 1000);

      }, 100);

    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const totalPot = gameState ? gameState.totalPot : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(249,115,22,0.4)]">
            <Flame size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Jackpot</h1>
            <p className="text-[#7a819c] font-medium mt-1">Winner takes all in this high-stakes pool.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFairOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-[#a0a5b8] hover:text-white transition-all bg-[#1f222b]/80 px-4 py-2.5 rounded-xl border border-[#2a2d3a] hover:border-accent-blue shadow-lg backdrop-blur-sm"
        >
          <ShieldCheck size={18} /> Provably Fair
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Controls & Pot */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#15181f] border border-[#2a2d3a] p-8 rounded-3xl text-center shadow-xl relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
             <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-2">Total Pot Value</div>
             <div className="text-orange-500 font-black text-5xl drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2">
                <DLCurrency amount={totalPot} size="xl" className="text-orange-500" />
             </div>
             <div className="text-[#4d5366] text-sm font-bold mt-2">
                {gameState?.participants.length || 0} Players joined
             </div>
          </div>

          <div className="bg-[#1f222b] border border-[#2a2d3a] p-6 rounded-3xl shadow-xl">
             <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Bet Amount</label>
             <div className="relative mb-4">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                   <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]" />
                 </span>
                 <input
                 type="number"
                 value={betAmount}
                 onChange={(e) => setBetAmount(e.target.value)}
                 disabled={loading || rolling}
                 className="w-full bg-[#15181f] border-2 border-[#2a2d3a] rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                 />
             </div>
             {error && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg text-center mb-4">{error}</div>}
             <button
                 onClick={handleJoin}
                 disabled={loading || rolling || !user}
                 className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-lg hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] disabled:opacity-50"
             >
                 JOIN JACKPOT
             </button>
          </div>
          
          <button
              onClick={handleRoll}
              disabled={loading || rolling || !gameState || gameState.participants.length === 0}
              className="w-full py-4 bg-[#15181f] border border-[#2a2d3a] text-white rounded-xl font-black text-lg hover:bg-[#2a2d3a] transition-all disabled:opacity-50 shadow-lg"
          >
              ADMIN: FORCE ROLL
          </button>
        </div>

        {/* RIGHT: Spinner & Participants */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Spinner Area */}
            <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl relative min-h-[250px] flex items-center justify-center overflow-hidden">
                {rolling ? (
                    <div className="relative w-full h-32 bg-[#0d0f14] rounded-2xl overflow-hidden border border-[#2a2d3a]">
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-yellow-400 z-20 shadow-[0_0_15px_rgba(250,204,21,1)]" />
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0d0f14] to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0d0f14] to-transparent z-10" />
                        
                        <div ref={trackRef} className="w-full h-full flex items-center relative">
                            <motion.div className="flex items-center h-full absolute left-0" animate={controls}>
                                {strip.map((p, i) => (
                                    <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center h-full border-r border-[#2a2d3a]" style={{ width: '100px' }}>
                                        <div className="w-12 h-12 rounded-xl bg-[#1f222b] text-white font-black flex items-center justify-center text-xl mb-2 shadow-inner">
                                            {p?.userId[0] || '?'}
                                        </div>
                                        <div className="text-[10px] text-white font-bold truncate px-1 w-full text-center">{p?.userId}</div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                ) : finalWinner ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-8 bg-accent-green/10 border-2 border-accent-green rounded-2xl shadow-[0_0_50px_rgba(0,230,118,0.2)]"
                    >
                        <h2 className="text-3xl font-black text-accent-green mb-2 uppercase tracking-widest">Winner!</h2>
                        <div className="text-white font-black text-2xl">{finalWinner.userId}</div>
                        <div className="text-accent-green font-bold text-xl mt-2 flex items-center justify-center gap-1">
                            <span>+</span>
                            <DLCurrency amount={totalPot} size="lg" className="text-accent-green" />
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center">
                        <Flame size={48} className="text-[#3a3d4a] mx-auto mb-4" />
                        <p className="text-[#7a819c] font-bold">Waiting to roll...</p>
                    </div>
                )}
            </div>

            {/* Participants List */}
            <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-6 flex-1 shadow-xl">
                <h3 className="text-white font-black mb-4">Players ({gameState?.participants.length || 0})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {gameState?.participants.map((p: any, i: number) => {
                        const winChance = (p.amount / totalPot) * 100;
                        return (
                            <div key={i} className="bg-[#15181f] p-4 rounded-2xl flex justify-between items-center border border-[#2a2d3a]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#2a2d3a] flex items-center justify-center font-black text-white">
                                        {p.userId[0]}
                                    </div>
                                    <span className="text-white font-bold">{p.userId}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-accent-green font-black">
                                      <DLCurrency amount={p.amount} size="sm" className="text-accent-green" />
                                    </div>
                                    <div className="text-[10px] text-[#7a819c] font-bold">{winChance.toFixed(2)}%</div>
                                </div>
                            </div>
                        )
                    })}
                    {(!gameState || gameState.participants.length === 0) && (
                        <div className="text-center py-10 text-[#4d5366] font-bold text-sm">
                            No players in the pool yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, CircleDot, Wrench, HandMetal, Clover } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";
import io from 'socket.io-client';

export default function RoulettePage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const [socket, setSocket] = useState<any>(null);
  
  const [gameState, setGameState] = useState<'waiting' | 'rolling' | 'rolled'>('waiting');
  const [timer, setTimer] = useState(15);
  const [history, setHistory] = useState<string[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState("");

  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelOffset, setWheelOffset] = useState(0);
  const currentTargetIndexRef = useRef(15); // Start slightly offset

  const TILE_WIDTH = 80;
  const generateStrip = () => {
    const strip = [];
    const pattern = [0, 1, 14, 2, 13, 3, 12, 4, 11, 5, 10, 6, 9, 7, 8];
    for (let i = 0; i < 1000; i++) {
      const num = pattern[i % 15];
      let color = 'bg-[#f44336]'; // Red
      if (num === 0) color = 'bg-[#00c74d]'; // Green
      else if (num >= 8) color = 'bg-[#1b1e26]'; // Dark grey/black
      strip.push({ num, color });
    }
    return strip;
  };
  const [strip] = useState(generateStrip());

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl, { path: '/socket.io' });
    setSocket(newSocket);

    apiFetch("/play/roulette/state")
      .then(res => res.json())
      .then(data => {
        if (data.state) {
          setGameState(data.state);
          setTimer(data.timer);
          setHistory(data.history);
          setPlayers(data.players);
        }
      })
      .catch(console.error);

    newSocket.on('roulette:state', (data) => {
      setGameState(data.state);
      setTimer(data.timer);
      setHistory(data.history);
      setPlayers(data.players);
      if (data.state === 'waiting') {
        refreshUser();
      }
    });

    newSocket.on('roulette:timer', (t) => {
      setTimer(t);
    });

    newSocket.on('roulette:start', (data) => {
      setGameState('rolling');
      const targetNum = data.target;
      
      let nextIndex = currentTargetIndexRef.current + 45 + Math.floor(Math.random() * 15);
      while (strip[nextIndex].num !== targetNum) {
        nextIndex++;
      }
      currentTargetIndexRef.current = nextIndex;

      const containerWidth = wheelRef.current ? wheelRef.current.clientWidth : 800;
      const centerOffset = (containerWidth / 2) - (TILE_WIDTH / 2);
      const randomJitter = Math.random() * 60 - 30;
      const finalTranslate = -(nextIndex * TILE_WIDTH) + centerOffset + randomJitter;

      setWheelOffset(finalTranslate);
    });

    newSocket.on('roulette:rolled', (data) => {
      setGameState('rolled');
      setHistory(data.history);
      refreshUser();
    });

    newSocket.on('roulette:players', (newPlayers) => {
      setPlayers(newPlayers);
    });

    return () => { newSocket.close(); };
  }, [strip]);

  const handleBet = async (color: 'red' | 'black' | 'green') => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setError("");
    const amountCents = Math.floor(parseFloat(betAmount) * 100);
    
    if (amountCents <= 0) return setError("Invalid bet amount.");
    if (user.mockBalance < amountCents) return setError("Insufficient balance.");

    try {
      const res = await apiFetch("/play/roulette/bet", {
        method: "POST",
        body: JSON.stringify({ amount: amountCents, betOn: color })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to place bet");
    }
  };

  const historyCounts = { red: 0, green: 0, black: 0 };
  history.forEach(h => {
    if (h === 'red') historyCounts.red++;
    else if (h === 'green') historyCounts.green++;
    else if (h === 'black') historyCounts.black++;
  });

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
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 relative shadow-2xl flex flex-col gap-6">
        {/* History Bar */}
        <div className="flex justify-between items-center px-2">
          <div className="flex gap-2">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${h === 'red' ? 'bg-[#f44336]' : h === 'green' ? 'bg-[#00c74d]' : 'bg-[#1b1e26] border border-[#2a2d3a]'}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-[#7a819c]">
            Last 100: 
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#f44336]" />{historyCounts.red}</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#00c74d]" />{historyCounts.green}</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#1b1e26] border border-[#2a2d3a]" />{historyCounts.black}</div>
          </div>
        </div>

        {/* Rolling Status */}
        <div className="text-center font-black text-xl text-white">
          {gameState === 'rolling' ? "Rolling..." : `Rolling in ${timer}s`}
        </div>

        {/* Wheel Wrapper */}
        <div className="w-full h-24 overflow-hidden relative rounded-xl bg-[#0f1118]">
          {/* Target Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white z-20 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          
          {/* Glows */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0f1118] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0f1118] to-transparent z-10" />

          <motion.div
            className="flex items-center h-full absolute left-0"
            animate={{ x: wheelOffset }}
            transition={{ duration: 5, ease: [0.12, 0.8, 0.15, 1] }}
          >
            {strip.map((item, idx) => (
              <div key={idx} className="w-[80px] h-20 flex-shrink-0 flex items-center justify-center p-1">
                <div className={`w-full h-full rounded-xl flex items-center justify-center shadow-md relative overflow-hidden ${item.color}`}>
                  {/* Image placeholders */}
                  {item.num === 0 && (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img src="/luck-plant.webp" alt="Green" className="absolute inset-0 w-full h-full object-contain p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                  {item.num > 0 && item.num < 8 && (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img src="/wrench.webp" alt="Red" className="absolute inset-0 w-full h-full object-contain p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                  {item.num >= 8 && (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img src="/fist.webp" alt="Black" className="absolute inset-0 w-full h-full object-contain p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

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
                    disabled={gameState !== 'waiting'}
                    className="w-full bg-[#15181f] border-2 border-[#2a2d3a] rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-50"
                  />
              </div>
              {error && <div className="text-red-500 text-xs font-bold mt-2">{error}</div>}
            </div>

            <div className="w-full md:w-2/3 flex gap-3">
              <button
                onClick={() => handleBet('red')}
                disabled={gameState !== 'waiting' || !user}
                className="flex-1 py-4 bg-[#f44336] text-white rounded-xl font-black text-lg hover:bg-[#e53935] transition-all shadow-[0_0_20px_rgba(244,67,54,0.2)] disabled:opacity-50 flex flex-col items-center gap-1"
              >
                <Wrench size={24} className="opacity-80" />
                <span>Win 2x</span>
              </button>
              <button
                onClick={() => handleBet('green')}
                disabled={gameState !== 'waiting' || !user}
                className="flex-1 py-4 bg-[#00c74d] text-black rounded-xl font-black text-lg hover:bg-[#00b345] transition-all shadow-[0_0_20px_rgba(0,199,77,0.2)] disabled:opacity-50 flex flex-col items-center gap-1"
              >
                <Clover size={24} className="opacity-80" />
                <span>Win 14x</span>
              </button>
              <button
                onClick={() => handleBet('black')}
                disabled={gameState !== 'waiting' || !user}
                className="flex-1 py-4 bg-[#1b1e26] border border-[#2a2d3a] text-white rounded-xl font-black text-lg hover:bg-[#2a2d3a] transition-all disabled:opacity-50 flex flex-col items-center gap-1"
              >
                <HandMetal size={24} className="opacity-80" />
                <span>Win 2x</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Coins, Flame, Skull, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LiveBet = {
  id: string; // generated locally for keying
  user: string;
  game: string;
  betAmount: number;
  multiplier: number;
  profit: number;
  timestamp: Date;
};

import { useAuth } from "@/context/AuthContext";
import { SoundManager } from "@/lib/audio";

export function LiveBetsFeed() {
  const { user: localUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"recent" | "highRollers" | "luckyWins">("recent");
  
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [highRollers, setHighRollers] = useState<LiveBet[]>([]);
  const [luckyWins, setLuckyWins] = useState<LiveBet[]>([]);
  
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Fetch initial bets
    fetch(`${backendUrl}/api/bets/live`)
      .then(res => res.json())
      .then(data => {
        if (data && data.recent) {
          const mapBets = (arr: any[]) => arr.map(bet => ({ ...bet, id: Math.random().toString(36).substring(7), timestamp: new Date() }));
          setBets(mapBets(data.recent));
          setHighRollers(mapBets(data.highRollers || []));
          setLuckyWins(mapBets(data.luckyWins || []));
        } else if (Array.isArray(data)) {
          // Fallback if backend wasn't updated yet
          const mapBets = (arr: any[]) => arr.map(bet => ({ ...bet, id: Math.random().toString(36).substring(7), timestamp: new Date() }));
          setBets(mapBets(data));
        }
      })
      .catch(console.error);

    socketRef.current = io(backendUrl, { withCredentials: true });

    socketRef.current.on('live_bet', (data: any) => {
      const newBet: LiveBet = {
        ...data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date()
      };
      
      // Play sound if the local user won something
      const payoutAmount = newBet.betAmount + newBet.profit;
      if (localUser && newBet.user === localUser.username && payoutAmount > 0) {
        SoundManager.playWinChime();
      }
      
      setBets(prev => {
        const next = [newBet, ...prev];
        return next.slice(0, 10);
      });

      setHighRollers(prev => {
        if (payoutAmount > 0) {
          const next = [...prev, { ...newBet, payoutAmount }];
          return next.sort((a: any, b: any) => (b.payoutAmount || 0) - (a.payoutAmount || 0)).slice(0, 10);
        }
        return prev;
      });

      setLuckyWins(prev => {
        if (newBet.multiplier >= 1) {
          const next = [...prev, newBet];
          return next.sort((a, b) => b.multiplier - a.multiplier).slice(0, 10);
        }
        return prev;
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const getGameIcon = (game: string) => {
    switch (game.toLowerCase()) {
      case 'crash': return <Flame size={16} className="text-orange-500" />;
      case 'mines': return <Skull size={16} className="text-red-500" />;
      case 'coinflip': return <Coins size={16} className="text-yellow-400" />;
      default: return <Trophy size={16} className="text-accent-blue" />;
    }
  };

  if (bets.length === 0) {
    return (
      <div className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl p-6 mt-8 flex flex-col items-center justify-center text-[#7a819c]">
        <div className="animate-pulse mb-2"><Trophy size={24} className="text-[#2a2d3a]" /></div>
        Waiting for live bets...
      </div>
    );
  }

  // Determine which list to show
  const activeBets = activeTab === "recent" ? bets : activeTab === "highRollers" ? highRollers : luckyWins;

  return (
    <div className="w-full mt-8 bg-[#15181f] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      <div className="bg-[#1f222b] border-b border-[#2a2d3a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">Live Bets</h3>
        </div>
        
        <div className="flex bg-[#15181f] p-1 rounded-lg border border-[#2a2d3a]">
          <button 
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-1 rounded text-xs font-bold transition-all ${activeTab === "recent" ? "bg-accent-blue/20 text-accent-blue" : "text-[#7a819c] hover:text-white"}`}
          >
            All Bets
          </button>
          <button 
            onClick={() => setActiveTab("highRollers")}
            className={`px-4 py-1 rounded text-xs font-bold transition-all ${activeTab === "highRollers" ? "bg-yellow-400/20 text-yellow-400" : "text-[#7a819c] hover:text-white"}`}
          >
            High Rollers
          </button>
          <button 
            onClick={() => setActiveTab("luckyWins")}
            className={`px-4 py-1 rounded text-xs font-bold transition-all ${activeTab === "luckyWins" ? "bg-green-400/20 text-green-400" : "text-[#7a819c] hover:text-white"}`}
          >
            Lucky Wins
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="text-xs text-[#7a819c] border-b border-[#2a2d3a]">
              <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] w-1/4">Game</th>
              <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] w-1/4">User</th>
              <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] w-1/6">Bet</th>
              <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] w-1/6">Multiplier</th>
              <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] w-1/6 text-right">Payout</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {activeBets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#7a819c] font-medium text-sm">
                    Waiting for bets...
                  </td>
                </tr>
              ) : activeBets.map((bet) => {
                const payoutAmount = bet.betAmount + bet.profit;
                const hasPayout = payoutAmount > 0;
                const isProfit = bet.profit > 0;
                
                return (
                  <motion.tr 
                    key={bet.id}
                    initial={{ opacity: 0, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border-b border-[#2a2d3a]/50 hover:bg-[#1a1d24] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {getGameIcon(bet.game)}
                        <span className="text-white">{bet.game}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-xs text-gray-300">{bet.user}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#a0a5b5] font-bold text-xs">
                        <img src="/dl.webp" className="w-3 h-3 object-contain" alt="DL" />
                        {(bet.betAmount / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-black text-xs ${isProfit ? 'text-green-400' : (hasPayout ? 'text-yellow-400' : 'text-[#7a819c]')}`}>
                        {bet.multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasPayout ? (
                        <div className={`flex items-center justify-end gap-1.5 font-black text-xs ${isProfit ? 'text-green-400' : 'text-yellow-400'}`}>
                          <img src="/dl.webp" className="w-3 h-3 object-contain opacity-80" alt="DL" />
                          {(payoutAmount / 100).toFixed(2)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 font-black text-xs text-[#7a819c]">
                          <img src="/dl.webp" className="w-3 h-3 object-contain opacity-50 grayscale" alt="DL" />
                          0.00
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

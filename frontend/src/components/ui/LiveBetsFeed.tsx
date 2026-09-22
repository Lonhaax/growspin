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

export function LiveBetsFeed() {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    socketRef.current = io(backendUrl, { withCredentials: true });

    socketRef.current.on('live_bet', (data: any) => {
      const newBet: LiveBet = {
        ...data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date()
      };
      
      setBets(prev => {
        const next = [newBet, ...prev];
        return next.slice(0, 20); // Keep last 20 bets
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

  return (
    <div className="w-full mt-8 bg-[#15181f] border border-[#2a2d3a] rounded-xl overflow-hidden">
      <div className="bg-[#1f222b] border-b border-[#2a2d3a] px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Live Bets</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="text-xs text-[#7a819c] border-b border-[#2a2d3a]">
              <th className="px-6 py-4 font-medium uppercase tracking-wider w-1/4">Game</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider w-1/4">User</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider w-1/6">Bet</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider w-1/6">Multiplier</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider w-1/6 text-right">Payout</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {bets.map((bet) => {
                const isWin = bet.profit > 0;
                const payoutAmount = bet.profit > 0 ? bet.betAmount + bet.profit : 0;
                
                return (
                  <motion.tr 
                    key={bet.id}
                    initial={{ opacity: 0, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border-b border-[#2a2d3a]/50 hover:bg-[#1a1d24] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium">
                        {getGameIcon(bet.game)}
                        <span className="text-white">{bet.game}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-300">{bet.user}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#a0a5b5] font-medium">
                        <img src="https://growtopiagame.com/assets/images/diamond_lock.png" className="w-4 h-4 object-contain" alt="DL" />
                        {(bet.betAmount / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isWin ? 'text-green-400' : 'text-[#7a819c]'}`}>
                        {bet.multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isWin ? (
                        <div className="flex items-center justify-end gap-1.5 text-green-400 font-bold">
                          +<img src="https://growtopiagame.com/assets/images/diamond_lock.png" className="w-4 h-4 object-contain opacity-80" alt="DL" />
                          {(payoutAmount / 100).toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-[#7a819c] font-medium">-</span>
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

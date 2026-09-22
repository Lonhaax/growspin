"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";

interface LeaderboardUser {
  id: number;
  username: string;
  level: number;
  xp: number;
  totalWagered: number;
  mockBalance: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Global Leaderboard</h1>
          <p className="text-[#7a819c]">The wealthiest and highest level players on the platform.</p>
        </div>
      </div>

      <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Glow effect at the top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#15181f]/50 border-b border-[#2a2d3a]">
                <th className="px-6 py-4 text-xs font-bold text-[#7a819c] uppercase tracking-wider w-16">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a819c] uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a819c] uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a819c] uppercase tracking-wider">Total Wagered</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a819c] uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#7a819c]">Loading leaderboard...</td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={u.id} 
                    className="border-b border-[#2a2d3a] hover:bg-[#2a2d3a]/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      {i === 0 ? (
                        <Medal size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      ) : i === 1 ? (
                        <Medal size={24} className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />
                      ) : i === 2 ? (
                        <Medal size={24} className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />
                      ) : (
                        <span className="text-[#7a819c] font-bold text-lg ml-2">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center p-[1px]">
                          <div className="w-full h-full bg-[#15181f] rounded-[7px] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{u.username.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <span className="text-white font-bold group-hover:text-accent-blue transition-colors">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" />
                        <span className="text-white font-bold">{u.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DLCurrency amount={u.totalWagered} size="sm" className="text-[#a0a5b8]" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1 bg-[#15181f] px-3 py-1 rounded-lg border border-[#2a2d3a]">
                        <DLCurrency amount={u.mockBalance} size="sm" className="text-white" />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

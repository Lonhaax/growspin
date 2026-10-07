"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { apiFetch } from "@/lib/auth";

interface LeaderboardUser {
  id: number;
  username: string;
  level: number;
  xp: number;
  totalWagered: number;
  mockBalance: number;
  netProfit: number;
  totalBets: number;
  wins: number;
  losses: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/leaderboard");
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

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      
      {/* Top 3 Podium section */}
      {!loading && top3.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-10">
          
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center flex-1 max-w-[220px]">
              <div className="w-20 h-20 rounded-2xl bg-slate-300 p-1 shadow-[0_0_20px_rgba(203,213,225,0.3)] z-10 relative">
                <div className="w-full h-full bg-[#1b202e] rounded-xl flex items-center justify-center">
                  <span className="text-white text-3xl font-black">{top3[1].username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-black text-xs font-black px-3 py-0.5 rounded-full border-2 border-[#151822]">
                  #2
                </div>
              </div>
              <div className="mt-6 text-center w-full">
                <div className="text-white font-bold text-lg">{top3[1].username}</div>
                <div className="text-[#878eab] text-xs font-bold flex items-center justify-center gap-1 mt-1">
                  Profit: <DLCurrency amount={top3[1].netProfit} size="xs" className={top3[1].netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div className="text-[#626983] text-[10px] font-bold flex items-center justify-center gap-1 mt-0.5">
                  Wagered: <DLCurrency amount={top3[1].totalWagered} size="xs" />
                </div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center flex-1 max-w-[260px] -translate-y-8">
              <div className="w-28 h-28 rounded-2xl bg-yellow-400 p-1 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-20 relative">
                <div className="absolute -top-6 -right-6 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
                  <Trophy size={48} />
                </div>
                <div className="w-full h-full bg-[#1b202e] rounded-xl flex items-center justify-center">
                  <span className="text-white text-5xl font-black">{top3[0].username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-sm font-black px-5 py-1 rounded-full border-2 border-[#151822]">
                  #1
                </div>
              </div>
              <div className="mt-8 text-center w-full">
                <div className="text-white font-black text-2xl">{top3[0].username}</div>
                <div className="text-[#878eab] text-sm font-bold flex items-center justify-center gap-1 mt-1">
                  Profit: <DLCurrency amount={top3[0].netProfit} size="sm" className={top3[0].netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div className="text-[#626983] text-xs font-bold flex items-center justify-center gap-1 mt-0.5">
                  Wagered: <DLCurrency amount={top3[0].totalWagered} size="xs" />
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center flex-1 max-w-[220px]">
              <div className="w-20 h-20 rounded-2xl bg-amber-700 p-1 shadow-[0_0_20px_rgba(180,83,9,0.3)] z-10 relative">
                <div className="w-full h-full bg-[#1b202e] rounded-xl flex items-center justify-center">
                  <span className="text-white text-3xl font-black">{top3[2].username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-black px-3 py-0.5 rounded-full border-2 border-[#151822]">
                  #3
                </div>
              </div>
              <div className="mt-6 text-center w-full">
                <div className="text-white font-bold text-lg">{top3[2].username}</div>
                <div className="text-[#878eab] text-xs font-bold flex items-center justify-center gap-1 mt-1">
                  Profit: <DLCurrency amount={top3[2].netProfit} size="xs" className={top3[2].netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div className="text-[#626983] text-[10px] font-bold flex items-center justify-center gap-1 mt-0.5">
                  Wagered: <DLCurrency amount={top3[2].totalWagered} size="xs" />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-[#626983] uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#626983] uppercase tracking-wider text-center">Profit</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#626983] uppercase tracking-wider text-center">Wagered</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#626983] uppercase tracking-wider text-right">Total Bets</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#7a819c]">Loading leaderboard...</td>
                </tr>
              ) : (
                rest.map((u, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={u.id} 
                    className="bg-[#1b202e] hover:bg-[#232838] transition-colors rounded-xl overflow-hidden shadow-sm"
                  >
                    <td className="px-6 py-4 first:rounded-l-xl border-l-4 border-transparent hover:border-[#2563eb]">
                      <div className="flex items-center gap-4">
                        <span className="text-[#626983] font-black w-6 text-center">{i + 4}</span>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center p-[1px]">
                          <div className="w-full h-full bg-[#15181f] rounded-[7px] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{u.username.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <span className="text-white font-bold">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DLCurrency amount={u.netProfit} size="sm" className={u.netProfit >= 0 ? "text-[#00e676]" : "text-red-400"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DLCurrency amount={u.totalWagered} size="sm" className="text-white" />
                    </td>
                    <td className="px-6 py-4 text-right last:rounded-r-xl">
                      <span className="text-white font-medium">{u.totalBets.toLocaleString()}</span>
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

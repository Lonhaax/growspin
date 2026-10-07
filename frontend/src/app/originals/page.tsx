"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const ORIGINAL_GAMES = [
  { id: "battles", name: "Case Battles", color: "#6366f1", image: "/battles.png", href: "/battles", isNew: false, isUpdated: false },
  { id: "cases", name: "Unbox Cases", color: "#a855f7", image: "/cases.png", href: "/cases", isNew: false, isUpdated: false },
  { id: "crash", name: "Crash", color: "#8b5cf6", image: "/crash.png", href: "/crash", isNew: false, isUpdated: true },
  { id: "mines", name: "Mines", color: "#ef4444", image: "/mines.png", href: "/mines", isNew: false, isUpdated: false },
  { id: "plinko", name: "Plinko", color: "#ec4899", image: "/plinko.png", href: "/plinko", isNew: false, isUpdated: false },
  { id: "dice", name: "Dice", color: "#3b82f6", image: "/dice.png", href: "/dice", isNew: false, isUpdated: false },
  { id: "roulette", name: "Roulette", color: "#f97316", image: "/roulette.png", href: "/roulette", isNew: false, isUpdated: false },
  { id: "coinflip", name: "Coinflip", color: "#eab308", image: "/coinflip.png", href: "/coinflip", isNew: false, isUpdated: false },
];

export default function OriginalsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = ORIGINAL_GAMES.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Box */}
      <div className="bg-[#1b202e] rounded-xl p-6 border border-[#2a2f3e]">
        <h1 className="text-2xl font-black text-white">GrowSpin Originals</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search for Game..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1b202e] border border-[#2a2f3e] rounded-xl py-3 pl-4 pr-10 text-white placeholder-[#626983] focus:outline-none focus:border-[#3a3f4e] transition-colors"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#626983]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="text-[13px] font-bold text-[#626983] mb-4">
        {filteredGames.length} games
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredGames.map((game, i) => (
          <Link href={game.href} key={game.id}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg border border-transparent hover:border-white/20 transition-all hover:-translate-y-1"
              style={{ background: `linear-gradient(180deg, ${game.color}dd 0%, ${game.color} 100%)` }}
            >
              {/* Badges */}
              {game.isUpdated && (
                <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-20">
                  Updated
                </div>
              )}
              {game.isNew && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-20">
                  New
                </div>
              )}

              {/* Game Icon / Graphic */}
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Title Area */}
              <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end pb-3 text-center px-2">
                <h3 className="text-white font-black text-sm uppercase tracking-wide leading-tight drop-shadow-md">
                  {game.name}
                </h3>
                <p className="text-[9px] text-white/70 font-bold tracking-widest uppercase mt-0.5">
                  GrowSpin Originals
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

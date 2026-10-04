"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function OriginalsPage() {
  const ORIGINALS_GAMES = [
    { name: "Unbox Cases", href: "/cases", image: "/cases.png", bg: "bg-gradient-to-b from-[#14b8a6] to-[#0f766e]" },
    { name: "Case Battles", href: "/battles", image: "/battles.png", bg: "bg-gradient-to-b from-[#f43f5e] to-[#be123c]" },
    { name: "Coinflip", href: "/coinflip", image: "/coinflip.png", bg: "bg-gradient-to-b from-[#f59e0b] to-[#b45309]" },
    { name: "Mines", href: "/mines", image: "/mines.png", bg: "bg-gradient-to-b from-[#ef4444] to-[#991b1b]" },
    { name: "Roulette", href: "/roulette", image: "/roulette.png", bg: "bg-gradient-to-b from-[#f87171] to-[#b91c1c]" },
    { name: "Crash", href: "/crash", image: "/crash.png", bg: "bg-gradient-to-b from-[#8b5cf6] to-[#5b21b6]" },
    { name: "Plinko", href: "/plinko", image: "/plinko.png", bg: "bg-gradient-to-b from-[#ec4899] to-[#9d174d]" },
    { name: "Dice", href: "/dice", image: "/dice.png", bg: "bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a]" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-green/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-accent-green/10 rounded-xl border border-accent-green/20">
              <Gamepad2 size={24} className="text-accent-green" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">GrowSpin Originals</h1>
          </div>
          
          <p className="text-[#8e95ad] leading-relaxed text-lg max-w-3xl">
            Dive into our suite of custom-built, provably fair casino games. Fast-paced, transparent, and designed for maximum multiplier potential.
          </p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {ORIGINALS_GAMES.map((game) => (
            <Link
              key={game.name}
              href={game.href}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-md block aspect-[3/4] ${game.bg}`}
            >
              <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />

              {/* Central Thumbnail */}
              <div className="absolute inset-x-0 top-0 bottom-[44px] flex items-center justify-center p-4">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                />
              </div>

              {/* Text Bottom */}
              <div className="absolute inset-x-0 bottom-0 pb-3 text-center flex flex-col items-center justify-end z-10">
                <h3 className="text-white font-black text-lg uppercase tracking-wide leading-none drop-shadow-md">{game.name}</h3>
                <span className="text-[9px] text-white/90 font-bold tracking-wider mt-1 drop-shadow-md">GrowSpin Originals</span>
              </div>
            </Link>
        ))}
      </div>
    </div>
  );
}

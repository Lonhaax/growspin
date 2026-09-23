"use client";

import Link from "next/link";
import {
  Gamepad2,
  Coins,
  Bomb,
  CircleDot,
  Dices,
  PackageOpen,
  AlignEndHorizontal,
  Swords,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function OriginalsPage() {
  const ORIGINALS_GAMES = [
    { name: "Unbox Cases", href: "/cases", icon: PackageOpen, color: "text-cyan-400", desc: "Spin curated cases for rare artifacts" },
    { name: "Case Battles", href: "/battles", icon: Swords, color: "text-red-400", desc: "Up to 4 players. Winner takes all loot" },
    { name: "Coinflip", href: "/coinflip", icon: Coins, color: "text-yellow-400", desc: "50/50 Double or Nothing" },
    { name: "Mines", href: "/mines", icon: Bomb, color: "text-red-400", desc: "Uncover gems, dodge mines" },
    { name: "Roulette", href: "/roulette", icon: CircleDot, color: "text-emerald-400", desc: "Classic 14x Red/Black/Green" },
    { name: "Crash", href: "/crash", icon: Activity, color: "text-blue-400", desc: "Cash out before the rocket crashes" },
    { name: "Plinko", href: "/plinko", icon: AlignEndHorizontal, color: "text-pink-400", desc: "Drop balls for massive multipliers" },
    { name: "Dice", href: "/dice", icon: Dices, color: "text-purple-400", desc: "Adjust your target and roll over" },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ORIGINALS_GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <Link
              key={game.name}
              href={game.href}
              className="group relative bg-[#12141c] border border-[#1f2433] hover:border-[#2e364c] rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:bg-[#161a24] shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-[#191d2a] border border-[#282f42] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner relative z-10">
                <Icon size={32} className={game.color} />
              </div>
              
              <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors relative z-10 flex items-center gap-2">
                {game.name}
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              
              <p className="text-xs text-[#69708a] font-medium mt-2 leading-relaxed relative z-10">
                {game.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

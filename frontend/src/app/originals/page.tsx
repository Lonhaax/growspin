"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function OriginalsPage() {
  const ORIGINALS_GAMES = [
    { name: "Unbox Cases", href: "/cases", image: "/cases.png", color: "#14b8a6" },
    { name: "Case Battles", href: "/battles", image: "/battles.png", color: "#f43f5e" },
    { name: "Coinflip", href: "/coinflip", image: "/coinflip.png", color: "#f59e0b" },
    { name: "Mines", href: "/mines", image: "/mines.png", color: "#ef4444" },
    { name: "Roulette", href: "/roulette", image: "/roulette.png", color: "#f87171" },
    { name: "Crash", href: "/crash", image: "/crash.png", color: "#8b5cf6" },
    // { name: "Plinko", href: "/plinko", image: "/plinko.png", color: "#ec4899" },
    { name: "Dice", href: "/dice", image: "/dice.png", color: "#3b82f6" },
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

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {ORIGINALS_GAMES.map((game) => (
            <Link
              key={game.name}
              href={game.href}
              className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-md block aspect-[3/4] bg-[#12141c] border-2"
              style={{ borderColor: game.color }}
            >
              <img 
                src={game.image} 
                alt={game.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
        ))}
      </div>
    </div>
  );
}

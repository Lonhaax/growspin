"use client";

import Link from "next/link";
import { LiveBetsFeed } from "@/components/ui/LiveBetsFeed";
import {
  Gamepad2,
  Coins,
  Bomb,
  CircleDot,
  Dices,
  AlignEndHorizontal,
  Flame,
  Activity,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  // Games merged into CASINO_ORIGINALS

  const CASINO_ORIGINALS = [
    { name: "Case Battles", href: "/battles", image: "/battles.png", color: "#f43f5e" },
    { name: "Cases", href: "/cases", image: "/cases.png", color: "#d946ef" },
    { name: "PvP Jackpot", href: "/jackpot", image: "/jackpot.png", color: "#f97316" },
    { name: "Coinflip", href: "/coinflip", image: "/coinflip.png", color: "#f59e0b" },
    { name: "Mines", href: "/mines", image: "/mines.png", color: "#ef4444" },
    { name: "Roulette", href: "/roulette", image: "/roulette.png", color: "#f87171" },
    { name: "Crash", href: "/crash", image: "/crash.png", color: "#8b5cf6" },
    { name: "Plinko", href: "/plinko", image: "/plinko.png", color: "#ec4899" },
    { name: "Dice", href: "/dice", image: "/dice.png", color: "#3b82f6" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Main Hero Banner */}
      <section className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-gradient-to-r from-[#0d121c] to-[#121927] min-h-[260px] flex items-center mb-6">
        {/* Mock background image */}
        <div className="absolute inset-0 opacity-40 bg-[url('/main-banner.png')] bg-cover bg-center pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 p-8 sm:p-12 max-w-2xl">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Welcome to</div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            GrowSpin
          </h1>
          <p className="text-[#878eab] font-medium text-sm sm:text-base mb-8 max-w-md">
            The Premier Growtopia Diamond Lock Casino
          </p>
          <Link href="/cases" className="inline-flex items-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg transition-colors shadow-lg">
            Get started <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>
      </section>

      {/* Sub Promo Banners */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {/* Rakeback */}
        <div className="relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-[#1a1e2b] group">
          <img 
            src="/rakeback.png" 
            alt="Rakeback" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/1a1e2b/10b981?text=Rakeback' }}
          />
        </div>

        {/* Affiliate */}
        <div className="relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-[#1a1e2b] group">
          <img 
            src="/affiliate.png" 
            alt="Affiliate" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/1a1e2b/10b981?text=Affiliate' }}
          />
        </div>

        {/* Free to Play */}
        <div className="relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-[#1a1e2b] group">
          <img 
            src="/free.png" 
            alt="Free to Play" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/1a1e2b/10b981?text=Free+to+Play' }}
          />
        </div>
      </section>

      {/* Unified Originals Grid */}

      {/* Casino Originals Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="text-accent-green" size={24} />
              Casino Originals
            </h2>
            <p className="text-xs text-[#717894] mt-0.5 font-medium">Instant, provably fair mini-games engineered for speed</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {CASINO_ORIGINALS.map((game) => (
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
      </section>
      {/* Live Bets Feed */}
      <LiveBetsFeed />
    </div>
  );
}

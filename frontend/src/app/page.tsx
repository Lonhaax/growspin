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
      <section className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-gradient-to-r from-[#0d121c] to-[#121927] min-h-[260px] flex items-center">
        {/* Mock background image */}
        <div className="absolute inset-0 opacity-40 bg-[url('/banner-bg.png')] bg-cover bg-center pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 p-8 sm:p-12 max-w-2xl">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Welcome to</div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            GrowSpin
          </h1>
          <p className="text-[#878eab] font-medium text-sm sm:text-base mb-8 max-w-md">
            Provably-fair Growtopia games — sign up and start playing.
          </p>
          <Link href="/cases" className="inline-flex items-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg transition-colors shadow-lg">
            Get started <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>
      </section>

      {/* Sub Promo Banners */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {/* Rakeback */}
        <div className="relative rounded-2xl overflow-hidden border border-[#232838] bg-gradient-to-br from-[#1b2233] to-[#0c0e14] p-6 min-h-[180px] group cursor-pointer hover:border-amber-500/50 transition-colors shadow-md">
          <div className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-right group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('/rakeback-bg.png')" }} />
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 drop-shadow-sm">Rakeback</div>
            <h3 className="text-xl font-black text-white mb-2.5 drop-shadow-md">0.25% back on every bet</h3>
            <p className="text-xs text-[#878eab] font-medium leading-relaxed mb-6 max-w-[220px]">
              Rakeback builds up on every single bet you place — win or lose. Claim it whenever you want.
            </p>
            <div className="text-amber-500 text-xs font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              Claim rakeback <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Affiliate */}
        <div className="relative rounded-2xl overflow-hidden border border-[#232838] bg-gradient-to-br from-[#12261f] to-[#0a0c10] p-6 min-h-[180px] group cursor-pointer hover:border-emerald-500/50 transition-colors shadow-md">
          <div className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-right group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('/affiliate-bg.png')" }} />
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5 drop-shadow-sm">Affiliate</div>
            <h3 className="text-xl font-black text-white mb-2.5 drop-shadow-md">Earn up to 1% of every bet</h3>
            <p className="text-xs text-[#878eab] font-medium leading-relaxed mb-6 max-w-[220px]">
              Invite your friends and earn a cut of everything they wager, for as long as they play.
            </p>
            <div className="text-emerald-500 text-xs font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              Start earning <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Free to Play */}
        <div className="relative rounded-2xl overflow-hidden border border-[#232838] bg-gradient-to-br from-[#201c38] to-[#0a0c10] p-6 min-h-[180px] group cursor-pointer hover:border-indigo-400/50 transition-colors shadow-md">
          <div className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-right group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('/free-bg.png')" }} />
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Free to Play</div>
            <h3 className="text-xl font-black text-white mb-2.5 drop-shadow-md">Free rewards in Discord</h3>
            <p className="text-xs text-[#878eab] font-medium leading-relaxed mb-6 max-w-[220px]">
              Daily reward cases, giveaways and drops — start playing without depositing a thing.
            </p>
            <div className="text-indigo-400 text-xs font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              Join Discord <ArrowRight size={14} />
            </div>
          </div>
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

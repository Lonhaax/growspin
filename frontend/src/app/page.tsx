"use client";

import Link from "next/link";
import { LiveBetsFeed } from "@/components/ui/LiveBetsFeed";
import {
  Gamepad2,
  Coins,
  Bomb,
  CircleDot,
  Dices,
  PackageOpen,
  AlignEndHorizontal,
  Swords,
  Flame,
  Activity,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const PVP_GAMES = [
    {
      name: "Case Battles",
      href: "/battles",
      desc: "Up to 4 players. Winner takes all loot.",
      icon: Swords,
      badge: "POPULAR",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
      gradient: "from-red-500/20 via-orange-500/10 to-transparent",
      accent: "text-red-400",
      border: "hover:border-red-500/40",
    },
    {
      name: "PvP Jackpot",
      href: "/jackpot",
      desc: "Pool DLs together. Highest tickets win the pot.",
      icon: Flame,
      badge: "LIVE POOL",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      gradient: "from-orange-500/20 via-amber-500/10 to-transparent",
      accent: "text-orange-400",
      border: "hover:border-orange-500/40",
    },
    {
      name: "Unbox Cases",
      href: "/cases",
      desc: "Spin curated cases for rare Growtopia artifacts.",
      icon: PackageOpen,
      badge: "HOT",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
      accent: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
  ];

  const CASINO_ORIGINALS = [
    { name: "Coinflip", href: "/coinflip", icon: Coins, color: "text-yellow-400", desc: "50/50 Double or Nothing" },
    { name: "Mines", href: "/mines", icon: Bomb, color: "text-red-400", desc: "Uncover gems, dodge mines" },
    { name: "Roulette", href: "/roulette", icon: CircleDot, color: "text-emerald-400", desc: "Classic 14x Red/Black/Green" },
    { name: "Crash", href: "/crash", icon: Activity, color: "text-blue-400", desc: "Cash out before the rocket crashes" },
    { name: "Plinko", href: "/plinko", icon: AlignEndHorizontal, color: "text-pink-400", desc: "Drop balls for massive multipliers" },
    { name: "Dice", href: "/dice", icon: Dices, color: "text-purple-400", desc: "Adjust your target and roll over" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#131620] to-[#0c0e14] border border-[#222738] p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-accent-green/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-bold text-xs">
              <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" />
              <span>Provably Fair Diamond Lock Casino</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Unbox. Battle. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-accent-green">
                Multiply Your DLs.
              </span>
            </h1>

            <p className="text-[#878eab] text-base md:text-lg max-w-xl font-medium leading-relaxed">
              Experience transparent, instant-action gaming. Compete in PvP Case Battles, unbox genuine Growtopia grails, or climb the VIP ladder for daily free rewards.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/cases"
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
              >
                <span>Open Cases</span>
                <PackageOpen size={18} />
              </Link>
              <Link
                href="/battles"
                className="px-6 py-3.5 bg-[#171a25] hover:bg-[#1f2332] text-white border border-[#2a2f42] font-black rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <span>Create Battle</span>
                <Swords size={18} />
              </Link>

            </div>
          </div>

          {/* Quick Stat Card */}
          <div className="w-full lg:w-80 bg-[#151824]/90 backdrop-blur-md border border-[#262c3f] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202535]">
              <span className="text-xs font-bold text-[#878eab] uppercase tracking-wider">Casino Live Status</span>
              <span className="flex items-center gap-1.5 text-xs font-black text-accent-green">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
                ONLINE
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1017] border border-[#1d2230]">
                <span className="text-xs font-semibold text-[#878eab]">House Fairness</span>
                <span className="text-xs font-black text-white flex items-center gap-1">
                  <ShieldCheck size={14} className="text-cyan-400" /> 100% Verifiable
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1017] border border-[#1d2230]">
                <span className="text-xs font-semibold text-[#878eab]">Daily VIP Drop</span>
                <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                  <Crown size={14} /> Tiered Rewards
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1017] border border-[#1d2230]">
                <span className="text-xs font-semibold text-[#878eab]">Native Currency</span>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" /> Diamond Lock
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured: PVP & Unboxing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Zap className="text-cyan-400" size={24} />
              Featured PvP & Unboxing
            </h2>
            <p className="text-xs text-[#717894] mt-0.5 font-medium">High stakes multiplayer modes and custom case drops</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PVP_GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.name}
                href={game.href}
                className={`group relative bg-[#131620] border border-[#222738] ${game.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden flex flex-col justify-between min-h-[200px]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#191d2a] border border-[#2b3145] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={24} className={game.accent} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                </div>

                <div className="relative z-10 mt-6 space-y-1">
                  <div className="text-lg font-black text-white flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                    <span>{game.name}</span>
                    <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <p className="text-xs text-[#7f86a2] font-medium leading-relaxed">{game.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CASINO_ORIGINALS.map((game) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.name}
                href={game.href}
                className="group relative bg-[#12141c] border border-[#1f2433] hover:border-[#2e364c] rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:bg-[#161a24] shadow-md"
              >
                <div className="w-14 h-14 rounded-xl bg-[#191d2a] border border-[#282f42] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Icon size={26} className={game.color} />
                </div>
                <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">{game.name}</h3>
                <p className="text-[10px] text-[#69708a] font-medium mt-1 leading-tight line-clamp-2">{game.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>
      {/* Live Bets Feed */}
      <LiveBetsFeed />
    </div>
  );
}

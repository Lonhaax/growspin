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
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#131620] to-[#0c0e14] border border-[#222738] p-6 md:p-8 shadow-2xl">
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
          <div className="w-full lg:w-80 bg-[#151824]/90 backdrop-blur-md border border-[#262c3f] rounded-2xl p-5 shadow-xl space-y-4">
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

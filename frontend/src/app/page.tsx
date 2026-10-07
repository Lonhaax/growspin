"use client";

import Link from "next/link";
import { LiveBetsFeed } from "@/components/ui/LiveBetsFeed";
import {
  Gamepad2,
  Coins,
  Activity,
  Sparkles,
  ArrowRight,
  Zap,
  Flame,
  ShieldCheck,
  TrendingUp,
  Users,
  Trophy,
  Star,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";

export default function Home() {
  const [stats, setStats] = useState({ totalUsers: 0, wagered: 0, pot: 0 });

  useEffect(() => {
    apiFetch("/stats")
      .then(res => res.json())
      .then(data => {
        if (data && data.totalUsers !== undefined) {
          setStats({
            totalUsers: data.totalUsers,
            wagered: data.totalWagered / 100, // convert cents to DLs
            pot: data.casinoPot / 100
          });
        }
      })
      .catch(console.error);
  }, []);

  const CASINO_ORIGINALS = [
    { name: "Case Battles", href: "/battles", image: "/battles.png", color: "#6366f1" },
    { name: "Unbox Cases", href: "/cases", image: "/cases.png", color: "#a855f7" },
    { name: "Crash", href: "/crash", image: "/crash.png", color: "#8b5cf6" },
    { name: "Mines", href: "/mines", image: "/mines.png", color: "#ef4444" },
    { name: "Plinko", href: "/plinko", image: "/plinko.png", color: "#ec4899" },
    { name: "Dice", href: "/dice", image: "/dice.png", color: "#3b82f6" },
    { name: "Roulette", href: "/roulette", image: "/roulette.png", color: "#f97316" },
    { name: "Coinflip", href: "/coinflip", image: "/coinflip.png", color: "#eab308" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-0">
      
      {/* Top Main Hero Banner */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-accent-purple/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-[#0d121c] min-h-[440px] flex items-center mt-4">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-[#0d121c] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 opacity-30 bg-[url('/main-banner.png')] bg-cover bg-center pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d121c] via-[#0d121c]/80 to-transparent sm:w-2/3 pointer-events-none" />
        
        <div className="relative z-10 p-8 sm:p-16 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} /> The #1 Growtopia Casino
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-6 drop-shadow-lg leading-[1.1]">
              Play. Win. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-blue">Dominate.</span>
            </h1>
            
            <p className="text-[#878eab] font-medium text-lg mb-10 max-w-xl leading-relaxed">
              Experience provably fair originals, high-stakes case battles, and instant Diamond Lock deposits & withdrawals. The next generation of gambling is here.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/cases" className="inline-flex items-center gap-2 px-8 py-4 bg-accent-purple hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1">
                Start Playing <ArrowRight size={20} className="ml-1" />
              </Link>
              <Link href="/provably-fair" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1b1e26] hover:bg-[#252936] border border-[#2a2d3a] text-white font-bold rounded-xl transition-all hover:-translate-y-1">
                <ShieldCheck size={20} className="text-emerald-400" /> Provably Fair
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-[#2a2d3a] hover:bg-[#1a1d24] transition-colors">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={120} /></div>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
            <Activity size={28} />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black text-[#7a819c] uppercase tracking-widest mb-1">Total Players</div>
            <div className="text-3xl font-black text-white tracking-tight">{stats.totalUsers.toLocaleString()}</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-[#2a2d3a] hover:bg-[#1a1d24] transition-colors">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={120} /></div>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
            <Coins size={28} />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black text-[#7a819c] uppercase tracking-widest mb-1">Total Wagered</div>
            <div className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {stats.wagered.toLocaleString()}
              <img src="/dl.webp" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" alt="DL" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-[#2a2d3a] hover:bg-[#1a1d24] transition-colors">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><Trophy size={120} /></div>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
            <Trophy size={28} />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black text-[#7a819c] uppercase tracking-widest mb-1">Casino Pot</div>
            <div className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {stats.pot > 0 ? stats.pot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
              <img src="/dl.webp" className="w-6 h-6 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" alt="DL" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Featured Games */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Flame className="text-amber-500" size={24} /> Popular Right Now
            </h2>
            <p className="text-sm text-[#717894] mt-1 font-medium">The most played games on GrowSpin</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/battles" className="group relative rounded-2xl overflow-hidden bg-[#15181f] border border-[#2a2d3a] hover:border-[#f43f5e] transition-all duration-300 aspect-[16/10] flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)]">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-[#0d121c]/40 to-transparent z-10 opacity-80" />
             <img src="/battles.png" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-lighten" />
             <div className="relative z-20 flex flex-col items-center mt-auto pb-8">
               <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,1)] mb-3 group-hover:text-[#f43f5e] transition-colors">Case Battles</div>
               <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                 <Zap size={14} /> High Volatility
               </div>
             </div>
          </Link>
          
          <Link href="/cases" className="group relative rounded-2xl overflow-hidden bg-[#15181f] border border-[#2a2d3a] hover:border-[#d946ef] transition-all duration-300 aspect-[16/10] flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(217,70,239,0.3)]">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-[#0d121c]/40 to-transparent z-10 opacity-80" />
             <img src="/cases.png" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-lighten" />
             <div className="relative z-20 flex flex-col items-center mt-auto pb-8">
               <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,1)] mb-3 group-hover:text-[#d946ef] transition-colors">Unboxing</div>
               <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]/30 text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                 <Star size={14} /> Best Value
               </div>
             </div>
          </Link>

          <Link href="/coinflip" className="group relative rounded-2xl overflow-hidden bg-[#15181f] border border-[#2a2d3a] hover:border-[#f59e0b] transition-all duration-300 aspect-[16/10] flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)]">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-[#0d121c]/40 to-transparent z-10 opacity-80" />
             <img src="/coinflip.png" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-lighten" />
             <div className="relative z-20 flex flex-col items-center mt-auto pb-8">
               <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,1)] mb-3 group-hover:text-[#f59e0b] transition-colors">Coinflip</div>
               <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                 <Users size={14} /> PvP Action
               </div>
             </div>
          </Link>
        </div>
      </section>

      {/* Casino Originals */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="text-accent-blue" size={24} />
              Originals
            </h2>
            <p className="text-sm text-[#717894] mt-1 font-medium">Instant, provably fair mini-games engineered for speed</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3">
          {CASINO_ORIGINALS.map((game) => (
            <Link
              key={game.name}
              href={game.href}
              className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg border border-transparent hover:border-white/20 transition-all hover:-translate-y-1 block"
              style={{ background: `linear-gradient(180deg, ${game.color}dd 0%, ${game.color} 100%)` }}
            >
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
                <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-wide leading-tight drop-shadow-md">
                  {game.name}
                </h3>
                <p className="text-[8px] sm:text-[9px] text-white/70 font-bold tracking-widest uppercase mt-0.5">
                  GrowSpin Originals
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/rewards" className="relative rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex justify-center bg-[#15181f] border border-[#2a2d3a]">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <img 
            src="/rakeback.png" 
            alt="Rakeback" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block mix-blend-screen" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/15181f/10b981?text=Rakeback' }}
          />
        </Link>
        <Link href="/affiliates" className="relative rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex justify-center bg-[#15181f] border border-[#2a2d3a]">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <img 
            src="/affiliate.png" 
            alt="Affiliate" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block mix-blend-screen" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/15181f/3b82f6?text=Affiliate' }}
          />
        </Link>
        <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="relative rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex justify-center bg-[#15181f] border border-[#2a2d3a]">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <img 
            src="/free.png" 
            alt="Free to Play" 
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500 block mix-blend-screen" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x270/15181f/f59e0b?text=Free+to+Play' }}
          />
        </a>
      </section>

      {/* Live Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="text-cyan-400" size={24} /> Live Drops & Bets
          </h2>
        </div>
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
          <LiveBetsFeed />
        </div>
      </section>
      
    </div>
  );
}

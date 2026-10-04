"use client";

import { useEffect, useRef } from "react";
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

  const PROMO_BANNERS = [
    { id: 1, image: "/banner1.png", fallbackBg: "from-blue-600 to-purple-600", title: "Welcome Bonus", subtitle: "100% Match up to 100 DLs" },
    { id: 2, image: "/banner2.png", fallbackBg: "from-emerald-600 to-cyan-600", title: "Daily Race", subtitle: "Win your share of 50 DLs daily" },
    { id: 3, image: "/banner3.png", fallbackBg: "from-orange-500 to-red-600", title: "New Game Released", subtitle: "Try the new PvP Case Battles" }
  ];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If we've reached the end, scroll back to the start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Scroll by roughly the width of one banner
          scrollRef.current.scrollBy({ left: clientWidth * 0.33, behavior: "smooth" });
        }
      }
    }, 4000); // Scroll every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Promotional Banners Carousel */}
      <section className="relative w-full -mt-4">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1 scroll-smooth"
        >
          {PROMO_BANNERS.map((banner) => (
            <div 
              key={banner.id} 
              className={`min-w-[85%] md:min-w-[48%] lg:min-w-[32.5%] snap-start shrink-0 rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[2.5/1] relative bg-gradient-to-r ${banner.fallbackBg} cursor-pointer group shadow-lg`}
            >
              {/* Optional image overlay */}
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay group-hover:scale-105 transition-transform duration-500 opacity-50" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
              
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">{banner.title}</h3>
                <p className="text-sm sm:text-base text-white/90 font-bold mt-1 drop-shadow-md">{banner.subtitle}</p>
                <div className="mt-3 sm:mt-5">
                  <span className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white font-bold text-xs sm:text-sm transition-colors border border-white/20 inline-block">
                    Read More
                  </span>
                </div>
              </div>
            </div>
          ))}
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

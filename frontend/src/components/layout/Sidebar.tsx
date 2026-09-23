"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Gift,
  HelpCircle,
  LifeBuoy,
  Trophy,
  Coins,
  Activity,
  Dices,
  CircleDot,
  Bomb,
  ArrowDown,
  Package,
  ShieldCheck,
  Swords,
  Crown,
  Flame,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const NAV_GROUPS: NavGroup[] = [
    {
      label: "Platform",
      items: [
        { name: "Home", href: "/", icon: Home },
        { name: "VIP Lounge", href: "/vip", icon: Crown, badge: "FREE", badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
        { name: "My Inventory", href: "/inventory", icon: Package },
      ],
    },
    {
      label: "Case Battles & Unboxing",
      items: [
        { name: "Unbox Cases", href: "/cases", icon: Gift },
        { name: "Case Battles", href: "/battles", icon: Swords, badge: "HOT", badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30" },
        { name: "Jackpot", href: "/jackpot", icon: Flame, badge: "PVP", badgeColor: "bg-orange-500/20 text-orange-400 border border-orange-500/30" },
      ],
    },
    {
      label: "Casino Originals",
      items: [
        { name: "Slots", href: "/slots", icon: Sparkles, badge: "NEW", badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
        { name: "Coinflip", href: "/coinflip", icon: Coins },
        { name: "Mines", href: "/mines", icon: Bomb },
        { name: "Roulette", href: "/roulette", icon: CircleDot },
        { name: "Crash", href: "/crash", icon: Activity },
        { name: "Plinko", href: "/plinko", icon: ArrowDown },
        { name: "Dice", href: "/dice", icon: Dices },
      ],
    },
    {
      label: "Fairness & Community",
      items: [
        { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { name: "Provably Fair", href: "/provably-fair", icon: ShieldCheck },
        ...(user?.role === "admin"
          ? [{ name: "Admin Dashboard", href: "/admin", icon: ShieldCheck, badge: "STAFF", badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30" }]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#1f222b] bg-[#0d0f14] h-full flex flex-col pt-5 overflow-y-auto hidden md:flex z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Brand Header */}
      <div className="px-5 mb-6">
        <Link href="/" className="block group">
          <div className="w-full flex justify-center py-2 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110">
            <img src="/logo.png" alt="GrowSpin" className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
          </div>
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#4d5366]">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 group relative ${
                        isActive
                          ? "text-white bg-[#191d26] border border-[#2a2f3e] shadow-sm"
                          : "text-[#878eab] hover:text-white hover:bg-[#13161f]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                          />
                        )}
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                              : "text-[#626983] group-hover:text-cyan-400"
                          }`}
                        />
                        <span className="font-semibold text-xs truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${item.badgeColor || "bg-cyan-500/20 text-cyan-400"}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Support/Fairness */}
      <div className="p-3 mt-4 border-t border-[#1a1d26]">
        <div className="bg-[#12151e] border border-[#1f2433] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[11px] font-bold text-[#878eab]">All Systems Normal</span>
          </div>
          <Link
            href="/provably-fair"
            className="text-[10px] font-black text-cyan-400 hover:underline uppercase"
          >
            Fairness
          </Link>
        </div>
      </div>
    </aside>
  );
}

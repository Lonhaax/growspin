"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Gift,
  Gamepad2,
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
      label: "Games",
      items: [
        { name: "Originals", href: "/originals", icon: Gamepad2 },
        { name: "Slots", href: "/slots", icon: Sparkles },
        { name: "Live Games", href: "#", icon: CircleDot },
      ],
    },
    {
      label: "Rewards",
      items: [
        { name: "Rewards", href: "#", icon: Gift },
        { name: "Daily Race", href: "#", icon: Trophy },
        { name: "Challenges", href: "#", icon: ShieldCheck },
        { name: "Promo Codes", href: "#", icon: Package },
      ],
    },
    {
      label: "More",
      items: [
        { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { name: "Affiliates", href: "#", icon: Flame },
        { name: "Resellers", href: "#", icon: Package },
        { name: "Blog", href: "#", icon: Home },
        { name: "Live Support", href: "#", icon: LifeBuoy },
        ...(user?.role === "admin"
          ? [{ name: "Admin Dashboard", href: "/admin", icon: ShieldCheck, badge: "STAFF", badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30" }]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#1f222b] bg-[#11141e] h-full flex flex-col pt-4 overflow-y-auto hidden md:flex z-10 relative">
      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#1b202e] border border-[#2a2f3e] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-[#626983] focus:outline-none focus:border-[#3a3f4e] transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#626983]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-[#626983] capitalize">
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
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                        isActive
                          ? "text-white bg-[#1b202e] font-bold"
                          : "text-[#878eab] hover:text-white hover:bg-[#1b202e]/50 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#2563eb] rounded-r-full"
                          />
                        )}
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-[#626983] group-hover:text-white"
                          }`}
                        />
                        <span className="text-[13px] truncate">{item.name}</span>
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
      <div className="p-4 mt-4">
        <button className="flex items-center justify-between w-full px-3 py-2 text-[#878eab] hover:text-white transition-colors rounded-lg hover:bg-[#1b202e]/50">
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg" alt="English" className="w-4 h-auto rounded-[2px]" />
            <span className="text-[13px] font-bold">English</span>
          </div>
          <ArrowDown size={14} className="text-[#626983]" />
        </button>
      </div>
    </aside>
  );
}

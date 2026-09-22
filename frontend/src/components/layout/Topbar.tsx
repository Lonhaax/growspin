"use client";

import { useAuth } from "@/context/AuthContext";
import { Wallet, Bell, MessageSquare, ChevronDown, LogOut, Star, Gift, Crown, HandCoins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";
import { DLCurrency } from "@/components/ui/DLCurrency";
import DepositModal from "@/components/deposit/DepositModal";

export function Topbar() {
  const { user, logout, refreshUser, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaimRakeback = async () => {
    if (claiming || !user || user.rakebackBalance <= 0) return;
    setClaiming(true);
    try {
      const res = await apiFetch("/user/claim-rakeback", { method: "POST" });
      if (res.ok) {
        await refreshUser();
      }
    } finally {
      setClaiming(false);
      setDropdownOpen(false);
    }
  };

  // Calculate XP progress (Step: 1000 XP base scaling, max level 100)
  const isMaxLevel = user && user.level >= 100;
  const currentLevelXp = user ? Math.pow(user.level - 1, 2) * 1000 : 0;
  const nextLevelXp = user ? Math.pow(user.level, 2) * 1000 : 1000;
  const progressPercent = isMaxLevel ? 100 : (user ? Math.min(100, Math.max(0, ((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)) : 0);

  return (
    <header className="h-16 border-b border-[#1f2433] bg-[#0c0e14]/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <img src="/dl.webp" alt="DL" className="w-6 h-6 object-contain" />
          <span className="font-black text-white text-base">GrowBet</span>
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/slots"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
          >
            🎰 Slots
          </Link>
          <Link
            href="/cases"
            className="text-xs font-bold text-[#878eab] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#161a24] transition-colors"
          >
            Cases
          </Link>
          <Link
            href="/battles"
            className="text-xs font-bold text-[#878eab] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#161a24] transition-colors"
          >
            Battles
          </Link>
          <Link
            href="/vip"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <Crown size={13} />
            <span>VIP Free Cases</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Level & XP Progress */}
            <Link href="/vip" className="hidden md:flex items-center gap-3 bg-[#1f222b] hover:border-amber-500/50 transition-colors rounded-xl px-3 py-1.5 border border-[#2a2d3a] cursor-pointer" title="View VIP Progression & Daily Cases">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.3)] text-black font-bold text-sm">
                {user.level}
              </div>
              <div className="flex flex-col w-24">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-[#7a819c] font-bold uppercase">Level {user.level}</span>
                  <span className="text-[10px] text-accent-green font-bold">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#15181f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-green to-emerald-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>

            {/* Active Case Loan Badge */}
            {user.debt !== undefined && user.debt > 0 && (
              <Link 
                href="/loan"
                title={user.isFrozen ? "Account frozen! Click to repay loan." : "Active case loans. Click to manage."}
                className={`hidden md:flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 transition-colors text-xs ${
                  user.isFrozen 
                    ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 animate-pulse" 
                    : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30"
                }`}
              >
                <HandCoins size={14} className={user.isFrozen ? "text-red-400" : "text-amber-400"} />
                <span className={`font-bold ${user.isFrozen ? "text-red-300" : "text-[#8e95ad]"}`}>
                  {user.isFrozen ? "FROZEN:" : "Loan:"}
                </span>
                <DLCurrency amount={user.debt} size="xs" className={user.isFrozen ? "text-red-400 font-black" : "text-amber-300 font-black"} />
              </Link>
            )}

            {/* Wallet Button */}
            <div className="flex items-center bg-[#15181f] border border-[#2a2d3a] rounded-xl p-1">
              <div className="px-3 py-1.5 flex items-center gap-2">
                <DLCurrency amount={user.mockBalance} size="sm" className="text-white" />
              </div>
              <button 
                onClick={() => setDepositOpen(true)}
                className="bg-accent-green hover:bg-emerald-400 text-black p-2 rounded-lg transition-colors flex items-center justify-center shadow-[0_0_10px_rgba(0,230,118,0.4)]"
              >
                <Wallet size={16} />
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue p-[2px]">
                  <div className="w-full h-full bg-[#15181f] rounded-[10px] flex items-center justify-center overflow-hidden">
                    <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-[#7a819c]" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-14 w-56 bg-[#1f222b] border border-[#2a2d3a] rounded-xl shadow-2xl overflow-hidden py-1 flex flex-col"
                  >
                    <div className="px-4 py-3 border-b border-[#2a2d3a]">
                      <p className="text-sm text-white font-medium truncate">{user.username}</p>
                      <p className="text-xs text-[#7a819c] truncate">Level {user.level}</p>
                    </div>

                    <Link
                      href="/vip"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-[#2a2d3a] transition-colors border-b border-[#2a2d3a]"
                    >
                      <Crown size={14} /> VIP Club & Daily Cases
                    </Link>

                    <div className="p-3 border-b border-[#2a2d3a] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#7a819c] flex items-center gap-1"><Gift size={12} /> Rakeback</span>
                        <DLCurrency amount={user.rakebackBalance} size="xs" className="text-accent-green" />
                      </div>
                      <button
                        onClick={handleClaimRakeback}
                        disabled={claiming || user.rakebackBalance <= 0}
                        className="w-full py-2 bg-accent-purple hover:bg-accent-purple/90 disabled:bg-[#2a2d3a] disabled:text-[#7a819c] text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {claiming ? "Claiming..." : "Claim Rakeback"}
                      </button>

                      <button
                        onClick={async () => {
                          setClaiming(true);
                          try {
                            const res = await apiFetch("/user/faucet", { method: "POST" });
                            if (res.ok) await refreshUser();
                            else alert((await res.json()).error);
                          } finally {
                            setClaiming(false);
                            setDropdownOpen(false);
                          }
                        }}
                        disabled={claiming}
                        className="w-full py-2 bg-accent-green hover:bg-accent-green/90 disabled:bg-[#2a2d3a] disabled:text-[#7a819c] text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(0,230,118,0.3)]"
                      >
                        Claim Daily Faucet
                      </button>
                    </div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-[#2a2d3a] transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DepositModal isOpen={depositOpen} onClose={() => { setDepositOpen(false); refreshUser(); }} />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuthModal("login")}
              className="px-6 py-2.5 text-sm font-bold text-white hover:text-accent-green transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="px-6 py-2.5 bg-accent-green text-black rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(0,230,118,0.4)] hover:bg-[#00c566] transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

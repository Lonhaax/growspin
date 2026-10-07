"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { Wallet, Bell, MessageSquare, ChevronDown, ChevronRight, LogOut, Star, Gift, Crown, HandCoins, Volume2, VolumeX, User, List, History, Package, Settings, LifeBuoy, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";
import { DLCurrency } from "@/components/ui/DLCurrency";
import DepositModal from "@/components/deposit/DepositModal";
import RewardsModal from "@/components/rewards/RewardsModal";
import { SoundManager } from "@/lib/audio";
import { useCustomModal, CustomModal } from "@/components/ui/CustomModal";
import ProfileModal from "@/components/profile/ProfileModal";

export function Topbar() {
  const { user, logout, refreshUser, openAuthModal } = useAuth();
  const { balance } = useWallet();
  const { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm } = useCustomModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
    <>
      <header className="h-14 border-b border-[#1f2433] bg-[#0c0e14]/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <img src="/logo.png" alt="GrowSpin" className="h-8 w-auto object-contain" />
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/slots"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
          >
            🎰 Slots
          </Link>
          <Link
            href="/originals"
            className="text-xs font-bold text-[#878eab] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#161a24] transition-colors"
          >
            Originals
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>


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

            {/* Rewards Button */}
            <button
              onClick={() => {
                const muted = SoundManager.toggleMute();
                setIsMuted(muted);
              }}
              className="hidden sm:flex items-center gap-1.5 text-[#7a819c] hover:text-white bg-[#15181f] border border-[#2a2d3a] hover:border-[#3a3f58] rounded-lg px-2 h-9 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={() => setRewardsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg px-3 h-9 transition-colors text-sm font-bold"
            >
              <Gift size={14} />
              Rewards
            </button>

            {/* Wallet Group */}
            <div className="flex items-center bg-[#15181f] border border-[#2a2d3a] rounded-lg p-1 h-9">
              <div className="px-3 flex items-center gap-2 border-r border-[#2a2d3a]">
                <DLCurrency amount={balance * 100} size="sm" className="text-white" />
              </div>
              <button 
                onClick={() => setDepositOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 px-3 h-full rounded-md transition-colors flex items-center justify-center gap-1.5 font-bold text-sm"
              >
                <Wallet size={14} />
                Deposit
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue p-[2px]">
                    <div className="w-full h-full bg-[#15181f] rounded-[10px] flex items-center justify-center overflow-hidden">
                      <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md flex items-center justify-center text-[9px] font-black text-black shadow-lg border border-[#15181f]">
                    {user.level}
                  </div>
                </div>
                <ChevronDown size={14} className="text-[#7a819c] hidden sm:block" />
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
                    <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center justify-between hover:bg-[#2a2d3a] cursor-pointer transition-colors" onClick={() => { setDropdownOpen(false); setProfileOpen(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue p-[2px]">
                          <div className="w-full h-full bg-[#1b1e26] rounded-[10px] flex items-center justify-center overflow-hidden">
                            <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-white font-black truncate">{user.username}</p>
                          <p className="text-[10px] text-accent-blue font-bold flex items-center gap-1 mt-0.5">
                            <Crown size={10} /> Diamond 3
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#7a819c]" />
                    </div>

                    {/* XP Bar */}
                    <div className="px-4 py-2 border-b border-[#2a2d3a]">
                      <div className="h-1.5 w-full bg-[#15181f] rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-accent-blue w-[35%]" />
                      </div>
                      <div className="text-[9px] text-[#7a819c] font-bold text-right">
                        1,037,064 / 4,725,250 XP
                      </div>
                    </div>

                    <div className="py-1">
                      <div className="px-4 py-1.5 text-[10px] text-[#7a819c] font-bold uppercase tracking-widest">Activity</div>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <List size={16} /> My Bets
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Wallet size={16} /> Wallet
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <History size={16} /> History
                      </button>
                      <Link href="/inventory" onClick={() => setDropdownOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Package size={16} /> Inventory
                      </Link>
                    </div>

                    <div className="py-1 border-t border-[#2a2d3a]">
                      <div className="px-4 py-1.5 text-[10px] text-[#7a819c] font-bold uppercase tracking-widest">Rewards</div>
                      <button onClick={() => { setDropdownOpen(false); setRewardsOpen(true); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Gift size={16} /> Rewards
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Ticket size={16} /> Promo Codes
                      </button>
                    </div>

                    <div className="py-1 border-t border-[#2a2d3a]">
                      <div className="px-4 py-1.5 text-[10px] text-[#7a819c] font-bold uppercase tracking-widest">Account</div>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Bell size={16} /> Notifications
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Settings size={16} /> Settings
                      </button>
                    </div>

                    <div className="py-1 border-t border-[#2a2d3a]">
                      <div className="px-4 py-1.5 text-[10px] text-[#7a819c] font-bold uppercase tracking-widest">Support</div>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <LifeBuoy size={16} /> Live Support
                      </button>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
    {user && (
      <>
        <DepositModal isOpen={depositOpen} onClose={() => { setDepositOpen(false); refreshUser(); }} />
        <RewardsModal isOpen={rewardsOpen} onClose={() => { setRewardsOpen(false); refreshUser(); }} />
        <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </>
    )}
    <CustomModal config={modalConfig} setConfig={setModalConfig} />
    </>
  );
}

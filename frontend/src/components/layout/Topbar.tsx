"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { Wallet, Bell, MessageSquare, ChevronDown, ChevronRight, LogOut, Star, Gift, Crown, HandCoins, Volume2, VolumeX, User, List, History, Package, Settings, LifeBuoy, Ticket, Menu } from "lucide-react";
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
import { InventoryModal } from "@/components/inventory/InventoryModal";

export function Topbar() {
  const { user, logout, refreshUser, openAuthModal } = useAuth();
  const { balance } = useWallet();
  const { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm } = useCustomModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
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
      <header className="h-14 bg-[#0f1118] flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button className="text-[#626983] hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex bg-[#1b202e] rounded-lg p-1">
            <button className="bg-[#2563eb] text-white text-xs font-bold px-4 py-1.5 rounded-md shadow-sm">
              Casino
            </button>
            <button className="text-[#878eab] hover:text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors">
              Sports
            </button>
          </div>

          <Link href="/" className="flex items-center gap-2 ml-2">
            <img src="/logo.png" alt="GrowSpin" className="h-7 w-auto object-contain" />
          </Link>
        </div>

      {/* Center empty space to keep flex space-between happy, or we can just rely on justify-between */}
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Wallet Group */}
            <div className="flex items-center bg-[#1b202e] rounded-lg p-[2px]">
              <div className="px-3 flex items-center gap-2">
                <DLCurrency amount={balance * 100} size="sm" className="text-white" />
                <ChevronDown size={14} className="text-[#626983]" />
              </div>
              <button 
                onClick={() => setDepositOpen(true)}
                className="bg-[#2563eb] hover:bg-blue-500 text-white p-1.5 rounded-md transition-colors flex items-center justify-center"
              >
                <Wallet size={16} />
              </button>
            </div>

            {/* Gift Icon */}
            <button className="text-[#626983] hover:text-white transition-colors hidden sm:block">
              <Gift size={18} />
            </button>

            {/* Notification Bell */}
            <button className="text-[#626983] hover:text-white transition-colors hidden sm:block">
              <Bell size={18} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full bg-[#1b202e] border border-[#2a2f3e] flex items-center justify-center text-[#626983] hover:text-white hover:border-[#3a3f4e] transition-all"
              >
                <User size={16} />
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
                      <button onClick={() => { setDropdownOpen(false); setInventoryOpen(true); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#878eab] hover:text-white hover:bg-[#2a2d3a] transition-colors text-left font-bold">
                        <Package size={16} /> Inventory
                      </button>
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
        <InventoryModal isOpen={inventoryOpen} onClose={() => setInventoryOpen(false)} />
      </>
    )}
    <CustomModal config={modalConfig} setConfig={setModalConfig} />
    </>
  );
}

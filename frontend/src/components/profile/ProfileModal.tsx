"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, AlertTriangle, ChevronLeft, ChevronRight, Dices, TrendingUp, TrendingDown, Coins, Scale, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DLCurrency } from "@/components/ui/DLCurrency";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'All' | 'Casino' | 'Sports'>('All');

  if (!isOpen || !user) return null;

  // Derive stats (some mocked based on available data)
  const totalWagered = user.totalWagered / 100; // Convert to float
  const totalBets = Math.floor(totalWagered * 2); // Dummy calculation
  const avgBet = totalBets > 0 ? (totalWagered / totalBets) : 0;
  const wins = Math.floor(totalBets * 0.45);
  const losses = totalBets - wins;
  const netProfit = (user.mockBalance / 100) - 1000; // Assuming 1000 starting balance
  const allTimeHigh = 1000 + (totalWagered * 0.1); // Dummy
  const allTimeLow = 1000 - (totalWagered * 0.05); // Dummy

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#15181f] border border-[#2a2d3a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#2a2d3a]">
            <button onClick={onClose} className="p-1 hover:bg-[#1f222b] rounded-lg transition-colors absolute right-4 top-4">
              <X size={20} className="text-[#7a819c]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {/* User Info Header */}
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue p-[3px] shadow-lg relative">
                <div className="w-full h-full bg-[#1b1e26] rounded-[13px] flex items-center justify-center overflow-hidden">
                  <span className="text-4xl font-black text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-blue to-blue-600 px-3 py-1 rounded-md text-[10px] font-black text-white shadow-lg whitespace-nowrap flex items-center gap-1 border border-[#15181f]">
                  <Trophy size={10} />
                  Level {user.level}
                </div>
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                  {user.username}
                </h2>
                <p className="text-xs text-[#7a819c] mt-1 font-medium">Member since Sep 15, 2026</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#1f222b] p-1 rounded-xl mb-6 border border-[#2a2d3a]">
              {['All', 'Casino', 'Sports'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                    activeTab === tab ? 'bg-[#2a2d3a] text-white shadow' : 'text-[#7a819c] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <Coins size={14} /> Total Bets
                </div>
                <div className="text-xl font-black text-white">{totalBets.toLocaleString()}</div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <CreditCard size={14} /> Avg. Bet Amount
                </div>
                <div className="text-xl font-black text-white flex items-center gap-1">
                  <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" />
                  {avgBet.toFixed(2)}
                </div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <Trophy size={14} /> Wins
                </div>
                <div className="text-xl font-black text-white">{wins.toLocaleString()}</div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <TrendingDown size={14} /> Losses
                </div>
                <div className="text-xl font-black text-white">{losses.toLocaleString()}</div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a] col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <Dices size={14} /> Total Wagered
                </div>
                <div className="text-2xl font-black text-white flex items-center gap-1.5">
                  <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain" />
                  {totalWagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a] col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <Scale size={14} /> Net Profit
                </div>
                <div className={`text-2xl font-black flex items-center gap-1.5 ${netProfit >= 0 ? 'text-accent-green' : 'text-red-500'}`}>
                  <img src="/dl.webp" alt="DL" className="w-5 h-5 object-contain opacity-80" />
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <TrendingUp size={14} /> All Time High
                </div>
                <div className="text-lg font-black text-accent-green flex items-center gap-1">
                  <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" />
                  {allTimeHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2a2d3a]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">
                  <TrendingDown size={14} /> All Time Low
                </div>
                <div className="text-lg font-black text-red-500 flex items-center gap-1">
                  <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain" />
                  {allTimeLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

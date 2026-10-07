"use client";

import React, { useState } from 'react';
import CryptoCrashGame from '@/components/games/CrashGame/CryptoCrashGame';
import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, TrendingUp } from "lucide-react";

export default function CrashPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);

  return (
    <div className="w-full max-w-[1200px] mx-auto py-8 space-y-6">
      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      {/* Title Block */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1f222b] border border-[#2a2d3a] flex items-center justify-center text-accent-blue shadow-lg">
            <TrendingUp size={24} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Crash</h1>
        </div>
        <button 
          onClick={() => setIsFairOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-[#7a819c] hover:text-white transition-colors bg-[#1f222b] px-3 py-2 rounded-lg border border-[#2a2d3a] hover:border-accent-blue"
        >
          <ShieldCheck size={16} /> Provably Fair
        </button>
      </div>

      <CryptoCrashGame />

      {/* Footer info (Provably fair, settings, game info) */}
      <div className="bg-[#15181f] border-t border-[#1b1e26] p-4 flex flex-col gap-4 rounded-3xl mt-8">
        <div className="flex items-center gap-4 text-sm font-bold text-[#878eab] px-2">
          <button onClick={() => setIsFairOpen(true)} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <ShieldCheck size={16} /> Provably Fair
          </button>
        </div>
        
        <div className="bg-[#0f1118] border border-[#1b1e26] rounded-xl p-6 flex flex-col md:flex-row gap-8">
          <div className="space-y-4 min-w-[250px]">
            <h2 className="text-xl font-black text-white">Crash</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#878eab] font-bold">RTP</span>
                <span className="text-white font-bold">99.00%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#878eab] font-bold">Max Bet</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">1,000.00</span>
                  <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#878eab] font-bold">Max Win</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">100,000.00</span>
                  <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-[#878eab] text-sm font-bold leading-relaxed max-w-2xl">
            <p>Cash out before the multiplier crashes!</p>
            <br/>
            <p>The multiplier starts at 1x and grows exponentially. You can cash out at any time, but if the game crashes before you do, you lose your bet. Will you play it safe or risk it all for a massive multiplier?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

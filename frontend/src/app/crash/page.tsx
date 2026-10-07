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
    </div>
  );
}

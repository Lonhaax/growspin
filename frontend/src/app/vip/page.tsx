"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiFetch } from "@/lib/auth";
import { Trophy, Gift, Star, ArrowRight, ShieldCheck, Activity, Package, Clock, Lock, PackageOpen } from "lucide-react";

type VIPStatus = {
  level: number;
  xp: number;
  totalWagered: number;
  rakebackBalance: number;
  currentTier: {
    id: string;
    name: string;
    threshold: number;
    rakeback: number;
    color: string;
    gradient: string;
  };
  nextTier: {
    id: string;
    name: string;
    threshold: number;
    rakeback: number;
    color: string;
    gradient: string;
  } | null;
  progress: number;
  cases: any[];
};

export default function VIPPage() {
  const { user } = useAuth();
  const { fetchBalance } = useWallet();
  const [status, setStatus] = useState<VIPStatus | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimingCaseId, setClaimingCaseId] = useState<string | null>(null);

  const handleClaimCase = async (tierId: string) => {
    setClaimingCaseId(tierId);
    try {
      const res = await apiFetch('/vip/claim-case', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId })
      });
      if (res.ok) {
        await fetchBalance();
        await fetchStatus();
      }
    } catch (e) {}
    setClaimingCaseId(null);
  };

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/vip/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  const handleClaim = async () => {
    if (!status || status.rakebackBalance <= 0 || isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await apiFetch('/vip/claim-rakeback', { method: 'POST' });
      if (res.ok) {
        await fetchBalance();
        await fetchStatus();
      }
    } catch (e) {}
    setIsClaiming(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Trophy size={64} className="text-[#2a2d3a] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">VIP Club</h2>
        <p className="text-[#7a819c] max-w-md">Log in to view your VIP status, track your progress, and claim your rakeback.</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">VIP Club</h1>
          <p className="text-[#7a819c]">Level up to unlock better rakeback and daily cases.</p>
        </div>
        <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${status.currentTier.gradient} shadow-lg flex items-center gap-3`}>
          <ShieldCheck size={28} className="text-white drop-shadow-md" />
          <div>
            <div className="text-white/80 text-xs font-bold uppercase tracking-widest">Current Tier</div>
            <div className="text-white font-black text-xl leading-none drop-shadow-md">{status.currentTier.name}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Progress Card */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-accent-blue" />
              Progression
            </h3>
            <div className="text-accent-blue font-black bg-blue-500/10 px-3 py-1 rounded-lg">
              Level {status.level}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#7a819c]">Total Wagered</span>
              <span className="text-white font-bold flex items-center gap-1">
                <img src="/dl.webp" className="w-4 h-4 object-contain" alt="DL" />
                {(status.totalWagered / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {status.nextTier && (
              <div className="flex justify-between text-sm">
                <span className="text-[#7a819c]">Next Tier ({status.nextTier.name})</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <img src="/dl.webp" className="w-4 h-4 object-contain" alt="DL" />
                  {(status.nextTier.threshold / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {status.nextTier ? (
            <div className="relative pt-4">
              <div className="absolute right-0 top-0 -translate-y-full text-xs font-bold text-accent-blue mb-1">
                {(status.progress ?? (status as any).progressPercent ?? 0).toFixed(2)}%
              </div>
              <div className="h-4 w-full bg-[#1f222b] rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-accent-blue to-blue-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${status.progress ?? (status as any).progressPercent ?? 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center gap-2">
              <Star size={18} />
              MAXIMUM TIER REACHED
            </div>
          )}
        </div>

        {/* Rakeback Card */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gift size={18} className="text-green-500" />
              Available Rakeback
            </h3>
            <div className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-lg flex items-center gap-1">
              {(status.currentTier.rakeback * 100).toFixed(1)}% Rate
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="text-[#7a819c] text-sm font-medium mb-2 uppercase tracking-widest">Unclaimed DLs</div>
            <div className="flex items-center gap-3 text-5xl font-black text-white mb-8 drop-shadow-lg">
              <img src="/dl.webp" className="w-10 h-10 object-contain drop-shadow-md" alt="DL" />
              {(status.rakebackBalance / 100).toFixed(2)}
            </div>

            <button
              onClick={handleClaim}
              disabled={status.rakebackBalance <= 0 || isClaiming}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: status.rakebackBalance > 0 ? 'var(--success)' : '#2a2d3a',
                color: status.rakebackBalance > 0 ? '#000' : '#7a819c',
                boxShadow: status.rakebackBalance > 0 ? '0 4px 0 #00b35c' : 'none',
              }}
            >
              {isClaiming ? 'Claiming...' : 'Claim Rakeback'}
              {status.rakebackBalance > 0 && (
                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Daily VIP Cases Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
          <Package className="text-accent-blue" size={24} />
          Daily VIP Cases
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {status.cases?.map((c: any) => (
            <div key={c.tierId} className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 relative overflow-hidden flex flex-col items-center text-center">
              {/* Background Glow */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ background: `radial-gradient(circle at top, ${c.color}, transparent 70%)` }}
              ></div>

              <div className="text-xs font-bold px-3 py-1 rounded-full border mb-4 relative z-10"
                style={{ borderColor: `${c.color}40`, color: c.color, backgroundColor: `${c.color}15` }}>
                {c.tierName} Tier
              </div>

              <div className="mb-4 relative z-10">
                <PackageOpen size={48} color={c.color} />
              </div>

              <h4 className="text-lg font-black text-white mb-1 relative z-10">{c.caseName}</h4>
              <div className="text-xs text-[#7a819c] mb-6 relative z-10 h-8 flex items-center justify-center gap-1">
                {c.threshold === 0 ? (
                  "Claimable every 24 hours for all players."
                ) : (
                  <>
                    Unlocked at 
                    <img src="/dl.webp" className="w-3 h-3 object-contain mx-0.5" alt="DL" />
                    {(c.threshold / 100).toLocaleString()} wagered
                  </>
                )}
              </div>

              {!c.isUnlocked ? (
                <div className="w-full py-3 rounded-xl bg-[#1f222b] text-[#7a819c] font-bold text-sm flex items-center justify-center gap-2 relative z-10">
                  <Lock size={16} /> Locked
                </div>
              ) : c.canClaim ? (
                <button
                  onClick={() => handleClaimCase(c.tierId)}
                  disabled={claimingCaseId === c.tierId}
                  className="w-full py-3 rounded-xl font-black text-white shadow-lg transition-transform hover:-translate-y-1 relative z-10"
                  style={{ background: `linear-gradient(to right, ${c.gradient})` }}
                >
                  {claimingCaseId === c.tierId ? 'Opening...' : 'Open Case'}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-[#1f222b] text-white font-bold text-sm flex items-center justify-center gap-2 relative z-10 border border-[#2a2d3a]">
                  <Clock size={16} className="text-amber-500" />
                  {Math.floor(c.cooldownRemainingSec / 3600)}h {Math.floor((c.cooldownRemainingSec % 3600) / 60)}m
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Users, Link as LinkIcon, Gift, ArrowRight, CheckCircle2, ChevronRight, AlertCircle, Copy, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";

function formatCurrency(val: number) {
  return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface AffiliateStats {
  code: string | null;
  earnings: number;
  referredCount: number;
}

export default function AffiliatesPage() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [applyCode, setApplyCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [settingCode, setSettingCode] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/affiliates/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSetCode = async () => {
    setError("");
    setSuccess("");
    if (!newCode || newCode.length < 3) {
      setError("Code must be at least 3 characters.");
      return;
    }
    setSettingCode(true);
    try {
      const res = await apiFetch("/affiliates/code", {
        method: "POST",
        body: JSON.stringify({ code: newCode }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setError(data.error || `Error ${res.status}: Failed to set code`);
        } catch {
          setError(`Error ${res.status}: ${text.substring(0, 50)}...`);
        }
        setSettingCode(false);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setSuccess("Affiliate code created successfully!");
        fetchStats();
      } else {
        setError(data.error || "Failed to set code.");
      }
    } catch (err: any) {
      setError(`Network error: ${err.message || 'An error occurred'}`);
    } finally {
      setSettingCode(false);
    }
  };

  const handleApplyCode = async () => {
    setError("");
    setSuccess("");
    if (!applyCode) {
      setError("Please enter a referral code.");
      return;
    }
    setApplyingCode(true);
    try {
      const res = await apiFetch("/affiliates/apply", {
        method: "POST",
        body: JSON.stringify({ code: applyCode }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setError(data.error || `Error ${res.status}: Failed to apply code`);
        } catch {
          setError(`Error ${res.status}: ${text.substring(0, 50)}...`);
        }
        setApplyingCode(false);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setSuccess("Referral code applied successfully!");
      } else {
        setError(data.error || "Failed to apply code.");
      }
    } catch (err: any) {
      setError(`Network error: ${err.message || 'An error occurred'}`);
    } finally {
      setApplyingCode(false);
    }
  };

  const handleClaim = async () => {
    setError("");
    setSuccess("");
    if (!stats || stats.earnings <= 0) return;
    setClaiming(true);
    try {
      const res = await apiFetch("/affiliates/claim", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Successfully claimed ${formatCurrency(data.claimed / 100)} DLs!`);
        refreshUser();
        fetchStats();
      } else {
        setError(data.error || "Failed to claim earnings.");
      }
    } catch (err) {
      setError("An error occurred while claiming.");
    } finally {
      setClaiming(false);
    }
  };

  const copyLink = () => {
    if (!stats?.code) return;
    const link = `${window.location.origin}/?ref=${stats.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        <div className="bg-[#121927] border border-[#1d2538] rounded-2xl p-8 sm:p-12 text-center mt-12 shadow-xl">
          <Users className="mx-auto text-emerald-500 mb-6" size={64} />
          <h2 className="text-3xl font-black text-white mb-4">Affiliate Program</h2>
          <p className="text-[#878eab] font-medium text-lg max-w-lg mx-auto mb-8">
            Log in to access your affiliate dashboard, create your referral code, and start earning a cut of every bet your friends place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f1b18] to-[#121927] border border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Users size={200} className="text-emerald-500 transform rotate-12" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Gift size={16} /> Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Earn up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">1% of every bet</span>
          </h1>
          <p className="text-[#878eab] font-medium text-lg max-w-xl">
            Invite your friends to GrowSpin and earn a cut of everything they wager, for as long as they play. Win or lose, you get paid.
          </p>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 font-bold ${
          error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Stats & Code */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#121927] border border-[#1d2538] rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[#878eab] text-sm font-bold uppercase tracking-wider mb-1">Total Referred</div>
                <div className="text-3xl font-black text-white">{stats?.referredCount || 0}</div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg">
                <Users size={16} /> Active Players
              </div>
            </div>

            <div className="bg-[#121927] border border-emerald-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex flex-col justify-between">
              <div>
                <div className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">Available Earnings</div>
                <div className="text-3xl font-black text-white">{formatCurrency((stats?.earnings || 0) / 100)} <span className="text-emerald-500 text-xl">DLs</span></div>
              </div>
              <button
                onClick={handleClaim}
                disabled={claiming || !stats?.earnings || stats.earnings <= 0}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3 rounded-lg transition-colors"
              >
                {claiming ? <Loader2 className="animate-spin" size={18} /> : (
                  <>Claim to Balance <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>

          {/* Create / View Code */}
          <div className="bg-[#121927] border border-[#1d2538] rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <LinkIcon className="text-blue-500" size={20} /> Your Affiliate Link
            </h3>
            
            {stats?.code ? (
              <div className="space-y-4">
                <p className="text-[#878eab] font-medium text-sm">Share this link with your friends. Anyone who signs up using this link will automatically become your affiliate.</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#0b101a] border border-[#1d2538] rounded-lg p-4 font-mono text-white text-sm sm:text-base break-all flex items-center">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://growspin.com'}/?ref={stats.code}
                  </div>
                  <button 
                    onClick={copyLink}
                    className="shrink-0 bg-[#232a3b] hover:bg-[#2c3449] text-white px-6 rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[#878eab] font-medium text-sm">Create a unique code to start referring players.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter a custom code (e.g. YOURNAME)"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#0b101a] border border-[#1d2538] rounded-lg px-4 font-bold text-white uppercase placeholder:normal-case placeholder:text-[#454d66] focus:outline-none focus:border-emerald-500/50"
                  />
                  <button 
                    onClick={handleSetCode}
                    disabled={settingCode || !newCode}
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-6 rounded-lg font-black transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    {settingCode ? <Loader2 className="animate-spin" size={18} /> : "Create Code"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Apply Code */}
        <div className="bg-[#121927] border border-[#1d2538] rounded-xl p-6 shadow-md h-fit">
          <h3 className="text-xl font-black text-white mb-2">Redeem a Code</h3>
          <p className="text-[#878eab] font-medium text-sm mb-6">
            Were you referred by a friend or streamer? Enter their code below to support them.
          </p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Enter referral code"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              className="w-full bg-[#0b101a] border border-[#1d2538] rounded-lg p-4 font-bold text-white uppercase placeholder:normal-case placeholder:text-[#454d66] focus:outline-none focus:border-blue-500/50"
            />
            <button 
              onClick={handleApplyCode}
              disabled={applyingCode || !applyCode}
              className="w-full bg-[#232a3b] hover:bg-[#2c3449] disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {applyingCode ? <Loader2 className="animate-spin" size={18} /> : (
                <>Support Creator <ChevronRight size={18} /></>
              )}
            </button>
          </div>

          <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 flex gap-3">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-medium text-blue-200/70 leading-relaxed">
              Once you apply a code, it cannot be changed. The creator will earn a percentage of the house edge from all your bets across the platform.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

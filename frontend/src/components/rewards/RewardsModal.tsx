'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Gift, Percent, Users, ArrowRight, Loader2, Link2, Copy, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { DLCurrency } from '@/components/ui/DLCurrency';

export default function RewardsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'vip' | 'rakeback' | 'affiliates'>('vip');
  const [status, setStatus] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [affiliateCodeInput, setAffiliateCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/vip/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchStatus();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleClaimRakeback = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch('/vip/claim-rakeback', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully claimed ${data.claimedAmount / 100} DLs!`);
        refreshUser();
        fetchStatus();
      } else throw new Error(data.error);
    } catch (e: any) { setError(e.message); }
    setActionLoading(false);
  };

  const handleClaimAffiliate = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch('/vip/affiliate/claim', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully claimed ${data.claimedAmount / 100} DLs!`);
        refreshUser();
        fetchStatus();
      } else throw new Error(data.error);
    } catch (e: any) { setError(e.message); }
    setActionLoading(false);
  };

  const handleSetAffiliateCode = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch('/vip/affiliate/set', { 
        method: 'POST',
        body: JSON.stringify({ code: affiliateCodeInput })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Affiliate code set successfully!');
        refreshUser(); 
        fetchStatus();
      } else throw new Error(data.error);
    } catch (e: any) { setError(e.message); }
    setActionLoading(false);
  };

  const handleClaimCase = async (tierId: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch('/vip/claim-case', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`You won ${data.winnings / 100} DLs from the ${data.item.name}!`);
        refreshUser();
        fetchStatus();
      } else throw new Error(data.error);
    } catch (e: any) { setError(e.message); }
    setActionLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#11141d] rounded-3xl shadow-2xl overflow-hidden border border-white/5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-[#161a24]">
            <div className="flex items-center gap-3">
              <Crown className="text-yellow-500" size={18} />
              <h2 className="text-base font-bold text-white">Rewards Hub</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-[#7a819c] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {/* Tabs */}
            <div className="flex bg-[#0c0e14] rounded-xl p-1.5 mb-6 border border-white/5 relative shrink-0">
              <button
                onClick={() => setTab('vip')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'vip' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
              >
                <Gift size={16} /> VIP Club
              </button>
              <button
                onClick={() => setTab('rakeback')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'rakeback' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
              >
                <Percent size={16} /> Rakeback
              </button>
              <button
                onClick={() => setTab('affiliates')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'affiliates' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
              >
                <Users size={16} /> Affiliates
              </button>
              
              <div 
                className="absolute inset-y-1.5 w-[calc(33.333%-0.375rem)] bg-[#1e2333] rounded-lg shadow-sm border border-white/5 transition-transform duration-300 ease-out z-0"
                style={{ 
                  transform: `translateX(${tab === 'vip' ? '0%' : tab === 'rakeback' ? '100%' : '200%'})`, 
                  left: tab === 'rakeback' ? '0.375rem' : tab === 'affiliates' ? '0.75rem' : '0.375rem' 
                }} 
              />
            </div>

            {(error || success) && (
              <div className={`mb-6 p-4 rounded-xl border font-bold text-xs text-center ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {error || success}
              </div>
            )}

            {loading || !status ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#7a819c]" />
              </div>
            ) : (
              <>
                {/* VIP TAB */}
                {tab === 'vip' && (
                  <motion.div key="vip" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    {/* Progress Card */}
                    <div className="bg-[#161a24] p-6 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-1">Current Tier</p>
                          <div className={`inline-block px-3 py-1 rounded text-sm font-black uppercase tracking-wider ${status.currentTier.color} border border-current bg-opacity-10 bg-current`}>
                            {status.currentTier.name}
                          </div>
                        </div>
                        {status.nextTier && (
                          <div className="text-right">
                            <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-1">Next Tier</p>
                            <div className={`inline-block text-sm font-black uppercase tracking-wider ${status.nextTier.color}`}>
                              {status.nextTier.name}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {status.nextTier ? (
                        <>
                          <div className="w-full bg-[#0c0e14] h-3 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full ${status.currentTier.gradient} transition-all duration-1000 ease-out relative`}
                              style={{ width: `${status.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs font-bold">
                            <span className="text-[#7a819c]">Wagered: <DLCurrency amount={status.totalWagered} size="xs" /></span>
                            <span className="text-white">Need <DLCurrency amount={status.nextTier.remaining} size="xs" /> more</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full bg-[#0c0e14] h-3 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${status.currentTier.gradient} w-full`} />
                          <p className="text-center mt-2 text-xs font-bold text-amber-400">Maximum Tier Reached!</p>
                        </div>
                      )}
                    </div>

                    {/* Daily Cases */}
                    <div>
                      <h3 className="text-lg font-black text-white mb-4">Daily Rewards</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {status.cases.map((c: any) => (
                          <div key={c.tierId} className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between h-full ${c.isUnlocked ? 'bg-[#161a24] border-white/10 hover:border-white/20' : 'bg-[#0c0e14] border-white/5 opacity-60'}`}>
                            <div>
                              {!c.isUnlocked && (
                                <div className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-lg">
                                  <Lock size={14} className="text-[#7a819c]" />
                                </div>
                              )}
                              <div className={`text-sm font-black uppercase tracking-wider mb-1 ${c.color}`}>{c.tierName} Case</div>
                              <p className="text-xs text-[#7a819c] font-medium mb-4">{c.caseDescription}</p>
                            </div>
                            
                            {c.isUnlocked ? (
                              c.canClaim ? (
                                <button 
                                  onClick={() => handleClaimCase(c.tierId)}
                                  disabled={actionLoading}
                                  className={`w-full py-2.5 ${c.gradient} text-black font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider`}
                                >
                                  Open Case
                                </button>
                              ) : (
                                <div className="w-full py-2.5 bg-[#0c0e14] text-[#7a819c] font-bold text-xs rounded-xl text-center border border-white/5 flex items-center justify-center gap-2">
                                  <span>Available in {Math.ceil(c.cooldownRemainingSec / 3600)}h</span>
                                </div>
                              )
                            ) : (
                              <div className="w-full py-2.5 bg-[#0c0e14] text-[#7a819c] font-bold text-xs rounded-xl text-center border border-white/5">
                                Unlocks at <DLCurrency amount={c.threshold} size="xs" /> wagered
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* RAKEBACK TAB */}
                {tab === 'rakeback' && (
                  <motion.div key="rakeback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="bg-[#161a24] p-6 rounded-2xl border border-white/5 text-center">
                      <p className="text-[#7a819c] text-sm font-bold mb-2">Available Rakeback</p>
                      <div className="mb-6">
                        <DLCurrency amount={status.rakebackBalance} size="xl" className="text-white text-4xl" />
                      </div>
                      <p className="text-xs text-[#7a819c] mb-6 max-w-md mx-auto">
                        You earn rakeback on every single bet you place, win or lose. Your current VIP tier ({status.currentTier.name}) earns {status.currentTier.rakeback}% rakeback.
                      </p>
                      <button 
                        onClick={handleClaimRakeback}
                        disabled={status.rakebackBalance <= 0 || actionLoading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-[#00c566] hover:from-[#00c566] hover:to-emerald-400 disabled:opacity-50 text-black font-bold text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Claim to Wallet'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* AFFILIATES TAB */}
                {tab === 'affiliates' && (
                  <motion.div key="affiliates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="bg-[#161a24] p-6 rounded-2xl border border-white/5 text-center">
                      <p className="text-[#7a819c] text-sm font-bold mb-4">Affiliate System</p>
                      <p className="text-xs text-white/60 mb-6">Earn passive income when players sign up using your code. The affiliate system is currently undergoing maintenance. Check back soon for your unique referral link.</p>
                      
                      <div className="flex gap-2 justify-center max-w-sm mx-auto">
                        <input 
                          type="text" 
                          value={affiliateCodeInput}
                          onChange={(e) => setAffiliateCodeInput(e.target.value)}
                          placeholder="Enter desired code"
                          className="bg-[#0c0e14] border border-white/10 rounded-xl px-4 py-2 text-white outline-none w-full font-bold text-sm"
                        />
                        <button 
                          onClick={handleSetAffiliateCode}
                          disabled={!affiliateCodeInput || actionLoading}
                          className="px-4 py-2 bg-[#1e2333] hover:bg-[#2a3044] text-white font-bold text-sm rounded-xl transition-colors"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

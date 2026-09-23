'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Gamepad2, Coins, CheckCircle2, ArrowRight, Copy, ExternalLink, Loader2 } from 'lucide-react';

interface DepositIntent {
  id: number;
  growId: string;
  worldName: string;
  botName: string;
  status: string;
  amount: number;
}

interface CryptoInvoice {
  internalInvoiceId: number;
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  status: string;
  dlsCredited?: number;
}

const CRYPTO_OPTIONS = [
  { id: 'ltc', name: 'Litecoin', ticker: 'LTC', color: 'from-blue-400 to-blue-600', icon: 'Ł' },
  { id: 'btc', name: 'Bitcoin', ticker: 'BTC', color: 'from-orange-400 to-orange-600', icon: '₿' },
  { id: 'eth', name: 'Ethereum', ticker: 'ETH', color: 'from-indigo-400 to-purple-600', icon: 'Ξ' },
  { id: 'usdttrc20', name: 'Tether', ticker: 'USDT', color: 'from-green-400 to-emerald-600', icon: '₮' }
];

export default function DepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<'growtopia' | 'crypto' | 'withdraw'>('growtopia');

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawMethod, setWithdrawMethod] = useState<'crypto'|'growtopia'>('crypto');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Growtopia State
  const [growId, setGrowId] = useState('');
  const [intent, setIntent] = useState<DepositIntent | null>(null);

  // Crypto State
  const [cryptoAmount, setCryptoAmount] = useState<number>(5);
  const [cryptoCurrency, setCryptoCurrency] = useState('ltc');
  const [invoice, setInvoice] = useState<CryptoInvoice | null>(null);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setIntent(null);
      setInvoice(null);
      setError('');
      setSuccessMsg('');
      setLoading(false);
    }
  }, [isOpen]);

  // Poll for Growtopia status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (intent && intent.status === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await apiFetch('/deposit/status');
          const data = await res.json();
          if (data.intent && data.intent.status === 'COMPLETED') {
            setIntent(data.intent);
            setSuccessMsg(`Successfully deposited ${data.intent.amount / 100} DLs!`);
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [intent]);

  // Poll for Crypto status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (invoice && invoice.status !== 'finished' && invoice.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const res = await apiFetch(`/deposit/crypto/status?id=${invoice.internalInvoiceId}`);
          const data = await res.json();
          if (data.invoice) {
            if (data.invoice.status === 'finished') {
              setInvoice({ ...invoice, status: 'finished', dlsCredited: data.invoice.dlsCredited });
              setSuccessMsg(`Successfully deposited ${data.invoice.dlsCredited / 100} DLs!`);
              clearInterval(interval);
            } else if (data.invoice.status === 'failed') {
              setInvoice({ ...invoice, status: 'failed' });
              setError('Payment failed or expired.');
              clearInterval(interval);
            }
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [invoice]);

  const handleGrowtopiaRequest = async () => {
    if (!growId) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/deposit/request', {
        method: 'POST',
        body: JSON.stringify({ growId })
      });
      const data = await res.json();
      if (data.success) {
        setIntent(data.intent);
      } else {
        setError(data.error || 'Failed to create request');
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleCryptoRequest = async () => {
    if (cryptoAmount < 1) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/deposit/crypto/request', {
        method: 'POST',
        body: JSON.stringify({ amountUSD: cryptoAmount, payCurrency: cryptoCurrency })
      });
      const data = await res.json();
      if (data.success) {
        setInvoice({
          internalInvoiceId: data.internalInvoiceId,
          payment_id: data.invoice.payment_id,
          pay_address: data.invoice.pay_address,
          pay_amount: data.invoice.pay_amount,
          pay_currency: data.invoice.pay_currency,
          status: 'waiting'
        });
      } else {
        setError(data.error || 'Failed to generate crypto invoice');
      }
    } catch (e) {
      setError('Network error. Check API keys.');
    }
    setLoading(false);
  };

  const handleWithdrawRequest = async () => {
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await apiFetch('/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: withdrawAmount * 100, // to cents
          method: withdrawMethod,
          address: withdrawAddress
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Withdrawal requested for ${withdrawAmount} DLs!`);
        refreshUser();
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#11141d] rounded-3xl shadow-2xl overflow-hidden border border-white/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-[#161a24]">
            <div className="flex items-center gap-3">
              <Wallet className="text-emerald-400" size={18} />
              <h2 className="text-base font-bold text-white">Deposit & Withdraw</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-[#7a819c] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {successMsg ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                  <CheckCircle2 className="text-emerald-400 w-10 h-10 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{successMsg}</h3>
                <p className="text-[#7a819c] mb-8">Your balance has been updated automatically.</p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-[#1e2333] hover:bg-[#2a2f42] text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  Return to game
                </button>
              </motion.div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex bg-[#0c0e14] rounded-xl p-1 mb-5 border border-white/5 relative">
                  <button
                    onClick={() => setTab('growtopia')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'growtopia' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
                  >
                    <Gamepad2 size={16} />
                    Growtopia Bot
                  </button>
                  <button
                    onClick={() => setTab('crypto')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'crypto' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
                  >
                    <Coins size={16} />
                    Crypto
                  </button>
                  <button
                    onClick={() => setTab('withdraw')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 ${tab === 'withdraw' ? 'text-white' : 'text-[#7a819c] hover:text-white'}`}
                  >
                    <ArrowRight size={16} />
                    Withdraw
                  </button>
                  
                  {/* Tab Highlight Indicator */}
                  <div 
                    className="absolute inset-y-1.5 w-[calc(33.333%-0.375rem)] bg-[#1e2333] rounded-lg shadow-sm border border-white/5 transition-transform duration-300 ease-out z-0"
                    style={{ 
                      transform: `translateX(${tab === 'growtopia' ? '0%' : tab === 'crypto' ? '100%' : '200%'})`, 
                      left: tab === 'crypto' ? '0.375rem' : tab === 'withdraw' ? '0.75rem' : '0.375rem' 
                    }} 
                  />
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium p-4 rounded-xl flex items-center gap-3"
                    >
                      <X size={16} className="shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Growtopia Tab */}
                {tab === 'growtopia' && (
                  <motion.div
                    key="growtopia"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {intent ? (
                      <div className="space-y-4">
                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Step 1: Go to World</p>
                          <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-white/5">
                            <span className="text-2xl font-black text-indigo-400 tracking-wider font-mono">{intent.worldName}</span>
                            <button onClick={() => copyToClipboard(intent.worldName)} className="text-[#7a819c] hover:text-white transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Step 2: Drop DLs for</p>
                          <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-white/5">
                            <span className="text-xl font-bold text-white font-mono">{intent.botName}</span>
                            <button onClick={() => copyToClipboard(intent.botName)} className="text-[#7a819c] hover:text-white transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                          <p className="text-indigo-300 font-medium text-sm">Listening for Diamond Lock drops...</p>
                          <p className="text-[#7a819c] text-xs mt-1 text-center">Do not close this window until the deposit completes.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[#7a819c] ml-1">Your GrowID</label>
                          <input 
                            type="text" 
                            value={growId}
                            onChange={(e) => setGrowId(e.target.value)}
                            className="w-full bg-[#0c0e14] border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-medium"
                            placeholder="e.g. JohnDoe123"
                          />
                        </div>
                        
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 text-indigo-200">
                          <div className="mt-0.5"><CheckCircle2 size={16} className="text-indigo-400" /></div>
                          <p className="text-sm leading-relaxed">Please ensure you type your exact in-game GrowID. You will be assigned a unique drop world.</p>
                        </div>

                        <button 
                          onClick={handleGrowtopiaRequest}
                          disabled={!growId || loading}
                          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Drop World'}
                          {!loading && <ArrowRight size={20} />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Crypto Tab */}
                {tab === 'crypto' && (
                  <motion.div
                    key="crypto"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {invoice ? (
                      <div className="space-y-4">
                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5 text-center">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Send EXACTLY</p>
                          <div className="inline-flex items-center gap-2 bg-[#0c0e14] px-6 py-3 rounded-xl border border-white/5">
                            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">{invoice.pay_amount}</span>
                            <span className="text-xl font-bold text-white/50 uppercase">{invoice.pay_currency}</span>
                          </div>
                        </div>
                        
                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2 text-center">To Address</p>
                          <div className="flex items-center gap-3 bg-[#0c0e14] p-4 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => copyToClipboard(invoice.pay_address)}>
                            <p className="text-sm font-mono text-white/80 break-all flex-1">{invoice.pay_address}</p>
                            <div className="p-2 bg-[#1e2333] group-hover:bg-emerald-500/20 rounded-lg text-[#7a819c] group-hover:text-emerald-400 transition-colors shrink-0">
                              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                          <p className="text-emerald-300 font-medium text-sm">Awaiting blockchain confirmations...</p>
                          <p className="text-[#7a819c] text-xs mt-1 text-center">Do not close this window until the deposit completes.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[#7a819c] ml-1 flex justify-between">
                            <span>Amount in USD</span>
                            <span className="text-emerald-400 font-medium">{cryptoAmount * 2} DLs</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-white/40 font-bold">$</span>
                            </div>
                            <input 
                              type="number" 
                              value={cryptoAmount || ''}
                              onChange={(e) => setCryptoAmount(Number(e.target.value))}
                              min="1"
                              className="w-full bg-[#0c0e14] border-2 border-transparent focus:border-emerald-500 rounded-xl pl-8 pr-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-bold text-lg"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[#7a819c] ml-1">Select Cryptocurrency</label>
                          <div className="grid grid-cols-2 gap-3">
                            {CRYPTO_OPTIONS.map((coin) => (
                              <button
                                key={coin.id}
                                onClick={() => setCryptoCurrency(coin.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                  cryptoCurrency === coin.id 
                                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                                    : 'border-white/5 bg-[#0c0e14] hover:bg-[#161a24] hover:border-white/10'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${coin.color} flex items-center justify-center font-black text-white text-sm shadow-inner`}>
                                  {coin.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white text-sm">{coin.name}</div>
                                  <div className={`text-xs ${cryptoCurrency === coin.id ? 'text-emerald-400' : 'text-[#7a819c]'}`}>{coin.ticker}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={handleCryptoRequest}
                          disabled={cryptoAmount < 1 || loading}
                          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-[#00c566] hover:from-[#00c566] hover:to-emerald-400 disabled:opacity-50 disabled:grayscale text-black rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:shadow-[0_0_30px_rgba(0,230,118,0.5)] active:scale-[0.98]"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Proceed to Payment'}
                          {!loading && <ArrowRight size={20} />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Withdraw Tab */}
                {tab === 'withdraw' && (
                  <motion.div
                    key="withdraw"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#7a819c] ml-1">Withdrawal Method</label>
                      <div className="flex bg-[#0c0e14] rounded-xl p-1.5 border border-white/5 relative">
                        <button
                          onClick={() => setWithdrawMethod('crypto')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${withdrawMethod === 'crypto' ? 'bg-[#1e2333] text-white' : 'text-[#7a819c] hover:text-white'}`}
                        >
                          Crypto
                        </button>
                        <button
                          onClick={() => setWithdrawMethod('growtopia')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${withdrawMethod === 'growtopia' ? 'bg-[#1e2333] text-white' : 'text-[#7a819c] hover:text-white'}`}
                        >
                          Growtopia In-Game
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#7a819c] ml-1">Amount (DLs)</label>
                      <input 
                        type="number" 
                        value={withdrawAmount || ''}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        min="50"
                        className="w-full bg-[#0c0e14] border-2 border-transparent focus:border-red-500 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-bold text-lg"
                        placeholder="Min 50"
                      />
                      <p className="text-[10px] text-[#7a819c] ml-1 uppercase font-bold tracking-wider">Minimum withdrawal: 50 DLs</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#7a819c] ml-1">
                        {withdrawMethod === 'crypto' ? 'Litecoin (LTC) Address' : 'GrowID & World Name'}
                      </label>
                      <input 
                        type="text" 
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="w-full bg-[#0c0e14] border-2 border-transparent focus:border-red-500 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-medium"
                        placeholder={withdrawMethod === 'crypto' ? 'Enter LTC address...' : 'e.g. JohnDoe123 | BUYGEMS'}
                      />
                    </div>

                    <button 
                      onClick={handleWithdrawRequest}
                      disabled={withdrawAmount < 50 || !withdrawAddress || loading}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-[#e11d48] hover:from-[#e11d48] hover:to-red-400 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Request Withdrawal'}
                      {!loading && <ArrowRight size={20} />}
                    </button>
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

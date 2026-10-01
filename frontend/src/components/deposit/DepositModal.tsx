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
  { id: 'USDT', name: 'Tether', ticker: 'USDT', color: 'from-green-400 to-emerald-600', icon: '₮' }
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
  const [growAmount, setGrowAmount] = useState<number>(50);
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
  const [timeLeft, setTimeLeft] = useState<number>(0);

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
          } else if (data.intent && data.intent.status === 'PENDING') {
            setIntent(data.intent);
            const expiresAt = new Date(data.intent.createdAt).getTime() + 5 * 60 * 1000;
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0) {
              setIntent({ ...data.intent, status: 'EXPIRED' });
              setError('Deposit window expired.');
              clearInterval(interval);
            }
          }
        } catch (e) {}
      }, 1000);
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
        body: JSON.stringify({ growId, amount: growAmount })
      });
      const data = await res.json();
      if (data.success) {
        setIntent(data.intent);
        setTimeLeft(300); // 5 minutes
      } else {
        setError(data.error || 'Failed to create request');
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleCancelDeposit = async () => {
    if (!intent) return;
    try {
      await apiFetch('/deposit/cancel', { method: 'POST' });
      setIntent(null);
      setError('Deposit cancelled.');
    } catch (e) {}
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
      if (data.success && data.address) {
        setInvoice({
          internalInvoiceId: data.internalInvoiceId,
          payment_id: data.invoice.paymentId,
          pay_address: data.address,
          pay_amount: data.payAmount,
          pay_currency: data.invoice.payCurrency,
          status: 'waiting'
        });
      } else {
        setError(data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to generate deposit address'));
      }
    } catch (e) {
      setError('Network error. Please try again.');
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
          className="absolute inset-0 bg-[#06080d]/80 backdrop-blur-md"
        />

        {/* Subtle background glow effect behind modal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0d1017]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/[0.08]"
        >
          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Wallet className="text-emerald-400" size={18} />
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">Cashier</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-[#7a819c] hover:text-white transition-all hover:rotate-90">
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
                {/* Premium Tabs */}
                <div className="flex bg-[#050609]/50 rounded-2xl p-1.5 mb-6 border border-white/[0.05] relative shadow-inner">
                  {/* Tab Highlight Indicator */}
                  <div 
                    className="absolute inset-y-1.5 w-[calc(33.333%-0.5rem)] bg-[#1a1f2e] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/10 transition-all duration-300 ease-out z-0"
                    style={{ 
                      transform: `translateX(${tab === 'growtopia' ? '0%' : tab === 'crypto' ? '100%' : '200%'})`, 
                      left: tab === 'crypto' ? '0.5rem' : tab === 'withdraw' ? '0.875rem' : '0.125rem' 
                    }} 
                  />

                  <button
                    onClick={() => setTab('growtopia')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${tab === 'growtopia' ? 'text-white' : 'text-[#7a819c] hover:text-white hover:bg-white/5'}`}
                  >
                    <Gamepad2 size={16} className={tab === 'growtopia' ? 'text-indigo-400' : ''} />
                    Growtopia
                  </button>
                  <button
                    onClick={() => setTab('crypto')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${tab === 'crypto' ? 'text-white' : 'text-[#7a819c] hover:text-white hover:bg-white/5'}`}
                  >
                    <Coins size={16} className={tab === 'crypto' ? 'text-emerald-400' : ''} />
                    Crypto
                  </button>
                  <button
                    onClick={() => setTab('withdraw')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${tab === 'withdraw' ? 'text-white' : 'text-[#7a819c] hover:text-white hover:bg-white/5'}`}
                  >
                    <ArrowRight size={16} className={tab === 'withdraw' ? 'text-rose-400' : ''} />
                    Withdraw
                  </button>
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
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Step 2: Trade DLs to</p>
                          <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-white/5">
                            <span className="text-xl font-bold text-white font-mono">{intent.botName}</span>
                            <button onClick={() => copyToClipboard(intent.botName)} className="text-[#7a819c] hover:text-white transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                          {intent.status === 'PENDING' ? (
                            <>
                              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                              <p className="text-indigo-300 font-medium text-sm">Waiting for you to trade the bot...</p>
                              <div className="mt-4 flex items-center justify-center w-full gap-2">
                                <div className="text-xl font-mono font-bold text-indigo-300">
                                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                                <span className="text-[#7a819c] text-xs">remaining</span>
                              </div>
                              <button 
                                onClick={handleCancelDeposit}
                                className="mt-4 px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
                              >
                                Cancel Deposit
                              </button>
                            </>
                          ) : (
                            <p className="text-indigo-300 font-medium text-sm">Deposit processed.</p>
                          )}
                          <p className="text-[#7a819c] text-xs mt-3 text-center">Do not close this window until the deposit completes.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">Your GrowID</label>
                          <div className="relative group">
                            <input 
                              type="text" 
                              value={growId}
                              onChange={(e) => setGrowId(e.target.value)}
                              className="w-full bg-[#050609]/50 border border-white/5 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition-all font-medium shadow-inner"
                              placeholder="e.g. JohnDoe123"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">Deposit Amount (DLs)</label>
                          <div className="relative group">
                            <input 
                              type="number" 
                              value={growAmount || ''}
                              onChange={(e) => setGrowAmount(Number(e.target.value))}
                              min="1"
                              className="w-full bg-[#050609]/50 border border-white/5 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition-all font-medium shadow-inner text-lg"
                              placeholder="50"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-indigo-500/10 text-indigo-400 font-bold text-xs rounded-lg border border-indigo-500/20 pointer-events-none">
                              DLs
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 text-indigo-200">
                          <div className="mt-0.5"><CheckCircle2 size={16} className="text-indigo-400" /></div>
                          <p className="text-sm leading-relaxed">Ensure you type your exact in-game GrowID. You will be assigned a unique drop world.</p>
                        </div>

                        <button 
                          onClick={handleGrowtopiaRequest}
                          disabled={!growId || loading}
                          className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.6)] active:scale-[0.98] overflow-hidden border border-white/10"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                          {loading ? <Loader2 className="animate-spin relative z-10" size={20} /> : <span className="relative z-10">Generate Drop World</span>}
                          {!loading && <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
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
                        <div className="flex justify-center mb-6 mt-2">
                          <div className="p-3 bg-white rounded-xl">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${invoice.pay_currency.toLowerCase()}:${invoice.pay_address}?amount=${invoice.pay_amount}`)}`}
                              alt="Deposit QR Code"
                              className="w-40 h-40"
                            />
                          </div>
                        </div>

                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Send Exactly</p>
                          <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-white/5">
                            <span className="text-2xl font-black text-emerald-400 tracking-wider font-mono">
                              {invoice.pay_amount} <span className="text-lg">{invoice.pay_currency}</span>
                            </span>
                            <button onClick={() => copyToClipboard(invoice.pay_amount.toString())} className="text-[#7a819c] hover:text-white transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#161a24] p-5 rounded-2xl border border-white/5">
                          <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">To Address</p>
                          <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-white/5 overflow-hidden">
                            <span className="text-sm font-bold text-white font-mono truncate mr-2">{invoice.pay_address}</span>
                            <button onClick={() => copyToClipboard(invoice.pay_address)} className="text-[#7a819c] hover:text-white transition-colors shrink-0">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                          <p className="text-emerald-300 font-medium text-sm">Waiting for payment confirmation...</p>
                          <p className="text-[#7a819c] text-xs mt-3 text-center">Do not close this window. Your balance will update automatically once the network confirms the transaction.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {['ETH', 'USDT'].includes(cryptoCurrency) && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-500 font-bold mb-4 flex items-start gap-2">
                            <span className="text-base leading-none">⚠️</span>
                            <div>
                              Send only on supported EVM networks: Mainnet, Arbitrum, Base, BSC, Optimism, Polygon. 
                              <br/>DO NOT send via Tron (TRC20).
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider flex justify-between">
                            <span>Amount in USD</span>
                            <span className="text-emerald-400 font-black">{Math.floor((cryptoAmount / 2.6) * 100).toLocaleString()} DLs</span>
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                              <span className="text-white/40 font-bold text-lg">$</span>
                            </div>
                            <input 
                              type="number" 
                              value={cryptoAmount || ''}
                              onChange={(e) => setCryptoAmount(Number(e.target.value))}
                              min="1"
                              className="w-full bg-[#050609]/50 border border-white/5 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pl-10 pr-5 py-4 text-white placeholder-white/20 outline-none transition-all font-bold text-xl shadow-inner tracking-wider"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">Select Cryptocurrency</label>
                          <div className="grid grid-cols-2 gap-3">
                            {CRYPTO_OPTIONS.map((coin) => (
                              <button
                                key={coin.id}
                                onClick={() => setCryptoCurrency(coin.id)}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                                  cryptoCurrency === coin.id 
                                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_5px_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
                                    : 'border-white/5 bg-[#050609]/50 hover:bg-white/5 shadow-inner'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center font-black text-white text-base shadow-lg`}>
                                  {coin.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white text-sm">{coin.name}</div>
                                  <div className={`text-xs font-bold ${cryptoCurrency === coin.id ? 'text-emerald-400' : 'text-[#7a819c]'}`}>{coin.ticker}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={handleCryptoRequest}
                          disabled={cryptoAmount < 1 || loading}
                          className="group relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:grayscale text-black rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(16,185,129,0.6)] active:scale-[0.98] overflow-hidden border border-white/20"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                          {loading ? <Loader2 className="animate-spin relative z-10" size={20} /> : <span className="relative z-10">Generate Address</span>}
                          {!loading && <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
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
                      <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">Withdrawal Method</label>
                      <div className="flex bg-[#050609]/50 rounded-2xl p-1.5 border border-white/[0.05] relative shadow-inner">
                        <button
                          onClick={() => setWithdrawMethod('crypto')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${withdrawMethod === 'crypto' ? 'bg-[#1a1f2e] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/10' : 'text-[#7a819c] hover:text-white hover:bg-white/5'}`}
                        >
                          Crypto
                        </button>
                        <button
                          onClick={() => setWithdrawMethod('growtopia')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${withdrawMethod === 'growtopia' ? 'bg-[#1a1f2e] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/10' : 'text-[#7a819c] hover:text-white hover:bg-white/5'}`}
                        >
                          Growtopia In-Game
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">Amount (DLs)</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={withdrawAmount || ''}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          min="50"
                          className="w-full bg-[#050609]/50 border border-white/5 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition-all font-bold text-lg shadow-inner"
                          placeholder="Min 50"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-rose-500/10 text-rose-400 font-bold text-xs rounded-lg border border-rose-500/20 pointer-events-none">
                          DLs
                        </div>
                      </div>
                      <p className="text-[10px] text-[#7a819c] ml-2 uppercase font-bold tracking-wider">Minimum withdrawal: 50 DLs</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#7a819c] ml-2 uppercase tracking-wider">
                        {withdrawMethod === 'crypto' ? 'Litecoin (LTC) Address' : 'GrowID & World Name'}
                      </label>
                      <input 
                        type="text" 
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="w-full bg-[#050609]/50 border border-white/5 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition-all font-medium shadow-inner"
                        placeholder={withdrawMethod === 'crypto' ? 'Enter LTC address...' : 'e.g. JohnDoe123 | BUYGEMS'}
                      />
                    </div>

                    <button 
                      onClick={handleWithdrawRequest}
                      disabled={withdrawAmount < 50 || !withdrawAddress || loading}
                      className="group relative w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_-10px_rgba(225,29,72,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(225,29,72,0.6)] active:scale-[0.98] overflow-hidden border border-white/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      {loading ? <Loader2 className="animate-spin relative z-10" size={20} /> : <span className="relative z-10">Request Withdrawal</span>}
                      {!loading && <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
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

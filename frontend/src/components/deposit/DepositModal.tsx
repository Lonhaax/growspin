'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Gamepad2, Coins, CheckCircle2, ArrowRight, Copy, ExternalLink, Loader2, CreditCard, Apple, Landmark, LockIcon } from 'lucide-react';
import QRCode from 'react-qr-code';

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
  const [withdrawMethod, setWithdrawMethod] = useState<string>('');
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
      setTab('crypto');
      setCryptoCurrency('');
      setWithdrawMethod('');
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

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#11141d] rounded-2xl shadow-2xl overflow-hidden border border-[#232938]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#232938] shrink-0 bg-[#161a24]">
            <h2 className="text-[17px] font-bold text-white">Wallet</h2>
            <button onClick={onClose} className="text-[#7a819c] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Top Tabs */}
            <div className="flex items-center gap-6 mb-8 border-b border-[#232938] pb-4">
              <button onClick={() => { setTab('crypto'); setCryptoCurrency(''); }} className={`text-sm font-bold transition-colors ${tab !== 'withdraw' ? 'text-white border-b-2 border-white pb-4 -mb-[18px]' : 'text-[#7a819c] hover:text-white'}`}>Deposit</button>
              <button onClick={() => { setTab('withdraw'); setWithdrawMethod(''); }} className={`text-sm font-bold transition-colors ${tab === 'withdraw' ? 'text-white border-b-2 border-white pb-4 -mb-[18px]' : 'text-[#7a819c] hover:text-white'}`}>Withdraw</button>
              <button className="text-sm font-bold text-[#7a819c] hover:text-white transition-colors">Tip</button>
              <button className="text-sm font-bold text-[#7a819c] hover:text-white transition-colors">Exchange</button>
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
            ) : tab === 'growtopia' ? (
              /* Growtopia Deposit Form */
              <div className="space-y-6">
                <button onClick={() => { setTab('crypto'); setCryptoCurrency(''); }} className="text-sm text-[#7a819c] hover:text-white flex items-center gap-2 mb-4">
                   &larr; Back to Methods
                </button>
                {intent ? (
                  <div className="space-y-4">
                    <div className="bg-[#161a24] p-5 rounded-2xl border border-[#232938]">
                      <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Step 1: Go to World</p>
                      <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-[#232938]">
                        <span className="text-2xl font-black text-blue-400 tracking-wider font-mono">{intent.worldName}</span>
                        <button onClick={() => copyToClipboard(intent.worldName)} className="text-[#7a819c] hover:text-white transition-colors">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-[#161a24] p-5 rounded-2xl border border-[#232938]">
                      <p className="text-[#7a819c] text-xs font-bold uppercase tracking-wider mb-2">Step 2: Trade DLs to</p>
                      <div className="flex items-center justify-between bg-[#0c0e14] p-4 rounded-xl border border-[#232938]">
                        <span className="text-xl font-bold text-white font-mono">{intent.botName}</span>
                        <button onClick={() => copyToClipboard(intent.botName)} className="text-[#7a819c] hover:text-white transition-colors">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={handleCancelDeposit}
                        className="flex-1 py-4 bg-[#171c28] hover:bg-red-500/10 text-red-400 rounded-xl font-bold transition-colors border border-red-500/20"
                      >
                        Cancel
                      </button>
                      <div className="flex-1 py-4 bg-[#1e2333] border border-[#232938] text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
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
                        className="w-full bg-[#171c28] border border-[#232938] focus:border-blue-500/50 rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none transition-all font-medium"
                        placeholder="e.g. JohnDoe123"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#7a819c] ml-1">Deposit Amount (DLs)</label>
                      <input 
                        type="number" 
                        value={growAmount || ''}
                        onChange={(e) => setGrowAmount(Number(e.target.value))}
                        min="1"
                        className="w-full bg-[#171c28] border border-[#232938] focus:border-blue-500/50 rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none transition-all font-bold text-lg"
                        placeholder="50"
                      />
                    </div>
                    
                    <button 
                      onClick={handleGrowtopiaRequest}
                      disabled={!growId || loading}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Drop World'}
                    </button>
                  </div>
                )}
              </div>
            ) : tab === 'crypto' && invoice ? (
              /* Crypto Deposit Active Invoice */
              <div className="space-y-6">
                <button onClick={() => setInvoice(null)} className="text-sm text-[#7a819c] hover:text-white flex items-center gap-2 mb-4">
                   &larr; Back to Methods
                </button>
                <div className="bg-[#161a24] p-6 rounded-2xl border border-[#232938] text-center">
                  <div className="mb-6">
                    <p className="text-[#7a819c] text-sm font-bold mb-2">Send exactly</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-black text-white">{invoice.pay_amount}</span>
                      <span className="text-xl font-bold text-blue-400">{invoice.pay_currency}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0c0e14] p-4 rounded-xl border border-[#232938] mb-6 flex flex-col gap-2 items-center">
                    <p className="text-[#7a819c] text-xs font-bold uppercase w-full text-left">Scan or Copy Address</p>
                    <div className="bg-white p-3 rounded-xl mb-2 mt-2 inline-block">
                      <QRCode value={invoice.pay_address} size={150} level="M" />
                    </div>
                    <span className="text-white font-mono break-all text-sm w-full">{invoice.pay_address}</span>
                    <button 
                      onClick={() => copyToClipboard(invoice.pay_address)}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-[#7a819c] font-bold">
                    <Loader2 className="animate-spin" size={16} />
                    Waiting for payment...
                  </div>
                </div>
              </div>
            ) : tab === 'crypto' && cryptoCurrency ? (
              /* Crypto Amount Form */
              <div className="space-y-6">
                <button onClick={() => setCryptoCurrency('')} className="text-sm text-[#7a819c] hover:text-white flex items-center gap-2 mb-4">
                   &larr; Back to Methods
                </button>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7a819c] ml-1 flex justify-between">
                    <span>Amount in USD</span>
                    <span className="text-emerald-400 font-bold">{Math.floor((cryptoAmount / 2.6) * 100).toLocaleString()} DLs</span>
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
                      className="w-full bg-[#171c28] border border-[#232938] focus:border-blue-500/50 rounded-xl pl-8 pr-4 py-4 text-white placeholder-white/20 outline-none transition-all font-bold text-xl"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCryptoRequest}
                  disabled={cryptoAmount < 1 || loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Address'}
                </button>
              </div>
            ) : tab === 'crypto' && !cryptoCurrency ? (
              /* Deposit Method Selection Menu (Replaces old 'crypto' root) */
              <div className="space-y-8">
                {/* In Game */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">In Game</h3>
                  <button 
                    onClick={() => setTab('growtopia')}
                    className="flex items-center gap-3 bg-[#171c28] hover:bg-[#1e2434] transition-colors p-4 rounded-xl w-1/2 border border-[#232938]"
                  >
                    <Gamepad2 className="text-blue-400" size={24} />
                    <span className="text-white font-bold text-sm">Growtopia</span>
                  </button>
                </div>

                {/* Crypto */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Crypto</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CRYPTO_OPTIONS.map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => {
                          setCryptoCurrency(coin.id);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors bg-[#171c28] border-[#232938] hover:bg-[#1e2434]`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${coin.color} bg-[#11141d]`}>
                          {coin.icon}
                        </div>
                        <span className="text-white font-bold text-sm">{coin.ticker}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gift Cards */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Gift Cards</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <CreditCard size={20} /> Visa
                    </button>
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <CreditCard size={20} /> Mastercard
                    </button>
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <Apple size={20} /> Apple Pay
                    </button>
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <span className="font-bold">G</span> Google Pay
                    </button>
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <Landmark size={20} /> Bank Transfer
                    </button>
                    <button className="flex items-center gap-3 bg-[#171c28] p-4 rounded-xl border border-[#232938] text-white font-bold text-sm">
                      <LockIcon size={20} /> Paysafecard
                    </button>
                  </div>
                  <button className="w-full bg-[#171c28] hover:bg-[#1e2434] transition-colors p-4 rounded-xl border border-[#232938] flex justify-center items-center gap-2 text-white font-bold text-sm mt-2">
                    <CheckCircle2 size={18} /> Claim a gift card
                  </button>
                </div>
              </div>
            ) : tab === 'withdraw' && !withdrawMethod ? (
              /* Withdraw Method Selection Menu */
              <div className="space-y-8">
                {/* In Game */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">In Game</h3>
                  <button 
                    onClick={() => setWithdrawMethod('growtopia')}
                    className="flex items-center gap-3 bg-[#171c28] hover:bg-[#1e2434] transition-colors p-4 rounded-xl w-1/2 border border-[#232938]"
                  >
                    <Gamepad2 className="text-blue-400" size={24} />
                    <span className="text-white font-bold text-sm">Growtopia</span>
                  </button>
                </div>

                {/* Crypto */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Crypto</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CRYPTO_OPTIONS.map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => setWithdrawMethod(coin.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors bg-[#171c28] border-[#232938] hover:bg-[#1e2434]`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${coin.color} bg-[#11141d]`}>
                          {coin.icon}
                        </div>
                        <span className="text-white font-bold text-sm">{coin.ticker}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setWithdrawMethod('')} className="text-sm text-[#7a819c] hover:text-white flex items-center gap-2">
                     &larr; Back to Methods
                  </button>
                  <div className="px-3 py-1 bg-[#1e293b] rounded-lg text-white text-xs font-bold border border-white/10 uppercase tracking-wider">
                    {withdrawMethod === 'growtopia' ? 'Growtopia' : CRYPTO_OPTIONS.find(c => c.id === withdrawMethod)?.name || withdrawMethod}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7a819c] ml-1 flex justify-between">
                    <span>Amount (DLs)</span>
                    {withdrawMethod !== 'growtopia' && (
                      <span className="text-emerald-400 font-bold">≈ ${(withdrawAmount / 2.6).toFixed(2)} USD</span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    min="50"
                    className="w-full bg-[#171c28] border border-[#232938] focus:border-blue-500/50 rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none transition-all font-bold text-lg"
                    placeholder="Min 50"
                  />
                  <p className="text-xs text-[#7a819c] ml-1">Minimum withdrawal: 50 DLs</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7a819c] ml-1">
                    {withdrawMethod === 'growtopia' ? 'Your In-Game GrowID' : `${CRYPTO_OPTIONS.find(c => c.id === withdrawMethod)?.ticker || withdrawMethod.toUpperCase()} Address`}
                  </label>
                  <input 
                    type="text" 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-[#171c28] border border-[#232938] focus:border-blue-500/50 rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none transition-all font-medium"
                    placeholder={withdrawMethod === 'growtopia' ? "e.g. JohnDoe123" : "Paste wallet address here..."}
                  />
                </div>

                <button 
                  onClick={handleWithdrawRequest}
                  disabled={withdrawAmount < 50 || !withdrawAddress || loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : `Request ${withdrawMethod === 'growtopia' ? 'Trade' : 'Transfer'}`}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

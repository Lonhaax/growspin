'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/auth';

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
}

export default function DepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'growtopia' | 'crypto'>('growtopia');

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
            setSuccessMsg(`Deposit Successful! Received ${data.intent.amount / 100} DLs.`);
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
              setInvoice({ ...invoice, status: 'finished' });
              setSuccessMsg(`Crypto Deposit Successful! Received ${data.invoice.dlsCredited / 100} DLs.`);
              clearInterval(interval);
            } else if (data.invoice.status === 'failed') {
              setInvoice({ ...invoice, status: 'failed' });
              setError('Crypto deposit failed or expired.');
              clearInterval(interval);
            }
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [invoice]);

  if (!isOpen) return null;

  const handleGrowtopiaRequest = async () => {
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
      setError('Network error. Check if NowPayments API Key is set.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1b2e] w-full max-w-md rounded-2xl border border-white/10 p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">Deposit Funds</h2>

        {successMsg ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h3 className="text-xl font-bold text-white mb-2">{successMsg}</h3>
            <button onClick={onClose} className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-black/40 rounded-xl p-1 mb-6">
              <button
                onClick={() => setTab('growtopia')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'growtopia' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'}`}
              >
                Growtopia Bot
              </button>
              <button
                onClick={() => setTab('crypto')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'crypto' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'}`}
              >
                Crypto
              </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            {/* Growtopia Tab */}
            {tab === 'growtopia' && (
              intent ? (
                <div className="space-y-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-white/60 text-sm mb-1">Go to world</p>
                    <p className="text-3xl font-black text-indigo-400 tracking-wider uppercase">{intent.worldName}</p>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-white/60 text-sm mb-1">And DROP your DLs for</p>
                    <p className="text-xl font-bold text-white">{intent.botName}</p>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-indigo-400">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                    <span className="ml-2 font-medium">Waiting for drop...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Your GrowID</label>
                    <input 
                      type="text" 
                      value={growId}
                      onChange={(e) => setGrowId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Enter your exact GrowID"
                    />
                  </div>
                  <button 
                    onClick={handleGrowtopiaRequest}
                    disabled={!growId || loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
                  >
                    {loading ? 'Generating...' : 'Generate Deposit World'}
                  </button>
                </div>
              )
            )}

            {/* Crypto Tab */}
            {tab === 'crypto' && (
              invoice ? (
                <div className="space-y-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-white/60 text-sm mb-1">Send EXACTLY</p>
                    <p className="text-2xl font-black text-accent-green uppercase">{invoice.pay_amount} {invoice.pay_currency}</p>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-white/60 text-sm mb-1">To Address</p>
                    <p className="text-sm font-mono text-white break-all">{invoice.pay_address}</p>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-accent-green">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-bounce delay-200"></div>
                    <span className="ml-2 font-medium">Waiting for confirmations...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Amount in USD (1 USD = 2 DLs)</label>
                    <input 
                      type="number" 
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(Number(e.target.value))}
                      min="1"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-green"
                      placeholder="Amount in USD"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Cryptocurrency</label>
                    <select 
                      value={cryptoCurrency}
                      onChange={(e) => setCryptoCurrency(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-green"
                    >
                      <option value="ltc">Litecoin (LTC)</option>
                      <option value="btc">Bitcoin (BTC)</option>
                      <option value="eth">Ethereum (ETH)</option>
                      <option value="usdttrc20">USDT (TRC20)</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleCryptoRequest}
                    disabled={cryptoAmount < 1 || loading}
                    className="w-full py-3 bg-accent-green hover:bg-[#00c566] disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(0,230,118,0.4)]"
                  >
                    {loading ? 'Generating...' : 'Pay with Crypto'}
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

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

export default function GrowtopiaDepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [growId, setGrowId] = useState('');
  const [intent, setIntent] = useState<DepositIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Poll for status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (intent && intent.status === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await apiFetch('/deposit/status');
          const data = await res.json();
          if (data.intent && data.intent.status === 'COMPLETED') {
            setIntent(data.intent);
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [intent]);

  if (!isOpen) return null;

  const handleRequest = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1b2e] w-full max-w-md rounded-2xl border border-white/10 p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">Growtopia Deposit</h2>

        {intent?.status === 'COMPLETED' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h3 className="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
            <p className="text-white/60 mb-6">Received {intent.amount / 100} DLs.</p>
            <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">Close</button>
          </div>
        ) : intent ? (
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
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button 
              onClick={handleRequest}
              disabled={!growId || loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
            >
              {loading ? 'Generating...' : 'Generate Deposit World'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

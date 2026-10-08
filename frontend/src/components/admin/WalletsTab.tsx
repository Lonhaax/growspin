import { useState, useEffect } from "react";
import { Database, Wallet, Copy, CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/auth";

export default function WalletsTab() {
  const [totals, setTotals] = useState({ BTC: 0, LTC: 0, ETH: 0 });
  const [wallets, setWallets] = useState<{address: string, currency: string, balance: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/crypto/balances");
      if (res.ok) {
        const data = await res.json();
        setTotals(data.totals);
        setWallets(data.wallets);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Wallet className="text-indigo-500" /> Crypto HD Wallets
        </h2>
        <button 
          onClick={fetchWallets} 
          disabled={loading}
          className="bg-[#1b202e] hover:bg-[#232938] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Balances
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['BTC', 'LTC', 'ETH'].map(coin => (
          <div key={coin} className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] pointer-events-none transition-colors ${coin === 'BTC' ? 'bg-orange-500/10' : coin === 'ETH' ? 'bg-blue-500/10' : 'bg-slate-400/10'}`} />
            <p className="text-[#7a819c] font-black uppercase tracking-wider text-xs mb-2">Total {coin}</p>
            <p className="text-3xl font-black text-white font-mono">
              {(totals as any)[coin].toFixed(coin === 'ETH' ? 6 : 8)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl overflow-hidden">
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
          <Database className="text-cyan-500" size={18} /> Derived Addresses
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[#7a819c]">
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center p-12 text-[#7a819c] font-bold">
            No generated wallets found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#10131a] text-[#7a819c] font-black uppercase text-[10px] tracking-wider border-b border-[#202535]">
                <tr>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202535]">
                {wallets.map((w, i) => (
                  <tr key={i} className="hover:bg-[#151923] transition-colors">
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${w.currency === 'BTC' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : w.currency === 'ETH' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {w.currency}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[#7a819c] text-xs">
                      {w.address}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-white">
                      {w.balance.toFixed(w.currency === 'ETH' ? 6 : 8)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => copyToClipboard(w.address)}
                        className="text-[#7a819c] hover:text-white transition-colors"
                      >
                        {copied === w.address ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

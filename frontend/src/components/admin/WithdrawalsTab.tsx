"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine, RefreshCw, Check, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { useCustomModal } from "@/components/ui/CustomModal";

export default function WithdrawalsTab() {
  const { showSuccess, showError, showConfirm } = useCustomModal();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await apiFetch('/admin/withdrawals');
      if (res.ok) setWithdrawals(await res.json());
    } catch (e) {}
    setWithdrawalsLoading(false);
  };

  const executeApproveWithdrawal = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/withdrawals/${id}/approve`, { method: "POST" });
      if (res.ok) {
        showSuccess("Withdrawal approved!");
        fetchWithdrawals();
      } else throw new Error((await res.json()).error);
    } catch (e: any) { showError(e.message); }
    setLoading(false);
  };

  const handleApproveWithdrawal = (id: number) => {
    showConfirm("Confirm payout was sent manually?", () => executeApproveWithdrawal(id));
  };

  const executeRejectWithdrawal = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/withdrawals/${id}/reject`, { method: "POST" });
      if (res.ok) {
        showSuccess("Withdrawal rejected and refunded!");
        fetchWithdrawals();
      } else throw new Error((await res.json()).error);
    } catch (e: any) { showError(e.message); }
    setLoading(false);
  };

  const handleRejectWithdrawal = (id: number) => {
    showConfirm("Reject and refund DLs to player?", () => executeRejectWithdrawal(id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-1/3 h-32 bg-emerald-500/5 blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm">
              <ArrowDownToLine className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={20} /> Withdrawal Queue
            </h2>
            <p className="text-xs text-[#7f86a2] font-medium mt-1">
              Approve or reject manual withdrawal requests. Balances are already held in escrow.
            </p>
          </div>
          <button
            onClick={fetchWithdrawals}
            className="p-2.5 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-[#7f86a2] hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all shadow-lg"
          >
            <RefreshCw size={14} className={withdrawalsLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#1f2433] bg-[#0a0c12]/50 backdrop-blur-md relative z-10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0c0e14]/80 border-b border-[#1f2433] text-[#6b7391] uppercase tracking-wider font-black text-[10px]">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Player</th>
                <th className="py-4 px-5">Method</th>
                <th className="py-4 px-5">Address / Info</th>
                <th className="py-4 px-5">Amount</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b202e]/50">
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7f86a2] font-bold">No withdrawals found.</td>
                </tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-[#181c28]/80 transition-colors group/row">
                  <td className="py-4 px-5 text-[#7f86a2] font-semibold">{new Date(w.createdAt).toLocaleString()}</td>
                  <td className="py-4 px-5 font-black text-white group-hover/row:text-emerald-400 transition-colors">{w.user?.username || `User #${w.userId}`}</td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${w.method === 'crypto' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'} border`}>
                      {w.method}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-[#a0a8c0] font-mono text-[10px]">{w.address}</td>
                  <td className="py-4 px-5">
                    <DLCurrency amount={w.amount} size="xs" className="text-white font-bold" />
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      w.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    } border`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    {w.status === 'pending' && (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(w.id)}
                          disabled={loading}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition-all shadow-sm hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50"
                          title="Mark Approved"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(w.id)}
                          disabled={loading}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
                          title="Reject & Refund"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

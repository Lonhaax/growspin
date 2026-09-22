"use client";

import { useAuth } from "@/context/AuthContext";
import { getAccessToken, API_URL } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Coins, AlertTriangle, ShieldCheck } from "lucide-react";

export default function LoanPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user?.debtCreatedAt) {
      const debtDate = new Date(user.debtCreatedAt);
      const freezeDate = new Date(debtDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = freezeDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days > 0 ? days : 0);
    } else {
      setDaysRemaining(null);
    }
  }, [user]);

  const handleRepayAll = async () => {
    if (!user || (user.debt || 0) <= 0) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/loan/repay-all`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessage("Loan repaid successfully!");
        refreshUser();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to repay loan.");
      }
    } catch (e: any) {
      setError(e.message || "An error occurred.");
    }
    setLoading(false);
  };

  if (!user) return <div className="text-center py-20 text-white font-black">PLEASE LOGIN</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 pt-10 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-white tracking-widest uppercase flex items-center justify-center gap-3">
          <Coins className="text-amber-400" size={32} />
          Loan Repayment
        </h1>
        <p className="text-[#7a819c] font-bold max-w-lg mx-auto">
          Manage your borrowed items and credit debt. Failure to repay your loans within 5 days will result in an account freeze.
        </p>
      </div>

      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center gap-6">
          
          <div className="text-center">
            <div className="text-[#7a819c] font-bold mb-2 uppercase tracking-widest text-sm">Current Debt</div>
            <div className="text-5xl font-black text-white">${((user.debt || 0) / 100).toFixed(2)}</div>
          </div>

          {(user.debt || 0) > 0 && user.debtCreatedAt && (
            <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${user.isFrozen ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
              <AlertTriangle size={20} />
              {user.isFrozen ? (
                <span>Your account is currently FROZEN due to an unpaid loan.</span>
              ) : (
                <span>
                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining until account freeze.
                </span>
              )}
            </div>
          )}

          {(user.debt || 0) === 0 && (
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-500/20 text-green-500">
              <ShieldCheck size={20} />
              <span>You have no outstanding debt. Account is in good standing!</span>
            </div>
          )}

          <div className="w-full max-w-sm mt-4">
            <button
              onClick={handleRepayAll}
              disabled={loading || (user.debt || 0) <= 0 || user.mockBalance < (user.debt || 0)}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-colors uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              {loading ? "Processing..." : "Repay All Debt"}
            </button>
            {user.mockBalance < (user.debt || 0) && (user.debt || 0) > 0 && (
              <div className="text-center text-red-500 font-bold mt-3 text-sm">
                Insufficient balance to repay full debt. Please deposit funds.
              </div>
            )}
          </div>
          
          {message && <div className="text-green-500 font-bold mt-2">{message}</div>}
          {error && <div className="text-red-500 font-bold mt-2">{error}</div>}
        </div>
      </div>
    </div>
  );
}

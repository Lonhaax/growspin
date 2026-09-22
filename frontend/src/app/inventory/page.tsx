"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { Package, DollarSign, Loader2, HandCoins, Coins, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

type UserItem = {
  id: number;
  name: string;
  value: number;
  color: string;
  status: string;
  isBorrowed?: boolean;
  borrowPrice?: number;
  createdAt: string;
  imageUrl?: string;
};

export default function InventoryPage() {
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelling, setIsSelling] = useState(false);
  const [repayingId, setRepayingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await apiFetch("/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSell = async () => {
    if (selectedIds.length === 0 || isSelling) return;
    setIsSelling(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/inventory/sell", {
        method: "POST",
        body: JSON.stringify({ itemIds: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Successfully sold
      setSelectedIds([]);
      await fetchInventory(); // Refresh items
      await refreshUser(); // Refresh balance
      setSuccessMsg(`Successfully sold ${data.soldCount} item(s)!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to sell items");
    } finally {
      setIsSelling(false);
    }
  };

  const handleRepay = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (repayingId) return;
    setRepayingId(itemId);
    setError("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/inventory/repay", {
        method: "POST",
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchInventory();
      await refreshUser();
      setSuccessMsg("Loan repaid! Item is now 100% owned.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to repay loan");
    } finally {
      setRepayingId(null);
    }
  };

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
        <Package size={64} className="text-[#7a819c]" />
        <h2 className="text-2xl font-bold text-white">Login to view your inventory</h2>
        <button onClick={() => openAuthModal("login")} className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl shadow-lg">Login</button>
      </div>
    );
  }

  const activeItems = items.filter(i => i.status === "inventory");
  const totalSelectedValue = activeItems.filter(i => selectedIds.includes(i.id)).reduce((acc, i) => acc + i.value, 0);
  const totalSelectedNetPayout = activeItems
    .filter(i => selectedIds.includes(i.id))
    .reduce((acc, i) => acc + (i.isBorrowed ? Math.max(0, i.value - (i.borrowPrice || 0)) : i.value), 0);
  const hasBorrowedSelected = activeItems.some(i => selectedIds.includes(i.id) && i.isBorrowed);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131620] border border-[#222738] p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-lg">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Player Inventory</h1>
            <p className="text-xs text-[#7f86a2] font-medium">
              Manage, inspect, and quick-sell items unboxed from cases, battles, and loans.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {user?.debt !== undefined && user.debt > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs">
              <HandCoins size={15} className="text-amber-400" />
              <span className="text-[#8e95ad] font-bold">Active Case Loan:</span>
              <DLCurrency amount={user.debt} size="xs" className="text-amber-300 font-black" />
            </div>
          )}

          {activeItems.length > 0 && (
            <>
              <button
                onClick={() => {
                  if (selectedIds.length === activeItems.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(activeItems.map((i) => i.id));
                  }
                }}
                className="px-4 py-2 bg-[#1b1f2c] hover:bg-[#232838] border border-[#2c3245] text-white text-xs font-bold rounded-xl transition-colors"
              >
                {selectedIds.length === activeItems.length ? "Deselect All" : "Select All Items"}
              </button>
              <div className="bg-[#0c0e14] px-4 py-2 rounded-xl border border-[#202535] text-xs">
                <span className="text-[#646b85] font-semibold">Total Items: </span>
                <span className="text-white font-black">{activeItems.length}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-accent-green/20 border border-accent-green/40 text-accent-green font-bold text-xs p-3 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs p-3 rounded-2xl text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-cyan-400" size={48} />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="bg-[#12141c] border border-[#1f2433] rounded-3xl p-16 text-center shadow-xl">
          <Package className="mx-auto text-[#4d5366] mb-4" size={56} />
          <h3 className="text-xl font-black text-white mb-2">Your inventory is empty</h3>
          <p className="text-sm text-[#7f86a2] max-w-sm mx-auto mb-6">
            Open cases or enter multiplayer Case Battles to win rare Growtopia items!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {activeItems.map((item) => {
              const isBorrowed = item.isBorrowed;
              const loan = item.borrowPrice || 0;
              const netProfit = Math.max(0, item.value - loan);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={() => toggleSelect(item.id)}
                  className={`relative cursor-pointer bg-[#1f222b] border-2 rounded-2xl p-4 flex flex-col items-center text-center transition-all shadow-lg ${
                    selectedIds.includes(item.id) 
                      ? "border-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-[#2563eb]/10" 
                      : isBorrowed
                      ? "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      : "border-[#2a2d3a] hover:border-[#3a3d4a]"
                  }`}
                >
                  {/* Borrowed Pill Badge */}
                  {isBorrowed && (
                    <div className="absolute top-2.5 left-2.5 z-20 bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <HandCoins size={10} /> Borrowed
                    </div>
                  )}

                  {/* Glow behind image based on rarity color */}
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 blur-2xl rounded-full opacity-30" 
                    style={{ backgroundColor: item.color }} 
                  />
                  
                  {/* Visual placeholder for the item */}
                  <div 
                    className="w-20 h-20 mb-3 rounded-lg flex items-center justify-center border border-white/10 shadow-inner z-10 p-2 mt-3"
                    style={{ background: `linear-gradient(135deg, ${item.color}40, transparent)` }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Package size={32} style={{ color: item.color }} />
                    )}
                  </div>
                  
                  <h3 className="text-xs font-bold text-white mb-1 z-10 truncate w-full px-1" title={item.name}>{item.name}</h3>
                  <div className="z-10 flex items-center justify-center">
                    <DLCurrency amount={item.value} size="xs" className="font-black text-white" />
                  </div>

                  {isBorrowed && (
                    <div className="mt-2 w-full pt-2 border-t border-white/5 text-[10px] space-y-1 z-10">
                      <div className="text-amber-400 font-medium flex items-center justify-between">
                        <span>Loan:</span>
                        <span>{(loan / 100).toFixed(2)} DL</span>
                      </div>
                      <div className="text-accent-green font-bold flex items-center justify-between">
                        <span>Net if sold:</span>
                        <span>+{(netProfit / 100).toFixed(2)} DL</span>
                      </div>
                      <button
                        onClick={(e) => handleRepay(item.id, e)}
                        disabled={repayingId === item.id || (user?.mockBalance || 0) < loan}
                        title={((user?.mockBalance || 0) < loan) ? `Need ${(loan / 100).toFixed(2)} DLs in balance` : "Pay off loan to own item permanently"}
                        className="w-full mt-1.5 py-1 px-2 bg-[#2a1d40] hover:bg-[#382658] border border-purple-500/40 text-purple-300 font-bold rounded-lg text-[9px] transition-all disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Coins size={10} className="text-purple-400" />
                        {repayingId === item.id ? "Repaying..." : `Repay ${(loan / 100).toFixed(2)} DL`}
                      </button>
                    </div>
                  )}
                  
                  {/* Checkbox indicator */}
                  <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors z-20 ${
                    selectedIds.includes(item.id) ? "border-accent-blue bg-accent-blue" : "border-[#7a819c] bg-transparent"
                  }`}>
                    {selectedIds.includes(item.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#191c26] border border-accent-blue/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-6 z-50 w-11/12 max-w-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="bg-accent-blue/20 text-accent-blue font-bold px-3 py-1.5 rounded-lg text-xs">
                {selectedIds.length} Selected
              </div>
              <div>
                <div className="text-[11px] text-[#7a819c] uppercase font-bold flex items-center gap-1">
                  <span>Net DL Payout</span>
                  {hasBorrowedSelected && <span className="text-amber-400 font-normal lowercase">(loans settled first)</span>}
                </div>
                <div className="mt-0.5">
                  <DLCurrency amount={totalSelectedNetPayout} size="md" className="text-accent-green font-black" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIds([])}
                className="px-5 py-2.5 font-bold text-xs text-[#7a819c] hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={handleSell}
                disabled={isSelling}
                className="px-7 py-2.5 bg-gradient-to-r from-accent-green to-[#00e676] text-black font-black text-xs rounded-xl hover:shadow-[0_0_20px_rgba(0,230,118,0.5)] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {isSelling && <Loader2 size={15} className="animate-spin" />}
                <span>{hasBorrowedSelected ? "Sell & Settle" : "Sell Selected"}</span>
              </button>
            </div>
            {error && <div className="absolute -top-12 left-0 right-0 text-center text-red-500 font-bold bg-red-500/10 py-2 rounded-lg">{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

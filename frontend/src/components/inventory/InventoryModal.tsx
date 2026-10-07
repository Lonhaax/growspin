"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { Package, DollarSign, Loader2, HandCoins, Coins, CheckCircle2, X } from "lucide-react";
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

export function InventoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
    if (isOpen) {
      if (user) {
        setLoading(true);
        fetchInventory();
      } else {
        setLoading(false);
      }
    } else {
      setSelectedIds([]); // Clear selection when closed
    }
  }, [user, isOpen]);

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

  if (!isOpen) return null;

  if (!user && !loading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#131620] border border-[#222738] p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center space-y-6 max-w-sm w-full relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[#7a819c] hover:text-white">
              <X size={20} />
            </button>
            <Package size={64} className="text-[#7a819c]" />
            <h2 className="text-xl font-bold text-white text-center">Login to view your inventory</h2>
            <button onClick={() => { onClose(); openAuthModal("login"); }} className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl shadow-lg w-full">Login</button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const activeItems = items.filter(i => i.status === "inventory");
  const totalSelectedValue = activeItems.filter(i => selectedIds.includes(i.id)).reduce((acc, i) => acc + i.value, 0);
  const totalSelectedNetPayout = activeItems
    .filter(i => selectedIds.includes(i.id))
    .reduce((acc, i) => acc + (i.isBorrowed ? Math.max(0, i.value - (i.borrowPrice || 0)) : i.value), 0);
  const hasBorrowedSelected = activeItems.some(i => selectedIds.includes(i.id) && i.isBorrowed);

  type StackedItem = UserItem & { count: number; stackedIds: number[] };
  const stackedItemsMap = new Map<string, StackedItem>();
  activeItems.forEach(item => {
    const key = `${item.name}-${item.isBorrowed ? 'borrowed' : 'owned'}`;
    if (!stackedItemsMap.has(key)) {
      stackedItemsMap.set(key, { ...item, count: 1, stackedIds: [item.id] });
    } else {
      const stack = stackedItemsMap.get(key)!;
      stack.count += 1;
      stack.stackedIds.push(item.id);
    }
  });
  const stackedItems = Array.from(stackedItemsMap.values()).sort((a, b) => b.value - a.value);

  const handleStackClick = (stack: StackedItem) => {
    const allSelected = stack.stackedIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !stack.stackedIds.includes(id)));
    } else {
      const unselectedIds = stack.stackedIds.filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...unselectedIds]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0f111a] border border-[#222738] rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col relative my-8"
          style={{ maxHeight: '90vh' }}
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-[#7a819c] hover:text-white z-20">
            <X size={24} />
          </button>

          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131620] border-b border-[#222738] p-6 pt-8 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-lg shrink-0">
                <Package size={24} />
              </div>
              <div className="pr-12">
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

          {/* Success message banner */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-accent-green/20 border-b border-accent-green/30 px-6 py-3 shrink-0"
              >
                <div className="flex items-center justify-center gap-2 text-accent-green font-bold text-sm">
                  <CheckCircle2 size={16} />
                  {successMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items Grid */}
          <div className="p-6 overflow-y-auto flex-1 relative min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-accent-blue" size={32} />
              </div>
            ) : activeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#7a819c] space-y-4">
                <div className="w-20 h-20 bg-[#161a24] rounded-full flex items-center justify-center border border-[#2a2d3a]">
                  <Package size={32} className="opacity-50" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white mb-1">Your inventory is empty</p>
                  <p className="text-sm">Open cases or participate in battles to get items.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
                <AnimatePresence>
                  {stackedItems.map((stack) => {
                    const selectedCount = stack.stackedIds.filter(id => selectedIds.includes(id)).length;
                    const isAllSelected = selectedCount === stack.count;
                    const isPartiallySelected = selectedCount > 0 && !isAllSelected;
                    const isBorrowed = stack.isBorrowed;
                    const loan = stack.borrowPrice || 0;
                    const netProfit = isBorrowed ? Math.max(0, stack.value - loan) : stack.value;

                    return (
                      <motion.div
                        key={`${stack.name}-${isBorrowed ? 'borrowed' : 'owned'}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={() => handleStackClick(stack)}
                        className={`relative cursor-pointer bg-[#171a23] border-2 rounded-2xl flex flex-col overflow-hidden transition-all shadow-xl group hover:-translate-y-1 ${
                          selectedCount > 0
                            ? "border-accent-blue shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#2563eb]/10" 
                            : isBorrowed
                            ? "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "border-[#2a2d3a] hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                        }`}
                      >
                        {/* Background color gradient overlay */}
                        <div 
                          className="absolute inset-0 opacity-30 transition-opacity duration-300 group-hover:opacity-50 pointer-events-none"
                          style={{ background: `linear-gradient(180deg, transparent 20%, ${stack.color} 100%)` }}
                        />

                        {/* Stack Count Badge */}
                        {stack.count > 1 && (
                          <div className="absolute top-2.5 left-2.5 z-20 bg-black/60 backdrop-blur-md border border-white/10 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-lg">
                            x{stack.count}
                          </div>
                        )}

                        {/* Borrowed Pill Badge */}
                        {isBorrowed && (
                          <div className={`absolute top-2.5 ${stack.count > 1 ? 'left-[45px]' : 'left-2.5'} z-20 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-300 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-lg`}>
                            <HandCoins size={10} /> Borrowed
                          </div>
                        )}

                        {/* Checkbox indicator */}
                        <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors z-20 backdrop-blur-sm ${
                          isAllSelected ? "border-accent-blue bg-accent-blue" : isPartiallySelected ? "border-accent-blue bg-accent-blue/50" : "border-[#7a819c]/50 bg-black/40"
                        }`}>
                          {isAllSelected && <CheckCircle2 size={12} className="text-white" />}
                          {isPartiallySelected && <div className="text-[10px] font-black text-white leading-none">{selectedCount}</div>}
                        </div>

                        {/* Glow behind image based on rarity color */}
                        <div 
                          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 blur-[30px] rounded-full opacity-40 pointer-events-none transition-opacity duration-300 group-hover:opacity-60" 
                          style={{ backgroundColor: stack.color }} 
                        />
                        
                        {/* Visual placeholder for the item */}
                        <div className="relative pt-10 pb-6 px-4 flex items-center justify-center flex-1 z-10">
                          {stack.imageUrl ? (
                            <img src={stack.imageUrl.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(stack.imageUrl.replace(/^https?:\/\//, ''))}` : stack.imageUrl} alt={stack.name} className="w-24 h-24 object-contain filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:rotate-2 transition-all duration-300" />
                          ) : (
                            <Package size={48} className="filter drop-shadow-xl group-hover:scale-110 transition-transform duration-300" style={{ color: stack.color }} />
                          )}
                        </div>
                        
                        {/* Bottom Info area */}
                        <div className="relative bg-[#0c0e14]/80 backdrop-blur-md border-t border-white/5 p-3 flex flex-col items-center z-20 text-center shadow-[0_-5px_15px_rgba(0,0,0,0.3)] shrink-0">
                          <h3 className="text-[11px] font-black text-white mb-0.5 truncate w-full tracking-wide" title={stack.name}>{stack.name}</h3>
                          <div className="flex items-center justify-center bg-black/40 px-2 py-0.5 rounded-full border border-white/5 mb-1">
                            <DLCurrency amount={stack.value * stack.count} size="xs" className="font-bold text-white/90" />
                          </div>

                          {isBorrowed && (
                            <div className="w-full mt-1.5 pt-1.5 border-t border-white/5 text-[10px] space-y-1 text-left">
                              <div className="text-amber-400/90 font-medium flex items-center justify-between">
                                <span>Loan:</span>
                                <span>{(loan / 100).toFixed(2)} DL</span>
                              </div>
                              <div className="text-accent-green/90 font-bold flex items-center justify-between">
                                <span>Net:</span>
                                <span>+{((netProfit * stack.count) / 100).toFixed(2)} DL</span>
                              </div>
                              <button
                                onClick={(e) => handleRepay(stack.stackedIds[0], e)}
                                disabled={repayingId === stack.stackedIds[0] || (user?.mockBalance || 0) < loan}
                                title={((user?.mockBalance || 0) < loan) ? `Need ${(loan / 100).toFixed(2)} DLs in balance` : "Pay off loan to own 1 item permanently"}
                                className="w-full mt-1.5 py-1.5 px-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/40 hover:to-purple-500/40 border border-purple-500/40 hover:border-purple-500/60 text-purple-300 hover:text-white font-bold rounded-lg text-[9px] transition-all disabled:opacity-40 disabled:hover:from-purple-600/20 disabled:hover:to-purple-500/20 flex items-center justify-center gap-1 cursor-pointer shadow-lg"
                              >
                                <Coins size={10} className="text-purple-400" />
                                {repayingId === stack.stackedIds[0] ? "Repaying..." : `Repay 1`}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Floating Action Bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#191c26] border border-accent-blue/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-6 z-50 w-11/12 max-w-2xl backdrop-blur-md"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, X, Hash } from "lucide-react";
import { apiFetch } from "@/lib/auth";

export function ProvablyFairModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [seedData, setSeedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newClientSeed, setNewClientSeed] = useState("");

  const fetchSeed = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/provably-fair/current");
      if (res.ok) {
        const data = await res.json();
        setSeedData(data);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSeed();
    }
  }, [isOpen]);

  const handleRotate = async () => {
    if (!newClientSeed) return;
    setRotating(true);
    try {
      const res = await apiFetch("/provably-fair/rotate", {
        method: "POST",
        body: JSON.stringify({ clientSeed: newClientSeed })
      });
      if (res.ok) {
        setNewClientSeed("");
        await fetchSeed();
      }
    } catch (e) {}
    setRotating(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#1f222b] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#7a819c] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Provably Fair</h2>
              <p className="text-xs text-[#7a819c]">Verify the fairness of your rolls mathematically.</p>
            </div>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-[#7a819c]">Loading seed data...</div>
          ) : seedData ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block flex items-center gap-2">
                    <Hash size={14} /> Server Seed Hash
                  </label>
                  <div className="bg-[#15181f] border border-[#2a2d3a] rounded-lg p-3 font-mono text-sm text-white break-all">
                    {seedData.serverSeedHash}
                  </div>
                  <p className="text-[10px] text-[#4d5366] mt-1">This is the hash of the server seed. The raw server seed is kept secret until rotated.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block flex items-center gap-2">
                    <Hash size={14} /> Client Seed
                  </label>
                  <div className="bg-[#15181f] border border-[#2a2d3a] rounded-lg p-3 font-mono text-sm text-white break-all">
                    {seedData.clientSeed}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block flex items-center gap-2">
                    <Hash size={14} /> Nonce
                  </label>
                  <div className="bg-[#15181f] border border-[#2a2d3a] rounded-lg p-3 font-mono text-sm text-white">
                    {seedData.nonce}
                  </div>
                  <p className="text-[10px] text-[#4d5366] mt-1">Number of bets made with the current seed pair.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#2a2d3a]">
                <h3 className="text-sm font-bold text-white mb-3">Rotate Seed Pair</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClientSeed}
                    onChange={(e) => setNewClientSeed(e.target.value)}
                    placeholder="Enter new client seed..."
                    className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-lg px-4 text-white font-mono text-sm focus:border-accent-blue outline-none"
                  />
                  <button
                    onClick={handleRotate}
                    disabled={rotating || !newClientSeed}
                    className="bg-accent-blue text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={rotating ? "animate-spin" : ""} />
                    Rotate
                  </button>
                </div>
                <p className="text-[10px] text-[#7a819c] mt-2">
                  Rotating will reveal your previous server seed so you can verify past bets.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-red-500">Failed to load seed data.</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

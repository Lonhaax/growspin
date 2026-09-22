"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { ShieldCheck, RefreshCw, Key, Hash } from "lucide-react";
import ProvablyFairVerifier from "@/components/ProvablyFairVerifier";

export default function ProvablyFairPage() {
  const { user, openAuthModal } = useAuth();
  
  const [currentPF, setCurrentPF] = useState<any>(null);
  const [previousPF, setPreviousPF] = useState<any>(null);
  
  const [newClientSeed, setNewClientSeed] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchCurrent();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCurrent = async () => {
    try {
      const res = await apiFetch("/provably-fair/current");
      if (res.ok) {
        const data = await res.json();
        setCurrentPF(data);
        setNewClientSeed(Math.random().toString(36).substring(2, 15));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!newClientSeed) return;
    setRotating(true);
    setError("");
    try {
      const res = await apiFetch("/provably-fair/rotate", {
        method: "POST",
        body: JSON.stringify({ newClientSeed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentPF(data.current);
      setPreviousPF(data.previous);
      setNewClientSeed(Math.random().toString(36).substring(2, 15));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRotating(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
        <ShieldCheck size={64} className="text-[#7a819c]" />
        <h2 className="text-2xl font-bold text-white">Login to view Provably Fair seeds</h2>
        <button onClick={() => openAuthModal("login")} className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl shadow-lg">Login</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-accent-green" size={32} />
        <div>
          <h1 className="text-3xl font-black text-white">Provably Fair</h1>
          <p className="text-[#7a819c]">Verify the cryptographic fairness of your rolls.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-accent-blue" size={32} /></div>
      ) : (
        <>
          <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2d3a] pb-4">Active Seed Pair</h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#7a819c] uppercase mb-2">
                  <Hash size={14} /> Server Seed Hash
                </label>
                <div className="bg-[#15181f] p-4 rounded-xl border border-[#2a2d3a] text-sm text-white font-mono break-all">
                  {currentPF?.serverHash}
                </div>
                <p className="text-xs text-[#7a819c] mt-2">The actual server seed is hidden to prevent outcome prediction.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#7a819c] uppercase mb-2">
                  <Key size={14} /> Client Seed
                </label>
                <div className="bg-[#15181f] p-4 rounded-xl border border-[#2a2d3a] text-sm text-white font-mono break-all">
                  {currentPF?.clientSeed}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#7a819c] uppercase mb-2">
                  <RefreshCw size={14} /> Nonce
                </label>
                <div className="bg-[#15181f] p-4 rounded-xl border border-[#2a2d3a] text-sm text-white font-mono break-all w-32 text-center text-xl font-black">
                  {currentPF?.nonce}
                </div>
                <p className="text-xs text-[#7a819c] mt-2">Increments every time you play a game.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1f222b] border border-[#2a2d3a] rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2d3a] pb-4">Rotate Client Seed</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newClientSeed}
                onChange={(e) => setNewClientSeed(e.target.value)}
                disabled={rotating}
                className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors font-mono"
              />
              <button
                onClick={handleRotate}
                disabled={rotating || !newClientSeed}
                className="px-8 py-3 bg-accent-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 whitespace-nowrap"
              >
                {rotating ? "Rotating..." : "Change Seed"}
              </button>
            </div>
            {error && <p className="text-red-500 mt-4 text-sm font-bold">{error}</p>}
          </div>

          {previousPF && (
            <div className="bg-accent-green/5 border border-accent-green/20 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-accent-green mb-6 border-b border-accent-green/20 pb-4">Previous Seed (Revealed)</h2>
              <p className="text-sm text-[#7a819c] mb-6">You can now verify that the server seed hash provided earlier matches this unhashed server seed.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Unhashed Server Seed</label>
                  <div className="bg-black/20 p-3 rounded-lg border border-accent-green/10 text-xs text-white font-mono break-all">
                    {previousPF.serverSeed}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Server Seed Hash</label>
                  <div className="bg-black/20 p-3 rounded-lg border border-accent-green/10 text-xs text-white font-mono break-all">
                    {previousPF.serverHash}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#7a819c] uppercase mb-1 block">Client Seed</label>
                  <div className="bg-black/20 p-3 rounded-lg border border-accent-green/10 text-xs text-white font-mono break-all">
                    {previousPF.clientSeed}
                  </div>
                </div>
              </div>
            </div>
          )}

          <ProvablyFairVerifier />
        </>
      )}
    </div>
  );
}

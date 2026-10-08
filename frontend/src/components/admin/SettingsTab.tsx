"use client";

import { useState, useEffect } from "react";
import { Settings2, HandCoins, Save } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { useCustomModal, CustomModal } from "@/components/ui/CustomModal";

export default function SettingsTab() {
  const { modalConfig, setModalConfig, showSuccess, showError, showConfirm } = useCustomModal();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/admin/settings");
      if (res.ok) setSettings(await res.json());
    } catch (e) { }
  };

  const handleWithdrawPot = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/pot/withdraw", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        showSuccess(`Successfully withdrew ${(data.amount / 100).toFixed(2)} from Casino Pot!`);
        if (settings) {
          setSettings({ ...settings, casinoPot: 0 });
        }
      } else {
        const err = await res.json();
        showError(err.error || "Failed to withdraw pot");
      }
    } catch (e: any) {
      showError(e.message);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PUT", body: JSON.stringify(settings)
      });
      if (res.ok) {
        showSuccess("Settings updated successfully!");
        setSettings(await res.json());
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) { 
      showError(e.message); 
    }
    setLoading(false);
  };

  if (!settings) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <CustomModal config={modalConfig} setConfig={setModalConfig} />
      {/* Casino Pot */}
      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 relative z-10">
          <Settings2 className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} /> Casino Pot
        </h2>
        <div className="p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] flex items-center justify-between relative z-10">
          <div>
            <div className="font-bold text-white text-2xl drop-shadow-sm">${((settings.casinoPot || 0) / 100).toFixed(2)}</div>
            <div className="text-xs text-[#7a819c] mt-1">Total pot accumulated from game edge and loan interest.</div>
          </div>
          <button
            onClick={handleWithdrawPot}
            disabled={loading || !settings.casinoPot || settings.casinoPot <= 0}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Global Configuration */}
      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 relative z-10">
          <Settings2 className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" size={20} /> Global Configuration
        </h2>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] transition-colors hover:border-[#2a3044]">
            <div>
              <div className="font-bold text-white text-sm">Maintenance Mode</div>
              <div className="text-xs text-[#7a819c] mt-1">Disable access for regular users.</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${settings.maintenanceMode ? 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-[#1b1f2c] border border-[#2a3044]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] transition-colors hover:border-[#2a3044]">
            <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2.5 tracking-widest">Mock Balance on Register ($)</label>
            <input
              type="number"
              value={settings.mockBalanceOnRegister / 100}
              onChange={e => setSettings({ ...settings, mockBalanceOnRegister: Math.floor(parseFloat(e.target.value) * 100) })}
              className="w-full bg-[#131620]/80 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
            />
          </div>

          <div className="p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] transition-colors hover:border-[#2a3044]">
            <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">XP Base (Scaling Rate)</label>
            <p className="text-[10px] text-white/40 mb-3">Controls how quickly players level up (default 1000). Lower = faster.</p>
            <input
              type="number"
              value={settings.xpBase ?? 1000}
              onChange={e => setSettings({ ...settings, xpBase: parseInt(e.target.value) || 1000 })}
              className="w-full bg-[#131620]/80 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Case Borrowing Configuration */}
      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-[80px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 relative z-10">
          <HandCoins className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={20} /> Case Borrowing & Credit Limit
        </h2>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] transition-colors hover:border-[#2a3044]">
            <div>
              <div className="font-bold text-white text-sm">Enable Borrow System</div>
              <div className="text-xs text-[#7a819c] mt-1">Permit players to spin cases on debt/credit without upfront DLs.</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, borrowEnabled: !settings.borrowEnabled })}
              className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${settings.borrowEnabled ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-[#1b1f2c] border border-[#2a3044]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${settings.borrowEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-5 bg-[#0a0c12]/50 backdrop-blur-md rounded-2xl border border-[#1f2433] transition-colors hover:border-[#2a3044]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-black text-[#7a819c] uppercase tracking-widest">Global Max Credit Limit Ceiling (DLs)</label>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Default: 1,000 DLs</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={(settings.maxBorrowLimit ?? 100000) / 100}
                onChange={e => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  setSettings({ ...settings, maxBorrowLimit: Math.round(val * 100) });
                }}
                className="w-full bg-[#131620]/80 border border-[#202535] rounded-xl pl-4 pr-12 py-3 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#7a819c] tracking-widest uppercase">DLs</span>
            </div>
            <div className="text-[11px] text-[#7a819c] mt-4 space-y-1.5 p-3 bg-[#131620]/50 rounded-xl border border-[#1f2433]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                <p>Players start with a baseline credit limit of <strong className="text-white">100 DLs</strong>.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                <p>Limit scales: <strong className="text-white">+10% wagered</strong> and <strong className="text-white">+10 DLs/level</strong>, capped at this global ceiling.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-2 relative z-20">
        <button 
          onClick={handleSaveSettings} 
          disabled={loading} 
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-black text-sm tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 border border-white/10"
        >
          <Save size={18} /> {loading ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>
    </div>
  );
}

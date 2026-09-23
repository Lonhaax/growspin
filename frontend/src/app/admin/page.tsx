"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { Settings, Shield, Edit, Plus, Save, PackageOpen, Dice1, Settings2, Hash, AlertTriangle, Users, Trash2, Key, Database, RefreshCw, Search, Check, HandCoins, Activity } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import AdvancedCaseCreator from "@/components/admin/AdvancedCaseCreator";
import ItemManager from "@/components/admin/ItemManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { Image as ImageIcon } from "lucide-react";
export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"players" | "cases" | "settings" | "studio" | "items" | "analytics">("players");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  const [cases, setCases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemSearchCache, setItemSearchCache] = useState<any[]>([]);

  // Editing Case state
  const [editingCase, setEditingCase] = useState<any>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  const fetchUsers = async (search = "") => {
    setUsersLoading(true);
    try {
      const res = await apiFetch(`/admin/users?q=${encodeURIComponent(search)}`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
    setUsersLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/admin/settings");
      if (res.ok) setSettings(await res.json());
      const resCases = await apiFetch("/cases");
      if (resCases.ok) setCases(await resCases.json());
    } catch (e) { }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings();
      fetchUsers();
    }
  }, [user]);

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const payload: any = {
        username: editingUser.username,
        role: editingUser.role,
        mockBalance: Math.round(parseFloat(editingUser.mockBalanceDL) * 100),
        level: parseInt(editingUser.level),
        xp: parseInt(editingUser.xp),
        rakebackBalance: Math.round(parseFloat(editingUser.rakebackBalanceDL) * 100),
        totalWagered: Math.round(parseFloat(editingUser.totalWageredDL) * 100),
      };
      if (editingUser.newPassword) {
        payload.newPassword = editingUser.newPassword;
      }

      const res = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccess(`Player ${editingUser.username} updated!`);
        setEditingUser(null);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to completely delete player "${username}"? All items and history will be purged.`)) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess(`Player ${username} deleted.`);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleTriggerRain = async () => {
    const amountStr = prompt("Enter amount of DLs to drop in Chat Rain:", "1000");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
    
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await apiFetch("/admin/chat/rain", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Successfully dropped ${amount} DLs on ${data.users} active chatters!`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to trigger rain");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleWithdrawPot = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await apiFetch("/admin/pot/withdraw", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Successfully withdrew ${(data.amount / 100).toFixed(2)} from Casino Pot!`);
        if (settings) {
          setSettings({ ...settings, casinoPot: 0 });
        }
      } else {
        const err = await res.json();
        setError(err.error || "Failed to withdraw pot");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PUT", body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess("Settings updated successfully!");
        setSettings(await res.json());
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleSearchGrowtopia = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/growtopia/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        setItemSearchCache(await res.json());
      }
    } catch (e) { }
    setLoading(false);
  };

  const handleAutoBalanceRTP = () => {
    if (!editingCase) return;
    const target = prompt("Enter Target RTP % (e.g. 92):", "92");
    if (!target) return;
    const targetRtp = parseFloat(target);
    if (isNaN(targetRtp) || targetRtp <= 0) return alert("Invalid RTP.");
    
    const parsedPrice = parseFloat(editingCase.price) || 0;
    if (parsedPrice <= 0) return alert("Please set a case price first.");
    if (editingCase.items.length < 2) return alert("You need at least 2 items to balance.");
    
    const targetEV = (targetRtp / 100) * parsedPrice;
    
    const values = editingCase.items.map((i: any) => parseFloat(i.value) || 0);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    
    if (targetEV <= minV || targetEV >= maxV) {
      return alert(`Cannot balance to ${targetRtp}% RTP.\nThe Target Average Value is $${targetEV.toFixed(2)}.\nBut your items range from $${minV.toFixed(2)} to $${maxV.toFixed(2)}.\nPlease add more items or change the case price.`);
    }

    let low = -25, high = 25;
    let bestBeta = 0;
    for (let i = 0; i < 60; i++) {
        let mid = (low + high) / 2;
        let w_sum = 0, ev_sum = 0;
        for (let item of editingCase.items) {
            let val = parseFloat(item.value) || 0;
            let v_scaled = val / maxV;
            let w = Math.exp(mid * v_scaled);
            w_sum += w;
            ev_sum += w * val;
        }
        let ev = ev_sum / w_sum;
        if (ev < targetEV) low = mid;
        else high = mid;
        bestBeta = mid;
    }

    let w_sum_final = 0;
    let raw_weights = editingCase.items.map((item: any) => {
        let val = parseFloat(item.value) || 0;
        let v_scaled = val / maxV;
        let w = Math.exp(bestBeta * v_scaled);
        w_sum_final += w;
        return w;
    });

    const newItems = editingCase.items.map((item: any, idx: number) => ({
      ...item,
      weight: ((raw_weights[idx] / w_sum_final) * 100000).toFixed(4).replace(/\.?0+$/, '')
    }));

    setEditingCase({ ...editingCase, items: newItems });
  };

  const handleSaveCase = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const payload = {
        ...editingCase,
        price: Math.round((parseFloat(editingCase.price) || 0) * 100),
        items: editingCase.items.map((i: any) => ({
          ...i,
          value: Math.round((parseFloat(i.value) || 0) * 100),
          weight: parseFloat(i.weight) || 0,
          isLuckyStarItem: !!i.isLuckyStarItem
        }))
      };

      if (isCreatingCase) {
        const res = await apiFetch("/admin/cases", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) { setSuccess("Case created!"); setIsCreatingCase(false); setEditingCase(null); fetchSettings(); }
        else throw new Error((await res.json()).error);
      } else {
        const res = await apiFetch(`/admin/cases/${editingCase.id}`, { method: "PUT", body: JSON.stringify(payload) });
        if (res.ok) { setSuccess("Case updated!"); setEditingCase(null); fetchSettings(); }
        else throw new Error((await res.json()).error);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleDeleteCase = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/cases/${id}`, { method: "DELETE" });
      if (res.ok) fetchSettings();
    } catch (e) { }
    setLoading(false);
  };

  if (user?.role !== 'admin') return <div className="text-center py-20 text-red-500 font-black">UNAUTHORIZED</div>;
  if (!settings) return <div className="text-center py-20 text-[#7a819c] font-black">LOADING...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 bg-[#131620] p-6 rounded-3xl border border-[#222738] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <Shield size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Control Room</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Database size={12} /> MySQL Active
              </span>
            </div>
            <p className="text-[#7f86a2] font-medium mt-0.5 text-xs">
              Live MySQL database control: edit player balances, roles, VIP stats, and site configuration.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-[#0c0e14] p-1 rounded-2xl border border-[#202535]">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "players"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Users size={15} />
            <span>Players ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "cases"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <PackageOpen size={15} />
            <span>Cases ({cases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "settings"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Settings2 size={15} />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "studio"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <ImageIcon size={15} />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "items"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Database size={15} />
            <span>Items</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "analytics"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Activity size={15} />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl border font-bold text-xs text-center ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-accent-green/10 border-accent-green/20 text-accent-green'}`}>
          {error || success}
        </div>
      )}

      {/* TAB 1: PLAYER MANAGEMENT */}
      {activeTab === "players" && (
        <div className="space-y-6">
          <div className="bg-[#131620] border border-[#222738] rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="text-cyan-400" size={20} /> Registered Players
                </h2>
                <p className="text-xs text-[#7f86a2] font-medium mt-0.5">
                  Direct live MySQL user table records. Change balances, reset passwords, promote roles.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#585e75]" size={14} />
                  <input
                    type="text"
                    placeholder="Search player username..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      fetchUsers(e.target.value);
                    }}
                    className="bg-[#0c0e14] border border-[#202535] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#585e75] focus:outline-none focus:border-cyan-400 font-semibold"
                  />
                </div>
                <button
                  onClick={() => fetchUsers(userSearch)}
                  className="p-2.5 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-[#7f86a2] hover:text-white transition-colors"
                  title="Refresh Players"
                >
                  <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={handleTriggerRain}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-xs font-bold shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  <AlertTriangle size={14} /> Drop Rain
                </button>
              </div>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#1f2433]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0c0e14] border-b border-[#1f2433] text-[#6b7391] uppercase tracking-wider font-black text-[10px]">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Username</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Balance</th>
                    <th className="py-3.5 px-4">Level / XP</th>
                    <th className="py-3.5 px-4">Total Wagered</th>
                    <th className="py-3.5 px-4">Rakeback</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202e]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#181c28] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#646b85]">#{u.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-white text-sm">{u.username}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <DLCurrency amount={u.mockBalance} size="xs" className="text-white" />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#a0a5b8]">
                        Lvl {u.level} <span className="text-[10px] text-[#646b85]">({u.xp} XP)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <DLCurrency amount={u.totalWagered} size="xs" className="text-[#a0a5b8]" />
                      </td>
                      <td className="py-3.5 px-4">
                        <DLCurrency amount={u.rakebackBalance} size="xs" className="text-emerald-400" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser({
                              id: u.id,
                              username: u.username,
                              role: u.role,
                              mockBalanceDL: (u.mockBalance / 100).toString(),
                              level: u.level.toString(),
                              xp: u.xp.toString(),
                              rakebackBalanceDL: (u.rakebackBalance / 100).toString(),
                              totalWageredDL: (u.totalWagered / 100).toString(),
                              newPassword: ""
                            })}
                            className="px-3 py-1.5 bg-[#1b1f2c] hover:bg-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 border border-[#2a3044] rounded-lg font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          {user?.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                              title="Purge Player"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* EDIT PLAYER MODAL / PANEL */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#131620] border border-[#262c3f] rounded-3xl p-8 w-full max-w-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#202535]">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Edit size={18} className="text-cyan-400" /> Edit Player: {editingUser.username}
                    </h3>
                    <p className="text-xs text-[#7f86a2] mt-0.5">Modify database attributes and commit to MySQL immediately.</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-[#646b85] hover:text-white text-xs font-black uppercase"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">Username</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest flex items-center gap-1">
                      <span>Balance (DL)</span>
                      <img src="/dl.webp" alt="DL" className="w-3.5 h-3.5 object-contain" />
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingUser.mockBalanceDL}
                      onChange={(e) => setEditingUser({ ...editingUser, mockBalanceDL: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest flex items-center gap-1">
                      <span>Rakeback (DL)</span>
                      <img src="/dl.webp" alt="DL" className="w-3.5 h-3.5 object-contain" />
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingUser.rakebackBalanceDL}
                      onChange={(e) => setEditingUser({ ...editingUser, rakebackBalanceDL: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">Level (Max 100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingUser.level}
                      onChange={(e) => setEditingUser({ ...editingUser, level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)).toString() })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">XP Points</label>
                    <input
                      type="number"
                      value={editingUser.xp}
                      onChange={(e) => setEditingUser({ ...editingUser, xp: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest">Total Wagered (DL)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingUser.totalWageredDL}
                      onChange={(e) => setEditingUser({ ...editingUser, totalWageredDL: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1 tracking-widest flex items-center gap-1">
                      <Key size={11} /> Reset Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={editingUser.newPassword}
                      onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                      className="w-full bg-[#0c0e14] border border-[#202535] rounded-xl px-3.5 py-2.5 text-white font-bold placeholder-[#585e75]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 bg-[#1b1f2c] border border-[#2a3044] text-white font-bold rounded-xl text-xs hover:bg-[#222838] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={loading}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Commit Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL SETTINGS */}
      {activeTab === "settings" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Casino Pot */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <Settings2 className="text-amber-400" size={20} /> Casino Pot
          </h2>
          <div className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a] flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-2xl">${((settings.casinoPot || 0) / 100).toFixed(2)}</div>
              <div className="text-xs text-[#7a819c]">Total pot accumulated from game edge and loan interest.</div>
            </div>
            <button
              onClick={handleWithdrawPot}
              disabled={loading || !settings.casinoPot || settings.casinoPot <= 0}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Global Configuration */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <Settings2 className="text-accent-blue" size={20} /> Global Configuration
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <div>
                <div className="font-bold text-white">Maintenance Mode</div>
                <div className="text-xs text-[#7a819c]">Disable access for regular users.</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-[#2a2d3a]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${settings.maintenanceMode ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Mock Balance on Register ($)</label>
              <input
                type="number"
                value={settings.mockBalanceOnRegister / 100}
                onChange={e => setSettings({ ...settings, mockBalanceOnRegister: Math.floor(parseFloat(e.target.value) * 100) })}
                className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>
        </div>

        {/* Case Borrowing Configuration */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <HandCoins className="text-amber-400" size={20} /> Case Borrowing & Credit Limit
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <div>
                <div className="font-bold text-white">Enable Borrow System</div>
                <div className="text-xs text-[#7a819c]">Permit players to spin cases on debt/credit without upfront DLs.</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, borrowEnabled: !settings.borrowEnabled })}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.borrowEnabled ? 'bg-accent-green' : 'bg-[#2a2d3a]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${settings.borrowEnabled ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-[#7a819c] uppercase tracking-widest">Global Max Credit Limit Ceiling (DLs)</label>
                <span className="text-xs font-bold text-amber-400">Default: 1,000 DLs</span>
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
                  className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#7a819c]">DLs</span>
              </div>
              <div className="text-[11px] text-[#7a819c] mt-2 space-y-1">
                <div>Players start with a baseline credit limit of <strong>100 DLs</strong>.</div>
                <div>Their limit increases as they play: <strong>+10% of total wagered</strong> and <strong>+10 DLs per level</strong>, capped at this global ceiling.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slots Configuration */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <Dice1 className="text-emerald-500" size={20} /> Slots Configuration
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <div>
                <div className="font-bold text-white">Enable BGaming Slots</div>
                <div className="text-xs text-[#7a819c]">Allow users to play official BGaming slots.</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, slotsEnabled: !settings.slotsEnabled })}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.slotsEnabled ? 'bg-emerald-500' : 'bg-[#2a2d3a]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${settings.slotsEnabled ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-[#7a819c] uppercase tracking-widest">Slots House Edge (RTP Re-roll Rate)</label>
                <span className="text-xs font-bold text-emerald-400">Default: 5% (0.05)</span>
              </div>
              <div className="relative flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={settings.slotsHouseEdge ?? 0.05}
                  onChange={e => setSettings({ ...settings, slotsHouseEdge: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <span className="text-sm font-black text-white w-12 text-right">
                  {Math.round((settings.slotsHouseEdge ?? 0.05) * 100)}%
                </span>
              </div>
              <div className="text-[11px] text-[#7a819c] mt-2">
                Controls the percentage of winning slot spins that the house will "steal" by re-rolling the result on the backend until a loss occurs. A setting of 5% lowers the slot's baseline RTP by roughly 5%.
              </div>
            </div>
          </div>
        </div>

        {/* House Edge & Game Toggles */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <Dice1 className="text-purple-500" size={20} /> Games Configuration
          </h2>

          <div className="space-y-4">
            {['coinflip', 'roulette', 'mines'].map(game => (
              <div key={game} className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white capitalize">{game}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs text-[#7a819c] font-bold">
                      House Edge (%)
                      <input
                        type="number" step="0.1"
                        value={settings[`${game}HouseEdge`]}
                        onChange={e => setSettings({ ...settings, [`${game}HouseEdge`]: parseFloat(e.target.value) })}
                        className="w-16 bg-[#15181f] border border-[#2a2d3a] rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-accent-blue"
                      />
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [`${game}Enabled`]: !settings[`${game}Enabled`] })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings[`${game}Enabled`] ? 'bg-accent-green' : 'bg-[#2a2d3a]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings[`${game}Enabled`] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleSaveSettings} disabled={loading} className="w-full mt-6 py-4 bg-accent-blue text-white rounded-xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
            <Save size={20} /> Save Settings
          </button>
        </div>

      </div>
      )}

      {/* TAB 3: CASE MANAGEMENT */}
      {activeTab === "cases" && (
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <PackageOpen className="text-accent-green" size={20} /> Case Management
          </h2>
          <button
            onClick={() => { setEditingCase({ name: '', image: '', price: '', active: true, items: [] }); setIsCreatingCase(true); }}
            className="bg-accent-green text-black px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-[#00e676] transition-colors"
          >
            <Plus size={16} /> New Case
          </button>
        </div>

        {editingCase || isCreatingCase ? (
          <div className="bg-[#1f222b] p-6 rounded-2xl border border-[#2a2d3a] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white">{isCreatingCase ? 'Create Case' : 'Edit Case'}</h3>
              <button onClick={() => { setEditingCase(null); setIsCreatingCase(false); }} className="text-[#7a819c] font-bold text-sm hover:text-white">CANCEL</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Case Name</label>
                <input type="text" value={editingCase.name} onChange={e => setEditingCase({ ...editingCase, name: e.target.value })} className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Price ($ / DL)</label>
                <input type="number" step="any" value={editingCase.price} onChange={e => setEditingCase({ ...editingCase, price: e.target.value })} className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white font-bold" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">Case Image URL</label>
                <input type="text" value={editingCase.image} onChange={e => setEditingCase({ ...editingCase, image: e.target.value })} className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white font-bold" />
              </div>
            </div>

            <div className="border-t border-[#2a2d3a] pt-6">
              <h4 className="text-white font-bold mb-4">Add Items via Growtopia Search</h4>
              <div className="flex gap-2 mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Growtopia Wiki..." className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2 text-white font-bold text-sm" />
                <button onClick={handleSearchGrowtopia} className="bg-accent-blue text-white px-4 py-2 rounded-xl font-bold text-sm">Search</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-h-48 overflow-y-auto">
                {itemSearchCache.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: '1', weight: '1', color: '#3b82f6', imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
                    className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl} className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                  </button>
                ))}
              </div>

              {editingCase.items.length > 0 && (() => {
                const totalWeight = editingCase.items.reduce((acc: number, item: any) => acc + (parseFloat(item.weight) || 0), 0);
                const ev = totalWeight > 0 ? editingCase.items.reduce((acc: number, item: any) => acc + ((parseFloat(item.weight) || 0) / totalWeight) * ((parseFloat(item.value) || 0) * 100), 0) : 0;
                const parsedPrice = (parseFloat(editingCase.price) || 0) * 100;
                const rtp = parsedPrice > 0 ? (ev / parsedPrice) * 100 : 0;
                const houseEdge = 100 - rtp;
                const isProfitable = houseEdge >= 0;

                let recommendation = "";
                let recommendationColor = "";
                if (houseEdge < 0) {
                  recommendation = "Player Favored (You are losing money!)";
                  recommendationColor = "text-red-500 bg-red-500/10 border-red-500/20";
                } else if (houseEdge <= 5) {
                  recommendation = "Fair & Balanced";
                  recommendationColor = "text-accent-green bg-accent-green/10 border-accent-green/20";
                } else if (houseEdge <= 15) {
                  recommendation = "Profitable (Recommended)";
                  recommendationColor = "text-accent-blue bg-accent-blue/10 border-accent-blue/20";
                } else if (houseEdge <= 30) {
                  recommendation = "High Edge (Greedy)";
                  recommendationColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
                } else {
                  recommendation = "Extremely Rigged (Players will complain!)";
                  recommendationColor = "text-red-500 bg-red-500/10 border-red-500/20";
                }

                return (
                  <div className="mb-6 bg-[#1f222b] rounded-xl border border-[#2a2d3a] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <Settings2 size={16} className="text-accent-blue" />
                        Live Case Statistics
                      </h4>
                      <div className="flex items-center gap-3">
                        <button onClick={handleAutoBalanceRTP} className="text-xs bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white transition-colors px-3 py-1 rounded-full font-black">
                          Auto-Balance RTP
                        </button>
                        <div className={`px-3 py-1 rounded-full border text-xs font-black ${recommendationColor}`}>
                          {recommendation}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-[#7a819c] font-bold uppercase tracking-widest mb-1">Total Weight</div>
                        <div className="text-white font-black">{totalWeight.toFixed(4).replace(/\.?0+$/, '')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#7a819c] font-bold uppercase tracking-widest mb-1">Expected Value</div>
                        <div className="text-[#e2b714] font-black">
                          <DLCurrency amount={ev} size="xs" className="text-[#e2b714]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#7a819c] font-bold uppercase tracking-widest mb-1">RTP</div>
                        <div className={`font-black ${isProfitable ? 'text-accent-green' : 'text-red-500'}`}>{rtp.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#7a819c] font-bold uppercase tracking-widest mb-1">House Edge</div>
                        <div className={`font-black ${isProfitable ? 'text-accent-green' : 'text-red-500'}`}>{houseEdge.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <h4 className="text-white font-bold mb-4 flex items-center justify-between">
                <span>Case Items ({editingCase.items.length})</span>
                <span className="text-xs text-[#7a819c] font-normal">Price: ${(parseFloat(editingCase.price) || 0).toFixed(2)}</span>
              </h4>
              <div className="space-y-2">
                {editingCase.items.map((item: any, i: number) => {
                  const totalWeight = editingCase.items.reduce((acc: number, item: any) => acc + (parseFloat(item.weight) || 0), 0);
                  const probability = totalWeight > 0 ? ((parseFloat(item.weight) || 0) / totalWeight) * 100 : 0;
                  return (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#15181f] p-3 rounded-xl border border-[#2a2d3a]">
                      <div className="flex items-center gap-2 w-full sm:flex-1">
                        <img src={item.imageUrl} className="w-8 h-8 object-contain bg-[#1f222b] rounded-lg p-1" />
                        <input type="text" value={item.name} onChange={e => { const newItems = [...editingCase.items]; newItems[i].name = e.target.value; setEditingCase({ ...editingCase, items: newItems }); }} className="flex-1 bg-transparent border-b border-[#2a2d3a] text-xs text-white p-1 focus:border-accent-blue outline-none" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#7a819c] font-bold uppercase pl-1">Value ($ / DL)</span>
                          <input type="number" step="any" value={item.value} onChange={e => { const newItems = [...editingCase.items]; newItems[i].value = e.target.value; setEditingCase({ ...editingCase, items: newItems }); }} className="w-20 bg-[#1f222b] border border-transparent focus:border-accent-blue outline-none rounded px-2 py-1 text-xs text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#7a819c] font-bold uppercase pl-1">Weight</span>
                          <div className="flex items-center gap-2">
                            <input type="number" step="any" value={item.weight} onChange={e => { const newItems = [...editingCase.items]; newItems[i].weight = e.target.value; setEditingCase({ ...editingCase, items: newItems }); }} className="w-20 bg-[#1f222b] border border-transparent focus:border-accent-blue outline-none rounded px-2 py-1 text-xs text-white" />
                            <span className="text-xs font-bold text-accent-blue w-12 text-right">{probability.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#7a819c] font-bold uppercase pl-1">Lucky Star?</span>
                          <div className="flex items-center h-full px-2">
                            <input 
                              type="checkbox" 
                              checked={!!item.isLuckyStarItem}
                              onChange={e => { const newItems = [...editingCase.items]; newItems[i].isLuckyStarItem = e.target.checked; setEditingCase({ ...editingCase, items: newItems }); }} 
                              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                        <button onClick={() => { const newItems = [...editingCase.items]; newItems.splice(i, 1); setEditingCase({ ...editingCase, items: newItems }); }} className="text-red-500 font-black px-3 py-1 hover:bg-red-500/10 rounded ml-auto sm:ml-2 mt-4">X</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={handleSaveCase} disabled={loading} className="w-full py-4 bg-accent-green text-black rounded-xl font-black text-lg hover:bg-[#00e676] transition-all flex items-center justify-center gap-2 shadow-lg">
              <Save size={20} /> Save Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cases.map(c => (
              <div key={c.id} className="bg-[#1f222b] border border-[#2a2d3a] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="h-20 mb-3 flex items-center justify-center">
                  {c.image ? <img src={c.image} className="max-h-full max-w-full drop-shadow-lg object-contain" /> : <PackageOpen size={40} className="text-[#3a3d4a]" />}
                </div>
                <div className="text-sm font-black text-white mb-1 truncate w-full">{c.name}</div>
                <div className="text-accent-green font-black text-xs mb-4">
                  <DLCurrency amount={c.price} size="xs" className="text-accent-green" />
                </div>
                <div className="flex gap-2 w-full mt-auto">
                  <button onClick={() => {
                    const caseToEdit = {
                      ...c,
                      price: (c.price / 100).toString(),
                      items: c.items.map((i: any) => ({ ...i, value: (i.value / 100).toString(), weight: i.weight.toString() }))
                    };
                    setEditingCase(caseToEdit);
                  }} className="flex-1 bg-[#15181f] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#2a2d3a] transition-colors border border-[#2a2d3a]">Edit</button>
                  <button onClick={() => handleDeleteCase(c.id)} className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg font-bold text-xs hover:bg-red-500/20 transition-colors border border-red-500/20">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* TAB 4: CASE STUDIO */}
      {activeTab === "studio" && (
        <AdvancedCaseCreator />
      )}

      {/* TAB 5: ITEM MANAGER */}
      {activeTab === "items" && (
        <ItemManager />
      )}

      {activeTab === "analytics" && (
        <AnalyticsDashboard />
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Users, Search, RefreshCw, AlertTriangle, Edit, MicOff, Lock, Unlock, Trash2, Save, Key } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { useCustomModal, CustomModal } from "@/components/ui/CustomModal";

export default function PlayersTab({ user }: { user: any }) {
  const { modalConfig, setModalConfig, showSuccess, showError, showConfirm } = useCustomModal();
  
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [auditUser, setAuditUser] = useState<any>(null);
  const [auditTransactions, setAuditTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search = userSearch) => {
    setUsersLoading(true);
    try {
      const res = await apiFetch(`/admin/users?q=${encodeURIComponent(search)}`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
    setUsersLoading(false);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setLoading(true);
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
        showSuccess(`Player ${editingUser.username} updated!`);
        setEditingUser(null);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
    setLoading(false);
  };

  const executeDeleteUser = async (id: number, username: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess(`Player ${username} deleted.`);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = (id: number, username: string) => {
    showConfirm(`Are you sure you want to completely delete player "${username}"? All items and history will be purged.`, () => executeDeleteUser(id, username));
  };

  const executeFreezeUser = async (id: number, username: string, isFrozen: boolean) => {
    const action = isFrozen ? "unfreeze" : "freeze";
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${id}/freeze`, { method: "POST" });
      if (res.ok) {
        showSuccess(`Player ${username} ${action}d.`);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
    setLoading(false);
  };

  const handleFreezeUser = (id: number, username: string, isFrozen: boolean) => {
    const action = isFrozen ? "unfreeze" : "freeze";
    showConfirm(`Are you sure you want to ${action} player "${username}"?`, () => executeFreezeUser(id, username, isFrozen));
  };

  const executeChatBan = async (id: number, username: string, isBanned: boolean) => {
    const action = isBanned ? "unban" : "ban";
    try {
      const res = await apiFetch(`/admin/users/${id}/chatban`, { method: "POST" });
      if (res.ok) {
        showSuccess(`Player ${username} chat ${action}ned.`);
        fetchUsers(userSearch);
      } else {
        throw new Error((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleChatBan = (id: number, username: string, isBanned: boolean) => {
    const action = isBanned ? "unban" : "ban";
    showConfirm(`Are you sure you want to ${action} player "${username}" from chat?`, () => executeChatBan(id, username, isBanned));
  };

  const handleTriggerRain = async () => {
    try {
      const res = await apiFetch("/admin/rain", { method: "POST" });
      if (res.ok) {
        showSuccess("Rain triggered successfully!");
      } else {
        showError((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleAuditUser = async (u: any) => {
    setAuditUser(u);
    setAuditTransactions([]);
    try {
      const res = await apiFetch(`/admin/users/${u.id}/audit`);
      if (res.ok) setAuditTransactions(await res.json());
    } catch (e) { }
  };

  return (
    <div className="space-y-6">
      <CustomModal config={modalConfig} setConfig={setModalConfig} />
      <div className="bg-[#131620]/80 backdrop-blur-xl border border-[#222738] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-cyan-500/5 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="text-cyan-400" size={20} /> Registered Players
            </h2>
            <p className="text-xs text-[#7f86a2] font-medium mt-0.5">
              Direct live MySQL user table records. Change balances, reset passwords, promote roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#585e75] group-focus-within:text-cyan-400 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search player username..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchUsers(e.target.value);
                }}
                className="bg-[#0c0e14]/50 border border-[#202535] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#585e75] focus:outline-none focus:border-cyan-400 focus:bg-[#0c0e14] font-semibold transition-all shadow-inner"
              />
            </div>
            <button
              onClick={() => fetchUsers(userSearch)}
              className="p-2.5 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-[#7f86a2] hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all shadow-lg"
              title="Refresh Players"
            >
              <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleTriggerRain}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
            >
              <AlertTriangle size={14} /> Drop Rain
            </button>
          </div>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#1f2433] bg-[#0a0c12]/50 backdrop-blur-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0c0e14]/80 border-b border-[#1f2433] text-[#6b7391] uppercase tracking-wider font-black text-[10px]">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">Username</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Balance</th>
                <th className="py-4 px-5">Level / XP</th>
                <th className="py-4 px-5">Total Wagered</th>
                <th className="py-4 px-5">Rakeback</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b202e]/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#181c28]/80 transition-colors group">
                  <td className="py-4 px-5 font-mono font-bold text-[#646b85] group-hover:text-cyan-400 transition-colors">#{u.id}</td>
                  <td className="py-4 px-5">
                    <span className="font-black text-white text-sm">{u.username}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                      {u.role}
                    </span>
                    {u.isFrozen && (
                      <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        FROZEN
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <DLCurrency amount={u.mockBalance} size="xs" className="text-white font-bold" />
                  </td>
                  <td className="py-4 px-5 font-bold text-[#a0a5b8]">
                    <span className="text-white">Lvl {u.level}</span> <span className="text-[10px] text-[#646b85] bg-[#11141e] px-1.5 py-0.5 rounded ml-1">{u.xp} XP</span>
                  </td>
                  <td className="py-4 px-5">
                    <DLCurrency amount={u.totalWagered} size="xs" className="text-[#a0a5b8]" />
                  </td>
                  <td className="py-4 px-5">
                    <DLCurrency amount={u.rakebackBalance} size="xs" className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
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
                        className="px-3 py-1.5 bg-[#1b1f2c] hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-400 border border-[#2a3044] rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      {user?.id !== u.id && (
                        <>
                          <button
                            onClick={() => handleChatBan(u.id, u.username, u.isChatBanned)}
                            className={`p-1.5 border rounded-lg transition-all shadow-sm ${
                              u.isChatBanned 
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]' 
                                : 'bg-[#1b1f2c] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border-[#2a3044] hover:border-rose-500/20'
                            }`}
                            title={u.isChatBanned ? "Unban from Chat" : "Ban from Chat"}
                          >
                            <MicOff size={13} />
                          </button>
                          <button
                            onClick={() => handleFreezeUser(u.id, u.username, u.isFrozen)}
                            className={`p-1.5 border rounded-lg transition-all shadow-sm ${
                              u.isFrozen 
                                ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                                : 'bg-[#1b1f2c] hover:bg-orange-500/10 text-slate-400 hover:text-orange-400 border-[#2a3044] hover:border-orange-500/20'
                            }`}
                            title={u.isFrozen ? "Unfreeze Player" : "Freeze Player"}
                          >
                            {u.isFrozen ? <Unlock size={13} /> : <Lock size={13} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="p-1.5 bg-[#1b1f2c] hover:bg-red-500/10 text-[#646b85] hover:text-red-400 border border-[#2a3044] hover:border-red-500/20 rounded-lg transition-all shadow-sm"
                            title="Purge Player"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleAuditUser(u)}
                        className="p-1.5 bg-[#1b1f2c] hover:bg-purple-500/10 text-[#646b85] hover:text-purple-400 border border-[#2a3044] hover:border-purple-500/20 rounded-lg transition-all shadow-sm"
                        title="Audit Player"
                      >
                        <Search size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT PLAYER MODAL */}
      {auditUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#131620]/95 border border-[#262c3f] rounded-2xl p-6 w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#202535]">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
                  <Search size={18} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> Audit Logs: {auditUser.username}
                </h3>
                <p className="text-xs text-[#7f86a2] mt-0.5">Last 100 transactions across all games.</p>
              </div>
              <button
                onClick={() => setAuditUser(null)}
                className="text-[#646b85] hover:text-white text-xs font-black uppercase transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {auditTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#646b85] font-black">
                  No transactions found or loading...
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0b0e14]/90 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider rounded-tl-xl border-b border-[#202535]">ID</th>
                      <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider border-b border-[#202535]">Game</th>
                      <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider border-b border-[#202535]">Amount</th>
                      <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider border-b border-[#202535]">Result</th>
                      <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider rounded-tr-xl border-b border-[#202535]">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202535]/50">
                    {auditTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[#1a1f2e]/50 transition-colors">
                        <td className="px-4 py-3 text-[#7f86a2] font-mono text-xs">#{tx.id}</td>
                        <td className="px-4 py-3 font-bold text-white capitalize">{tx.gameType}</td>
                        <td className="px-4 py-3">
                          <DLCurrency amount={tx.amount} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-white">
                          {tx.result.length > 50 ? tx.result.substring(0, 50) + "..." : tx.result}
                        </td>
                        <td className="px-4 py-3 text-[#7f86a2] text-xs">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#131620]/95 border border-[#262c3f] rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#202535]">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Edit size={18} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> Edit Player: {editingUser.username}
                </h3>
                <p className="text-xs text-[#7f86a2] mt-0.5">Modify database attributes and commit to MySQL immediately.</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#646b85] hover:text-white text-xs font-black uppercase transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner appearance-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest flex items-center gap-1">
                  <span>Balance (DL)</span>
                  <img src="/dl.webp" alt="DL" className="w-3.5 h-3.5 object-contain" />
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingUser.mockBalanceDL}
                  onChange={(e) => setEditingUser({ ...editingUser, mockBalanceDL: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest flex items-center gap-1">
                  <span>Rakeback (DL)</span>
                  <img src="/dl.webp" alt="DL" className="w-3.5 h-3.5 object-contain" />
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingUser.rakebackBalanceDL}
                  onChange={(e) => setEditingUser({ ...editingUser, rakebackBalanceDL: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest">Level</label>
                <input
                  type="number"
                  value={editingUser.level}
                  onChange={(e) => setEditingUser({ ...editingUser, level: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest">XP</label>
                <input
                  type="number"
                  value={editingUser.xp}
                  onChange={(e) => setEditingUser({ ...editingUser, xp: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest flex items-center gap-1">
                  <span>Total Wagered (DL)</span>
                  <img src="/dl.webp" alt="DL" className="w-3.5 h-3.5 object-contain" />
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingUser.totalWageredDL}
                  onChange={(e) => setEditingUser({ ...editingUser, totalWageredDL: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-[#202535] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c0e14] transition-all shadow-inner"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-1.5 tracking-widest text-amber-500 flex items-center gap-1">
                  <Key size={10} /> Override Password
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to keep current password"
                  value={editingUser.newPassword}
                  onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                  className="w-full bg-[#0c0e14]/50 border border-amber-500/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-amber-500/50 focus:bg-[#0c0e14] transition-all placeholder-[#585e75] shadow-inner"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#202535] flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-[#7f86a2] hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={14} />
                {loading ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

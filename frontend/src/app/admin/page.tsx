"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { Settings, Shield, Edit, Plus, Save, PackageOpen, Dice1, Settings2, Hash, AlertTriangle, Users, Trash2, Key, Database, RefreshCw, Search, Check, HandCoins, Activity, Lock, Unlock, ArrowDownToLine, XCircle, MessageSquare, MicOff, Gift } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import AdvancedCaseCreator from "@/components/admin/AdvancedCaseCreator";
import ItemManager from "@/components/admin/ItemManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { Image as ImageIcon } from "lucide-react";
import { useCustomModal, CustomModal } from "@/components/ui/CustomModal";

export default function AdminPage() {
  const { user } = useAuth();
  const { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm, showPrompt } = useCustomModal();
  const [activeTab, setActiveTab] = useState<"players" | "cases" | "daily_cases" | "settings" | "studio" | "items" | "analytics" | "withdrawals" | "bots" | "chat" | "deposits" | "affiliates">("players");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [botState, setBotState] = useState<any>(null);
  
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [chatFilters, setChatFilters] = useState<any[]>([]);
  const [newFilterWord, setNewFilterWord] = useState("");
  const [depositLogs, setDepositLogs] = useState<any[]>([]);
  const [cryptoDepositLogs, setCryptoDepositLogs] = useState<any[]>([]);
  
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditUser, setAuditUser] = useState<any>(null);
  const [auditTransactions, setAuditTransactions] = useState<any[]>([]);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const [cases, setCases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminItems, setAdminItems] = useState<any[]>([]);

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

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await apiFetch('/admin/withdrawals');
      if (res.ok) setWithdrawals(await res.json());
    } catch (e) {}
    setWithdrawalsLoading(false);
  };

  const fetchAffiliates = async () => {
    setAffiliatesLoading(true);
    try {
      const res = await apiFetch('/admin/affiliates');
      if (res.ok) setAffiliates(await res.json());
    } catch (e) {}
    setAffiliatesLoading(false);
  };

  const executeBanAffiliate = async (id: number) => {
    try {
      const res = await apiFetch(`/admin/affiliates/${id}/ban`, { method: "POST" });
      if (res.ok) {
        showSuccess("Affiliate successfully banned and account locked.");
        fetchAffiliates();
      } else {
        showError((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleBanAffiliate = (id: number) => {
    showConfirm("Are you absolutely sure? This will strip their referrals, zero their earnings, and freeze their account.", () => executeBanAffiliate(id));
  };

  const executeUnbanAffiliate = async (id: number) => {
    try {
      const res = await apiFetch(`/admin/affiliates/${id}/unban`, { method: "POST" });
      if (res.ok) {
        showSuccess("Affiliate account unlocked and reinstated.");
        fetchAffiliates();
      } else {
        showError((await res.json()).error);
      }
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleUnbanAffiliate = (id: number) => {
    showConfirm("Reinstate this affiliate and unlock their account?", () => executeUnbanAffiliate(id));
  };

  const fetchChat = async () => {
    try {
      const [res1, res2] = await Promise.all([
        apiFetch('/admin/chat'),
        apiFetch('/admin/chat/filters')
      ]);
      if (res1.ok) setChatLogs(await res1.json());
      if (res2.ok) setChatFilters(await res2.json());
    } catch (e) {}
  };

  const fetchDeposits = async () => {
    try {
      const [res1, res2] = await Promise.all([
        apiFetch('/admin/deposits'),
        apiFetch('/admin/crypto-deposits')
      ]);
      if (res1.ok) setDepositLogs(await res1.json());
      if (res2.ok) setCryptoDepositLogs(await res2.json());
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/admin/settings");
      if (res.ok) setSettings(await res.json());
      const resCases = await apiFetch("/admin/cases");
      if (resCases.ok) setCases(await resCases.json());
      const resItems = await apiFetch("/admin/items");
      if (resItems.ok) setAdminItems(await resItems.json());
    } catch (e) { }
  };

  useEffect(() => {
    let botInterval: any;
    if (user?.role === 'admin') {
      fetchSettings();
      fetchUsers();
      fetchWithdrawals();
      fetchChat();
      fetchDeposits();
      fetchAffiliates();

      const fetchBots = async () => {
        try {
          const res = await apiFetch("/admin/bot");
          if (res.ok) setBotState(await res.json());
        } catch (e) {}
      };
      fetchBots();
      botInterval = setInterval(fetchBots, 2500);
    }
    return () => clearInterval(botInterval);
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

  const executeDeleteChat = async (id: number) => {
    try {
      await apiFetch(`/admin/chat/${id}`, { method: 'DELETE' });
      fetchChat();
    } catch (e) {}
  };

  const handleDeleteChat = (id: number) => {
    showConfirm("Are you sure you want to delete this chat message?", () => executeDeleteChat(id));
  };

  const handleAddFilter = async () => {
    if (!newFilterWord.trim()) return;
    try {
      const res = await apiFetch(`/admin/chat/filters`, {
        method: 'POST',
        body: JSON.stringify({ word: newFilterWord })
      });
      if (res.ok) {
        setNewFilterWord("");
        fetchChat();
      }
    } catch (e) {}
  };

  const handleRemoveFilter = async (id: number) => {
    try {
      await apiFetch(`/admin/chat/filters/${id}`, { method: 'DELETE' });
      fetchChat();
    } catch (e) {}
  };

  const executeChatBan = async (id: number, username: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/admin/chat/ban/${id}`, {
        method: 'POST',
        body: JSON.stringify({ isBanned: !currentStatus })
      });
      fetchUsers(userSearch);
    } catch (e) {}
  };

  const handleChatBan = (id: number, username: string, currentStatus: boolean) => {
    const action = currentStatus ? "unban" : "ban";
    showConfirm(`Are you sure you want to ${action} ${username} from chat?`, () => executeChatBan(id, username, currentStatus));
  };

  const handleAuditUser = async (user: any) => {
    setAuditUser(user);
    setAuditTransactions([]);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/transactions`);
      if (res.ok) setAuditTransactions(await res.json());
    } catch (e) {}
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

  const executeTriggerRain = async (amountStr: string) => {
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return showAlert("Invalid amount.");
    
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

  const handleTriggerRain = () => {
    showPrompt("Enter amount of DLs to drop in Chat Rain:", executeTriggerRain, "1000", "Trigger Rain");
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

  const [itemSearchCache, setItemSearchCache] = useState<any[]>([]);

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

  const executeAutoBalance = (target: string) => {
    const targetRtp = parseFloat(target);
    if (isNaN(targetRtp) || targetRtp <= 0) return showAlert("Invalid RTP.");
    
    const parsedPrice = parseFloat(editingCase.price) || 0;
    if (parsedPrice <= 0) return showAlert("Please set a case price first.");
    if (editingCase.items.length < 2) return showAlert("You need at least 2 items to balance.");
    
    const targetEV = (targetRtp / 100) * parsedPrice;
    
    const values = editingCase.items.map((i: any) => parseFloat(i.value) || 0);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    
    if (targetEV <= minV || targetEV >= maxV) {
      return showAlert(`Cannot balance to ${targetRtp}% RTP.\nThe Target Average Value is $${targetEV.toFixed(2)}.\nBut your items range from $${minV.toFixed(2)} to $${maxV.toFixed(2)}.\nPlease add more items or change the case price.`);
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

  const handleAutoBalanceRTP = () => {
    if (!editingCase) return;
    showPrompt("Enter Target RTP % (e.g. 92):", executeAutoBalance, "92", "Auto Balance RTP");
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
        if (res.ok) { showSuccess("Case created!"); setIsCreatingCase(false); setEditingCase(null); fetchSettings(); }
        else throw new Error((await res.json()).error);
      } else {
        const res = await apiFetch(`/admin/cases/${editingCase.id}`, { method: "PUT", body: JSON.stringify(payload) });
        if (res.ok) { showSuccess("Case updated!"); setEditingCase(null); fetchSettings(); }
        else throw new Error((await res.json()).error);
      }
    } catch (e: any) { showError(e.message); }
    setLoading(false);
  };

  const executeDeleteCase = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/cases/${id}`, { method: "DELETE" });
      if (res.ok) fetchSettings();
    } catch (e) { }
    setLoading(false);
  };

  const handleDeleteCase = (id: number) => {
    showConfirm("Are you sure you want to delete this case?", () => executeDeleteCase(id));
  };

  if (user?.role !== 'admin') return <div className="text-center py-20 text-red-500 font-black">UNAUTHORIZED</div>;
  if (!settings) return <div className="text-center py-20 text-[#7a819c] font-black">LOADING...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <CustomModal config={modalConfig} setConfig={setModalConfig} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 bg-[#131620] p-5 rounded-2xl border border-[#222738] shadow-xl">
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
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 bg-[#0c0e14] p-1 rounded-2xl border border-[#202535] min-w-max">
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
            <span>Cases ({cases.filter((c: any) => c.type === 'normal').length})</span>
          </button>
          <button
            onClick={() => setActiveTab("daily_cases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "daily_cases"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Gift size={15} />
            <span>Daily Cases ({cases.filter((c: any) => c.type !== 'normal').length})</span>
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
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "withdrawals"
                ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <ArrowDownToLine size={15} />
            <span>Withdrawals</span>
          </button>
          <button
            onClick={() => setActiveTab("bots")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "bots"
                ? "bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Activity size={15} />
            <span>Bots ({(botState?.bots || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "chat"
                ? "bg-rose-500 text-black shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <MessageSquare size={15} />
            <span>Chat Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("deposits")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "deposits"
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <ArrowDownToLine size={15} />
            <span>Deposit Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab("affiliates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "affiliates"
                ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "text-[#7f86a2] hover:text-white"
            }`}
          >
            <Users size={15} />
            <span>Affiliates</span>
          </button>
        </div>
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
          <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 shadow-xl">
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
                        {u.isFrozen && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            FROZEN
                          </span>
                        )}
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
                            <>
                              <button
                                onClick={() => handleChatBan(u.id, u.username, u.isChatBanned)}
                                className={`p-1.5 border rounded-lg transition-colors ${
                                  u.isChatBanned 
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20' 
                                    : 'bg-slate-500/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-500/20 hover:border-rose-500/20'
                                }`}
                                title={u.isChatBanned ? "Unban from Chat" : "Ban from Chat"}
                              >
                                <MicOff size={13} />
                              </button>
                              <button
                                onClick={() => handleFreezeUser(u.id, u.username, u.isFrozen)}
                                className={`p-1.5 border rounded-lg transition-colors ${
                                  u.isFrozen 
                                    ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20' 
                                    : 'bg-slate-500/10 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 border-slate-500/20 hover:border-orange-500/20'
                                }`}
                                title={u.isFrozen ? "Unfreeze Player" : "Freeze Player"}
                              >
                                {u.isFrozen ? <Unlock size={13} /> : <Lock size={13} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                                title="Purge Player"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleAuditUser(u)}
                            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition-colors"
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
              <div className="bg-[#131620] border border-[#262c3f] rounded-2xl p-6 w-full max-w-4xl shadow-2xl space-y-6 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between pb-4 border-b border-[#202535]">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Search size={18} className="text-purple-400" /> Audit Logs: {auditUser.username}
                    </h3>
                    <p className="text-xs text-[#7f86a2] mt-0.5">Last 100 transactions across all games.</p>
                  </div>
                  <button
                    onClick={() => setAuditUser(null)}
                    className="text-[#646b85] hover:text-white text-xs font-black uppercase"
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
                      <thead className="bg-[#0b0e14] sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider rounded-tl-xl">ID</th>
                          <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider">Game</th>
                          <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider">Amount</th>
                          <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider">Result</th>
                          <th className="px-4 py-3 font-black text-[#7a819c] uppercase text-[10px] tracking-wider rounded-tr-xl">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202535]">
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

          {/* EDIT PLAYER MODAL / PANEL */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#131620] border border-[#262c3f] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
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

      {/* TAB: WITHDRAWALS */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ArrowDownToLine className="text-emerald-400" size={20} /> Withdrawal Queue
                </h2>
                <p className="text-xs text-[#7f86a2] font-medium mt-0.5">
                  Approve or reject manual withdrawal requests. Balances are already held in escrow.
                </p>
              </div>
              <button
                onClick={fetchWithdrawals}
                className="p-2.5 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-[#7f86a2] hover:text-white transition-colors"
              >
                <RefreshCw size={14} className={withdrawalsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#1f2433]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0c0e14] border-b border-[#1f2433] text-[#6b7391] uppercase tracking-wider font-black text-[10px]">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Address / Info</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202e]">
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7f86a2] font-bold">No withdrawals found.</td>
                    </tr>
                  )}
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#181c28] transition-colors">
                      <td className="py-3.5 px-4 text-[#7f86a2] font-semibold">{new Date(w.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-black text-white">{w.user?.username || `User #${w.userId}`}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${w.method === 'crypto' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} border`}>
                          {w.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#a0a8c0] font-mono text-[10px]">{w.address}</td>
                      <td className="py-3.5 px-4">
                        <DLCurrency amount={w.amount} size="xs" className="text-white" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          w.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        } border`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {w.status === 'pending' && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                              title="Mark Approved"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
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
      )}

      {/* TAB 2: GLOBAL SETTINGS */}
      {activeTab === "settings" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Casino Pot */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl mb-8">
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
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
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

            <div className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a]">
              <label className="block text-[10px] font-black text-[#7a819c] uppercase mb-2 tracking-widest">XP Base (Scaling Rate)</label>
              <p className="text-xs text-white/50 mb-2">Controls how quickly players level up (default 1000). Lower = faster.</p>
              <input
                type="number"
                value={settings.xpBase ?? 1000}
                onChange={e => setSettings({ ...settings, xpBase: parseInt(e.target.value) || 1000 })}
                className="w-full bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>
        </div>

        {/* Case Borrowing Configuration */}
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
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
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
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
        <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
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
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
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
          <div className="bg-[#1f222b] p-5 rounded-2xl border border-[#2a2d3a] space-y-6">
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
              <h4 className="text-white font-bold mb-4">Add Items from Database</h4>
              <div className="flex gap-2 mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search saved items..." className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2 text-white font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-h-48 overflow-y-auto">
                {adminItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: (item.value / 100).toString(), weight: '1', color: item.color, imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
                    className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-white font-bold mb-4 border-t border-[#2a2d3a] pt-6">Add Items via Growtopia Search</h4>
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
                    <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-8 h-8 object-contain" />
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
                        <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-8 h-8 object-contain bg-[#1f222b] rounded-lg p-1" />
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
            {cases.filter((c: any) => c.type === 'normal').map((c: any) => (
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

      {activeTab === "daily_cases" && (
      <div className="bg-[#15181f] border border-[#2a2d3a] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Gift className="text-accent-green" size={20} /> Daily Cases Management
          </h2>
        </div>

        {editingCase && editingCase.type !== 'normal' ? (
          <div className="bg-[#1f222b] p-5 rounded-2xl border border-[#2a2d3a] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white">Edit Daily Case: {editingCase.name}</h3>
              <button onClick={() => setEditingCase(null)} className="text-[#7a819c] font-bold text-sm hover:text-white">CANCEL</button>
            </div>

            <div className="border-t border-[#2a2d3a] pt-6">
              <h4 className="text-white font-bold mb-4">Add Items from Database</h4>
              <div className="flex gap-2 mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search saved items..." className="flex-1 bg-[#15181f] border border-[#2a2d3a] rounded-xl px-4 py-2 text-white font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-h-48 overflow-y-auto">
                {adminItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: (item.value / 100).toString(), weight: '1', color: item.color, imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
                    className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-white font-bold mb-4 border-t border-[#2a2d3a] pt-6">Add Items via Growtopia Search</h4>
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
                    <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {editingCase.items.map((item: any, i: number) => {
                  const totalWeight = editingCase.items.reduce((acc: number, item: any) => acc + (parseFloat(item.weight) || 0), 0);
                  const probability = totalWeight > 0 ? ((parseFloat(item.weight) || 0) / totalWeight) * 100 : 0;
                  return (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#15181f] p-4 rounded-xl border border-[#2a2d3a]">
                      <img src={item.imageUrl?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}` : item.imageUrl} className="w-12 h-12 object-contain" />
                      <div className="flex-1 font-bold text-white">{item.name}</div>
                      <div className="flex items-center gap-4 flex-wrap">
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
                        <button onClick={() => { const newItems = [...editingCase.items]; newItems.splice(i, 1); setEditingCase({ ...editingCase, items: newItems }); }} className="text-red-500 font-black px-3 py-1 hover:bg-red-500/10 rounded ml-auto sm:ml-2 mt-4">X</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={handleSaveCase} disabled={loading} className="w-full py-4 bg-accent-green text-black rounded-xl font-black text-lg hover:bg-[#00e676] transition-all flex items-center justify-center gap-2 shadow-lg">
              <Save size={20} /> Save Daily Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cases.filter((c: any) => c.type !== 'normal').map((c: any) => (
              <div key={c.id} className="bg-[#1f222b] border border-[#2a2d3a] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="h-20 mb-3 flex items-center justify-center">
                  <Gift size={40} className="text-amber-400" />
                </div>
                <div className="text-sm font-black text-white mb-1 truncate w-full">{c.name}</div>
                <div className="text-xs font-black text-gray-400 mb-4 truncate w-full">Type: {c.type}</div>
                <div className="flex gap-2 w-full mt-auto">
                  <button onClick={() => {
                    const caseToEdit = {
                      ...c,
                      price: (c.price / 100).toString(),
                      items: c.items.map((i: any) => ({ ...i, value: (i.value / 100).toString(), weight: i.weight.toString() }))
                    };
                    setEditingCase(caseToEdit);
                  }} className="flex-1 bg-[#15181f] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#2a2d3a] transition-colors border border-[#2a2d3a]">Edit Items</button>
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

      {/* TAB: BOTS */}
      {activeTab === "bots" && (
        <div className="space-y-6">
          <div className="bg-[#131620] border border-[#222738] rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Activity className="text-purple-500" />
              Live Bot Fleet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(botState?.bots || []).map((bot: any) => (
                <div key={bot.name} className="bg-[#0b0e14] border border-[#222738] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex justify-between items-center z-10">
                    <span className="font-bold text-white text-lg">{bot.name}</span>
                    <span className={`px-2 py-1 text-xs font-black rounded-lg ${bot.isBusy ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {bot.isBusy ? 'BUSY' : 'IDLE'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-400 z-10">
                    Game Status: <span className="text-white">{bot.gameStatus || 'Unknown'}</span>
                  </div>
                  {bot.currentIntentId && (
                    <div className="text-xs font-medium text-cyan-400 z-10">
                      Processing Intent #{bot.currentIntentId}
                    </div>
                  )}
                  {/* Decorative background */}
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 blur-3xl opacity-20 ${bot.isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
              ))}
              {(botState?.bots || []).length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-500 font-bold">
                  No active bots connected.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-[#131620] border border-[#222738] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-black text-white mb-4">Bridge Queue</h2>
            <div className="flex items-center gap-4">
              <div className="bg-[#0b0e14] border border-[#222738] rounded-xl p-4 px-8 text-center">
                <div className="text-4xl font-black text-cyan-400">{botState?.queueSize || 0}</div>
                <div className="text-xs text-gray-500 font-bold mt-1 uppercase">Pending Intents</div>
              </div>
              <div className="text-sm text-gray-400">
                The bridge queue holds deposits/withdrawals waiting for a bot to become idle.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CHAT LOGS */}
      {activeTab === "chat" && (
        <div className="bg-[#131620] border border-[#262c3f] rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <MessageSquare className="text-rose-500" /> Chat Moderation
            </h2>
            <button
              onClick={fetchChat}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-xs font-black text-[#7f86a2] hover:text-white transition-colors"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
          
          <div className="bg-[#0b0d12] border border-[#202535] rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Keyword Blacklist (Auto-Drop)</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newFilterWord}
                onChange={(e) => setNewFilterWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
                placeholder="Enter word to block..."
                className="flex-1 bg-[#151923] border border-[#202535] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 outline-none"
              />
              <button
                onClick={handleAddFilter}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Add Filter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {chatFilters.map(filter => (
                <div key={filter.id} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-sm font-bold">
                  {filter.word}
                  <button onClick={() => handleRemoveFilter(filter.id)} className="hover:text-white transition-colors">
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
              {chatFilters.length === 0 && (
                <div className="text-sm text-gray-500">No active filters.</div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#202535] bg-[#0c0e14]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#10131a] text-[#7a819c] font-black uppercase text-[10px] tracking-wider border-b border-[#202535]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202535]">
                {chatLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#151923] transition-colors">
                    <td className="px-6 py-4 font-mono text-[#7a819c] text-xs">#{log.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{log.user?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-300 font-medium max-w-md truncate">{log.content}</td>
                    <td className="px-6 py-4 text-[#7a819c] text-xs font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteChat(log.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {chatLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#7a819c] font-black text-sm">
                      No chat messages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DEPOSIT LEDGER */}
      {activeTab === "deposits" && (
        <div className="bg-[#131620] border border-[#262c3f] rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ArrowDownToLine className="text-amber-500" /> Deposit Ledger
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  showConfirm(
                    'Are you sure you want to permanently delete all pending/failed crypto invoices?',
                    async () => {
                      await apiFetch('/admin/purge-crypto');
                      fetchDeposits();
                    }
                  );
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-black text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <XCircle size={13} />
                Purge Old
              </button>
              <button
                onClick={fetchDeposits}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-xs font-black text-[#7f86a2] hover:text-white transition-colors"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-[#202535] bg-[#0c0e14]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#10131a] text-[#7a819c] font-black uppercase text-[10px] tracking-wider border-b border-[#202535]">
                <tr>
                  <th className="px-6 py-4">Intent ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">GrowID / World</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202535]">
                {depositLogs.map(dep => (
                  <tr key={dep.id} className="hover:bg-[#151923] transition-colors">
                    <td className="px-6 py-4 font-mono text-[#7a819c] text-xs">#{dep.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{dep.user?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-300 font-medium">{dep.growId} / {dep.worldName}</td>
                    <td className="px-6 py-4">
                      {dep.amount > 0 ? <DLCurrency amount={dep.amount} /> : <span className="text-gray-500 text-xs">TBD</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                        dep.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        dep.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#7a819c] text-xs font-medium">
                      {new Date(dep.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {depositLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#7a819c] font-black text-sm">
                      No deposit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Database className="text-cyan-500" size={18} /> Crypto Deposits (HD Wallet)
            </h3>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-[#202535] bg-[#0c0e14]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#10131a] text-[#7a819c] font-black uppercase text-[10px] tracking-wider border-b border-[#202535]">
                <tr>
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4">DLs Expected</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202535]">
                {cryptoDepositLogs.map(dep => (
                  <tr key={dep.id} className="hover:bg-[#151923] transition-colors">
                    <td className="px-6 py-4 font-mono text-[#7a819c] text-xs">#{dep.id}</td>
                    <td className="px-6 py-4 font-bold text-white">{dep.user?.username || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        {dep.payCurrency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="text-cyan-400">{dep.payAmount} {dep.payCurrency}</span>
                      <br/>
                      <span className="text-[10px] text-gray-500">{dep.address}</span>
                    </td>
                    <td className="px-6 py-4">
                      <DLCurrency amount={dep.dlsCredited} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                        dep.status === 'finished' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        dep.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#7a819c] text-xs font-medium">
                      {new Date(dep.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {cryptoDepositLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#7a819c] font-black text-sm">
                      No crypto deposits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AFFILIATES */}
      {activeTab === "affiliates" && (
        <div className="space-y-6">
          <div className="bg-[#131620] border border-[#222738] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#222738] flex items-center justify-between">
              <h3 className="text-white font-black flex items-center gap-2">
                <Users className="text-emerald-400" size={18} /> Affiliate Network
              </h3>
              <button onClick={fetchAffiliates} className="bg-[#1a1e2b] hover:bg-[#252a3d] text-white p-2 rounded-lg transition-colors">
                <RefreshCw size={14} className={affiliatesLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1a1e2b] text-[#7a819c] font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Affiliate Username</th>
                    <th className="px-6 py-4">Affiliate Code</th>
                    <th className="px-6 py-4">Referred Players</th>
                    <th className="px-6 py-4">Current Unclaimed Earnings</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222738]">
                  {affiliates.map((aff) => (
                    <tr key={aff.id} className={`hover:bg-[#1a1e2b]/50 transition-colors ${aff.isSuspicious && !aff.isFrozen ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4 font-bold text-white">{aff.username}</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-xs font-black uppercase tracking-widest">
                          {aff.affiliateCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-cyan-400">{aff.referredCount}</td>
                      <td className="px-6 py-4">
                        <DLCurrency amount={aff.affiliateEarnings} />
                      </td>
                      <td className="px-6 py-4">
                        {aff.isFrozen ? (
                          <span className="text-[10px] font-black uppercase bg-red-500/10 text-red-500 px-2 py-1 rounded-md border border-red-500/20 flex items-center gap-1 w-max">
                            <Lock size={12} /> Banned
                          </span>
                        ) : aff.isSuspicious ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md border border-orange-500/20 flex items-center gap-1 w-max">
                              <AlertTriangle size={12} /> Flagged
                            </span>
                            <div className="text-[9px] text-[#7a819c] max-w-[150px] leading-tight mt-1">
                              {aff.abuseReasons?.join(", ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 w-max">
                            <Check size={12} /> Clean
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!aff.isFrozen ? (
                          <button
                            onClick={() => handleBanAffiliate(aff.id)}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 p-2 rounded-lg transition-colors"
                            title="Ban Affiliate"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnbanAffiliate(aff.id)}
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 p-2 rounded-lg transition-colors"
                            title="Reinstate Affiliate"
                          >
                            <Unlock size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {affiliates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#7a819c] font-black text-sm">
                        No affiliates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

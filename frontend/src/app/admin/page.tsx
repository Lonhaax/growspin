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
import { getRarityColor } from "@/components/admin/ItemManager";
import PlayersTab from "@/components/admin/PlayersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import WithdrawalsTab from "@/components/admin/WithdrawalsTab";

export default function AdminPage() {
  const { user } = useAuth();
  const { modalConfig, setModalConfig, showAlert, showSuccess, showError, showConfirm, showPrompt } = useCustomModal();
  const [activeTab, setActiveTab] = useState<"players" | "cases" | "daily_cases" | "settings" | "games" | "studio" | "items" | "analytics" | "withdrawals" | "bots" | "chat" | "deposits" | "affiliates">("players");
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

  const SidebarBtn = ({ active, onClick, icon: Icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-300 relative overflow-hidden group ${
        active
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          : "text-[#6b7391] hover:text-white border border-transparent hover:border-[#2a3044] hover:bg-[#1b202e]/80"
      }`}
    >
      {/* Active Glow Backdrop */}
      {active && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 to-transparent blur-md pointer-events-none" />
      )}
      
      {/* Left Accent Bar for Active State */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full transition-all duration-300 ${active ? 'h-3/4 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'h-0 bg-transparent'}`} />
      
      <div className="flex items-center gap-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
        <Icon size={18} className={active ? 'drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'group-hover:text-cyan-400/70 transition-colors'} />
        {label}
      </div>
      {count !== undefined && (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black relative z-10 transition-colors ${active ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner' : 'bg-[#0c0e14] text-[#7f86a2] group-hover:bg-[#131620] group-hover:text-white'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-0 overflow-hidden bg-[#050608] relative">
      <CustomModal config={modalConfig} setConfig={setModalConfig} />

      {/* Global Background Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Glass Sidebar */}
      <div className="w-[280px] bg-[#0a0c12]/80 backdrop-blur-2xl border-r border-[#1f2433] flex flex-col h-full z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] relative">
        <div className="p-6 border-b border-[#1f2433]/50 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[40px] pointer-events-none" />
          <h1 className="text-xl font-black text-white flex items-center gap-2.5 relative z-10 drop-shadow-md">
            <Shield className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" size={22} /> System Admin
          </h1>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 w-fit relative z-10 shadow-inner">
            <Database size={12} /> MySQL Active
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-2 scrollbar-hide relative z-10">
          <div className="text-[10px] font-black text-[#4b5166] uppercase tracking-[0.2em] mb-3 px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4b5166]" /> Core Data
          </div>
          
          <SidebarBtn active={activeTab==="players"} onClick={()=>setActiveTab("players")} icon={Users} label="Players" count={users.length} />
          <SidebarBtn active={activeTab==="analytics"} onClick={()=>setActiveTab("analytics")} icon={Activity} label="Analytics" />
          <SidebarBtn active={activeTab==="deposits"} onClick={()=>setActiveTab("deposits")} icon={ArrowDownToLine} label="Deposits" />
          <SidebarBtn active={activeTab==="withdrawals"} onClick={()=>setActiveTab("withdrawals")} icon={ArrowDownToLine} label="Withdrawals" />
          <SidebarBtn active={activeTab==="affiliates"} onClick={()=>setActiveTab("affiliates")} icon={Users} label="Affiliates" />

          <div className="text-[10px] font-black text-[#4b5166] uppercase tracking-[0.2em] mt-8 mb-3 px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4b5166]" /> Configuration
          </div>
          
          <SidebarBtn active={activeTab==="settings"} onClick={()=>setActiveTab("settings")} icon={Settings2} label="Site Settings" />
          <SidebarBtn active={activeTab==="games"} onClick={()=>setActiveTab("games")} icon={Dice1} label="Game Config" />
          <SidebarBtn active={activeTab==="bots"} onClick={()=>setActiveTab("bots")} icon={Activity} label="Bots" count={botState?.bots?.length} />
          
          <div className="text-[10px] font-black text-[#4b5166] uppercase tracking-[0.2em] mt-8 mb-3 px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4b5166]" /> Economy
          </div>
          <SidebarBtn active={activeTab==="items"} onClick={()=>setActiveTab("items")} icon={Database} label="Items Master" />
          <SidebarBtn active={activeTab==="cases"} onClick={()=>setActiveTab("cases")} icon={PackageOpen} label="Cases" count={cases.filter((c: any) => c.type === 'normal').length} />
          <SidebarBtn active={activeTab==="daily_cases"} onClick={()=>setActiveTab("daily_cases")} icon={Gift} label="Daily Cases" count={cases.filter((c: any) => c.type !== 'normal').length} />
          <SidebarBtn active={activeTab==="studio"} onClick={()=>setActiveTab("studio")} icon={ImageIcon} label="Asset Studio" />

          <div className="text-[10px] font-black text-[#4b5166] uppercase tracking-[0.2em] mt-8 mb-3 px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4b5166]" /> Logs
          </div>
          <SidebarBtn active={activeTab==="chat"} onClick={()=>setActiveTab("chat")} icon={MessageSquare} label="Chat Logs" />
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-6xl mx-auto space-y-10 pb-32">

      {(error || success) && (
        <div className={`p-4 rounded-xl border font-bold text-xs text-center ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-accent-green/10 border-accent-green/20 text-accent-green'}`}>
          {error || success}
        </div>
      )}

      {/* TAB 1: PLAYER MANAGEMENT */}
      {activeTab === "players" && (
        <PlayersTab user={user} />
      )}

      {/* TAB: WITHDRAWALS */}
      {activeTab === "withdrawals" && (
        <WithdrawalsTab />
      )}

      {/* TAB 2: GLOBAL SETTINGS */}
      {activeTab === "settings" && (
        <SettingsTab />
      )}

      {/* TAB: GAMES */}
      {activeTab === "games" && (
      <div className="space-y-6">
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
                <label className="block text-[10px] font-black text-[#7a819c] uppercase tracking-widest">Slots RTP (%)</label>
                <span className="text-xs font-bold text-emerald-400">Default: 95%</span>
              </div>
              <div className="relative flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={100 - ((settings.slotsHouseEdge ?? 0.05) * 100)}
                  onChange={e => setSettings({ ...settings, slotsHouseEdge: (100 - parseFloat(e.target.value)) / 100 })}
 className="w-full accent-emerald-500"
                />
                <span className="text-sm font-black text-white w-12 text-right">
                  {Math.round(100 - ((settings.slotsHouseEdge ?? 0.05) * 100))}%
                </span>
              </div>
              <div className="text-[11px] text-[#7a819c] mt-2">
                Controls the percentage of winning slot spins that the house will "steal" by re-rolling the result on the backend until a loss occurs. For example, 95% RTP means a 5% steal rate.
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
            {['coinflip', 'roulette', 'mines', 'crash', 'dice'].map(game => (
              <div key={game} className="p-4 bg-[#1f222b] rounded-2xl border border-[#2a2d3a] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white capitalize">{game}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs text-[#7a819c] font-bold">
                      RTP (%)
                      <input
                        type="number" step="0.1" min="0" max="100"
                        value={Number((100 - (settings[`${game}HouseEdge`] ?? 0.05) * 100).toFixed(1))}
                        onChange={e => {
                          const rtp = parseFloat(e.target.value);
                          if (!isNaN(rtp)) {
                            setSettings({ ...settings, [`${game}HouseEdge`]: (100 - rtp) / 100 });
                          }
                        }}
 className="w-20 bg-[#15181f] border border-[#2a2d3a] rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-accent-blue"
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
            <Save size={20} /> Save Games Configuration
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
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: (item.value / 100).toString(), weight: '1', color: getRarityColor(item.value / 100), imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
 className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-8 h-8 object-contain" />
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
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: '1', weight: '1', color: getRarityColor(1), imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
 className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-8 h-8 object-contain" />
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
                        <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-8 h-8 object-contain bg-[#1f222b] rounded-lg p-1" />
                        <input type="text" value={item.name} onChange={e => { const newItems = [...editingCase.items]; newItems[i].name = e.target.value; setEditingCase({ ...editingCase, items: newItems }); }} className="flex-1 bg-transparent border-b border-[#2a2d3a] text-xs text-white p-1 focus:border-accent-blue outline-none" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#7a819c] font-bold uppercase pl-1">Value ($ / DL)</span>
                          <input type="number" step="any" value={item.value} onChange={e => { const newItems = [...editingCase.items]; newItems[i].value = e.target.value; const val = parseFloat(e.target.value.replace(/,/g, '')); if (!isNaN(val)) { newItems[i].color = getRarityColor(val); } setEditingCase({ ...editingCase, items: newItems }); }} className="w-20 bg-[#1f222b] border border-transparent focus:border-accent-blue outline-none rounded px-2 py-1 text-xs text-white" />
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
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: (item.value / 100).toString(), weight: '1', color: getRarityColor(item.value / 100), imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
 className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-8 h-8 object-contain" />
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
                    onClick={() => setEditingCase({ ...editingCase, items: [...editingCase.items, { name: item.name, value: '1', weight: '1', color: getRarityColor(1), imageUrl: item.imageUrl, isLuckyStarItem: false }] })}
 className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-2 flex items-center gap-2 hover:border-accent-green text-left"
                  >
                    <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-8 h-8 object-contain" />
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
                      <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} className="w-12 h-12 object-contain" />
                      <div className="flex-1 font-bold text-white">{item.name}</div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#7a819c] font-bold uppercase pl-1">Value ($ / DL)</span>
                          <input type="number" step="any" value={item.value} onChange={e => { const newItems = [...editingCase.items]; newItems[i].value = e.target.value; const val = parseFloat(e.target.value.replace(/,/g, '')); if (!isNaN(val)) { newItems[i].color = getRarityColor(val); } setEditingCase({ ...editingCase, items: newItems }); }} className="w-20 bg-[#1f222b] border border-transparent focus:border-accent-blue outline-none rounded px-2 py-1 text-xs text-white" />
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

      {/* End Main Content Pane */}
        </div>
      </div>
    </div>
  );
}

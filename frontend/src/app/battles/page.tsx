"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Swords, Plus, Users, Bot, Zap, Skull, ChevronLeft, ChevronRight, PackageOpen, Target, Loader2, ArrowRight, User as UserIcon, X, Check, Eye, Link as LinkIcon, Volume2, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";
import Link from "next/link";
import io from "socket.io-client";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const CARD_SIZE = 120; 
const CARD_GAP = 12;
const STEP = CARD_SIZE + CARD_GAP;

function BattleSpinner({ targetItem, itemsPool, rolling, onComplete }: { targetItem: any, itemsPool: any[], rolling: boolean, onComplete: () => void }) {
  const [strip, setStrip] = useState<any[]>([]);
  const [trackOpacity, setTrackOpacity] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const hasRun = useRef(false);
  const bonusPool = itemsPool.filter((i: any) => i.isLuckyStarItem);

  useEffect(() => {
    if (!rolling) hasRun.current = false;
  }, [rolling]);

  useEffect(() => {
    if (!targetItem || itemsPool.length === 0) return;
    const newStrip = [];
    for (let i = 0; i < 55; i++) {
      if (i === 45) {
        newStrip.push(targetItem);
      } else {
        newStrip.push(itemsPool[Math.floor(Math.random() * itemsPool.length)]);
      }
    }
    setStrip(newStrip);
  }, [targetItem, itemsPool]);

  useEffect(() => {
    if (rolling && strip.length > 0 && !hasRun.current) {
      hasRun.current = true;
      let isMounted = true;
      const runAnim = async () => {
        await controls.set({ y: 0 });
        const containerHeight = trackRef.current ? trackRef.current.clientHeight : 160;
        const itemCenter = (45 * STEP) + (CARD_SIZE / 2);
        const jitter = (Math.random() - 0.5) * (CARD_SIZE * 0.6);
        const targetY = (containerHeight / 2) - itemCenter + jitter;

        await controls.start({
          y: targetY,
          transition: { duration: 3.5, ease: [0.12, 0.8, 0.15, 1] }
        });

        if (targetItem._hitLuckyStar && targetItem._actualWinItem) {
           await new Promise(r => setTimeout(r, 600));
           if (!isMounted) return;
           setTrackOpacity(0);
           await new Promise(r => setTimeout(r, 300));
           if (!isMounted) return;
           
           const newStrip = [];
           const safeBonusPool = bonusPool && bonusPool.length > 0 ? bonusPool : itemsPool;
           for (let i = 0; i < 55; i++) {
             if (i === 45) newStrip.push(targetItem._actualWinItem);
             else newStrip.push(safeBonusPool[Math.floor(Math.random() * safeBonusPool.length)]);
           }
           setStrip(newStrip);
           await controls.set({ y: 0 });
           setTrackOpacity(1);
           
           await controls.start({
             y: targetY,
             transition: { duration: 3.5, ease: [0.12, 0.8, 0.15, 1] }
           });
        }

        if (isMounted) onComplete();
      };
      runAnim();
      return () => { isMounted = false; };
    }
  }, [rolling, strip]);

  if (strip.length === 0) {
    return (
      <div className="w-full h-full bg-[#15181f]/80 rounded-2xl flex items-center justify-center backdrop-blur-md">
        <Loader2 className="animate-spin text-[#3a3d4a]" size={32} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      {/* Target line indicator - rendered by parent in Arena mode to span full width */}
      
      {/* Top and Bottom faded gradients */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0f1115] via-[#0f1115]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/80 to-transparent z-10 pointer-events-none" />
      
      <div ref={trackRef} className="w-full h-full flex justify-center relative overflow-hidden transition-opacity duration-300" style={{ opacity: trackOpacity }}>
        <motion.div 
          className="flex flex-col items-center w-full absolute top-0" 
          initial={{ y: 0 }}
          animate={controls} 
          style={{ gap: `${CARD_GAP}px` }}
        >
          {strip.map((item, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center relative select-none will-change-transform" style={{ height: `${CARD_SIZE}px` }}>
              <div 
                className="absolute inset-0 opacity-40" 
                style={{ background: `radial-gradient(circle at center, ${item.color || "#3b82f6"} 0%, transparent 70%)` }} 
              />
              <div className="relative z-10 h-20 flex items-center justify-center mb-1">
                {item.name === 'Lucky Star' ? (
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-60" style={{ background: 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)' }} />
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,1)] z-10 animate-[spin_3s_linear_infinite]">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="max-h-16 max-w-[80px] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]" />
                ) : (
                  <PackageOpen size={48} style={{ color: item.color || "#3b82f6" }} className="drop-shadow-xl opacity-90" />
                )}
              </div>
              <div className="relative z-10 text-center w-full px-1">
                <div className="text-white font-black text-[11px] truncate drop-shadow">{item.name}</div>
                <div className="text-[#a0a5b8] font-bold text-[10px] mt-0.5">
                  <DLCurrency amount={item.value} size="xs" className="text-[#a0a5b8]" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}


function TieBreakerSpinner({ tiedPlayers, winnerId, onComplete }: { tiedPlayers: string[], winnerId: string, onComplete: () => void }) {
  const [strip, setStrip] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const newStrip = [];
    for (let i = 0; i < 65; i++) {
      if (i === 55) {
        newStrip.push(winnerId);
      } else {
        newStrip.push(tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)]);
      }
    }
    setStrip(newStrip);
  }, [tiedPlayers, winnerId]);

  useEffect(() => {
    if (strip.length > 0) {
      let isMounted = true;
      const runAnim = async () => {
        await controls.set({ y: 0 });
        const containerHeight = trackRef.current ? trackRef.current.clientHeight : 400;
        const itemCenter = (55 * 156) + 72; // 144 height + 12 gap = 156 step
        const jitter = (Math.random() - 0.5) * 80;
        const targetY = (containerHeight / 2) - itemCenter + jitter;

        await controls.start({
          y: targetY,
          transition: { duration: 4.5, ease: [0.12, 0.8, 0.15, 1] }
        });
        if (isMounted) setTimeout(onComplete, 1500);
      };
      runAnim();
      return () => { isMounted = false; };
    }
  }, [strip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg flex flex-col items-center">
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-widest text-shadow-[0_0_20px_rgba(255,255,255,0.5)]">Tie Breaker!</h2>
        <p className="text-accent-blue font-bold mb-8">Picking a random winner from the tied players...</p>
        
        <div className="relative w-full h-[400px] rounded-3xl overflow-hidden bg-gradient-to-r from-[#1f222b] to-[#15181f] border-2 border-[#2a2d3a] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 z-20 shadow-[0_0_15px_rgba(234,179,8,1)] pointer-events-none" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[16px] border-l-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,1)]" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[16px] border-r-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,1)]" />
          
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#15181f] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#15181f] to-transparent z-10 pointer-events-none" />
          
          <div ref={trackRef} className="w-full h-full flex justify-center relative overflow-hidden">
            <motion.div 
              className="flex flex-col items-center w-full absolute top-0" 
              initial={{ y: 0 }}
              animate={controls} 
              style={{ gap: '12px' }}
            >
              {strip.map((userId, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center relative bg-[#1f222b] border border-[#2a2d3a] rounded-2xl w-48 will-change-transform" style={{ height: '144px' }}>
                  <div className="w-16 h-16 rounded-2xl bg-[#15181f] flex items-center justify-center text-3xl font-black text-white shadow-inner mb-3">
                    {userId.startsWith('bot-') ? <Bot size={36} className="text-accent-blue" /> : userId[0]}
                  </div>
                  <div className="text-white font-black text-sm truncate w-full px-2 text-center">{userId}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BattlesPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [view, setView] = useState<"lobby" | "create" | "battle">("lobby");
  const [battles, setBattles] = useState<any[]>([]);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [activeBattle, setActiveBattle] = useState<any>(null);
  
  const [createMode, setCreateMode] = useState("normal"); // normal, crazy, terminal
  const [createPlayers, setCreatePlayers] = useState(2);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [callAllBots, setCallAllBots] = useState(false);
  
  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rolling, setRolling] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [fullRoundsData, setFullRoundsData] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);

  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);
  const [tieBreakerData, setTieBreakerData] = useState<{tiedPlayers: string[], winnerId: string, totalPotValue?: number} | null>(null);

  const fetchLobby = async () => {
    try {
      const [resBattles, resCases] = await Promise.all([
        apiFetch("/battles"),
        apiFetch("/cases")
      ]);
      if (resBattles.ok) setBattles(await resBattles.json());
      if (resCases.ok) setAvailableCases(await resCases.json());
    } catch (e) {}
  };

  const socketRef = useRef<any>(null);
  const activeBattleIdRef = useRef<number | null>(null);

  useEffect(() => {
    activeBattleIdRef.current = activeBattle?.id || null;
  }, [activeBattle]);

  useEffect(() => {
    socketRef.current = io(backendUrl, { withCredentials: true });

    socketRef.current.on('battle_updated', (updatedBattle: any) => {
      // If we are looking at this battle, update it instantly
      setActiveBattle((prev: any) => {
        if (prev && prev.id === updatedBattle.id) {
          return updatedBattle;
        }
        return prev;
      });
      // Always refresh lobby behind the scenes
      fetchLobby();
    });

    socketRef.current.on('battle_started', async (payload: any) => {
      // payload: { battleId, rounds, winnerId, isTie, tiedPlayers, totalPotValue, numPlayers, mode, entryFee }
      if (activeBattleIdRef.current === payload.battleId) {
        setActiveBattle((prev: any) => prev ? { ...prev, status: 'running' } : prev);
        
        setFullRoundsData(payload.rounds);
        setRoundResults([]);
        setCurrentRound(0);
        let cumulativeResults: any[] = [];
        
        for (let i = 0; i < payload.rounds.length; i++) {
          setCurrentRound(i);
          setRolling(true);
          const hasLucky = payload.rounds[i].some((r: any) => r.hitLuckyStar);
          await new Promise(r => setTimeout(r, hasLucky ? 8500 : 4000)); 
          setRolling(false);
          cumulativeResults.push(payload.rounds[i]);
          setRoundResults([...cumulativeResults]);
          if (i < payload.rounds.length - 1) await new Promise(r => setTimeout(r, 500));
        }
        
        if (payload.isTie && payload.tiedPlayers && payload.tiedPlayers.length > 1) {
          setTieBreakerData({ tiedPlayers: payload.tiedPlayers, winnerId: payload.winnerId, totalPotValue: payload.totalPotValue });
          setFinalWinner(null);
          setIsTieBreakerOpen(true);
        } else {
          setTieBreakerData(null);
          setFinalWinner(payload.winnerId);
          setActiveBattle((prev: any) => prev ? { ...prev, status: 'finished', winnerId: payload.winnerId, totalPotValue: payload.totalPotValue } : prev);
        }
      }
      fetchLobby();
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (view === "lobby") {
      fetchLobby();
      const int = setInterval(fetchLobby, 5000);
      return () => clearInterval(int);
    }
  }, [view]);

  const addCaseToBattle = (caseId: string) => {
    if (selectedCaseIds.length >= 50) return;
    setSelectedCaseIds([...selectedCaseIds, caseId]);
  };

  const removeCaseFromBattle = (index: number) => {
    const newIds = [...selectedCaseIds];
    newIds.splice(index, 1);
    setSelectedCaseIds(newIds);
  };

  const totalCreateCost = selectedCaseIds.reduce((sum, id) => {
    const c = availableCases.find(x => x.id.toString() === id);
    return sum + (c ? c.price : 0);
  }, 0);

  const handleCreate = async () => {
    if (!user) return openAuthModal("login");
    if (selectedCaseIds.length === 0) return setError("Please select at least 1 case.");
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/battles/create", {
        method: "POST",
        body: JSON.stringify({ caseIds: selectedCaseIds, mode: createMode, playerCount: createPlayers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      let newBattle = data;
      
      // Handle "Call All Bots" automatically before redirecting to battle
      if (callAllBots && newBattle.participants.length < createPlayers) {
        const botRes = await apiFetch("/battles/call-bots", { 
            method: "POST", 
            body: JSON.stringify({ battleId: newBattle.id, botCount: createPlayers - newBattle.participants.length }) 
        });
        if (botRes.ok) {
            newBattle = await botRes.json();
        }
      }
      
      setActiveBattle(newBattle); setView("battle"); setRoundResults([]); setRolling(false); setFinalWinner(null); refreshUser();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleJoin = async (battleId: number) => {
    if (!user) return openAuthModal("login");
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/battles/join", {
        method: "POST", body: JSON.stringify({ battleId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveBattle(data); setView("battle"); setRoundResults([]); setRolling(false); setFinalWinner(null); refreshUser();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleCallBots = async (count: number) => {
    setLoading(true);
    try {
      const res = await apiFetch("/battles/call-bots", { method: "POST", body: JSON.stringify({ battleId: activeBattle.id, botCount: count }) });
      const data = await res.json();
      if (res.ok) setActiveBattle(data);
    } catch (e) {}
    setLoading(false);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/battles/start", { method: "POST", body: JSON.stringify({ battleId: activeBattle.id }) });
      if (!res.ok) throw new Error("Failed to start battle");
      // The socket listener handles the animation block.
    } catch (e) {}
    setLoading(false);
  };

  const getModeDetails = (mode: string) => {
    if (mode === "crazy") return { icon: Skull, color: "text-red-500", bg: "bg-red-500/20", label: "Crazy", desc: "Lowest Overall Wins" };
    if (mode === "terminal") return { icon: Target, color: "text-purple-500", bg: "bg-purple-500/20", label: "Terminal mode", desc: "Highest Last Pull Wins" };
    return { icon: Zap, color: "text-blue-500", bg: "bg-blue-500/20", label: "Standard", desc: "Highest Overall Wins" };
  };

  // Toggle helpers for modifiers
  const handleToggleModifier = (modifier: string) => {
      if (createMode === modifier) {
          setCreateMode("normal"); // toggle off
      } else {
          setCreateMode(modifier); // toggle on (mutually exclusive)
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {view !== "create" && (
        <div className="flex items-center justify-between mb-10 mt-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#1f222b] border border-[#2a2d3a] flex items-center justify-center text-white shadow-lg">
              <Swords size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Case Battles</h1>
              <p className="text-[#7a819c] font-medium mt-1">Compete head-to-head for massive case loot drops.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFairOpen(true)}
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#a0a5b8] hover:text-white transition-all bg-[#1f222b]/80 px-4 py-2.5 rounded-xl border border-[#2a2d3a] hover:border-accent-blue shadow-lg backdrop-blur-sm"
            >
              <ShieldCheck size={18} className="text-[#a0a5b8]" /> Provably Fair
            </button>
            {view === "lobby" && (
                <button
                onClick={() => { setView("create"); setCreateMode("normal"); setSelectedCaseIds([]); }}
                className="bg-accent-blue text-white px-5 py-2.5 rounded-xl font-black hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                Create Case Battle
                </button>
            )}
          </div>
        </div>
      )}

      <ProvablyFairModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />

      <AnimatePresence mode="wait">
        
        {/* LOBBY VIEW */}
        {view === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
            
            {/* Top Tabs */}
            <div className="flex justify-between items-end mb-6 border-b border-[#2a2d3a] pb-4">
              <div className="flex gap-2">
                <button className="bg-[#1c7ced] hover:bg-[#186dc4] text-white px-6 py-2.5 rounded-lg font-black transition-colors shadow-[0_0_15px_rgba(28,124,237,0.3)] flex items-center gap-2 text-sm">
                  <Swords size={18} /> Battles
                </button>
                <button className="bg-[#1f222b] hover:bg-[#2a2d3a] text-[#7a819c] hover:text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm">
                  <PackageOpen size={18} /> Blueprints
                </button>
              </div>
              <button
                onClick={() => { setView("create"); setCreateMode("normal"); setSelectedCaseIds([]); }}
                className="bg-[#1c7ced] text-white px-5 py-2.5 rounded-lg font-black hover:bg-[#186dc4] transition-colors shadow-[0_0_15px_rgba(28,124,237,0.3)] text-sm"
              >
                Create Case Battle
              </button>
            </div>

            <div className="flex items-center justify-end gap-6 text-[#7a819c] text-sm font-bold mb-2">
              <div className="flex items-center gap-2"><Users size={16} /> 12 In Lobby</div>
              <div className="flex items-center gap-2"><Swords size={16} /> 7 In Battles</div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <div className="flex bg-[#1a1d24] rounded-lg p-1 border border-[#2a2d3a]">
                <button className="bg-[#2a2d3a] text-white px-4 py-1.5 rounded-md font-bold text-sm transition-colors">
                  All <span className="ml-1 text-xs opacity-50">{battles.length}</span>
                </button>
                <button className="text-[#7a819c] hover:text-white px-4 py-1.5 rounded-md font-bold text-sm transition-colors">
                  Open <span className="ml-1 text-xs opacity-50">{battles.filter(b => b.status === "waiting").length}</span>
                </button>
                <button className="text-[#7a819c] hover:text-white px-4 py-1.5 rounded-md font-bold text-sm transition-colors">
                  In-progress <span className="ml-1 text-xs opacity-50">{battles.filter(b => b.status !== "waiting" && b.status !== "finished").length}</span>
                </button>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#7a819c]">Affordable</span>
                  <div className="w-10 h-5 bg-[#1a1d24] border border-[#2a2d3a] rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-0.5 w-4 h-4 bg-[#4d5366] rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#1a1d24] border border-[#2a2d3a] px-3 py-1.5 rounded-lg text-sm font-bold text-[#7a819c] cursor-pointer">
                  Sort By: <span className="text-white">Newest</span>
                  <ChevronLeft size={14} className="rotate-[-90deg] ml-1" />
                </div>
              </div>
            </div>
            
            {battles.length === 0 && (
              <div className="text-center py-20 bg-[#15181f] border border-[#2a2d3a] rounded-xl">
                <Swords size={48} className="text-[#2a2d3a] mx-auto mb-4" />
                <h3 className="text-xl font-black text-[#7a819c] mb-2">The arena is empty</h3>
                <p className="text-[#4d5366] font-medium text-sm">Create a battle to get the action started!</p>
              </div>
            )}
            
            <div className="space-y-2">
              {battles.map(b => {
                const m = getModeDetails(b.mode);
                let parsedCaseIds: string[] = [];
                try { parsedCaseIds = JSON.parse(b.caseIds); } catch(e) {}
                const maxPlayers = b.mode === "2v2" ? 4 : (b.mode === "3v3" ? 6 : (b.playerCount || 4));

                return (
                  <motion.div 
                    key={b.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-[#1a1d24] border border-[#2a2d3a] hover:border-[#3a3d4a] rounded-xl p-4 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-8 w-full">
                      {/* Left: Mode & Players */}
                      <div className="flex flex-col gap-3 min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-white text-[11px] font-black uppercase tracking-wider">{b.mode === 'normal' ? 'Normal' : b.mode}</span>
                          {b.mode !== 'normal' && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${m.bg} ${m.color}`}>80%</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {b.participants.map((p: any) => (
                            <div key={p.id} className="w-6 h-6 rounded bg-[#2a2d3a] flex items-center justify-center text-xs font-black text-white">
                              {p.userId.startsWith('bot-') ? <Bot size={12} className="text-[#1c7ced]" /> : p.userId[0]}
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, maxPlayers - b.participants.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-6 h-6 rounded bg-[#2a2d3a]/50 border border-[#2a2d3a] border-dashed flex items-center justify-center">
                              <UserIcon size={12} className="text-[#4d5366]" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Middle: Cases */}
                      <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[40px]">
                        {parsedCaseIds.slice(0, 10).map((cid, i) => {
                          const c = availableCases.find(x => x.id.toString() === cid);
                          return (
                            <div key={i} className="w-10 h-10 bg-[#15181f] border border-[#2a2d3a] rounded-lg flex items-center justify-center p-1 relative group/case cursor-pointer">
                              {c?.image ? (
                                <img src={c.image} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <PackageOpen size={20} className="text-[#4d5366]" />
                              )}
                              <div className="absolute top-0 right-0 w-3 h-3 bg-green-500/20 text-green-500 rounded-bl flex items-center justify-center text-[8px] font-bold">
                                1
                              </div>
                            </div>
                          );
                        })}
                        {parsedCaseIds.length > 10 && (
                          <div className="w-10 h-10 bg-[#15181f] border border-[#2a2d3a] rounded-lg flex items-center justify-center text-xs font-bold text-[#7a819c]">
                            +{parsedCaseIds.length - 10}
                          </div>
                        )}
                      </div>

                      {/* Right: Cost & Status */}
                      <div className="flex items-center gap-8 shrink-0">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-1">Battle Cost</span>
                          <span className="text-white font-black text-sm flex items-center gap-1">
                            <DLCurrency amount={b.entryFee} size="sm" className="text-white" />
                          </span>
                        </div>
                        
                        <div className="w-[120px] text-center">
                          {b.status === "waiting" ? (
                            <button
                              onClick={() => handleJoin(b.id)}
                              disabled={loading || b.participants.length >= maxPlayers}
                              className="w-full py-2.5 bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black rounded-lg transition-all disabled:opacity-50 text-xs shadow-[0_0_10px_rgba(28,124,237,0.2)]"
                            >
                              Join
                            </button>
                          ) : b.status === "finished" ? (
                            <span className="text-[#7a819c] font-bold text-sm">Finished</span>
                          ) : (
                            <span className="text-white font-bold text-sm">Round 1 of {parsedCaseIds.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CREATE BATTLE VIEW */}
        {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
                
                {/* Create View Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2a2d3a]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView("lobby")} className="w-10 h-10 bg-[#1a1d24] border border-[#2a2d3a] hover:bg-[#2a2d3a] rounded-lg transition-colors flex items-center justify-center text-white shadow-lg">
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-white">Create Case Battle</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-[#1a1d24] border border-[#2a2d3a] hover:bg-[#2a2d3a] text-white px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm shadow-lg">
                            <PackageOpen size={16} /> Save as blueprint
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={loading || selectedCaseIds.length === 0}
                            className="bg-[#1c7ced] hover:bg-[#186dc4] text-white px-6 py-2.5 rounded-lg font-black transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(28,124,237,0.3)]"
                        >
                            <span>Create Case Battle</span>
                            <span className="flex items-center gap-1 opacity-90"><DLCurrency amount={totalCreateCost} size="sm" className="text-white"/></span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* LEFT COLUMN: Main Area */}
                    <div className="flex-1">
                        
                        {/* Mode Selection Cards */}
                        <div className="flex gap-4 mb-8">
                            <button className="flex-1 bg-[#1a1d24] border border-[#2a2d3a] p-4 rounded-xl text-left flex items-start gap-4 transition-all">
                                <div className="text-[#a0a5b8] shrink-0 mt-1">
                                    <Swords size={20} />
                                </div>
                                <div>
                                    <div className="text-white font-black text-sm mb-0.5">Normal</div>
                                    <div className="text-[#7a819c] text-[11px] font-bold">Highest total value unboxed wins</div>
                                </div>
                            </button>
                            <button className="flex-1 bg-[#15181f] border border-[#2a2d3a] p-4 rounded-xl text-left flex items-start gap-4 transition-all opacity-50 relative overflow-hidden">
                                <div className="absolute top-2 right-2 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">NEW</div>
                                <div className="text-[#a0a5b8] shrink-0 mt-1">
                                    <PackageOpen size={20} />
                                </div>
                                <div>
                                    <div className="text-white font-black text-sm mb-0.5">Bonus Mode</div>
                                    <div className="text-[#7a819c] text-[11px] font-bold">Unbox with a bonus twist</div>
                                </div>
                            </button>
                            <button className="flex-1 bg-[#15181f] border border-[#2a2d3a] p-4 rounded-xl text-left flex items-start gap-4 transition-all opacity-50">
                                <div className="text-[#a0a5b8] shrink-0 mt-1">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="text-white font-black text-sm mb-0.5">Shared Mode</div>
                                    <div className="text-[#7a819c] text-[11px] font-bold">Share the winnings equally</div>
                                </div>
                            </button>
                        </div>

                        {/* Add Cases Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <PackageOpen size={16} className="text-[#a0a5b8]" />
                                <h3 className="text-white font-black text-sm">Add Cases</h3>
                                <div className="bg-[#2a2d3a] text-[#a0a5b8] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{selectedCaseIds.length} ROUNDS</div>
                                {selectedCaseIds.length > 0 && (
                                    <button onClick={() => setSelectedCaseIds([])} className="ml-auto text-[11px] text-red-500 font-bold hover:underline">Clear</button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {/* Add Cases Button */}
                                <button 
                                    onClick={() => setIsCaseModalOpen(true)}
                                    className="w-[140px] h-[180px] bg-[#1a1d24]/50 border-2 border-dashed border-[#2a2d3a] hover:border-[#3a3d4a] rounded-xl flex flex-col items-center justify-center text-[#7a819c] hover:text-white transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#2a2d3a] flex items-center justify-center mb-3">
                                      <Plus size={16} className="text-white" />
                                    </div>
                                    <span className="font-black text-[11px] uppercase tracking-wider">Add Case</span>
                                </button>
                                
                                {/* Selected Cases Grid */}
                                {selectedCaseIds.map((id, index) => {
                                    const c = availableCases.find(x => x.id.toString() === id);
                                    return (
                                        <div key={index} className="group relative w-[140px] h-[180px] bg-[#1a1d24] border border-[#2a2d3a] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                            <button 
                                                onClick={() => removeCaseFromBattle(index)}
                                                className="absolute top-2 right-2 w-6 h-6 rounded bg-[#2a2d3a] hover:bg-red-500/20 text-[#a0a5b8] hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="h-20 flex items-center justify-center mb-3">
                                                {c?.image ? (
                                                    <img src={c.image} alt="" className="max-h-full max-w-full object-contain drop-shadow-lg" />
                                                ) : (
                                                    <PackageOpen className="text-[#4d5366]" size={32} />
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[#a0a5b8] font-bold truncate w-full mb-1">{c?.name || id}</div>
                                            <div className="text-xs text-white font-black flex items-center gap-1">
                                              <DLCurrency amount={c ? c.price : 0} size="xs" className="text-white" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sidebar (Darker background) */}
                    <div className="w-[340px] shrink-0 bg-[#15181f] border border-[#2a2d3a] rounded-xl p-5 self-start shadow-xl">
                        
                        {/* Select Players */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <UserIcon size={16} className="text-[#a0a5b8]" />
                                  <h3 className="text-white font-black text-sm">Add Players</h3>
                                </div>
                            </div>
                            
                            <div className="bg-[#1a1d24] border border-[#2a2d3a] rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#2a2d3a] transition-colors mb-3">
                                <div className="flex items-center gap-2 text-[#7a819c] font-black text-sm">
                                  <UserIcon size={14} /> x <UserIcon size={14} />
                                </div>
                                <ChevronLeft size={16} className="rotate-[-90deg] text-[#4d5366]" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {/* Slot 1: You */}
                                <div className="bg-[#1a1d24] border border-[#1c7ced]/30 rounded-lg p-3 flex items-center gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#1c7ced]" />
                                    <div className="w-8 h-8 rounded bg-[#1c7ced]/20 text-[#1c7ced] flex items-center justify-center">
                                        <UserIcon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-wider mb-0.5">Slot 1</div>
                                        <div className="text-white text-[11px] font-bold">You</div>
                                    </div>
                                </div>
                                {/* Slot 2 */}
                                {Array.from({length: createPlayers - 1}).map((_, i) => (
                                    <div key={i} className="bg-[#1a1d24] border border-[#2a2d3a] rounded-lg p-3 flex items-center gap-3 opacity-70">
                                        <div className="w-8 h-8 rounded bg-[#2a2d3a] text-[#4d5366] flex items-center justify-center">
                                            <UserIcon size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-[#7a819c] font-black uppercase tracking-wider mb-0.5">Slot {i+2}</div>
                                            <div className="text-[#7a819c] text-[11px] font-bold">Empty</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                <span className="text-[#a0a5b8] font-bold text-[11px]">Call all bots</span>
                                <div 
                                    onClick={() => setCallAllBots(!callAllBots)}
                                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${callAllBots ? 'bg-[#1c7ced]' : 'bg-[#2a2d3a]'}`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${callAllBots ? 'left-[19px]' : 'left-[3px]'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Modifiers List */}
                        <div className="mb-6">
                            <h3 className="text-[#a0a5b8] font-black text-xs mb-3">Modifiers</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><PackageOpen size={14} /> Jackpot Mode</span>
                                    <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><Target size={14} /> Crazy Mode</span>
                                    <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><ShieldCheck size={14} /> Terminal Mode</span>
                                    <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><Swords size={14} /> Biggest Pull</span>
                                    <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* More List */}
                        <div>
                            <h3 className="text-[#a0a5b8] font-black text-xs mb-3">More</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><Bot size={14} /> Borrow</span>
                                    <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                        <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><Lock size={14} /> Private</span>
                                        <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                        <span className="text-[#7a819c] font-bold text-[11px] flex items-center gap-1.5"><Zap size={14} /> Fast Spin</span>
                                        <div className="w-9 h-5 rounded-full bg-[#2a2d3a] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-[#4d5366] absolute top-[3px] left-[3px]" /></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1a1d24] rounded-lg border border-[#2a2d3a]">
                                    <span className="text-white font-bold text-[11px] flex items-center gap-1.5"><div className="text-[#1c7ced]">★</div> Big Pull Animation</span>
                                    <div className="w-9 h-5 rounded-full bg-[#1c7ced] relative cursor-pointer"><div className="w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] left-[19px]" /></div>
                                </div>
                            </div>
                        </div>

                        {error && <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-3 rounded-lg text-center">{error}</div>}

                    </div>
                </div>

                {/* Case Selection Modal */}
                <AnimatePresence>
                    {isCaseModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 bg-[#0a0b0f]/80 backdrop-blur-sm"
                                onClick={() => setIsCaseModalOpen(false)}
                            />
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative bg-[#15181f] border border-[#2a2d3a] rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-[#2a2d3a]">
                                    <h2 className="text-2xl font-black text-white">Select Cases</h2>
                                    <button onClick={() => setIsCaseModalOpen(false)} className="text-[#7a819c] hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {availableCases.filter(c => c.active).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => addCaseToBattle(c.id.toString())}
                                            className="group bg-[#1f222b] border border-[#2a2d3a] rounded-2xl p-4 hover:border-accent-green transition-all hover:-translate-y-1 text-center"
                                        >
                                            <div className="h-16 flex items-center justify-center mb-3">
                                                {c.image ? (
                                                    <img src={c.image} alt="" className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <PackageOpen className="text-[#4d5366] group-hover:text-accent-green transition-colors" size={32} />
                                                )}
                                            </div>
                                            <div className="text-[11px] text-white font-bold truncate mb-1">{c.name}</div>
                                            <div className="text-xs text-accent-green font-black">
                                              <DLCurrency amount={c.price} size="xs" className="text-accent-green" />
                                            </div>
                                            
                                            {/* Badge to show how many of this case are selected */}
                                            {selectedCaseIds.filter(id => id === c.id.toString()).length > 0 && (
                                                <div className="absolute top-2 right-2 bg-accent-green text-black text-[10px] font-black w-5 h-5 rounded flex items-center justify-center">
                                                    {selectedCaseIds.filter(id => id === c.id.toString()).length}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        )}

        {/* BATTLE VIEW */}
        {view === "battle" && (
          <motion.div key="battle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            {activeBattle && (
              <div className="space-y-4 max-w-[1400px] mx-auto mt-4">
                
                {/* BATTLE HEADER */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setView("lobby")}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#a0a5b8] hover:text-white hover:bg-[#2a2d3a] border border-[#2a2d3a] transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#1c7ced]/20 text-[#1c7ced] font-black px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm border border-[#1c7ced]/30">
                        <Users size={16} /> 2 Teams
                      </div>
                      <div className="bg-[#1a1d24] border border-[#2a2d3a] text-white font-black px-4 py-1.5 rounded-lg text-sm">
                        Round {currentRound + 1} of {JSON.parse(activeBattle.caseIds || '[]').length}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#1a1d24] border border-[#2a2d3a] p-1.5 rounded-lg text-[#a0a5b8]"><Zap size={14} /></div>
                        <div className="bg-[#1a1d24] border border-[#2a2d3a] p-1.5 rounded-lg text-[#a0a5b8]"><PackageOpen size={14} /></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <button className="bg-[#1a1d24] border border-[#2a2d3a] w-10 h-10 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><Eye size={18} /></button>
                      <button className="bg-[#1a1d24] border border-[#2a2d3a] w-10 h-10 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><LinkIcon size={18} /></button>
                      <button className="bg-[#1a1d24] border border-[#2a2d3a] w-10 h-10 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><ShieldCheck size={18} /></button>
                      <button className="bg-[#1a1d24] border border-[#2a2d3a] w-10 h-10 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><Volume2 size={18} /></button>
                    </div>
                    <div className="bg-[#15181f] border border-[#2a2d3a] px-5 py-2 rounded-lg flex items-center gap-3 text-sm">
                      <span className="text-[#7a819c] font-black uppercase tracking-wider text-[10px]">Battle Cost</span>
                      <span className="text-white font-black flex items-center gap-1">
                        <DLCurrency amount={activeBattle.participants.length * activeBattle.entryFee} size="sm" className="text-white" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* CASES SEQUENCE TAPE */}
                <div className="bg-[#15181f] border border-[#2a2d3a] rounded-xl p-3 flex items-center gap-2 overflow-hidden shadow-lg relative">
                  <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#15181f] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#15181f] to-transparent z-10" />
                  
                  {JSON.parse(activeBattle.caseIds || '[]').map((cid: string, i: number) => {
                    const c = availableCases.find(x => x.id.toString() === cid);
                    const isCurrent = i === currentRound;
                    const isPast = i < currentRound;
                    return (
                      <div key={i} className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 flex items-center justify-center relative transition-all ${isCurrent ? 'border-accent-green bg-accent-green/10 scale-110 z-20 mx-2' : isPast ? 'border-[#2a2d3a] bg-[#1a1d24] opacity-50' : 'border-[#2a2d3a] bg-[#1a1d24]'}`}>
                        {c?.image ? <img src={c.image} className="w-8 h-8 object-contain" /> : <PackageOpen size={16} className="text-[#4d5366]" />}
                        <div className="absolute -bottom-1 -right-1 bg-[#1a1d24] border border-[#2a2d3a] w-4 h-4 rounded text-[8px] flex items-center justify-center font-bold text-[#7a819c]">{i+1}</div>
                      </div>
                    )
                  })}
                </div>
                
                {/* BATTLE ARENA (Spinners) */}
                <div className="bg-[#0f1115] border border-[#2a2d3a] rounded-xl relative overflow-hidden flex flex-col mt-4">
                  
                  {/* Floating Case Label */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px z-30">
                    <div className="bg-[#0f1115] border-x border-b border-[#2a2d3a] rounded-b-xl px-6 py-1.5 flex items-center gap-3 shadow-md">
                      {(() => {
                        const caseIdsList = JSON.parse(activeBattle.caseIds || '[]');
                        const roundCaseId = caseIdsList[currentRound];
                        const roundCase = availableCases.find(c => c.id.toString() === roundCaseId?.toString());
                        return roundCase ? (
                          <>
                            <span className="text-[#a0a5b8] font-black text-[10px] uppercase tracking-widest">{roundCase.name}</span>
                            <span className="text-white font-black text-[10px] flex items-center gap-1">
                              <DLCurrency amount={roundCase.price} size="xs" className="text-white" />
                            </span>
                          </>
                        ) : (
                          <span className="text-white text-[10px]">Waiting...</span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Arena Columns */}
                  <div className="flex relative flex-1 min-h-[500px]">
                    
                    {/* Left/Right Navigation Arrows (Floating) */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
                      <button className="text-[#1c7ced] hover:text-white transition-colors drop-shadow-md"><ChevronLeft size={32} /></button>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
                      <button className="text-[#1c7ced] hover:text-white transition-colors drop-shadow-md"><ChevronRight size={32} /></button>
                    </div>

                    {/* Target Line spanning full width */}
                    <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-[1px] bg-[#2a2d3a] z-20 pointer-events-none" />
                    <div className="absolute left-12 top-1/2 -translate-y-1/2 w-4 h-4 -ml-2 text-[#2a2d3a] z-20 pointer-events-none flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 -mr-2 text-[#2a2d3a] z-20 pointer-events-none flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </div>

                    {/* Vertical Divider for Teams */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#2a2d3a]/50 z-20 pointer-events-none" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#15181f] border border-[#2a2d3a] rounded flex items-center justify-center z-30 shadow-md">
                      <Swords size={14} className="text-[#4d5366]" />
                    </div>

                    {/* Players */}
                    <div 
                      className="w-full grid relative z-10" 
                      style={{ gridTemplateColumns: `repeat(${activeBattle.participants.length || 2}, minmax(0, 1fr))` }}
                    >
                      {activeBattle.participants.map((p: any, idx: number) => {
                        const isBot = p.userId.startsWith('bot-');
                        const isWinner = finalWinner === p.userId;
                        
                        let targetItemForSpin = null;
                        let currentCaseItemsPool: any[] = [];
                        
                        const displayRound = activeBattle.status === 'finished' 
                          ? Math.max(0, JSON.parse(activeBattle.caseIds || '[]').length - 1) 
                          : currentRound;

                        if (fullRoundsData[displayRound]) {
                          const myCurrentRoll = fullRoundsData[displayRound].find((r:any) => r.userId === p.userId);
                          if (myCurrentRoll) {
                            targetItemForSpin = myCurrentRoll.item;
                            const caseIdsList = JSON.parse(activeBattle.caseIds || '[]');
                            const roundCaseId = caseIdsList[displayRound];
                            const roundCase = availableCases.find(c => c.id.toString() === roundCaseId?.toString());
                            if (roundCase) {
                              currentCaseItemsPool = roundCase.items || [targetItemForSpin]; 
                            }
                            // Store actualWinItem and hitLuckyStar for rendering
                            (targetItemForSpin as any)._actualWinItem = myCurrentRoll.actualWinItem;
                            (targetItemForSpin as any)._hitLuckyStar = myCurrentRoll.hitLuckyStar;
                          }
                        }

                        let currentLootValue = 0;
                        if (roundResults.length > 0) {
                          roundResults.forEach((round: any[]) => {
                            const myRoll = round.find(r => r.userId === p.userId);
                            if (myRoll) {
                              currentLootValue += myRoll.actualWinItem ? myRoll.actualWinItem.value : myRoll.item.value;
                            }
                          });
                        }
                        
                        return (
                          <div key={p.id} className={`relative flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${isWinner ? 'bg-accent-green/5' : ''}`}>
                            {isWinner && <div className="absolute inset-0 bg-gradient-to-b from-accent-green/20 to-transparent pointer-events-none z-0" />}
                            
                            {/* Player Badge */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#15181f]/90 backdrop-blur-sm border border-[#2a2d3a] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg min-w-max">
                              <div className="w-5 h-5 rounded flex items-center justify-center text-white font-black text-[10px] bg-[#2a2d3a]">
                                {isBot ? <Bot size={12} className="text-[#a0a5b8]" /> : p.userId[0]}
                              </div>
                              <div className="text-white text-xs font-bold truncate max-w-[80px] mr-1">{p.userId}</div>
                              {targetItemForSpin && (
                                <div className="absolute top-10 text-red-500 z-50 text-[10px]">
                                  Debug: {JSON.stringify({ hitLS: (targetItemForSpin as any)._hitLuckyStar, hasActual: !!(targetItemForSpin as any)._actualWinItem })}
                                </div>
                              )}
                              <div className="flex items-center gap-1 font-black text-xs text-white">
                                <DLCurrency amount={currentLootValue} size="sm" className="text-white" />
                              </div>
                            </div>

                            {/* Spinner Container */}
                            <div className="relative z-10 w-full h-[400px] flex items-center justify-center">
                              {rolling && targetItemForSpin ? (
                                <BattleSpinner key={`${displayRound}-${p.id}`} targetItem={targetItemForSpin} itemsPool={currentCaseItemsPool} rolling={rolling} onComplete={() => {}} />
                              ) : targetItemForSpin ? (
                                <div className="flex flex-col items-center justify-center relative">
                                  {/* If it was a lucky star, animate crossfade to the actual item */}
                                  {(targetItemForSpin as any)._hitLuckyStar && (targetItemForSpin as any)._actualWinItem ? (
                                    <div className="w-24 h-24 flex items-center justify-center relative drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]">
                                      {/* Blue star fades out quickly */}
                                      <div className="absolute inset-0 flex items-center justify-center animate-out fade-out duration-[1000ms] fill-mode-forwards z-20">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,1)] animate-[spin_3s_linear_infinite]">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                      </div>
                                      {/* Actual item fades in */}
                                      <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-[1000ms] delay-500 fill-mode-both z-10">
                                        {(targetItemForSpin as any)._actualWinItem.imageUrl ? (
                                          <img src={(targetItemForSpin as any)._actualWinItem.imageUrl} alt="" className="max-w-full max-h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
                                        ) : (
                                          <div className="w-16 h-16 rounded-full" style={{ backgroundColor: (targetItemForSpin as any)._actualWinItem.color || '#3b82f6', boxShadow: `0 0 30px ${(targetItemForSpin as any)._actualWinItem.color || '#3b82f6'}` }} />
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-24 h-24 flex items-center justify-center animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                      {targetItemForSpin.name === 'Lucky Star' ? (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,1)] animate-[spin_3s_linear_infinite]">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                      ) : targetItemForSpin.imageUrl ? (
                                        <img src={targetItemForSpin.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                                      ) : (
                                        <div className="w-16 h-16 rounded-full" style={{ backgroundColor: targetItemForSpin.color || '#3b82f6', boxShadow: `0 0 30px ${targetItemForSpin.color || '#3b82f6'}` }} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center opacity-10 h-full">
                                  <PackageOpen size={48} className="text-[#3a3d4a]" />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Empty slots for missing participants to maintain grid */}
                      {Array.from({ length: Math.max(0, (activeBattle.participants.length > 2 ? 4 : 2) - activeBattle.participants.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="relative flex flex-col items-center justify-center pt-6 opacity-30">
                          <Users size={32} className="text-[#4d5366]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PLAYER HISTORY GRID */}
                <div className={`grid gap-4 ${activeBattle.participants.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                  {activeBattle.participants.map((p: any, idx: number) => {
                    const isBot = p.userId.startsWith('bot-');
                    const isWinner = finalWinner === p.userId;
                    
                        let currentLootValue = 0;
                        if (roundResults.length > 0) {
                          roundResults.forEach((round: any[]) => {
                            const myRoll = round.find(r => r.userId === p.userId);
                            if (myRoll) {
                              const itemValue = myRoll.hitLuckyStar && myRoll.actualWinItem ? myRoll.actualWinItem.value : myRoll.item.value;
                              currentLootValue += itemValue;
                            }
                          });
                        }

                    return (
                      <div key={p.id} className="bg-[#15181f] border border-[#2a2d3a] rounded-xl overflow-hidden">
                        
                        {/* Player Header */}
                        <div className={`p-4 border-b ${isWinner ? 'border-accent-green/50 bg-accent-green/10' : 'border-[#2a2d3a] bg-[#1a1d24]'} flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#2a2d3a] flex items-center justify-center text-white font-black text-xs">
                              {isBot ? <Bot size={16} className="text-accent-blue" /> : p.userId[0]}
                            </div>
                            <div className="text-white font-black text-sm truncate max-w-[100px]">{p.userId}</div>
                          </div>
                          <div className={`font-black text-sm flex items-center gap-1 ${isWinner ? 'text-accent-green' : 'text-white'}`}>
                            <DLCurrency amount={currentLootValue} size="sm" className={isWinner ? 'text-accent-green' : 'text-white'} />
                          </div>
                        </div>

                        {/* Roll History */}
                        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col-reverse">
                          {[...roundResults].reverse().map((round: any[], roundIdxRaw: number) => {
                            const actualRoundIdx = roundResults.length - 1 - roundIdxRaw;
                            const myRoll = round.find(r => r.userId === p.userId);
                            if (!myRoll) return null;
                            const displayItem = myRoll.hitLuckyStar && myRoll.actualWinItem ? myRoll.actualWinItem : myRoll.item;
                            return (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={actualRoundIdx} 
                                className="bg-[#1a1d24] p-3 rounded-lg border border-[#2a2d3a] flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {displayItem.imageUrl ? (
                                    <img src={displayItem.imageUrl} alt="" className="w-8 h-8 object-contain drop-shadow-md" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: displayItem.color || "#3b82f6", boxShadow: `0 0 10px ${displayItem.color}` }} />
                                  )}
                                  <div>
                                    <div className="text-white text-[10px] opacity-50 uppercase tracking-widest font-bold mb-0.5">Round {actualRoundIdx + 1}</div>
                                    <div className="text-xs text-white truncate font-bold">{displayItem.name}</div>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-white flex items-center gap-1">
                                  <DLCurrency amount={displayItem.value} size="sm" className="text-white" />
                                </span>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Empty slots */}
                  {Array.from({ length: 4 - activeBattle.participants.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-[#15181f]/50 border border-dashed border-[#2a2d3a] rounded-xl flex flex-col items-center justify-center p-8 opacity-50 min-h-[200px]">
                      <div className="w-12 h-12 rounded-lg bg-[#1a1d24] border border-[#2a2d3a] flex items-center justify-center mb-3">
                        <Users size={20} className="text-[#4d5366]" />
                      </div>
                      <div className="text-[10px] font-black text-[#4d5366] uppercase tracking-widest">Waiting</div>
                    </div>
                  ))}
                </div>

                {/* CONTROLS */}
                {activeBattle.status === "waiting" && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-end mt-4">
                    <button
                      onClick={() => handleCallBots(4 - activeBattle.participants.length)}
                      disabled={loading}
                      className="px-6 py-3 bg-[#1a1d24] text-white font-black rounded-lg border border-[#2a2d3a] hover:bg-[#2a2d3a] transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                    >
                      <Bot size={18} className="text-[#a0a5b8]" /> Call Bots
                    </button>
                    {activeBattle.participants.find((p: any) => p.userId === user?.id.toString())?.position === 1 && (
                      <button
                        onClick={handleStart}
                        disabled={loading || activeBattle.participants.length < 2}
                        className="px-8 py-3 bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(28,124,237,0.3)]"
                      >
                        Start Battle <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isTieBreakerOpen && tieBreakerData && (
                    <TieBreakerSpinner
                      tiedPlayers={tieBreakerData.tiedPlayers}
                      winnerId={tieBreakerData.winnerId}
                      onComplete={() => {
                        setIsTieBreakerOpen(false);
                        setFinalWinner(tieBreakerData.winnerId);
                        setActiveBattle({ ...activeBattle, status: 'finished', winnerId: tieBreakerData.winnerId, totalPotValue: tieBreakerData.totalPotValue });
                        refreshUser();
                      }}
                    />
                  )}
                </AnimatePresence>

                {finalWinner && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-accent-green/10 border border-accent-green/30 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(0,230,118,0.1)] mt-8"
                  >
                    <div className="inline-block bg-accent-green text-black font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Winner Takes All</div>
                    <h2 className="text-5xl font-black text-white mb-2 tracking-tight">{finalWinner}</h2>
                    <div className="text-accent-green font-black text-2xl drop-shadow-md flex items-center justify-center gap-1 mt-2">
                      <span>Total Loot Won:</span>
                      <DLCurrency amount={activeBattle.totalPotValue || (activeBattle.participants.length * activeBattle.entryFee)} size="lg" className="text-accent-green" />
                    </div>
                    <p className="text-xs text-[#7a819c] mt-2 max-w-md mx-auto">
                      All won items have been transferred to the winner's inventory. You can keep them or choose to sell them for Diamond Locks in your inventory!
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Link 
                        href="/inventory" 
                        className="px-6 py-3 bg-gradient-to-r from-accent-green to-[#00e676] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.4)] hover:shadow-[0_0_30px_rgba(0,230,118,0.7)] transition-all"
                      >
                        View Inventory to Sell for DLs
                      </Link>
                    </div>
                  </motion.div>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

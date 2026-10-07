"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ShieldCheck, Swords, Plus, Users, Bot, Zap, Skull, ChevronLeft, ChevronRight, PackageOpen, Target, Loader2, ArrowRight, User as UserIcon, X, Check, Eye, Link as LinkIcon, Volume2, Lock, FileText, Dices, Ghost, Gem, Terminal, Settings2 } from "lucide-react";
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

function BattleSpinner({ targetItem, itemsPool, rolling, onComplete, isFast }: { targetItem: any, itemsPool: any[], rolling: boolean, onComplete: () => void, isFast?: boolean }) {
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
          transition: { duration: isFast ? 0.8 : 3.5, ease: [0.12, 0.8, 0.15, 1] }
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
             transition: { duration: isFast ? 0.8 : 3.5, ease: [0.12, 0.8, 0.15, 1] }
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
              <div className="relative z-10 h-20 flex items-center justify-center mb-1">
                {item.name === 'Lucky Star' ? (
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-60" style={{ background: 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)' }} />
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,1)] z-10 animate-[spin_3s_linear_infinite]">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                ) : item.imageUrl ? (
                  <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} alt={item.name} className="max-h-16 max-w-[80px] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]" />
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


function TieBreakerSpinner({ tiedPlayers, winnerId, onComplete, participants = [], isFast }: { tiedPlayers: string[], winnerId: string, onComplete: () => void, participants?: any[], isFast?: boolean }) {
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
          transition: { duration: isFast ? 0.8 : 4.5, ease: [0.12, 0.8, 0.15, 1] }
        });
        if (isMounted) setTimeout(onComplete, isFast ? 500 : 1500);
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
              {strip.map((userId, i) => {
                const participant = participants.find(p => p.userId === userId);
                const displayName = participant?.username || userId;
                return (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center relative bg-[#1f222b] border border-[#2a2d3a] rounded-2xl w-48 will-change-transform" style={{ height: '144px' }}>
                    <div className="w-16 h-16 rounded-2xl bg-[#15181f] flex items-center justify-center text-3xl font-black text-white shadow-inner mb-3">
                      {userId.startsWith('bot-') ? <Bot size={36} className="text-accent-blue" /> : displayName[0]}
                    </div>
                    <div className="text-white font-black text-sm truncate w-full px-2 text-center">{displayName}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JackpotSpinner({ teamStats, winnerId, onComplete, participants = [], isFast, mode }: { teamStats: any, winnerId: string, onComplete: () => void, participants?: any[], isFast?: boolean, mode: string }) {
  const [strip, setStrip] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    let statToUse = (s: any) => s.total;
    if (mode.includes('terminal')) statToUse = (s: any) => s.lastPull;

    const tStatsArr = Object.entries(teamStats);
    
    let weights: {id: string, weight: number}[] = [];
    if (mode.includes('crazy')) {
      const maxVal = Math.max(...tStatsArr.map(([, s]) => statToUse(s)));
      weights = tStatsArr.map(([id, s]) => ({ id, weight: maxVal - statToUse(s) + 1 }));
    } else {
      weights = tStatsArr.map(([id, s]) => ({ id, weight: statToUse(s) }));
    }
    const totalWeight = weights.reduce((acc, curr) => acc + curr.weight, 0);

    const getWeightedRandomTeam = () => {
       if (totalWeight === 0) return weights[Math.floor(Math.random() * weights.length)].id;
       let r = Math.random() * totalWeight;
       for (const w of weights) {
         r -= w.weight;
         if (r <= 0) return w.id;
       }
       return weights[0].id;
    };

    const newStrip = [];
    for (let i = 0; i < 65; i++) {
      let tId = '';
      if (i === 55) {
        tId = Object.keys(teamStats).find(key => teamStats[key as any].members.join(',') === winnerId) || '0';
      } else {
        tId = getWeightedRandomTeam();
      }
      newStrip.push(tId);
    }
    setStrip(newStrip);
  }, [teamStats, winnerId, mode]);

  useEffect(() => {
    if (strip.length > 0) {
      let isMounted = true;
      const runAnim = async () => {
        await controls.set({ x: 0 });
        const containerWidth = trackRef.current ? trackRef.current.clientWidth : 800;
        const itemCenter = (55 * 104) + 48; // 96 width (24rem=96px) + 8 gap = 104 step
        const jitter = (Math.random() - 0.5) * 60;
        const targetX = (containerWidth / 2) - itemCenter + jitter;

        await controls.start({
          x: targetX,
          transition: { duration: isFast ? 0.8 : 4.5, ease: [0.12, 0.8, 0.15, 1] }
        });
        if (isMounted) setTimeout(onComplete, isFast ? 500 : 1500);
      };
      runAnim();
      return () => { isMounted = false; };
    }
  }, [strip]);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full mt-6 flex flex-col items-center overflow-hidden">
      <div className="text-accent-blue font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
        <PackageOpen size={14} /> Jackpot Spin
      </div>
      
      <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-gradient-to-r from-[#1f222b] via-[#15181f] to-[#1f222b] border border-[#2a2d3a] shadow-inner mb-4">
        {/* Center Target Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-yellow-400 z-20 shadow-[0_0_15px_rgba(234,179,8,1)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
        
        {/* Fades */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#15181f] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#15181f] to-transparent z-10 pointer-events-none" />
        
        <div ref={trackRef} className="w-full h-full flex items-center relative overflow-hidden">
          <motion.div 
            className="flex items-center absolute left-0" 
            initial={{ x: 0 }}
            animate={controls} 
            style={{ gap: '8px' }}
          >
            {strip.map((tId, i) => {
              const members = teamStats[parseInt(tId)]?.members || [];
              const isMulti = members.length > 1;
              const participant = participants.find(p => members.includes(p.userId));
              const displayName = isMulti ? `Team ${parseInt(tId)+1}` : (participant?.username || members[0] || 'Unknown');
              
              return (
                <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center relative bg-[#1f222b] border border-[#2a2d3a] rounded-lg w-24 will-change-transform" style={{ height: '96px' }}>
                  <div className="w-12 h-12 rounded-xl bg-[#15181f] flex items-center justify-center text-xl font-black text-white shadow-inner mb-2">
                    {isMulti ? <Users size={20} className="text-accent-blue" /> : (members[0]?.startsWith('bot-') ? <Bot size={20} className="text-accent-blue" /> : displayName[0])}
                  </div>
                  <div className="text-white font-black text-[10px] truncate w-full px-2 text-center">{displayName}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BattlesPage() {
  const [isFairOpen, setIsFairOpen] = useState(false);
  const { user, refreshUser, openAuthModal } = useAuth();
  
  const [view, setView] = useState<"lobby" | "create" | "battle">("lobby");
  const [battles, setBattles] = useState<any[]>([]);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [activeBattle, setActiveBattle] = useState<any>(null);
  
  const [createModes, setCreateModes] = useState<string[]>([]);
  const toggleMode = (m: string) => setCreateModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const [createFormat, setCreateFormat] = useState("1v1");
  const [createPlayers, setCreatePlayers] = useState(2);
  const [createFast, setCreateFast] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [callAllBots, setCallAllBots] = useState(false);
  
  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rolling, setRolling] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [fullRoundsData, setFullRoundsData] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);

  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);
  const [tieBreakerData, setTieBreakerData] = useState<{tiedPlayers: string[], winnerId: string, totalPotValue?: number} | null>(null);

  const [isJackpotSpinnerOpen, setIsJackpotSpinnerOpen] = useState(false);
  const [jackpotSpinnerData, setJackpotSpinnerData] = useState<{ teamStats: any, winnerId: string, totalPotValue: number, mode: string } | null>(null);

  const [battleCountdown, setBattleCountdown] = useState<number | null>(null);
  const [blockInfo, setBlockInfo] = useState<{block: number, hash: string} | null>(null);

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
        setBlockInfo(payload.blockInfo);
        
        // 3 second countdown before starting rounds
        setBattleCountdown(3);
        await new Promise(r => setTimeout(r, 1000));
        setBattleCountdown(2);
        await new Promise(r => setTimeout(r, 1000));
        setBattleCountdown(1);
        await new Promise(r => setTimeout(r, 1000));
        setBattleCountdown(null);

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
        
        if (payload.mode && payload.mode.includes('jackpot') && payload.teamStats) {
          setJackpotSpinnerData({ teamStats: payload.teamStats, winnerId: payload.winnerId, totalPotValue: payload.totalPotValue, mode: payload.mode });
          setFinalWinner(null);
          setIsJackpotSpinnerOpen(true);
        } else if (payload.isTie && payload.tiedPlayers && payload.tiedPlayers.length > 1) {
          setTieBreakerData({ tiedPlayers: payload.tiedPlayers, winnerId: payload.winnerId, totalPotValue: payload.totalPotValue });
          setFinalWinner(null);
          setIsTieBreakerOpen(true);
        } else {
          setTieBreakerData(null);
          setJackpotSpinnerData(null);
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
        body: JSON.stringify({ caseIds: selectedCaseIds, mode: createModes.length ? createModes.join(',') : 'normal', playerCount: createPlayers, format: createFormat, isFast: createFast })
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
      setActiveBattle(data); setView("battle"); setRoundResults([]); setRolling(false); setFinalWinner(null); setCurrentRound(0); refreshUser();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleWatch = async (battleId: number) => {
    try {
      const res = await apiFetch(`/battles/${battleId}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveBattle(data); setView("battle"); setRoundResults([]); setRolling(false); setFinalWinner(data.winnerId || null); setCurrentRound(0);
    } catch (e) {}
  };

  const handleCallBots = async (count: number) => {
    setLoading(true);
    try {
      const spotsLeft = (activeBattle.targetPlayerCount || 2) - activeBattle.participants.length;
      const res = await apiFetch("/battles/call-bots", { method: "POST", body: JSON.stringify({ battleId: activeBattle.id, botCount: Math.min(count, spotsLeft) }) });
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
                onClick={() => { setView("create"); setCreateModes([]); setSelectedCaseIds([]); setCreateFast(false); }}
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
                onClick={() => { setView("create"); setCreateModes([]); setSelectedCaseIds([]); }}
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

                let parsedCaseIds: string[] = [];
                try { parsedCaseIds = JSON.parse(b.caseIds); } catch(e) {}
                const maxPlayers = b.targetPlayerCount || 2;
                const isFull = b.participants.length >= maxPlayers;
                const isRunning = b.status === 'running';
                const isFinished = b.status === 'finished';
                const isWaiting = b.status === 'waiting';
                const alreadyIn = user && b.participants.find((p: any) => p.userId === user.id.toString());

                return (
                  <motion.div 
                    key={b.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => (isRunning || isFinished) ? handleWatch(b.id) : undefined}
                    className={`group bg-[#1a1d24] border border-[#2a2d3a] hover:border-[#3a3d4a] rounded-xl p-4 flex items-center justify-between transition-all ${isRunning || isFinished ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-8 w-full">
                      {/* Left: Mode & Players */}
                      <div className="flex flex-col gap-3 min-w-[140px]">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {(!b.mode || b.mode === 'normal') ? (
                              <span className="text-white text-[11px] font-black uppercase tracking-wider">Normal</span>
                          ) : (
                              b.mode.split(',').map((modeStr: string, idx: number) => {
                                  const modDetail = getModeDetails(modeStr);
                                  return (
                                      <span key={idx} className={`text-[9px] font-black px-1.5 py-0.5 rounded ${modDetail.bg} ${modDetail.color} flex items-center gap-1 uppercase tracking-wider`}>
                                          {modeStr}
                                      </span>
                                  );
                              })
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {b.participants.map((p: any) => (
                            <div key={p.id} className="w-6 h-6 rounded bg-[#2a2d3a] flex items-center justify-center text-xs font-black text-white">
                              {p.userId.startsWith('bot-') ? <Bot size={12} className="text-[#1c7ced]" /> : (p.username?.[0] || p.userId[0])}
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
                            <div key={i} className="w-10 h-10 bg-[#15181f] border border-[#2a2d3a] rounded-lg flex items-center justify-center p-1 relative">
                              {c?.image ? (
                                <img src={c.image} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <PackageOpen size={20} className="text-[#4d5366]" />
                              )}
                            </div>
                          );
                        })}
                        {parsedCaseIds.length > 10 && (
                          <div className="w-10 h-10 bg-[#15181f] border border-[#2a2d3a] rounded-lg flex items-center justify-center text-xs font-bold text-[#7a819c]">
                            +{parsedCaseIds.length - 10}
                          </div>
                        )}
                      </div>

                      {/* Right: Cost & Action */}
                      <div className="flex items-center gap-8 shrink-0">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[#7a819c] font-black uppercase tracking-widest mb-1">Battle Cost</span>
                          <DLCurrency amount={b.entryFee} size="sm" className="text-white font-black" />
                        </div>
                        
                        <div className="w-[120px] text-center">
                          {isWaiting && !isFull && !alreadyIn ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleJoin(b.id); }}
                              disabled={loading}
                              className="w-full py-2.5 bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black rounded-lg transition-all disabled:opacity-50 text-xs shadow-[0_0_10px_rgba(28,124,237,0.2)]"
                            >
                              Join
                            </button>
                          ) : isWaiting && alreadyIn ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleWatch(b.id); }}
                              disabled={loading}
                              className="w-full py-2.5 bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] font-black rounded-lg transition-all text-xs border border-[#22c55e]/30"
                            >
                              Return
                            </button>
                          ) : isWaiting && isFull ? (
                            <span className="text-[#7a819c] font-bold text-xs">Full</span>
                          ) : isRunning ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleWatch(b.id); }}
                              className="w-full py-2.5 bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] font-black rounded-lg transition-all text-xs border border-[#a855f7]/30"
                            >
                              👁 Watch
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleWatch(b.id); }}
                              className="w-full py-2.5 bg-[#2a2d3a] hover:bg-[#3a3d4a] text-[#7a819c] font-black rounded-lg transition-all text-xs"
                            >
                              View
                            </button>
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
                        
                        {/* Mode Selection was moved to the right column */}

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
                            
                            <div className="relative mb-3">
                                <div 
                                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                                  className="bg-[#1a1d24] border border-[#2a2d3a] rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#2a2d3a] transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-[#7a819c] font-black text-sm">
                                      <Users size={14} /> {createFormat.toUpperCase()}
                                    </div>
                                    <ChevronLeft size={16} className={`text-[#4d5366] transition-transform ${isFormatDropdownOpen ? 'rotate-90' : 'rotate-[-90deg]'}`} />
                                </div>
                                
                                {isFormatDropdownOpen && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d24] border border-[#2a2d3a] rounded-lg shadow-xl z-50 overflow-hidden">
                                    {[
                                      { id: '1v1', players: 2 },
                                      { id: '1v1v1', players: 3 },
                                      { id: '1v1v1v1', players: 4 },
                                      { id: '2v2', players: 4 },
                                      { id: '1v1v1v1v1v1', players: 6 },
                                      { id: '2v2v2', players: 6 },
                                      { id: '3v3', players: 6 },
                                    ].map(f => (
                                      <div 
                                        key={f.id}
                                        onClick={() => { setCreateFormat(f.id); setCreatePlayers(f.players); setIsFormatDropdownOpen(false); }}
                                        className="px-3 py-2 text-[#7a819c] font-black text-xs hover:bg-[#2a2d3a] hover:text-white cursor-pointer transition-colors"
                                      >
                                        {f.id.toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>

                            <div className={`grid gap-2 mb-4 ${createPlayers === 6 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {/* Slot 1: You */}
                                <div className="bg-[#1a1d24] border border-[#1c7ced]/30 rounded-lg p-2 flex flex-col sm:flex-row items-center sm:items-start gap-2 relative overflow-hidden text-center sm:text-left">
                                    <div className="absolute top-0 left-0 sm:bottom-0 sm:w-1 w-full h-1 sm:h-auto bg-[#1c7ced]" />
                                    <div className="w-6 h-6 rounded bg-[#1c7ced]/20 text-[#1c7ced] flex items-center justify-center shrink-0">
                                        <UserIcon size={12} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] text-[#7a819c] font-black uppercase tracking-wider mb-0.5">Slot 1</div>
                                        <div className="text-white text-[10px] font-bold truncate max-w-full">You</div>
                                    </div>
                                </div>
                                {/* Other Slots */}
                                {Array.from({length: createPlayers - 1}).map((_, i) => (
                                    <div key={i} className="bg-[#1a1d24] border border-[#2a2d3a] rounded-lg p-2 flex flex-col sm:flex-row items-center sm:items-start gap-2 opacity-70 text-center sm:text-left">
                                        <div className="w-6 h-6 rounded bg-[#2a2d3a] text-[#4d5366] flex items-center justify-center shrink-0">
                                            <UserIcon size={12} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[9px] text-[#7a819c] font-black uppercase tracking-wider mb-0.5">Slot {i+2}</div>
                                            <div className="text-[#7a819c] text-[10px] font-bold truncate max-w-full">Empty</div>
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
                                <div onClick={() => toggleMode('jackpot')} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${createModes.includes('jackpot') ? 'bg-accent-blue/10 border-accent-blue' : 'bg-[#1a1d24] border-[#2a2d3a]'}`}>
                                    <span className={`font-bold text-[11px] flex items-center gap-1.5 ${createModes.includes('jackpot') ? 'text-accent-blue' : 'text-[#7a819c]'}`}><PackageOpen size={14} /> Jackpot Mode</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${createModes.includes('jackpot') ? 'bg-accent-blue' : 'bg-[#2a2d3a]'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${createModes.includes('jackpot') ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <div onClick={() => toggleMode('crazy')} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${createModes.includes('crazy') ? 'bg-accent-blue/10 border-accent-blue' : 'bg-[#1a1d24] border-[#2a2d3a]'}`}>
                                    <span className={`font-bold text-[11px] flex items-center gap-1.5 ${createModes.includes('crazy') ? 'text-accent-blue' : 'text-[#7a819c]'}`}><Target size={14} /> Crazy Mode</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${createModes.includes('crazy') ? 'bg-accent-blue' : 'bg-[#2a2d3a]'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${createModes.includes('crazy') ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <div onClick={() => toggleMode('terminal')} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${createModes.includes('terminal') ? 'bg-accent-blue/10 border-accent-blue' : 'bg-[#1a1d24] border-[#2a2d3a]'}`}>
                                    <span className={`font-bold text-[11px] flex items-center gap-1.5 ${createModes.includes('terminal') ? 'text-accent-blue' : 'text-[#7a819c]'}`}><ShieldCheck size={14} /> Terminal Mode</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${createModes.includes('terminal') ? 'bg-accent-blue' : 'bg-[#2a2d3a]'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${createModes.includes('terminal') ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <div onClick={() => toggleMode('shared')} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${createModes.includes('shared') ? 'bg-accent-blue/10 border-accent-blue' : 'bg-[#1a1d24] border-[#2a2d3a]'}`}>
                                    <span className={`font-bold text-[11px] flex items-center gap-1.5 ${createModes.includes('shared') ? 'text-accent-blue' : 'text-[#7a819c]'}`}><Users size={14} /> Shared Mode</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${createModes.includes('shared') ? 'bg-accent-blue' : 'bg-[#2a2d3a]'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${createModes.includes('shared') ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <div onClick={() => setCreateFast(!createFast)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${createFast ? 'bg-amber-500/10 border-amber-500' : 'bg-[#1a1d24] border-[#2a2d3a]'}`}>
                                    <span className={`font-bold text-[11px] flex items-center gap-1.5 ${createFast ? 'text-amber-500' : 'text-[#7a819c]'}`}><Zap size={14} /> Fast Spin</span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${createFast ? 'bg-amber-500' : 'bg-[#2a2d3a]'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${createFast ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
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
                
                {/* BATTLE HEADER ROW 1 */}
                <div className="flex items-center justify-between mb-2 mt-2">
                  <button
                    onClick={() => setView("lobby")}
                    className="flex items-center gap-2 text-[#a0a5b8] hover:text-white transition-colors text-sm font-black"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="bg-[#1a1d24] border border-[#2a2d3a] px-3 h-8 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white gap-2 text-xs font-black"><Eye size={14} /> 1</button>
                    <button className="bg-[#1a1d24] border border-[#2a2d3a] w-8 h-8 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><FileText size={14} /></button>
                    <button className="bg-[#1a1d24] border border-[#2a2d3a] w-8 h-8 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><ShieldCheck size={14} /></button>
                    <button className="bg-[#1a1d24] border border-[#2a2d3a] w-8 h-8 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white"><Volume2 size={14} /></button>
                  </div>
                </div>

                {/* BATTLE HEADER ROW 2 */}
                <div className="flex items-center justify-between mb-6 relative">
                  {/* Left Side */}
                  <div className="flex flex-col">
                    <div className="text-white font-black text-lg mb-1">
                      {activeBattle.format === '1v1' ? '2 Players' : activeBattle.format === '1v1v1' ? '3 Players' : activeBattle.format === '1v1v1v1' ? '4 Players' : `${Math.ceil((activeBattle.targetPlayerCount || 2) / (activeBattle.format.startsWith('2') ? 2 : 3))} Teams`}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-[#7a819c]">Round {currentRound + 1} of {JSON.parse(activeBattle.caseIds || '[]').length}</span>
                      <span className="w-px h-3 bg-[#2a2d3a]" />
                      <div className="bg-[#1c7ced]/20 text-[#1c7ced] p-1 rounded"><Zap size={12} /></div>
                      <div className="bg-[#e83e8c]/20 text-[#e83e8c] px-2 py-1 rounded flex items-center gap-1"><Dices size={12} /> 80%</div>
                    </div>
                  </div>

                  {/* Center Case Sequence */}
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {JSON.parse(activeBattle.caseIds || '[]').map((cid: string, i: number) => {
                      const c = availableCases.find(x => x.id.toString() === cid);
                      const isPast = i < currentRound;
                      return (
                        <div key={i} className={`w-12 h-12 flex flex-col items-center justify-center transition-all ${isPast ? 'opacity-30 grayscale' : ''}`}>
                          {c?.image ? <img src={c.image} className="w-10 h-10 object-contain drop-shadow" /> : <PackageOpen size={20} className="text-[#4d5366]" />}
                        </div>
                      )
                    })}
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end">
                    <span className="text-[#7a819c] font-black text-[10px] uppercase tracking-widest mb-1">Battle Cost:</span>
                    <span className="text-white font-black flex items-center gap-1 text-sm">
                      <DLCurrency amount={activeBattle.participants.length * activeBattle.entryFee} size="sm" className="text-white" />
                    </span>
                  </div>
                </div>
                
                {/* BATTLE ARENA (Spinners) */}
                <div className="bg-[#0f1115] border border-[#2a2d3a] rounded-xl relative overflow-hidden flex flex-col mt-4">
                  
                  <AnimatePresence>
                    {battleCountdown !== null && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-[#0f1115]/95 backdrop-blur-md flex flex-col items-center justify-center"
                      >
                        <motion.div 
                          key={battleCountdown}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          className="text-[140px] font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] leading-none mb-12"
                        >
                          {battleCountdown}
                        </motion.div>
                        
                        {blockInfo && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-[#1a1d24] border border-[#2a2d3a] px-8 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                          >
                            <span className="text-[#7a819c] font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                              <ShieldCheck size={16} className="text-accent-blue" /> Provably Fair Match
                            </span>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-white font-mono text-sm">EOS Block: {blockInfo.block}</span>
                              <span className="text-accent-blue/80 font-mono text-xs">Hash: {blockInfo.hash}</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Floating Case Label */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px z-30">
                    <div className="bg-[#0f1115] border-x border-b border-[#2a2d3a] rounded-b-xl px-12 py-1.5 flex items-center gap-3 shadow-md">
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

                    {/* Dividers for Teams */}
                    {(() => {
                      const format = activeBattle.format || '1v1';
                      let teamSize = 1;
                      if (format === '2v2' || format === '2v2v2') teamSize = 2;
                      if (format === '3v3') teamSize = 3;
                      const numTeams = Math.ceil((activeBattle.targetPlayerCount || 2) / teamSize);
                      return Array.from({ length: Math.max(0, numTeams - 1) }).map((_, i) => (
                        <div key={i} className="absolute inset-0 pointer-events-none z-20">
                          <div className="absolute top-0 bottom-0 w-[1px] bg-[#2a2d3a]/50" style={{ left: `${((i + 1) / numTeams) * 100}%` }} />
                          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#15181f] border border-[#2a2d3a] rounded flex items-center justify-center shadow-md pointer-events-auto" style={{ left: `${((i + 1) / numTeams) * 100}%` }}>
                            <Swords size={14} className="text-[#4d5366]" />
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Players */}
                    <div 
                      className="w-full grid relative z-10" 
                      style={{ gridTemplateColumns: `repeat(${activeBattle.targetPlayerCount || 2}, minmax(0, 1fr))` }}
                    >
                      {activeBattle.participants.map((p: any, idx: number) => {
                        const isBot = p.userId.startsWith('bot-');
                        const isWinner = finalWinner && finalWinner.split(',').includes(p.userId.toString());
                        
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
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-transparent flex items-center gap-2 min-w-max">
                              <div className="w-6 h-6 rounded bg-[#2a2d3a] flex items-center justify-center text-white font-black text-[10px]">
                                {isBot ? <Bot size={12} className="text-[#a0a5b8]" /> : (p.username?.[0] || p.userId[0])}
                              </div>
                              <div className="flex items-center gap-1 font-black text-xs text-white">
                                <DLCurrency amount={currentLootValue} size="xs" className="text-white" />
                              </div>
                            </div>

                            {/* Spinner Container */}
                            <div className="relative z-10 w-full h-[400px] flex items-center justify-center">
                              {rolling && targetItemForSpin ? (
                                <BattleSpinner key={`${displayRound}-${p.id}`} targetItem={targetItemForSpin} itemsPool={currentCaseItemsPool} rolling={rolling} onComplete={() => {}} isFast={activeBattle?.isFast} />
                              ) : targetItemForSpin ? (
                                (() => {
                                  const finalItemToDisplay = (targetItemForSpin as any)._hitLuckyStar && (targetItemForSpin as any)._actualWinItem 
                                    ? (targetItemForSpin as any)._actualWinItem 
                                    : targetItemForSpin;
                                  
                                  return (
                                    <motion.div 
                                      className="flex flex-col items-center justify-center relative select-none" 
                                      style={{ height: '120px' }}
                                      initial={{ scale: 0.9, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                      <div className="relative z-10 h-20 flex items-center justify-center mb-1">
                                        {finalItemToDisplay.name === 'Lucky Star' ? (
                                          <div className="w-16 h-16 relative flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,1)] z-10 animate-[spin_3s_linear_infinite]">
                                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                          </div>
                                        ) : finalItemToDisplay.imageUrl ? (
                                          <motion.img 
                                            src={finalItemToDisplay.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(finalItemToDisplay.imageUrl.replace(/^https?:\/\//, ''))}` : finalItemToDisplay.imageUrl} 
                                            alt={finalItemToDisplay.name} 
                                            className="max-h-16 max-w-[80px] object-contain"
                                            animate={{ filter: [`drop-shadow(0px 0px 4px ${finalItemToDisplay.color || '#3b82f6'}80)`, `drop-shadow(0px 0px 18px ${finalItemToDisplay.color || '#3b82f6'})`, `drop-shadow(0px 0px 4px ${finalItemToDisplay.color || '#3b82f6'}80)`] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                          />
                                        ) : (
                                          <motion.div
                                            animate={{ filter: [`drop-shadow(0px 0px 4px ${finalItemToDisplay.color || '#3b82f6'}80)`, `drop-shadow(0px 0px 18px ${finalItemToDisplay.color || '#3b82f6'})`, `drop-shadow(0px 0px 4px ${finalItemToDisplay.color || '#3b82f6'}80)`] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                          >
                                            <PackageOpen size={48} style={{ color: finalItemToDisplay.color || "#3b82f6" }} />
                                          </motion.div>
                                        )}
                                      </div>
                                      <div className="relative z-10 text-center w-full px-1">
                                        <div className="text-white font-black text-[11px] truncate drop-shadow">{finalItemToDisplay.name}</div>
                                        <div className="text-[#a0a5b8] font-bold text-[10px] mt-0.5">
                                          <DLCurrency amount={finalItemToDisplay.value} size="xs" className="text-[#a0a5b8]" />
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })()
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
                      {Array.from({ length: Math.max(0, (activeBattle.targetPlayerCount || 2) - activeBattle.participants.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="relative flex flex-col items-center justify-center pt-6 opacity-30">
                          <Users size={32} className="text-[#4d5366]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PLAYER HISTORY GRID */}
                <div 
                  className="grid gap-2 mt-2" 
                  style={{ gridTemplateColumns: `repeat(${activeBattle.targetPlayerCount}, minmax(0, 1fr))` }}
                >
                  {activeBattle.participants.map((p: any, idx: number) => {
                    const isBot = p.userId.startsWith('bot-');
                    const isWinner = finalWinner && finalWinner.split(',').includes(p.userId.toString());
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
                      <div key={p.id} className="flex flex-col gap-2">
                        {/* Player Header */}
                        <div className={`p-3 rounded-xl border ${isWinner ? 'border-accent-green/50 bg-accent-green/10' : 'border-[#2a2d3a] bg-[#15181f]'} flex items-center justify-between`}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 rounded bg-[#2a2d3a] flex items-center justify-center text-white font-black text-[10px] flex-shrink-0">
                              {isBot ? <Bot size={12} className="text-[#a0a5b8]" /> : (p.username?.[0] || p.userId[0])}
                            </div>
                            <div className="text-white font-black text-[11px] truncate">{p.username || p.userId}</div>
                          </div>
                          <div className="bg-[#1a1d24] border border-[#2a2d3a] px-2 py-1 rounded flex items-center gap-1 font-black text-xs">
                            <DLCurrency amount={currentLootValue} size="xs" className={isWinner ? 'text-accent-green' : 'text-white'} />
                          </div>
                        </div>

                        {/* Round Items */}
                        {Array.from({ length: Math.max(JSON.parse(activeBattle.caseIds || '[]').length, currentRound + 1) }).map((_, rIdx) => {
                          const isFuture = rIdx > currentRound || !roundResults[rIdx];
                          if (isFuture) {
                            return (
                              <div key={`future-${rIdx}-${p.id}`} className="bg-[#15181f] border border-[#2a2d3a] h-[80px] rounded-xl flex flex-col items-center justify-center opacity-30">
                                <span className="text-[#a0a5b8] text-[10px] font-black uppercase tracking-widest mb-1">Round</span>
                                <span className="text-white text-lg font-black">{rIdx + 1 < 10 ? `0${rIdx + 1}` : rIdx + 1}</span>
                              </div>
                            );
                          }
                          const myRoll = roundResults[rIdx].find((r: any) => r.userId === p.userId);
                          if (!myRoll) return null;
                          const displayItem = myRoll.hitLuckyStar && myRoll.actualWinItem ? myRoll.actualWinItem : myRoll.item;
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={`roll-${rIdx}-${p.id}`} 
                              className="bg-[#15181f] border border-[#2a2d3a] h-[80px] rounded-xl flex items-center p-3 gap-3"
                            >
                              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                {displayItem.imageUrl ? (
                                  <img src={displayItem.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(displayItem.imageUrl.replace(/^https?:\/\//, ''))}` : displayItem.imageUrl} alt="" className="max-w-full max-h-full object-contain drop-shadow-md" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: displayItem.color || "#3b82f6", boxShadow: `0 0 10px ${displayItem.color}` }} />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[#a0a5b8] font-black text-[10px] uppercase tracking-widest truncate">{displayItem.name}</span>
                                <span className="text-white font-black text-xs flex items-center gap-1 mt-0.5">
                                  <DLCurrency amount={displayItem.value} size="xs" className="text-white" />
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )
                  })}
                  
                  {/* Empty slots for missing participants */}
                  {Array.from({ length: Math.max(0, (activeBattle.targetPlayerCount || 2) - activeBattle.participants.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex flex-col gap-2 opacity-30">
                      <div className="bg-[#15181f] border border-dashed border-[#2a2d3a] p-3 rounded-xl flex items-center justify-center h-[48px]">
                        <Users size={16} className="text-[#4d5366]" />
                      </div>
                      {Array.from({ length: Math.max(JSON.parse(activeBattle.caseIds || '[]').length, currentRound + 1) }).map((_, rIdx) => (
                        <div key={`empty-future-${rIdx}`} className="bg-[#15181f] border border-[#2a2d3a] h-[80px] rounded-xl flex flex-col items-center justify-center">
                          <span className="text-[#a0a5b8] text-[10px] font-black uppercase tracking-widest mb-1">Round</span>
                          <span className="text-white text-lg font-black">{rIdx + 1 < 10 ? `0${rIdx + 1}` : rIdx + 1}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* CONTROLS */}
                {activeBattle.status === "waiting" && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-end mt-4">
                    {activeBattle.participants.length < (activeBattle.targetPlayerCount || 2) && (
                      <button
                        onClick={() => handleCallBots((activeBattle.targetPlayerCount || 2) - activeBattle.participants.length)}
                        disabled={loading}
                        className="px-6 py-3 bg-[#1a1d24] text-white font-black rounded-lg border border-[#2a2d3a] hover:bg-[#2a2d3a] transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                      >
                        <Bot size={18} className="text-[#a0a5b8]" /> Call Bots
                      </button>
                    )}
                    {activeBattle.participants.find((p: any) => p.userId === user?.id.toString())?.position === 1 && (
                      <button
                        onClick={handleStart}
                        disabled={loading || activeBattle.participants.length < 2}
                        className="px-8 py-3 bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(28,124,237,0.3)]"
                      >
                        Start Battle <ArrowRight size={18} />
                      </button>
                    )}
                    {!activeBattle.participants.find((p: any) => p.userId === user?.id.toString()) && (
                      <button
                        onClick={() => handleJoin(activeBattle.id)}
                        disabled={loading || activeBattle.participants.length >= (activeBattle.targetPlayerCount || 2)}
                        className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                      >
                        Join Battle <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isTieBreakerOpen && tieBreakerData && (
                    <TieBreakerSpinner
                      tiedPlayers={tieBreakerData.tiedPlayers}
                      winnerId={tieBreakerData.winnerId}
                      participants={activeBattle.participants}
                      isFast={activeBattle?.isFast}
                      onComplete={() => {
                        setIsTieBreakerOpen(false);
                        setFinalWinner(tieBreakerData.winnerId);
                        setActiveBattle({ ...activeBattle, status: 'finished', winnerId: tieBreakerData.winnerId, totalPotValue: tieBreakerData.totalPotValue });
                        refreshUser();
                      }}
                    />
                  )}

                  {isJackpotSpinnerOpen && jackpotSpinnerData && (
                    <JackpotSpinner
                      teamStats={jackpotSpinnerData.teamStats}
                      winnerId={jackpotSpinnerData.winnerId}
                      mode={jackpotSpinnerData.mode}
                      participants={activeBattle.participants}
                      isFast={activeBattle?.isFast}
                      onComplete={() => {
                        setIsJackpotSpinnerOpen(false);
                        setFinalWinner(jackpotSpinnerData.winnerId);
                        setActiveBattle({ ...activeBattle, status: 'finished', winnerId: jackpotSpinnerData.winnerId, totalPotValue: jackpotSpinnerData.totalPotValue });
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

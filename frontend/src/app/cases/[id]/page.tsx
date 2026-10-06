"use client";

import { ProvablyFairModal } from "@/components/ui/ProvablyFairModal";
import { ChevronLeft, PackageOpen, ShieldCheck, Star, Search, Lock, RefreshCw, ChevronDown, ChevronUp, DollarSign, Coins, Info, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { playWinFanfare, playClaimSound } from "@/lib/sounds";
import { motion, useAnimation } from "framer-motion";
import { DLCurrency } from "@/components/ui/DLCurrency";

const ITEM_W = 150;

function HorizontalSpinner({ spinData, fallbackStrip, onComplete, containerW, caseData }: any) {
  const controls = useAnimation();
  const [landed, setLanded] = useState(false);
  const [activeStrip, setActiveStrip] = useState(fallbackStrip);
  const [bonusSpinning, setBonusSpinning] = useState(false);
  const [trackOpacity, setTrackOpacity] = useState(1);
  
  useEffect(() => {
    if (!spinData) setActiveStrip(fallbackStrip);
  }, [fallbackStrip, spinData]);

  useEffect(() => {
    if (!spinData || !containerW) {
      setLanded(false);
      setBonusSpinning(false);
      controls.set({ x: 0 });
      return;
    }

    let isCancelled = false;
    setLanded(false);
    setBonusSpinning(false);
    setActiveStrip(spinData.strip);

    const run = async () => {
      await controls.set({ x: 0 });
      // targetX aims to put the winningIndex in the center of the container
      const targetX = -(spinData.winningIndex * ITEM_W) + (containerW / 2) - (ITEM_W / 2);
      
      const duration = 4.5 + Math.random() * 1.5;

      await controls.start({
        x: targetX,
        transition: { duration, ease: [0.12, 0.8, 0.18, 1] }
      });

      if (isCancelled) return;

      if (spinData.hitLuckyStar) {
        setBonusSpinning(true);
        // Pause briefly on the star
        await new Promise(resolve => setTimeout(resolve, 600));
        if (isCancelled) return;

        // Fade out the track
        setTrackOpacity(0);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (isCancelled) return;

        const bonusPool = caseData.items.filter((i: any) => i.isLuckyStarItem);
        const safePool = bonusPool.length > 0 ? bonusPool : caseData.items;
        
        const bonusWinningIndex = 40;
        const bonusStrip = Array.from({ length: 60 }).map((_, i) => {
          if (i === bonusWinningIndex) return spinData.winningItem;
          return safePool[Math.floor(Math.random() * safePool.length)];
        });

        setActiveStrip(bonusStrip);
        
        // Reset position to start of new strip
        const bonusTargetX = -(bonusWinningIndex * ITEM_W) + (containerW / 2) - (ITEM_W / 2);
        await controls.set({ x: 0 });
        
        // Fade track back in
        setTrackOpacity(1);
        playWinFanfare();
        
        // Start the bonus spin
        controls.start({
          x: bonusTargetX,
          transition: { duration: 3.5, ease: [0.12, 0.8, 0.18, 1] }
        });
        
        // Wait for the bonus spin to finish
        await new Promise(resolve => setTimeout(resolve, 3600));
        if (isCancelled) return;
      }

      setLanded(true);
      onComplete(spinData);
    };
    run();
    
    return () => { isCancelled = true; };
  }, [spinData, containerW]);

  const [repayingLoan, setRepayingLoan] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleRepay = async () => {
    if (!spinData?.createdItem?.id || repayingLoan) return;
    setRepayingLoan(true);
    try {
      const res = await apiFetch("/inventory/repay", {
        method: "POST",
        body: JSON.stringify({ itemId: spinData.createdItem.id })
      });
      if (res.ok) {
        setRepaySuccess(true);
        refreshUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRepayingLoan(false);
    }
  };

  return (
    <div className="w-full flex-1 relative flex flex-col items-center justify-center min-h-[140px]">
      
      {/* Horizontal Track Layer */}
      <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity: trackOpacity }}>
        <motion.div animate={controls} className="flex h-full items-center absolute left-0" style={{ width: activeStrip.length * ITEM_W }}>
          {activeStrip.map((item: any, idx: number) => {
          const isWinner = landed && spinData && (
            (spinData.hitLuckyStar && idx === 40) || (!spinData.hitLuckyStar && spinData.winningIndex === idx)
          );
          const isLucky = item.id === -999;
          
          return (
            <div key={idx} className="h-full flex items-center justify-center relative flex-shrink-0" style={{ width: ITEM_W }}>
              {isLucky ? (
                <Star size={72} className={`text-blue-500 fill-blue-500 transition-all animate-[spin_3s_linear_infinite] ${isWinner ? 'scale-125 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20' : 'opacity-80'}`} />
              ) : item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className={`w-20 h-20 object-contain transition-all duration-300 ${isWinner ? 'scale-125 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] z-20' : 'opacity-80 drop-shadow-md'}`} 
                />
              ) : (
                <PackageOpen size={56} style={{ color: item.color }} className={isWinner ? 'scale-125 transition-transform z-20' : 'opacity-80'} />
              )}
              {isWinner && !isLucky && (
                <div className="absolute -bottom-2 z-30 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[#0b0e14]/90 px-3 py-1 rounded-full border border-[#2a2d3a] shadow-lg">
                    <DLCurrency amount={item.value} size="sm" className="font-black text-white" />
                  </div>
                  {spinData?.isBorrow && !repaySuccess && (
                    <button 
                      onClick={handleRepay}
                      disabled={repayingLoan || (user?.mockBalance || 0) < (spinData?.createdItem?.borrowPrice || 0)}
                      className="bg-purple-600/90 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md border border-purple-400 transition-colors cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {repayingLoan ? "..." : `Repay ${((spinData?.createdItem?.borrowPrice || 0)/100).toLocaleString()}`}
                    </button>
                  )}
                  {spinData?.isBorrow && repaySuccess && (
                    <span className="text-purple-400 font-bold text-[10px] bg-[#0b0e14]/80 px-2 py-0.5 rounded border border-purple-500/30 mt-1">Repaid</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </motion.div>
      </div>

    </div>
  );
}

export default function CaseOpenPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Layout states based on exact screenshot
  const initialQty = parseInt(searchParams.get("qty") || "1");
  const [qty, setQty] = useState(initialQty > 0 && initialQty <= 4 ? initialQty : 1);
  const [borrowPct, setBorrowPct] = useState(0); // 0, 20, 40, 60, 80
  
  // Spin logic states
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [spinResults, setSpinResults] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [dummyStrips, setDummyStrips] = useState<any[][]>([]);
  
  // Container ref to measure width for targetX
  const [containerW, setContainerW] = useState(0);

  // Provably Fair Modal state
  const [fairModalOpen, setFairModalOpen] = useState(false);

  // Generate random fallback strips for idle state
  useEffect(() => {
    if (caseData && caseData.items.length > 0) {
      const strips = [];
      for (let c = 0; c < 4; c++) {
        const strip = [];
        for (let i = 0; i < 40; i++) {
          strip.push(caseData.items[Math.floor(Math.random() * caseData.items.length)]);
        }
        strips.push(strip);
      }
      setDummyStrips(strips);
    }
  }, [caseData]);

  useEffect(() => {
    apiFetch(`/cases/${id}`)
      .then(r => r.json())
      .then(d => {
        setCaseData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleOpen = async (demo: boolean, borrow: boolean = false) => {
    if (opening) return;
    setOpening(true);
    setError("");
    setCompletedCount(0);
    setSpinResults([]);

    const results = [];
    const isBorrow = borrow;

    // Sequential await to prevent negative balance races
    for (let i = 0; i < qty; i++) {
      try {
        const res = await apiFetch("/cases/open", {
          method: "POST",
          body: JSON.stringify({ caseId: id, demo, borrow: isBorrow })
        });
        
        if (!res.ok) {
          const data = await res.json();
          if (i === 0) setError(data.error || "Failed to open case");
          break; // Stop opening more if balance runs out
        }
        
        const data = await res.json();
        results.push(data);
      } catch (e: any) {
        if (i === 0) setError("Network error");
        break;
      }
    }

    if (results.length > 0) {
      if (!demo) await refreshUser();
      setSpinResults(results);
    } else {
      setOpening(false);
    }
  };

  const handleSpinComplete = (data: any) => {
    setCompletedCount(prev => {
      const next = prev + 1;
      if (next === spinResults.length) {
        // All spins finished
        setOpening(false);
        playWinFanfare();
      } else {
        playClaimSound();
      }
      return next;
    });
  };

  if (loading || !caseData) return <div className="text-center py-24 text-white font-black animate-pulse">Loading Spinner...</div>;

  const totalPrice = caseData.price * qty;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-32 font-sans bg-[#0b0e14] min-h-screen">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => router.push("/cases")}
          className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-gray-300 transition-colors cursor-pointer bg-[#151926] hover:bg-[#1a1f2e] border border-[#2a2d3a] px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button className="bg-[#151926] hover:bg-[#1a1f2e] text-[#7a819c] p-2 rounded-lg border border-[#2a2d3a] transition-colors cursor-pointer"><Settings size={16} /></button>
          <button 
            onClick={() => setFairModalOpen(true)}
            className="bg-[#151926] hover:bg-[#1a1f2e] text-[#7a819c] p-2 rounded-lg border border-[#2a2d3a] transition-colors cursor-pointer"
          >
            <ShieldCheck size={16} />
          </button>
          <ProvablyFairModal isOpen={fairModalOpen} onClose={() => setFairModalOpen(false)} />
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar Layout (Exact match to screenshot) */}
        <div className="w-full lg:w-[280px] shrink-0 bg-[#0f121a] border border-[#1a1f2e] rounded-xl flex flex-col p-6 shadow-lg">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7a819c] font-bold mb-6">
            Created by: <span className="text-white font-black flex items-center gap-1">Bet<PackageOpen size={12} className="text-blue-400" />Dice</span>
          </div>

          <div className="w-32 h-32 mx-auto relative flex items-center justify-center mb-4">
            {caseData.image ? (
              <img src={caseData.image} alt={caseData.name} className="w-full h-full object-contain drop-shadow-xl" />
            ) : (
              <PackageOpen size={64} className="text-[#323d57]" />
            )}
          </div>
          
          <h1 className="text-white font-bold text-sm mb-6 text-center">{caseData.name}</h1>
          
          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#646b85]">Volatility</span>
              <span className="text-[10px] font-bold text-orange-500">High</span>
            </div>
            <div className="flex h-1 gap-1 w-full relative">
              <div className="flex-1 bg-green-500 rounded-l-full"></div>
              <div className="flex-1 bg-yellow-500"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-red-500 rounded-r-full"></div>
              {/* Volatility marker simulation (High = index 2) */}
              <div className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white shadow-sm rounded-full" style={{ left: '62.5%' }} />
            </div>
          </div>

          <div className="flex gap-1 w-full mb-6">
            {[1, 2, 3, 4].map(num => (
              <button 
                key={num}
                onClick={() => !opening && setQty(num)}
                className={`flex-1 rounded-md py-2 text-center text-[11px] font-black transition-colors cursor-pointer ${
                  qty === num 
                    ? "bg-[#1a2333] text-white" 
                    : "bg-[#151926] text-[#646b85] hover:bg-[#1a1f2e] hover:text-white"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {error && <div className="text-red-400 text-[10px] font-bold text-center mb-4 bg-red-500/10 p-2 rounded-lg">{error}</div>}

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleOpen(false, false)}
              disabled={opening}
              className="flex-1 bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black py-3 rounded-lg flex justify-center items-center gap-1 transition-colors disabled:opacity-50 text-[11px] cursor-pointer"
            >
              {opening ? "..." : (
                <>
                  Open <DLCurrency amount={totalPrice} size="sm" className="text-white ml-1" />
                </>
              )}
            </button>
            <button
              onClick={() => handleOpen(false, true)}
              disabled={opening}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-lg flex justify-center items-center gap-1 transition-colors disabled:opacity-50 text-[11px] cursor-pointer"
            >
              {opening ? "..." : (
                <>
                  Borrow <DLCurrency amount={totalPrice} size="sm" className="text-white ml-1" />
                </>
              )}
            </button>
          </div>

          <button 
            onClick={() => handleOpen(true, false)}
            disabled={opening}
            className="w-full text-center text-[#646b85] text-[10px] font-bold hover:text-white transition-colors flex items-center justify-center gap-1.5 py-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={10} /> Demo Spin
          </button>
        </div>

        {/* Right Spinner Area (Horizontal) */}
        <div 
          className="flex-1 bg-[#0b0e14] border border-[#1a1f2e] rounded-xl relative overflow-hidden h-[450px] shadow-inner flex flex-col justify-center"
          ref={node => {
            if (node && node.offsetWidth !== containerW) {
              setContainerW(node.offsetWidth);
            }
          }}
        >
          {/* Blue Chevron Indicators (Top and Bottom Center) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
            <ChevronDown size={24} className="text-blue-500 font-black -mt-1" strokeWidth={4} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30">
            <ChevronUp size={24} className="text-blue-500 font-black -mb-1" strokeWidth={4} />
          </div>
          
          {/* Center line (subtle) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/5 z-10 pointer-events-none" />

          {/* Render exact number of rows based on selected QTY */}
          <div className="w-full flex flex-col h-full py-4 gap-2">
            {Array.from({ length: qty }).map((_, idx) => (
              <HorizontalSpinner 
                key={`${idx}-${spinResults.length ? 'active' : 'idle'}`}
                spinData={spinResults[idx]}
                fallbackStrip={dummyStrips[idx] || []}
                onComplete={handleSpinComplete}
                containerW={containerW}
                caseData={caseData}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Case Contains Grid */}
      <div className="mt-6">
        <h2 className="text-white font-bold text-sm mb-4">Case Contains</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {caseData.items.map((item: any, i: number) => {
            const percentage = ((item.weight / caseData.items.reduce((acc: number, it: any) => acc + it.weight, 0)) * 100).toFixed(2);
            
            return (
              <div 
                key={i} 
                className="bg-[#0f121a] border border-[#1a1f2e] rounded-xl p-3 flex flex-col relative transition-all group"
                style={{ 
                  borderTopColor: parseFloat(percentage) < 10 ? item.color : '#2a2d3a', 
                  borderTopWidth: parseFloat(percentage) < 10 ? '2px' : '1px' 
                }}
              >
                {/* Info Icon top right */}
                <div className="absolute top-2 right-2">
                  <Info size={12} className="text-[#646b85] cursor-pointer hover:text-white" />
                </div>

                <div className="w-full aspect-square relative flex items-center justify-center mt-2 mb-3">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-16 h-16 object-contain drop-shadow-md transition-transform group-hover:scale-110" 
                    />
                  ) : (
                    <PackageOpen size={40} style={{ color: item.color }} />
                  )}
                </div>
                
                <div className="mt-auto">
                  <div className="text-[11px] font-bold text-white mb-2 text-center" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white text-[10px] font-bold">{(item.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <Lock size={9} className="text-blue-300 fill-blue-300/20" />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: parseFloat(percentage) < 10 ? item.color : '#646b85' }}>{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Star, PackageOpen } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { playWinFanfare } from "@/lib/sounds";

const ITEM_W = 150;

export function HorizontalSpinner({ spinData, fallbackStrip, onComplete, containerW, caseData }: any) {
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
      const targetX = -(spinData.winningIndex * ITEM_W) + (containerW / 2) - (ITEM_W / 2);
      const duration = 4.5 + Math.random() * 1.5;

      await controls.start({
        x: targetX,
        transition: { duration, ease: [0.12, 0.8, 0.18, 1] }
      });

      if (isCancelled) return;

      if (spinData.hitLuckyStar) {
        setBonusSpinning(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        if (isCancelled) return;

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
        
        const bonusTargetX = -(bonusWinningIndex * ITEM_W) + (containerW / 2) - (ITEM_W / 2);
        await controls.set({ x: 0 });
        
        setTrackOpacity(1);
        try { playWinFanfare(); } catch(e){}
        
        controls.start({
          x: bonusTargetX,
          transition: { duration: 3.5, ease: [0.12, 0.8, 0.18, 1] }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3600));
        if (isCancelled) return;
      }

      setLanded(true);
      if (onComplete) onComplete(spinData);
    };
    run();
    
    return () => { isCancelled = true; };
  }, [spinData, containerW]);

  return (
    <div className="w-full flex-1 relative flex flex-col items-center justify-center min-h-[140px] overflow-hidden">
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
                <PackageOpen size={56} style={{ color: item.color || '#fff' }} className={isWinner ? 'scale-125 transition-transform z-20' : 'opacity-80'} />
              )}
              {isWinner && !isLucky && (
                <div className="absolute -bottom-2 z-30 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[#0b0e14]/90 px-3 py-1 rounded-full border border-[#2a2d3a] shadow-lg">
                    <DLCurrency amount={item.value} size="sm" className="font-black text-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </motion.div>
      </div>
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gradient-to-b from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.6)] z-40 transform -translate-x-1/2" />
    </div>
  );
}

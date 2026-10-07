"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { apiFetch } from '@/lib/auth';
import { ShieldCheck, Settings, Bomb } from 'lucide-react';
import { ProvablyFairModal } from '@/components/ui/ProvablyFairModal';

const HOUSE_EDGE = 0.99;

const calculateMultiplier = (mines: number, hits: number) => {
    if (hits === 0) return 1.00;
    let mult = 1;
    for (let i = 0; i < hits; i++) {
        mult *= (25 - i) / (25 - mines - i);
    }
    return mult * HOUSE_EDGE;
};

const BOMB_URL = "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/2112/y-offset/736/window-width/32/window-height/32?format=webp&fill=cb-20260219100732";
const GEM_URL = "https://static.wikia.nocookie.net/growtopia/images/3/3b/GemSprites.png/revision/latest/window-crop/width/32/x-offset/0/y-offset/0/window-width/32/window-height/32?format=webp&fill=cb-20190407104126";

export default function MinesPage() {
  const { balance, refreshUser, showToast } = useWallet();

  const [betAmount, setBetAmount] = useState<string>("0.00");
  const [minesCount, setMinesCount] = useState<number>(5);
  
  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'playing' | 'blown_up' | 'cashout'>('idle');
  const [boardState, setBoardState] = useState<number[]>(Array(25).fill(0));
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [profit, setProfit] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [pfModalOpen, setPfModalOpen] = useState(false);

  // Check for active game on mount
  useEffect(() => {
    const fetchActiveGame = async () => {
      try {
        const res = await apiFetch("/play/mines/active") as any;
        if (res.activeGame) {
          setGameId(res.activeGame.id);
          setBetAmount((res.activeGame.betAmount / 100).toFixed(2));
          setMinesCount(res.activeGame.minesCount);
          setBoardState(JSON.parse(res.activeGame.boardState));
          setStatus('playing');
          setMultiplier(res.activeGame.multiplier);
          setProfit(res.activeGame.profit);
          
          const parsedBoard = JSON.parse(res.activeGame.boardState);
          setHits(parsedBoard.filter((t: number) => t === 1).length);
        }
      } catch (err) {
        // Ignore 404s
      }
    };
    fetchActiveGame();
  }, []);

  const handleStart = async () => {
    const amount = parseFloat(betAmount) * 100;
    if (isNaN(amount) || amount <= 0) {
      showToast("Invalid bet amount", "error");
      return;
    }
    if (amount > balance) {
      showToast("Insufficient funds", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/play/mines/start", {
        method: "POST",
        body: JSON.stringify({ amount, minesCount }),
      }) as any;
      setGameId(res.gameId);
      setStatus('playing');
      setBoardState(Array(25).fill(0));
      setMineLocations([]);
      setMultiplier(1.0);
      setProfit(0);
      setHits(0);
      refreshUser();
    } catch (err: any) {
      showToast(err.message || "Failed to start game", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTileClick = async (index: number) => {
    if (status !== 'playing' || boardState[index] !== 0 || loading) return;

    setLoading(true);
    try {
      const res = await apiFetch("/play/mines/click", {
        method: "POST",
        body: JSON.stringify({ gameId, tileIndex: index }),
      }) as any;

      if (res.status === 'blown_up') {
        setStatus('blown_up');
        setBoardState(res.boardState);
        setMineLocations(res.mineLocations);
        refreshUser();
      } else {
        setBoardState(res.boardState);
        setMultiplier(res.multiplier);
        setHits(prev => prev + 1);
        setProfit(parseFloat(betAmount) * 100 * res.multiplier - (parseFloat(betAmount) * 100));
      }
    } catch (err: any) {
      showToast(err.message || "Error clicking tile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (status !== 'playing' || hits === 0 || loading) return;

    setLoading(true);
    try {
      const res = await apiFetch("/play/mines/cashout", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      }) as any;
      setStatus('cashout');
      setMineLocations(res.mineLocations);
      refreshUser();
      showToast(`Cashed out successfully! Win: ${(res.payout / 100).toFixed(2)} DLs`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to cashout", "error");
    } finally {
      setLoading(false);
    }
  };

  const numBetAmount = parseFloat(betAmount) * 100;
  const isInsufficient = !isNaN(numBetAmount) && numBetAmount > balance && status === 'idle';
  const nextMultiplier = calculateMultiplier(minesCount, hits + 1);
  const nextProfit = numBetAmount * nextMultiplier - numBetAmount;

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#0d0f14] text-white">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-[#1b1e26] border-r border-[#2a2d3a] flex flex-col flex-shrink-0 z-10">
        <div className="p-4 space-y-6 flex-1">
          {/* Bet Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[#878eab]">Bet Amount</label>
              <span className="text-xs font-bold text-[#4d5366]">DLs</span>
            </div>
            <div className="flex bg-[#0f1118] border border-[#2a2d3a] rounded-xl overflow-hidden focus-within:border-accent-blue transition-colors relative">
              <div className="pl-3 flex items-center justify-center pointer-events-none">
                <img src="/dl.webp" alt="DL" className="w-4 h-4 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={status === 'playing'}
                className="w-full bg-transparent text-white font-bold text-sm px-3 py-3 focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center px-1 gap-1">
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                  disabled={status === 'playing'}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                  disabled={status === 'playing'}
                  className="px-3 py-1 bg-[#252936] hover:bg-[#2f3445] text-xs font-bold text-white rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  2x
                </button>
              </div>
            </div>
          </div>

          {/* Mines Count */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#878eab]">Mines</label>
            <select
              value={minesCount}
              onChange={(e) => setMinesCount(parseInt(e.target.value, 10))}
              disabled={status === 'playing'}
              className="w-full bg-[#0f1118] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23878eab' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
            >
              {[...Array(24)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          {status === 'playing' ? (
            <button
              onClick={handleCashout}
              disabled={hits === 0 || loading}
              className="w-full py-4 bg-[#00c74d] hover:bg-[#00b345] text-black font-black rounded-xl text-lg transition-all shadow-[0_0_20px_rgba(0,199,77,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cashout {(numBetAmount * multiplier / 100).toFixed(2)}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isInsufficient || loading || parseFloat(betAmount) <= 0}
              className={`w-full py-4 font-black rounded-xl text-lg transition-all ${
                isInsufficient
                  ? "bg-[#2f4553] text-[#878eab] cursor-not-allowed"
                  : "bg-accent-blue hover:bg-accent-blue/90 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              }`}
            >
              {isInsufficient ? "Insufficient Funds" : "Bet"}
            </button>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* The 5x5 Grid Wrapper */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
          <div className="grid grid-cols-5 gap-3 w-full max-w-[500px] aspect-square">
            {[...Array(25)].map((_, i) => {
              const isHidden = boardState?.[i] === 0;
              const isGem = boardState?.[i] === 1;
              const isBomb = boardState?.[i] === 2;
              
              // In cashout or blown_up state, reveal the unclicked mines with opacity
              const isRevealedMine = (status === 'blown_up' || status === 'cashout') && mineLocations.includes(i) && !isBomb;
              const isRevealedGem = (status === 'blown_up' || status === 'cashout') && !mineLocations.includes(i) && !isGem && !isBomb;

              return (
                <button
                  key={i}
                  onClick={() => handleTileClick(i)}
                  disabled={status !== 'playing' || !isHidden}
                  className={`
                    relative rounded-xl flex items-center justify-center transition-all duration-300
                    ${isHidden && status === 'playing' ? 'bg-[#2f4553] hover:-translate-y-1 hover:bg-[#3d596b] cursor-pointer shadow-[0_6px_0_#1b2832]' : ''}
                    ${isHidden && status !== 'playing' && !isRevealedMine && !isRevealedGem ? 'bg-[#1b2832]' : ''}
                    ${isGem || isBomb || isRevealedMine || isRevealedGem ? 'bg-[#0d1218] scale-[0.95]' : ''}
                  `}
                >
                  <div className="absolute inset-2 flex items-center justify-center">
                    {isGem && <img src={GEM_URL} alt="Gem" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,255,0,0.5)] animate-in zoom-in duration-300" />}
                    {isBomb && <img src={BOMB_URL} alt="Bomb" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-in zoom-in duration-300" />}
                    {isRevealedMine && <img src={BOMB_URL} alt="Bomb" className="w-full h-full object-contain opacity-40 grayscale-[50%]" />}
                    {isRevealedGem && <img src={GEM_URL} alt="Gem" className="w-full h-full object-contain opacity-30 grayscale-[80%]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floating Stats */}
          {status === 'playing' && hits > 0 && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#1b1e26]/90 border border-[#2a2d3a] px-6 py-3 rounded-full flex gap-6 backdrop-blur shadow-2xl animate-in slide-in-from-top-4">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-[#878eab] tracking-wider mb-0.5">Multiplier</div>
                <div className="font-black text-white text-lg">{multiplier.toFixed(2)}x</div>
              </div>
              <div className="w-px bg-[#2a2d3a]" />
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-[#878eab] tracking-wider mb-0.5">Next Gem</div>
                <div className="font-black text-accent-green text-lg">+{((nextProfit - profit) / 100).toFixed(2)} <span className="text-xs">DLs</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info (Provably fair, settings, game info) */}
        <div className="bg-[#15181f] border-t border-[#1b1e26] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm font-bold text-[#878eab]">
            <button onClick={() => setPfModalOpen(true)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ShieldCheck size={16} /> Provably Fair
            </button>
            <button className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Settings size={16} /> Settings
            </button>
          </div>
          
          <div className="bg-[#0f1118] border border-[#1b1e26] rounded-xl p-6 flex flex-col md:flex-row gap-8">
            <div className="space-y-4 min-w-[250px]">
              <h2 className="text-xl font-black text-white">Mines</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">RTP</span>
                  <span className="text-white font-bold">99.00%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">Max Bet</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">1,000.00</span>
                    <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878eab] font-bold">Max Win</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">100,000.00</span>
                    <img src="/dl.webp" alt="DL" className="w-3 h-3 object-contain opacity-80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[#878eab] text-sm font-bold leading-relaxed max-w-2xl">
              <p>In this action-packed game, you'll be going up against the casino.</p>
              <br/>
              <p>Make sure to avoid the mines at all costs, as they will make it very difficult for you to reach the maximum win. Each safe gem you uncover multiplies your payout, but a single mine ends the round and takes your bet.</p>
            </div>
          </div>
        </div>
      </div>

      <ProvablyFairModal isOpen={pfModalOpen} onClose={() => setPfModalOpen(false)} />
    </div>
  );
}

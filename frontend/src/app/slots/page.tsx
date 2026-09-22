"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/auth";
import { Sparkles, Play, Maximize2, Minimize2, X, RefreshCw, ShieldCheck, Flame, Coins } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";

interface SlotGame {
  id: string;
  name: string;
  provider: string;
  category?: string;
  image: string;
}

export default function SlotsPage() {
  const { user, refreshUser, openAuthModal } = useAuth();
  const [games, setGames] = useState<SlotGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<SlotGame | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch("/api/bgaming/games")
      .then(r => r.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback default games list
        setGames([
          { id: 'AlohaKingElvis', name: 'Aloha King Elvis', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AlohaKingElvis.png' },
          { id: 'ElvisFrog', name: 'Elvis Frog in Vegas', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/ElvisFrog.png' },
          { id: 'BonanzaBillion', name: 'Bonanza Billion', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/BonanzaBillion.png' },
          { id: 'LuckyLadyMoon', name: 'Lucky Lady Moon', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/LuckyLadyMoon.png' },
          { id: 'FruitMillion', name: 'Fruit Million', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/FruitMillion.png' },
          { id: 'JohnnyCash', name: 'Johnny Cash', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/JohnnyCash.png' },
          { id: 'AztecMagicDeluxe', name: 'Aztec Magic Deluxe', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AztecMagicDeluxe.png' },
          { id: 'MissCherryFruits', name: 'Miss Cherry Fruits', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/MissCherryFruits.png' },
          { id: 'HitTheRoute', name: 'Hit The Route', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/HitTheRoute.png' },
          { id: 'BookOfCats', name: 'Book Of Cats', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/BookOfCats.png' },
          { id: 'SnoopDoggDollars', name: 'Snoop Dogg Dollars', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/SnoopDoggDollars.png' },
          { id: 'PennyPelican', name: 'Penny Pelican', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/PennyPelican.png' },
          { id: 'WildCash', name: 'Wild Cash', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/WildCash.png' },
          { id: 'AztecMagicMegaways', name: 'Aztec Magic Megaways', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/AztecMagicMegaways.png' },
          { id: 'LuckyFarmBonanza', name: 'Lucky Farm Bonanza', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/LuckyFarmBonanza.png' },
          { id: 'SweetRushMegaways', name: 'Sweet Rush Megaways', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/SweetRushMegaways.png' },

          { id: 'ElvisFrogTrueways', name: 'Elvis Frog TRUEWAYS', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/ElvisFrogTrueways.png' },

          { id: 'WildCashX9990', name: 'Wild Cash x9990', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/WildCashX9990.png' },
          { id: 'DomnitorsTreasure', name: 'Domnitors Treasure', provider: 'BGaming', category: 'Slots', image: 'https://cdn.softswiss.net/i/s3/bgaming/DomnitorsTreasure.png' },
          { id: 'MultihandBlackjack', name: 'Multihand Blackjack', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/MultihandBlackjack.png' },

          { id: 'EuropeanRoulette', name: 'European Roulette', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/EuropeanRoulette.png' },
          { id: 'FrenchRoulette', name: 'French Roulette', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/FrenchRoulette.png' },

          { id: 'CasinoHoldem', name: 'Casino Holdem', provider: 'BGaming', category: 'Table Games', image: 'https://cdn.softswiss.net/i/s3/bgaming/CasinoHoldem.png' },


          { id: 'ScratchDice', name: 'Scratch Dice', provider: 'BGaming', category: 'Instant Win', image: 'https://cdn.softswiss.net/i/s3/bgaming/ScratchDice.png' },
          { id: 'JogoDoBicho', name: 'Jogo Do Bicho', provider: 'BGaming', category: 'Instant Win', image: 'https://cdn.softswiss.net/i/s3/bgaming/JogoDoBicho.png' }
        ]);
        setLoading(false);
      });
  }, []);

  // Poll balance while playing
  useEffect(() => {
    if (!activeGame) return;
    const interval = setInterval(() => {
      refreshUser();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGame, refreshUser]);

  const handleLaunchGame = (game: SlotGame) => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setActiveGame(game);
  };

  const token = getAccessToken() || "";
  const launchUrl = activeGame
    ? `/api/bgaming/launch/${activeGame.id}?token=${encodeURIComponent(token)}`
    : "";

  const categories = ["All", "Slots", "Table Games", "Instant Win"];
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#151922] to-cyan-950/40 border border-emerald-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black mb-4">
            <Sparkles size={14} /> Official BGaming Slots Provider
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Real Vegas Slots with <span className="text-emerald-400">Diamond Locks</span>
          </h1>
          <p className="text-sm text-[#878eab] leading-relaxed mb-6">
            Play iconic high-RTP slots directly on GrowBet. Bets and winnings seamlessly settle into your Diamond Lock balance in real-time.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-[#7a819c]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={16} /> Provably Fair Engine
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Coins size={16} /> Instant DL Settlements
            </div>
          </div>
        </div>
      </div>

      {/* Active Game Modal / Container */}
      {activeGame && (
        <div className={`fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md transition-all ${isFullscreen ? "p-0" : "p-4 sm:p-8"}`}>
          {/* Top Control Bar */}
          <div className="flex items-center justify-between bg-[#12151c] border border-[#232838] px-5 py-3 rounded-2xl mb-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{activeGame.name}</h3>
                <span className="text-[10px] text-[#7a819c] font-bold uppercase">{activeGame.provider} • Real Money (DL)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-[#191d29] px-3.5 py-1.5 rounded-xl border border-[#2b3145]">
                <span className="text-xs text-[#7a819c] font-bold">Balance:</span>
                <DLCurrency amount={user?.mockBalance || 0} size="xs" className="text-emerald-400" />
              </div>

              <button
                onClick={() => refreshUser()}
                className="p-2 rounded-xl bg-[#191d29] hover:bg-[#232838] text-[#7a819c] hover:text-white transition-colors cursor-pointer"
                title="Refresh Balance"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-[#191d29] hover:bg-[#232838] text-[#7a819c] hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                onClick={() => {
                  setActiveGame(null);
                  setIsFullscreen(false);
                  refreshUser();
                }}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 cursor-pointer"
                title="Close Slot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Game iFrame */}
          <div className="flex-1 w-full h-full bg-black rounded-2xl overflow-hidden border border-[#232838] relative shadow-2xl">
            <iframe
              src={launchUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
            />
          </div>
        </div>
      )}

      {/* Slots Grid */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#13161f] p-4 rounded-2xl border border-[#202535]">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === category ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#191d29] text-[#7a819c] hover:text-white hover:bg-[#232838]'}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#232838] rounded-xl px-4 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#7a819c] font-bold animate-pulse">Loading games...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredGames.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#7a819c] font-bold">No games found.</div>
            ) : filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => handleLaunchGame(game)}
                className="group relative bg-[#13161f] border border-[#202535] hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1a1e2b]">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x300/1e293b/10b981?text=${encodeURIComponent(game.name)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#13161f] via-transparent to-transparent opacity-80" />

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-90 group-hover:scale-100 transition-transform">
                      <Play fill="currentColor" size={20} className="ml-1" />
                    </div>
                  </div>

                  {/* Provider Tag */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-emerald-400">
                    BGAMING
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div className="font-black text-white text-xs sm:text-sm truncate group-hover:text-emerald-400 transition-colors">
                    {game.name}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#202535] text-[10px] text-[#7a819c] font-bold">
                    <span>96.5% RTP</span>
                    <span className="text-emerald-400">DL Currency</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

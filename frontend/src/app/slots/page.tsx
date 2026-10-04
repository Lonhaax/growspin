"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { getAccessToken } from "@/lib/auth";
import { Sparkles, Play, Maximize2, Minimize2, X, RefreshCw } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";

interface SlotGame {
  id: string;
  name: string;
  provider: string;
  category?: string;
  image: string;
}

import { apiFetch, API_URL } from "@/lib/auth";

export default function SlotsPage() {
  const { user, refreshUser, openAuthModal } = useAuth();
  const { balance } = useWallet();
  const [games, setGames] = useState<SlotGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<SlotGame | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    apiFetch("/bgaming/games")
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
    ? `${API_URL}/bgaming/launch/${activeGame.id}?token=${encodeURIComponent(token)}`
    : "";

  const categories = ["All", "Slots", "Table Games", "Instant Win"];
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-screen-2xl mx-auto pb-32">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-6">Slots</h1>

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
                <DLCurrency amount={balance * 100} size="xs" className="text-emerald-400" />
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

      {/* Slots Filters & Grid */}
      <div>
        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search for Game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b1f2b] border border-[#282d3e] rounded-lg px-4 py-3.5 text-sm font-medium text-white placeholder-[#5a627a] focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
          />
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-sm font-bold text-[#878eab]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Filter by</span>
              <button className="bg-[#1b1f2b] border border-[#282d3e] rounded-md px-3 py-1.5 flex items-center gap-2 hover:bg-[#242938] transition-colors">
                <span className="text-white">Providers</span>
                <span className="text-[#5a627a] text-[10px]">▼</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Sort by</span>
              <button className="bg-[#1b1f2b] border border-[#282d3e] rounded-md px-3 py-1.5 flex items-center gap-2 hover:bg-[#242938] transition-colors">
                <span className="text-white">Popular</span>
                <span className="text-[#5a627a] text-[10px]">▼</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle DLs */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-5 bg-cyan-500 rounded-full flex items-center p-0.5 cursor-pointer shadow-inner">
            <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Only games that support DLs</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#7a819c] font-bold animate-pulse">Loading games...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2.5">
            {filteredGames.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#7a819c] font-bold">No games found.</div>
            ) : filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => handleLaunchGame(game)}
                className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl aspect-[3/4] bg-[#1a1e2b]"
              >
                {/* BGaming Thumbnail Image (these images usually contain the text natively) */}
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/400x533/1e293b/10b981?text=${encodeURIComponent(game.name)}`;
                  }}
                />
                
                {/* Subtle dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-90 group-hover:scale-100 transition-transform">
                    <Play fill="currentColor" size={16} className="ml-0.5" />
                  </div>
                </div>

                {/* Top Right Info/Lock Icon (Mocking BetDice style) */}
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#191d29]/80 backdrop-blur-sm rounded-sm flex items-center justify-center border border-white/10 shadow-sm z-10 text-[9px] text-cyan-400 font-black">
                  i
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

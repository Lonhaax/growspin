"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageOpen, Search, ArrowUpDown, Star, Users, SlidersHorizontal, RotateCcw, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/auth";
import { DLCurrency } from "@/components/ui/DLCurrency";

function CaseCard({ c, riskLevel }: { c: any, riskLevel: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const handleAdd = (amount: number) => {
    setQty(prev => Math.min(prev + amount, 100)); // cap at 100
  };

  const setExact = (amount: number) => {
    setQty(Math.min(Math.max(amount, 1), 100));
  };

  const totalPrice = c.price * qty;

  return (
    <div
      className="group bg-[#0b0e14] border border-[#1a1f2e] hover:border-[#252b40] rounded-xl p-5 flex flex-col items-center relative overflow-hidden transition-all duration-300 h-[280px]"
    >
      {/* Default State (remains visible but blurred on hover) */}
      <div className="w-full h-full flex flex-col items-center transition-all duration-300 group-hover:scale-95 group-hover:opacity-40">
        <div className="w-32 h-32 mb-6 flex items-center justify-center">
          {c.image ? (
            <img
              src={c.image}
              alt={c.name}
              className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300"
            />
          ) : (
            <PackageOpen size={64} className="text-[#323d57] drop-shadow-xl" />
          )}
        </div>

        <h3 className="text-[13px] font-bold text-[#8f96b3] mb-4 text-center truncate w-full transition-colors">
          {c.name}
        </h3>

        <div className="w-full px-6 mb-4">
          <div className="flex h-[3px] gap-1 w-full rounded-full overflow-hidden relative bg-[#1a1f2e]">
            <div className={`flex-1 ${riskLevel === 0 ? "bg-green-500" : "bg-[#1f2536]"}`}></div>
            <div className={`flex-1 ${riskLevel === 1 ? "bg-yellow-500" : "bg-[#1f2536]"}`}></div>
            <div className={`flex-1 ${riskLevel === 2 ? "bg-orange-500" : "bg-[#1f2536]"}`}></div>
            <div className={`flex-1 ${riskLevel === 3 ? "bg-red-500" : "bg-[#1f2536]"}`}></div>
            
            {/* Risk Marker Line */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-white shadow-sm"
              style={{ left: `calc(${25 * riskLevel + 12.5}% - 1px)` }}
            />
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-sm font-black text-white flex items-center justify-center gap-1.5">
             {c.price > 0 ? (
               <>
                 <span>{(c.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 <Lock size={14} className="text-blue-300 fill-blue-300/20" />
               </>
             ) : (
               <DLCurrency amount={c.price} size="sm" className="text-white" />
             )}
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-[2px] p-4 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="flex justify-between items-center mb-auto pt-1">
          <span className="text-white text-sm font-bold truncate pr-2 shadow-sm">{c.name}</span>
          <Search size={18} className="text-[#646b85] flex-shrink-0 cursor-pointer hover:text-white transition-colors" />
        </div>
        
        <div className="w-full bg-[#151926] rounded-xl flex justify-between items-center px-5 py-3 mb-3 border border-[#1a1f2e] shadow-inner">
          <button onClick={() => setExact(qty - 1)} className="text-[#646b85] hover:text-white font-black text-xl transition-colors focus:outline-none">-</button>
          <span className="text-amber-400 font-black text-base">{qty}</span>
          <button onClick={() => setExact(qty + 1)} className="text-[#646b85] hover:text-white font-black text-xl transition-colors focus:outline-none">+</button>
        </div>
        
        <div className="flex gap-2 w-full mb-5">
          {[1, 2, 5, 10].map((val) => (
            <button 
              key={val}
              onClick={() => handleAdd(val)}
              className="flex-1 bg-[#151926] text-[#646b85] hover:bg-[#1a1f2e] hover:text-white rounded-lg py-2.5 text-center text-xs font-bold transition-colors focus:outline-none border border-transparent hover:border-[#252b40]"
            >
              +{val}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => router.push(`/cases/${c.id}?qty=${qty}`)}
          className="w-full bg-[#1c7ced] hover:bg-[#186dc4] text-white font-black py-3.5 rounded-xl flex justify-center items-center gap-1.5 mb-2.5 transition-all shadow-[0_0_15px_rgba(28,124,237,0.3)] hover:shadow-[0_0_20px_rgba(28,124,237,0.5)] focus:outline-none"
        >
          Open for {(totalPrice / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <Lock size={14} className="text-blue-100 fill-blue-100/40" />
        </button>
        
        <button 
          onClick={() => router.push(`/cases/${c.id}`)}
          className="w-full bg-[#151926] hover:bg-[#1a1f2e] text-[#8f96b3] hover:text-white font-black py-3.5 rounded-xl transition-colors border border-[#1a1f2e] focus:outline-none"
        >
          View Case
        </button>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name">("newest");
  const [activeTab, setActiveTab] = useState<"originals" | "community">("originals");

  useEffect(() => {
    apiFetch("/cases")
      .then((r) => r.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCases = useMemo(() => {
    let list = cases.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [cases, search, sortBy]);

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-32 font-sans">
      
      {/* Top Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <button 
          onClick={() => setActiveTab("originals")}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left w-full sm:w-auto min-w-[260px] ${
            activeTab === "originals" 
              ? "bg-[#111f38] border-[#1d355f]" 
              : "bg-[#151926] border-transparent hover:bg-[#1a1f2e]"
          }`}
        >
          <div className="mt-0.5"><Star size={18} className={activeTab === "originals" ? "text-white" : "text-[#7a819c]"} fill={activeTab === "originals" ? "white" : "none"} /></div>
          <div>
            <div className={`font-bold mb-0.5 ${activeTab === "originals" ? "text-white" : "text-[#b4b9d0]"}`}>Originals</div>
            <div className={`text-xs ${activeTab === "originals" ? "text-blue-300/80" : "text-[#7a819c]"}`}>Cases created by BetDice</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab("community")}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left w-full sm:w-auto min-w-[260px] ${
            activeTab === "community" 
              ? "bg-[#111f38] border-[#1d355f]" 
              : "bg-[#151926] border-transparent hover:bg-[#1a1f2e]"
          }`}
        >
          <div className="mt-0.5"><Users size={18} className={activeTab === "community" ? "text-white" : "text-[#7a819c]"} /></div>
          <div>
            <div className={`font-bold mb-0.5 ${activeTab === "community" ? "text-white" : "text-[#b4b9d0]"}`}>Community</div>
            <div className={`text-xs ${activeTab === "community" ? "text-blue-300/80" : "text-[#7a819c]"}`}>Cases created by community</div>
          </div>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-[#12141c] border border-[#1a1f2e] p-6 rounded-2xl flex flex-col xl:flex-row gap-8 shadow-sm">
        
        {/* Left Side: Search & Sort */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="text-xs font-bold text-[#b4b9d0] mb-2">Search for Case</div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#646b85]" size={16} />
              <input
                type="text"
                placeholder="Case Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1f2e] border-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#646b85] focus:ring-1 focus:ring-blue-500 transition-shadow"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[220px]">
              <div className="text-xs font-bold text-[#b4b9d0] mb-2">Sort By</div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full bg-[#1a1f2e] border-none rounded-lg pl-4 pr-10 py-2.5 text-sm text-white font-bold cursor-pointer appearance-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowUpDown size={14} className="text-[#646b85]" />
                </div>
              </div>
            </div>
            
            <div className="flex items-end h-full gap-2 mt-6">
              <button className="bg-[#1a1f2e] hover:bg-[#252b40] p-2.5 rounded-lg text-[#646b85] hover:text-white transition-colors"><SlidersHorizontal size={18} /></button>
              <button className="bg-[#1a1f2e] hover:bg-[#252b40] p-2.5 rounded-lg text-[#646b85] hover:text-white transition-colors"><RotateCcw size={18} /></button>
            </div>
          </div>
        </div>

        {/* Right Side: Range Sliders (Visual mockup) */}
        <div className="flex-1 flex flex-col sm:flex-row gap-10">
          <div className="flex-1">
            <div className="text-xs font-bold text-[#4491f2] mb-3">Price Range</div>
            <div className="relative h-1.5 bg-[#1a1f2e] rounded-full mb-5 mt-4">
              <div className="absolute left-0 right-0 h-full bg-[#4491f2] rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer border-2 border-[#4491f2]"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer border-2 border-[#4491f2]"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#1a1f2e] rounded-lg px-3 py-2 flex items-center justify-between border border-[#252b40]">
                <span className="text-xs text-white font-bold">0</span>
                <Lock size={12} className="text-blue-300" />
              </div>
              <div className="flex-1 bg-[#1a1f2e] rounded-lg px-3 py-2 flex items-center justify-between border border-[#252b40]">
                <span className="text-xs text-white font-bold">6853.1</span>
                <Lock size={12} className="text-blue-300" />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs font-bold text-[#b4b9d0] mb-3">Risk Range</div>
            <div className="relative h-2 flex gap-1 rounded-full mb-3 mt-4">
              <div className="flex-1 bg-green-500 rounded-l-full relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer border-2 border-green-500"></div>
              </div>
              <div className="flex-1 bg-yellow-500"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-red-500 rounded-r-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer border-2 border-red-500"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-green-500">Low</span>
              <span className="text-[10px] font-bold text-yellow-500">Medium</span>
              <span className="text-[10px] font-bold text-orange-500">High</span>
              <span className="text-[10px] font-bold text-red-500">Extreme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="text-center py-24 text-[#7f86a2] font-bold">Loading cases...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-24 text-[#7f86a2] font-bold">No cases match your search.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCases.map((c, i) => {
            // Generate a deterministic visual risk based on case ID to simulate volatility
            const riskLevel = c.id % 4; // 0=low, 1=medium, 2=high, 3=extreme
            
            return <CaseCard key={c.id} c={c} riskLevel={riskLevel} />;
          })}
        </div>
      )}
    </div>
  );
}

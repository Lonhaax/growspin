"use client";

import React, { useState, useMemo } from "react";
import { Search, Trash2, Box, Palette, Save, AlertTriangle } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { apiFetch } from "@/lib/auth";

type GTItem = { id: number; name: string; value: number; color: string; imageUrl: string; };

export default function AdvancedCaseCreator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [selectedItems, setSelectedItems] = useState<{ item: GTItem; chance: number }[]>([]);
  const [caseName, setCaseName] = useState("");
  const [caseHue, setCaseHue] = useState(0); // For CSS hue-rotate on the chest
  const [manualPrice, setManualPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<GTItem[]>([]);

  React.useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await apiFetch("/admin/items");
        if (res.ok) setItems(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    loadItems();
  }, []);

  // Sorting and filtering the master list
  const filteredItems = useMemo(() => {
    let result = [...items].filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortOption === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOption === "name-desc") result.sort((a, b) => b.name.localeCompare(a.name));
    if (sortOption === "price-desc") result.sort((a, b) => b.value - a.value);
    if (sortOption === "price-asc") result.sort((a, b) => a.value - b.value);
    return result;
  }, [searchTerm, sortOption]);

  const handleToggleItem = (item: GTItem) => {
    if (selectedItems.find(i => i.item.name === item.name)) {
      setSelectedItems(selectedItems.filter(i => i.item.name !== item.name));
    } else {
      setSelectedItems([...selectedItems, { item, chance: 0 }]);
    }
  };

  const handleChanceChange = (index: number, newChance: number) => {
    const updated = [...selectedItems];
    updated[index].chance = newChance;
    setSelectedItems(updated);
  };

  const totalChance = selectedItems.reduce((acc, curr) => acc + (curr.chance || 0), 0);
  
  // Expected Value (EV) Calculation
  // EV = sum(item_value * (item_chance / 100))
  const expectedValue = selectedItems.reduce((acc, curr) => acc + (curr.item.value * (curr.chance || 0) / 100), 0);
  const suggestedPrice = expectedValue * 1.05; // 5% house edge on cases

  const handleCreateCase = async () => {
    if (!caseName || caseName.length < 4) return alert("Case name must be at least 4 characters.");
    if (selectedItems.length === 0) return alert("Please select at least one item.");
    if (Math.abs(totalChance - 100) > 0.01) return alert("Total chances must equal exactly 100%.");
    
    let finalPrice = parseFloat(manualPrice);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      if (expectedValue <= 0) return alert("Cannot determine a fair price. Please set a manual price.");
      finalPrice = suggestedPrice;
    }

    if (finalPrice < expectedValue) {
      const confirmLoss = window.confirm(`WARNING: The case price (${finalPrice.toFixed(2)} DLs) is lower than the expected payout (${expectedValue.toFixed(2)} DLs). The house will lose money on average. Continue?`);
      if (!confirmLoss) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: caseName,
        price: Math.floor(finalPrice * 100), // convert to subunits
        image: `/chest.png?hue=${caseHue}`, // Storing the hue intent if needed, or we just render native chests
        active: true,
        items: selectedItems.map(si => ({
          name: si.item.name,
          value: Math.floor(si.item.value * 100), // convert to subunits
          color: si.item.color,
          weight: si.chance,
          imageUrl: si.item.imageUrl,
          isLuckyStarItem: si.chance < 5 // arbitrarily mark items < 5% as rare
        }))
      };

      const res = await apiFetch("/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Case created successfully!");
        setCaseName("");
        setSelectedItems([]);
        setManualPrice("");
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create case.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Item Selection Grid */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Box className="text-indigo-500" /> Create new case
          </h2>
          <div className="flex items-center gap-3 bg-[#1e2333] px-3 py-1 rounded-full border border-[#202535]">
            <span className="text-xs text-gray-400 font-bold">Items available</span>
            <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full text-xs font-black">{selectedItems.length}/25</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-[#0a0d14] border border-[#202535] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-desc">Price (Highest)</option>
            <option value="price-asc">Price (Lowest)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto p-2">
          {filteredItems.map(item => {
            const isSelected = selectedItems.find(i => i.item.name === item.name);
            return (
              <div 
                key={item.name}
                onClick={() => handleToggleItem(item)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2 group ${isSelected ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-[#202535] bg-[#0a0d14] hover:border-gray-600'}`}
              >
                <div className="w-12 h-12 mb-3 relative">
                  <div className="absolute inset-0 opacity-20 blur-xl" style={{ backgroundColor: item.color }}></div>
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain relative z-10" style={{ imageRendering: 'pixelated' }} />
                </div>
                <div className="text-[10px] text-gray-300 font-bold text-center leading-tight mb-1">{item.name}</div>
                <div className="text-[10px] font-black" style={{ color: item.color }}>
                  <DLCurrency amount={item.value * 100} size="xs" />
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Item Chances */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-[#7a819c] mb-4 uppercase tracking-wider">Item chances</h3>
        
        {selectedItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500 border border-dashed border-[#202535] rounded-xl bg-[#0a0d14]">
            <p className="text-sm font-bold">Select items to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((si, i) => (
              <div key={si.item.name} className="flex items-center gap-4 bg-[#0a0d14] p-3 rounded-xl border border-[#202535]">
                <div className="w-10 h-10 p-1 bg-[#13161f] rounded-lg border border-[#202535]">
                  <img src={si.item.imageUrl} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{si.item.name}</div>
                  <div className="text-xs font-bold" style={{ color: si.item.color }}><DLCurrency amount={si.item.value * 100} size="xs" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0" max="100" step="0.01"
                    value={si.chance}
                    onChange={(e) => handleChanceChange(i, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#13161f] border border-[#202535] rounded-lg p-2 text-white text-right font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
                <button 
                  onClick={() => handleToggleItem(si.item)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <div className={`p-4 rounded-xl border flex justify-between items-center font-bold text-sm ${Math.abs(totalChance - 100) > 0.01 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              <span>Total Chance</span>
              <span>{totalChance.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Style & Create */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-[#7a819c] mb-6 uppercase tracking-wider">Style your case</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Chest Preview */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0a0d14] rounded-2xl border border-[#202535] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
            
            {/* We use an SVG chest or a highly stylable placeholder */}
            <div 
              className="relative w-48 h-48 transition-all duration-300 transform group-hover:scale-105 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
              style={{ filter: `hue-rotate(${caseHue}deg) drop-shadow(0 20px 30px rgba(0,0,0,0.5))` }}
            >
              {/* Fallback to a rendered SVG if the user hasn't uploaded a chest.png */}
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-indigo-500">
                <path d="M20 40 L80 40 L85 80 L15 80 Z" fill="currentColor" fillOpacity="0.8" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M15 40 Q50 15 85 40" fill="currentColor" fillOpacity="0.9" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/>
                <rect x="42" y="32" width="16" height="16" rx="2" fill="#eab308" stroke="#0f172a" strokeWidth="2"/>
                <circle cx="50" cy="40" r="3" fill="#0f172a"/>
                <path d="M50 43 L50 48" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 40 L80 40" stroke="#0f172a" strokeWidth="3" strokeOpacity="0.5"/>
              </svg>
            </div>
            
            <div className="mt-8 flex items-center gap-4 w-full max-w-xs z-10">
              <Palette className="text-gray-400" size={18} />
              <input 
                type="range" 
                min="0" max="360" 
                value={caseHue} 
                onChange={(e) => setCaseHue(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Right: Finalize */}
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Case Name</label>
              <input 
                type="text" 
                placeholder="Case Name (4-20 characters)"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider flex justify-between">
                <span>Price (DLs)</span>
                <span className="text-indigo-400">EV: {expectedValue.toFixed(2)} DLs</span>
              </label>
              
              <input 
                type="number" 
                placeholder={expectedValue > 0 ? suggestedPrice.toFixed(2).toString() : "0.00"}
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {expectedValue > 0 && (
                <p className={`text-xs mt-2 font-bold ${(parseFloat(manualPrice) || suggestedPrice) < expectedValue ? 'text-red-400' : 'text-green-400'}`}>
                  {(parseFloat(manualPrice) || suggestedPrice) < expectedValue 
                    ? "Warning: Price is lower than Expected Value (Loss making)." 
                    : "Price is mathematically profitable for the house."}
                </p>
              )}
              {Math.abs(totalChance - 100) > 0.01 && (
                <p className="text-xs mt-2 font-bold text-red-400">
                  Price: Please adjust the chances - Unable to adjust the price fairly.
                </p>
              )}
            </div>

            <button 
              onClick={handleCreateCase}
              disabled={isSubmitting || selectedItems.length === 0 || Math.abs(totalChance - 100) > 0.01}
              className="w-full mt-4 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none"
            >
              {isSubmitting ? <span className="animate-spin">⌛</span> : <Save size={20} />}
              Create Case
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

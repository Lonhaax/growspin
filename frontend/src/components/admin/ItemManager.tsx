"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Database } from "lucide-react";
import { DLCurrency } from "@/components/ui/DLCurrency";
import { apiFetch } from "@/lib/auth";
import { useCustomModal, CustomModal } from "@/components/ui/CustomModal";

export function getRarityColor(dlValue: number): string {
  if (dlValue < 20) return '#ffffff'; // White
  if (dlValue < 60) return '#22c55e'; // Green
  if (dlValue < 120) return '#3b82f6'; // Blue
  if (dlValue < 700) return '#a855f7'; // Purple
  return '#eab308'; // Gold
}

export default function ItemManager() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemColor, setNewItemColor] = useState("#ffffff");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingWiki, setIsFetchingWiki] = useState(false);

  const { modalConfig, setModalConfig, showAlert, showConfirm, showError, showSuccess } = useCustomModal();

  const fetchFromWiki = async () => {
    if (!newItemName) return;
    setIsFetchingWiki(true);
    
    try {
      const res = await apiFetch("/admin/scrape-sprite", {
        method: "POST",
        body: JSON.stringify({ itemName: newItemName })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomImageUrl(data.imageUrl);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(`Error: ${errData.error || "Could not find image on Wiki automatically."} Please paste the direct URL.`);
      }
    } catch (e: any) {
      showError("Error fetching from Wiki: " + e.message);
    }
    
    setIsFetchingWiki(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiFetch("/admin/items");
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemValue) return showAlert("Please fill all fields");
    
    setIsAdding(true);
    try {
      const res = await apiFetch("/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          value: parseFloat(newItemValue),
          color: newItemColor,
          customImageUrl
        })
      });

      if (res.ok) {
        setNewItemName("");
        setNewItemValue("");
        setCustomImageUrl("");
        fetchItems();
        showSuccess("Item added successfully!");
      } else {
        const data = await res.json();
        showError(data.error || "Failed to add item");
      }
    } catch (e) {
      console.error(e);
      showError("Error adding item");
    }
    setIsAdding(false);
  };

  const executeDelete = async (id: number) => {
    try {
      const res = await apiFetch(`/admin/items/${id}`, { method: "DELETE" });
      if (res.ok) fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = (id: number) => {
    showConfirm(
      "Delete this item? Cases using it will break if you don't remove it from them first.",
      () => executeDelete(id)
    );
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 relative">
      <CustomModal config={modalConfig} setConfig={setModalConfig} />
      
      {/* Add Item Panel */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
          <Database className="text-emerald-500" /> Add New Item
        </h2>
        
        <p className="text-sm text-gray-400 mb-6 font-bold">
          Cloudflare has blocked automated API fetchers, so you must manually paste a direct link to the image. 
          Right-click an image on Discord or Wiki and click "Copy Image Address", then paste it below. The server will download it for you.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Exact Item Name</label>
            <input 
              type="text" 
              placeholder="e.g. Zeus' Lightning Bolt"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
 className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-bold"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Value (DLs)</label>
            <input 
              type="number" 
              placeholder="e.g. 20.5"
              step="0.01"
              min="0"
              value={newItemValue}
              onChange={(e) => {
                setNewItemValue(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setNewItemColor(getRarityColor(val));
              }}
 className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-bold"
            />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-xs font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Rarity Color</label>
            <input 
              type="color" 
              value={newItemColor}
              onChange={(e) => setNewItemColor(e.target.value)}
 className="w-full h-[46px] rounded-xl cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#7a819c] uppercase tracking-wider">Direct Image URL</label>
              <button 
                onClick={fetchFromWiki}
                disabled={isFetchingWiki || !newItemName}
 className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:text-gray-600 uppercase"
              >
                {isFetchingWiki ? "Searching Wiki..." : "Auto-Fetch from Wiki"}
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Paste direct image link (e.g. from Discord or Wiki)"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
 className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-bold"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAddItem}
              disabled={isAdding || !newItemName || !newItemValue || !customImageUrl}
 className="h-[46px] px-8 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none flex items-center gap-2"
            >
              {isAdding ? "Saving..." : <><Plus size={18} /> Add</>}
            </button>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            Items Database ({items.length})
          </h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[#0a0d14] border border-[#202535] rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 font-bold">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-bold border border-dashed border-[#202535] rounded-xl bg-[#0a0d14]">
            No items found in database. Add some above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredItems.map(item => (
              <div key={item.id} className="relative flex flex-col items-center justify-center p-4 rounded-xl border border-[#202535] bg-[#0a0d14] group hover:border-gray-600 transition-colors">
                <button 
                  onClick={() => handleDeleteItem(item.id)}
 className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md opacity-0 group-hover:opacity-100 transition-all z-20"
                >
                  <Trash2 size={12} />
                </button>
                
                <div className="w-12 h-12 mb-3 relative">
                  <div className="absolute inset-0 opacity-20 blur-xl" style={{ backgroundColor: item.color }}></div>
                  <img src={item.imageUrl?.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(item.imageUrl.replace(/^https?:\/\//, ''))}` : item.imageUrl} alt={item.name} className="w-full h-full object-contain relative z-10" style={{ imageRendering: 'pixelated' }} />
                </div>
                <div className="text-[10px] text-gray-300 font-bold text-center leading-tight mb-1">{item.name}</div>
                <div className="text-[10px] font-black" style={{ color: item.color }}>
                  <DLCurrency amount={item.value * 100} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

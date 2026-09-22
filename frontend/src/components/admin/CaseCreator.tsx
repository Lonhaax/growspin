"use client";

import React, { useState, useRef } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { toPng } from "html-to-image";

const PRESET_ITEMS = [
  "Raymans_Fist.png",
  "World_Lock.png",
  "Diamond_Lock.png",
  "Magplant_5000.png",
  "Da_Vinci_Wings.png",
  "Focused_Eyes.png",
  "Growscan_9000.png"
];

const PRESET_BGS = [
  { name: "Ruby Red", gradient: "linear-gradient(135deg, #7f1d1d, #450a0a)" },
  { name: "Diamond Blue", gradient: "linear-gradient(135deg, #1e3a8a, #0f172a)" },
  { name: "Emerald Green", gradient: "linear-gradient(135deg, #064e3b, #022c22)" },
  { name: "Gold Flex", gradient: "linear-gradient(135deg, #854d0e, #422006)" },
  { name: "Obsidian Void", gradient: "linear-gradient(135deg, #171717, #000000)" },
];

export default function CaseCreator() {
  const [caseName, setCaseName] = useState("Mystery Case");
  const [bg, setBg] = useState(PRESET_BGS[0].gradient);
  const [item, setItem] = useState(PRESET_ITEMS[0]);
  const [borderColor, setBorderColor] = useState("#ef4444"); // Red
  const [glowIntensity, setGlowIntensity] = useState(20);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${caseName.replace(/\s+/g, "_").toLowerCase()}_case.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
      alert("Failed to export. Make sure your item images exist in public/items/");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Controls Panel */}
      <div className="bg-[#13161f] border border-[#202535] rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="text-indigo-500" /> Case Studio
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Case Name</label>
            <input 
              type="text" 
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Background Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_BGS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setBg(preset.gradient)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${bg === preset.gradient ? 'border-indigo-500 text-white' : 'border-[#202535] text-[#7a819c] hover:border-gray-600'}`}
                  style={{ background: preset.gradient }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Center Item Sprite</label>
            <select 
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full bg-[#0a0d14] border border-[#202535] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {PRESET_ITEMS.map(i => <option key={i} value={i}>{i.replace(".png", "").replace(/_/g, " ")}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-2">Requires image in <code className="text-indigo-400">/public/items/{item}</code></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Border Color</label>
              <input 
                type="color" 
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-full h-12 rounded-xl cursor-pointer bg-transparent border-0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#7a819c] mb-2 uppercase tracking-wider">Glow Intensity</label>
              <input 
                type="range" 
                min="0" max="50"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                className="w-full h-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0d14] border border-[#202535] rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
        
        {/* The Actual Exportable Box */}
        <div 
          ref={previewRef}
          className="relative w-64 h-64 rounded-2xl flex flex-col items-center justify-center transition-all duration-300"
          style={{
            background: bg,
            border: `3px solid ${borderColor}`,
            boxShadow: `0 0 ${glowIntensity}px ${borderColor}80, inset 0 0 ${glowIntensity}px ${borderColor}40`,
          }}
        >
          {/* Subtle inner pattern */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none rounded-2xl" 
               style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
          </div>
          
          <img 
            src={`/items/${item}`}
            alt={item}
            className="w-32 h-32 object-contain z-10 filter drop-shadow-2xl"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%234f46e5" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
            }}
          />
          
          <div className="absolute bottom-4 left-0 w-full text-center z-10">
            <h3 className="text-white font-black uppercase tracking-widest text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {caseName}
            </h3>
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="mt-12 w-full md:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center gap-3"
        >
          <Download size={20} />
          Export PNG
        </button>
      </div>
    </div>
  );
}

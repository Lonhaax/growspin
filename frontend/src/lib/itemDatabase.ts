export type GTItem = {
  name: string;
  value: number; // in DLs (will be multiplied by 100 for subunits)
  image: string; // filename in public/items/
  color: string;
};

export const GT_ITEMS: GTItem[] = [
  { name: "Dirt", value: 0.01, image: "Dirt.png", color: "#6b4226" },
  { name: "World Lock", value: 0.01, image: "World_Lock.png", color: "#eab308" },
  { name: "Diamond Lock", value: 1, image: "Diamond_Lock.png", color: "#38bdf8" },
  { name: "Blue Gem Lock", value: 100, image: "Blue_Gem_Lock.png", color: "#1d4ed8" },
  { name: "Ruby Lock", value: 10, image: "Ruby_Lock.png", color: "#e11d48" },
  { name: "Royal Lock", value: 2.5, image: "Royal_Lock.png", color: "#f43f5e" },
  
  { name: "Rayman's Fist", value: 400, image: "Raymans_Fist.png", color: "#fbbf24" },
  { name: "Magplant 5000", value: 150, image: "Magplant_5000.png", color: "#22c55e" },
  { name: "Growscan 9000", value: 220, image: "Growscan_9000.png", color: "#3b82f6" },
  
  { name: "Da Vinci Wings", value: 150, image: "Da_Vinci_Wings.png", color: "#a8a29e" },
  { name: "Phoenix Wings", value: 45, image: "Phoenix_Wings.png", color: "#f97316" },
  { name: "Devil Wings", value: 10, image: "Devil_Wings.png", color: "#dc2626" },
  { name: "Angelic Halo", value: 40, image: "Angelic_Halo.png", color: "#fef08a" },
  { name: "Focused Eyes", value: 35, image: "Focused_Eyes.png", color: "#60a5fa" },
  { name: "Ghastly Robe", value: 80, image: "Ghastly_Robe.png", color: "#52525b" },
  
  { name: "Golden Pickaxe", value: 20, image: "Golden_Pickaxe.png", color: "#facc15" },
  { name: "Golden Heart Crystal", value: 65, image: "Golden_Heart_Crystal.png", color: "#fcd34d" },
  { name: "Diamond Diaper", value: 5, image: "Diamond_Diaper.png", color: "#7dd3fc" },
  { name: "Harvester", value: 5, image: "Harvester.png", color: "#10b981" },
  { name: "Sorrow", value: 15, image: "Sorrow.png", color: "#93c5fd" },
  
  { name: "One Ring", value: 25, image: "One_Ring.png", color: "#f59e0b" },
  { name: "Crystal Glaive", value: 30, image: "Crystal_Glaive.png", color: "#c084fc" },
  { name: "Cosmic Cape", value: 280, image: "Cosmic_Cape.png", color: "#a855f7" },
  
  { name: "G-Fusion", value: 1100, image: "G-Fusion.png", color: "#14b8a6" },
  { name: "Legendary Title", value: 3000, image: "Legendary_Title.png", color: "#f59e0b" },
  { name: "Legendary Dragon", value: 400, image: "Legendary_Dragon.png", color: "#ef4444" },
  { name: "Legendary Bot", value: 400, image: "Legendary_Bot.png", color: "#64748b" },
  
  { name: "F Scythe", value: 140, image: "F_Scythe.png", color: "#b91c1c" },
  { name: "Mini You", value: 120, image: "Mini_You.png", color: "#fb923c" },
  { name: "Celestial Dragon", value: 35, image: "Celestial_Dragon.png", color: "#60a5fa" },
  { name: "Riding Cloud", value: 5, image: "Riding_Cloud.png", color: "#f8fafc" },
  { name: "Radiant Doom Staff", value: 110, image: "Radiant_Doom_Staff.png", color: "#c084fc" },
  { name: "Purple Aura", value: 5, image: "Purple_Aura.png", color: "#a855f7" },
];

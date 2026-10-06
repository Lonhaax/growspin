const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const popularItems = [
  // High Tier
  { name: "Blue Gem Lock", value: 10000, color: "#0000FF", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/2752/y-offset/736/window-width/32/window-height/32?format=webp" },
  { name: "Rayman's Fist", value: 5000, color: "#FFA500", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/1664/y-offset/672/window-width/32/window-height/32?format=webp" },
  { name: "Magplant 5000", value: 8000, color: "#00FF00", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/96/y-offset/704/window-width/32/window-height/32?format=webp" },
  { name: "Ghon's Cloak", value: 20000, color: "#FF00FF", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/2912/y-offset/1088/window-width/32/window-height/32?format=webp" },
  { name: "Da Vinci Wings", value: 2500, color: "#C0C0C0", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/1760/y-offset/704/window-width/32/window-height/32?format=webp" },
  { name: "Fame & Fortune", value: 3000, color: "#FFD700", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/1856/y-offset/640/window-width/32/window-height/32?format=webp" },
  
  // Mid Tier
  { name: "Diamond Lock", value: 100, color: "#00FFFF", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/64/y-offset/224/window-width/32/window-height/32?format=webp" },
  { name: "Golden Pickaxe", value: 500, color: "#DAA520", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/160/y-offset/128/window-width/32/window-height/32?format=webp" },
  { name: "Angelic Halo", value: 400, color: "#FFFFFF", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/128/y-offset/160/window-width/32/window-height/32?format=webp" },
  { name: "Devil Wings", value: 200, color: "#FF0000", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/352/y-offset/32/window-width/32/window-height/32?format=webp" },
  { name: "Angel Wings", value: 50, color: "#FFFFFF", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/384/y-offset/32/window-width/32/window-height/32?format=webp" },
  
  // Low Tier
  { name: "World Lock", value: 1, color: "#FFD700", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/3872/y-offset/0/window-width/32/window-height/32?format=webp" },
  { name: "Dirt Seed", value: 1, color: "#8B4513", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/32/y-offset/0/window-width/32/window-height/32?format=webp" },
  { name: "Cave Background", value: 1, color: "#808080", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/64/y-offset/0/window-width/32/window-height/32?format=webp" },
  { name: "Lava", value: 1, color: "#FF4500", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/128/y-offset/0/window-width/32/window-height/32?format=webp" },
  { name: "Wooden Platform", value: 1, color: "#DEB887", imageUrl: "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/512/y-offset/0/window-width/32/window-height/32?format=webp" }
];

async function run() {
  let count = 0;
  for (const item of popularItems) {
    const exists = await prisma.adminItem.findUnique({ where: { name: item.name } });
    if (!exists) {
      await prisma.adminItem.create({ data: item });
      count++;
    }
  }
  console.log(`Injected ${count} new items!`);
}

run().catch(e => console.error(e)).finally(() => prisma.$disconnect());

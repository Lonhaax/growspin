import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DAILY_CASES = [
  {
    type: 'daily_bronze',
    name: 'Bronze Daily Case',
    price: 0,
    items: [
      { name: '10 DLs', value: 1000, color: '#cd7f32', weight: 40 },
      { name: '50 DLs', value: 5000, color: '#cd7f32', weight: 10 },
      { name: '1 BGL', value: 10000, color: '#00ffff', weight: 1 },
      { name: 'Nothing', value: 0, color: '#aaaaaa', weight: 49 },
    ]
  },
  {
    type: 'daily_silver',
    name: 'Silver Daily Case',
    price: 0,
    items: [
      { name: '50 DLs', value: 5000, color: '#c0c0c0', weight: 40 },
      { name: '100 DLs', value: 10000, color: '#c0c0c0', weight: 10 },
      { name: '2 BGL', value: 20000, color: '#00ffff', weight: 1 },
      { name: 'Nothing', value: 0, color: '#aaaaaa', weight: 49 },
    ]
  },
  {
    type: 'daily_gold',
    name: 'Gold Daily Case',
    price: 0,
    items: [
      { name: '100 DLs', value: 10000, color: '#ffd700', weight: 40 },
      { name: '200 DLs', value: 20000, color: '#ffd700', weight: 10 },
      { name: '3 BGL', value: 30000, color: '#00ffff', weight: 1 },
      { name: 'Nothing', value: 0, color: '#aaaaaa', weight: 49 },
    ]
  },
  {
    type: 'daily_platinum',
    name: 'Platinum Daily Case',
    price: 0,
    items: [
      { name: '200 DLs', value: 20000, color: '#e5e4e2', weight: 40 },
      { name: '500 DLs', value: 50000, color: '#e5e4e2', weight: 10 },
      { name: '5 BGL', value: 50000, color: '#00ffff', weight: 1 },
      { name: 'Nothing', value: 0, color: '#aaaaaa', weight: 49 },
    ]
  },
  {
    type: 'daily_diamond',
    name: 'Diamond Daily Case',
    price: 0,
    items: [
      { name: '500 DLs', value: 50000, color: '#b9f2ff', weight: 40 },
      { name: '1 BGL', value: 100000, color: '#00ffff', weight: 10 },
      { name: '10 BGL', value: 1000000, color: '#00ffff', weight: 1 },
      { name: 'Nothing', value: 0, color: '#aaaaaa', weight: 49 },
    ]
  }
];

async function main() {
  for (const c of DAILY_CASES) {
    const existing = await prisma.case.findFirst({ where: { type: c.type } });
    if (!existing) {
      await prisma.case.create({
        data: {
          name: c.name,
          price: c.price,
          type: c.type,
          items: {
            create: c.items.map(i => ({
              name: i.name,
              value: i.value,
              color: i.color,
              weight: i.weight
            }))
          }
        }
      });
      console.log(`Created ${c.type}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

import axios from "axios";

const games = [
  'LuckyCrew', 'RoyalHighRoad', 'BookOfKemet', 'Maneki88Gold', 'FortyFruityMillion',
  'WildChicago', 'EasterHeist', 'GoldRushWithJohnnyCash', 'DigDigDigger',
  'AvalonTheLostKingdom', 'FourLuckyClover', 'BobsCoffeeShop', 'BraveViking',
  'BeastBand', 'BoneBonanza', 'SavageBuffaloSpirit', 'Gemhalla', 'DragonsCrash',
  'DiceMillion', 'AlienFruits', 'LadyWolfMoon', 'MiceAndMagicWonderDice', 'TrampDay', 'MergeUp'
];

async function checkGames() {
  for (const game of games) {
    try {
      const res = await axios.get(`https://bgaming-network.com/play/${encodeURIComponent(game)}/FUN?server=demo`, {
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.data.includes('window.__OPTIONS__')) {
        console.log(`[${game}] FAIL: Missing window.__OPTIONS__`);
      } else {
        console.log(`[${game}] OK`);
      }
    } catch (err: any) {
      console.log(`[${game}] ERROR: ${err.message}`);
    }
  }
}

checkGames();

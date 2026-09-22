import axios from 'axios';

async function run() {
  const demoUrl = `https://bgaming-network.com/play/AlohaKingElvis/FUN?server=demo`;
  const upstreamRes = await axios.get(demoUrl, {
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  const html = upstreamRes.data;
  const lines = html.split('\n');
  console.log("Number of lines:", lines.length);
  
  const optLine = lines.find((l: string) => l.includes('window.__OPTIONS__ = '));
  if (optLine) {
    console.log("Length of optLine:", optLine.length);
  }
}
run();

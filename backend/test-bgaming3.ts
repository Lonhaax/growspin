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
  const optLine = lines.find((l: string) => l.includes('window.__OPTIONS__ = '));
  if (optLine) {
    const rawJson = optLine.trim().replace(/^window\.__OPTIONS__\s*=\s*/, '').replace(/;?$/, '');
    console.log("Raw JSON start:", rawJson.substring(0, 50));
    console.log("Raw JSON end:", rawJson.substring(rawJson.length - 50));
    try {
      JSON.parse(rawJson);
      console.log("Parsed perfectly!");
    } catch (e: any) {
      console.log("Error parsing:", e.message);
    }
  }
}
run();

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
  console.log("HTML length:", html.length);
  
  const startIdx = html.indexOf('window.__OPTIONS__ = ');
  if (startIdx !== -1) {
    const snip = html.substring(startIdx, startIdx + 200);
    console.log("Found snippet:", snip);
  } else {
    console.log("Not found window.__OPTIONS__");
    console.log("Start of HTML:", html.substring(0, 500));
  }
}
run();

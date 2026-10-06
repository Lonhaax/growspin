const axios = require('axios');
async function run() {
    try {
        const title = "Dirt";
        const pageRes = await axios.get(`https://growtopia.fandom.com/en/wiki/${encodeURIComponent(title)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = pageRes.data;
        const cardMatch = html.match(/class="gtw-card"[\s\S]*?class="card-header"[\s\S]*?<img[^>]+src="([^"]+)"/i);
        console.log("Image:", cardMatch ? cardMatch[1] : 'not found');
    } catch(e) { console.log(e.response ? e.response.status : e); }
}
run();

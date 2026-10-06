const axios = require('axios');
async function test(itemName) {
    try {
        const searchRes = await axios.get(`https://growtopia.fandom.com/en/api/v1/SearchSuggestions/List?query=${encodeURIComponent(itemName)}`);
        const items = searchRes.data?.items;
        if (!items || items.length === 0) {
            console.log(`[${itemName}] Not found in Fandom SearchSuggestions`);
            return;
        }
        const title = items[0].title;
        console.log(`[${itemName}] Found title: ${title}`);
        
        const pageRes = await axios.get(`https://growtopia.fandom.com/api.php?action=parse&format=json&page=${encodeURIComponent(title)}&prop=text`);
        const html = pageRes.data?.parse?.text?.['*'] || '';
        
        let imageUrl = '';
        const cardMatch = html.match(/class="[^"]*gtw-card[^"]*"[\s\S]*?class="[^"]*card-header[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
        
        if (cardMatch && cardMatch[1]) {
            imageUrl = cardMatch[1];
        } else {
            const fallbackMatch = html.match(/class="[^"]*infobox[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
            if (fallbackMatch && fallbackMatch[1]) {
                imageUrl = fallbackMatch[1];
            }
        }

        if (!imageUrl) {
            console.log(`[${itemName}] HTML regex failed! HTML sample:`, html.substring(0, 300));
        } else {
            console.log(`[${itemName}] Image URL:`, imageUrl.replace(/&amp;/g, '&'));
        }
    } catch(e) {
        console.error(`[${itemName}] Request failed:`, e.message);
    }
}
async function run() {
    await test("Diamond Lock");
    await test("Dirt");
    await test("World Lock");
    await test("Huge Lock");
    await test("Gem");
}
run();

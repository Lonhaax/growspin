const fetch = require('node-fetch'); // Ensure node-fetch is available, or use native fetch if Node 18+
async function test() {
    const title = 'Blue Gem Lock';
    const res = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`);
    const data = await res.json();
    let imageUrl = null;
    const html = data.parse.text['*'];
    const spriteMatch = html.match(/<div[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is);
    if (spriteMatch && spriteMatch[1]) {
        imageUrl = spriteMatch[1].replace(/&amp;/g, '&').split('/revision')[0];
    } else {
        const imgMatch = html.match(/<img[^>]*src="([^"]+static\.wikia\.nocookie\.net\/growtopia\/images[^"]+)"/i);
        if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1].replace(/&amp;/g, '&').split('/revision')[0];
        } else {
            const pngMatch = html.match(/<img[^>]*src="([^"]+\.png[^"]*)"/i);
            if (pngMatch && pngMatch[1]) {
                imageUrl = pngMatch[1].replace(/&amp;/g, '&').split('/revision')[0];
            }
        }
    }
    console.log("Image URL parsed:", imageUrl);
}
test();

const axios = require('axios');
async function run() {
    const title = "Diamond Lock";
    const pageRes = await axios.get(`https://growtopia.fandom.com/api.php?action=parse&format=json&page=${encodeURIComponent(title)}&prop=text`);
    const html = pageRes.data?.parse?.text?.['*'] || '';
    
    let imageUrl = '';
    
    // Using Regex to find the <div class="gtw-card..."> and extract the image src from card-header
    const cardMatch = html.match(/class="[^"]*gtw-card[^"]*"[\s\S]*?class="[^"]*card-header[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
    
    if (cardMatch && cardMatch[1]) {
      imageUrl = cardMatch[1];
    } else {
      // Fallback: try to find the first infobox image
      const fallbackMatch = html.match(/class="[^"]*infobox[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
      if (fallbackMatch && fallbackMatch[1]) {
        imageUrl = fallbackMatch[1];
      }
    }
    console.log(imageUrl.replace(/&amp;/g, '&'));
}
run();

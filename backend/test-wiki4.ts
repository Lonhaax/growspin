async function testSearch(q: string) {
  const parseRes = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(q)}&prop=text&format=json`);
  const parseData = await parseRes.json();
  const html = parseData?.parse?.text?.['*'] || '';
  
  // Match span OR div, and keep the FULL url (don't strip /revision)
  const spriteMatch = html.match(/<(?:div|span)[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is);
  if (spriteMatch) {
    let url = spriteMatch[1].replace(/&amp;/g, '&');
    // Strip the ?format=webp&fill=cb-... query string, keep the crop path
    url = url.split('?')[0];
    console.log("Final URL:", url);
  }
}
testSearch("Diamond Lock");
testSearch("Wings");
testSearch("World Lock");

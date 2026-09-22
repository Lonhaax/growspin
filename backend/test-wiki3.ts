async function testSearch(q: string) {
  const parseRes = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(q)}&prop=text&format=json`);
  const parseData = await parseRes.json();
  const html = parseData?.parse?.text?.['*'] || '';
  
  // The issue: growsprite is now a <span class="growsprite"> not a <div>
  // Old regex: /<div[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is
  // New structure: <span class="growsprite"><img src="..."/>

  // Try fixing for span
  const spriteMatch = html.match(/<(?:div|span)[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is);
  if (spriteMatch) {
    let url = spriteMatch[1].replace(/&amp;/g, '&');
    console.log("FULL URL:", url);
    console.log("Before /revision:", url.split('/revision')[0]);
  } else {
    console.log("Still no match");
  }
}
testSearch("Diamond Lock");

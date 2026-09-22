async function testSearch(q: string) {
  const searchRes = await fetch(`https://growtopia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json`);
  const searchData = await searchRes.json();
  const titles = searchData.query?.search?.slice(0, 3).map((s: any) => s.title) || [];
  console.log("Titles:", titles);

  for (const title of titles) {
    const parseRes = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`);
    const parseData = await parseRes.json();
    const html = parseData?.parse?.text?.['*'] || '';
    
    const spriteMatch = html.match(/<div[^>]*class="[^"]*growsprite[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is);
    console.log(`  ${title}: growsprite match =`, spriteMatch ? spriteMatch[1].substring(0, 80) : 'NONE');
    
    if (!spriteMatch) {
      const imgMatch = html.match(/<img[^>]*src="([^"]+static\.wikia\.nocookie\.net\/growtopia\/images[^"]+)"/i);
      console.log(`  ${title}: nocookie match =`, imgMatch ? imgMatch[1].substring(0, 80) : 'NONE');
    }
  }
}
testSearch("Diamond Lock");

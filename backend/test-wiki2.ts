async function testSearch(q: string) {
  const titles = [q];

  for (const title of titles) {
    const parseRes = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`);
    const parseData = await parseRes.json();
    const html = parseData?.parse?.text?.['*'] || '';
    
    // Print relevant part of HTML that has the sprite
    const spriteIdx = html.indexOf('growsprite');
    if (spriteIdx !== -1) {
      console.log("Found growsprite at:", spriteIdx);
      console.log("Surrounding HTML:", html.substring(spriteIdx - 20, spriteIdx + 500));
    } else {
      console.log("No growsprite found");
      // Check what image-like things exist
      const allImgs = html.match(/<img[^>]*>/gi) || [];
      console.log("First 5 imgs:");
      allImgs.slice(0, 5).forEach((img: string) => console.log(" ", img.substring(0, 200)));
    }
  }
}
testSearch("Diamond Lock");

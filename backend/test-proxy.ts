async function test() {
  const imageUrl = "https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/512/y-offset/224/window-width/32/window-height/32?format=webp&fill=cb-20260219100732";
  try {
    const fetchResponse = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://growtopia.fandom.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log(fetchResponse.status);
    const ab = await fetchResponse.arrayBuffer();
    console.log("Size:", ab.byteLength);
  } catch (e) {
    console.error(e);
  }
}
test();

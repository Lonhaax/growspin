const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to fandom page for Diamond Lock
  await page.goto('https://growtopia.fandom.com/wiki/Diamond_Lock', { waitUntil: 'domcontentloaded' });
  
  // Find the image element
  const imgElement = await page.$('.pi-image-thumbnail');
  if (imgElement) {
    const src = await imgElement.getAttribute('src');
    console.log("Found SRC:", src);
    
    // Download the image directly in the browser context
    const viewSource = await page.goto(src);
    const buffer = await viewSource.body();
    fs.writeFileSync('/Users/jake/Desktop/gambling/frontend/public/dl.png', buffer);
    console.log("Downloaded dl.png");
  } else {
    console.log("Image not found");
  }

  await browser.close();
})();

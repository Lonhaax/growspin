const gt = require('api-growtopia');
async function test() {
  try {
    const item = await gt.Item.search('Diamond Lock');
    console.log('Search Results:', item);
  } catch(e) { console.error(e); }
}
test();

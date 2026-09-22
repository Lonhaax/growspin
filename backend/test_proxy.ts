import axios from 'axios';
async function test() {
    try {
        const res = await axios.get("https://static.wikia.nocookie.net/growtopia/images/2/22/Item_Diamond_Lock.png/revision/latest", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                "Referer": "https://growtopia.fandom.com/"
            },
            responseType: 'arraybuffer'
        });
        console.log("Success! Status:", res.status);
    } catch(e) {
        console.log("Failed:", e.response?.status);
    }
}
test();

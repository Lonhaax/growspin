import axios from "axios";

axios.get("https://bgaming-network.com/play/TrampDay/FUN?server=demo", {
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
}).then(res => {
    console.log("Status:", res.status);
    console.log("Has options:", res.data.includes('window.__OPTIONS__'));
    if (!res.data.includes('window.__OPTIONS__')) {
        console.log(res.data.substring(0, 500));
    }
}).catch(err => {
    console.error("Error:", err.message);
});

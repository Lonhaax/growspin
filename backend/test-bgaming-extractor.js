"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function run() {
    const demoUrl = `https://bgaming-network.com/play/AlohaKingElvis/FUN?server=demo`;
    const upstreamRes = await axios_1.default.get(demoUrl, {
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });
    const html = upstreamRes.data;
    const startIdx = html.indexOf('window.__OPTIONS__ = ');
    if (startIdx === -1)
        throw new Error("not found");
    const jsonStart = html.indexOf('{', startIdx);
    const scriptEnd = html.indexOf('</script>', jsonStart);
    let rawJson = html.substring(jsonStart, scriptEnd).trim().replace(/;$/, '');
    console.log("Extracted start:", rawJson.substring(0, 50));
    console.log("Extracted end:", rawJson.substring(rawJson.length - 50));
    try {
        JSON.parse(rawJson);
        console.log("Parsed perfectly!");
    }
    catch (e) {
        console.log("Error parsing:", e.message);
    }
}
run();

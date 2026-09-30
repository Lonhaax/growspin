const { ethers } = require('ethers');

// ⚠️ PASTE YOUR 12 WORDS HERE TEMPORARILY
const mnemonic = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";

const target = '0x74F8D2989E771cB03df8e083A005a63eDA3a4390'.toLowerCase();

try {
    const baseNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    console.log(`Scanning derivations for target: ${target}...\n`);
    
    let found = false;
    for(let i = 0; i < 5000; i++) {
        const child = baseNode.derivePath('0/' + i);
        if(child.address.toLowerCase() === target) {
            console.log(`✅ FOUND MATCH AT m/0/${i}`);
            console.log(`PRIVATE KEY: ${child.privateKey}\n`);
            console.log(`-> Open MetaMask > click Account Dropdown > "Add account or hardware wallet" > "Import account" > Paste this Private Key.\n`);
            found = true;
            break;
        }
    }
    
    if (!found) {
        console.log("❌ Not found in the first 5000 derivations. Double check your 12 words.");
    }
    
    console.log("⚠️ IMPORTANT: Delete your 12 words from this file now.");
} catch (e) {
    console.log("Error:", e.message);
}

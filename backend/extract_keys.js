const { ethers } = require('ethers');

// Paste your 12 words here temporarily
const mnemonic = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";

try {
    const rootNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    // Extract XPUB at standard account depth: m/44'/60'/0'
    const accountNode = rootNode.derivePath("m/44'/60'/0'");
    
    console.log("\n✅ SUCCESS! Here is your Ethereum XPUB:");
    console.log("--------------------------------------------------");
    console.log("ETH_XPUB=" + accountNode.neuter().extendedKey);
    console.log("--------------------------------------------------");
    console.log("\n⚠️  IMPORTANT: Delete your 12 words from this file now.");
} catch (e) {
    console.log("Error: Make sure you pasted exactly 12 words separated by single spaces.");
}

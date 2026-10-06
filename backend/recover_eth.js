require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const mnemonic = process.env.MASTER_MNEMONIC;
    if (!mnemonic) return console.log("Missing MASTER_MNEMONIC in .env");

    const provider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
    // The path that fromPhrase defaults to is m/44'/60'/0'/0/0
    const baseNode = ethers.HDNodeWallet.fromPhrase(mnemonic); 
    
    console.log("Scanning non-standard derivation paths for your ETH...\n");
    let found = false;

    for (let userId = 1; userId <= 20; userId++) {
        // This reproduces the exact bugged derivation path
        const child = baseNode.derivePath(`0/${userId}`);
        const balance = await provider.getBalance(child.address);
        
        if (balance > 0n) {
            found = true;
            console.log(`✅ FOUND ETH!`);
            console.log(`Address: ${child.address}`);
            console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`Private Key: ${child.privateKey}`);
            console.log(`-> Open MetaMask > click Account Dropdown > "Add account or hardware wallet" > "Import account" > Paste this Private Key.\n`);
        }
    }

    if (!found) {
        console.log("No ETH found in the first 20 user slots on the bugged path.");
    }
}
main();

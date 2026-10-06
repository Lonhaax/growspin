require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const mnemonic = process.env.MASTER_MNEMONIC;
    const provider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    
    const child = hdNode.derivePath(`0/1`);
    const balance = await provider.getBalance(child.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
}
main();

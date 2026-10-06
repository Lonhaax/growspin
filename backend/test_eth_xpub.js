const { ethers } = require('ethers');
const ethXpub = "xpub6FXScknCixVdwxjYcpBHtaLCYenZ713dyXHZfA71FJHD5bXaZDYfPLRditeo8w4UvmuNkKXDvKayFC8TSvbteMvS1q3eKspYRT4We1C5rmP";
try {
  const hdNode = ethers.HDNodeWallet.fromExtendedKey(ethXpub);
  const child = hdNode.derivePath("0/1");
  console.log("SUCCESS:", child.address);
} catch (e) {
  console.error("ERROR:", e);
}

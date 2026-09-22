import re

with open("src/components/games/MinesGame/MinesGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

# Replace the ProvablyFair init effect
new_pf_init = """
    useEffect(() => {
        setFairnessData({
            serverSeedHash: 'server-seed-hidden',
            clientSeed: 'client-seed-active',
            nonce: 0,
        });
        setClientSeedInput('client-seed-active');
    }, []);
"""
content = re.sub(r'// Initialize ProvablyFair.*?\}, \[\]\);', new_pf_init, content, flags=re.DOTALL)

# Also mock the handleChangeClientSeed and handleRotateSeed
content = re.sub(r'const handleChangeClientSeed = useCallback\(async \(\) => \{.*?\n    \}, \[clientSeedInput\]\);', 'const handleChangeClientSeed = useCallback(async () => {}, [clientSeedInput]);', content, flags=re.DOTALL)
content = re.sub(r'const handleRotateSeed = useCallback\(async \(\) => \{.*?\n    \}, \[\]\);', 'const handleRotateSeed = useCallback(async () => {}, []);', content, flags=re.DOTALL)


# Now patch the handleBet, handleTileClick, and handleCashout logic!
new_handleBet = """
    const handleBet = async () => {
        if (!balance || betAmount > balance) {
            showToast('error', 'Insufficient Balance', `You need DL${betAmount.toFixed(2)}`)
            return
        }
        
        try {
            const res = await apiFetch("/play/mines/start", {
                method: "POST",
                body: JSON.stringify({ amount: betAmount * 100, minesCount: minesCount })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);
            
            if (!placeBet(betAmount)) return;
            
            setIsPlaying(true)
            setRevealedTiles([])
            setMineLocations([])
            setGameOverState(null)
        } catch(err) {
            showToast('error', 'Error', err.message);
        }
    }
"""

new_handleTileClick = """
    const handleTileClick = async (index) => {
        if (!isPlaying || revealedTiles.includes(index) || gameOverState) return;

        try {
            const res = await apiFetch("/play/mines/reveal", {
                method: "POST",
                body: JSON.stringify({ tileIndex: index })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setRevealedTiles(prev => [...prev, index]);
            
            if (data.status === 'loss') {
                setIsPlaying(false);
                setGameOverState('loss');
                setMineLocations(data.mineLocations || []);
            } else if (data.status === 'win') {
                setIsPlaying(false);
                setGameOverState('win');
                setMineLocations(data.mineLocations || []);
            }
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    }
"""

new_handleCashout = """
    const handleCashout = async () => {
        if (!isPlaying || revealedTiles.length === 0) return;
        try {
            const res = await apiFetch("/play/mines/cashout", {
                method: "POST",
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            setIsPlaying(false);
            setGameOverState('win');
            setMineLocations(data.mineLocations || []);
            addWinnings(data.payout / 100);
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    }
"""

content = re.sub(r'const handleBet = \(\) => \{.*?\n    \}(?=\n\n    const handleTileClick)', new_handleBet, content, flags=re.DOTALL)
content = re.sub(r'const handleTileClick = \(index\) => \{.*?\n    \}(?=\n\n    const handleCashout)', new_handleTileClick, content, flags=re.DOTALL)
content = re.sub(r'const handleCashout = \(\) => \{.*?\n    \}(?=\n\n    // Handle Auto mode)', new_handleCashout, content, flags=re.DOTALL)

with open("src/components/games/MinesGame/MinesGame.jsx", "w") as f:
    f.write(content)

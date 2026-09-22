import re

with open("src/components/games/MinesGame/MinesGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

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
            
            setIsPlaying(true)
            setRevealedTiles([])
            setMineLocations([])
            setGameOverState(null)
            
            // Generate empty grid with 25 hidden tiles
            // In Stake, mines are not pre-revealed
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
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    }
"""

content = re.sub(r'const handleBet = \(\) => \{.*?\n    \}(?=\n\n    const handleTileClick)', new_handleBet, content, flags=re.DOTALL)
content = re.sub(r'const handleTileClick = \(index\) => \{.*?\n    \}(?=\n\n    const handleCashout)', new_handleTileClick, content, flags=re.DOTALL)
content = re.sub(r'const handleCashout = \(\) => \{.*?\n    \}(?=\n\n    // Handle Auto mode)', new_handleCashout, content, flags=re.DOTALL)

# Replace Modal without breaking React
# The Modal doesn't have `title="Provably Fair"` in MinesGame, it has `title={`\n`<Space>`
# So let's match `<Modal...className="fairness-modal box-modal-3d"...</Modal>`
content = re.sub(r'<Modal[^>]*className="fairness-modal box-modal-3d".*?</Modal>', '<div></div>', content, flags=re.DOTALL)

with open("src/components/games/MinesGame/MinesGame.jsx", "w") as f:
    f.write(content)

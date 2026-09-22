import re

with open("src/components/games/MinesGame/MinesGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

new_startGame = """    const startGame = async () => {
        if (betAmount <= 0) return;

        try {
            const res = await apiFetch("/play/mines/start", {
                method: "POST",
                body: JSON.stringify({ amount: betAmount * 100, minesCount })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setRevealedTiles([]);
            setMineLocations([]);
            setGameOverState(null);
            setIsPlaying(true);
            showToast('bet', 'Game Started', `DL${betAmount.toFixed(2)} bet placed`);
        } catch (e) {
            showToast('error', 'Error', e.message);
        }
    };"""

new_cashout = """    const cashout = async () => {
        if (!isPlaying || revealedTiles.length === 0) return;
        try {
            const res = await apiFetch("/play/mines/cashout", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Populate all mines on the board based on server response state
            const serverGrid = JSON.parse(data.state.boardState);
            const serverMines = JSON.parse(data.state.mineLocations);
            
            setMineLocations(serverMines);
            
            // Mark unclicked tiles as revealed if we want to show where mines were
            // The clone uses gameOverState to just reveal everything
            setIsPlaying(false);
            setGameOverState('win');

            const profit = (data.profit / 100);
            addWinnings(profit + betAmount); // Refresh user balance

            // Update stats
            setTotalProfit(prev => prev + profit);
            setWinsCount(prev => prev + 1);
            setWinRecords(prev => [...prev, profit]);
            
            showToast('win', 'Cashed Out!', `+DL${profit.toFixed(2)}`, 4000);
            playSound('win');
        } catch (e) {
            showToast('error', 'Error', e.message);
        }
    };"""

new_handleTileClick = """    const handleTileClick = async (index) => {
        if (!isPlaying || revealedTiles.includes(index) || gameOverState) return;

        try {
            const res = await apiFetch("/play/mines/click", {
                method: "POST",
                body: JSON.stringify({ index })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const isMine = data.mine;
            if (isMine) {
                // Hit a mine
                setRevealedTiles(prev => [...prev, index]);
                
                // Show all mines
                const serverMines = JSON.parse(data.state.mineLocations);
                setMineLocations(serverMines);

                setIsPlaying(false);
                setGameOverState('loss');
                
                // Update stats
                setTotalProfit(prev => prev - betAmount);
                setLossesCount(prev => prev + 1);
                setWinRecords(prev => [...prev, -betAmount]);
                
                showToast('loss', 'Boom!', `-DL${betAmount.toFixed(2)}`, 3000);
                playSound('loss');
            } else {
                // Safe
                const newRevealed = [...revealedTiles, index];
                setRevealedTiles(newRevealed);
                playSound('gem');

                // If game was auto-cashed out (found all safe tiles)
                if (data.state.status !== 'playing') {
                    setIsPlaying(false);
                    setGameOverState('win');
                    
                    const profit = (data.profit / 100);
                    addWinnings(profit + betAmount);

                    setTotalProfit(prev => prev + profit);
                    setWinsCount(prev => prev + 1);
                    setWinRecords(prev => [...prev, profit]);
                    
                    showToast('win', 'All Gems Found!', `+DL${profit.toFixed(2)}`, 4000);
                }
            }
        } catch (e) {
            showToast('error', 'Error', e.message);
        }
    };"""

content = re.sub(r'const startGame = async \(\) => \{.*?\n    \};', new_startGame, content, flags=re.DOTALL)
content = re.sub(r'const cashout = \(\) => \{.*?\n    \};', new_cashout, content, flags=re.DOTALL)
content = re.sub(r'const handleTileClick = \(index\) => \{.*?\n    \};', new_handleTileClick, content, flags=re.DOTALL)
content = re.sub(r'const endGame = \(reason\) => \{.*?\n    \};', '', content, flags=re.DOTALL)

with open("src/components/games/MinesGame/MinesGame.jsx", "w") as f:
    f.write(content)

import re

with open("src/components/games/PlinkoGame/dropPlinkoBall.js", "r") as f:
    content = f.read()

content = "import { apiFetch } from '@/lib/auth';\n" + content

new_logic = """
    if (!engine || engine.getActiveBallCount() + pendingDrops.current >= MAX_ACTIVE_BALLS) return 'busy';

    pendingDrops.current++;
    try {
        const res = await apiFetch("/play/plinko", {
            method: "POST",
            body: JSON.stringify({ amount: betAmount * 100, rows: rowCount, risk: 'medium' })
        });
        const fairnessResult = await res.json();
        
        if (!res.ok) {
            console.error(fairnessResult.error);
            return 'insufficient-funds';
        }
        
        if (isCancelled()) return 'cancelled';
        if (engine.getActiveBallCount() >= MAX_ACTIVE_BALLS) return 'busy';
        
        // We do NOT call placeBet(betAmount) locally because the backend deducts the balance.
        // Wait, if we don't, the UI balance won't update immediately until addWinnings or a refresh.
        // It's safer to deduct locally just for UI responsiveness.
        if (!placeBet(betAmount)) return 'insufficient-funds';

        engine.updateBallStyle(currentBall.color, currentBall.image);
        const binIndex = fairnessResult.path.reduce((sum, direction) => sum + direction, 0);
        return engine.dropBall(binIndex, selectedBallType) ? 'dropped' : 'busy';
    } finally {
        pendingDrops.current--;
    }
"""

content = re.sub(r'    if \(!engine.*?    \}$', new_logic, content, flags=re.DOTALL | re.MULTILINE)

with open("src/components/games/PlinkoGame/dropPlinkoBall.js", "w") as f:
    f.write(content)

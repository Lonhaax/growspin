import { apiFetch } from '@/lib/auth';
import { MAX_ACTIVE_BALLS } from './constants';

export async function dropPlinkoBall({
    engine,
    pendingDrops,
    provablyFair,
    rowCount,
    betAmount,
    currentBall,
    selectedBallType,
    placeBet,
    isCancelled = () => false,
}) {

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

        // Visually deduct balance
        placeBet(betAmount);
        engine.updateBallStyle(currentBall.color, currentBall.image);
        const binIndex = fairnessResult.path.reduce((sum, direction) => sum + direction, 0);
        return engine.dropBall(binIndex, selectedBallType) ? 'dropped' : 'busy';
    } finally {
        pendingDrops.current--;
    }

}

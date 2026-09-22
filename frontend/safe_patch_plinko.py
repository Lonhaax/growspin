import re

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import { dropPlinkoBall } from './dropPlinkoBall'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

new_handleBet = """
    const handleBet = async () => {
        if (!balance || betAmount > balance) {
            showToast('error', 'Insufficient Balance', `You need DL${betAmount.toFixed(2)}`)
            return
        }

        try {
            const res = await apiFetch("/play/plinko", {
                method: "POST",
                body: JSON.stringify({ amount: betAmount * 100, rows: rows, risk: risk })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);

            // Trigger visual ball drop
            triggerBallDrop(data.path, data.multiplier)
        } catch(err) {
            showToast('error', 'Error', err.message);
        }
    }
"""

content = re.sub(r'const handleBet = \(\) => \{.*?\n    \}(?=\n\n    // Auto Mode)', new_handleBet, content, flags=re.DOTALL)

# Re-add triggerBallDrop since it wasn't extracted if it wasn't in original?
# Wait, original PlinkoGame has dropPlinkoBall import. The logic for dropPlinkoBall is complex. 
# We should leave dropPlinkoBall import alone, BUT change dropPlinkoBall to just accept the pre-calculated path.

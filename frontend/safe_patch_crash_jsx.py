import re

with open("src/components/games/CrashGame/CrashGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

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
content = re.sub(r'// Provably Fair state.*?\}, \[\]\)', new_pf_init, content, flags=re.DOTALL)

content = re.sub(r'const handleChangeClientSeed = useCallback\(async \(\) => \{.*?\n    \}, \[clientSeedInput\]\)', 'const handleChangeClientSeed = useCallback(async () => {}, [clientSeedInput])', content, flags=re.DOTALL)
content = re.sub(r'const handleRotateSeed = useCallback\(async \(\) => \{.*?\n    \}, \[\]\)', 'const handleRotateSeed = useCallback(async () => {}, [])', content, flags=re.DOTALL)

new_handleBet = """
    const handleBet = async (amount) => {
        if (!balance || amount > balance) {
            showToast('error', 'Insufficient Balance', `You need DL${amount.toFixed(2)}`)
            return
        }
        
        const targetCashout = parseFloat(document.querySelector('.ant-input-number-input')?.value) || 2.0;

        try {
            const res = await apiFetch("/play/crash", {
                method: "POST",
                body: JSON.stringify({ amount: amount * 100, cashoutMultiplier: targetCashout })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);
            
            if (!placeBet(amount)) return;
            
            setBetAmount(amount)
            setBetPlaced(true)
            
            setCrashPoint(data.crashPoint)
            
            setPhase(PHASE.RUNNING)
            startTimeRef.current = Date.now()
        } catch(err) {
            showToast('error', 'Error', err.message);
        }
    }
"""
content = re.sub(r'const handleBet = \(amount\) => \{.*?\n    \}(?=\n\n    // Handle cashout)', new_handleBet, content, flags=re.DOTALL)

content = re.sub(r'// Generate crash point using ProvablyFair.*?\}, \[\]\)', '', content, flags=re.DOTALL)
content = re.sub(r'// Countdown timer.*?\}, \[startCountdown\]\)', '', content, flags=re.DOTALL)

with open("src/components/games/CrashGame/CrashGame.jsx", "w") as f:
    f.write(content)

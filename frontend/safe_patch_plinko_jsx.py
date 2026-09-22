import re

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

# Remove ProvablyFair initialization and waitReady
content = re.sub(r'const provablyFair = useMemo\(\(\) => new ProvablyFair\(\), \[\]\);.*?provablyFair\.waitReady\(\)\.then\(\(\) => setReady\(true\)\);', 'setReady(true);', content, flags=re.DOTALL)

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "w") as f:
    f.write(content)

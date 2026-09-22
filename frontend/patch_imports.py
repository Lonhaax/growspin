import re

with open("src/components/games/MinesGame/MinesGame.jsx", "r") as f:
    content = f.read()

content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")

with open("src/components/games/MinesGame/MinesGame.jsx", "w") as f:
    f.write(content)

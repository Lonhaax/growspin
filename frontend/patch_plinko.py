import re

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "r") as f:
    content = f.read()

content = '"use client";\n' + content
content = content.replace("import { ProvablyFair } from '../../utils/ProvablyFair'", "import { apiFetch } from '@/lib/auth'")
content = content.replace("import { useWallet } from '../../context/WalletContext'", "import { useWallet } from '@/context/WalletContext'")

content = re.sub(r'const \[provablyFair\] = useState\(\(\) => new ProvablyFair\(\)\);', '', content)

content = content.replace("provablyFair.peekPlinkoPath(rowCount).then(res => {", "/* provablyFair.peekPlinkoPath(rowCount).then(res => {")
content = content.replace("setDebugData(res);\n            });", "setDebugData(res);\n            }); */")

content = content.replace("provablyFair,", "")

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "w") as f:
    f.write(content)

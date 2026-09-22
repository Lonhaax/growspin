import re

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "r") as f:
    content = f.read()

content = content.replace("import { ProvablyFair } from '../../utils/ProvablyFair';", "")
content = content.replace("import ProvablyFair from '../../utils/ProvablyFair';", "")

with open("src/components/games/PlinkoGame/PlinkoGame.jsx", "w") as f:
    f.write(content)

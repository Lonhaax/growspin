import re

def clean_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Remove the fairness-related functions
    content = re.sub(r'const handleChangeClientSeed = useCallback\(async \(\) => \{.*?\n    \}, \[.*?\]\)', '', content, flags=re.DOTALL)
    content = re.sub(r'const handleRotateSeed = useCallback\(async \(\) => \{.*?\n    \}, \[\]\)', '', content, flags=re.DOTALL)
    content = re.sub(r'// Handle seed rotation \(reveals current seed\)', '', content, flags=re.DOTALL)
    content = re.sub(r'// Handle client seed change', '', content, flags=re.DOTALL)
    
    # Remove any fairness state if they exist but were missed
    content = re.sub(r'const \[fairnessData.*?\];', '', content, flags=re.DOTALL)
    content = re.sub(r'const \[clientSeedInput.*?\];', '', content, flags=re.DOTALL)
    content = re.sub(r'const \[revealedSeed.*?\];', '', content, flags=re.DOTALL)

    # In MobileBetSheet, matchMedia can throw ReferenceError on SSR
    # We should ensure MobileBetSheet checks typeof window !== 'undefined'
    
    with open(filepath, "w") as f:
        f.write(content)

clean_file("src/components/games/CrashGame/CrashGame.jsx")
clean_file("src/components/games/PlinkoGame/PlinkoGame.jsx")
clean_file("src/components/games/MinesGame/MinesGame.jsx")

# Fix MobileBetSheet for SSR
with open("src/components/games/MobileBetSheet.jsx", "r") as f:
    m = f.read()

m = m.replace("const [isMobileLayout, setIsMobileLayout] = useState(() =>\n        window.matchMedia(MOBILE_QUERY).matches,\n    )", "const [isMobileLayout, setIsMobileLayout] = useState(() => typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false);")

with open("src/components/games/MobileBetSheet.jsx", "w") as f:
    f.write(m)

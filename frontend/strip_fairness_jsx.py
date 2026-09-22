import re
import os

def strip_fairness_jsx(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # We will just remove the entire Fairness Modal block by finding `<Modal title="Provably Fair"` 
    # and removing it up to `</Modal>`
    content = re.sub(r'<Modal\s+title="Provably Fair".*?</Modal>', '', content, flags=re.DOTALL)
    
    with open(file_path, 'w') as f:
        f.write(content)

base_path = "src/components/games/"
strip_fairness_jsx(os.path.join(base_path, "MinesGame/MinesGame.jsx"))
strip_fairness_jsx(os.path.join(base_path, "CrashGame/CrashGame.jsx"))
strip_fairness_jsx(os.path.join(base_path, "PlinkoGame/PlinkoGame.jsx"))

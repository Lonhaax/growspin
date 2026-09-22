import re

with open("index.ts", "r") as f:
    lines = f.readlines()

out_lines = []
skip = False
for i, line in enumerate(lines):
    # This is line 2778: "    }" right before "    session.lastTotalBet = currentTotalBet;"
    if line.strip() == "}" and i+1 < len(lines) and "session.lastTotalBet = currentTotalBet;" in lines[i+1]:
        skip = True
        
    if not skip:
        out_lines.append(line)
        
    if skip and "finalBetAmount = betVal * 100;" in line and i+2 < len(lines) and "}" in lines[i+2]:
        skip = False # we need to skip 2 more lines though, wait I'll just write a better script


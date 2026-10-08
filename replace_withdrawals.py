import sys

with open('frontend/src/app/admin/page.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if '{/* TAB: WITHDRAWALS */}' in line:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if '{/* TAB 2: GLOBAL SETTINGS */}' in lines[i]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx]
    new_lines.append('      {/* TAB: WITHDRAWALS */}\n')
    new_lines.append('      {activeTab === "withdrawals" && (\n')
    new_lines.append('        <WithdrawalsTab />\n')
    new_lines.append('      )}\n\n')
    new_lines.extend(lines[end_idx:])
    
    with open('frontend/src/app/admin/page.tsx', 'w') as f:
        f.writelines(new_lines)
    print("Replaced successfully")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")

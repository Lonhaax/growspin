import sys

with open('frontend/src/app/admin/page.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if '{activeTab === "settings" && (' in line:
        start_idx = i - 1 # include the {/* TAB: SETTINGS */} comment if any, wait, there's no comment
        if "{/* TAB" in lines[i-1] or "{/* Global" in lines[i-1]: 
             pass
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if '{/* TAB: GAMES */}' in lines[i]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx]
    new_lines.append('      {activeTab === "settings" && (\n')
    new_lines.append('        <SettingsTab />\n')
    new_lines.append('      )}\n\n')
    new_lines.extend(lines[end_idx:])
    
    with open('frontend/src/app/admin/page.tsx', 'w') as f:
        f.writelines(new_lines)
    print("Replaced successfully")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")

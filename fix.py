import os

file_path = r"c:\Users\Laksh Rewale\Downloads\lovable-ops-hub-main\frontend\src\components\modals\DailyTrackingDetailModal.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cp1252 mangled UTF-8 characters
replacements = {
    'Γé╣': '₹',
    'ΓÇó': '•',
    'ΓÇô': '–',
    'ΓÇö': '—',
    'ΓÇÖ': '’',
    'ΓÇ£': '“',
    'ΓÇ¥': '”',
    'ΓÇª': '…',
}

for mangled, correct in replacements.items():
    content = content.replace(mangled, correct)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed mangled characters.")

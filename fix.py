with open('frontend/src/components/tabs/InventoryManagementTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("\\'DELETE\\'", "'DELETE'")
with open('frontend/src/components/tabs/InventoryManagementTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

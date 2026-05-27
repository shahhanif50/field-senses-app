import os

directory = 'src'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace exactly
            target = "`http://${window.location.hostname}:8000"
            replacement = "`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}"
            
            if target in content:
                new_content = content.replace(target, replacement)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

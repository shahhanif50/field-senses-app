import os
import re

directory = 'src'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace 'http://localhost:8000...' with `http://${window.location.hostname}:8000...`
            new_content = re.sub(
                r"(?:'|\"|\`)http://(?:localhost|127\.0\.0\.1):8000(.*?)(?:'|\"|\`)",
                r"`http://${window.location.hostname}:8000\1`",
                content
            )
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

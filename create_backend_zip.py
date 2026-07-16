import os
import zipfile

def create_backend_zip(output_filename, backend_dir):
    ignore_dirs = {'.venv', '__pycache__', '.pytest_cache'}
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        if os.path.exists(backend_dir):
            for root, dirs, files in os.walk(backend_dir):
                # Ignore heavy temporary folders
                dirs[:] = [d for d in dirs if d not in ignore_dirs]
                for file in files:
                    file_path = os.path.join(root, file)
                    # Keep the files structured inside a 'backend' folder
                    arcname = os.path.relpath(file_path, os.path.dirname(backend_dir))
                    zipf.write(file_path, arcname)

if __name__ == '__main__':
    project_root = r'c:\Users\Laksh Rewale\Downloads\lovable-ops-hub-main'
    backend_dir = os.path.join(project_root, 'backend')
    output_zip = os.path.join(project_root, 'backend-build.zip')
    
    print(f"Creating clean backend zip at {output_zip}...")
    create_backend_zip(output_zip, backend_dir)
    print("Done!")

import os
import zipfile

def zip_project(output_filename, source_dir):
    ignore_dirs = {'.git', 'node_modules', '.venv', '__pycache__', '.pytest_cache'}
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                if file.endswith('.zip') or file == 'zip_project.py':
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

if __name__ == '__main__':
    project_root = r'c:\Users\Laksh Rewale\Downloads\lovable-ops-hub-main'
    output_zip = os.path.join(project_root, 'field-senses-production-build.zip')
    print(f"Creating zip file at {output_zip}...")
    zip_project(output_zip, project_root)
    print("Done!")

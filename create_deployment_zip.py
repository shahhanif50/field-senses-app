import os
import zipfile

def create_deployment_zip(output_filename, root_dir):
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Add Frontend Dist
        frontend_dist_dir = os.path.join(root_dir, 'frontend', 'dist')
        if os.path.exists(frontend_dist_dir):
            for root, _, files in os.walk(frontend_dist_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    # We want it inside the zip under a 'frontend/' folder
                    arcname = os.path.join('frontend', os.path.relpath(file_path, frontend_dist_dir))
                    zipf.write(file_path, arcname)
                    
        # 2. Add Backend & Database
        backend_dir = os.path.join(root_dir, 'backend')
        ignore_dirs = {'.venv', '__pycache__', '.pytest_cache'}
        if os.path.exists(backend_dir):
            for root, dirs, files in os.walk(backend_dir):
                dirs[:] = [d for d in dirs if d not in ignore_dirs]
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.join('backend', os.path.relpath(file_path, backend_dir))
                    zipf.write(file_path, arcname)

if __name__ == '__main__':
    project_root = r'c:\Users\Laksh Rewale\Downloads\lovable-ops-hub-main'
    output_zip = os.path.join(project_root, 'final-deployment-package.zip')
    print(f"Creating clean deployment zip at {output_zip}...")
    create_deployment_zip(output_zip, project_root)
    print("Done!")

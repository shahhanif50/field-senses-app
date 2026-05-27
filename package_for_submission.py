import os
import zipfile

def zip_project(output_filename="Lovable-Ops-Hub-Submission.zip"):
    print("Packaging Lovable Ops Hub for final submission...")
    
    # Directories to zip
    target_dirs = ["frontend", "backend"]
    # Files to zip
    target_files = ["start.bat", "README.md"]
    
    # Directories to exclude
    exclude_dirs = {"node_modules", ".venv", ".venv-1", "__pycache__", ".git"}
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Zip targeted directories
        for d in target_dirs:
            if not os.path.exists(d):
                continue
            for root, dirs, files in os.walk(d):
                # Modify dirs in-place to skip excluded directories
                dirs[:] = [dir_name for dir_name in dirs if dir_name not in exclude_dirs]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, file_path)
        
        # Zip individual files
        for f in target_files:
            if os.path.exists(f):
                zipf.write(f, f)

    print("=============================================")
    print(f"Success! The project has been zipped into: {output_filename}")
    print("This file is ready for your final submission!")
    print("=============================================")

if __name__ == "__main__":
    zip_project()
    input("Press Enter to exit...")

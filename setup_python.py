"""
Setup script to install required Python packages for bike detection
"""

import subprocess
import sys

def install_requirements():
    """Install all required Python packages"""
    
    packages = [
        'opencv-python',      # OpenCV for image processing
        'ultralytics',        # YOLOv8 and utilities
        'numpy',              # Numerical operations
        'torch',              # PyTorch (required by ultralytics)
        'torchvision'         # Computer vision utilities
    ]
    
    print("=" * 60)
    print("Installing Python Dependencies for Bike Detection")
    print("=" * 60)
    
    for package in packages:
        print(f"\n[*] Installing {package}...")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 
                '--upgrade', package
            ])
            print(f"[✓] {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"[✗] Error installing {package}: {e}")
            return False
    
    print("\n" + "=" * 60)
    print("[✓] All dependencies installed successfully!")
    print("=" * 60)
    print("\nYou can now run the detector:")
    print("  python bike_detection.py")
    print("\nNotes:")
    print("  - First run will download YOLOv8n model (~50MB)")
    print("  - Subsequent runs will use cached model")
    print("  - Press 'Q' or 'ESC' to exit")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    success = install_requirements()
    sys.exit(0 if success else 1)

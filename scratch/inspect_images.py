import os
from PIL import Image

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"
files = ["logo.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "og-image.png"]

for filename in files:
    path = os.path.join(public_dir, filename)
    if os.path.exists(path):
        try:
            with Image.open(path) as img:
                print(f"{filename}: size={img.size}, mode={img.mode}, format={img.format}")
        except Exception as e:
            print(f"Error opening {filename}: {e}")
    else:
        print(f"{filename} does not exist at {path}")

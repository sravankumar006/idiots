import os
import shutil
import numpy as np
from PIL import Image

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"

def backup_file(filename):
    src = os.path.join(public_dir, filename)
    dst = os.path.join(public_dir, filename.replace(".png", "_original.png"))
    if os.path.exists(src) and not os.path.exists(dst):
        shutil.copy2(src, dst)
        print(f"Backed up {filename} to {os.path.basename(dst)}")

def unblend_and_save(filename, bg_color=(26, 25, 21), threshold_low=28, threshold_high=200):
    path = os.path.join(public_dir, filename)
    if not os.path.exists(path):
        print(f"File {filename} does not exist. Skipping.")
        return
        
    backup_file(filename)
    
    with Image.open(path) as img:
        img = img.convert("RGB")
        data = np.array(img, dtype=float)
        
        # Calculate luminance for thresholding
        lum = 0.299 * data[:,:,0] + 0.587 * data[:,:,1] + 0.114 * data[:,:,2]
        
        # Calculate alpha
        alpha = (lum - threshold_low) / (threshold_high - threshold_low)
        alpha = np.clip(alpha, 0.0, 1.0)
        
        # Unblend
        bg = np.array(bg_color, dtype=float)
        unblended = np.zeros_like(data)
        mask = alpha > 0
        alpha_exp = np.expand_dims(alpha, axis=-1)
        unblended[mask] = (data[mask] - (1.0 - alpha_exp[mask]) * bg) / alpha_exp[mask]
        unblended = np.clip(unblended, 0, 255)
        
        # Construct final RGBA image
        rgba = np.zeros((data.shape[0], data.shape[1], 4), dtype=np.uint8)
        rgba[:,:,:3] = unblended.astype(np.uint8)
        rgba[:,:,3] = (alpha * 255).astype(np.uint8)
        
        out_img = Image.fromarray(rgba, "RGBA")
        # Overwrite the original file in the public folder
        out_img.save(path)
        print(f"Successfully processed and overwrote {filename} with transparent version")

files_to_process = ["logo.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
for f in files_to_process:
    unblend_and_save(f)

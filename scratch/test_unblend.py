import os
import numpy as np
from PIL import Image

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"
scratch_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\scratch"
logo_path = os.path.join(public_dir, "logo.png")

def unblend_background(input_path, output_path, bg_color=(26, 25, 21), threshold_low=28, threshold_high=200):
    with Image.open(input_path) as img:
        img = img.convert("RGB")
        data = np.array(img, dtype=float)
        
        # Calculate luminance for thresholding
        # Using standard formula: Y = 0.299R + 0.587G + 0.114B
        lum = 0.299 * data[:,:,0] + 0.587 * data[:,:,1] + 0.114 * data[:,:,2]
        
        # Calculate alpha: 0 at threshold_low, 1 at threshold_high
        alpha = (lum - threshold_low) / (threshold_high - threshold_low)
        alpha = np.clip(alpha, 0.0, 1.0)
        
        # Unblend: P = (1 - alpha) * B + alpha * F => F = (P - (1 - alpha) * B) / alpha
        bg = np.array(bg_color, dtype=float)
        
        # To avoid division by zero, we'll process where alpha > 0
        unblended = np.zeros_like(data)
        mask = alpha > 0
        
        # Reshape alpha for broadcasting
        alpha_exp = np.expand_dims(alpha, axis=-1)
        
        # Apply the unblending formula
        unblended[mask] = (data[mask] - (1.0 - alpha_exp[mask]) * bg) / alpha_exp[mask]
        unblended = np.clip(unblended, 0, 255)
        
        # Construct the final RGBA image
        rgba = np.zeros((data.shape[0], data.shape[1], 4), dtype=np.uint8)
        rgba[:,:,:3] = unblended.astype(np.uint8)
        rgba[:,:,3] = (alpha * 255).astype(np.uint8)
        
        out_img = Image.fromarray(rgba, "RGBA")
        out_img.save(output_path)
        print(f"Unblended V3 saved to {output_path}")

unblend_background(logo_path, os.path.join(scratch_dir, "logo_v3.png"))

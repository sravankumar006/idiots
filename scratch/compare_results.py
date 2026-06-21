import os
import numpy as np
from PIL import Image

scratch_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\scratch"
versions = ["logo_v1.png", "logo_v2.png", "logo_v3.png"]

for filename in versions:
    path = os.path.join(scratch_dir, filename)
    if os.path.exists(path):
        with Image.open(path) as img:
            arr = np.array(img)
            alphas = arr[:,:,3]
            total = alphas.size
            fully_trans = np.sum(alphas == 0)
            fully_opaq = np.sum(alphas == 255)
            semi_trans = total - fully_trans - fully_opaq
            
            # Print stats
            print(f"{filename}:")
            print(f"  Fully transparent: {fully_trans} ({fully_trans/total*100:.2f}%)")
            print(f"  Fully opaque: {fully_opaq} ({fully_opaq/total*100:.2f}%)")
            print(f"  Semi-transparent (anti-aliased edges): {semi_trans} ({semi_trans/total*100:.2f}%)")
            
            # Check edge colors (pixels with 0 < alpha < 255)
            if semi_trans > 0:
                edge_pixels = arr[alphas > 0]
                edge_alphas = alphas[alphas > 0]
                # Print average RGB of semi-transparent pixels
                avg_rgb = np.mean(edge_pixels[:, :3], axis=0)
                print(f"  Avg RGB of non-transparent: ({avg_rgb[0]:.1f}, {avg_rgb[1]:.1f}, {avg_rgb[2]:.1f})")
    else:
        print(f"{filename} does not exist")

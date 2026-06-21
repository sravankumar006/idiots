import os
from PIL import Image

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"
path = os.path.join(public_dir, "logo.png")

with Image.open(path) as img:
    pixels = list(img.getdata())
    
    # Analyze pixels that are bright (not background)
    bright_pixels = [p for p in pixels if sum(p) > 300] # threshold for brightness
    print(f"Total bright pixels: {len(bright_pixels)}")
    
    # Check max and min channel values for bright pixels to see color variance
    r_vals = [p[0] for p in bright_pixels]
    g_vals = [p[1] for p in bright_pixels]
    b_vals = [p[2] for p in bright_pixels]
    
    if bright_pixels:
        print(f"R range: {min(r_vals)} - {max(r_vals)}")
        print(f"G range: {min(g_vals)} - {max(g_vals)}")
        print(f"B range: {min(b_vals)} - {max(b_vals)}")
        
        # Check standard deviation or distance to average cream color
        avg_r = sum(r_vals)/len(bright_pixels)
        avg_g = sum(g_vals)/len(bright_pixels)
        avg_b = sum(b_vals)/len(bright_pixels)
        print(f"Average foreground color: ({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f})")
        
        # Count pixels that deviate significantly from average color ratio
        deviants = 0
        for r, g, b in bright_pixels:
            # Check if ratio is different from the average cream (approx 1.13 : 1.08 : 1.0)
            # Or check absolute color differences
            if abs(r - avg_r) > 20 or abs(g - avg_g) > 20 or abs(b - avg_b) > 20:
                deviants += 1
        print(f"Pixels deviating from average by >20: {deviants} ({deviants/len(bright_pixels)*100:.2f}%)")

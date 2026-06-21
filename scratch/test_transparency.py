import os
from PIL import Image

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"
scratch_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\scratch"
logo_path = os.path.join(public_dir, "logo.png")

def make_transparent_v1(input_path, output_path):
    # Method 1: Keep original RGB, interpolate alpha based on luminance
    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        pixels = list(img.getdata())
        new_pixels = []
        for r, g, b, a in pixels:
            # Calculate luminance
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            threshold_low = 35
            threshold_high = 100
            
            if lum <= threshold_low:
                new_pixels.append((0, 0, 0, 0))
            elif lum >= threshold_high:
                new_pixels.append((r, g, b, 255))
            else:
                alpha = int(255 * (lum - threshold_low) / (threshold_high - threshold_low))
                new_pixels.append((r, g, b, alpha))
        img.putdata(new_pixels)
        img.save(output_path)
        print(f"V1 saved to {output_path}")

def make_transparent_v2(input_path, output_path):
    # Method 2: Set RGB to cream (209, 200, 185) for all pixels, and interpolate alpha
    # This prevents dark halos when rendered on light backgrounds
    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        pixels = list(img.getdata())
        new_pixels = []
        for r, g, b, a in pixels:
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            threshold_low = 35
            threshold_high = 100
            
            if lum <= threshold_low:
                new_pixels.append((0, 0, 0, 0))
            elif lum >= threshold_high:
                new_pixels.append((209, 200, 185, 255))
            else:
                alpha = int(255 * (lum - threshold_low) / (threshold_high - threshold_low))
                new_pixels.append((209, 200, 185, alpha))
        img.putdata(new_pixels)
        img.save(output_path)
        print(f"V2 saved to {output_path}")

make_transparent_v1(logo_path, os.path.join(scratch_dir, "logo_v1.png"))
make_transparent_v2(logo_path, os.path.join(scratch_dir, "logo_v2.png"))

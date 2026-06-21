import os
from collections import Counter
from PIL import Image
import numpy as np

public_dir = r"c:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\public"
path = os.path.join(public_dir, "logo.png")

with Image.open(path) as img:
    # Convert image to numpy array to avoid getdata() deprecation warning
    arr = np.array(img)
    # Reshape array to a list of pixel tuples
    pixels = [tuple(int(x) for x in p) for p in arr.reshape(-1, arr.shape[-1])]
    counter = Counter(pixels)

    print("Most common colors:")
    for color, count in counter.most_common(15):
        print(f"Color: {color}, Count: {count} ({count/len(pixels)*100:.2f}%)")


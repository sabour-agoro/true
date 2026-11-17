from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
h, w, _ = a.shape
print("size", w, h)
# probes: wall corners, lit wall, neck, chest, arm, hip, stand, rose
pts = [
    ("wall-tl", 20, 20),
    ("wall-tr", w - 30, 40),
    ("wall-lit", 40, 450),
    ("wall-midL", 80, 500),
    ("neck", 400, 140),
    ("chest", 400, 280),
    ("armL", 220, 400),
    ("armR", 520, 450),
    ("waist", 380, 620),
    ("hip", 360, 780),
    ("gap", 400, 860),
    ("stand", 380, 1000),
    ("rose", 680, 980),
    ("shadow-chest", 320, 160),
]
for name, x, y in pts:
    p = a[y, x]
    print(f"{name:14} {x:4} {y:4} rgb {int(p[0]):3} {int(p[1]):3} {int(p[2]):3} lum {int(p.mean()):3} rb {int(p[0]-p[2]):3}")

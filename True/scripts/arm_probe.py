from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
lum = a.mean(axis=2)
rb = a[:, :, 0] - a[:, :, 2]
for y in (280, 360, 440, 520, 600, 680):
    parts = []
    for x in range(150, 340, 12):
        parts.append(f"{x}:{int(lum[y,x])}/{int(rb[y,x])}")
    print("y", y, " ".join(parts))
print("--- right shoulder ---")
for y in (240, 300, 360):
    parts = []
    for x in range(460, 620, 12):
        parts.append(f"{x}:{int(lum[y,x])}/{int(rb[y,x])}")
    print("y", y, " ".join(parts))

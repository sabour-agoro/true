from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
h, w, _ = a.shape
lum = a.mean(axis=2)
rb = a[:, :, 0] - a[:, :, 2]
for y in (100, 160, 220, 300, 380, 460, 540, 620, 700, 780, 860, 940, 1020):
    row = (lum[y] > 168) & (rb[y] < 26)
    xs = np.where(row)[0]
    if len(xs) == 0:
        print(y, "none")
        continue
    # runs
    runs = []
    start = xs[0]
    prev = xs[0]
    for x in xs[1:]:
        if x > prev + 8:
            runs.append((int(start), int(prev)))
            start = x
        prev = x
    runs.append((int(start), int(prev)))
    print(y, runs)

from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
lum = a.mean(axis=2)
rb = a[:, :, 0] - a[:, :, 2]
for y in (100, 160, 220, 300, 380, 460, 540, 620, 700, 780, 860, 940, 1020):
    row = (lum[y] > 128) & (rb[y] < 24) & (np.arange(a.shape[1]) > 140) & (np.arange(a.shape[1]) < 640)
    xs = np.where(row)[0]
    if len(xs) == 0:
        print(y, "none")
        continue
    runs = []
    start = prev = int(xs[0])
    for x in xs[1:]:
        x = int(x)
        if x > prev + 12:
            runs.append((start, prev))
            start = x
        prev = x
    runs.append((start, prev))
    print(y, runs)

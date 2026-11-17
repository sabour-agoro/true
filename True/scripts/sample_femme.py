from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
im = Image.open(path).convert("RGB")
a = np.asarray(im)
h, w, _ = a.shape
lines = [f"size {w} {h}"]
for y in range(0, h, 80):
    row = []
    for x in range(0, w, 80):
        p = a[y, x]
        lum = int(p.mean())
        row.append(f"{lum:3d}")
    lines.append(f"y{y:4d} " + " ".join(row))
Path(r"C:\Users\DELL\Desktop\True\scripts\femme-grid.txt").write_text("\n".join(lines), encoding="utf-8")
print("ok", w, h)

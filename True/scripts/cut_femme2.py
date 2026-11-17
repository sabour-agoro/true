from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
rgb = np.asarray(Image.open(src).convert("RGB"))
crop = rgb[30:980, 150:640]
lum = crop.mean(axis=2)
mask = Image.fromarray(np.where(lum > 198, 255, 0).astype(np.uint8))
for _ in range(4):
    mask = mask.filter(ImageFilter.MaxFilter(7))
for _ in range(4):
    mask = mask.filter(ImageFilter.MinFilter(7))
m = np.asarray(mask) > 0
h, w = m.shape
seen = np.zeros_like(m, dtype=bool)
best = []
points = np.column_stack(np.where(m))
from collections import deque
for y0, x0 in points[::6]:
    y0, x0 = int(y0), int(x0)
    if seen[y0, x0]:
        continue
    q = deque([(y0, x0)])
    seen[y0, x0] = True
    comp = [(y0, x0)]
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if ny < 0 or nx < 0 or ny >= h or nx >= w or seen[ny, nx] or not m[ny, nx]:
                continue
            seen[ny, nx] = True
            q.append((ny, nx))
            comp.append((ny, nx))
    if len(comp) > len(best):
        best = comp
alpha = np.zeros((h, w), dtype=np.uint8)
for y, x in best:
    alpha[y, x] = 255
ys, xs = np.where(alpha > 0)
print("box", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), "n", len(best), "crop", w, h)
rgba = np.dstack([crop, alpha])
Image.fromarray(rgba, "RGBA").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))

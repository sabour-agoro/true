from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

src = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
rgb = np.asarray(Image.open(src).convert("RGB"))
a = rgb.astype(np.int16)
h, w, _ = a.shape
lum = a.mean(axis=2)
rb = a[:, :, 0] - a[:, :, 2]
xs = np.arange(w)[None, :]
core = (lum > 172) & (rb < 26) & (xs > 175) & (xs < 585) & (np.arange(h)[:, None] > 40) & (np.arange(h)[:, None] < 990)
# grow a little into adjacent shadow that is still cool
near = Image.fromarray(np.where(core, 255, 0).astype(np.uint8))
for _ in range(6):
    near = near.filter(ImageFilter.MaxFilter(5))
near_np = np.asarray(near) > 0
grow = near_np & (lum > 122) & (rb < 25) & (xs > 165) & (xs < 590)
m = grow
seen = np.zeros_like(m, dtype=bool)
best = []
points = np.column_stack(np.where(m))
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
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and m[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
                comp.append((ny, nx))
    if len(comp) > len(best):
        best = comp
alpha = np.zeros((h, w), dtype=np.uint8)
for y, x in best:
    alpha[y, x] = 255
# close small holes inside the silhouette
closed = Image.fromarray(alpha).filter(ImageFilter.MaxFilter(9))
for _ in range(2):
    closed = closed.filter(ImageFilter.MaxFilter(7))
for _ in range(3):
    closed = closed.filter(ImageFilter.MinFilter(7))
alpha = np.asarray(closed)
# keep only outside-reachable background as transparent
inv = alpha == 0
bg = np.zeros((h, w), dtype=bool)
stack = [(0, 0)]
bg[0, 0] = True
while stack:
    y, x = stack.pop()
    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= ny < h and 0 <= nx < w and inv[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True
            stack.append((ny, nx))
alpha = np.where(bg, 0, 255).astype(np.uint8)
# soft edge
soft = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
alpha = np.asarray(soft)
ys, xs2 = np.where(alpha > 20)
print("box", int(xs2.min()), int(ys.min()), int(xs2.max()), int(ys.max()), "px", int((alpha > 20).sum()))
rgba = np.dstack([rgb, alpha])
Image.fromarray(rgba, "RGBA").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))
flat = np.zeros_like(rgb)
flat[alpha > 20] = rgb[alpha > 20]
Image.fromarray(flat, "RGB").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme-preview.jpg"), quality=88)
print("saved")

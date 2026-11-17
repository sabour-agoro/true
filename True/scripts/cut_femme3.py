from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
rgb = np.asarray(Image.open(src).convert("RGB"))
crop = rgb[20:1000, 140:650].astype(np.int16)
lum = crop.mean(axis=2)
neutral = np.abs(crop[:, :, 0] - crop[:, :, 2]) < 18
mask_np = (lum > 206) & neutral
mask = Image.fromarray(np.where(mask_np, 255, 0).astype(np.uint8))
for _ in range(5):
    mask = mask.filter(ImageFilter.MaxFilter(5))
for _ in range(5):
    mask = mask.filter(ImageFilter.MinFilter(5))
m = np.asarray(mask) > 0
h, w = m.shape
seen = np.zeros_like(m, dtype=bool)
best = []
points = np.column_stack(np.where(m))
from collections import deque
for y0, x0 in points[::8]:
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
# fill holes
inv = Image.fromarray(np.where(alpha == 0, 255, 0).astype(np.uint8))
bg = np.zeros_like(alpha, dtype=bool)
stack = [(0, 0)]
bg[0, 0] = True
arr = np.asarray(inv) > 0
while stack:
    y, x = stack.pop()
    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= ny < h and 0 <= nx < w and arr[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True
            stack.append((ny, nx))
alpha = np.where(bg, 0, 255).astype(np.uint8)
ys, xs = np.where(alpha > 0)
print("box", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), "of", w, h)
flat = np.zeros((h, w, 3), dtype=np.uint8)
flat[alpha > 0] = crop[alpha > 0]
Image.fromarray(np.dstack([crop.astype(np.uint8), alpha]), "RGBA").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))
Image.fromarray(flat, "RGB").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme-preview.jpg"), quality=85)

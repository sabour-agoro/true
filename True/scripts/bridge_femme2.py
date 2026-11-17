from pathlib import Path
import numpy as np
from PIL import Image

path = Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png")
im = Image.open(path).convert("RGBA")
a = np.asarray(im).copy()
h, w, _ = a.shape
alpha = a[:, :, 3]
edges = []
for y in range(h):
    xs = np.where(alpha[y] > 40)[0]
    if len(xs) < 6:
        edges.append(None)
        continue
    runs = []
    start = prev = int(xs[0])
    for x in xs[1:]:
        x = int(x)
        if x > prev + 3:
            runs.append((start, prev))
            start = x
        prev = x
    runs.append((start, prev))
    left = next((r for r in runs if (r[0] + r[1]) / 2 < w * 0.38 and r[1] - r[0] > 6), None)
    torso = next((r for r in runs if r[0] > (left[1] if left else 0) and (r[0] + r[1]) / 2 > w * 0.35), None)
    if not left or not torso:
        edges.append(None)
        continue
    gap = torso[0] - left[1]
    if gap < 3 or gap > 80:
        edges.append(None)
        continue
    edges.append((left[1], torso[0]))

# fill only rows that have a real gap, using the torso colour a few pixels in
filled = 0
for y, edge in enumerate(edges):
    if edge is None:
        continue
    x0, x1 = edge
    sample_x = min(w - 1, x1 + 8)
    if alpha[y, sample_x] < 40:
        sample_x = x1
    color = a[y, sample_x, :3]
    a[y, x0:x1, :3] = color
    a[y, x0:x1, 3] = 255
    filled += x1 - x0
print("filled px", filled, "rows", sum(e is not None for e in edges))
Image.fromarray(a, "RGBA").save(path)
flat = np.zeros((h, w, 3), dtype=np.uint8)
mask = a[:, :, 3] > 16
flat[mask] = a[mask][:, :3]
Image.fromarray(flat, "RGB").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme-check.jpg"), quality=88)

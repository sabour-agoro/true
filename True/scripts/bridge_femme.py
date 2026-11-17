from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

path = Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png")
im = Image.open(path).convert("RGBA")
a = np.asarray(im).copy()
h, w, _ = a.shape
alpha = a[:, :, 3]
# Bridge the shadow gap between the left arm and the torso.
for y in range(int(h * 0.28), int(h * 0.78)):
    xs = np.where(alpha[y] > 40)[0]
    if len(xs) < 8:
        continue
    runs = []
    start = prev = int(xs[0])
    for x in xs[1:]:
        x = int(x)
        if x > prev + 4:
            runs.append((start, prev))
            start = x
        prev = x
    runs.append((start, prev))
    if len(runs) < 2:
        continue
    left, right = runs[0], runs[1]
    gap = right[0] - left[1]
    if gap < 4 or gap > 70:
        continue
    if left[1] > w * 0.45:
        continue
    c0 = a[y, left[1], :3].astype(np.float32)
    c1 = a[y, right[0], :3].astype(np.float32)
    for i, x in enumerate(range(left[1] + 1, right[0])):
        t = (i + 1) / (gap + 1)
        a[y, x, :3] = (c0 * (1 - t) + c1 * t).astype(np.uint8)
        a[y, x, 3] = 255
# soften only the newly filled edge a touch
out = Image.fromarray(a, "RGBA")
out.save(path)
flat = np.zeros((h, w, 3), dtype=np.uint8)
mask = a[:, :, 3] > 16
flat[mask] = a[mask][:, :3]
Image.fromarray(flat, "RGB").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme-preview.jpg"), quality=88)
print("bridged", w, h)

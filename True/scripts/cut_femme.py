from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src = Path(r"C:\Users\DELL\Documents\Downloads") / "عارضة ازياء لعابة.jfif"
rgb = np.asarray(Image.open(src).convert("RGB"))
lum = rgb.mean(axis=2)
mask = Image.fromarray(np.where(lum > 168, 255, 0).astype(np.uint8))
for _ in range(3):
    mask = mask.filter(ImageFilter.MaxFilter(5))
for _ in range(3):
    mask = mask.filter(ImageFilter.MinFilter(5))
m = np.asarray(mask) > 0

h, w = m.shape
seen = np.zeros_like(m, dtype=bool)
best = []
points = np.column_stack(np.where(m))
from collections import deque
for y, x in points[::5]:
    y = int(y)
    x = int(x)
    if seen[y, x] or not m[y, x]:
        continue
    q = deque([(y, x)])
    seen[y, x] = True
    comp = [(y, x)]
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
# restore a slightly tighter edge by intersecting with a softer brightness
ys2, xs2 = np.where(alpha > 0)
print("femme box", int(xs2.min()), int(ys2.min()), int(xs2.max()), int(ys2.max()), "count", len(best))
rgba = np.dstack([rgb, alpha])
Image.fromarray(rgba, "RGBA").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))

def profile(path):
    im = np.asarray(Image.open(path))
    alpha = im[:, :, 3]
    h, w = alpha.shape
    ys, xs = np.where(alpha > 0)
    top, bot = int(ys.min()), int(ys.max())
    span = max(1, bot - top)
    print(path.name, w, h, "body", int(xs.min()), top, int(xs.max()), bot)
    for frac in (0.08, 0.16, 0.24, 0.32, 0.42, 0.52, 0.62):
        y = min(h - 1, top + int(span * frac))
        row = alpha[y] > 0
        # components
        gaps = np.where(np.diff(np.concatenate([[0], row.view(np.uint8), [0]])))[0]
        parts = []
        for i in range(0, len(gaps), 2):
            a, b = int(gaps[i]), int(gaps[i + 1])
            parts.append((b - a, a, b))
        parts.sort(reverse=True)
        mid = [p for p in parts if p[1] <= w // 2 <= p[2]]
        center = mid[0] if mid else parts[0]
        print(" ", frac, "y", y, "center", center[0], center[1], center[2], "parts", len(parts))

profile(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\homme.png"))
profile(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))

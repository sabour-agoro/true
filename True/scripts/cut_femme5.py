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
ys = np.arange(h)[:, None]
xs = np.arange(w)[None, :]
core = (lum > 172) & (rb < 26) & (xs > 175) & (xs < 580) & (ys > 40) & (ys < 990)
near = Image.fromarray(np.where(core, 255, 0).astype(np.uint8))
for _ in range(4):
    near = near.filter(ImageFilter.MaxFilter(5))
near_np = np.asarray(near) > 0
grow = near_np & (lum > 150) & (rb < 25) & (xs > 170) & (xs < 575)
# left arm is a cool strip separated from the torso by a warm shadow
left_arm = (xs > 186) & (xs < 248) & (ys > 250) & (ys < 640) & (lum > 118) & (rb < 28)
m = grow | left_arm
seen = np.zeros_like(m, dtype=bool)
best = []
points = np.column_stack(np.where(m))
for y0, x0 in points[::5]:
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
closed = Image.fromarray(alpha)
for _ in range(3):
    closed = closed.filter(ImageFilter.MaxFilter(5))
for _ in range(3):
    closed = closed.filter(ImageFilter.MinFilter(5))
alpha = np.asarray(closed)
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
alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.7)))
# crop to the figure
ys2, xs2 = np.where(alpha > 16)
pad = 12
x0, y0 = max(0, int(xs2.min()) - pad), max(0, int(ys2.min()) - pad)
x1, y1 = min(w, int(xs2.max()) + pad + 1), min(h, int(ys2.max()) + pad + 1)
crop_rgb = rgb[y0:y1, x0:x1]
crop_a = alpha[y0:y1, x0:x1]
print("crop", x0, y0, x1, y1, "size", x1 - x0, y1 - y0)
Image.fromarray(np.dstack([crop_rgb, crop_a]), "RGBA").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme.png"))
flat = np.zeros_like(crop_rgb)
flat[crop_a > 16] = crop_rgb[crop_a > 16]
Image.fromarray(flat, "RGB").save(Path(r"C:\Users\DELL\Desktop\True\public\mannequin\femme-preview.jpg"), quality=88)

from pathlib import Path
from PIL import Image
import numpy as np

downloads = Path(r"C:\Users\DELL\Documents\Downloads")
homme_path = downloads / "Torse d'homme à tête d'œuf en plastique - Blanc lustré.jfif"
femme_path = downloads / "عارضة ازياء لعابة.jfif"
out = Path(r"C:\Users\DELL\Desktop\True\public\mannequin")
out.mkdir(parents=True, exist_ok=True)

def stats(label, path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im)
    print(label, im.size, "corner", a[2, 2].tolist(), "center", a[a.shape[0] // 2, a.shape[1] // 2].tolist())
    return im, a

homme, ha = stats("homme", homme_path)
femme, fa = stats("femme", femme_path)

def flood_background(rgb, tolerance):
    h, w, _ = rgb.shape
    bg = np.zeros((h, w), dtype=bool)
    seed = rgb[0, 0].astype(np.int16)
    stack = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    bg[0, 0] = bg[0, w - 1] = bg[h - 1, 0] = bg[h - 1, w - 1] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if ny < 0 or nx < 0 or ny >= h or nx >= w or bg[ny, nx]:
                continue
            pixel = rgb[ny, nx].astype(np.int16)
            if np.abs(pixel - seed).sum() <= tolerance:
                bg[ny, nx] = True
                stack.append((ny, nx))
    return bg

def save_cutout(label, rgb, tolerance):
    bg = flood_background(rgb, tolerance)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    ys, xs = np.where(alpha > 0)
    print(label, "opaque", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), "of", rgb.shape[1], rgb.shape[0])
    # width profile to find shoulders
    top, bot = int(ys.min()), int(ys.max())
    span = bot - top
    for frac in (0.12, 0.18, 0.28, 0.4, 0.55, 0.7):
        y = top + int(span * frac)
        row = np.where(alpha[y] > 0)[0]
        if len(row):
            print(" ", frac, "width", int(row.max() - row.min()), "x", int(row.min()), int(row.max()), "y", y)
    rgba = np.dstack([rgb, alpha])
    im = Image.fromarray(rgba, "RGBA")
    dest = out / f"{label}.png"
    im.save(dest)
    print("wrote", dest)

save_cutout("homme", ha, 18)
save_cutout("femme", fa, 55)

products = Path(r"C:\Users\DELL\Desktop\True\public\products")
for png in sorted(products.glob("*.png")):
    if "detail" in png.name:
        continue
    im = Image.open(png).convert("RGBA")
    arr = np.asarray(im)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        continue
    print(
        png.name,
        im.size,
        "content",
        int(xs.min()),
        int(ys.min()),
        int(xs.max()),
        int(ys.max()),
        "frac",
        round(xs.min() / im.width, 3),
        round(ys.min() / im.height, 3),
        round((xs.max() - xs.min()) / im.width, 3),
        round((ys.max() - ys.min()) / im.height, 3),
    )

from pathlib import Path
import numpy as np
from PIL import Image

root = Path(r"C:\Users\DELL\Desktop\True\public")
print("GARMENTS")
for p in sorted((root / "products").glob("*.png")):
    im = Image.open(p)
    a = np.asarray(im)
    if a.ndim == 3 and a.shape[2] == 4:
        ys, xs = np.where(a[:, :, 3] > 20)
        print(p.name, im.size, "alpha", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), "aspect", round((xs.max()-xs.min()) / max(1, (ys.max()-ys.min())), 3))
    else:
        print(p.name, im.size)

def profile(name, path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)
    h, w, _ = a.shape
    alpha = a[:, :, 3] > 20
    print("\n", name, w, h)
    for frac in (0.06, 0.12, 0.18, 0.24, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92):
        y = min(h - 1, int(h * frac))
        xs = np.where(alpha[y])[0]
        if len(xs) == 0:
            print(f"  {frac:.2f} y{y} empty")
            continue
        # parts
        runs = []
        start = prev = int(xs[0])
        for x in xs[1:]:
            x = int(x)
            if x > prev + 6:
                runs.append((start, prev))
                start = x
            prev = x
        runs.append((start, prev))
        main = max(runs, key=lambda r: r[1] - r[0])
        print(f"  {frac:.2f} y{y:4d} span {int(xs.min())}-{int(xs.max())} w {int(xs.max()-xs.min())} main {main[0]}-{main[1]} parts {len(runs)}")

profile("homme", root / "mannequin" / "homme.png")
profile("femme", root / "mannequin" / "femme.png")

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(r"C:\Users\DELL\AppData\Roaming\Cursor\User\workspaceStorage\cc68f0ac5705414a8594a81d97540b7f\images")
OUT = Path(r"C:\Users\DELL\Desktop\True\public\products")


def convex_hull(points: np.ndarray) -> list[tuple[int, int]]:
    pts = sorted({(int(x), int(y)) for x, y in points})
    if len(pts) <= 2:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list[tuple[int, int]] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list[tuple[int, int]] = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def hull_cut(path: Path, threshold: int = 28) -> Image.Image:
    image = Image.open(path).convert("RGB")
    rgb = np.array(image).astype(np.int16)
    height, width = rgb.shape[:2]
    border = np.concatenate([rgb[2], rgb[-3], rgb[:, 2], rgb[:, -3]], axis=0)
    background = np.median(border, axis=0)
    distance = np.max(np.abs(rgb - background), axis=2)
    ys, xs = np.where(distance > threshold)
    step = max(1, len(xs) // 4000)
    hull = convex_hull(np.column_stack([xs[::step], ys[::step]]))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).polygon(hull, fill=255)
    inside = np.array(mask) > 0
    removable = inside & (distance <= 16)
    seen = ~inside
    stack: list[tuple[int, int, int]] = []
    ys_b, xs_b = np.where(seen)
    # Seed only the boundary of the hull, not every outside pixel.
    edge = inside & ~np.pad(inside, 1, constant_values=False)[1:-1, 1:-1]
    # cheaper edge: pixels inside whose neighbor is outside
    edge = np.zeros_like(inside)
    edge[1:] |= inside[1:] & ~inside[:-1]
    edge[:-1] |= inside[:-1] & ~inside[1:]
    edge[:, 1:] |= inside[:, 1:] & ~inside[:, :-1]
    edge[:, :-1] |= inside[:, :-1] & ~inside[:, 1:]
    ey, ex = np.where(edge & removable)
    stack = [(int(y), int(x), 0) for y, x in zip(ey[::2], ex[::2])]
    removed = np.zeros_like(inside)
    limit = 90
    while stack:
        y, x, depth = stack.pop()
        if removed[y, x] or depth > limit or not removable[y, x]:
            continue
        removed[y, x] = True
        nxt = depth + 1
        if y > 0:
            stack.append((y - 1, x, nxt))
        if y + 1 < height:
            stack.append((y + 1, x, nxt))
        if x > 0:
            stack.append((y, x - 1, nxt))
        if x + 1 < width:
            stack.append((y, x + 1, nxt))
    inside[removed] = False
    alpha = np.array(Image.fromarray((inside.astype(np.uint8) * 255)).filter(ImageFilter.GaussianBlur(0.8)))
    rgba = np.array(image.convert("RGBA"))
    rgba[:, :, 3] = alpha
    rgba[alpha < 8, :3] = 0
    result = Image.fromarray(rgba)
    ys, xs = np.where(alpha > 16)
    pad = 8
    return result.crop((max(int(xs.min()) - pad, 0), max(int(ys.min()) - pad, 0), min(int(xs.max()) + pad, width), min(int(ys.max()) + pad, height)))


def detail(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = int(min(width, height) * 0.52)
    cx, cy = width // 2, int(height * 0.46)
    box = (max(cx - side // 2, 0), max(cy - side // 2, 0), min(cx + side // 2, width), min(cy + side // 2, height))
    return image.crop(box).resize((900, 900), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    jobs = [
        ("flow12-44a495ef-46e3-44fc-9dec-3165baf929ce.jpg", "chemise-blanche-spirale-dos"),
        ("flow2-4ad83826-daa3-4ff7-91e4-4d9e4473393f.jpg", "chemise-blanche-horizon-dos"),
        ("flow6-0324ee9e-a75a-48f3-97ac-6fa3dc543724.jpg", "chemise-blanche-mc-spirale-dos"),
    ]
    for source, name in jobs:
        cut = hull_cut(SRC / source)
        cut.save(OUT / f"{name}.png", "PNG", optimize=True)
        detail(cut).save(OUT / f"{name}-detail.png", "PNG", optimize=True)
        print(name, cut.size, flush=True)

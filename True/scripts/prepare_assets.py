"""Cut studio backgrounds out of the TRUE garment photos and export PNGs."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "products"
SRC = Path(r"C:\Users\DELL\AppData\Roaming\Cursor\User\workspaceStorage\cc68f0ac5705414a8594a81d97540b7f\images")
GENERATED = Path(
    r"C:\Users\DELL\.cursor\projects\c-Users-DELL-Desktop-True\assets\chemise-blanche-mc-true-poitrine.jpg"
)

JOBS = [
    (SRC / "flow14-7a54adc0-a6a7-43d6-b867-6f74a995c605.jpg", "veste-noire-horizon-dos", 28),
    (SRC / "flow2-4ad83826-daa3-4ff7-91e4-4d9e4473393f.jpg", "chemise-blanche-horizon-dos", 12),
    (SRC / "flow12-44a495ef-46e3-44fc-9dec-3165baf929ce.jpg", "chemise-blanche-spirale-dos", 26),
    (SRC / "flow6-0324ee9e-a75a-48f3-97ac-6fa3dc543724.jpg", "chemise-blanche-mc-spirale-dos", 26),
    (SRC / "flow15-32aaafb5-3b74-430d-b005-9a9b811a1226.jpg", "chemise-noire-mc-spirale-dos", 32),
    (GENERATED, "chemise-blanche-mc-true-poitrine", 22),
]


def remove_background(image: Image.Image, tolerance: int) -> Image.Image:
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3].astype(np.int16)
    height, width = rgb.shape[:2]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    bg = np.median(border, axis=0)
    near = np.max(np.abs(rgb - bg), axis=2) <= tolerance
    seen = np.zeros((height, width), dtype=np.uint8)
    stack: list[tuple[int, int]] = []
    for x in range(width):
        if near[0, x]:
            stack.append((0, x))
        if near[height - 1, x]:
            stack.append((height - 1, x))
    for y in range(height):
        if near[y, 0]:
            stack.append((y, 0))
        if near[y, width - 1]:
            stack.append((y, width - 1))

    while stack:
        y, x = stack.pop()
        if seen[y, x] or not near[y, x]:
            continue
        left = x
        while left > 0 and near[y, left - 1] and not seen[y, left - 1]:
            left -= 1
        right = x
        while right + 1 < width and near[y, right + 1] and not seen[y, right + 1]:
            right += 1
        seen[y, left : right + 1] = 1
        if y > 0:
            for nx in range(left, right + 1):
                if near[y - 1, nx] and not seen[y - 1, nx]:
                    stack.append((y - 1, nx))
        if y + 1 < height:
            for nx in range(left, right + 1):
                if near[y + 1, nx] and not seen[y + 1, nx]:
                    stack.append((y + 1, nx))

    foreground = Image.fromarray(np.where(seen, 0, 255).astype(np.uint8), mode="L")
    alpha = np.array(foreground.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.4)))
    rgba[:, :, 3] = alpha
    rgba[alpha < 8, :3] = 0
    return Image.fromarray(rgba)


def trim(image: Image.Image, pad: int = 16) -> Image.Image:
    alpha = np.array(image.split()[-1])
    ys, xs = np.where(alpha > 16)
    if len(xs) == 0:
        return image
    left = max(int(xs.min()) - pad, 0)
    right = min(int(xs.max()) + pad + 1, image.width)
    top = max(int(ys.min()) - pad, 0)
    bottom = min(int(ys.max()) + pad + 1, image.height)
    return image.crop((left, top, right, bottom))


def detail_crop(image: Image.Image, focus: str) -> Image.Image:
    width, height = image.size
    if focus == "chest":
        box = (int(width * 0.42), int(height * 0.22), int(width * 0.82), int(height * 0.58))
    else:
        side = int(min(width, height) * 0.52)
        cx, cy = width // 2, int(height * 0.46)
        box = (max(cx - side // 2, 0), max(cy - side // 2, 0), min(cx + side // 2, width), min(cy + side // 2, height))
    return image.crop(box).resize((900, 900), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for source, name, tolerance in JOBS:
        if not source.exists():
            raise SystemExit(f"Missing source: {source}")
        cut = trim(remove_background(Image.open(source), tolerance))
        dest = OUT / f"{name}.png"
        cut.save(dest, "PNG", optimize=True)
        detail_crop(cut, "chest" if "poitrine" in name else "back").save(OUT / f"{name}-detail.png", "PNG", optimize=True)
        print(f"{name}: {cut.size} {dest.stat().st_size // 1024}KB", flush=True)


if __name__ == "__main__":
    main()

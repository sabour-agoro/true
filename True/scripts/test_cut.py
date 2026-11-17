from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r"C:\Users\DELL\AppData\Roaming\Cursor\User\workspaceStorage\cc68f0ac5705414a8594a81d97540b7f\images")
OUT = Path(r"C:\Users\DELL\Desktop\True\public\products")


def cut(path: Path, tolerance: int, erode: int) -> Image.Image:
    image = Image.open(path).convert("RGB")
    rgb = np.array(image).astype(np.int16)
    height, width = rgb.shape[:2]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    background = np.median(border, axis=0)
    near = np.max(np.abs(rgb - background), axis=2) <= tolerance
    if erode:
        near = np.array(Image.fromarray((near.astype(np.uint8) * 255)).filter(ImageFilter.MinFilter(erode))) > 127

    seen = np.zeros((height, width), np.uint8)
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

    kernel = erode if erode else 1
    removed = np.array(Image.fromarray(seen * 255).filter(ImageFilter.MaxFilter(kernel)))
    alpha = np.array(Image.fromarray(255 - removed).filter(ImageFilter.GaussianBlur(0.5)))
    rgba = np.array(image.convert("RGBA"))
    rgba[:, :, 3] = alpha
    rgba[alpha < 12, :3] = 0
    result = Image.fromarray(rgba)
    ys, xs = np.where(alpha > 16)
    pad = 12
    return result.crop(
        (
            max(int(xs.min()) - pad, 0),
            max(int(ys.min()) - pad, 0),
            min(int(xs.max()) + pad, width),
            min(int(ys.max()) + pad, height),
        )
    )


if __name__ == "__main__":
    cut(SRC / "flow12-44a495ef-46e3-44fc-9dec-3165baf929ce.jpg", 24, 7).save(OUT / "_test-white.png")
    cut(SRC / "flow14-7a54adc0-a6a7-43d6-b867-6f74a995c605.jpg", 28, 3).save(OUT / "_test-black.png")
    print("tested")

"""Vertical launch film for TRUE — La Niche, 3 January 2027."""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
OUT = Path(r"C:\Users\DELL\Desktop\TRUE-lancement.mp4")

FACADE = Path(
    r"C:\Users\DELL\.cursor\projects\c-Users-DELL-Desktop-True\assets"
    r"\WhatsApp_Image_2026-11-15_at_21.58.52-8df06587-9d80-4f7f-be77-385ac3a9040b.jpg"
)
TERRACE = Path(
    r"C:\Users\DELL\.cursor\projects\c-Users-DELL-Desktop-True\assets"
    r"\WhatsApp_Image_2026-11-15_at_22.01.38-925517ca-1454-4e29-9d1a-e55977bcadfd.png"
)

FONT = Path(r"C:\Windows\Fonts")


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def plate(zoom_max: float, src: np.ndarray) -> np.ndarray:
    ih, iw = src.shape[:2]
    scale = max(W / iw, H / ih) * zoom_max
    return cv2.resize(src, (int(iw * scale), int(ih * scale)), interpolation=cv2.INTER_AREA)


def crop_from(plate_img: np.ndarray, zoom: float, zoom_max: float, cx: float, cy: float) -> np.ndarray:
    ph, pw = plate_img.shape[:2]
    # plate is at zoom_max; we need a window that, scaled to W/H, equals `zoom`
    window_scale = zoom_max / zoom
    ww = int(W * window_scale)
    wh = int(H * window_scale)
    ww = min(ww, pw)
    wh = min(wh, ph)
    x = int((pw - ww) * cx)
    y = int((ph - wh) * cy)
    x = max(0, min(x, pw - ww))
    y = max(0, min(y, ph - wh))
    view = plate_img[y : y + wh, x : x + ww]
    return cv2.resize(view, (W, H), interpolation=cv2.INTER_LINEAR)


def prepare(path: Path, bottom_keep: float) -> np.ndarray:
    img = cv2.imread(str(path))
    if img is None:
        raise SystemExit(f"photo introuvable: {path}")
    img = img[: int(img.shape[0] * bottom_keep)]
    f = img.astype(np.float32)
    f = (f - 128.0) * 1.06 + 122.0
    gray = cv2.cvtColor(np.clip(f, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    gray = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR).astype(np.float32)
    return np.clip(f * 0.82 + gray * 0.18, 0, 255).astype(np.uint8)


YY, XX = np.mgrid[0:H, 0:W]
NX = (XX / (W - 1)) * 2 - 1
NY = (YY / (H - 1)) * 2 - 1
VIG = np.clip(1 - 0.42 * (NX * NX + NY * NY), 0.42, 1.0).astype(np.float32)


def shade(frame: np.ndarray) -> np.ndarray:
    return np.clip(frame.astype(np.float32) * VIG[..., None], 0, 255).astype(np.uint8)


def text_layer(paint) -> tuple[np.ndarray, np.ndarray]:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    paint(ImageDraw.Draw(layer))
    arr = np.array(layer)
    rgb = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR).astype(np.float32)
    alpha = (arr[:, :, 3:4].astype(np.float32)) / 255.0
    return rgb, alpha


def blit(frame: np.ndarray, rgb: np.ndarray, alpha: np.ndarray, opacity: float) -> np.ndarray:
    if opacity <= 0:
        return frame
    a = alpha * opacity
    base = frame.astype(np.float32)
    out = base * (1 - a) + rgb * a
    return np.clip(out, 0, 255).astype(np.uint8)


def spaced(draw, text, y, font, fill, tracking):
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    for ch, width in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += width + tracking


def centered(draw, text, y, font, fill):
    width = draw.textlength(text, font=font)
    draw.text(((W - width) / 2, y), text, font=font, fill=fill)


def main():
    impact = ImageFont.truetype(str(FONT / "impact.ttf"), 168)
    impact_date = ImageFont.truetype(str(FONT / "impact.ttf"), 112)
    arial = ImageFont.truetype(str(FONT / "arialbd.ttf"), 46)
    arial_sm = ImageFont.truetype(str(FONT / "arial.ttf"), 34)
    georgia = ImageFont.truetype(str(FONT / "georgia.ttf"), 42)
    georgia_sm = ImageFont.truetype(str(FONT / "georgiai.ttf"), 36)
    white = (255, 255, 255, 255)
    gold = (201, 162, 75, 255)
    ivory = (237, 230, 214, 255)
    mist = (176, 176, 176, 255)

    def title(draw):
        spaced(draw, "TRUE", 760, impact, white, 28)
        draw.rectangle([(W // 2 - 220, 960), (W // 2 + 220, 963)], fill=gold)
        spaced(draw, "COLLECTION 01", 1000, arial_sm, gold, 8)

    def niche(draw):
        spaced(draw, "LA NICHE ESPACE", 1560, arial, white, 6)

    def lome(draw):
        spaced(draw, "LOMÉ", 1560, arial, white, 14)

    def when(draw):
        spaced(draw, "03.01.2027", 740, impact_date, white, 4)
        spaced(draw, "LA NICHE ESPACE", 920, arial, ivory, 5)
        spaced(draw, "DÈS 17H GMT", 1020, arial, gold, 6)

    def cta(draw):
        spaced(draw, "RÉSERVE TA PLACE", 680, arial, white, 4)
        centered(draw, "true-fashion.vercel.app", 800, georgia, gold)
        centered(draw, "avant le 25 décembre", 900, georgia_sm, ivory)
        centered(draw, "ou  93 49 92 78", 1020, georgia, white)
        centered(draw, "pour recevoir le pack", 1100, georgia_sm, mist)

    layers = {name: text_layer(fn) for name, fn in (
        ("title", title),
        ("niche", niche),
        ("lome", lome),
        ("when", when),
        ("cta", cta),
    )}

    facade = plate(1.20, prepare(FACADE, 0.90))
    terrace_path = TERRACE if TERRACE.exists() else TERRACE.with_suffix(".jpg")
    terrace = plate(1.28, prepare(terrace_path, 0.82))
    blank = np.zeros((H, W, 3), dtype=np.uint8)

    print("layers ready", flush=True)
    n = FPS * 24
    writer = cv2.VideoWriter(str(OUT), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
    if not writer.isOpened():
        raise SystemExit("encodeur video indisponible")

    for i in range(n):
        t = i / FPS
        if t < 2.6:
            frame = blank.copy()
            # title block fades as a whole; gold line is inside the layer
            op = ease(t / 0.7)
            frame = blit(frame, *layers["title"], op)
        elif t < 8.4:
            u = ease((t - 2.6) / 5.8)
            frame = shade(crop_from(facade, 1.02 + 0.14 * u, 1.20, 0.50, 0.46 - 0.04 * u))
            op = ease(min(1, (t - 3.2) / 0.5))
            if t > 7.6:
                op *= 1 - ease((t - 7.6) / 0.8)
            frame = blit(frame, *layers["niche"], op)
        elif t < 13.6:
            u = ease((t - 8.4) / 5.2)
            frame = shade(crop_from(terrace, 1.08 + 0.16 * u, 1.28, 0.42, 0.40))
            op = ease(min(1, (t - 8.9) / 0.45))
            if t > 12.8:
                op *= 1 - ease((t - 12.8) / 0.8)
            frame = blit(frame, *layers["lome"], op)
        elif t < 18.2:
            frame = blit(blank, *layers["when"], ease(min(1, (t - 13.6) / 0.45)))
        else:
            frame = blit(blank, *layers["cta"], ease(min(1, (t - 18.2) / 0.45)))

        if 7.8 <= t < 8.4:
            k = ease((t - 7.8) / 0.6)
            frame = cv2.addWeighted(frame, 1 - k, blank, k, 0)
        elif 8.4 <= t < 9.0:
            k = 1 - ease((t - 8.4) / 0.6)
            frame = cv2.addWeighted(frame, 1 - k, blank, k, 0)
        elif 12.9 <= t < 13.6:
            k = ease((t - 12.9) / 0.7)
            frame = cv2.addWeighted(frame, 1 - k, blank, k, 0)

        writer.write(frame)
        if i % 90 == 0:
            print(f"{t:.1f}s", flush=True)

    writer.release()
    print("wrote", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()

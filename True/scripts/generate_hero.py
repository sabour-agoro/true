"""Original seamless black-hole loop. No audio. Each file stays under 3 MB."""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "hero"
W, H = 1280, 720
FPS = 24
FRAMES = 72


def make_renderer():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    x = (xx - W / 2) / (H * 0.52)
    y = -(yy - H / 2) / (H * 0.52)
    dx = x * 0.92
    dy = y * 0.92
    dz = np.ones_like(x)
    inv = 1.0 / np.sqrt(dx * dx + dy * dy + dz * dz)
    dx *= inv
    dy *= inv
    dz *= inv

    cam = np.array([0.0, 0.42, -2.55], dtype=np.float32)
    b = 2 * (cam[0] * dx + cam[1] * dy + cam[2] * dz)
    c = float(np.dot(cam, cam)) - 0.30**2
    disc = b * b - 4 * c
    shadow = disc > 0

    t_close = -0.5 * b
    closest = np.sqrt(
        (cam[0] + t_close * dx) ** 2
        + (cam[1] + t_close * dy) ** 2
        + (cam[2] + t_close * dz) ** 2
    )
    ring = np.exp(-((closest - 0.46) ** 2) / (2 * 0.011**2))
    ring *= (t_close > 0) & ~shadow

    inc = np.deg2rad(74)
    cy, sy = np.cos(inc), np.sin(inc)
    dy2 = dy * cy - dz * sy
    dz2 = dy * sy + dz * cy
    oy2 = cam[1] * cy - cam[2] * sy
    oz2 = cam[1] * sy + cam[2] * cy
    safe = np.where(np.abs(dy2) < 1e-4, np.float32(1e-4), dy2)
    t_disk = -oy2 / safe
    hx = cam[0] + t_disk * dx
    hz = oz2 + t_disk * dz2
    radius = np.sqrt(hx * hx + hz * hz)
    angle = np.arctan2(hz, hx)
    t_shadow = np.where(shadow, (-b - np.sqrt(np.maximum(disc, 0))) / 2, np.float32(1e6))
    on_disk = (t_disk > 0) & (radius > 0.42) & (radius < 1.85) & (np.abs(dy2) > 1e-4)
    on_disk &= ~((shadow) & (t_shadow < t_disk))

    inner = np.clip((radius - 0.42) / 0.18, 0, 1)
    outer = np.clip((1.85 - radius) / 0.55, 0, 1)
    fade = (inner * outer).astype(np.float32)
    vignette = np.clip(1.15 - (x * x * 0.55 + y * y * 0.8), 0, 1).astype(np.float32)

    hot = np.array([246, 236, 214], dtype=np.float32)
    gold = np.array([201, 162, 74], dtype=np.float32)
    deep = np.array([72, 48, 16], dtype=np.float32)

    rng = np.random.default_rng(7)
    star_layer = np.zeros((H, W, 3), dtype=np.float32)
    for sx, sy, bright, goldness in rng.random((160, 4)):
        px = int(sx * (W - 1))
        py = int(sy * (H - 1))
        col = gold * float(goldness) + np.array([236, 236, 232], dtype=np.float32) * (1 - float(goldness))
        star_layer[py, px] += col * (0.35 + float(bright) * 0.9)

    ring_rgb = (hot * 1.35 + gold * 0.35) * ring[..., None]

    def render(phase: float) -> np.ndarray:
        spin = angle + phase
        bands = (0.62 + 0.38 * np.sin(spin * 5 + radius * 14)) * (0.78 + 0.22 * np.sin(spin * 11 - radius * 22))
        doppler = 0.28 + 0.95 * (0.5 + 0.5 * np.cos(angle - phase))
        glow = bands * fade * doppler
        mix = np.clip(glow, 0, 1)[..., None]
        disk = (deep * (1 - mix) + gold * mix) * (0.35 + glow * 1.15)[..., None]
        disk += hot * np.clip(glow - 0.72, 0, 1)[..., None] * 0.8

        sharp = np.zeros((H, W, 3), dtype=np.float32)
        sharp[on_disk] = disk[on_disk]
        small = Image.fromarray(np.clip(sharp, 0, 255).astype(np.uint8)).resize((W // 4, H // 4), Image.Resampling.BILINEAR)
        soft = np.array(small.filter(ImageFilter.GaussianBlur(3)).resize((W, H), Image.Resampling.BILINEAR)).astype(np.float32)
        image = soft * 0.9 + sharp * 0.85 + ring_rgb + star_layer
        image *= vignette[..., None]
        image[shadow] *= 0.04
        image += 5
        return np.clip(image, 0, 255).astype(np.uint8)

    return render


def encode(ffmpeg: str, raw: Path, dest: Path, codec: list[str]) -> None:
    subprocess.run(
        [
            ffmpeg, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
            "-r", str(FPS), "-i", str(raw), "-an", *codec, str(dest),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    import imageio_ffmpeg

    OUT.mkdir(parents=True, exist_ok=True)
    render = make_renderer()
    started = time.time()
    sample = render(1.2)
    print(f"frame {time.time() - started:.2f}s", flush=True)
    Image.fromarray(sample).save(OUT / "_preview.jpg", quality=82, optimize=True)

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    raw = OUT / "_frames.raw"
    poster = None
    with raw.open("wb") as handle:
        for frame in range(FRAMES):
            image = render(2 * np.pi * frame / FRAMES)
            handle.write(image.tobytes())
            if frame == 18:
                poster = image
            if frame % 12 == 0:
                print(f"frame {frame + 1}/{FRAMES}", flush=True)
    if poster is not None:
        Image.fromarray(poster).save(OUT / "trou-noir.jpg", quality=80, optimize=True)
    encode(ffmpeg, raw, OUT / "trou-noir.mp4", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "30", "-preset", "veryfast", "-movflags", "+faststart"])
    encode(ffmpeg, raw, OUT / "trou-noir.webm", ["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "38", "-b:v", "0", "-deadline", "realtime", "-cpu-used", "4"])
    raw.unlink(missing_ok=True)
    for name in ("trou-noir.mp4", "trou-noir.webm", "trou-noir.jpg"):
        print(f"{name}: {(OUT / name).stat().st_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    main()

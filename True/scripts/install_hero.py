from pathlib import Path
from PIL import Image

source = Path(r"C:\Users\DELL\Documents\Downloads") / "What The Fact_! Earth wouldn't get sucked in!.jfif"
target = Path(r"C:\Users\DELL\Desktop\True\public\hero\trou-noir.jpg")
image = Image.open(source).convert("RGB")
print("source", image.size)
image.thumbnail((1920, 2400), Image.Resampling.LANCZOS)
image.save(target, quality=86, optimize=True)
print("saved", target, image.size)

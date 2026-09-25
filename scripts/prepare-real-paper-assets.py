"""Build the two Real Paper textures. Requires Pillow and NumPy.

The generated texture never reads the supplied photograph. Pass that photograph
only to create the separate optimized image-theme asset:

    python scripts/prepare-real-paper-assets.py --reference "path/to/blank-paper.png"
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"
SIZE = 1536


def generate_texture() -> Path:
    rng = np.random.default_rng(250926)

    def soft_noise(radius: float) -> np.ndarray:
        source = rng.normal(size=(SIZE, SIZE))
        frequency = np.fft.fftfreq(SIZE)
        fx, fy = np.meshgrid(frequency, frequency)
        gaussian = np.exp(-2 * np.pi**2 * radius**2 * (fx**2 + fy**2))
        field = np.fft.ifft2(np.fft.fft2(source) * gaussian).real
        return field / field.std()

    # Fine pulp variation and a faint horizontal machine grain. Both remain
    # below the contrast of normal text, and the larger fields are periodic.
    grain = (
        rng.normal(0, 1.9, (SIZE, SIZE))
        + 1.25 * soft_noise(1.2)
        + 0.9 * soft_noise(7)
        + 0.45 * soft_noise(36)
    )
    horizontal = rng.normal(0, 0.35, SIZE)
    grain += horizontal[:, None]
    base = np.array([242, 244, 248], dtype=np.float32)
    pixels = np.clip(base + grain[..., None], 0, 255).astype(np.uint8)
    paper = Image.fromarray(pixels, "RGB").convert("RGBA")

    fibers = Image.new("RGBA", paper.size)
    draw = ImageDraw.Draw(fibers)
    for _ in range(28_000):
        x = int(rng.integers(0, SIZE))
        y = int(rng.integers(0, SIZE))
        dx = int(rng.integers(2, 11))
        dy = int(rng.integers(-2, 3))
        ink = (129, 144, 167, 22) if rng.random() < 0.7 else (255, 255, 255, 34)
        for offset_x in (-SIZE, 0, SIZE):
            for offset_y in (-SIZE, 0, SIZE):
                draw.line((x + offset_x, y + offset_y, x + dx + offset_x, y + dy + offset_y), fill=ink)

    paper = Image.alpha_composite(paper, fibers).convert("RGB")
    destination = ASSETS / "real-paper-generated.webp"
    paper.save(destination, "WEBP", quality=91, method=6)
    return destination


def optimize_reference(source: Path) -> Path:
    with Image.open(source) as original:
        # Retain the supplied photograph's framing and subtle fiber detail.
        destination = ASSETS / "real-paper-image.webp"
        original.convert("RGB").save(destination, "WEBP", quality=88, method=6)
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", type=Path, help="The blank-paper photograph")
    args = parser.parse_args()

    ASSETS.mkdir(parents=True, exist_ok=True)
    outputs = [generate_texture()]
    if args.reference:
        outputs.append(optimize_reference(args.reference))
    for output in outputs:
        print(f"Wrote {output} ({output.stat().st_size:,} bytes)")

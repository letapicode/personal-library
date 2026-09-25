"""Regenerate the aperiodic-looking paper fiber asset (Pillow and NumPy)."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


SIZE = 1536
rng = np.random.default_rng(240924)

def soft_noise(radius: float) -> np.ndarray:
    """Gaussian blur on a torus so larger-scale mottling joins at tile edges."""
    source = rng.normal(0, 1, (SIZE, SIZE))
    frequency = np.fft.fftfreq(SIZE)
    fx, fy = np.meshgrid(frequency, frequency)
    gaussian = np.exp(-2 * np.pi**2 * radius**2 * (fx**2 + fy**2))
    field = np.fft.ifft2(np.fft.fft2(source) * gaussian).real
    return field / field.std()


# A natural sheet has fine grain plus faint irregular pulp density. All scales
# are kept small enough that the surface stays quiet behind normal-size text.
micro = rng.normal(0, 2.8, (SIZE, SIZE))
grain = micro + 2.1 * soft_noise(1.7) + 1.7 * soft_noise(9) + 0.7 * soft_noise(42)
base = np.array([244, 242, 236], dtype=np.float32)
pixels = np.clip(base + grain[..., None], 0, 255).astype(np.uint8)
image = Image.fromarray(pixels, "RGB").convert("RGBA")

# Sparse translucent cellulose threads vary in length and direction.
fibers = Image.new("RGBA", image.size)
draw = ImageDraw.Draw(fibers)
for _ in range(24_000):
    x = int(rng.integers(0, SIZE))
    y = int(rng.integers(0, SIZE))
    dx = int(rng.integers(-8, 9))
    dy = int(rng.integers(-4, 5))
    if rng.random() < 0.7:
        draw.line((x, y, x + dx, y + dy), fill=(183, 179, 167, 42), width=1)
    else:
        draw.line((x, y, x + dx, y + dy), fill=(255, 255, 252, 47), width=1)

image = Image.alpha_composite(image, fibers).convert("RGB")
destination = Path(__file__).resolve().parent.parent / "src/assets/paper-fine-texture.webp"
image.save(destination, "WEBP", quality=94, method=6)
print(f"Wrote {destination} ({destination.stat().st_size:,} bytes)")

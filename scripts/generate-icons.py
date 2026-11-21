"""One-off PWA icon generator. Redraws public/favicon.svg with Pillow and writes the PNGs the
manifest references. Run: python scripts/generate-icons.py   (requires: pip install pillow)

Outputs into public/: icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png.
No network access. Safe to re-run.
"""
from pathlib import Path

from PIL import Image, ImageDraw

BG = (9, 13, 22, 255)        # #090d16
CARD = (19, 27, 46, 255)     # #131b2e
CYAN = (6, 182, 212, 255)    # #06b6d4
EMERALD = (16, 185, 129, 255)  # #10b981
SCALE = 4  # supersample for smooth edges


def draw_icon(size: int, *, rounded: bool, inner_scale: float) -> Image.Image:
    """Draw the 100x100 favicon geometry into a size x size canvas.

    inner_scale < 1 shrinks the artwork toward the centre (maskable icons need a safe zone).
    """
    big = size * SCALE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.2), fill=BG)
    else:
        d.rectangle([0, 0, big - 1, big - 1], fill=BG)

    unit = big / 100.0 * inner_scale
    off = (big - 100 * unit) / 2.0

    def p(v: float) -> float:
        return off + v * unit

    # Cross with rounded caps
    w = 12 * unit
    for (x1, y1, x2, y2) in ((50, 20, 50, 80), (20, 50, 80, 50)):
        d.line([p(x1), p(y1), p(x2), p(y2)], fill=CYAN, width=int(w))
        for (cx, cy) in ((x1, y1), (x2, y2)):
            r = w / 2
            d.ellipse([p(cx) - r, p(cy) - r, p(cx) + r, p(cy) + r], fill=CYAN)

    # Centre ring and dot
    r_ring = 16 * unit
    d.ellipse([p(50) - r_ring, p(50) - r_ring, p(50) + r_ring, p(50) + r_ring], fill=CARD, outline=EMERALD, width=int(4 * unit))
    r_dot = 6 * unit
    d.ellipse([p(50) - r_dot, p(50) - r_dot, p(50) + r_dot, p(50) + r_dot], fill=CYAN)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "public"
    out.mkdir(exist_ok=True)

    draw_icon(192, rounded=True, inner_scale=1.0).save(out / "icon-192.png")
    draw_icon(512, rounded=True, inner_scale=1.0).save(out / "icon-512.png")
    # Maskable: full-bleed square, artwork inside the central 80% safe zone.
    draw_icon(512, rounded=False, inner_scale=0.7).save(out / "maskable-512.png")
    # iOS applies its own rounding; supply a full-bleed square.
    draw_icon(180, rounded=False, inner_scale=0.9).save(out / "apple-touch-icon.png")
    print("wrote icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png to", out)


if __name__ == "__main__":
    main()

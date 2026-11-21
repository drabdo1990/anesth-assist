"""
Generates the Google Play Store Feature Graphic (1024x500 PNG)
with dark clinical styling (#090d16) and cyan accents (#06b6d4).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def generate_feature_graphic():
    width, height = 1024, 500
    img = Image.new("RGB", (width, height), color="#090d16")
    draw = ImageDraw.Draw(img)

    # Decorative clinical accent lines
    draw.rectangle([0, 0, width, 6], fill="#06b6d4")
    draw.rectangle([0, height - 6, width, height], fill="#0891b2")

    # Subtle radial grid / circular glow in the center
    for r in range(220, 260, 8):
        draw.ellipse(
            [width // 2 - r, height // 2 - r, width // 2 + r, height // 2 + r],
            outline="#164e63",
            width=1,
        )

    # Load system or default font
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 68)
        subtitle_font = ImageFont.truetype("arial.ttf", 26)
        tag_font = ImageFont.truetype("arialbd.ttf", 18)
    except IOError:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        tag_font = ImageFont.load_default()

    # Title: AnesthAssist
    title_text = "AnesthAssist"
    draw.text((width // 2, 175), title_text, fill="#ffffff", font=title_font, anchor="mm")

    # Subtitle
    subtitle_text = "OR Clinical Decision Support & Perioperative Cognitive Aid"
    draw.text((width // 2, 245), subtitle_text, fill="#67e8f9", font=subtitle_font, anchor="mm")

    # Key highlight badges
    badges = ["100% Offline", "110 Stoelting Plans", "Peds Dosing", "Crisis Protocols", "Zero-PHI"]
    badge_y = 325
    badge_width, badge_step = 172, 180
    total_badge_width = len(badges) * badge_step
    start_x = (width - total_badge_width) // 2

    for i, badge in enumerate(badges):
        bx = start_x + (i * badge_step)
        draw.rounded_rectangle([bx, badge_y, bx + badge_width, badge_y + 36], radius=8, fill="#131b2e", outline="#22d3ee")
        draw.text((bx + badge_width // 2, badge_y + 18), badge, fill="#e2e8f0", font=tag_font, anchor="mm")

    # Author attribution
    author_text = "Clinical Lead: Dr. Mohamed Abdelwahab  ·  online.anesthassist.app"
    draw.text((width // 2, 420), author_text, fill="#94a3b8", font=tag_font, anchor="mm")

    out_path = Path("public/feature-graphic.png")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, format="PNG", optimize=True)
    print(f"Feature graphic generated: {out_path} ({width}x{height})")


if __name__ == "__main__":
    generate_feature_graphic()

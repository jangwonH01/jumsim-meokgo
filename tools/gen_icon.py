"""Generate 점심먹Go app icon as PNG (512x512) + optional 1024x1024.

Usage:
  python tools/gen_icon.py

Writes:
  public/icon-512.png
  public/icon-1024.png
  public/favicon.png  (64x64)
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent.parent
OUT_DIR = HERE / "public"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BRAND = (99, 179, 237)       # #63B3ED
BRAND_DARK = (37, 99, 235)   # #2563EB


def _gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BRAND)
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(BRAND[0] * (1 - t) + BRAND_DARK[0] * t)
        g = int(BRAND[1] * (1 - t) + BRAND_DARK[1] * t)
        b = int(BRAND[2] * (1 - t) + BRAND_DARK[2] * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def _rounded_mask(size: int, radius_frac: float = 0.23) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    r = int(size * radius_frac)
    draw.rounded_rectangle((0, 0, size, size), radius=r, fill=255)
    return mask


def _find_font(size: int) -> ImageFont.FreeTypeFont:
    for path in [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def make_icon(size: int) -> Image.Image:
    bg = _gradient(size)
    mask = _rounded_mask(size)

    # Subtle inner glow circle behind the emoji
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    r = int(size * 0.36)
    cx = size // 2
    cy = int(size * 0.45)
    gdraw.ellipse(
        (cx - r, cy - r, cx + r, cy + r),
        fill=(255, 255, 255, 70),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size // 28))

    bg = bg.convert("RGBA")
    bg.alpha_composite(glow)

    draw = ImageDraw.Draw(bg)

    # "점심먹Go" wordmark (two lines)
    top_font = _find_font(int(size * 0.26))
    bot_font = _find_font(int(size * 0.22))

    # Center anchor
    top_bbox = draw.textbbox((0, 0), "점심먹", font=top_font)
    top_w = top_bbox[2] - top_bbox[0]
    top_h = top_bbox[3] - top_bbox[1]
    bot_bbox = draw.textbbox((0, 0), "Go 🍚", font=bot_font)
    bot_w = bot_bbox[2] - bot_bbox[0]

    top_y = int(size * 0.30)
    bot_y = top_y + top_h + int(size * 0.04)

    draw.text(
        ((size - top_w) // 2 - top_bbox[0], top_y),
        "점심먹",
        font=top_font,
        fill=(255, 255, 255, 255),
    )
    draw.text(
        ((size - bot_w) // 2 - bot_bbox[0], bot_y),
        "Go 🍚",
        font=bot_font,
        fill=(255, 255, 255, 235),
    )

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(bg, (0, 0), mask=mask)
    return out


def main() -> None:
    for size, name in [(1024, "icon-1024.png"), (512, "icon-512.png"), (64, "favicon.png")]:
        icon = make_icon(size)
        dst = OUT_DIR / name
        icon.save(dst, format="PNG")
        print(f"wrote {dst.relative_to(HERE)} ({size}x{size})")


if __name__ == "__main__":
    main()

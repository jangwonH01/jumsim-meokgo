"""Generate all AppsInToss console upload assets in one pass.

Produces:
  ~/Downloads/jumsim-meokgo-console/logo/jumsim-meokgo-logo-600.png      (600×600, app logo)
  ~/Downloads/jumsim-meokgo-console/thumbnail/square-1000.png            (1000×1000, 정방형 썸네일)
  ~/Downloads/jumsim-meokgo-console/thumbnail/landscape-1932x828.png     (1932×828, 가로형 썸네일)

Screenshots (636×1048) are captured separately from the dev preview.

AppsInToss policy: PNG, 배경색 필수 (transparency not allowed for logo).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_ROOT = Path.home() / "Downloads" / "jumsim-meokgo-console"
LOGO_DIR = OUT_ROOT / "logo"
THUMB_DIR = OUT_ROOT / "thumbnail"
for d in (LOGO_DIR, THUMB_DIR):
    d.mkdir(parents=True, exist_ok=True)

BRAND = (99, 179, 237)       # #63B3ED
BRAND_DARK = (37, 99, 235)   # #2563EB


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


def _vertical_gradient(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), BRAND)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(BRAND[0] * (1 - t) + BRAND_DARK[0] * t)
        g = int(BRAND[1] * (1 - t) + BRAND_DARK[1] * t)
        b = int(BRAND[2] * (1 - t) + BRAND_DARK[2] * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def _square_logo(size: int, radius_frac: float = 0.23) -> Image.Image:
    """Square rounded-rectangle logo with '점심먹Go 🍚' wordmark."""
    bg = _vertical_gradient(size, size).convert("RGBA")

    # Soft inner glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = int(size * 0.36)
    cy = int(size * 0.45)
    gd.ellipse((size // 2 - r, cy - r, size // 2 + r, cy + r), fill=(255, 255, 255, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size // 28))
    bg.alpha_composite(glow)

    d = ImageDraw.Draw(bg)
    top_font = _find_font(int(size * 0.26))
    bot_font = _find_font(int(size * 0.22))

    top_bbox = d.textbbox((0, 0), "점심먹", font=top_font)
    top_w = top_bbox[2] - top_bbox[0]
    top_h = top_bbox[3] - top_bbox[1]
    bot_bbox = d.textbbox((0, 0), "Go 🍚", font=bot_font)
    bot_w = bot_bbox[2] - bot_bbox[0]

    top_y = int(size * 0.30)
    bot_y = top_y + top_h + int(size * 0.04)
    d.text(((size - top_w) // 2 - top_bbox[0], top_y), "점심먹", font=top_font, fill=(255, 255, 255, 255))
    d.text(((size - bot_w) // 2 - bot_bbox[0], bot_y), "Go 🍚", font=bot_font, fill=(255, 255, 255, 235))

    # Rounded mask
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=int(size * radius_frac), fill=255)
    # Composite over solid background so PNG has no transparency (policy)
    bg_solid = Image.new("RGB", (size, size), BRAND)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(bg, (0, 0), mask=mask)
    final = Image.alpha_composite(bg_solid.convert("RGBA"), out)
    return final.convert("RGB")


def _landscape_hero(width: int, height: int) -> Image.Image:
    """Landscape thumbnail: brand gradient + large wordmark + subtitle."""
    bg = _vertical_gradient(width, height).convert("RGBA")

    # Decorative circles
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(layer)
    for cx, cy, rad, a in [
        (int(width * 0.12), int(height * 0.78), int(height * 0.35), 40),
        (int(width * 0.92), int(height * 0.20), int(height * 0.45), 60),
    ]:
        gd.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=(255, 255, 255, a))
    layer = layer.filter(ImageFilter.GaussianBlur(radius=width // 60))
    bg.alpha_composite(layer)

    d = ImageDraw.Draw(bg)
    title_font = _find_font(int(height * 0.33))
    subtitle_font = _find_font(int(height * 0.13))

    title = "점심먹Go 🍚"
    sub = "점심 메뉴 고민 끝 — 룰렛 · 근처 식당 · 팀 투표"

    t_bbox = d.textbbox((0, 0), title, font=title_font)
    t_w = t_bbox[2] - t_bbox[0]
    t_h = t_bbox[3] - t_bbox[1]
    s_bbox = d.textbbox((0, 0), sub, font=subtitle_font)
    s_w = s_bbox[2] - s_bbox[0]

    total_h = t_h + int(height * 0.10) + (s_bbox[3] - s_bbox[1])
    top_y = (height - total_h) // 2
    d.text(((width - t_w) // 2 - t_bbox[0], top_y - t_bbox[1]), title, font=title_font, fill=(255, 255, 255, 255))
    d.text(((width - s_w) // 2 - s_bbox[0], top_y + t_h + int(height * 0.06) - s_bbox[1]), sub,
           font=subtitle_font, fill=(255, 255, 255, 230))

    return bg.convert("RGB")


def main() -> None:
    # 1) 600×600 logo
    logo = _square_logo(600)
    p = LOGO_DIR / "jumsim-meokgo-logo-600.png"
    logo.save(p, format="PNG")
    print(f"wrote {p.relative_to(Path.home())} (600×600 RGB, 배경 불투명)")

    # 2) 1000×1000 square thumbnail (reuse logo template, larger)
    sq = _square_logo(1000, radius_frac=0.18)  # slightly less rounded for thumb
    p = THUMB_DIR / "square-1000.png"
    sq.save(p, format="PNG")
    print(f"wrote {p.relative_to(Path.home())} (1000×1000 정방형 썸네일)")

    # 3) 1932×828 horizontal thumbnail
    ls = _landscape_hero(1932, 828)
    p = THUMB_DIR / "landscape-1932x828.png"
    ls.save(p, format="PNG")
    print(f"wrote {p.relative_to(Path.home())} (1932×828 가로형 썸네일)")


if __name__ == "__main__":
    main()

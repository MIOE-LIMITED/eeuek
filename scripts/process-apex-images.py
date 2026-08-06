#!/usr/bin/env python3
# APEX-EK ürün görsellerini işler: beyaz kenarı kırpar, kare beyaz zemine oturtur,
# ana (1000px) + thumbnail (240px) JPG üretir. Watermark yok; yazı basılmaz.
# Kaynak: scratchpad/apex_zip/{1..5}.png  ->  klimasun-2026/assets/products/apex-ek/
#
# Eşleme: 1-4 -> APEX-EK-RV-00 (sensör galerisi), 5 -> APEX-EK-PNL (panel)

import os
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = "/tmp/claude-0/-home-user-eeuek/86b0abf9-ed65-5404-b3fd-967d3aea420c/scratchpad/apex_zip"
DST = os.path.join(ROOT, "klimasun-2026/assets/products/apex-ek")
# Yerelde public/gorseller zaten var (build kopyalamaz); tutarlılık için oraya da yaz.
DST_PUB = os.path.join(ROOT, "public/gorseller/apex-ek")
os.makedirs(DST, exist_ok=True)
os.makedirs(DST_PUB, exist_ok=True)

MAIN, THUMB, PAD = 1000, 240, 0.03

def trim_and_square(im):
    im = im.convert("RGB")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > 12 else 0)
    bbox = diff.getbbox()
    if bbox:
        pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * PAD)
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
        im = im.crop(bbox)
    side = max(im.size)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return canvas

def save(sq, name):
    for d in (DST, DST_PUB):
        sq.resize((MAIN, MAIN), Image.LANCZOS).save(os.path.join(d, f"{name}.jpg"), quality=88, optimize=True)
        sq.resize((THUMB, THUMB), Image.LANCZOS).save(os.path.join(d, f"{name}_min.jpg"), quality=85, optimize=True)
    print(f"  {name}.jpg + {name}_min.jpg")

MAP = {"1": "rv-00-1", "2": "rv-00-2", "3": "rv-00-3", "4": "rv-00-4", "5": "pnl-1"}
for num, name in MAP.items():
    src = os.path.join(SRC, f"{num}.png")
    if not os.path.exists(src):
        print("  YOK:", src); continue
    save(trim_and_square(Image.open(src)), name)
print("Bitti ->", DST)

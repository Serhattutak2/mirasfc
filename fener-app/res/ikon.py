# Fener simgesi ve açılış ekranı (PIL)
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, os
H = os.path.dirname(os.path.abspath(__file__))
def sahne(n, yazi=False):
    im = Image.new('RGB', (n, n)); d = ImageDraw.Draw(im)
    ust, orta, alt = (16, 24, 58), (198, 92, 70), (247, 178, 96)
    ufuk = int(n * .66)
    for y in range(ufuk):
        t = y / ufuk
        c = [int(ust[k] + (orta[k] - ust[k]) * min(1, t * 1.3)) for k in range(3)] if t < .77 else [int(orta[k] + (alt[k] - orta[k]) * (t - .77) / .23) for k in range(3)]
        d.line([(0, y), (n, y)], fill=tuple(c))
    for y in range(ufuk, n):
        t = (y - ufuk) / (n - ufuk); c = (int(40 - 25 * t), int(52 - 30 * t), int(92 - 50 * t)); d.line([(0, y), (n, y)], fill=c)
    # güneş yansıması
    for i in range(0 if yazi else 14):
        y = ufuk + 6 + i * n * .018; w = n * (.16 - i * .009)
        d.line([(n * .3 - w / 2, y), (n * .3 + w / 2, y)], fill=(250, 190, 110), width=max(2, int(n * .006)))
    # ada
    d.polygon([(n * .38, ufuk + 2), (n * .5, ufuk - n * .1), (n * .66, ufuk - n * .13), (n * .8, ufuk - n * .07), (n * 1.02, ufuk + 2)], fill=(28, 26, 34))
    # ışık huzmeleri
    hz = Image.new('RGBA', (n, n)); hd = ImageDraw.Draw(hz)
    lx, ly = n * .66, n * .25
    hd.polygon([(lx, ly), (-n * .1, ly - n * .2), (-n * .1, ly + n * .1)], fill=(255, 236, 170, 70))
    hd.polygon([(lx, ly), (n * 1.1, ly - n * .12), (n * 1.1, ly + n * .06)], fill=(255, 236, 170, 45))
    hz = hz.filter(ImageFilter.GaussianBlur(n * .012)); im.paste(hz, (0, 0), hz); d = ImageDraw.Draw(im)
    # kule
    alt_y, ust_y = ufuk - n * .12, n * .3
    for i in range(6):
        y0 = ust_y + (alt_y - ust_y) * i / 6; y1 = ust_y + (alt_y - ust_y) * (i + 1) / 6
        def gx(y): return n * (.035 + .025 * (y - ust_y) / (alt_y - ust_y))
        d.polygon([(lx - gx(y0), y0), (lx + gx(y0), y0), (lx + gx(y1), y1), (lx - gx(y1), y1)], fill=(196, 44, 48) if i % 2 == 0 else (240, 236, 228))
    d.rectangle([lx - n * .05, ust_y - n * .012, lx + n * .05, ust_y + n * .004], fill=(34, 34, 40))
    # fener odası ve parıltı
    pr = Image.new('RGBA', (n, n)); pd = ImageDraw.Draw(pr)
    pd.ellipse([lx - n * .11, ly - n * .11, lx + n * .11, ly + n * .11], fill=(255, 220, 140, 150))
    pr = pr.filter(ImageFilter.GaussianBlur(n * .03)); im.paste(pr, (0, 0), pr); d = ImageDraw.Draw(im)
    d.rectangle([lx - n * .032, ly - n * .03, lx + n * .032, ly + n * .03], fill=(255, 232, 160))
    d.polygon([(lx - n * .045, ly - n * .03), (lx + n * .045, ly - n * .03), (lx, ly - n * .085)], fill=(34, 34, 40))
    # yıldızlar
    import random; random.seed(7)
    for _ in range(40):
        x, y = random.random() * n, random.random() * n * .35; r = n * .002 * random.random() + n * .001
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 240))
    if yazi:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', int(n * .085))
        d.text((n / 2, n * .8), 'F E N E R', font=f, fill=(244, 236, 220), anchor='mm')
        f2 = ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf', int(n * .035))
        d.text((n / 2, n * .86), 'Son Bekçi', font=f2, fill=(232, 210, 170), anchor='mm')
    return im
sahne(1024).save(os.path.join(H, 'icon-1024.png'))
sahne(2732, True).save(os.path.join(H, 'splash.png'))

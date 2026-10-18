# Miras FC simge ve açılış ekranı üretir (PIL). Çalıştır: python3 res/make_icons.py
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os
H = os.path.dirname(os.path.abspath(__file__)); IOS = os.path.join(H, '..', 'ios', 'App', 'App', 'Assets.xcassets')
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
GOLD, GOLD2, BG1, BG2 = (232, 196, 104), (176, 132, 52), (14, 44, 26), (6, 16, 12)
def bg(w, h):
    im = Image.new('RGB', (w, h), BG2); d = ImageDraw.Draw(im)
    for i in range(h):  # dikey degrade + çim şeritleri
        t = i / h; c = tuple(int(BG1[k] * (1 - t) + BG2[k] * t) for k in range(3))
        if (i // max(1, h // 12)) % 2: c = tuple(min(255, x + 6) for x in c)
        d.line([(0, i), (w, i)], fill=c)
    return im
def shield(d, cx, cy, s):
    pts = [(cx - s, cy - s * .95), (cx + s, cy - s * .95), (cx + s, cy + s * .15), (cx, cy + s * 1.15), (cx - s, cy + s * .15)]
    d.polygon(pts, fill=GOLD2); s2 = s * .88
    d.polygon([(cx - s2, cy - s2 * .98), (cx + s2, cy - s2 * .98), (cx + s2, cy + s2 * .12), (cx, cy + s2 * 1.12), (cx - s2, cy + s2 * .12)], fill=(18, 58, 34))
def ball(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 245, 240), outline=(30, 30, 30), width=max(2, int(r * .06)))
    for a in range(5):
        ang = a * 2 * math.pi / 5 - math.pi / 2; px, py = cx + math.cos(ang) * r * .62, cy + math.sin(ang) * r * .62
        d.regular_polygon((px, py, r * .2), 5, rotation=a * 72, fill=(30, 30, 30))
    d.regular_polygon((cx, cy, r * .28), 5, rotation=180, fill=(30, 30, 30))
def icon(n=1024):
    im = bg(n, n); d = ImageDraw.Draw(im)
    shield(d, n / 2, n * .47, n * .36)
    f = ImageFont.truetype(FONT, int(n * .40)); d.text((n / 2, n * .40), 'M', font=f, fill=GOLD, anchor='mm')
    ball(d, n / 2, n * .70, n * .085)
    return im
def splash(n=2732):
    im = bg(n, n); d = ImageDraw.Draw(im); c = n / 2
    shield(d, c, c - n * .06, n * .12)
    f = ImageFont.truetype(FONT, int(n * .13)); d.text((c, c - n * .085), 'M', font=f, fill=GOLD, anchor='mm')
    f2 = ImageFont.truetype(FONT, int(n * .045)); d.text((c, c + n * .14), 'MİRAS FC', font=f2, fill=GOLD, anchor='mm')
    f3 = ImageFont.truetype(FONT, int(n * .02)); d.text((c, c + n * .19), 'A FOOTBALL LIFE', font=f3, fill=(216, 226, 220), anchor='mm')
    f4 = ImageFont.truetype(FONT, int(n * .014)); d.text((c, c + n * .3), 'SARDUR TECHNOLOGIES  ·  SERHAT TUTAK', font=f4, fill=(139, 157, 148), anchor='mm')
    return im
icon().save(os.path.join(IOS, 'AppIcon.appiconset', 'AppIcon-512@2x.png'))
icon().save(os.path.join(H, 'icon-1024.png'))
sp = splash()
for nm in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']: sp.save(os.path.join(IOS, 'Splash.imageset', nm))
print('ok')

"""App Store tanıtım görselleri: tools/shots.py ile alınan ham ekranları başlıklı,
telefon çerçeveli 1290x2796 (iPhone 6.9") görsellere dönüştürür.
Kullanım: python3 tools/storeshots.py raw_dir out_dir tr|en"""
import sys, os, html
from playwright.sync_api import sync_playwright

raw, out, lang = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), sys.argv[3]
os.makedirs(out, exist_ok=True)

SLIDES = {
    'tr': [
        ('02_child', 'BİR FUTBOL HAYAT SİMÜLASYONU', 'Doğumdan|son düdüğe', 'İlk topundan son maçına kadar bir hayatın tamamı senin elinde.'),
        ('07a_aim', 'SAHADA', 'Oku çek,|golü sen at', 'Pas, şut, çalım: her pozisyonu parmağınla oynarsın.'),
        ('07a_aim_after', 'VURUŞ ANI', 'Topa bas,|falsoyu ver', 'Ortasına bas sert ve isabetli, kenarına bas kavisli.'),
        ('03_childyears', 'KARARLAR', 'Her seçimin|bir bedeli var', 'Doğru cevap yok. Aile, para, hırs ve sadakat arasında sen seçersin.'),
        ('08_life', 'SAHA DIŞI', 'Aile, aşk|ve servet', 'Saha dışındaki hayatın da kariyerin kadar gerçek.'),
        ('10_coach', 'TEKNİK DİREKTÖR', 'Kramponları as,|takımı yönet', 'Taktik, kadro, basın toplantısı ve yönetim kurulu baskısı.'),
        ('LEGACY', 'MİRAS', 'Geriye ne|bırakacaksın?', 'Her hayat Miras Salonu’na yazılır. Kartını paylaş.'),
    ],
    'en': [
        ('02_child', 'A FOOTBALL LIFE SIM', 'From birth to|the final whistle', 'One whole life, from your first ball to your last match.'),
        ('07a_aim', 'ON THE PITCH', 'Pull the arrow,|score the goal', 'Pass, shoot and dribble: you play every chance with your finger.'),
        ('07a_aim_after', 'THE STRIKE', 'Tap the ball,|bend it in', 'Hit the middle for power, the edge for curl.'),
        ('03_childyears', 'CHOICES', 'Every choice|has a price', 'No right answers. Family, money, ambition or loyalty: you decide.'),
        ('08_life', 'OFF THE PITCH', 'Family, love|and fortune', 'Your life off the pitch is as real as your career.'),
        ('10_coach', 'MANAGER', 'Hang up your boots,|run the club', 'Tactics, squad, press conferences and a restless board.'),
        ('LEGACY', 'LEGACY', 'What will you|leave behind?', 'Every life enters the Hall of Legacy. Share your card.'),
    ],
}

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@500;600&display=swap');
:root { --gold:#e8c468; --gold2:#b8902f; --tx:#eef3ef; --mut:#9fb3a8; --bg1:#0e2a1b; --bg2:#06110b; }
* { box-sizing:border-box; margin:0; padding:0; }
html,body { width:1290px; height:2796px; overflow:hidden; background:var(--bg2); }
.s { position:relative; width:1290px; height:2796px; overflow:hidden;
  background: radial-gradient(1100px 900px at 50% 1500px, rgba(232,196,104,.16), transparent 70%),
              linear-gradient(180deg, var(--bg1) 0%, #0a1f14 40%, var(--bg2) 100%); }
.pitch { position:absolute; inset:0; opacity:.10; }
.stripes { position:absolute; inset:0; background: repeating-linear-gradient(180deg, rgba(255,255,255,.025) 0 140px, transparent 140px 280px); }
.cap { position:absolute; left:96px; right:96px; top:150px; z-index:3; }
.eb { font:700 40px/1 'Barlow Condensed', sans-serif; letter-spacing:.22em; color:var(--gold); display:flex; align-items:center; gap:22px; }
.eb::before { content:''; width:64px; height:5px; background:var(--gold); border-radius:3px; }
h1 { margin-top:30px; font:800 124px/0.94 'Barlow Condensed', sans-serif; color:var(--tx); text-transform:uppercase; letter-spacing:-.005em; }
h1 span { display:block; white-space:nowrap; } h1 .g { color:var(--gold); }
p { margin-top:30px; font:500 44px/1.32 'Barlow', sans-serif; color:var(--mut); max-width:1040px; }
.ph { position:absolute; left:50%; width:1000px; transform:translateX(-50%); top:900px; z-index:2;
  border-radius:128px; padding:24px; background:linear-gradient(145deg,#2a302c,#0b0e0c 40%,#1c211e);
  box-shadow: 0 0 0 3px rgba(255,255,255,.08) inset, 0 60px 140px rgba(0,0,0,.65), 0 0 120px rgba(232,196,104,.10); }
.ph .scr { width:952px; border-radius:104px; overflow:hidden; background:#0b1611; }
.ph .scr img { display:block; width:952px; }
.sb { height:118px; display:flex; align-items:center; justify-content:space-between; padding:14px 78px 0 96px; color:#eef3ef; font:600 40px 'Barlow', sans-serif; }
.sb i { font-style:normal; letter-spacing:6px; font-size:30px; }
.ph .isl { position:absolute; top:46px; left:50%; transform:translateX(-50%); width:250px; height:72px; border-radius:40px; background:#000; }
.ph .shade { position:absolute; inset:24px; border-radius:104px; box-shadow: inset 0 0 0 2px rgba(0,0,0,.6); pointer-events:none; }
.brand { position:absolute; right:96px; top:160px; z-index:3; width:120px; height:136px; background:var(--gold);
  clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%); display:grid; place-items:center; }
.brand b { width:104px; height:120px; background:#0b1f15; clip-path:inherit; display:grid; place-items:center; color:var(--gold);
  font:800 58px 'Barlow Condensed'; padding-bottom:16px; }
/* miras slaytı */
.ph.small { width:820px; left:auto; right:-40px; transform:rotate(6deg); top:1020px; border-radius:110px; padding:20px; }
.ph.small img { width:780px; border-radius:92px; }
.card { position:absolute; left:70px; top:1180px; width:860px; z-index:4; transform:rotate(-5deg);
  border-radius:26px; box-shadow:0 60px 140px rgba(0,0,0,.7), 0 0 0 3px rgba(232,196,104,.55); }
.spark { position:absolute; z-index:5; color:var(--gold); font:800 64px 'Barlow Condensed'; }
"""

PITCH = """<svg class="pitch" viewBox="0 0 1290 2796" preserveAspectRatio="none"><g fill="none" stroke="#e8c468" stroke-width="5">
<circle cx="645" cy="2230" r="330"/><line x1="0" y1="2230" x2="1290" y2="2230"/><circle cx="645" cy="2230" r="10" fill="#e8c468"/>
<rect x="245" y="-10" width="800" height="300"/></g></svg>"""


def slide(key, eb, head, sub):
    a, b = head.split('|')
    h = f'<div class="cap"><div class="eb">{html.escape(eb)}</div><h1><span>{html.escape(a)}</span><span class="g">{html.escape(b)}</span></h1><p>{html.escape(sub)}</p></div>'
    if key == 'LEGACY':
        body = (f'<div class="ph small"><img src="file://{raw}/11_hall.png"></div>'
                f'<img class="card" src="file://{raw}/12_card.png">'
                '<div class="spark" style="left:60px;top:1060px">✦</div><div class="spark" style="left:110px;top:2480px;font-size:44px">✦</div>')
    else:
        body = f'<div class="ph" id="ph"><div class="scr"><div class="sb"><span>9:41</span><i>▂▄▆ ◔ ▮</i></div><img src="file://{raw}/{key}.png"></div><div class="isl"></div><div class="shade"></div></div>'
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="s"><div class="stripes"></div>{PITCH}{h}{body}</div></body></html>'


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1290, 'height': 2796}, device_scale_factor=1)
    for i, (key, eb, head, sub) in enumerate(SLIDES[lang], 1):
        f = os.path.join(out, f'_s{i}.html')
        open(f, 'w').write(slide(key, eb, head, sub))
        pg.goto('file://' + f); pg.wait_for_timeout(900)
        pg.evaluate("document.fonts.ready")
        pg.evaluate("()=>{ const h=document.querySelector('h1'); let f=124; while(f>80 && [...h.children].some(x=>x.scrollWidth>h.clientWidth)){ f-=4; h.style.fontSize=f+'px'; } }")
        pg.evaluate("()=>{ const c=document.querySelector('.cap'), ph=document.getElementById('ph'); if(c&&ph){ ph.style.top=(c.getBoundingClientRect().bottom+80)+'px'; } }")
        name = os.path.join(out, f'MirasFC_{lang.upper()}_{i}.png')
        pg.screenshot(path=name); os.remove(f); print(name)
    b.close()

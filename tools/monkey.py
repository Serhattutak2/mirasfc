"""Maymun testi: gerçek tarayıcıda görünür butonlara rastgele basar, sayfa hatalarını ve
"tıklandı ama hiçbir şey değişmedi" durumlarını raporlar.
Kullanım: python3 tools/monkey.py index.html 3000"""
import sys, random, json
from playwright.sync_api import sync_playwright
src, N = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 2000
FF = sys.argv[3] if len(sys.argv) > 3 else ''
errs, dead = [], {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    if FF:  # hızlı ileri: çocukluğu otomatik geç, istenen faza gel
        pg.evaluate('''(ff)=>{nw(1);document.getElementById('nn').value='Test Kişi';mk();
          let k=0;while(g.phase==='child'&&k++<40){if(g.q)answerQ(0);while(g.ev)choose(0);if(g.q)answerQ(0);childYear();}
          if(scr==='offers')sign(0); if(scr==='num')pickNum(freeNum(g.sq[g.club.id],g.pos));
          if(ff==='coach'||ff==='own'){g.money+=200000;retire(1);g.lic=4;if(ff==='own'){buyClub(buyList()[0].id);} else {coachLook();if(g.cof&&g.cof.length)coachSign(0);} }
          scr='game';sv();draw();}''', FF)
    for i in range(N):
        try:
            # metin girdilerini doldur
            pg.evaluate("document.querySelectorAll('input').forEach(i=>{if(!i.value&&!i.hidden)i.value='Test Kişi'})")
            btns = pg.evaluate("""[...document.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null).map((b,i)=>{b.dataset.mk=i;return [i,b.textContent.trim().slice(0,40)]})""")
            if not btns: pg.evaluate("typeof menu==='function'&&menu()"); continue
            # sahne açıksa sürükle
            if pg.evaluate("!!document.getElementById('cv')") and random.random() < .6:
                bb = pg.locator('#cv').bounding_box()
                if bb:
                    x0, y0 = bb['x'] + bb['width'] * random.uniform(.3, .7), bb['y'] + bb['height'] * random.uniform(.6, .9)
                    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + random.uniform(-80, 80), y0 - random.uniform(20, 200), steps=5); pg.mouse.up()
                    pg.wait_for_timeout(random.choice([50, 400, 1500]))
            bad = ('Sil', 'Menü')
            choices = [x for x in btns if not any(x[1].startswith(t) for t in bad)] or btns
            k, label = random.choice(choices)
            SNAP = "document.getElementById('app').innerHTML.length+':'+((typeof g!=='undefined'&&g)?JSON.stringify(g).length:0)+':'+document.getElementById('toast').textContent+document.getElementById('toast').hidden"
            pg.evaluate("document.getElementById('toast').textContent='';document.getElementById('toast').hidden=true")
            before = pg.evaluate(SNAP)
            pg.click(f'button[data-mk="{k}"]', timeout=2000)
            pg.wait_for_timeout(30)
            if pg.evaluate("!document.getElementById('dlg').hidden"):
                pg.click('#dlg .dlg-ok' if random.random() < .7 else '#dlg .btn.ghost', timeout=1000)
            after = pg.evaluate(SNAP)
            if before == after: dead[label] = dead.get(label, 0) + 1
        except Exception as e:
            errs.append('PW ' + str(e)[:200])
    state = pg.evaluate("(typeof g!=='undefined'&&g)?{age:g.age,phase:g.phase,scr}:null")
    b.close()
print(json.dumps({'errors': len(errs), 'sample': list(dict.fromkeys(errs))[:12], 'noEffectButtons': sorted(dead.items(), key=lambda x: -x[1])[:25], 'end': state}, ensure_ascii=False, indent=1))

"""İngilizce modda rastgele oynar, ekranda çevrilmemiş (Türkçe görünen) metinleri toplar.
Kullanım: python3 tools/i18n_scan.py index.html 1500 [pro|coach|own] [shotdir]"""
import sys, random, json, re
from playwright.sync_api import sync_playwright
src, N = sys.argv[1], int(sys.argv[2])
FF = sys.argv[3] if len(sys.argv) > 3 else ''
SHOT = sys.argv[4] if len(sys.argv) > 4 else ''
errs, found = [], {}
TRW = re.compile(r"[çğışöüÇĞİŞÖÜâ]|\b(ve|bir|için|yıl|sen|ile|daha|gibi|kulüp|maç|hafta|olarak|değil|var|yok|sezon|takım|oyuncu|Yeni|Kayıt|Devam)\b")
GRAB = """()=>{const out=[];for(const id of ['app','nav','dlg','toast']){const r=document.getElementById(id);if(!r||r.hidden)continue;
 const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const t=n.nodeValue.trim();if(t.length>1)out.push(t)}}return out}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.goto('file://' + src); pg.evaluate("localStorage.clear();localStorage.setItem('mfc_acct',JSON.stringify({lang:'en'}))"); pg.reload(); pg.wait_for_timeout(300)
    if SHOT: pg.screenshot(path=SHOT + '/en_menu.png')
    if FF:
        pg.evaluate('''(ff)=>{nw(1);document.getElementById('nn').value='Test Kid';mk();
          let k=0;while(g.phase==='child'&&k++<40){if(g.q)answerQ(0);while(g.ev)choose(0);if(g.q)answerQ(0);childYear();}
          if(scr==='offers')sign(0); if(scr==='num')pickNum(freeNum(g.sq[g.club.id],g.pos));
          if(ff==='coach'||ff==='own'){g.money+=200000;retire(1);g.lic=4;if(ff==='own'){buyClub(buyList()[0].id);} else {coachLook();if(g.cof&&g.cof.length)coachSign(0);} }
          scr='game';sv();draw();}''', FF)
    shots = 0
    for i in range(N):
        try:
            for t in pg.evaluate(GRAB):
                if TRW.search(t): found[t] = found.get(t, 0) + 1
            if SHOT and i % 150 == 0 and shots < 10:
                pg.screenshot(path=f'{SHOT}/en_{FF or "x"}_{shots}.png'); shots += 1
            pg.evaluate("document.querySelectorAll('input').forEach(i=>{if(!i.value&&!i.hidden&&i.type!=='range')i.value='Test Kid'})")
            btns = pg.evaluate("""[...document.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null).map((b,i)=>{b.dataset.mk=i;return [i,b.textContent.trim().slice(0,40)]})""")
            if not btns: pg.evaluate("typeof menu==='function'&&menu()"); continue
            if pg.evaluate("!!document.getElementById('cv')") and random.random() < .6:
                bb = pg.locator('#cv').bounding_box()
                if bb:
                    x0, y0 = bb['x'] + bb['width'] * random.uniform(.3, .7), bb['y'] + bb['height'] * random.uniform(.6, .9)
                    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + random.uniform(-80, 80), y0 - random.uniform(20, 200), steps=5); pg.mouse.up()
                    pg.wait_for_timeout(random.choice([50, 400]))
            bad = ('Delete', 'Menu', 'Türkçe')
            choices = [x for x in btns if not any(t in x[1] for t in bad)] or btns
            k, label = random.choice(choices)
            pg.click(f'button[data-mk="{k}"]', timeout=2000); pg.wait_for_timeout(20)
            if pg.evaluate("!document.getElementById('dlg').hidden"):
                for t in pg.evaluate(GRAB):
                    if TRW.search(t): found[t] = found.get(t, 0) + 1
                pg.click('#dlg .dlg-ok' if random.random() < .7 else '#dlg .btn.ghost', timeout=1000)
        except Exception as e:
            errs.append('PW ' + str(e)[:200])
    b.close()
print(json.dumps({'errors': len(errs), 'sample': list(dict.fromkeys(errs))[:8]}, ensure_ascii=False))
for t, n in sorted(found.items(), key=lambda x: -x[1]): print(n, '|', t[:200])

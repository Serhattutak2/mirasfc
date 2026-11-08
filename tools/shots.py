"""App Store için ham oyun ekranları: gerçek tarayıcıda oyunu belirli anlara getirip
iPhone 6.9" çözünürlüğünde (430x932 @3x = 1290x2796) yakalar.
Kullanım: python3 tools/shots.py index.html out_dir [tr|en]"""
import sys, os
from playwright.sync_api import sync_playwright
src, out = os.path.abspath(sys.argv[1]), sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'tr'
os.makedirs(out, exist_ok=True)
errs = []
FF = '''(ff)=>{ nw(1); document.getElementById('nn').value = ff.name; mk();
  let k=0; while(g.phase==='child'&&k++<40){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); }
  if(scr==='offers') sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos));
  scr='game'; sv(); draw(); }'''


def page(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=3, locale=('tr-TR' if lang == 'tr' else 'en-US'))
    pg.add_init_script('(()=>{ let s=' + os.environ.get('SEED', '7') + '>>>0; Math.random=function(){ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; })()')
    pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.goto('file://' + src)
    pg.evaluate("localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(400)
    pg.evaluate("(l)=>{ try{ setLang(l) }catch(e){} }", lang)
    pg.evaluate("()=>{ try{ tutEnd(0); }catch(e){} try{ const A=acct(); A.sub=1; A.tok=640; acctSave(); }catch(e){} try{ menu(); }catch(e){} }")
    pg.wait_for_timeout(300)
    return b, pg


def snap(pg, name, full=False, keep_scroll=False):
    pg.evaluate("()=>{const t=document.getElementById('toast'); if(t){t.hidden=true;} const u=document.getElementById('tut'); if(u) u.hidden=true;}")
    pg.wait_for_timeout(500)
    if not keep_scroll: pg.evaluate("window.scrollTo(0,0)")
    pg.screenshot(path=os.path.join(out, name + '.png'), full_page=False)
    print('shot', name)


CHILD = """(n)=>{ nw(1); document.getElementById('nn').value=n; mk(); }"""
STEPS = [
    ('01_menu', None),
    ('02_child', CHILD),
    ('03_childyears', "()=>{ for(let k=0;k<6&&g.phase==='child';k++){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); } draw(); }"),
    ('04_week', "()=>{ let k=0; while(g.phase==='child'&&k++<40){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); } if(scr==='offers') sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); scr='game'; sv(); draw(); }"),
    ('05_matchcard', "()=>{ let k=0; while(k++<12){ while(g.ev)choose(0); if(g.q)answerQ(0); if(nextWeekMatch()) break; if(g.wstage) { weekEnd(); } weekStart(); } scr='game'; tab='hafta'; draw(); }"),
    ('06_match', "()=>{ const m=nextWeekMatch(); g.cur={ci:g.wq[0], sel:{start:1, off:90}}; playMatch(); }", 800),
    ('07_scene', "()=>{ const i=M.mom.findIndex((m,k)=>k>=M.mi&&(m.type==='atk'||m.type==='build')); if(i>M.mi){ const t=M.mom.splice(i,1)[0]; M.mom.splice(M.mi,0,t); } nextMoment(); }", 2200),
    ('07a_aim', 'AIM', 0),
    ('07c_daily', "()=>{ try{ cancelAnimationFrame(RAF); }catch(e){} try{ simRest(); matchDone(); }catch(e){} scr='game'; while(g.ev)choose(0); M=null; S=null; setTab('hafta'); window.scrollTo(0,0); const D=dpAcct(); D.streak=4; D.lastN=dpDayNum()-1; acctSave(); draw(); }"),
    ('07d_dplay', "()=>{ dpStart(); }", 1400),
    ('08_life', "()=>{ try{ cancelAnimationFrame(RAF); }catch(e){} try{ M=null; S=null; }catch(e){} scr='game'; while(g.ev)choose(0); setTab('life'); }"),
    ('09_awards', "()=>{ try{ AD_SIM=1; simWeeks(60); }catch(e){} AD_SIM=0; let k=0; while(scr!=='game'&&k++<30){ try{ if(scr==='season'){ if(g.ev)choose(0); else if(g.q)answerQ(0); else seasonCont(); } else if(scr==='offers') declineOffers(); else if(scr==='match'){simRest();matchDone();} else if(scr==='tour'){quickTour();} else if(scr==='tourinv'){tourAccept(0);} else break; }catch(e){break;} } if(g.lastSeason&&g.lastSeason.aw) awOpen(); }", 2500),
    ('10_coach', "()=>{ try{ document.getElementById('aw') && (document.getElementById('aw').hidden=true); }catch(e){} scr='game'; g.money+=200000; retire(1); g.lic=4; coachLook(); if(g.cof&&g.cof.length) coachSign(0); scr='game'; while(g.ev)choose(0); sv(); setTab('coach'); }"),
]
if __name__ == '__main__':
    with sync_playwright() as p:
        b, pg = page(p)
        for st in STEPS:
            name, js = st[0], st[1]
            wait = st[2] if len(st) > 2 else 0
            try:
                if js == 'AIM':
                    box = pg.locator('canvas').first.bounding_box()
                    pos = pg.evaluate("()=>{ try{ const cv=document.querySelector('canvas'); const r=cv.getBoundingClientRect(); const me=S.pl.find(p=>p.me)||S.pl.find(p=>p.has); const P=(typeof P3==='function')?P3(me.x,me.y,0):null; return P?[r.left+P[0]*r.width/cv.width, r.top+P[1]*r.height/cv.height]:null; }catch(e){ return null } }")
                    x0, y0 = pos if pos else (165, 567)
                    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + 60, y0 - 150, steps=8); pg.mouse.move(x0 + 95, y0 - 235, steps=8)
                    pg.wait_for_timeout(400); snap(pg, name); pg.mouse.up(); pg.wait_for_timeout(int(os.environ.get('TAPWAIT','900'))); snap(pg, name + '_after'); continue
                if js:
                    if js.startswith('(n)'): pg.evaluate(js, 'Kerem Aksoy')
                    else: pg.evaluate(js)
                if wait: pg.wait_for_timeout(wait)
                snap(pg, name)
                print('  scr=', pg.evaluate("typeof scr!=='undefined'?scr:''"))
            except Exception as e:
                print('FAIL', name, str(e)[:200])
        # Hayatının Filmi (mevcut hayattan) ve Senaryo menüsü
        try:
            pg.evaluate("()=>{ window.scrollTo(0,0); filmOpenCurrent(); }"); pg.wait_for_timeout(1500)
            pg.evaluate("()=>{ filmStep(2); }"); pg.wait_for_timeout(300)
            snap(pg, '13_film')
            import base64 as _b
            fu = pg.evaluate("()=>FILMURLS")
            for i, u in enumerate(fu): open(os.path.join(out, f'film_{i+1}.png'), 'wb').write(_b.b64decode(u.split(',')[1]))
            pg.evaluate("()=>{ filmClose(); }")
        except Exception as e: print('FAIL film', e)
        pg.evaluate("()=>{ try{ sv(); }catch(e){} menu(); window.scrollTo(0,0); const A=acct(); A.scen={harika:3,bag:2,dans:1}; acctSave(); menu(); const el=document.querySelector('.scmenu'); if(el) window.scrollTo(0, el.getBoundingClientRect().top+window.scrollY-110); }")
        snap(pg, '14_scen', keep_scroll=True)
        # Miras Salonu: test botunun oynadığı gerçek hayatlar (isimler çeşitlendirildi)
        hall_file = os.environ.get('HALL_JSON')
        if hall_file:
            import json, base64
            hall = json.load(open(hall_file)).get('hall', [])
            names = ['Kerem Aksoy', 'Emre Yalın', 'Deniz Kara', 'Arda Tunç', 'Mert Ilgaz', 'Can Ertan', 'Ozan Demir', 'Burak Sel', 'Efe Kılıç', 'Tolga Aydın', 'Umut Er']
            if lang == 'en': names = ['Kerem Aksoy', 'Leo Carter', 'Marco Silva', 'Jonas Berg', 'Luca Romano', 'Ethan Hale', 'Diego Ruiz', 'Noah Price', 'Sam Cole', 'Theo Grant', 'Max Weber']
            kidn = ['Ela', 'Kaan', 'Zeynep', 'Aras'] if lang == 'tr' else ['Mia', 'Leo', 'Ava', 'Sam']
            for i, e in enumerate(hall):
                e['n'] = names[i % len(names)]; e['key'] = e['n'] + '|' + str(i)
                if e.get('fm') and e['fm'].get('k'): e['fm']['k'] = kidn[:len(e['fm']['k'])]
            pg.evaluate("(h)=>{ const A=acct(); A.hall=h; acctSave(); try{ if(typeof M!=='undefined'&&M){cancelAnimationFrame(RAF);} }catch(e){} hallOpen(); }", hall)
            snap(pg, '11_hall')
            best = max(hall, key=lambda e: e.get('mp', 0))
            data = pg.evaluate("(e)=>{ const c=cardCanvas(e); return c? c.toDataURL('image/png'):'' }", best)
            if data:
                open(os.path.join(out, '12_card.png'), 'wb').write(base64.b64decode(data.split(',')[1])); print('shot 12_card')
            fu = pg.evaluate("async (e)=>{ await filmOpen(e); const u=FILMURLS.slice(); filmClose(); return u; }", best)
            for i, u in enumerate(fu): open(os.path.join(out, f'hfilm_{i+1}.png'), 'wb').write(base64.b64decode(u.split(',')[1]))
            print('hall film frames', len(fu))
        b.close()
    print('errors:', errs[:5])

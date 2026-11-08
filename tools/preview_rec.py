"""App Preview çekimi: oyunu gerçek tarayıcıda oynatıp video kaydeder ve sahne
sınırlarını (saniye) JSON olarak yazar. tools/preview_make.py bunları kesip
başlıklarla birleştirir.
Kullanım: python3 tools/preview_rec.py index.html out_dir tr|en"""
import sys, os, json, time, random, glob
from playwright.sync_api import sync_playwright
src, out, lang = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
VW, VH = 443, 960
SEED = os.environ.get('SEED', '3')
CHILD = """()=>{ nw(1); document.getElementById('nn').value='Kerem Aksoy'; mk(); }"""
TO_PRO = """()=>{ let k=0; while(g.phase==='child'&&k++<40){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); }
 if(scr==='offers') sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); g.age=21; for(const k of K) g.st[k]=Math.max(g.st[k],74); g.loanSureDone=1; g.ev=null; g.q=null; UNDO=null; scr='game'; sv(); draw(); }"""
MATCH = """(want)=>{ homeCallAccept=()=>{}; let k=0; while(k++<20){ while(g.ev)choose(0); if(g.q)answerQ(0); if(nextWeekMatch()) break; if(g.wstage) weekEnd(); weekStart(); if(scr!=='game'){ if(scr==='offers') declineOffers(); scr='game'; } }
 g.cur={ci:g.wq[0], sel:{start:1,off:90}}; playMatch(); const i=M.mom.findIndex(m=>m.type===want); const mo=i>=0?M.mom.splice(i,1)[0]:{...M.mom[0],type:want}; M.mom.splice(M.mi,0,mo); g.of=[]; scr='match'; nextMoment(); if(scr!=='match'){ scr='match'; draw(); } }"""


def main():
    T = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, locale='tr-TR' if lang == 'tr' else 'en-US',
                            record_video_dir=out, record_video_size={'width': VW * 2, 'height': VH * 2})
        pg = ctx.new_page()
        pg.add_init_script('(()=>{ let s=' + SEED + '>>>0; const r=()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; Math.random=r; })()')
        t0 = time.time(); mark = lambda k: T.__setitem__(k, round(time.time() - t0, 2))
        pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
        pg.evaluate("(l)=>{ try{ setLang(l) }catch(e){} try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tok=640; A.tutMatch=1; acctSave(); menu(); }", lang)
        pg.wait_for_timeout(600)
        # 1) çocukluk hikâyesi
        pg.evaluate(CHILD); pg.wait_for_timeout(300); mark('child0')
        pg.wait_for_timeout(1600)
        pg.evaluate("()=>{ for(let k=0;k<4&&g.phase==='child';k++){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); } draw(); }")
        pg.wait_for_timeout(200)
        for y in range(0, 700, 35): pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(45)
        pg.wait_for_timeout(500); mark('child1')
        # 2) karar anı (olay kartı)
        pg.evaluate("()=>{ window.scrollTo(0,0); for(let k=0;k<3&&g.phase==='child'&&!g.ev;k++){ if(g.q)answerQ(0); childYear(); } draw(); window.scrollTo(0,0); }")
        pg.wait_for_timeout(200); mark('ev0'); pg.wait_for_timeout(2400); mark('ev1')
        # 3) maç: ok çek, topa bas, gol
        pg.evaluate(TO_PRO); print('pro', pg.evaluate("()=>[scr,g.phase,g.club&&g.club.n]")); pg.evaluate(MATCH, 'one'); print('match', pg.evaluate("()=>[scr,!!M,!!S,M&&M.stage,document.querySelectorAll('canvas').length, document.getElementById('app').innerText.slice(0,300)]")); pg.wait_for_timeout(700); mark('m0')
        cv = pg.locator('canvas').first.bounding_box()
        def stick(dx, dy, hold=500):
            x0, y0 = cv['x'] + cv['width'] * .5, cv['y'] + cv['height'] * .62
            pg.mouse.move(x0, y0); pg.mouse.down()
            for i in range(1, 13): pg.mouse.move(x0 + dx * i / 12, y0 + dy * i / 12); pg.wait_for_timeout(30)
            pg.wait_for_timeout(hold); pg.mouse.up()
        def aim_goal(power=1.0):
            v = pg.evaluate("()=>{ const s=S, car=s.car, P=P3(car.x,car.y,0), G=P3(34+(car.x<34?1.6:-1.6),GY,0), r=document.querySelector('canvas').getBoundingClientRect(), k=r.width/CV.W; return [ (G.X-P.X)*k, (G.Y-P.Y)*k ]; }")
            L = (v[0] ** 2 + v[1] ** 2) ** .5 or 1; d = min(150, 70 + L * .25) * power
            stick(v[0] / L * d, v[1] / L * d, 650)
        def tap(good=True):
            for _ in range(60):
                b2 = pg.evaluate("()=>{ if(!S||S.phase!=='tap') return null; const b=tpBall(S.t), cv=document.querySelector('canvas'), r=cv.getBoundingClientRect(), k=r.width/CV.W; return {x:r.left+b.x*k, y:r.top+b.y*k, u:b.u, R:tpR()*k}; }")
                if b2 and b2['u'] > .5:
                    pg.mouse.click(b2['x'] + (b2['R'] * .5 if not good else b2['R'] * .08), b2['y'] - b2['R'] * .05); return
                pg.wait_for_timeout(50)
        pg.wait_for_timeout(600)
        ph = pg.evaluate("S&&S.phase")
        def play(power, good):
            for _ in range(5):
                for __ in range(40):
                    ph = pg.evaluate("S&&S.phase")
                    if ph in ('draw', 'done', None): break
                    pg.wait_for_timeout(100)
                if ph != 'draw': break
                aim_goal(power); tap(good); pg.wait_for_timeout(900)
            pg.wait_for_timeout(2600)
        play(1.0, True); mark('m1')
        res = pg.evaluate("S&&S.banner&&S.banner.t"); print('one ->', res)
        # 4) serbest vuruş
        pg.evaluate("()=>{ try{ sceneContinue(); }catch(e){} }"); pg.wait_for_timeout(200)
        pg.evaluate("()=>{ const i=M.mom.findIndex((m,k)=>k>=M.mi&&m.type==='fk'); const mo=i>=0?M.mom.splice(i,1)[0]:{...M.mom[M.mi]||{min:70},type:'fk'}; M.mom.splice(M.mi,0,mo); nextMoment(); }")
        pg.wait_for_timeout(900); mark('fk0'); play(.9, False); mark('fk1')
        print('fk ->', pg.evaluate("S&&S.banner&&S.banner.t"))
        pg.evaluate("()=>{ try{ cancelAnimationFrame(RAF); }catch(e){} try{ simRest(); matchDone(); }catch(e){} scr='game'; while(g.ev)choose(0); setTab('hafta'); window.scrollTo(0,0); }")
        # 5) günün pozisyonu kartı
        pg.wait_for_timeout(300); mark('dp0'); pg.wait_for_timeout(2200); mark('dp1')
        # 6) yaşam / finans
        pg.evaluate("()=>{ g.money+=250000; setTab('life'); window.scrollTo(0,0); }"); pg.wait_for_timeout(300); mark('life0')
        for y in range(0, 500, 30): pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(50)
        pg.wait_for_timeout(400); mark('life1')
        # 7) teknik direktör
        pg.evaluate("()=>{ scr='game'; g.money+=200000; retire(1); g.lic=4; coachLook(); if(g.cof&&g.cof.length) coachSign(0); scr='game'; while(g.ev)choose(0); sv(); setTab('coach'); window.scrollTo(0,0); }")
        pg.wait_for_timeout(300); mark('co0')
        for y in range(0, 420, 30): pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(55)
        pg.wait_for_timeout(500); mark('co1')
        # 8) hayatının filmi
        pg.evaluate("()=>{ window.scrollTo(0,0); filmOpenCurrent(); }"); pg.wait_for_timeout(1500); mark('fl0')
        for _ in range(4): pg.evaluate("filmStep(1)"); pg.wait_for_timeout(750)
        pg.wait_for_timeout(500); mark('fl1')
        ctx.close(); b.close()
    vids = sorted(glob.glob(os.path.join(out, '*.webm')), key=os.path.getmtime)
    json.dump({'marks': T, 'video': vids[-1]}, open(os.path.join(out, 'marks.json'), 'w'), indent=1)
    print(T, vids[-1])


main()

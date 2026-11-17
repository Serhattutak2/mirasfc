"""Bot gerçek tarayıcıda oynar, her adımda kare alır + olay günlüğü. python3 tools/play.py index.html out type [n]"""
import sys, os, random, json
from playwright.sync_api import sync_playwright
src, out, typ = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]; os.makedirs(out, exist_ok=True)
NS = int(sys.argv[4]) if len(sys.argv) > 4 else 1
T = open('tools/enginetest.py').read(); g = lambda k: T.split(k + ' = """')[1].split('"""')[0]
SETUP, NEXT, DRIVE = g('SETUP'), g('NEXT'), g('DRIVE')
LOG = "()=>{const s=S; if(!s) return null; return {ph:s.phase, t:+s.t.toFixed(2), car:s.car&&[+(s.car.x).toFixed(1),+(s.car.y).toFixed(1), s.car===s.me], ball:[+s.ball.x.toFixed(1),+s.ball.y.toFixed(1),+((s.ball.z||0).toFixed(1))], fl:s.flash&&s.flash.txt, ban:s.banner&&(s.banner.txt||s.banner), n:s.n, msg:(s.msg||'').slice(0,60), ops:s.P.filter(p=>p.side==='th'&&!p.gk).map(p=>[+p.x.toFixed(1),+p.y.toFixed(1)]), us:s.P.filter(p=>p.side==='us'&&!p.gk).map(p=>[+p.x.toFixed(1),+p.y.toFixed(1)])}}"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, locale='tr-TR')
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tutMatch=1; A.lang='tr'; acctSave(); }"); pg.evaluate(SETUP)
    logs = []
    for sc in range(NS):
        pg.evaluate(NEXT, typ); fr = 0
        for k in range(120):
            r = pg.evaluate(DRIVE, random.random()); L = pg.evaluate(LOG)
            if L: L['act'] = r.get('act'); logs.append(L)
            if k % 2 == 0: pg.screenshot(path=f'{out}/{sc}_{fr:03d}.png'); fr += 1
            if not L or L['ph'] == 'done' or r.get('ph') == 'done': break
            pg.wait_for_timeout(180)
        pg.screenshot(path=f'{out}/{sc}_{fr:03d}.png')
    json.dump(logs, open(f'{out}/log.json', 'w'), ensure_ascii=False)
    print('errors', errs[:4]); b.close()

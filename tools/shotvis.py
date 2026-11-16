"""Şut uçuşu görsel testi: belirli şutları gerçek motorda atar, kareleri kaydeder.
Kullanım: python3 tools/shotvis.py index.html out_dir"""
import sys, os, json
from playwright.sync_api import sync_playwright
src, out = os.path.abspath(sys.argv[1]), sys.argv[2]; os.makedirs(out, exist_ok=True)
T = open(os.path.join(os.path.dirname(__file__), 'enginetest.py')).read()
SETUP = T.split('SETUP = """')[1].split('"""')[0]; NEXT = T.split('NEXT = """')[1].split('"""')[0]
SHOTS = [('uzak25', 40, 80, 31.2, .2, None), ('yakin8', 37, 97, 31.5, 0, None), ('direk', 38, 92, 30.34 + .02, 0, 'post'), ('ust', 34, 76, 33, .6, 'over')]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tutMatch=1; acctSave(); }"); pg.evaluate(SETUP)
    for name, x, y, ax, oy, force in SHOTS:
        pg.evaluate(NEXT, 'atk'); pg.wait_for_timeout(900)
        info = pg.evaluate("""([x,y,ax,oy,force])=>{ const s=S; s.car=s.me; s.me.x=x; s.me.y=y; s.ball.owner=s.me; attach(); s.phase='aim'; s.P.filter(p=>p.side==='th'&&!p.gk).forEach((d,i)=>{d.x=8+i*3; d.y=60;});
          s.ball.x=x; s.ball.y=y; const id=gkIdeal(); if(id){s.gk.x=id.x; s.gk.y=id.y;}
          const _sr=shotResult; if(force){ shotResult=function(P,run){ for(let i=0;i<200;i++){ const r=_sr(P,run); if(r[force]) { shotResult=_sr; return r; } } shotResult=_sr; return _sr(P,run); }; }
          const P=[{x,y},{x:ax,y:105}]; launchPath(P,{k:'shot'},.65,oy,0); shotResult=_sr; const r=S.run&&S.run.res; return r?{goal:r.goal,save:r.save,post:r.post,over:r.over,wide:r.wide,x:+r.x.toFixed(2),z:+r.z.toFixed(2),v:+r.v.toFixed(1)}:null; }""", [x, y, ax, oy, force])
        print(name, info)
        for i in range(10):
            pg.wait_for_timeout(110); pg.screenshot(path=f'{out}/{name}_{i:02d}.png')
    print('errors', errs[:4]); b.close()

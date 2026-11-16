"""Şut fiziği istatistikleri: gerçek oyun kodunda (tarayıcı) shotResult ve blok
olasılığını mesafe/açı/nişan/vuruş kalitesine göre binlerce kez dener.
Kullanım: python3 tools/shotstats.py index.html [N]"""
import sys, os, json
from playwright.sync_api import sync_playwright
src = os.path.abspath(sys.argv[1]); N = int(sys.argv[2]) if len(sys.argv) > 2 else 400
SETUP = open(os.path.join(os.path.dirname(__file__), 'enginetest.py')).read().split('SETUP = """')[1].split('"""')[0]
NEXT = open(os.path.join(os.path.dirname(__file__), 'enginetest.py')).read().split('NEXT = """')[1].split('"""')[0]
STATS = """([N, cases])=>{
 const s=S, out=[]; const car=s.car;
 const defs=s.P.filter(p=>p.side==='th'&&!p.gk);
 for(const c of cases){
   let g=0,sv=0,w=0,o=0,po=0,bl=0, xs=[];
   for(let i=0;i<N;i++){
     s.type=c.type||'atk'; s.head=c.head?1:0; s.dead=0; s.car=car;
     car.x=c.x; car.y=c.y;
     /* savunma: c.def kişi şut yolunun yakınında */
     defs.forEach((d,j)=>{ if(j<(c.def||0)){ const t=(j+1)/((c.def||0)+1)*.55; d.x=car.x+(34-car.x)*t+(Math.random()-.5)*3; d.y=car.y+(104-car.y)*t; } else { d.x=5+j; d.y=40; } d.wallP=0; });
     s.gk.x=34; s.gk.y=104.3; s.gkOut=0; s.mode='atk'; s.ball.x=car.x; s.ball.y=car.y; const id=gkIdeal(); if(id){ s.gk.x=id.x; s.gk.y=id.y; } if(c.type==='pen'){ s.gk.x=34; s.gk.y=104.6; }
     const aimX = c.aim==='c'?34:c.aim==='near'?(car.x<34?GOAL_L+.6:GOAL_R-.6):(car.x<34?GOAL_R-.6:GOAL_L+.6);
     const P=[{x:car.x,y:car.y},{x:aimX+(Math.random()-.5)*.4,y:105}];
     const q = c.q!=null?c.q:Math.min(1,Math.max(0,.6+(Math.random()-.5)*.5));
     const run={P,L:plen(P),q,oy:c.oy||0,pw:c.pw||1};
     const dang=pDanger(P,'shot'); let blocked=false; for(const d of dang) if(Math.random()<d.p*.75*(1.15-q*.45)){blocked=true;break;}
     if(blocked){bl++;continue;}
     const r=shotResult(P,run);
     if(r.goal)g++; else if(r.save)sv++; else if(r.post)po++; else if(r.over)o++; else w++;
   }
   const n=N; if(!c._k){ c._k=1; } out.push({...c, kx:+s.gk.x.toFixed(1), ky:+s.gk.y.toFixed(1), goal:+(g/n*100).toFixed(1), save:+(sv/n*100).toFixed(1), block:+(bl/n*100).toFixed(1), wide:+(w/n*100).toFixed(1), over:+(o/n*100).toFixed(1), post:+(po/n*100).toFixed(1)});
 }
 return out; }"""
CASES = []
for D, lab in [(6, 'yakın 6m'), (9, 'yakın 9m'), (12, 'ceza içi 12m'), (16, 'ceza yayı 16m'), (20, 'uzak 20m'), (25, 'uzak 25m'), (30, 'çok uzak 30m')]:
    for aim in ['far', 'near', 'c']:
        CASES.append({'lab': lab, 'D': D, 'x': 34 + (3 if D < 10 else 6), 'y': 105 - D, 'aim': aim})
for D in [8, 12, 18, 25]:
    CASES.append({'lab': f'{D}m 1 savunmacı önde', 'D': D, 'x': 36, 'y': 105 - D, 'aim': 'far', 'def': 1})
CASES.append({'lab': 'dar açı 8m', 'D': 8, 'x': 48, 'y': 99, 'aim': 'far'})
CASES.append({'lab': 'penaltı', 'D': 11, 'x': 34, 'y': 94, 'aim': 'far', 'type': 'pen'})
CASES.append({'lab': 'serbest vuruş 22m', 'D': 22, 'x': 30, 'y': 83, 'aim': 'far', 'type': 'fk'})
CASES.append({'lab': 'kafa 7m', 'D': 7, 'x': 35, 'y': 98, 'aim': 'far', 'head': 1})
if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
        pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tutMatch=1; acctSave(); }")
        pg.evaluate(SETUP); pg.evaluate(NEXT, 'atk')
        pg.evaluate("()=>{ try{cancelAnimationFrame(RAF)}catch(e){} S.df=1; }")
        res = pg.evaluate(STATS, [N, CASES])
        print(f"{'durum':24} {'nişan':5} {'GOL':>5} {'kurt':>5} {'blok':>5} {'aut':>5} {'üst':>5} {'direk':>5}")
        for r in res:
            print(f"{r['lab']:24} {r['aim']:5} k({r['kx']},{r['ky']}) {r['goal']:5} {r['save']:5} {r['block']:5} {r['wide']:5} {r['over']:5} {r['post']:5}")
        json.dump(res, open(os.environ.get('OUT', '/dev/null'), 'w'), ensure_ascii=False)
        print('errors', errs[:3]); b.close()

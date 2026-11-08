"""Maç motoru oyun testi: gerçek tarayıcıda maç anlarını insan gibi (çubuk çekerek,
topa basarak, savunmada araya girerek) oynar; her an tipinin sonucunu, süresini
ve takılmaları raporlar, isteğe bağlı kare dizisi kaydeder.
Kullanım: python3 tools/enginetest.py index.html out_dir [an_sayısı] [kare_kaydet=0/1]"""
import sys, os, json, time, random
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
src, out = os.path.abspath(sys.argv[1]), sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 30
FRAMES = len(sys.argv) > 4 and sys.argv[4] == '1'
os.makedirs(out, exist_ok=True)

SETUP = """()=>{ nw(1); document.getElementById('nn').value='Test'; mk();
 let k=0; while(g.phase==='child'&&k++<40){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); }
 if(scr==='offers') sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); scr='game';
 /* orta seviye oyuncu: 21 yaş, genel ~70 */
 g.age=21; for(const k in g.st) g.st[k]=Math.max(g.st[k],70); g.loanSureDone=1; sv(); }"""

NEXT = """(want)=>{ try{ if(typeof M!=='undefined'&&M&&M.mom&&M.mi<M.mom.length&&scr==='match'){} else { let k=0; while(k++<20){ while(g.ev)choose(0); if(g.q)answerQ(0); if(nextWeekMatch()) break; if(g.wstage) weekEnd(); weekStart(); if(scr!=='game'){ if(scr==='offers') declineOffers(); scr='game'; } } g.cur={ci:g.wq[0], sel:{start:1,off:90}}; playMatch(); }
  if(want){ const i=M.mom.findIndex((m,k)=>k>=M.mi&&m.type===want); if(i>M.mi){ const t=M.mom.splice(i,1)[0]; M.mom.splice(M.mi,0,t);} else if(i<0){ M.mom.splice(M.mi,0,{...M.mom[M.mi], type:want}); } }
  if(M.mi>=M.mom.length) return 'over'; nextMoment(); return S?S.type:'none'; }catch(e){ return 'ERR '+e.message; } }"""

# insan gibi oynayan sürücü: her çağrıda sahnenin durumuna göre bir hamle yapar
DRIVE = """(rnd)=>{ const s=S; if(!s) return {ph:'none'};
 const r={ph:s.phase, t:s.t};
 const cv=document.querySelector('canvas'); const W=cv.getBoundingClientRect().width, H=cv.getBoundingClientRect().height;
 if(s.phase==='draw' && !s.stick && !s._busy){
   const car=s.car, sc=PR.sc, D=Math.hypot(GY-car.y, 34-car.x);
   let T=null, Lw=0;
   const head = s.head || s.type==='pen' || (s.type==='fk'&&s.dead);
   const p0=[W/2,H*.6];
   const tip=(T,Lw)=>{ const ux=T.x-car.x, uy=T.y-car.y, L=Math.hypot(ux,uy)||1, Lpx=Lw*sc/2.1; return [p0[0]+ux/L*Lpx, p0[1]-uy/L*Lpx]; };
   const risk=e=>1-(e.dang||[]).reduce((m,d)=>m*(1-d.p),1);
   let best=null;
   if(D<24 || head){ const side = rnd<.5?-1:1; T={x:34+side*(rnd<.8?2.4:0.5), y:GY}; Lw=Math.min(46, D*(0.75+rnd*.4)); r.act='shot'; best={p1:tip(T,Lw)}; }
   else { v5Down(p0[0],p0[1]); const cands=s.P.filter(p=>p.side==='us'&&p!==car&&!p.gk).map(p=>({T:{x:p.x,y:p.y+1.5}, Lw:Math.hypot(p.x-car.x,p.y-car.y)*1.05, prog:p.y-car.y, k:'pass'}));
     for(const a of [-1,0,1]) cands.push({T:{x:car.x+a*5,y:car.y+8}, Lw:9, prog:6, k:'drib'});
     for(const c of cands){ const p1=tip(c.T,c.Lw); v5Move(p1[0],p1[1]); const e=s.stick&&s.stick.e; if(!e||e.k==='none'||e.off) continue; const rk=risk(e); const sc2=(c.prog+8)*(1-rk)*(1-rk)+(rnd-.5)*3; if(!best||sc2>best.sc){ best={p1, sc:sc2, k:e.k, rk:Math.round(rk*100)}; } }
     r.act=best?('pick-'+best.k+'@'+best.rk):'none'; }
   if(!best){ try{ v5Up(); }catch(e){} return r; }
   const p1=best.p1;
   if(!s.stick) v5Down(p0[0],p0[1]); v5Move(p1[0],p1[1]); const e=s.stick&&s.stick.e; r.eval=e?e.k:null; v5Up(); r.after=S&&S.phase;
 }
 else if(s.phase==='tap' && s.tp && !s.tp.hit){ const b=tpBall(s.t); if(b.u>0.35+rnd*0.3){ const R=tpR(); tapBall(b.x+(rnd-.5)*R*0.9, b.y+(rnd-.5)*R*0.9); r.act='tap'; } }
 else if(s.phase==='icpt' && s.ic){ const ic=s.ic; const tx=ic.to?ic.to.x:s.ball.x, ty=ic.to?ic.to.y:s.ball.y; const fx=ic.from?ic.from.x:s.ball.x, fy=ic.from?ic.from.y:s.ball.y; const mx=fx+(tx-fx)*(0.45+rnd*.3), my=fy+(ty-fy)*(0.45+rnd*.3); const P=P3(mx,my,0); const rect=cv.getBoundingClientRect(); icptAim(P[0]*rect.width/cv.width, P[1]*rect.height/cv.height); r.act='icpt'; }
 else if(s.phase==='meter' && s.at - s.meter.t0 > 0.6+rnd*1.2){ fireTackle(); r.act='tackle'; }
 else if(s.phase==='aim' || s.phase==='decide'){ try{ botMove(); r.act='bot'; }catch(e){ r.err=e.message; } }
 r.done = s.phase==='done'; r.banner = s.banner && s.banner.t; r.good=s.good;
 const B=s.ball; r.bad = !isFinite(B.x)||!isFinite(B.y)||B.x<-15||B.x>83||B.y<-15||B.y>125;
 return r; }"""


def main():
    res = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1, locale='tr-TR')
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
        pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tutMatch=1; acctSave(); }")
        pg.evaluate(SETUP)
        types = os.environ.get('TYPES', 'atk,one,build,kontra,drib,head,fk,pen,def').split(',')
        for i in range(N):
            want = types[i % len(types)]
            t = pg.evaluate(NEXT, want)
            if t in ('over',) or str(t).startswith('ERR') or t == 'none':
                pg.evaluate("()=>{ try{ cancelAnimationFrame(RAF) }catch(e){} try{ simRest(); }catch(e){} try{ matchDone(); }catch(e){} scr='game'; }")
                t = pg.evaluate(NEXT, want)
            t0 = time.time(); acts = []; phases = []; frames = 0; last = None; bad = 0
            while time.time() - t0 < 25:
                r = pg.evaluate(DRIVE, random.random())
                if r.get('act'): acts.append(r['act'] + ('>' + str(r.get('eval')) if r.get('eval') else ''))
                if not phases or phases[-1] != r['ph']: phases.append(r['ph'])
                bad += 1 if r.get('bad') else 0
                if FRAMES and i < len(types) * 2 and frames < 40:
                    pg.screenshot(path=os.path.join(out, f'm{i:02d}_{want}_{frames:02d}.png')); frames += 1
                if r.get('done'): last = r; break
                pg.wait_for_timeout(180)
            dur = round(time.time() - t0, 1)
            res.append({'i': i, 'type': want, 'got': t, 'dur': dur, 'banner': last and last.get('banner'), 'good': last and last.get('good'), 'acts': acts[:12], 'phases': phases, 'stuck': last is None, 'ballBad': bad})
            print(json.dumps(res[-1], ensure_ascii=False))
            pg.wait_for_timeout(1200)
        b.close()
    json.dump({'res': res, 'errors': errs[:10]}, open(os.path.join(out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    print('errors', errs[:5])


main()

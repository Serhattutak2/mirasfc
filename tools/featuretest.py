"""v4.4 özellik testi (gerçek tarayıcı): kiralık teklifi, Günün Pozisyonu, Hayatının Filmi, Senaryo Modu.
Kullanım: python3 tools/featuretest.py index.html out_dir [tr|en]"""
import sys, os, json, base64
from playwright.sync_api import sync_playwright
src, out = os.path.abspath(sys.argv[1]), sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'tr'
os.makedirs(out, exist_ok=True)
TO_PRO = """()=>{ nw(1); document.getElementById('nn').value='Test Oyuncu'; mk(); let k=0; while(g.phase==='child'&&k++<40){ if(g.q)answerQ(0); while(g.ev)choose(0); if(g.q)answerQ(0); childYear(); }
  if(scr==='offers') sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); scr='game'; sv(); draw(); return {phase:g.phase, age:g.age, role:g.role, club:g.club&&g.club.n, week:g.week}; }"""
res = {}
TRW = r"[çğışöüÇĞİŞÖÜ]|\\b(ve|bir|için|yıl|sen|ile|daha|gibi|kulüp|maç|hafta|sezon|takım|Yeni|Gün|Hedef|Senaryo)\\b"
GRAB = "(re)=>{ const R=new RegExp(re); const out=new Set(); for(const r of [document.getElementById('app'), ...document.querySelectorAll('.tut:not([hidden])'), document.getElementById('toast')]){ if(!r||r.hidden) continue; const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())){ const t=n.nodeValue.trim(); if(t.length>1&&R.test(t)) out.add(t.slice(0,140)); } } return [...out]; }"
TR_LEFT = {}


def grab(pg, name):
    if lang == 'en':
        TR_LEFT[name] = pg.evaluate(GRAB, TRW)


def fresh(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=2, locale='tr-TR' if lang == 'tr' else 'en-US')
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.goto('file://' + src); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; acctSave(); menu(); }")
    return b, pg, errs


with sync_playwright() as p:
    # 1) Menü: Senaryo kartı
    b, pg, errs = fresh(p)
    res['menu_has_scenario'] = pg.evaluate("()=>!!document.querySelector('.scmenu') && document.querySelectorAll('.scb').length")
    pg.screenshot(path=f'{out}/menu.png'); grab(pg, 'menu')
    # 2) Kiralık: yedek genç oyuncu
    st = pg.evaluate(TO_PRO); res['to_pro'] = st
    pg.evaluate("()=>{ g.role=0; if(g.con) g.con.role=0; g.loanSureDone=0; }")
    seen = None
    for w in range(30):
        info = pg.evaluate("""()=>{ let k=0; while((g.ev||g.q)&&k++<20){ if(g.ev)choose(0); if(g.q)answerQ(0); }
          if(scr!=='game') return {scr, week:g.week};
          try{ weekStart(); }catch(e){}
          k=0; while((g.ev||g.q)&&k++<20){ if(g.ev)choose(0); if(g.q)answerQ(0); }
          const m=nextWeekMatch&&nextWeekMatch(); if(m){ try{ g.cur={ci:g.wq[0], sel:{start:0,out:1}}; }catch(e){} }
          try{ weekEnd(); }catch(e){ return {err:String(e), week:g.week}; }
          return {scr, week:g.week, kind:g.ofKind, n:(g.of||[]).length, intro:g.loanIntro}; }""")
        if info.get('scr') == 'offers' and info.get('kind') == 'loan':
            seen = info; break
        if info.get('scr') not in ('game',):
            pg.evaluate("()=>{ if(scr==='offers') declineOffers(); scr='game'; draw(); }")
    res['loan_offer'] = seen
    if seen:
        res['loan_intro_card'] = pg.evaluate("()=>document.body.innerText.includes('Kiralık nedir') || document.body.innerText.includes('What is a loan')")
        pg.screenshot(path=f'{out}/loan.png'); grab(pg, 'loan')
        pg.evaluate("()=>{ sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); scr='game'; draw(); }")
        res['after_loan'] = pg.evaluate("()=>({loan:!!g.loan, club:g.club.n, role:g.role})")
    # 3) Günün Pozisyonu
    pg.evaluate("()=>{ scr='game'; M=null; S=null; draw(); }")
    res['daily_card'] = pg.evaluate("()=>!!document.querySelector('.dpcard')")
    tok0 = pg.evaluate("()=>acct().tok")
    pg.evaluate("()=>dpStart()"); pg.wait_for_timeout(1500)
    res['daily_started'] = pg.evaluate("()=>({scr, S:!!S, type:S&&S.type, mom:M&&M.mom&&M.mom[0]})")
    pg.screenshot(path=f'{out}/daily_play.png'); grab(pg, 'daily_play')
    pg.evaluate("()=>{ if(S){ S.good=1; } sceneContinue(); }"); pg.wait_for_timeout(300)
    res['daily_done'] = pg.evaluate(f"()=>({{scr, tokGain: acct().tok-{tok0}, dp: acct().dp}})")
    pg.screenshot(path=f'{out}/daily_after.png'); grab(pg, 'daily_after')
    res['daily_second_try_blocked'] = pg.evaluate("()=>{ dpStart(); return scr==='game' }")
    # 4) Film
    pg.evaluate("()=>filmOpenCurrent()"); pg.wait_for_timeout(1500)
    res['film'] = pg.evaluate("()=>({frames:FILMURLS.length, open:!document.getElementById('mfilm').hidden})")
    urls = pg.evaluate("()=>FILMURLS")
    for i, u in enumerate(urls):
        open(f'{out}/film_{i+1}.png', 'wb').write(base64.b64decode(u.split(',')[1]))
    pg.screenshot(path=f'{out}/film_modal.png'); grab(pg, 'film_modal')
    pg.evaluate("()=>filmClose()")
    res['errors_main'] = errs[:8]
    b.close()
    # 5) Senaryolar
    for sid in ['harika', 'bag', 'dans', 'donus']:
        b, pg, errs = fresh(p)
        pg.evaluate(f"()=>{{ scOpen('{sid}'); }}"); pg.wait_for_timeout(200)
        if sid == 'harika': pg.screenshot(path=f'{out}/scen_dialog.png'); grab(pg, 'scen_dialog')
        pg.evaluate(f"()=>scStart('{sid}')"); pg.wait_for_timeout(400)
        info = pg.evaluate("()=>({scr, age:g&&g.age, club:g&&g.club&&g.club.n, role:g&&g.role, scn:g&&g.scn, money:g&&g.money, inj:g&&g.inj})")
        pg.screenshot(path=f'{out}/scen_{sid}.png'); grab(pg, 'scen_'+sid)
        # bir sezon simüle et
        pg.evaluate("()=>{ if(scr==='offers'){ sign(0); if(scr==='num') pickNum(freeNum(g.sq[g.club.id], g.pos)); scr='game'; } try{ AD_SIM=1; simWeeks(60); }catch(e){ window.__e=String(e) } AD_SIM=0; }")
        info['after_season'] = pg.evaluate("()=>({scr, season:g.season, scn:g.scn, err:window.__e||null})")
        info['errors'] = errs[:5]
        res['scen_' + sid] = info
        b.close()
res['TR_LEFT'] = TR_LEFT
print(json.dumps(res, ensure_ascii=False, indent=1, default=str))

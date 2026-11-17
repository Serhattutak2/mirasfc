"""Maç anını gerçek tarayıcıda başlatıp büyük kareler alır. python3 tools/look.py index.html out type"""
import sys, os
from playwright.sync_api import sync_playwright
src, out, typ = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]; os.makedirs(out, exist_ok=True)
T = open('tools/enginetest.py').read(); SETUP = T.split('SETUP = """')[1].split('"""')[0]; NEXT = T.split('NEXT = """')[1].split('"""')[0]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto('file://' + src); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ try{ tutEnd(0) }catch(e){} const A=acct(); A.sub=1; A.tutMatch=1; acctSave(); }"); pg.evaluate(SETUP)
    pg.evaluate(NEXT, typ)
    for i in range(int(os.environ.get('NF', '8'))):
        pg.wait_for_timeout(int(os.environ.get('DT', '450'))); pg.screenshot(path=f'{out}/{typ}_{i:02d}.png')
    print(pg.evaluate("()=>({phase:S&&S.phase, type:S&&S.type, n:S&&S.P.length, cam:S&&S.cam, me:S&&S.me&&[S.me.x,S.me.y], ball:S&&[S.ball.x,S.ball.y]})"))
    print('errors', errs[:4]); b.close()

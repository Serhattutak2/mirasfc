"""App Preview videosu (886x1920, 30 fps, ≤30 sn, sessiz stereo AAC): kayıttan
sahneleri keser, üstte başlık bandı olan arka plana yerleştirir, birleştirir.
Kullanım: python3 tools/preview_make.py plan.json out.mp4
plan.json: {"lang":"tr","work":"dir","scenes":[{"src":"a.webm","cuts":[[11,16.6],[21,26.5]],"speed":1.25,"cap":"OKU ÇEK,|GOLÜ SEN AT"}, ...]}"""
import sys, os, json, subprocess, html
from playwright.sync_api import sync_playwright
plan = json.load(open(sys.argv[1])); outp = sys.argv[2]
W, H, FPS = 886, 1920, 30
SW, SH, SX, SY = 734, 1590, 76, 318  # görüntü alanı
wd = plan['work']; os.makedirs(wd, exist_ok=True)

CSS = """@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box} html,body{width:886px;height:1920px;overflow:hidden}
body{background:radial-gradient(700px 600px at 50% 1100px, rgba(232,196,104,.16), transparent 70%), linear-gradient(180deg,#123323 0%,#0a1f14 45%,#05100a 100%)}
.cap{position:absolute;left:60px;right:60px;top:64px;height:220px;display:flex;flex-direction:column;justify-content:center}
h1{font:800 92px/0.95 'Barlow Condensed',sans-serif;color:#eef3ef;text-transform:uppercase;white-space:nowrap}
h1 .g{color:#e8c468;display:block}
.fr{position:absolute;left:SXpx;top:SYpx;width:SWpx;height:SHpx;border-radius:46px;box-shadow:0 0 0 6px #1b211d,0 0 0 8px rgba(232,196,104,.35),0 40px 90px rgba(0,0,0,.6)}
""".replace("SXpx", f"{SX}px").replace("SYpx", f"{SY}px").replace("SWpx", f"{SW}px").replace("SHpx", f"{SH}px")


def caps():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H})
        for i, sc in enumerate(plan['scenes']):
            a, c = sc['cap'].split('|')
            f = os.path.join(wd, f'cap{i}.html')
            open(f, 'w').write(f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='cap'><h1>{html.escape(a)}<span class='g'>{html.escape(c)}</span></h1></div><div class='fr'></div></body></html>")
            pg.goto('file://' + f); pg.wait_for_timeout(700); pg.evaluate("document.fonts.ready")
            pg.evaluate("()=>{ const h=document.querySelector('h1'); let s=92; while(s>56 && h.scrollWidth>h.clientWidth+1){ s-=3; h.style.fontSize=s+'px'; } }")
            pg.screenshot(path=os.path.join(wd, f'cap{i}.png'))
        b.close()


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:]); raise SystemExit(1)


def scene(i, sc):
    parts = []
    for k, (t0, t1) in enumerate(sc['cuts']):
        parts.append(f"[0:v]trim=start={t0}:end={t1},setpts=PTS-STARTPTS[p{k}]")
    n = len(sc['cuts']); sp = sc.get('speed', 1)
    cat = ''.join(f'[p{k}]' for k in range(n)) + (f'concat=n={n}:v=1:a=0[c]' if n > 1 else 'null[c]')
    fade = sc.get('fade', .25)
    fg = f"[c]setpts=PTS/{sp},fps={FPS},crop={plan.get('cw', 443)}:{plan.get('ch', 960)}:0:0,scale={SW}:{SH}:flags=lanczos,unsharp=5:5:0.6,format=rgba[cs];[2:v]format=gray[m];[cs][m]alphamerge[fg]"
    fc = ';'.join(parts + [cat, fg, f"[1:v][fg]overlay={SX}:{SY}:shortest=1,format=yuv420p,fade=t=in:st=0:d={fade}[v]"])
    tmp = os.path.join(wd, f's{i}.tmp.mp4'); dst = os.path.join(wd, f's{i}.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', sc['src'], '-loop', '1', '-framerate', str(FPS), '-i', os.path.join(wd, f'cap{i}.png'), '-loop', '1', '-i', os.path.join(wd, 'mask.png'), '-filter_complex', fc, '-map', '[v]', '-t', f"{sum(b - a for a, b in sc['cuts']) / sp:.3f}",
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-profile:v', 'high', '-level', '4.1', tmp])
    os.replace(tmp, dst); return dst


from PIL import Image, ImageDraw
m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, SW - 1, SH - 1], radius=44, fill=255); m.save(os.path.join(wd, 'mask.png'))
caps()
files = [scene(i, sc) for i, sc in enumerate(plan['scenes'])]
lst = os.path.join(wd, 'list.txt'); open(lst, 'w').write(''.join(f"file '{f}'\n" for f in files))
joined = os.path.join(wd, 'joined.mp4')
run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', joined])
tmp = outp + '.tmp.mp4'
run(['ffmpeg', '-v', 'error', '-y', '-i', joined, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', tmp])
os.replace(tmp, outp)
print(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate', '-of', 'compact', outp], capture_output=True, text=True).stdout)

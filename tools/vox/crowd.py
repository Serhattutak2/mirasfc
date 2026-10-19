"""Miras FC tribün sesleri (v4.2): beyaz gürültü yerine gerçek insan seslerinden üretilmiş tribün.
Onlarca farklı ses (Piper + Kokoro, kadın/erkek, perdesi kaydırılmış) üst üste bindirilir,
uzaklık için alçak geçiren süzgeç, stadyum yankısı ve hafif uğultu eklenir.
Çıktı: crowddata.js (CROWDDATA = {loop, roar, ooh, groan} mp3 base64).
Kullanım (modellerin olduğu klasörde): python3 crowd.py /yol/src/crowddata.js"""
import sherpa_onnx, soundfile as sf, numpy as np, subprocess, glob, base64, json, sys, random
random.seed(7); np.random.seed(7); SR = 22050
def piper(v):
    d = f'vits-piper-{v}'
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=glob.glob(d + '/*.onnx')[0], tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data', noise_scale=.9, noise_scale_w=1.0), num_threads=4)))
def kok():
    d = 'kokoro-en-v0_19'
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=d + '/model.onnx', voices=d + '/voices.bin', tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data'), num_threads=4)))
V = [(piper('tr_TR-fahrettin-medium'), [0]), (piper('tr_TR-fettah-medium'), [0]), (piper('tr_TR-dfki-medium'), [0]), (piper('en_GB-northern_english_male-medium'), [0]), (piper('en_US-ryan-high'), [0]), (kok(), list(range(11)))]
def say(txt, speed=1.0):
    t, sids = random.choice(V); a = t.generate(txt, sid=random.choice(sids), speed=speed); s = np.array(a.samples, dtype=np.float32)
    if a.sample_rate != SR: s = np.interp(np.linspace(0, len(s), int(len(s) * SR / a.sample_rate), endpoint=False), np.arange(len(s)), s).astype(np.float32)
    return s / max(1e-4, np.abs(s).max())
def shift(s, f):  # perde/hız kaydırma (yeniden örnekleme) -> farklı insanlar
    n = int(len(s) / f); return np.interp(np.linspace(0, len(s) - 1, n), np.arange(len(s)), s).astype(np.float32)
def lp(x, fc):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (fr / fc) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def reverb(x, t60=1.8, wet=.55):
    n = int(t60 * SR); ir = np.random.randn(n).astype(np.float32) * np.exp(-6.9 * np.arange(n) / n); ir = lp(ir, 3000); ir /= np.abs(ir).sum() ** .5 * 6
    y = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[:len(x)].astype(np.float32)
    return x * (1 - wet) + y * wet
def bed(dur, phrases, n, fc=1800, spd=(.95, 1.25), pit=(.82, 1.3), env=None):
    out = np.zeros(int(dur * SR), np.float32)
    for i in range(n):
        s = shift(say(random.choice(phrases), random.uniform(*spd)), random.uniform(*pit)) * random.uniform(.25, 1.0)
        st = random.randint(-len(s) // 2, len(out) - 1); a, b = max(0, st), min(len(out), st + len(s))
        if b > a: out[a:b] += s[a - st:b - st]
    out = lp(out, fc)
    if env is not None: out *= env(np.linspace(0, 1, len(out)))
    return out
def mp3(x, name):
    x = x / max(1e-4, np.abs(x).max()) * .9; sf.write('cw.wav', x, SR)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'cw.wav', '-ac', '1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', '56k', f'{name}.mp3'], check=True)
    return base64.b64encode(open(f'{name}.mp3', 'rb').read()).decode()
CH = ['Hadi!', 'Haydi çocuklar!', 'Vur!', 'Pas ver!', 'Hakem!', 'Bas bas!', 'Hadi be!', 'Oley!', 'Come on!', 'Get in there!', 'Pass it!', 'Go on!', 'Referee!', 'Yes!', 'Hey!', 'Ole!', 'Oh!', 'Ah!', 'Hah!', 'Eh!']
out = {}
# 1) tribün döngüsü: 12 sn, sürekli uğultu + seçilebilen bağırışlar
D = 12.0; loop = bed(D + 1, CH, 260, fc=1500) * .8 + bed(D + 1, CH, 40, fc=3000) * .35
rum = lp(np.cumsum(np.random.randn(len(loop))).astype(np.float32), 140); rum -= lp(rum, 15); rum /= np.abs(rum).max() + 1e-6
loop = reverb(loop / np.abs(loop).max() + rum * .12, 2.2, .6); n = int(D * SR); f = int(1.0 * SR)
loop = np.concatenate([loop[f:n] , loop[:f] * np.linspace(0, 1, f) + loop[n:n + f] * np.linspace(1, 0, f)])
out['loop'] = mp3(loop, 'cw_loop'); print('loop', len(out['loop']) // 1365, 'KB')
# 2) gol kükremesi: hızla yükselen, sonra yavaşça sönen yüzlerce ses
GO = ['Gooool!', 'Gol!', 'Goal!', 'Yes!', 'Yeah!', 'Evet!', 'Hey!', 'Ole ole!', 'Get in!']
roar = bed(4.5, GO, 240, fc=2600, spd=(.8, 1.1), pit=(.85, 1.35), env=lambda t: np.minimum(1, t / .08) * np.exp(-np.maximum(0, t - .35) * 1.6))
out['roar'] = mp3(reverb(roar, 2.4, .5), 'cw_roar')
# 3) "Oooo": kaçan pozisyon
OO = ['Ooooh!', 'Oooo!', 'Ohhh!', 'Uuuh!']
ooh = bed(2.4, OO, 140, fc=1600, spd=(.7, .9), pit=(.85, 1.3), env=lambda t: np.minimum(1, t / .15) * np.exp(-np.maximum(0, t - .5) * 2.2))
out['ooh'] = mp3(reverb(ooh, 2.0, .5), 'cw_ooh')
# 4) hayal kırıklığı (gol yedik)
AH = ['Aaah!', 'Ahhh!', 'Off!', 'Aah no!', 'Hay aksi!']
groan = bed(2.4, AH, 120, fc=1100, spd=(.75, .95), pit=(.75, 1.1), env=lambda t: np.minimum(1, t / .2) * np.exp(-np.maximum(0, t - .4) * 2.4))
out['groan'] = mp3(reverb(groan, 2.0, .5), 'cw_groan')
js = '/* OTOMATİK ÜRETİLİR (tools/vox/crowd.py): tribün sesleri, onlarca sentez insan sesinden; mp3 base64 */\nconst CROWDDATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
open(sys.argv[1], 'w').write(js); print('written', len(js) // 1024, 'KB')

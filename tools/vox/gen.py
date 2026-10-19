"""Miras FC spiker replikleri: açık kaynak sinir ağı erkek sesleri (Piper; TR fahrettin ~93 Hz, EN alan ~106 Hz).
Sesin perdesi yükseltilmez (erkek tını korunur), sadece hız/heyecan ve yayın efekti eklenir. Çıktı: voxdata.js"""
import sherpa_onnx, soundfile as sf, numpy as np, subprocess, os, glob, base64, json, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
VOICES = {'tr': 'tr_TR-fahrettin-medium', 'en': 'en_GB-alan-medium'}
HI = {'goal': 3, 'save': 2, 'post': 2, 'chip': 2, 'shot': 2, 'longshot': 2, 'gkout': 2, 'final': 2, 'kickoff': 2, 'chance': 2, 'red': 2, 'pen': 2, 'equal': 3, 'lead': 3}
MID = {'bigpass', 'block', 'win', 'off', 'foul', 'loose', 'tackle', 'badtouch', 'over', 'concede', 'half', 'card', 'counter', 'corner', 'sub', 'press', 'replay', 'cut', 'wide', 'air', 'combo', 'tired', 'rain'}
L = {
 'tr': {
  'shot': ['Şut!', 'Ve vuruyor!', 'Kaleyi yokluyor!', 'Vurdu!'],
  'longshot': ['Uzaktan deniyor!', 'Ceza sahası dışından vurdu!', 'Uzaktan bir füze!'],
  'chip': ['Aşırtma!', 'Kalecinin üstünden aşırtıyor!'],
  'goal': ['LONG:Gol|Ve top ağlarda!', 'LONG:Gol|İnanılmaz bir gol!', 'LONG:Gol|Tribünler ayakta!', 'Gol! Gol! Gol! Ve top ağlarda!'],
  'equal': ['LONG:Gol|Ve eşitlik geldi!', 'Gol! Skor yeniden eşit!'],
  'lead': ['LONG:Gol|Ve öne geçiyoruz!', 'Gol! Maçı çevirdiler!'],
  'save': ['Kaleci! Harika kurtarış!', 'Kurtardı! Ne refleks ama!', 'Kaleci son anda çıkardı!', 'Muhteşem bir kurtarış!'],
  'post': ['Direk! Top direkten döndü!', 'Olamaz, direğe çarptı!'],
  'wide': ['Az farkla dışarıda.', 'İsabetsiz bir vuruş.', 'Top auta gidiyor.'],
  'over': ['Üstten dışarı!', 'Top tribüne gitti!'],
  'pass': ['Güzel pas.', 'Top ayakta.', 'Paslaşıyorlar.', 'Sakin bir pas.'],
  'bigpass': ['Harika bir pas!', 'Ne pas ama!', 'Savunmayı ikiye böldü!'],
  'drib': ['Topu sürüyor.', 'İlerliyor.', 'Boşluğa hareketleniyor.'],
  'cut': ['Araya girdiler.', 'Pas kesildi.', 'Savunma okudu.'],
  'tackle': ['Müdahale! Top kaybedildi.', 'Kayarak aldı topu!'],
  'off': ['Ofsayt!', 'Bayrak havada, ofsayt.'],
  'foul': ['Faul! Hakem düdüğü çaldı.', 'Sert bir müdahale!'],
  'card': ['Sarı kart!', 'Hakem kartına başvurdu.'],
  'red': ['Kırmızı kart! Oyundan atıldı!', 'Doğrudan kırmızı!'],
  'pen': ['Penaltı! Hakem beyaz noktayı gösterdi!'],
  'badtouch': ['Kontrol kötü!', 'İlk dokunuş tutmadı!'],
  'loose': ['Top boşta!', 'Kim alacak?'],
  'win': ['Top yine bizde!', 'Topu kaptık, atak başlıyor!'],
  'block': ['Bloke edildi!', 'Savunma kendini topun önüne attı!'],
  'air': ['Hava topunu kazandılar.'],
  'combo': ['Ne güzel paslaşma!', 'Top ayaktan ayağa dolaşıyor.'],
  'tired': ['Oyuncular yorulmaya başladı.'],
  'gkout': ['Kaleci çıkıyor!', 'Kaleci kalesini terk etti!'],
  'replay': ['Bir kez daha izleyelim.', 'Tekrarda o an.'],
  'kickoff': ['Hakem düdüğü çaldı, maç başladı!', 'Ve karşılaşma başladı!'],
  'half': ['İlk yarı sona erdi.', 'Hakem ilk yarıyı bitiriyor.'],
  'final': ['Ve son düdük! Maç sona erdi.'],
  'concede': ['Ve gol... Rakip ağları buldu.', 'Gol yedik...'],
  'chance': ['Büyük fırsat!', 'Ne pozisyon ama!', 'Kaçtı! İnanılmaz!'],
  'counter': ['Kontra atak!', 'Hızlı çıkıyorlar!'],
  'corner': ['Korner.', 'Köşe vuruşu kazanıldı.'],
  'sub': ['Oyuncu değişikliği.', 'Kenarda bir değişiklik var.'],
  'press': ['Yoğun baskı!', 'Rakip kaleye yüklendiler!'],
  'rain': ['Zemin ıslak, top kayıyor.'],
 },
 'en': {
  'shot': ['Shot!', 'He strikes!', 'He tests the keeper!', 'Lets fly!'],
  'longshot': ['From distance!', 'He tries his luck from range!', 'What a hit from out there!'],
  'chip': ['He chips it!', 'Over the keeper!'],
  'goal': ['LONG:Goal|What a finish!', "LONG:Goal|It's in the back of the net!", 'LONG:Goal|The crowd goes wild!', 'Goal! Goal! Goal! What a goal!'],
  'equal': ["LONG:Goal|And we're level!", 'Goal! All square again!'],
  'lead': ['LONG:Goal|And they take the lead!', "Goal! They've turned it around!"],
  'save': ['What a save!', 'Brilliant from the keeper!', 'Kept out at the last moment!', 'Superb reflexes!'],
  'post': ['Off the post!', 'Unbelievable, it hits the woodwork!'],
  'wide': ['Just wide.', 'Off target.', 'It drifts wide.'],
  'over': ['Over the bar!', "That one's in the stands!"],
  'pass': ['Nice ball.', 'Neat pass.', 'Keeping it moving.', 'Simple pass.'],
  'bigpass': ['Great ball!', 'What a pass!', 'That splits the defence!'],
  'drib': ['He carries it forward.', 'Driving on.', 'Into space.'],
  'cut': ['Intercepted.', 'Cut out.', 'Read well by the defence.'],
  'tackle': ['Tackle! Possession lost.', 'Sliding challenge, and he wins it!'],
  'off': ['Offside!', "Flag's up, offside."],
  'foul': ['Foul! The referee blows.', "That's a heavy challenge!"],
  'card': ['Yellow card!', 'The referee goes to his pocket.'],
  'red': ["Red card! He's off!", 'Straight red!'],
  'pen': ['Penalty! The referee points to the spot!'],
  'badtouch': ['Poor touch!', 'The first touch lets him down!'],
  'loose': ['Loose ball!', 'Who gets there first?'],
  'win': ["We've won it back!", 'Ball won, here we go!'],
  'block': ['Blocked!', 'He throws himself in front of it!'],
  'air': ['Won in the air by the defence.'],
  'combo': ['Lovely passing!', 'Pass and move, beautiful stuff.'],
  'tired': ['The legs are getting heavy.'],
  'gkout': ['The keeper rushes out!', 'Out comes the keeper!'],
  'replay': ["Let's see that again.", "Here's the replay."],
  'kickoff': ["And we're underway!", 'The referee gets us started!'],
  'half': ["That's half time.", 'The referee blows for the break.'],
  'final': ["And there's the final whistle!"],
  'concede': ['And they score...', 'Goal for the opposition.'],
  'chance': ['Huge chance!', 'What an opportunity!', 'Missed! Unbelievable!'],
  'counter': ['On the counter!', "They break quickly!"],
  'corner': ['Corner.', 'A corner kick.'],
  'sub': ['A substitution.', 'A change on the touchline.'],
  'press': ['Wave after wave of pressure!', "They're piling forward!"],
  'rain': ['The pitch is slick, the ball is skidding.'],
 }}
def mk(v):
    d = f'vits-piper-{v}'; onnx = glob.glob(d + '/*.onnx')[0]
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=onnx, tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data', noise_scale=0.8, noise_scale_w=0.9), num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)
def trim(a, sr):
    e = np.abs(a); th = max(e.max() * .02, 1e-4); idx = np.where(e > th)[0]
    return a[max(0, idx[0] - int(.02 * sr)):idx[-1] + int(.05 * sr)] if len(idx) else a
def stretch(seg, sr, factor):
    sf.write('tmp_in.wav', seg, sr); t = []; f = factor
    while f > 2: t.append('atempo=0.5'); f /= 2
    t.append(f'atempo={1 / f:.4f}')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'tmp_in.wav', '-af', ','.join(t), 'tmp_out.wav'], check=True)
    o, _ = sf.read('tmp_out.wav'); return o.astype(np.float32)
def longword(tts, w, sr):
    a = trim(np.array(tts.generate(w, sid=0, speed=.85).samples, dtype=np.float32), sr); n = len(a)
    s0, s1 = int(n * .22), int(n * .62); mid = stretch(a[s0:s1], sr, 9.0)
    fade = int(.015 * sr); head, tail = a[:s0], a[s1:]
    out = np.concatenate([head[:-fade], head[-fade:] * np.linspace(1, 0, fade) + mid[:fade] * np.linspace(0, 1, fade), mid[fade:-fade], mid[-fade:] * np.linspace(1, 0, fade) + tail[:fade] * np.linspace(0, 1, fade), tail[fade:]])
    env = np.ones(len(out)); env[len(head):len(head) + len(mid)] = np.linspace(.85, 1.3, len(mid)); return out * env
def fx(inp, outp, lv):
    pitch = .97  # erkek tınıyı biraz daha koyulaştır; asla yükseltme
    tempo = {3: 1.04, 2: 1.03, 1: 1.0, 0: .98}[lv]
    af = (f'asetrate=22050*{pitch},aresample=22050,atempo={tempo / pitch:.4f},highpass=f=90,lowpass=f=7000,'
          f'equalizer=f=180:t=q:w=1:g=3,equalizer=f=2600:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=4:attack=4:release=80:makeup=4,'
          f'aecho=0.85:0.5:{40 + lv * 12}|{95 + lv * 15}:{0.12 + lv * .03}|{0.07 + lv * .02},alimiter=limit=0.92')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', inp, '-af', af, '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '40k', outp], check=True)
out = {}; tot = 0; os.makedirs('clips', exist_ok=True)
for lang, v in VOICES.items():
    tts = mk(v); sr = tts.sample_rate; out[lang] = {}
    for k, lines in L[lang].items():
        lv = HI.get(k, 1 if k in MID else 0); out[lang][k] = []
        for i, line in enumerate(lines):
            if line.startswith('LONG:'):
                w, rest = line[5:].split('|'); a = longword(tts, w + '!', sr); b = trim(np.array(tts.generate(rest, sid=0, speed=1.12).samples, dtype=np.float32), sr)
                a = np.concatenate([a / max(1e-4, np.abs(a).max()) * .95, np.zeros(int(.08 * sr), np.float32), b / max(1e-4, np.abs(b).max()) * .9])
            else:
                a = trim(np.array(tts.generate(line, sid=0, speed={3: 1.15, 2: 1.12, 1: 1.05, 0: 1.0}[lv]).samples, dtype=np.float32), sr); a = a / max(1e-4, np.abs(a).max()) * .9
            sf.write('raw.wav', a, sr); fn = f'clips/{lang}_{k}_{i}.mp3'; fx('raw.wav', fn, lv)
            data = open(fn, 'rb').read(); tot += len(data); out[lang][k].append(base64.b64encode(data).decode())
    print(lang, 'done', tot // 1024, 'KB')
js = '/* OTOMATİK ÜRETİLİR: spiker replikleri, açık kaynak sinir ağı ERKEK sesleri (Piper: tr fahrettin, en alan), mp3 base64. Üretici: DEVIR.md > Spiker */\nconst VOXDATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
open(sys.argv[1], 'w').write(js); print('written', len(js) // 1024, 'KB')

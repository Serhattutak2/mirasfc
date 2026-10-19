"""Miras FC spiker v2 (v4.2): İngilizce spiker (v4.2: Türkçe spiker kaldırıldı, Türkçede yalnızca tribün), ayrı replikler.
TR: Piper tr_TR-fahrettin-medium (erkek). EN: Kokoro v0.19 bm_lewis (İngiliz erkek yorumcu, Apache-2.0).
Cızırtı yok: FFT gürültü azaltma + kapı (gate); kompresör "makeup" kaldırıldı, 56 kbps mp3.
Heyecan: önemli anlarda formant korunarak perde yükselir (rubberband), hız artar, hafif doygunluk.
Kullanım (modellerin olduğu klasörde): python3 gen2.py /yol/src/voxdata.js"""
import sherpa_onnx, soundfile as sf, numpy as np, subprocess, os, glob, base64, json, sys
HI = {'goal': 3, 'equal': 3, 'lead': 3, 'save': 2, 'post': 2, 'chip': 2, 'shot': 2, 'longshot': 2, 'gkout': 2, 'final': 2, 'kickoff': 2, 'chance': 2, 'red': 2, 'pen': 2, 'counter': 2, 'press': 2, 'bigpass': 2}
MID = {'block', 'win', 'off', 'foul', 'loose', 'tackle', 'badtouch', 'over', 'concede', 'half', 'card', 'corner', 'sub', 'replay', 'cut', 'wide', 'air', 'combo', 'tired', 'rain'}
L = {
 'tr': {
  'shot': ['Ve vuruyor!', 'Şut geliyor!', 'Kaleyi yokluyor!', 'Vurdu!', 'Sert bir şut!'],
  'longshot': ['Uzaktan deniyor!', 'Ceza sahası dışından, füze gibi!', 'Uzaktan şansını deniyor!'],
  'chip': ['Aşırtma!', 'Kalecinin üstünden aşırtıyor!', 'Ne cüretkâr bir vuruş!'],
  'goal': ['LONG:Gol|Top ağlarda! İnanılmaz!', 'LONG:Gol|Ne vuruş ama! Tribünler ayakta!', 'LONG:Gol|Kaleci çaresiz kaldı!', 'Gol! Gol! Gol! Ve top ağlarla buluşuyor!', 'LONG:Gol|Muhteşem bir bitiriş!'],
  'equal': ['LONG:Gol|Ve eşitlik geliyor!', 'Gol! Skor yeniden eşit! Maç baştan başlıyor!'],
  'lead': ['LONG:Gol|Ve öne geçiyoruz!', 'Gol! Maçı çeviriyorlar! Stadyum yıkılıyor!'],
  'save': ['Kaleci! Harika kurtarış!', 'Uzandı ve çıkardı!', 'Ne refleks ama!', 'Kaleci son anda gole izin vermiyor!', 'Parmaklarının ucuyla çeldi!'],
  'post': ['Direk! Top direkten döndü!', 'Olamaz! Direğe çarptı!', 'Direk kurtardı!'],
  'wide': ['Az farkla dışarıda.', 'Yan ağlarda kaldı.', 'İsabetsiz bir vuruş.', 'Kaleyi bulamadı.'],
  'over': ['Üstten dışarı!', 'Top tribüne gitti!', 'Biraz fazla yüksek!'],
  'pass': ['Güzel pas.', 'Top ayakta.', 'Sakin, sabırlı.', 'Paslaşıyorlar.'],
  'bigpass': ['Harika bir pas!', 'Savunmayı ikiye böldü!', 'Ne görüş, ne pas!'],
  'drib': ['Topu sürüyor.', 'İlerliyor, ilerliyor!', 'Boşluğu görüyor.'],
  'cut': ['Araya girdiler.', 'Pas kesildi.', 'Savunma çok iyi okudu.'],
  'tackle': ['Müdahale! Topu kaptırdı.', 'Kayarak aldı topu!', 'Temiz bir müdahale!'],
  'off': ['Ofsayt!', 'Yan hakem bayrağı kaldırdı, ofsayt.'],
  'foul': ['Faul! Hakem düdüğü çaldı.', 'Sert bir müdahale!', 'Hakem oyunu durdurdu.'],
  'card': ['Sarı kart!', 'Hakem cebine uzanıyor, sarı kart.'],
  'red': ['Kırmızı kart! Oyundan atıldı!', 'Doğrudan kırmızı! Takım on kişi!'],
  'pen': ['Penaltı! Hakem beyaz noktayı gösteriyor!', 'Penaltı! İtiraz yok!'],
  'badtouch': ['Kontrol kötü!', 'İlk dokunuş tutmadı!'],
  'loose': ['Top boşta!', 'Kim kapacak?'],
  'win': ['Top yeniden bizde!', 'Topu kaptılar, atak başlıyor!'],
  'block': ['Bloke edildi!', 'Kendini topun önüne attı!'],
  'air': ['Hava topunu kazandılar.'],
  'combo': ['Ne güzel paslaşma!', 'Top ayaktan ayağa dolaşıyor!'],
  'tired': ['Oyuncular yorulmaya başladı.', 'Bacaklar ağırlaşıyor.'],
  'gkout': ['Kaleci çıkıyor!', 'Kaleci kalesini terk etti!'],
  'replay': ['Bir kez daha izleyelim.', 'Tekrarda o an.'],
  'kickoff': ['Hakem düdüğü çaldı, karşılaşma başladı!', 'Ve maç başlıyor! İyi seyirler!'],
  'half': ['İlk yarı sona erdi.', 'Hakem ilk yarıyı bitiriyor. Soyunma odası zamanı.'],
  'final': ['Ve son düdük! Maç sona erdi!', 'Hakem karşılaşmayı bitiriyor!'],
  'concede': ['Ve gol... Rakip ağları buldu.', 'Gol yedik... Savunma çok kötü.', 'Rakip skoru değiştiriyor.'],
  'chance': ['Büyük fırsat!', 'Ne pozisyon ama!', 'Kaçtı! İnanılmaz!', 'Gol olmalıydı!'],
  'counter': ['Kontra atak!', 'Hızlı çıkıyorlar! Sayısal üstünlük var!'],
  'corner': ['Korner.', 'Köşe vuruşu kazanıldı.', 'Korner atışı geliyor.'],
  'sub': ['Oyuncu değişikliği.', 'Kenarda bir değişiklik var.'],
  'press': ['Yoğun baskı!', 'Rakip kalesine yüklendiler!', 'Dalga dalga geliyorlar!'],
  'rain': ['Zemin ıslak, top kayıyor.'],
 },
 'en': {
  'shot': ['He shoots!', 'Strikes it!', 'Tests the keeper!', 'Lets fly!', 'Has a go!'],
  'longshot': ['From distance!', 'Tries his luck from thirty yards!', 'Oh, he hits that from a long way out!'],
  'chip': ['The chip!', 'Over the keeper!', 'Audacious!'],
  'goal': ["LONG:Goal|It's in! What a finish!", 'LONG:Goal|Absolutely magnificent!', "LONG:Goal|The keeper didn't move!", "Oh, that's in! What a goal!", 'LONG:Goal|Right into the top corner!'],
  'equal': ["LONG:Goal|And we're all square!", "They're level! Game on!"],
  'lead': ['LONG:Goal|And they lead!', "They've turned it around! Unbelievable!"],
  'save': ['What a save!', 'Brilliant from the keeper!', 'Tipped away!', 'Oh, he keeps it out!', 'Fingertips! Superb!'],
  'post': ['Off the post!', 'Woodwork! So close!', 'Rattles the upright!'],
  'wide': ['Just wide.', 'Off target.', 'Drags it wide.', "That's not troubled the keeper."],
  'over': ['Over the bar!', "That's in row Z!", 'Skied it!'],
  'pass': ['Nice ball.', 'Neat and tidy.', 'Keeping it moving.', 'Patient build-up.'],
  'bigpass': ['Great ball!', 'What a pass!', 'That splits the defence wide open!'],
  'drib': ['Carries it forward.', 'Driving on!', 'Into space.'],
  'cut': ['Intercepted.', 'Cut out.', 'Read superbly by the defender.'],
  'tackle': ['Big tackle!', 'Wins it with a sliding challenge!', 'Clean as a whistle!'],
  'off': ['Offside!', "The flag's up. Offside."],
  'foul': ['Foul! The referee blows.', "That's a heavy challenge!", 'Free kick given.'],
  'card': ['Yellow card!', 'The referee reaches for his pocket. Booked.'],
  'red': ["Red card! He's off!", 'Straight red! Down to ten!'],
  'pen': ['Penalty! The referee points to the spot!', "It's a penalty!"],
  'badtouch': ['Poor touch!', 'Lets him down, that first touch.'],
  'loose': ['Loose ball!', 'Who wants it?'],
  'win': ["Won it back!", 'Ball won, here we go!'],
  'block': ['Blocked!', 'Throws himself in front of it!'],
  'air': ['Won in the air.'],
  'combo': ['Lovely football!', 'Pass and move, beautiful stuff!'],
  'tired': ['The legs are going now.', 'You can see the fatigue setting in.'],
  'gkout': ['Out comes the keeper!', 'The keeper rushes off his line!'],
  'replay': ["Let's see that again.", 'Have a look at this.'],
  'kickoff': ["And we're underway!", 'The referee gets us going!'],
  'half': ["That's half time.", 'The whistle goes for the break.'],
  'final': ["And there's the final whistle!", "It's all over!"],
  'concede': ['And they score.', "That's a goal for the opposition.", 'Oh dear, they concede.'],
  'chance': ['Huge chance!', 'What an opportunity!', 'How has that not gone in?'],
  'counter': ['On the counter!', 'They break with pace!'],
  'corner': ['Corner.', "It's a corner kick.", 'Corner, and a chance to load the box.'],
  'sub': ['A substitution.', 'A change on the touchline.'],
  'press': ['Wave after wave of pressure!', "They're piling forward now!"],
  'rain': ['The surface is slick, the ball is skidding.'],
 }}
def mk_tr():
    d = 'vits-piper-tr_TR-fahrettin-medium'
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=glob.glob(d + '/*.onnx')[0], tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data', noise_scale=0.75, noise_scale_w=0.9), num_threads=4)))
def mk_en():
    d = 'kokoro-en-v0_19'
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=d + '/model.onnx', voices=d + '/voices.bin', tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data'), num_threads=4)))
VOICE = {'tr': (mk_tr, 0), 'en': (mk_en, 10)}  # en: bm_lewis
SPD = {3: 1.16, 2: 1.12, 1: 1.05, 0: 1.0}
def trim(a, sr):
    e = np.abs(a); th = max(e.max() * .03, 1e-4); idx = np.where(e > th)[0]
    return a[max(0, idx[0] - int(.02 * sr)):idx[-1] + int(.08 * sr)] if len(idx) else a
def rb(seg, sr, tempo=1.0, pitch=1.0):
    sf.write('rb_in.wav', seg, sr)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'rb_in.wav', '-af', f'rubberband=tempo={tempo}:pitch={pitch}:formant=preserved:transients=smooth', 'rb_out.wav'], check=True)
    o, _ = sf.read('rb_out.wav'); return o.astype(np.float32)
def longword(tts, sid, w, sr):
    """"Goooool": sesli harf rubberband ile yumuşakça uzatılır ve perdesi hafifçe yükselir."""
    a = trim(np.array(tts.generate(w, sid=sid, speed=.9).samples, dtype=np.float32), sr); n = len(a)
    s0, s1 = int(n * .25), int(n * .6); mid = rb(a[s0:s1], sr, tempo=1 / 7.0, pitch=1.06)
    f = int(.02 * sr); head, tail = a[:s0], a[s1:]
    out = np.concatenate([head[:-f], head[-f:] * np.linspace(1, 0, f) + mid[:f] * np.linspace(0, 1, f), mid[f:-f], mid[-f:] * np.linspace(1, 0, f) + tail[:f] * np.linspace(0, 1, f), tail[f:]])
    env = np.ones(len(out)); env[len(head):len(head) + len(mid)] = np.linspace(.9, 1.15, len(mid)); return out * env
def fx(inp, outp, lv, sr):
    pitch = {3: 1.07, 2: 1.04, 1: 1.0, 0: 1.0}[lv]
    chain = ['highpass=f=85', 'afftdn=nf=-42:nr=14', f'rubberband=pitch={pitch}:formant=preserved' if pitch != 1 else None,
             'equalizer=f=220:t=q:w=1.2:g=2', f'equalizer=f=3000:t=q:w=1:g={2 + lv}', 'lowpass=f=9500',
             'asoftclip=type=tanh' if lv >= 3 else None, 'aecho=0.9:0.5:28|56:0.05|0.025',
             'agate=threshold=0.012:ratio=6:attack=3:release=120', 'alimiter=limit=0.95']
    af = ','.join(x for x in chain if x)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', inp, '-af', af, '-ac', '1', '-ar', str(sr), '-c:a', 'libmp3lame', '-b:a', '56k', outp], check=True)
def main(dst):
    out = {}; tot = 0; os.makedirs('clips2', exist_ok=True)
    for lang, (mk, sid) in VOICE.items():
        tts = mk(); sr = tts.sample_rate; out[lang] = {}
        for k, lines in L[lang].items():
            lv = HI.get(k, 1 if k in MID else 0); out[lang][k] = []
            for i, line in enumerate(lines):
                if line.startswith('LONG:'):
                    w, rest = line[5:].split('|'); a = longword(tts, sid, w + '!', sr)
                    b = trim(np.array(tts.generate(rest, sid=sid, speed=SPD[lv]).samples, dtype=np.float32), sr)
                    a = np.concatenate([a / max(1e-4, np.abs(a).max()) * .95, np.zeros(int(.07 * sr), np.float32), b / max(1e-4, np.abs(b).max()) * .9])
                else:
                    a = trim(np.array(tts.generate(line, sid=sid, speed=SPD[lv]).samples, dtype=np.float32), sr); a = a / max(1e-4, np.abs(a).max()) * .9
                a = np.concatenate([np.zeros(int(.03 * sr), np.float32), a, np.zeros(int(.12 * sr), np.float32)])
                sf.write('raw.wav', a, sr); fn = f'clips2/{lang}_{k}_{i}.mp3'; fx('raw.wav', fn, lv, sr)
                data = open(fn, 'rb').read(); tot += len(data); out[lang][k].append(base64.b64encode(data).decode())
        print(lang, 'done', tot // 1024, 'KB', flush=True)
    js = '/* OTOMATİK ÜRETİLİR (tools/vox/gen2.py): spiker replikleri. TR: Piper fahrettin (erkek), EN: Kokoro bm_lewis (İngiliz erkek yorumcu). mp3 base64 */\nconst VOXDATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
    open(dst, 'w').write(js); print('written', len(js) // 1024, 'KB')
if __name__ == '__main__': main(sys.argv[1])

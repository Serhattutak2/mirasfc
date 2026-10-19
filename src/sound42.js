/* ============================================================
   MİRAS FC — v4.2 · Stadyum sesi ve reklam sıklığı
   - Tribün: beyaz gürültü (cızırtı gibi duyuluyordu) yerine onlarca insan
     sesinden üretilmiş gerçek tribün uğultusu (crowddata.js, döngü);
     gol kükremesi, "ooo" ve hayal kırıklığı da insan sesinden.
   - Ses yalnızca maç ekranında (oyuncu maçı ya da TD canlı maç). Ana menü,
     ödül töreni, takvim: tamamen sessiz.
   - Reklam: oyun takvimi her 10 haftayı geçtiğinde (tek tek ilerletirken de,
     4 hafta / sezon sonu gibi toplu ilerletirken de) bir geçiş reklamı.
   ============================================================ */
const CRWD = { buf: {}, ready: 0, loading: 0 };
function crwdDecode() {
  if (CRWD.loading || !SND.ctx || typeof CROWDDATA === 'undefined') return; CRWD.loading = 1;
  Object.keys(CROWDDATA).forEach(k => {
    try {
      const bin = atob(CROWDDATA[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const done = b => { CRWD.buf[k] = b; if (k === 'loop') crwdSwap(); };
      const pr = SND.ctx.decodeAudioData(u.buffer, done, () => { }); if (pr && pr.then) pr.then(done, () => { });
    } catch (e) { }
  });
}
function crwdSwap() {
  const c = SND.ctx, b = CRWD.buf.loop; if (!c || !b || CRWD.ready) return; CRWD.ready = 1;
  try {
    if (SND.crowd) { try { SND.crowd.stop(); } catch (e) { } }
    const g0 = SND.cg || c.createGain(); if (!SND.cg) { g0.gain.value = 0; g0.connect(SND.master); SND.cg = g0; }
    const s = c.createBufferSource(), f = c.createBiquadFilter(), boost = c.createGain(); s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 6000; boost.gain.value = 2.2;
    s.connect(f); f.connect(boost); boost.connect(g0); s.start(0, Math.random() * Math.max(0, b.duration - 1)); SND.crowd = s;
  } catch (e) { }
}
const _sndInit42 = sndInit;
sndInit = function () { _sndInit42(); try { crwdDecode(); if (CRWD.buf.loop && !CRWD.ready) crwdSwap(); } catch (e) { } };
function crwdPlay(k, vol) {
  const c = SND.ctx, b = CRWD.buf[k]; if (!c || !b || c.state !== 'running') return false;
  try { const s = c.createBufferSource(), g0 = c.createGain(); g0.gain.value = vol; s.buffer = b; s.playbackRate.value = rf(.95, 1.05); s.connect(g0); g0.connect(SND.master); s.start(); return true; } catch (e) { return false; }
}
const sndHere = () => { try { return SND.force || inMatch(); } catch (e) { return false; } };
const _sfx42 = sfx;
sfx = function (k, a) {
  if (!sndHere()) return;
  if (setOf('crowd')) {
    if (k === 'roar' && crwdPlay('roar', .9)) return;
    if (k === 'ooh' && crwdPlay('ooh', .7 * (a == null ? 1 : Math.min(1.3, a)))) return;
    if (k === 'groan' && crwdPlay('groan', .65)) return;
  }
  return _sfx42(k, a);
};
const _clap42 = clap;
clap = function (t0) { if (!sndHere()) return; return _clap42(t0); };
/* tribün seviyesi: TD canlı maçta da uğultu sürsün; menüde sus */
const _crowdLvl42 = crowdLvl;
crowdLvl = function (v) {
  if (!sndHere()) v = 0;
  else if (v === 0 && typeof scr !== 'undefined' && scr === 'lmatch' && typeof LM !== 'undefined' && LM && LM.auto && !LM.fin && !LM.pz) v = .1;
  return _crowdLvl42(v);
};
setInterval(() => { try { if (typeof scr !== 'undefined' && scr === 'lmatch' && LM && LM.auto && !LM.fin && !LM.pz && SND.ctx) crowdLvl(.1); } catch (e) { } }, 1500);
/* ses denemesi ayarlardan: kısa süreliğine izin ver */
if (typeof setTest === 'function') { const _st42 = setTest; setTest = function () { SND.force = 1; setTimeout(() => { SND.force = 0; }, 3500); try { sndInit(); } catch (e) { } return _st42(); }; }

/* ---------- reklam: takvimde her 10 haftada bir ---------- */
const adAbs = () => g ? g.season * 60 + (g.week || 0) : null; /* kayda özel: g.adAbs */
adWeekTick = function () { };
function adCheck42() {
  if (!g || typeof acct !== 'function' || g.phase === 'child' || (typeof scr !== 'undefined' && scr !== 'game')) return;
  const a = adAbs(); if (a == null) return;
  if (g.adAbs == null || a < g.adAbs || a - g.adAbs > 30) { g.adAbs = a; return; } /* çocukluk / emeklilik yılları: sezon reklamı zaten var */
  if (a - g.adAbs >= ADCFG.everyWeeks) { g.adAbs = a; adInterNow(); }
}
const _draw42 = draw;
draw = function () { _draw42(); try { if (typeof scr === 'undefined' || (scr !== 'match' && scr !== 'lmatch')) adCheck42(); } catch (e) { } };

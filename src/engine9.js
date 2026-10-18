/* ============================================================
   MİRAS FC — MAÇ MOTORU v9 · "Canlı maç"
   engine8'in üstüne, oynanışı bozmadan maçı yaşayan bir yayına çevirir:
   1) Stadyum sesi (WebAudio, dosya yok): top vuruşu, düdük, ağ,
      direk, "ooo" ve gol kükremesi; kaleye yaklaştıkça tribün
      uğultusu yükselir. Maç ekranında 🔊 düğmesiyle kapatılır.
   2) Canlı spiker: her olaya kısa bir yorum satırı (sahanın altında).
   3) Gol tekrarı: golden sonra son saniyeler ağır çekimde, top
      takipli kamerayla yeniden oynar. Dokununca geçilir.
   4) Kaleci: plonjon (topa doğru uçar, yere düşer), bire birde
      kaleden çıkıp açıyı daraltır (aşırtma o zaman çok değerli).
   5) Oyuncular: hıza göre koşu adımı, kol sallama, koşu yönüne eğilme,
      sırtı dönükken arkadaki forma numarası; araya girende kayarak
      müdahale.
   6) Yorgunluk: 55. dakikadan sonra kondisyonun düşükse sen ve
      arkadaşların yavaşlar, topa basma süren kısalır; rakip de yorulur.
   7) Hava: yağmurda top kayar (hızlı, ilk dokunuş zor), karda yavaşlar;
      rüzgâr havadan pasları sürükler.
   8) Top: dönerek yuvarlanır, yükseldikçe gölgesi küçülür ve solar.
   ============================================================ */
const V9 = { rpPre: 2.8, rpPost: .9, rpSpd: .5, base: null };

/* ---------- 1) ses ---------- */
const SND = { on: (() => { try { return localStorage.getItem('mfc_snd') !== '0'; } catch (e) { return true; } })(), ctx: null, noise: null, master: null, crowd: null, cg: null };
function sndInit() {
  if (!SND.on) return;
  try {
    if (!SND.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = SND.ctx = new AC(); SND.master = c.createGain(); SND.master.gain.value = .9; SND.master.connect(c.destination);
      const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; SND.noise = b;
    }
    if (SND.ctx.state === 'suspended') SND.ctx.resume();
    if (!SND.crowd) crowdStart();
  } catch (e) { }
}
function sndToggle() {
  SND.on = !SND.on; try { localStorage.setItem('mfc_snd', SND.on ? '1' : '0'); } catch (e) { }
  if (SND.on) sndInit(); else if (SND.cg && SND.ctx) SND.cg.gain.setTargetAtTime(0, SND.ctx.currentTime, .1);
  toast(SND.on ? '🔊 Ses açık' : '🔇 Ses kapalı'); drawUIControls();
}
function nz(dur, f, q, g, type, t0, f1) {
  const c = SND.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain(), t = c.currentTime + (t0 || 0);
  s.buffer = SND.noise; fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q || 1;
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + Math.min(.25, dur * .3)); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(gn); gn.connect(SND.master); s.start(t, Math.random()); s.stop(t + dur + .05);
}
function tone(f0, f1, dur, g, type, t0, lfo) {
  const c = SND.ctx, o = c.createOscillator(), gn = c.createGain(), t = c.currentTime + (t0 || 0);
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (lfo) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfo[0]; lg.gain.value = lfo[1]; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + .008); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(gn); gn.connect(SND.master); o.start(t); o.stop(t + dur + .05);
}
function sfx(k, a) {
  if (!SND.on || !SND.ctx || SND.ctx.state !== 'running') return;
  try {
    a = a == null ? 1 : a;
    if (k === 'kick') { tone(150, 48, .16, .55 * cl(a, .4, 1.4), 'sine'); nz(.07, 1400, .7, .28 * cl(a, .5, 1.3), 'lowpass'); }
    else if (k === 'touch') { tone(120, 60, .09, .22, 'sine'); nz(.04, 900, .7, .1, 'lowpass'); }
    else if (k === 'whistle') { const n = a > 1 ? 2 : 1; for (let i = 0; i < n; i++) tone(2850, 2750, .3, .1, 'sine', i * .38, [32, 140]); }
    else if (k === 'net') nz(.45, 2600, .6, .16, 'highpass');
    else if (k === 'post') { tone(1250, 1180, .7, .16, 'triangle'); tone(1870, 1800, .5, .08, 'triangle'); }
    else if (k === 'ooh') { nz(1.3, 380, 2.2, .3 * a, 'bandpass', 0, 650); nz(1.1, 700, 2, .12 * a, 'bandpass', .1, 420); }
    else if (k === 'roar') { nz(3.4, 520, .8, .55, 'bandpass'); nz(3, 1150, 1.1, .25, 'bandpass', .05); nz(2.2, 240, .9, .2, 'bandpass', .1); }
    else if (k === 'groan') nz(.9, 300, 1.5, .14, 'bandpass', 0, 200);
  } catch (e) { }
}
/* tribün: sürekli uğultu, kaleye yaklaştıkça artar */
function crowdStart() {
  try { const c = SND.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = SND.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 620; f.Q.value = .45; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(SND.master); s.start(); SND.crowd = s; SND.cg = g; } catch (e) { }
}
function crowdLvl(v) { if (SND.cg && SND.ctx) SND.cg.gain.setTargetAtTime(SND.on ? v : 0, SND.ctx.currentTime, .35); }
setInterval(() => { if (!S || !$('cv')) crowdLvl(0); }, 600);
if (document.addEventListener) document.addEventListener('visibilitychange', () => { try { if (!SND.ctx) return; if (document.hidden) SND.ctx.suspend(); else if (SND.on && S) SND.ctx.resume(); } catch (e) { } });

/* ---------- 2) canlı spiker ---------- */
const COM = {
  shot: ['{0} vuruyor!', 'Ve şut... {0}!', '{0} kaleyi yokluyor!', 'Şut geliyor, {0}!'],
  longshot: ['{0} uzaktan deniyor!', 'Uzaktan bir füze, {0}!', '{0} ceza sahası dışından vurdu!'],
  chip: ['{0} kalecinin üstünden aşırtıyor!'],
  goal: ['GOOOL! {0} ağları sarstı!', 'Ve gol! Tribünler ayakta, {0}!', 'Muhteşem! {0} topu ağlara gönderdi!', 'Kaleci çaresiz, gol {0}!'],
  save: ['Kaleci son anda çıkardı!', 'Harika kurtarış!', 'Kaleci uzandı ve kurtardı!', 'Eldivenler konuştu!'],
  post: ['Direk! Top direkten döndü!', 'Olamaz! Direğe çarptı!'],
  wide: ['Az farkla dışarıda.', 'Top auta gidiyor.', 'İsabetsiz bir vuruş.'],
  over: ['Üstten dışarı!', 'Top tribüne gitti!'],
  pass: ['{0} topu {1} ile buluşturdu.', 'Top {1} oyuncusunda.', '{0} pasını verdi, {1} kontrol etti.', 'Sakin bir pas, {1} topla.'],
  bigpass: ['Harika bir pas! {0} savunmayı ikiye böldü.', 'Ne pas ama! {0} oyunu açtı.', '{0} çizgi gibi bir pas çıkardı!'],
  drib: ['{0} topu sürüyor.', '{0} boşluğa hareketleniyor.', '{0} topla ilerliyor.'],
  cut: ['Pas kesildi, savunma okudu.', 'Araya girdiler, top kaybedildi.'],
  tackle: ['Kayarak müdahale, top kaybedildi!', 'Savunma topu ayaktan aldı.'],
  off: ['Bayrak havada, ofsayt!', 'Yan hakem ofsayt diyor.'],
  foul: ['Faul! Hakem düdüğü çaldı.', 'Sert müdahale, hakem oyunu durdurdu.'],
  badtouch: ['Kontrol kötü, top ayaktan açıldı!', 'İlk dokunuş tutmadı!'],
  loose: ['Top boşta! Kim alacak?'],
  win: ['Top yine bizde!', 'Kazanılan top, atak başlıyor!'],
  block: ['Şut bloke edildi!', 'Savunma kendini topun önüne attı!'],
  air: ['Hava topunu savunma kazandı.'],
  combo: ['Ne güzel paslaşma, {0} pas üst üste!'],
  tired: ['Oyuncularda yorgunluk belirtileri var.', 'Bacaklar ağırlaşmaya başladı.'],
  gkout: ['Kaleci kalesini terk ediyor, açıyı daraltıyor!'],
  rain: ['Zemin ıslak, top kayıyor.'],
  snow: ['Karlı zeminde top yavaş ilerliyor.'],
  wind: ['Rüzgâr havadan topları etkiliyor.'],
  replay: ['Golü bir kez daha izleyelim...', 'Tekrarda o anı görelim...'],
};
const nm = p => !p ? '' : p.me ? g.name : short(p.n);
function say(k, a, b) {
  const s = S, L = COM[k]; if (!s || !L) return;
  s.comI = (s.comI || 0) + 1; let t = L[(Math.floor(Math.random() * L.length) + s.comI) % L.length];
  t = t.replace('{0}', a || '').replace('{1}', b || ''); s.com = { txt: t, t: s.t };
}
/* olay yazısından spiker ve sese */
const _flash9 = flash;
flash = function (txt) {
  _flash9(txt); const s = S; if (!s || !txt) return;
  const r = s.run, has = w => txt.indexOf(w) >= 0;
  if (/TAM ORTASI|İYİ VURUŞ|KENARINDAN|ISKALADIN|GEÇ KALDIN|KOŞU VERİLDİ/.test(txt)) return;
  if (has('GOL')) { say('goal', nm(r && r.car)); sfx('net'); sfx('roar'); return; }
  if (has('KURTARIŞ') || has('KALECİ ÇELDİ')) { say('save'); sfx('ooh', 1.1); return; }
  if (has('DİREK')) { say('post'); sfx('post'); sfx('ooh', 1.2); return; }
  if (has('ÜSTTEN')) { say('over'); sfx('ooh', .8); return; }
  if (has('AUT')) { say('wide'); sfx('ooh', .7); return; }
  if (has('OFSAYT')) { say('off'); sfx('whistle', 1); return; }
  if (has('FAUL')) { say('foul'); sfx('whistle', 2); return; }
  if (has('KÖTÜ KONTROL') || has('KONTROL')) { say('badtouch'); sfx('groan'); return; }
  if (has('BOŞTA')) { say('loose'); return; }
  if (has('BLOK')) { say('block'); sfx('ooh', .6); return; }
  if (has('HAVA TOPU') || has('UZAKLAŞTIRDI')) { say('air'); return; }
  if (has('KESİLDİ')) { say(r && r.k === 'drib' ? 'tackle' : 'cut'); sfx('groan'); return; }
  if (has('TOP SENDE') || has('TOP BİZDE') || has('TOPU KAPTIN')) { say('win'); return; }
  if (has('PAS') && r && r.k === 'pass') { if ((s.combo || 0) >= 4 && Math.random() < .5) return say('combo', String(s.combo)); return say(has('HARİKA') || has('MUHTEŞEM') ? 'bigpass' : 'pass', nm(r.car), nm(r.to)); }
  if ((has('SÜRDÜ') || has('💨')) && r && r.k === 'drib' && Math.random() < .6) return say('drib', nm(r.car));
};

/* ---------- 6) yorgunluk + 7) hava: her sahnede hızlar yeniden ayarlanır ---------- */
function fatigue() {
  const s = S; if (!s) return { us: 0, th: 0 }; const f = cl((s.min - 55) / 35, 0, 1);
  return { us: f * cl(1.25 - (g.fit == null ? 70 : g.fit) / 100, .35, 1), th: f * .6 };
}
const _mkScene8 = mkScene;
mkScene = function (mo) {
  if (!V9.base) V9.base = { mateV: V7.mateV, defV: V6.defV, dribV: V5.dribV, passV: V5.passV, longV: V5.longV };
  const B = V9.base; Object.assign(V7, { mateV: B.mateV }); V6.defV = B.defV; Object.assign(V5, { dribV: B.dribV, passV: B.passV, longV: B.longV });
  const r = _mkScene8(mo), s = S; if (!s) return r;
  const F = fatigue(), wet = s.wx === 'yagmur', snow = s.wx === 'kar'; s.fat = F;
  V7.mateV = B.mateV * (1 - .1 * F.us); V6.defV = B.defV * (1 - .08 * F.th);
  V5.dribV = B.dribV * (1 - .1 * F.us) * (snow ? .92 : 1); V5.passV = B.passV * (wet ? 1.06 : snow ? .9 : 1); V5.longV = B.longV * (snow ? .94 : 1);
  s.com = null; s.fr = []; s.frC = 0; s.rp = null; s.gkOut = 0;
  s.P.forEach(p => { p.dive = null; p.dvp = 0; p.slide = null; p.slp = 0; p.cyc = Math.random() * 6; });
  if (M) {
    if (F.us > .4 && !M.saidTired) { M.saidTired = 1; say('tired'); }
    else if (wet && !M.saidWx) { M.saidWx = 1; say('rain'); }
    else if (snow && !M.saidWx) { M.saidWx = 1; say('snow'); }
    else if (Math.abs(s.wind || 0) > .45 && !M.saidWx) { M.saidWx = 1; say('wind'); }
  }
  return r;
};
/* yorgunken topa basma süresi kısalır */
const _doPath8 = doPath;
doPath = function (P, ev0) { _doPath8(P, ev0); const s = S; if (s && s.phase === 'tap' && s.tp && s.fat) s.tp.dur *= 1 - .14 * s.fat.us; };

/* ---------- vuruş: rüzgâr, ses, spiker, kaleci plonjonu ---------- */
const _launch8 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  const s = S, car = s.car; oy = oy || 0;
  /* rüzgâr havadan pası sürükler */
  if (ev.k === 'pass' && (oy > .2 || (s.type === 'fk' && s.dead && oy > -.2)) && Math.abs(s.wind || 0) > .05 && P.length >= 2) {
    P = P.slice(); const e = P[P.length - 1], L = plen(P); P[P.length - 1] = { x: cl(e.x + s.wind * L * .035, 1, 67), y: e.y };
  }
  const pw = s.stickPw || 1;
  _launch8(P, ev, q, oy, ox);
  const r = s.run; if (!r || S !== s) return;
  sfx(r.k === 'drib' ? 'touch' : 'kick', r.k === 'shot' ? pw * 1.2 : pw);
  if (r.k === 'shot') {
    const D = toGoal(car); if (r.res && r.res.chip) say('chip', nm(car)); else say(D > 22 ? 'longshot' : 'shot', nm(car));
    /* plonjon: kaleci topa doğru uçar */
    const k = s.gk, a = k && S.anims.find(x => x.o === k);
    if (k && a && Math.abs(a.x1 - a.x0) > 1.05 && !(r.res && (r.res.over || r.res.wide))) { k.dive = { dir: a.x1 > a.x0 ? 1 : -1, t0: s.t, T: Math.max(.25, a.d) }; k.down = 0; }
    else if (k && r.res && (r.res.wide || r.res.over) && Math.random() < .5) { k.dive = { dir: (r.res.x || 34) > k.x ? 1 : -1, t0: s.t + .1, T: .45 }; k.down = 0; }
  }
};
/* kaleci önde ve top yerden gelirse, açıyı daraltmış olduğu için bazen kurtarır */
const _shotResult8 = shotResult;
shotResult = function (P, run) {
  const res = _shotResult8(P, run), k = S.gk; if (!k || S.type === 'pen' || S.head) return res;
  const out = 105 - k.y; if (res.goal && !res.chip && out > 3 && Math.random() < (out - 3) * .055) Object.assign(res, { goal: false, save: true, held: false, x: k.x + rf(-.8, .8) });
  return res;
};
/* ---------- 4) bire birde kaleci çıkar ---------- */
const _gkPlace8 = gkPlace;
gkPlace = function () {
  _gkPlace8(); const s = S, k = s && s.gk, car = s && s.car; if (!k || s.mode !== 'atk' || !car || s.type === 'pen' || s.dead) return;
  const D = toGoal(car); if (D > 21 || car.y < 78) return;
  const cover = s.P.some(d => d.side === 'th' && !d.gk && d.y > car.y + .5 && Math.abs(d.x - car.x) < 5.5);
  if (cover) return;
  const out = Math.min(D - 3, cl((21 - D) * .45 + 3, 3, 8)), ang = Math.atan2(car.x - 34, 105 - car.y);
  k.x = cl(34 + Math.sin(ang) * out, 22, 46); k.y = 104.4 - Math.cos(ang) * out; k.down = 0;
  if (!s.gkOut) { s.gkOut = 1; say('gkout'); sfx('ooh', .5); }
};
/* ---------- 7) ıslak zeminde ilk dokunuş daha zor ---------- */
const _pathDone8 = pathDone;
pathDone = function (r) {
  const s = S;
  if (r.k === 'pass' && r.to && !r.off && !r.ft && !r.wx && s.wx === 'yagmur') {
    const to = r.to, e = r.P[r.P.length - 1]; if (Math.hypot(to.x - e.x, to.y - e.y) <= 1.1) { r.wx = 1; if (Math.random() < .06) { const a = rf(0, 6.28); flash('😬 KÖTÜ KONTROL'); if (r.car === s.me) M.my.bad++; return looseBall({ x: e.x + Math.sin(a) * 2.5, y: e.y + Math.cos(a) * 2.5 }); } }
  }
  if (r.k === 'pass' && r.to) sfx('touch');
  return _pathDone8(r);
};
/* ---------- 5) kayarak müdahale ---------- */
const _pathFail8 = pathFail;
pathFail = function (r) {
  const s = S, d = r.fail && r.fail.d;
  if (d && !r.fail.miss && !d.wallP && (r.k === 'drib' || Math.random() < .45)) { d.slide = { dir: s.ball.x >= d.x ? 1 : -1, t0: s.t }; sfx('touch'); }
  return _pathFail8(r);
};

/* ---------- 3) gol tekrarı ---------- */
function rpSnap(s) {
  return { c: s.frC, P: s.P.map(p => [p, p.x, p.y, p.dx, p.dy, p.spd || 0, p.cyc || 0, p.dvp || 0, p.slp || 0, p.down || 0]), b: [s.ball.x, s.ball.y, s.ball.z || 0, s.ball.rot || 0] };
}
function rpApply(s, f) {
  s.rpSave = rpSnap(s);
  f.P.forEach(([p, x, y, dx, dy, spd, cyc, dvp, slp, down]) => { p.x = x; p.y = y; p.dx = dx; p.dy = dy; p.spd = spd; p.cyc = cyc; p.dvp = dvp; p.slp = slp; p.down = down; });
  Object.assign(s.ball, { x: f.b[0], y: f.b[1], z: f.b[2], rot: f.b[3] });
}
function rpRestore(s) { const f = s.rpSave; if (!f) return; s.rpSave = null; f.P.forEach(([p, x, y, dx, dy, spd, cyc, dvp, slp, down]) => { p.x = x; p.y = y; p.dx = dx; p.dy = dy; p.spd = spd; p.cyc = cyc; p.dvp = dvp; p.slp = slp; p.down = down; }); Object.assign(s.ball, { x: f.b[0], y: f.b[1], z: f.b[2], rot: f.b[3] }); }
const _endScene8 = endScene;
endScene = function (b, good) {
  const s = S, live = s && s.phase !== 'done';
  _endScene8(b, good);
  if (live && s && good && b && /^GOL/.test(b.t) && s.mode === 'atk' && (s.fr || []).length > 20) { s.rpRec = V9.rpPost; s.rpGoal = s.frC; }
};

/* ---------- her kare: hareket, animasyon sayaçları, kayıt, tekrar ---------- */
const _step8 = step;
step = function (dt) {
  const s = S; if (!s) return;
  if (s.rpSave) rpRestore(s);
  const B = s.ball, bx = B.x, by = B.y;
  _step8(dt); if (!S || S !== s) return;
  if (dt > 0) {
    s.P.forEach(p => {
      p.cyc = (p.cyc || 0) + dt * (2.5 + Math.min(9, p.spd || 0) * 1.6);
      if (p.dive) p.dvp = cl((s.t - p.dive.t0) / p.dive.T, 0, 1); else p.dvp = 0;
      if (p.slide) p.slp = cl((s.t - p.slide.t0) / .35, 0, 1); else p.slp = 0;
    });
    const mv = Math.hypot(B.x - bx, B.y - by); B.rot = ((B.rot || 0) + mv / .35) % 628; B.vs = mv / dt;
    /* tribün uğultusu */
    if (SND.ctx && !s.rp) { const near = s.mode === 'atk' && s.phase !== 'done' ? cl(1 - toGoal(B) / 40, 0, 1) : 0; crowdLvl(.045 + near * .11 + (s.phase === 'run' && s.run && s.run.k === 'shot' ? .08 : 0)); }
    /* kayıt: oyun akarken (topa basma ekranı hariç) */
    const recording = s.phase !== 'tap' && (s.phase !== 'done' || s.rpRec > 0) && !s.rp;
    if (recording) {
      s.frC += dt; (s.fr = s.fr || []).push(rpSnap(s));
      const keep = V9.rpPre + V9.rpPost + .6; while (s.fr.length && s.frC - s.fr[0].c > keep) s.fr.shift();
      if (s.phase === 'done' && (s.rpRec -= dt) <= 0) {
        s.rpRec = 0; const F = s.fr.filter(f => f.c >= s.rpGoal - V9.rpPre);
        if (F.length > 10) s.rpReady = { F, i: 0, t: -.35, T: F[F.length - 1].c - F[0].c, c0: F[0].c, goal: s.rpGoal - F[0].c };
      }
    }
    /* tekrar: gol sevinci bittikten sonra başlar (ayarlardan kapatılabilir) */
    if (s.rpReady && !s.cel && !s.rp) { const R0 = s.rpReady; s.rpReady = null; if (typeof setOf !== 'function' || setOf('rp')) { s.rp = R0; say('replay'); drawUIControls(); } }
  }
  /* tekrarı oynat */
  if (s.rp) {
    const rp = s.rp; rp.t += dt * V9.rpSpd;
    if (rp.t > rp.T + .25) { s.rp = null; s.fr = []; crowdLvl(.05); drawUIControls(); return; }
    if (rp.t >= 0) {
      while (rp.i < rp.F.length - 1 && rp.F[rp.i + 1].c - rp.c0 <= rp.t) rp.i++;
      if (!rp.net && rp.t >= rp.goal) { rp.net = 1; s.net = s.t; sfx('net'); }
      rpApply(s, rp.F[rp.i]);
    }
  }
};
const _camWant8 = camWant;
camWant = function () { const s = S; if (!s || !s.rp) return _camWant8(); const ph = s.phase; s.phase = 'run'; const r = _camWant8(); s.phase = ph; return r; };
const _bind8 = bindInput;
bindInput = function (cv) {
  _bind8(cv); const d0 = cv.onpointerdown;
  cv.onpointerdown = ev => { sndInit(); if (S && S.rp) { ev.preventDefault(); S.rp.t = 1e9; return; } return d0 && d0(ev); };
};

/* ---------- çizim ---------- */
const _drawScene8 = drawScene;
drawScene = function () {
  const s = S; if (!s) return _drawScene8();
  const rpOn = s.rp && s.rp.t >= 0, keep = rpOn ? { banner: s.banner, flash: s.flash, trail: s.trail, parts: s.parts, stick: s.stick } : null;
  if (rpOn) { s.banner = null; s.flash = null; s.trail = null; s.parts = []; s.stick = null; }
  _drawScene8();
  if (keep) Object.assign(s, keep);
  const cv = $('cv'); if (!cv) return; const x = cv.getContext('2d'); if (!x) return;
  const W = CV.W, H = CV.H; x.save(); x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
  if (rpOn) {
    const bh = Math.round(H * .07); x.fillStyle = 'rgba(0,0,0,.85)'; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh);
    const vg = x.createRadialGradient(W / 2, H / 2, W * .35, W / 2, H / 2, W * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vg; x.fillRect(0, bh, W, H - bh * 2);
    const bl = (Math.sin(performance.now() / 260) + 1) / 2;
    x.font = '800 15px "Barlow Condensed",sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = `rgba(255,70,60,${.6 + bl * .4})`; x.beginPath(); x.arc(16, bh / 2, 5, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.fillText(T('🔁 TEKRAR · AĞIR ÇEKİM'), 28, bh / 2);
    x.textAlign = 'right'; x.font = '600 11px "Barlow",sans-serif'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(T('Geçmek için dokun'), W - 12, H - bh / 2);
    const k = cl(s.rp.t / s.rp.T, 0, 1); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(12, H - bh + 4, W * .45, 3); x.fillStyle = '#ffe34d'; x.fillRect(12, H - bh + 4, W * .45 * k, 3);
  }
  /* yorgunluk göstergesi */
  if (!rpOn && s.fat && s.fat.us > .12 && s.mode === 'atk' && s.phase !== 'done') {
    const f = 1 - s.fat.us * .8, bx = 8, by = 56; x.fillStyle = 'rgba(0,0,0,.45)'; rr(x, bx, by, 64, 20, 10); x.fill();
    x.font = '12px sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#fff'; x.fillText('🔋', bx + 6, by + 10);
    x.fillStyle = 'rgba(255,255,255,.2)'; rr(x, bx + 24, by + 7, 32, 6, 3); x.fill(); x.fillStyle = f > .6 ? '#56c98d' : f > .4 ? '#e8c468' : '#ff6b5b'; rr(x, bx + 24, by + 7, 32 * f, 6, 3); x.fill();
  }
  /* spiker satırı */
  const c = s.com, showC = c && c.txt && s.t - c.t < 3.4 && s.phase !== 'tap';
  if (showC) {
    const a = cl(Math.min((s.t - c.t) / .2, (3.4 - (s.t - c.t)) / .5), 0, 1), txt = '🎙️ ' + T(c.txt);
    x.globalAlpha = a; x.font = '600 13px "Barlow",sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'center';
    let tw = x.measureText(txt).width + 20; if (tw > W - 16) { x.font = '600 11px "Barlow",sans-serif'; tw = Math.min(W - 16, x.measureText(txt).width + 20); }
    const yy = rpOn ? H - Math.round(H * .07) - 22 : H - 52; x.fillStyle = 'rgba(8,14,12,.78)'; rr(x, W / 2 - tw / 2, yy - 12, tw, 24, 12); x.fill();
    x.fillStyle = '#e8c468'; x.fillRect(W / 2 - tw / 2 + 10, yy + 9, 22, 2); x.fillStyle = '#fff'; x.fillText(txt, W / 2, yy, W - 28); x.globalAlpha = 1;
  }
  x.restore();
};
/* oyuncu: hıza göre koşu, yöne eğilme, sırtta numara, plonjon ve kayma */
drawPl = function (x, p) {
  const s = S, v = P3(p.x, p.y, 0), sc = PR.sc, h = Math.max(9, sc * 1.25), w = h * .42;
  if (v.X < -24 || v.X > CV.W + 24 || v.Y < -34 || v.Y > CV.H + 34) return;
  const X = v.X, Y = v.Y, spd = p.spd || 0, mv = cl(spd / 5.5, 0, 1), run = Math.sin(p.cyc || 0) * mv, bob = Math.abs(Math.cos(p.cyc || 0)) * mv * h * .05;
  const back = p.dy != null && p.dy > .35 && !p.gk, dvp = p.dive ? (p.dvp || 0) : 0, slp = p.slide ? (p.slp || 0) : 0;
  let ang = 0, lift = 0;
  if (dvp > 0) { const e = 1 - Math.pow(1 - dvp, 2); ang = p.dive.dir * Math.PI / 2 * .92 * e; lift = Math.sin(Math.min(1, dvp) * Math.PI) * h * .45; }
  else if (slp > 0) ang = p.slide.dir * Math.PI / 2 * .85 * Math.min(1, slp * 1.5);
  else if (p.down > 0) ang = (p.x < 34 ? -1 : 1) * Math.PI / 2 * Math.min(1, p.down * 1.6);
  else ang = (p.dx || 0) * mv * .22;
  /* gölge */
  x.fillStyle = `rgba(0,0,0,${.28 - lift / h * .2})`; x.beginPath(); x.ellipse(X + 2 + Math.sin(ang) * h * .35, Y, w * (.8 + Math.abs(Math.sin(ang)) * .9), w * .32, 0, 0, 7); x.fill();
  if (p.me) { x.strokeStyle = '#ffe34d'; x.lineWidth = 2; x.beginPath(); x.ellipse(X, Y, w * 1.25, w * .5, 0, 0, 7); x.stroke(); }
  if (slp > 0 && slp < 1) { x.fillStyle = `rgba(190,170,120,${.5 * (1 - slp)})`; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(X - p.slide.dir * (i * 4 + 4), Y - 2 + (i % 2) * 3, 2.5 + i * .6, 0, 7); x.fill(); } }
  x.save(); x.translate(X, Y - lift - bob); x.rotate(ang);
  const shirt = p.c[0], trim = p.c[1] || '#fff', shorts = lum(shirt) > 150 ? '#22262b' : trim, stride = run * h * .07;
  /* bacaklar: adım */
  x.fillStyle = '#111'; x.fillRect(-w * .38 + run * w * .1, -h * .3 + stride, w * .3, h * .3 - stride); x.fillRect(w * .08 - run * w * .1, -h * .3 - stride, w * .3, h * .3 + stride);
  x.fillStyle = p.skin; x.fillRect(-w * .36 + run * w * .1, -h * .36 + stride, w * .26, h * .1); x.fillRect(w * .1 - run * w * .1, -h * .36 - stride, w * .26, h * .1);
  x.fillStyle = shorts; x.fillRect(-w * .45, -h * .5, w * .9, h * .2);
  /* kollar: bacakların tersine sallanır */
  const arm = -run * h * .08;
  x.fillStyle = shirt; x.fillRect(-w * .66, -h * .8 + arm, w * .2, h * .24); x.fillRect(w * .46, -h * .8 - arm, w * .2, h * .24);
  x.fillStyle = p.gk ? '#ffe34d' : p.skin; x.fillRect(-w * .65, -h * .58 + arm, w * .18, h * .08); x.fillRect(w * .47, -h * .58 - arm, w * .18, h * .08);
  /* gövde */
  x.fillStyle = shirt; x.fillRect(-w * .5, -h * .82, w, h * .36);
  if (!back) { x.fillStyle = trim; x.fillRect(-w * .5, -h * .82, w * .16, h * .36); x.fillRect(w * .34, -h * .82, w * .16, h * .36); }
  else if (h > 13 && p.num) { x.fillStyle = lum(shirt) > 150 ? '#111' : '#fff'; x.font = `800 ${Math.round(h * .3)}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.num, 0, -h * .64); }
  /* baş: arkadan saç, önden yüz */
  x.fillStyle = p.skin; x.beginPath(); x.arc(0, -h * .92, w * .32, 0, 7); x.fill();
  x.fillStyle = '#1b130c'; x.beginPath(); if (back) x.arc(0, -h * .93, w * .31, 0, 7); else x.arc(0, -h * .96, w * .32, Math.PI * 1.05, Math.PI * 1.95); x.fill();
  x.restore();
  if ((p.me || (p.gk && s.mode === 'atk') || s.ball.owner === p) && !dvp && !slp) {
    const lbl = p.me ? T('SEN') : short(p.n); x.font = '600 10px "Barlow",sans-serif'; x.textAlign = 'center'; const tw = x.measureText(lbl).width + 6, ly = Y - h - 14 - bob;
    x.fillStyle = p.me ? 'rgba(255,227,77,.95)' : 'rgba(6,10,12,.6)'; rr(x, X - tw / 2, ly, tw, 12, 3); x.fill(); x.fillStyle = p.me ? '#111' : '#fff'; x.textBaseline = 'middle'; x.fillText(lbl, X, ly + 6); x.textAlign = 'left';
  }
};
/* top: yuvarlanarak döner, yükseldikçe gölgesi küçülür */
drawBall = function (x) {
  const B = S.ball, z = B.z || 0, g0 = P3(B.x, B.y, 0), v = P3(B.x, B.y, z + .1), r = Math.max(3, PR.sc * .3) * (1 + z * .05), rot = B.rot || 0;
  const sa = cl(.32 - z * .03, .1, .32), sr = r * cl(1 - z * .04, .55, 1);
  x.fillStyle = `rgba(0,0,0,${sa})`; x.beginPath(); x.ellipse(g0.X + 1 + z * .6, g0.Y + 1, sr, sr * .55, 0, 0, 7); x.fill();
  if ((B.vs || 0) > 14 && z < 4) { const a = Math.atan2(v.Y - (B.py || v.Y), v.X - (B.px || v.X)); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = r * 1.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(v.X, v.Y); x.lineTo(v.X - Math.cos(a) * r * 3, v.Y - Math.sin(a) * r * 3); x.stroke(); x.lineCap = 'butt'; }
  B.px = v.X; B.py = v.Y;
  const gr = x.createRadialGradient(v.X - r * .35, v.Y - r * .4, r * .1, v.X, v.Y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b8c0c4');
  x.fillStyle = gr; x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.clip(); x.fillStyle = '#222';
  for (let i = 0; i < 3; i++) { const a = rot + i * 2.094, px = v.X + Math.cos(a) * r * .55, py = v.Y + Math.sin(a * .7 + i) * r * .45; x.beginPath(); x.arc(px, py, r * .28, 0, 7); x.fill(); }
  x.restore(); x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1; x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.stroke();
};
/* panel: ses düğmesi */
const _ctlHTML8 = ctlHTML;
ctlHTML = function () {
  const h = _ctlHTML8(); if (!S) return h;
  const sb = `<button class="btn ghost sm" onclick="sndToggle()">${SND.on ? '🔊 Ses' : '🔇 Ses kapalı'}</button>`;
  if (S.rp) return `<div class="hint">${esc(T('🔁 Gol tekrarı oynatılıyor. Geçmek için sahaya dokun.'))}</div>` + h + sb;
  return S.phase === 'draw' || S.phase === 'done' ? h + sb : h;
};

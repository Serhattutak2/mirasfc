/* ============================================================
   MİRAS FC — v3.8 · "Stadyum"
   1) iPhone'da ses: iOS sesi ancak dokunuş BİTİNCE (touchend/click)
      açar; burada açılır, sessiz modda da çalar (audioSession=playback).
   2) Konuşan spiker: oyunun diline göre Türkçe ya da İngilizce ses
      (cihazın konuşma motoru, dosya gerekmez). Gol, kurtarış gibi
      büyük anlar sözü keser; küçük olaylar sırayı bekler.
   3) Ayarlar: ses efektleri, taraftar sesi, spiker sesi, spiker yazısı,
      ses düzeyi, gol sevinci, gol tekrarı, dil. Menüde ve maç ekranında.
   4) Gol sevinci: kamera golcüye yakınlaşır, golcü köşe bayrağına
      koşar ve kollarını açar, arkadaşları üstüne koşar, rakipler
      başını tutar; dev "GOL!" yazısı, havai fişek, tribünde meşale.
      Sonra ağır çekim tekrar.
   5) Yeni oyuncular: daha büyük ve ayrıntılı (saç modeli, saç rengi,
      krampon rengi, takıma göre forma deseni: düz, çubuklu, çizgili,
      kuşaklı; yaka, çorap, kaleci eldiveni, kaptan pazubandı).
   6) Stadyum: kale arkasında kayan LED reklam panoları, yan panolar,
      köşe bayrakları, tribünde zıplayan taraftarlar (pozisyon kaleye
      yaklaştıkça coşarlar), ritmik alkış.
   ============================================================ */
/* ---------- 3) ayarlar ---------- */
const SET_DEF = { sfx: 1, crowd: 1, voice: 1, text: 1, vol: 80, rp: 1, cel: 1, spd: 1, diff: 1, assist: 1 };
function setOf(k) { let A = null; try { A = acct(); } catch (e) { } const o = (A && A.set) || {}; return o[k] == null ? SET_DEF[k] : o[k]; }
function setPut(k, v) { const A = acct(); A.set = Object.assign({}, A.set || {}, { [k]: v }); acctSave(); setApply(); }
function setApply() {
  SND.on = !!(setOf('sfx') || setOf('crowd') || setOf('voice'));
  try { if (SND.master && SND.ctx) SND.master.gain.setTargetAtTime(setOf('vol') / 100 * 1.1, SND.ctx.currentTime, .05); } catch (e) { }
  if (!setOf('voice')) try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { }
  if (!setOf('crowd') && SND.cg && SND.ctx) SND.cg.gain.setTargetAtTime(0, SND.ctx.currentTime, .1);
}
/* eski 🔊 ayarını taşı */
try { const o = localStorage.getItem('mfc_snd'); if (o === '0') { const A = acct(); if (!A.set) { A.set = { sfx: 0, crowd: 0, voice: 0 }; acctSave(); } } } catch (e) { }

/* ---------- Oynanış ayarları: oyun hızı, zorluk, kontrol yardımı ---------- */
function gsSpeed() { const v = +setOf('spd'); return cl(v || 1, .6, 1.6); }
function gsDiff() { const v = +setOf('diff'); return cl(v || 1, .6, 1.6); }
function gsAssist() { return setOf('assist') ? 1 : 0; }
/* oyun hızı: bütün maç temposunu ölçekler (en geç yüklenen step'i sarar) */
if (typeof step === 'function') { const _stepGS = step; step = function (dt) { return _stepGS(dt * gsSpeed()); }; }

/* ---------- 1) iOS ses kilidi ---------- */
const AU = { unlocked: 0, warm: 0 };
function audioUnlock() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { }
  SND.on = !!(setOf('sfx') || setOf('crowd') || setOf('voice'));
  if (!SND.on) return;
  sndInit(); setApply();
  try { if (SND.ctx && !AU.unlocked) { const b = SND.ctx.createBuffer(1, 1, 22050), s = SND.ctx.createBufferSource(); s.buffer = b; s.connect(SND.ctx.destination); s.start(0); AU.unlocked = 1; } } catch (e) { }
  try { if (!AU.warm && window.speechSynthesis && setOf('voice')) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); AU.warm = 1; } } catch (e) { }
}
if (document.addEventListener) ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, audioUnlock, { capture: true, passive: true }));
/* efekt ve tribün ayarlara uyar */
const _sfx9 = sfx;
sfx = function (k, a) { if (k === 'final') { if (!setOf('sfx')) return; _sfx9('whistle', 2); setTimeout(() => _sfx9('whistle', 1), 900); return; } if (!setOf('sfx') && k !== 'roar' && k !== 'ooh' && k !== 'groan') return; if ((k === 'roar' || k === 'ooh' || k === 'groan') && !setOf('crowd')) return; _sfx9(k, a); };
const _crowd9 = crowdLvl;
crowdLvl = function (v) { _crowd9(setOf('crowd') ? v : 0); };
function clap(t0) { if (!setOf('crowd') || !SND.ctx || SND.ctx.state !== 'running') return; try { nz(.09, 1800, .9, .16, 'bandpass', t0 || 0); nz(.07, 900, .7, .08, 'bandpass', (t0 || 0) + .01); } catch (e) { } }

/* ---------- 2) konuşan spiker ---------- */
const VOX = { v: null, vl: null };
function voxVoice() {
  try {
    const vs = speechSynthesis.getVoices(); if (!vs || !vs.length) return null; if (VOX.vl === LANG && VOX.v) return VOX.v;
    const pref = LANG === 'en' ? ['en-GB', 'en-AU', 'en-US', 'en'] : ['tr-TR', 'tr'];
    let best = null, bs = -1;
    vs.forEach(v => { const l = (v.lang || '').replace('_', '-'); const i = pref.findIndex(p => l.toLowerCase().startsWith(p.toLowerCase())); if (i < 0) return; let sc = 10 - i; if (/premium|enhanced|neural|natural/i.test(v.name)) sc += 5; if (/Daniel|Yelda|Cem|Arthur|Oliver/i.test(v.name)) sc += 2; if (v.localService) sc += 1; if (sc > bs) { bs = sc; best = v; } });
    VOX.v = best; VOX.vl = LANG; return best;
  } catch (e) { return null; }
}
try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { VOX.vl = null; }; } catch (e) { }
const VOICE_GOAL = { tr: ['Gol! Gol! Gol! {0}!', 'Ve gol! {0} attı!', 'İşte gol! {0}!'], en: ['Goal! Goal! {0}!', 'And it\'s in! {0} scores!', 'What a goal from {0}!'] };
function vClean(t) {
  return String(t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '').replace(/\b\p{L}\.\s*/gu, '')
    .replace(/\b(\p{Lu}{3,})\b/gu, w => w[0] + w.slice(1).toLocaleLowerCase(LANG === 'en' ? 'en' : 'tr')).replace(/\s+/g, ' ').trim();
}
function speak(txt, pri) {
  if (!setOf('voice') || typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    const ss = speechSynthesis; if (ss.speaking || ss.pending) { if (pri < 2) return; ss.cancel(); }
    const u = new SpeechSynthesisUtterance(vClean(txt)); u.lang = LANG === 'en' ? 'en-GB' : 'tr-TR'; const v = voxVoice(); if (v) u.voice = v;
    u.rate = pri >= 2 ? 1.12 : 1.04; u.pitch = pri >= 2 ? 1.18 : 1; u.volume = cl(setOf('vol') / 100, 0, 1); ss.speak(u);
  } catch (e) { }
}
const VPRI = { goal: 3, save: 2, post: 2, chip: 2, gkout: 2, off: 2, foul: 2, shot: 2, longshot: 2, bigpass: 1, replay: 1, over: 1, wide: 1, block: 1, cut: 1, tackle: 1, badtouch: 1, win: 1, loose: 1, air: 1, combo: 1, tired: 1, rain: 1, snow: 1, wind: 1, pass: 0, drib: 0 };
const _say9 = say;
say = function (k, a, b) {
  _say9(k, a, b); const s = S; if (!s || !s.com) return;
  if (!setOf('text')) s.com.hide = 1;
  const pri = VPRI[k] == null ? 1 : VPRI[k]; if (pri === 0 && Math.random() < .55) return;
  if (k === 'goal') { const L = VOICE_GOAL[LANG === 'en' ? 'en' : 'tr']; return voiceSay('goal', L[Math.floor(Math.random() * L.length)].replace('{0}', a || ''), 3); }
  voiceSay(k, T(s.com.txt), pri);
};
function sayLine(txt, pri) { const s = S; if (s) s.com = { txt, t: s.t, hide: !setOf('text') }; speak(T(txt), pri == null ? 1 : pri); }

/* ---------- ayarlar ekranı ---------- */
function setOpen() {
  audioUnlock();
  let el = document.getElementById('setp'); if (!el) { el = document.createElement('div'); el.id = 'setp'; el.className = 'tut'; document.body.appendChild(el); }
  const row = (k, ic, n, d) => `<label class="setr"><span class="seti">${ic}</span><span class="setn"><b>${n}</b><small>${d}</small></span><input type="checkbox" class="sw" ${setOf(k) ? 'checked' : ''} onchange="setPut('${k}',this.checked?1:0);setOpen()"></label>`;
  const pick3 = (k, ic, n, d, opts) => `<label class="setr"><span class="seti">${ic}</span><span class="setn"><b>${n}</b><small>${d}</small></span><span class="langs">${opts.map(o => `<button class="chip ${Math.abs(setOf(k) - o.v) < .001 ? 'on' : ''}" onclick="setPut('${k}',${o.v});setOpen()">${o.l}</button>`).join('')}</span></label>`;
  el.hidden = false;
  el.innerHTML = `<div class="tutc card setc"><div class="tutt"><span class="eyebrow">⚙️ Ayarlar</span><button class="lnk" onclick="setClose()">Kapat ✕</button></div>
  <div class="setg">Ses</div>
  ${row('sfx', '🔊', 'Ses efektleri', 'Vuruş, düdük, ağ, direk')}
  ${row('crowd', '📣', 'Taraftar sesi', 'Tribün uğultusu, alkış, gol kükremesi')}
  ${row('voice', '🎙️', 'Spiker sesi', 'Maçı sesli anlatır (oyunun dilinde)')}
  <label class="setr"><span class="seti">🔉</span><span class="setn"><b>Ses düzeyi</b><small>${setOf('vol')}</small></span><input type="range" class="setv" min="0" max="100" step="5" value="${setOf('vol')}" oninput="this.previousElementSibling.querySelector('small').textContent=this.value" onchange="setPut('vol',+this.value)"></label>
  <button class="btn ghost" onclick="setTest()">🔈 Sesi dene</button>
  <div class="setg">Oynanış</div>
  ${pick3('spd', '⚡', 'Oyun hızı', 'Maçın genel temposu', [{ v: .85, l: 'Yavaş' }, { v: 1, l: 'Normal' }, { v: 1.18, l: 'Hızlı' }])}
  <div class="setr" style="opacity:.78"><span class="seti">🎯</span><span class="setn"><b>Zorluk</b><small>Rakip takım ne kadar güçlüyse maç o kadar zor — elle ayar yok</small></span></div>
  ${row('assist', '🎮', 'Kontrol yardımı', 'Nişan ve pas hedefleri daha affedici olur')}
  <div class="setg">Maç ayarları</div>
  ${row('text', '💬', 'Spiker yazısı', 'Sahanın altında yorum satırı')}
  ${row('cel', '🎉', 'Gol sevinci', 'Kamera golcüye yakınlaşır, takım kutlar')}
  ${row('rp', '🔁', 'Gol tekrarı', 'Golden sonra ağır çekim')}
  <div class="setg">Dil</div>
  <div class="langs"><button class="chip ${LANG === 'tr' ? 'on' : ''}" onclick="setLang('tr');VOX.vl=null;setOpen();if(scr==='menu')menu();else draw()">🇹🇷 Türkçe</button><button class="chip ${LANG === 'en' ? 'on' : ''}" onclick="setLang('en');VOX.vl=null;setOpen();if(scr==='menu')menu();else draw()">🇬🇧 English</button></div>
  <p class="m">Spiker, oyunun diliyle konuşur. Ses gelmiyorsa telefonun ses düzeyini aç.</p>
  <div class="actions"><button class="btn big" style="flex:1" onclick="setClose()">Tamam</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
function setClose() { const el = document.getElementById('setp'); if (el) el.hidden = true; if (typeof drawUIControls === 'function' && S) drawUIControls(); }
function setTest() { audioUnlock(); setTimeout(() => { sfx('kick', 1); setTimeout(() => sfx('net'), 250); setTimeout(() => sfx('roar'), 300); voiceSay('goal', LANG === 'en' ? 'Testing the sound. And it\'s a goal!' : 'Ses denemesi. Ve gol!', 3); crowdLvl(.12); setTimeout(() => { if (!S) crowdLvl(0); }, 2500); }, 60); }
/* menüye ⚙️ Ayarlar */
const _menu10 = menu;
menu = function () {
  _menu10();
  try { const w = document.querySelector('#app .wrap'), bar = w && [...w.querySelectorAll('.actions')].find(b => b.innerHTML.indexOf('tutOpen') >= 0); if (bar && bar.innerHTML.indexOf('setOpen') < 0) { const b = document.createElement('button'); b.className = 'btn ghost'; b.setAttribute('onclick', 'setOpen()'); b.textContent = T('⚙️ Ayarlar'); bar.appendChild(b); } } catch (e) { }
};
/* maç panelinde ⚙️ */
const _ctlHTML9 = ctlHTML;
ctlHTML = function () {
  let h = _ctlHTML9(); if (!S) return h;
  h = h.replace(/<button class="btn ghost sm" onclick="sndToggle\(\)">[^<]*<\/button>/, '');
  if (S.cel) return `<div class="hint">${esc(T('🎉 Gol sevinci! Geçmek için sahaya dokun.'))}</div>` + h;
  return S.phase === 'draw' || S.phase === 'done' ? h + `<button class="btn ghost sm" onclick="setOpen()">⚙️ Ayarlar</button>` : h;
};
/* maç başı ve sonu: düdük + spiker */
const _playMatch10 = playMatch;
playMatch = function () { audioUnlock(); _playMatch10(); if (M) { sfx('whistle', 1); voiceSay('kickoff', LANG === 'en' ? `Kick-off! ${M.T.us.n} against ${M.T.th.n}.` : `Maç başladı! ${M.T.us.n}, ${M.T.th.n} karşısında.`, 2); } };
const _finish10 = finishMatch;
finishMatch = function (m) { const r = _finish10(m); try { sfx('final'); const w = m && m.sc ? m.sc : null; if (w) voiceSay('final', LANG === 'en' ? `Full time! ${m.T.us.n} ${w[0]}, ${m.T.th.n} ${w[1]}.` : `Son düdük! ${m.T.us.n} ${w[0]}, ${m.T.th.n} ${w[1]}.`, 3); } catch (e) { } return r; };

/* ---------- 4) gol sevinci ---------- */
const CEL_T = 3.8;
const _endScene9 = endScene;
endScene = function (b, good) {
  const s = S, live = s && s.phase !== 'done', who = s && ((s.run && s.run.car) || s.car || s.me);
  _endScene9(b, good);
  if (!(live && s && good && b && /^GOL/.test(b.t) && s.mode === 'atk' && setOf('cel') && who)) return;
  const cx = who.x < 34 ? 5 : 63, cy = 100.5, dx = cx - who.x, dy = cy - who.y, d = Math.hypot(dx, dy), k = d > 13 ? 13 / d : 1, tx = who.x + dx * k, ty = who.y + dy * k;
  s.cel = { t0: s.t, who, T: CEL_T, tx, ty }; s.fw = []; s.fwT = 0;
  S.anims = S.anims.filter(a => a.o !== who); anim(who, tx, ty, 1.9, { lin: 1 }); who.cheer = 1;
  s.P.filter(p => p.side === 'us' && p !== who && !p.gk).forEach((p, i) => { const a = i * 2.1 + 1, r = 1.3 + (i % 2) * .6; S.anims = S.anims.filter(q => q.o !== p); anim(p, tx + Math.cos(a) * r, ty - .8 + Math.sin(a) * r * .6, 2.3 + i * .3, { lin: 1 }); p.cheer = 1; });
  s.P.filter(p => p.side === 'th').forEach(p => { if (p.gk) { p.down = .9; return; } p.sad = 1; S.anims = S.anims.filter(q => q.o !== p); anim(p, p.x + rf(-2, 2), p.y - rf(2, 5), 3, { lin: 1 }); });
  drawUIControls();
};
const _camWant9 = camWant;
camWant = function () {
  const s = S; if (s && s.cel && !s.rp) { const w = s.cel.who, sc = CV.W / NSS_W; return { x: w.x, ty: w.y + 1.2, dist: sc }; }
  const r = _camWant9(); if (s && !s.rp && !s.cel && s.mode === 'atk') { const halfH = CV.H / 2 / (CV.W / NSS_W); if (r.ty >= 109 - halfH - .05) r.ty += 2.6; }
  return r;
};
const _camBasis10 = camBasis;
camBasis = function () { _camBasis10(); const s = S; if (s && s.zm && s.zm > 1.005) PR.sc *= s.zm; };

/* ---------- her kare: zum, coşku, alkış, sevinç bitişi ---------- */
const _step9 = step;
step = function (dt) {
  const s = S; if (!s) return; _step9(dt); if (!S || S !== s) return;
  const B = s.ball, zt = s.cel && !s.rp ? 1.7 : 1; s.zm = (s.zm || 1) + (zt - (s.zm || 1)) * Math.min(1, dt * 2.2);
  const near = s.mode === 'atk' && s.phase !== 'done' ? cl(1 - toGoal(B) / 38, 0, 1) : 0, ht = s.cel ? 1 : s.rp ? .5 : near * .7;
  s.hype = (s.hype || 0) + (ht - (s.hype || 0)) * Math.min(1, dt * 1.5);
  if (s.cel) {
    crowdLvl(.22);
    if (s.t - s.cel.t0 > s.cel.T) { s.cel = null; s.P.forEach(p => { p.cheer = 0; p.sad = 0; }); drawUIControls(); }
  }
  /* ritmik alkış: kaleye yaklaştıkça */
  if (dt > 0 && near > .45 && s.phase === 'draw' && SND.ctx) { s.clapT = (s.clapT || 0) + dt; if (s.clapT > 2.4) { s.clapT = 0; clap(0); clap(.42); clap(.84); } }
};
const _bind9 = bindInput;
bindInput = function (cv) {
  _bind9(cv); const d0 = cv.onpointerdown;
  cv.onpointerdown = ev => { if (S && S.cel && !S.rp) { ev.preventDefault(); S.cel.T = 0; return; } return d0 && d0(ev); };
};

/* ---------- çizim: stadyum ---------- */
const hsh = p => { if (p.hs == null) { let h = 7; const s = (p.n || '') + '|' + (p.num || '') + '|' + (p.side || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; p.hs = Math.abs(h); } return p.hs; };
const HSTR = s => { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const ADS = ['SARDUR TECHNOLOGIES', 'MİRAS FC', 'A FOOTBALL LIFE', 'SARDUR', '⚽ MİRAS FC 2026'];
function drawStadium(x, W, H) {
  const s = S, sc = PR.sc, t = performance.now() / 1000, tl = unprojG(0, 0), br = unprojG(W, H), xmin = tl.x, xmax = br.x, ymax = tl.y, ymin = br.y, hype = s.hype || 0;
  const us = M && M.T ? M.T.us.c : ['#e8c468', '#fff'], th = M && M.T ? M.T.th.c : ['#ff6b5b', '#fff'], skin = ['#f1c9a5', '#e0ac7e', '#c68642', '#8d5524', '#f5d5b8'];
  const fan = (wx, wy, i) => { const h0 = HSTR(i), r = h0 % 100, col = r < 58 ? us[h0 % 2 ? 0 : 1] : r < 80 ? th[0] : ['#d8d2c4', '#3a4250', '#8b8f99'][h0 % 3], v = P3(wx, wy, 0), jump = hype * Math.max(0, Math.sin(t * (7 + (h0 % 5)) + (h0 % 31))) * sc * .32;
    const bw = sc * .42, bh = sc * .46; x.fillStyle = col; x.fillRect(v.X - bw / 2, v.Y - bh - jump, bw, bh); x.fillStyle = skin[h0 % 5]; x.fillRect(v.X - bw * .32, v.Y - bh - bw * .62 - jump, bw * .64, bw * .6);
    if (hype > .6 && h0 % 6 === 0) { x.fillStyle = col; x.fillRect(v.X - bw * .7, v.Y - bh - bw * 1.4 - jump, bw * .22, bw * .9); x.fillRect(v.X + bw * .48, v.Y - bh - bw * 1.4 - jump, bw * .22, bw * .9); } };
  /* kale arkası tribün */
  if (ymax > 107.6) {
    const a = P3(0, Math.min(ymax + 1, 140), 0).Y, b = P3(0, 107.7, 0).Y; const gr = x.createLinearGradient(0, a, 0, b); gr.addColorStop(0, '#1b2029'); gr.addColorStop(1, '#2c333f'); x.fillStyle = gr; x.fillRect(0, a, W, b - a);
    for (let ry = 108.1, row = 0; ry < ymax + .8; ry += .72, row++) { const Yl = P3(0, ry, 0).Y; x.fillStyle = row % 3 === 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; x.fillRect(0, Yl - sc * .1, W, sc * .08); for (let cx = Math.floor((xmin - 1) / .62) * .62; cx < xmax + 1; cx += .62) fan(cx + (row % 2) * .31, ry, Math.round(cx / .62) * 977 + row * 131); }
    /* meşale dumanı ve flaşlar */
    if (s.cel) { for (let i = 0; i < 6; i++) { const fx = 34 + (i - 2.5) * 9 + Math.sin(t + i) * 1.5, v = P3(fx, 108.6, 0), r0 = sc * (1.2 + ((t * 1.3 + i * .37) % 1) * 2.4); const sg = x.createRadialGradient(v.X, v.Y - r0, 1, v.X, v.Y - r0, r0); sg.addColorStop(0, 'rgba(255,90,60,.55)'); sg.addColorStop(1, 'rgba(255,90,60,0)'); x.fillStyle = sg; x.beginPath(); x.arc(v.X, v.Y - r0, r0, 0, 7); x.fill(); x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(v.X, v.Y - sc * .5, sc * .18, 0, 7); x.fill(); } }
    if (hype > .5) for (let i = 0; i < 4; i++) { const k = HSTR(Math.floor(t * 6) * 7 + i) % 1000 / 1000, fx = xmin + (xmax - xmin) * k, v = P3(fx, 108.5 + (HSTR(i + Math.floor(t * 6)) % 4) * .7, 0); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(v.X, v.Y - sc * .6, 1.6, 0, 7); x.fill(); }
  }
  /* yan tribünler */
  [[-2.3, -1], [70.3, 1]].forEach(([x0, dir]) => {
    if ((dir < 0 && xmin > x0) || (dir > 0 && xmax < x0)) return;
    const a = P3(x0, 0, 0).X, b = dir < 0 ? 0 : W; x.fillStyle = '#242a34'; x.fillRect(Math.min(a, b), 0, Math.abs(a - b), H);
    for (let c = 0; c < 8; c++) { const cx = x0 + dir * (.4 + c * .62); if ((dir < 0 && cx < xmin - 1) || (dir > 0 && cx > xmax + 1)) break; for (let ry = Math.floor(ymin / .7) * .7; ry < Math.min(ymax, 107.4); ry += .7) fan(cx, ry, Math.round(ry / .7) * 389 + c * 61 + (dir > 0 ? 5000 : 0)); }
  });
  /* LED reklam panoları: kale arkası */
  if (ymax > 105.8) {
    const top = P3(0, 107.5, 0).Y, bot = P3(0, 106.3, 0).Y, hh = bot - top, seg = 11, off = (t * 2.2) % seg;
    x.fillStyle = '#0b0f17'; x.fillRect(0, top, W, hh);
    x.save(); x.beginPath(); x.rect(0, top, W, hh); x.clip();
    for (let i = Math.floor((xmin - seg) / seg); i * seg < xmax + seg; i++) {
      const sx = i * seg - off, a = P3(sx, 107, 0).X, b = P3(sx + seg, 107, 0).X, k = ((i % ADS.length) + ADS.length) % ADS.length;
      const gl = x.createLinearGradient(a, 0, b, 0); gl.addColorStop(0, k % 2 ? '#123a8a' : '#0f5c3a'); gl.addColorStop(1, k % 2 ? '#1e56c4' : '#14824f'); x.fillStyle = gl; x.fillRect(a + 1, top + 1, b - a - 2, hh - 2);
      x.fillStyle = s.cel && Math.floor(t * 6) % 2 ? '#ffe34d' : '#fff'; x.font = `800 ${Math.max(8, Math.round(hh * .62))}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s.cel ? T('GOOOL!') : ADS[k], (a + b) / 2, top + hh / 2 + 1, b - a - 6);
    }
    x.restore(); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, top, W, 1);
  }
  /* yan panolar */
  [[-1.25, -0.55], [68.55, 69.25]].forEach(([a0, a1], j) => {
    if (a1 < xmin || a0 > xmax) return; const A = P3(a0, 0, 0).X, Bx = P3(a1, 0, 0).X, Y0 = 0, Y1 = Math.min(H, P3(0, Math.max(ymin, 0), 0).Y);
    x.fillStyle = j ? '#123a8a' : '#0f5c3a'; x.fillRect(A, Y0, Bx - A, Y1 - Y0); x.save(); x.translate((A + Bx) / 2, H / 2); x.rotate(j ? Math.PI / 2 : -Math.PI / 2); x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `800 ${Math.max(8, Math.round((Bx - A) * .75))}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = -3; k <= 3; k++) x.fillText(ADS[(k + 5 + j) % ADS.length], k * 150 + ((t * 30) % 150), 0); x.restore();
  });
  /* köşe bayrakları */
  [[0, 105], [68, 105]].forEach(([fx, fy]) => { if (fx < xmin - 2 || fx > xmax + 2 || fy > ymax + 2 || fy < ymin - 2) return; const v = P3(fx, fy, 0), ph = sc * 1.6, wv = Math.sin(t * 5 + fx) * sc * .12;
    x.strokeStyle = '#f2f2f2'; x.lineWidth = 2; x.beginPath(); x.moveTo(v.X, v.Y); x.lineTo(v.X, v.Y - ph); x.stroke(); x.fillStyle = '#ff3b30'; x.beginPath(); x.moveTo(v.X, v.Y - ph); x.lineTo(v.X + (fx ? -1 : 1) * sc * .7, v.Y - ph + sc * .2 + wv); x.lineTo(v.X, v.Y - ph + sc * .45); x.closePath(); x.fill(); });
}
const _drawPitch10 = drawPitch;
drawPitch = function (x, W, H) { _drawPitch10(x, W, H); try { drawStadium(x, W, H); } catch (e) { } };

/* ---------- 5) yeni oyuncu çizimi ---------- */
const HAIRC = ['#1b130c', '#2a1b10', '#3d2716', '#5a3a1e', '#7a4e2a', '#c9a25a', '#e3c98a', '#8a3b1c'];
const BOOTC = ['#111', '#111', '#f4f4f4', '#ff3b6b', '#2bd9ff', '#c6ff3d', '#ff8a1e', '#1e56c4'];
drawPl = function (x, p) {
  const s = S, v = P3(p.x, p.y, 0), sc = PR.sc, h = Math.max(12, sc * 1.6), w = h * .42;
  if (v.X < -30 || v.X > CV.W + 30 || v.Y < -40 || v.Y > CV.H + 40) return;
  const X = v.X, Y = v.Y, spd = p.spd || 0, mv = cl(spd / 5.5, 0, 1), cyc = p.cyc || 0, run = Math.sin(cyc) * mv, bob = Math.abs(Math.cos(cyc)) * mv * h * .05;
  const hs = hsh(p), back = p.dy != null && p.dy > .35 && !p.gk, dvp = p.dive ? (p.dvp || 0) : 0, slp = p.slide ? (p.slp || 0) : 0, cheer = p.cheer && s.cel, sad = p.sad && s.cel;
  let ang = 0, lift = 0;
  if (dvp > 0) { const e = 1 - Math.pow(1 - dvp, 2); ang = p.dive.dir * Math.PI / 2 * .92 * e; lift = Math.sin(Math.min(1, dvp) * Math.PI) * h * .45; }
  else if (slp > 0) ang = p.slide.dir * Math.PI / 2 * .85 * Math.min(1, slp * 1.5);
  else if (p.down > 0) ang = (p.x < 34 ? -1 : 1) * Math.PI / 2 * Math.min(1, p.down * 1.6);
  else ang = (p.dx || 0) * mv * .2;
  if (cheer && mv < .4) lift += Math.abs(Math.sin(s.t * 7 + (p.ph || 0))) * h * .16;
  /* gölge ve halka */
  x.fillStyle = `rgba(0,0,0,${.3 - Math.min(.2, lift / h * .25)})`; x.beginPath(); x.ellipse(X + 2 + Math.sin(ang) * h * .35, Y, w * (.85 + Math.abs(Math.sin(ang)) * .9), w * .33, 0, 0, 7); x.fill();
  if (p.me && !s.cel) { x.strokeStyle = '#ffe34d'; x.lineWidth = 2; x.beginPath(); x.ellipse(X, Y, w * 1.3, w * .52, 0, 0, 7); x.stroke(); }
  if (slp > 0 && slp < 1) { x.fillStyle = `rgba(190,170,120,${.5 * (1 - slp)})`; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(X - p.slide.dir * (i * 4 + 4), Y - 2 + (i % 2) * 3, 2.5 + i * .7, 0, 7); x.fill(); } }
  x.save(); x.translate(X, Y - lift - bob); x.rotate(ang);
  const shirt = p.c[0], trim = p.c[1] || '#fff', dark = lum(shirt) < 70, shorts = p.gk ? '#1d1f24' : lum(shirt) > 150 ? '#22262b' : trim, sock = p.gk ? '#1d1f24' : shirt, pat = p.gk ? 0 : HSTR(p.c.join('')) % 4;
  const OL = 'rgba(0,0,0,.5)', lw = Math.max(.8, h * .04), stride = run * h * .07;
  const box = (c, a, b, ww, hh, r) => { x.fillStyle = c; rr(x, a, b, ww, hh, Math.min(r || 0, ww / 2, hh / 2)); x.fill(); x.strokeStyle = OL; x.lineWidth = lw; x.stroke(); };
  /* bacaklar: diz, çorap, krampon */
  const leg = (lx, off) => { box(p.skin, lx, -h * .36 + off, w * .28, h * .12, 1); box(sock, lx, -h * .25 + off, w * .28, h * .2 - off * .3, 1); x.fillStyle = trim; x.fillRect(lx + lw, -h * .23 + off, w * .28 - lw * 2, h * .025); box(BOOTC[hs % BOOTC.length], lx - w * .03, -h * .07 + off * .7, w * .36, h * .075, 2); };
  leg(-w * .36 + run * w * .08, stride); leg(w * .08 - run * w * .08, -stride);
  box(shorts, -w * .48, -h * .51, w * .96, h * .2, w * .1); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(-w * .02, -h * .49, w * .04, h * .16);
  /* kollar */
  const glove = p.gk ? '#7cfc8a' : p.skin;
  const armsUp = cheer, armsHead = sad && !p.gk;
  if (armsUp) { const wav = Math.sin(s.t * 9 + (p.ph || 0)) * h * .04; box(shirt, -w * .78, -h * 1.18 + wav, w * .22, h * .38, 2); box(shirt, w * .56, -h * 1.18 - wav, w * .22, h * .38, 2); box(glove, -w * .78, -h * 1.27 + wav, w * .22, h * .1, 2); box(glove, w * .56, -h * 1.27 - wav, w * .22, h * .1, 2); }
  else if (armsHead) { /* kollar başın üstünde birleşir: aşağıda, baştan sonra çizilir */ }
  else { const arm = -run * h * .08; box(shirt, -w * .7, -h * .82 + arm, w * .22, h * .26, 2); box(shirt, w * .48, -h * .82 - arm, w * .22, h * .26, 2); box(glove, -w * .69, -h * .58 + arm, w * .2, h * .09, 2); box(glove, w * .49, -h * .58 - arm, w * .2, h * .09, 2);
    if (p.me && g && g.captain) { x.fillStyle = '#ffe34d'; x.fillRect(-w * .7, -h * .74 + arm, w * .22, h * .04); } }
  /* gövde ve forma deseni */
  box(shirt, -w * .52, -h * .86, w * 1.04, h * .38, w * .16);
  x.save(); rr(x, -w * .52, -h * .86, w * 1.04, h * .38, w * .16); x.clip(); x.fillStyle = trim;
  if (pat === 1) for (let i = -2; i <= 2; i++) x.fillRect(i * w * .24 - w * .05, -h * .86, w * .1, h * .38);
  else if (pat === 2) for (let i = 0; i < 3; i++) x.fillRect(-w * .52, -h * .82 + i * h * .13, w * 1.04, h * .05);
  else if (pat === 3) { x.beginPath(); x.moveTo(-w * .52, -h * .86); x.lineTo(-w * .2, -h * .86); x.lineTo(w * .52, -h * .55); x.lineTo(w * .52, -h * .45); x.closePath(); x.fill(); }
  else if (!back) { x.fillRect(-w * .52, -h * .86, w * .14, h * .38); x.fillRect(w * .38, -h * .86, w * .14, h * .38); }
  const sg = x.createLinearGradient(-w * .5, 0, w * .5, 0); sg.addColorStop(0, 'rgba(255,255,255,.12)'); sg.addColorStop(.55, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = sg; x.fillRect(-w * .52, -h * .86, w * 1.04, h * .38);
  x.restore();
  if (back && h > 13 && p.num) { x.fillStyle = lum(shirt) > 150 || (pat && lum(trim) > 150) ? '#111' : '#fff'; x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1; x.font = `800 ${Math.round(h * .28)}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText(p.num, 0, -h * .66); x.fillText(p.num, 0, -h * .66); }
  else if (!back) { x.fillStyle = trim; x.beginPath(); x.moveTo(-w * .16, -h * .86); x.lineTo(0, -h * .78); x.lineTo(w * .16, -h * .86); x.closePath(); x.fill();
    if (h > 12 && p.num) { const fc = lum(shirt) > 150 || (pat && lum(trim) > 150) ? '#111' : '#fff'; x.font = `800 ${Math.round(h * .22)}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = Math.max(1.2, h * .05); x.strokeStyle = fc === '#fff' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.6)'; x.strokeText(p.num, 0, -h * .64); x.fillStyle = fc; x.fillText(p.num, 0, -h * .64); } }
  /* baş ve saç */
  const hr = w * .34, hy = -h * .97, hc = HAIRC[(hs >> 3) % HAIRC.length], st = hs % 6;
  x.fillStyle = p.skin; x.fillRect(-w * .1, -h * .9, w * .2, h * .06);
  if (st === 2) { x.fillStyle = hc; x.beginPath(); x.arc(0, hy - hr * .15, hr * 1.35, 0, 7); x.fill(); x.strokeStyle = OL; x.lineWidth = lw; x.stroke(); }
  x.fillStyle = p.skin; x.beginPath(); x.arc(0, hy, hr, 0, 7); x.fill(); x.strokeStyle = OL; x.lineWidth = lw; x.stroke();
  x.fillStyle = hc;
  if (back) { if (st !== 4) { x.beginPath(); x.arc(0, hy, hr * (st === 1 ? .9 : 1.02), 0, 7); x.fill(); } if (st === 3) { x.beginPath(); x.arc(0, hy - hr * .9, hr * .42, 0, 7); x.fill(); } }
  else {
    if (st === 0 || st === 3 || st === 5) { x.beginPath(); x.arc(0, hy - hr * .12, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); x.fill(); }
    if (st === 1) { x.globalAlpha = .7; x.beginPath(); x.arc(0, hy - hr * .1, hr * .98, Math.PI * 1.08, Math.PI * 1.92); x.fill(); x.globalAlpha = 1; }
    if (st === 3) { x.beginPath(); x.arc(0, hy - hr * 1.05, hr * .4, 0, 7); x.fill(); }
    if (st === 5) x.fillRect(-hr * .25, hy - hr * 1.45, hr * .5, hr * .55);
    if (h > 20 && !armsHead) { x.fillStyle = '#1b130c'; x.fillRect(-hr * .42, hy + hr * .05, hr * .2, hr * .22); x.fillRect(hr * .22, hy + hr * .05, hr * .2, hr * .22); }
  }
  if (armsHead) { /* üzgün: eller başta, dirsekler yana açık */
    x.lineCap = 'round'; x.lineJoin = 'round';
    [-1, 1].forEach(d => { x.beginPath(); x.moveTo(d * w * .44, -h * .8); x.lineTo(d * w * .72, -h * .98); x.lineTo(d * hr * .35, hy - hr * .75);
      x.strokeStyle = OL; x.lineWidth = w * .24 + lw * 2; x.stroke(); x.strokeStyle = shirt; x.lineWidth = w * .24; x.stroke(); x.fillStyle = glove; x.beginPath(); x.arc(d * hr * .35, hy - hr * .75, w * .13, 0, 7); x.fill(); });
    x.lineCap = 'butt';
  }
  x.restore();
  /* isim etiketi */
  if ((p.me || (p.gk && s.mode === 'atk') || s.ball.owner === p || (s.cel && s.cel.who === p)) && !dvp && !slp) {
    const lbl = p.me ? T('SEN') : short(p.n); x.font = `600 ${s.cel && s.cel.who === p ? 12 : 10}px "Barlow",sans-serif`; x.textAlign = 'center'; const tw = x.measureText(lbl).width + 8, ly = Y - h - 18 - lift - bob - (cheer ? h * .3 : 0);
    x.fillStyle = p.me ? 'rgba(255,227,77,.95)' : 'rgba(6,10,12,.65)'; rr(x, X - tw / 2, ly, tw, 14, 4); x.fill(); x.fillStyle = p.me ? '#111' : '#fff'; x.textBaseline = 'middle'; x.fillText(lbl, X, ly + 7); x.textAlign = 'left';
  }
};

/* ---------- çizim: gol sevinci katmanı ---------- */
const _drawScene9 = drawScene;
drawScene = function () {
  const s = S; if (!s) return _drawScene9();
  const celOn = s.cel && !s.rp, keep = celOn ? { banner: s.banner, flash: s.flash } : null, comK = s.com && s.com.hide ? s.com : null;
  if (celOn) { s.banner = null; s.flash = null; }
  if (comK) s.com = null;
  _drawScene9();
  if (keep) Object.assign(s, keep); if (comK) s.com = comK;
  if (!celOn) return;
  const cv = $('cv'); if (!cv) return; const x = cv.getContext('2d'); if (!x) return; const W = CV.W, H = CV.H, a = s.t - s.cel.t0;
  x.save(); x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
  /* havai fişek */
  const now = performance.now() / 1000, dt = Math.min(.05, now - (s.fwL || now)); s.fwL = now; s.fw = s.fw || [];
  s.fwT = (s.fwT || 0) - dt; if (s.fwT <= 0 && a < s.cel.T - .6) { s.fwT = rf(.25, .5); const cx = rf(W * .12, W * .88), cy = rf(H * .08, H * .32), cols = [(M && M.T.us.c[0]) || '#ffe34d', '#ffe34d', '#ffffff', (M && M.T.us.c[1]) || '#ff6b5b']; for (let i = 0; i < 34; i++) { const an = i / 34 * 6.283, sp = rf(60, 150); s.fw.push({ x: cx, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: rf(.7, 1.2), c: cols[i % cols.length] }); } }
  s.fw.forEach(p => { p.vy += 90 * dt; p.vx *= .985; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }); s.fw = s.fw.filter(p => p.l > 0);
  s.fw.forEach(p => { x.globalAlpha = Math.min(1, p.l * 1.6); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, 2, 0, 7); x.fill(); }); x.globalAlpha = 1;
  /* dev GOL yazısı: harfler sırayla zıplar */
  const word = T('GOOOL!'), fs = Math.round(Math.min(W * .19, 96)), cy = H * .3; x.font = `900 ${fs}px "Barlow Condensed",sans-serif`; x.textBaseline = 'middle';
  const wds = [...word].map(c => x.measureText(c).width), tot = wds.reduce((m, v) => m + v, 0); let px = W / 2 - tot / 2;
  [...word].forEach((c, i) => { const k = cl((a - i * .07) / .28, 0, 1), sc2 = k < 1 ? .3 + 1.1 * Math.sin(k * Math.PI / 2) - .4 * k * k * 0 : 1 + Math.sin(a * 6 + i) * .05, by = Math.sin(a * 5 + i * .7) * 4;
    if (k <= 0) { px += wds[i]; return; } x.save(); x.translate(px + wds[i] / 2, cy + by); x.scale(sc2, sc2); x.rotate(Math.sin(a * 3 + i) * .05); x.textAlign = 'center';
    x.lineWidth = Math.max(4, fs * .09); x.strokeStyle = 'rgba(10,14,12,.9)'; x.strokeText(c, 0, 0); const gg = x.createLinearGradient(0, -fs / 2, 0, fs / 2); gg.addColorStop(0, '#fff6c8'); gg.addColorStop(.5, '#ffe34d'); gg.addColorStop(1, '#e09a1a'); x.fillStyle = gg; x.fillText(c, 0, 0); x.restore(); px += wds[i]; });
  /* golcü, dakika, skor */
  const sub = `⚽ ${s.min}' · ${s.cel.who.me ? g.name : short(s.cel.who.n)}`.toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), sk = M ? `${M.sc[0]} – ${M.sc[1]}` : '';
  const ka = cl((a - .6) / .3, 0, 1); x.globalAlpha = ka; x.font = '800 17px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; const tw = x.measureText(sub).width + 28;
  x.fillStyle = 'rgba(8,12,10,.82)'; rr(x, W / 2 - tw / 2, cy + fs * .55, tw, 28, 14); x.fill(); x.fillStyle = '#fff'; x.fillText(sub, W / 2, cy + fs * .55 + 15);
  if (sk) { x.font = '900 22px "Barlow Condensed",sans-serif'; const sw = x.measureText(sk).width + 26; x.fillStyle = '#ffe34d'; rr(x, W / 2 - sw / 2, cy + fs * .55 + 36, sw, 30, 8); x.fill(); x.fillStyle = '#111'; x.fillText(sk, W / 2, cy + fs * .55 + 52); }
  x.globalAlpha = 1;
  /* kenarda parlama */
  const pul = (Math.sin(a * 8) + 1) / 2; x.strokeStyle = `rgba(255,227,77,${.25 + pul * .35})`; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6);
  x.restore();
};

/* ---------- stüdyo spiker: önceden üretilmiş doğal ses replikleri (voxdata.js) ---------- */
const VX = { buf: {}, cur: null, curPri: -1, last: {}, dec: {} };
function vxKey(k, i) { return (LANG === 'en' ? 'en' : 'tr') + '|' + k + '|' + i; }
function vxDecode(k, i) {
  const key = vxKey(k, i); if (VX.buf[key]) return Promise.resolve(VX.buf[key]); if (VX.dec[key]) return VX.dec[key];
  const L = typeof VOXDATA !== 'undefined' && VOXDATA[LANG === 'en' ? 'en' : 'tr'][k]; if (!L || !SND.ctx) return Promise.resolve(null);
  const bin = atob(L[i]), u8 = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) u8[j] = bin.charCodeAt(j);
  VX.dec[key] = new Promise(res => { try { SND.ctx.decodeAudioData(u8.buffer, b => { VX.buf[key] = b; res(b); }, () => res(null)); } catch (e) { res(null); } });
  return VX.dec[key];
}
function vxPreload() { if (typeof VOXDATA === 'undefined' || !SND.ctx || VX.pre === LANG) return; VX.pre = LANG; const D = VOXDATA[LANG === 'en' ? 'en' : 'tr']; Object.keys(D).forEach(k => D[k].forEach((_, i) => vxDecode(k, i))); }
function voiceSay(k, txt, pri) {
  if (!setOf('voice')) return; pri = pri == null ? 1 : pri;
  const D = typeof VOXDATA !== 'undefined' ? VOXDATA[LANG === 'en' ? 'en' : 'tr'] : null, L = D && D[k];
  if (!L || !SND.ctx || SND.ctx.state !== 'running') return speak(txt, pri);
  if (VX.cur && pri < VX.curPri) return; if (VX.cur && pri <= VX.curPri && pri < 2) return;
  let i = Math.floor(Math.random() * L.length); if (L.length > 1 && i === VX.last[k]) i = (i + 1) % L.length; VX.last[k] = i;
  vxDecode(k, i).then(b => {
    if (!b || !setOf('voice')) return;
    try { if (VX.cur) { try { VX.cur.stop(); } catch (e) { } } const s = SND.ctx.createBufferSource(), gn = SND.ctx.createGain(); gn.gain.value = 1.35; s.buffer = b; s.connect(gn); gn.connect(SND.master); s.start(); VX.cur = s; VX.curPri = pri; s.onended = () => { if (VX.cur === s) { VX.cur = null; VX.curPri = -1; } }; } catch (e) { }
  });
}
const _unlock10 = audioUnlock;
audioUnlock = function () { _unlock10(); try { vxPreload(); } catch (e) { } };
/* rakip gol attığında */
const _endSceneV = endScene;
endScene = function (b, good) { const live = S && S.phase !== 'done'; _endSceneV(b, good); if (live && b && /^GOL YED/.test(b.t || '')) voiceSay('concede', LANG === 'en' ? 'Goal for the opposition.' : 'Gol yedik.', 2); };

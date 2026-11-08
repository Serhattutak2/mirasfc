/* ============================================================
   v4.4 — 🎬 HAYATININ FİLMİ
   Hayat bittiğinde (ya da Miras Salonu'ndan) 6 karelik, hikâye boyutunda
   (1080×1920) bir özet çıkar: doğum, ilk imza, zirve, kupalar, aile, miras.
   Kareler kaydırılarak izlenir; tek tuşla hepsi paylaşılır.
   hallEntry'ye `fm` alanı eklenir: hayatın anahtar anları (kulüp yılları,
   partner, çocuklar). Eski salon kayıtlarında fm yoksa var olan alanlarla
   daha kısa bir film çıkar.
   ============================================================ */
{
  const _he44 = hallEntry;
  hallEntry = function (h) {
    const e = _he44.apply(this, arguments); h = h || g;
    try {
      const H = h.hist || [], F = h.fam || {};
      const first = H[0], best = H.slice().sort((a, b) => ((b.g || 0) * 2 + (b.ap || 0)) - ((a.g || 0) * 2 + (a.ap || 0)))[0]; /* zirve: en çok iz bıraktığı kulüp */
      const topG = H.slice().sort((a, b) => (b.g || 0) - (a.g || 0))[0];
      e.fm = {
        f: first ? { n: first.n, y: first.y0, how: first.how || '' } : null,
        b: best ? { n: best.n, y0: best.y0, y1: best.y1 || h.season, ap: best.ap || 0, g: best.g || 0, id: best.id } : null,
        tg: topG && topG.g ? { n: topG.n, g: topG.g } : null,
        p: F.partner ? { n: F.partner.n, st: F.partner.st || '' } : null,
        k: (F.kids || []).slice(0, 4).map(k => k.n),
        coach: h.co && h.co.s ? { s: h.co.s, t: h.co.t || 0 } : null,
      };
    } catch (err) { }
    return e;
  };
}
const FILM = { W: 1080, H: 1920 };
function filmFrames(e) {
  const fm = e.fm || {}, U = s => s.toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), F = [];
  const yrs = n => T(`${n} yaş`);
  F.push({ k: 'BÖLÜM 1', t: U(e.n), s: [`${e.y0} · ${e.city ? T(e.city) + ', ' : ''}${T(e.ct)}`, T('Bir futbol hayatı başlıyor.')], big: String(e.y0) });
  if (fm.f) F.push({ k: 'BÖLÜM 2', t: U(T('İlk imza')), s: [clubName(fm.f.n), `${fm.f.y}${fm.f.how === 'kiralık' ? ' · ' + T('kiralık') : ''}`, T('Hayalin kâğıda döküldüğü gün.')], big: String(fm.f.y) });
  if (fm.b) F.push({ k: 'BÖLÜM 3', t: U(T('Zirve')), s: [clubName(fm.b.n), `${fm.b.y0}–${fm.b.y1}`, `${fm.b.ap} ${T('maç')} · ${fm.b.g} ${T('gol')}`], big: String(fm.b.g || fm.b.ap), bigS: fm.b.g ? T('gol') : T('maç'), id: fm.b.id });
  const tr = [[e.lg, 'lig şampiyonluğu'], [e.cup, 'ulusal kupa'], [e.ec, 'Şampiyonlar Kupası'], [e.el, 'Avrupa Ligi'], [e.wc, 'Dünya Kupası'], [e.bal, 'Altın Top']].filter(x => x[0]);
  F.push({ k: 'BÖLÜM 4', t: U(T('Kariyer')), s: [`${e.ap} ${T('maç')} · ${e.g} ${T('gol')} · ${e.a} ${T('asist')}`, tr.length ? tr.map(x => `${x[0]} ${T(x[1])}`).join(' · ') : T('Kupa dolabı boş kaldı; ama her maç bir hikâyeydi.'), e.caps ? `${e.caps} ${T('A milli maç')}` : ''], big: String(trophies(e)), bigS: T('kupa') });
  const fam = [];
  if (fm.p) fam.push(fm.p.st === 'evli' ? T('Eşi') + ': ' + fm.p.n : T('Hayatındaki kişi') + ': ' + fm.p.n);
  if (e.kids) fam.push(fm.k && fm.k.length ? T('Çocukları') + ': ' + fm.k.join(', ') : `${e.kids} ${T('çocuk')}`);
  fam.push(T('Servet') + ': ' + T(fm1(e.w)));
  F.push({ k: 'BÖLÜM 5', t: U(T('Saha dışı')), s: fam, big: e.kids ? String(e.kids) : e.w > 0 ? T(fm1(e.w)) : String(e.age), bigS: e.kids ? T('çocuk') : e.w > 0 ? T('Servet') : T('yaş') });
  F.push({ k: 'SON', t: U(T(e.tier)), s: [hallEpitaph(e).slice(0, 2).map(x => T(x)).join(' · ') || T('Kendi yolunu çizdi.'), `${e.y0}–${e.y1} · ${yrs(e.age)}`, T('Geriye ne bırakacaksın?')], big: String(e.mp), bigS: T('Miras Puanı'), end: 1 });
  return F;
}
function fm1(w) { try { return fm(w); } catch (e) { return String(w); } }
function filmCanvas(e, fr, i, n) {
  const { W, H } = FILM, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext && cv.getContext('2d'); if (!x) return null;
  const D = '"Barlow Condensed", "Arial Narrow", sans-serif', B = '"Barlow", system-ui, sans-serif', gold = '#e8c468', mut = '#9fb3a8', tx = '#eef3ef';
  const c1 = e.c1 || gold, c2 = e.c2 || '#121b17';
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0f2a1c'); bg.addColorStop(.55, '#08160e'); bg.addColorStop(1, '#040a06'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.globalAlpha = .045; x.fillStyle = '#fff'; for (let y = 0; y < H; y += 150) x.fillRect(0, y, W, 75); x.globalAlpha = 1;
  /* saha çizgileri */
  x.strokeStyle = 'rgba(232,196,104,.10)'; x.lineWidth = 5; x.beginPath(); x.arc(W / 2, H * .82, 300, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(0, H * .82); x.lineTo(W, H * .82); x.stroke();
  /* kulüp renk şeridi */
  x.save(); x.translate(W, 0); x.rotate(Math.PI / 4); x.fillStyle = c1; x.fillRect(-360, 70, 1200, 110); x.fillStyle = c2; x.fillRect(-360, 180, 1200, 40); x.restore();
  const glow = x.createRadialGradient(W / 2, H * .45, 60, W / 2, H * .45, 900); glow.addColorStop(0, 'rgba(232,196,104,.18)'); glow.addColorStop(1, 'rgba(232,196,104,0)'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
  /* üst bilgi */
  x.textBaseline = 'alphabetic'; x.fillStyle = gold; x.font = `700 40px ${D}`; x.fillText('MIRAS FC · ' + T('HAYATININ FİLMİ'), 80, 150);
  x.fillStyle = mut; x.font = `500 34px ${B}`; x.fillText(e.n, 80, 200);
  /* ilerleme çubukları */
  for (let k = 0; k < n; k++) { x.fillStyle = k <= i ? gold : 'rgba(255,255,255,.18)'; const w = (W - 160 - (n - 1) * 12) / n; x.fillRect(80 + k * (w + 12), 60, w, 8); }
  /* büyük sayı */
  x.fillStyle = 'rgba(232,196,104,.95)'; x.font = `800 360px ${D}`; cardFit(x, fr.big, W - 160, 360, 800, D); x.fillText(fr.big, 72, 1060);
  if (fr.bigS) { x.fillStyle = tx; x.font = `700 64px ${D}`; x.fillText(U44(fr.bigS), 80, 1145); }
  /* bölüm ve başlık */
  x.fillStyle = gold; x.font = `700 44px ${D}`; x.fillText('— ' + T(fr.k), 80, 1290);
  x.fillStyle = tx; cardFit(x, fr.t, W - 160, 150, 800, D); x.fillText(fr.t, 76, 1440);
  /* alt satırlar */
  let y = 1530; x.font = `500 46px ${B}`;
  fr.s.filter(Boolean).forEach((s, j) => { x.fillStyle = j === 0 ? tx : mut; const lines = wrap44(x, s, W - 160, `${j === 0 ? 600 : 500} 46px ${B}`); lines.forEach(l => { x.fillText(l, 80, y); y += 62; }); y += 14; });
  /* alt şerit */
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(80, H - 150, W - 160, 2);
  x.fillStyle = fr.end ? gold : mut; x.font = `700 40px ${D}`; x.fillText(fr.end ? T('MİRAS FC · App Store') : `${i + 1} / ${n}`, 80, H - 90);
  x.textAlign = 'right'; x.fillStyle = mut; x.font = `500 32px ${B}`; x.fillText(T('Geriye ne bırakacaksın?'), W - 80, H - 90); x.textAlign = 'left';
  return cv;
}
function U44(s) { return String(s).toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'); }
function wrap44(x, s, maxW, font) { x.font = font; const w = String(s).split(' '), out = []; let cur = ''; for (const t of w) { const n2 = cur ? cur + ' ' + t : t; if (x.measureText(n2).width > maxW && cur) { out.push(cur); cur = t; } else cur = n2; } if (cur) out.push(cur); return out.slice(0, 3); }

let FILMURLS = [], FILMI = 0, FILME = null;
async function filmOpen(e) {
  FILME = e; await cardFonts();
  const fr = filmFrames(e); FILMURLS = fr.map((f, i) => { const c = filmCanvas(e, f, i, fr.length); return c ? c.toDataURL('image/png') : ''; }).filter(Boolean);
  if (!FILMURLS.length) return toast('Bu cihazda film çizilemedi');
  FILMI = 0; let el = document.getElementById('mfilm');
  if (!el) { el = document.createElement('div'); el.id = 'mfilm'; el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  el.hidden = false; filmDraw();
}
function filmDraw() {
  const el = document.getElementById('mfilm'); if (!el) return;
  el.innerHTML = `<div class="tutc card filmc"><div class="tutt"><span class="eyebrow gold">🎬 Hayatının Filmi</span><button class="lnk" onclick="filmClose()">Kapat ✕</button></div>
  <div class="filmv" onclick="filmNav(event)"><img src="${FILMURLS[FILMI]}" alt="${esc(FILME.n)} · ${FILMI + 1}/${FILMURLS.length}"></div>
  <div class="filmdots">${FILMURLS.map((_, i) => `<i class="${i === FILMI ? 'on' : ''}"></i>`).join('')}</div>
  <div class="actions"><button class="btn ghost" onclick="filmStep(-1)" ${FILMI ? '' : 'disabled'}>‹</button><button class="btn big" style="flex:1" onclick="filmShare()">📤 Filmi paylaş</button><button class="btn ghost" onclick="filmStep(1)" ${FILMI < FILMURLS.length - 1 ? '' : 'disabled'}>›</button></div>
  <p class="m">Kareye dokunarak ilerle. Paylaş düğmesi çalışmazsa kareye uzun basıp kaydet.</p></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
function filmStep(d) { FILMI = cl(FILMI + d, 0, FILMURLS.length - 1); filmDraw(); }
function filmNav(ev) { const r = ev.currentTarget.getBoundingClientRect(); filmStep(ev.clientX - r.left < r.width / 3 ? -1 : 1); }
function filmClose() { const el = document.getElementById('mfilm'); if (el) { el.hidden = true; el.innerHTML = ''; } }
async function filmShare() {
  try {
    const slug = (FILME && FILME.n || 'miras').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-');
    const files = await Promise.all(FILMURLS.map((u, i) => fetch(u).then(r => r.blob()).then(b => new File([b], `miras-fc-${slug}-${i + 1}.png`, { type: 'image/png' }))));
    if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, title: 'Miras FC', text: T('Hayatımın filmi') + ' · Miras FC' }); return; }
    const one = [files[FILMI]]; if (navigator.canShare && navigator.canShare({ files: one })) { await navigator.share({ files: one, title: 'Miras FC' }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  toast('Paylaşım açılmadı; kareye uzun basıp kaydedebilirsin');
}
function filmOpenKey(i) { const k = HALLK[i]; const e = (acct().hall || []).find(x => x.key === k); if (e) filmOpen(e); }
function filmOpenCurrent() { if (!g) return; filmOpen(hallEntry(g)); }
{
  /* hayat sonu ve miras ekranına film kartı */
  const MS_FILM = `<div class="card filmcta"><div class="eyebrow gold">🎬 Hayatının Filmi</div><p class="m">Bu hayatı 6 karede anlat: doğum, ilk imza, zirve, kupalar, aile ve miras. Hikâyende paylaş.</p><div class="actions"><button class="btn" onclick="filmOpenCurrent()">🎬 Filmi izle</button></div></div>`;
  const _end44 = endUI; endUI = function () { return MS_FILM + _end44.apply(this, arguments); };
  const _leg44 = legUI; legUI = function () { return _leg44.apply(this, arguments) + MS_FILM; };
  /* Miras Salonu'ndaki her hayata film düğmesi */
  const _hu44 = hallScr;
  hallScr = function () { return _hu44.apply(this, arguments).replace(/<button class="btn" onclick="cardOpenKey\((\d+)\)">🖼 Miras Kartı<\/button>/g, '<button class="btn" onclick="cardOpenKey($1)">🖼 Miras Kartı</button><button class="btn" onclick="filmOpenKey($1)">🎬 Film</button>'); };
}

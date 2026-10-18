/* ============================================================
   MİRAS FC — MİRAS SALONU ve MİRAS KARTI (v3.9)
   Biten her hayatın özeti hesap düzeyinde saklanır (mfc_acct.hall),
   kayıt yuvaları silinse bile Salon'da kalır. Her hayat için
   paylaşılabilir bir görsel kart (PNG) üretilir.
   Kayda (g) hiçbir fonksiyon yazılmaz; Salon yalnız düz veri tutar.
   ============================================================ */
const HALL_MAX = 60;

function hallEntry(h) {
  h = h || g; const c = h.car || {}, F = h.fam || { kids: [] }, n = h.ntw || {}, co = h.co || {};
  h._w = h === g ? wealth() : (h._w || 0);
  const p = mpParts(h), tot = p.foot + p.human + p.money;
  const by = {};
  for (const x of h.hist || []) {
    const k = x.id; by[k] = by[k] || { id: k, n: x.n, ap: 0, g: 0 };
    by[k].ap += x.ap || 0; by[k].g += x.g || 0;
  }
  const clubs = Object.values(by).sort((a, b) => b.ap - a.ap).slice(0, 4);
  const top = clubs.length ? club(clubs[0].id) : null;
  const y0 = h.y0 || (h.season - h.age);
  return {
    key: `${h.name}|${y0}|${h.ct}|${(h.linN || (h.lin || []).length) + 1}`,
    n: h.name, ct: h.ct, city: h.city || '', pos: h.pos || '', y0, y1: h.season, age: h.age,
    gen: (h.linN || (h.lin || []).length) + 1, mp: tot, tier: mpT(tot), parts: p,
    ap: c.ap || 0, g: c.g || 0, a: c.a || 0, lg: c.t || 0, cup: c.cup || 0, ec: c.ec || 0, el: c.el || 0, bal: c.bal || 0, gk: c.gk || 0,
    caps: h.nat ? h.nat.caps || 0 : 0, ng: h.nat ? h.nat.g || 0 : 0, wc: n.wc || 0, rc: n.rc || 0,
    coS: co.s || 0, coT: co.t || 0, own: h.own ? h.own.n : (h.oh && h.oh.n) || '',
    kids: F.kids.length, w: Math.round((h._w || 0) * 10) / 10,
    clubs: clubs.map(x => ({ n: x.n, ap: x.ap, g: x.g })),
    c1: top && top.c1 || '#e8c468', c2: top && top.c2 || '#121b17',
    dream: h.dream && dreamDone(h) ? h.dream : '', defter: defter(h), at: Date.now(),
  };
}

/* Aynı hayat iki kez yazılmaz (anahtar: ad + doğum yılı + ülke + kuşak). */
function hallRecord(h) {
  try {
    const A = acct(), e = hallEntry(h); A.hall = A.hall || [];
    const i = A.hall.findIndex(x => x.key === e.key);
    if (i >= 0) A.hall[i] = e; else A.hall.push(e);
    if (A.hall.length > HALL_MAX) {
      /* en yeni 10 hayat her zaman kalır; kalanlardan en düşük puanlı atılır */
      const recent = new Set(A.hall.slice().sort((a, b) => b.at - a.at).slice(0, 10).map(x => x.key));
      const drop = A.hall.filter(x => !recent.has(x.key)).sort((a, b) => a.mp - b.mp)[0];
      if (drop) A.hall = A.hall.filter(x => x !== drop);
    }
    acctSave(); return e;
  } catch (err) { console.error(err); return null; }
}

function hallList() { return (acct().hall || []).slice().sort((a, b) => b.mp - a.mp); }
function trophies(e) { return e.lg + e.cup + e.ec + e.el + e.wc + e.rc; }

function hallRecords(L) {
  if (!L.length) return [];
  const best = (f, min = 1) => { const x = L.reduce((a, b) => f(b) > f(a) ? b : a); return f(x) >= min ? x : null; };
  return [
    ['🏛', 'En yüksek Miras Puanı', best(e => e.mp), e => `${e.mp}`],
    ['⚽', 'En golcü', best(e => e.g), e => `${e.g} gol`],
    ['🏆', 'En çok kupa', best(trophies), e => `${trophies(e)} kupa`],
    ['🌍', 'En çok milli maç', best(e => e.caps), e => `${e.caps} maç`],
    ['💰', 'En büyük servet', best(e => e.w), e => fm(e.w)],
    ['🌳', 'En uzun soy', best(e => e.gen, 2), e => `${e.gen}. kuşak`],
  ].filter(r => r[2]);
}

function hallEpitaph(e) {
  const s = [];
  if (e.wc) s.push(e.wc > 1 ? `${e.wc} kez Dünya Kupası şampiyonu` : 'Dünya Kupası şampiyonu');
  if (e.bal) s.push(e.bal > 1 ? `${e.bal} Altın Top` : 'Altın Top sahibi');
  if (e.ec) s.push(e.ec > 1 ? `${e.ec} kez Avrupa şampiyonu` : 'Avrupa şampiyonu');
  if (e.rc && !e.wc) s.push('Kıta şampiyonu');
  if (e.lg) s.push(`${e.lg} lig şampiyonluğu`);
  if (e.gk) s.push(`${e.gk} gol krallığı`);
  if (e.coT) s.push(`Teknik direktör olarak ${e.coT} şampiyonluk`);
  if (e.own) s.push(`${clubName(e.own)} sahibi`);
  if (e.dream) s.push('Çocukluk hayalini gerçekleştirdi');
  if (!s.length) s.push(e.ap ? `${e.ap} maçlık bir kariyer` : 'Hayatı sahanın dışında şekillendi');
  return s.slice(0, 3);
}

/* ---------- Salon ekranı ---------- */
let HALLX = null, HALLK = [];
const hallK = k => { let i = HALLK.indexOf(k); if (i < 0) { HALLK.push(k); i = HALLK.length - 1; } return i; };
function hallPick(i) { HALLX = HALLX === HALLK[i] ? null : HALLK[i]; draw(); }
function hallOpen() { scr = 'hall'; HALLX = null; draw(); window.scrollTo(0, 0); }
function hallScr() {
  const L = hallList(), R = hallRecords(L);
  let h = `<div class="card hallhead"><div class="eyebrow gold">🏛 Miras Salonu</div><h2>Biten hayatlar</h2><p class="m">Her hayat bittiğinde ya da mirasını devrettiğinde buraya yazılır. Kayıtlarını silsen bile Salon'da kalır.</p><div class="actions"><button class="btn ghost" onclick="menu()">← Menüye dön</button></div></div>`;
  if (!L.length) h += `<div class="card"><p class="lead">Salon henüz boş.</p><p class="m">İlk hayatın son düdüğü çaldığında burada yerini alacak.</p></div>`;
  if (R.length) h += `<div class="card"><div class="eyebrow">Rekorlar</div><div class="hrec">${R.map(([i, t, e, v]) => `<button class="hrecb" onclick="HALLX=null;hallPick(${hallK(e.key)})"><span class="hri">${i}</span><span><small>${t}</small><b>${esc(e.n)}</b><em>${esc(v(e))}</em></span></button>`).join('')}</div></div>`;
  h += L.map((e, i) => {
    const open = HALLX === e.key;
    return `<div class="card hallc ${open ? 'open' : ''}" style="--c1:${e.c1};--c2:${e.c2}"><button class="hallrow" onclick="hallPick(${hallK(e.key)})"><span class="hrank">${i + 1}</span><span class="hmain"><b>${esc(e.n)}</b><small>${esc(e.ct)} · ${e.y0}–${e.y1} · ${e.gen > 1 ? e.gen + '. kuşak · ' : ''}${POSN[e.pos] || ''}</small></span><span class="hmp"><b>${e.mp}</b><small>${esc(e.tier)}</small></span></button>
    ${open ? `<div class="kvs"><div class="kv"><span>Maç</span><b>${e.ap}</b></div><div class="kv"><span>Gol</span><b>${e.g}</b></div><div class="kv"><span>Asist</span><b>${e.a}</b></div><div class="kv"><span>Toplam kupa</span><b>${trophies(e)}</b></div><div class="kv"><span>A milli maç</span><b>${e.caps}</b></div><div class="kv"><span>Servet</span><b>${fm(e.w)}</b></div></div>
    <div class="m">${hallEpitaph(e).map(esc).join(' · ')}</div>${e.clubs.length ? `<div class="m">Kulüpler: ${e.clubs.map(x => esc(clubName(x.n))).join(' › ')}</div>` : ''}
    <p class="defter">${esc(e.defter)}</p><div class="actions"><button class="btn" onclick="cardOpenKey(${hallK(e.key)})">🖼 Miras Kartı</button><button class="btn ghost danger" onclick="hallDel(${hallK(e.key)})">Salondan kaldır</button></div>` : ''}</div>`;
  }).join('');
  return h;
}
function hallDel(i) { const k = HALLK[i]; ask('Bu hayat Miras Salonu’ndan kaldırılsın mı?', () => { const A = acct(); A.hall = (A.hall || []).filter(x => x.key !== k); acctSave(); HALLX = null; draw(); }, 'Kaldır'); }

/* ---------- Miras Kartı (1080×1350 PNG) ---------- */
function cardFit(x, t, max, size, weight, fam) {
  let s = size; do { x.font = `${weight} ${s}px ${fam}`; s -= 2; } while (x.measureText(t).width > max && s > 20); return s + 2;
}
function cardCanvas(e) {
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350;
  const x = cv.getContext && cv.getContext('2d'); if (!x) return null;
  const W = 1080, H = 1350, D = '"Barlow Condensed", "Arial Narrow", sans-serif', B = '"Barlow", system-ui, sans-serif';
  const gold = '#e8c468', mut = '#8b9d94', tx = '#e9efea';
  /* zemin: gece maçı */
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0e1512'); bg.addColorStop(1, '#070b09'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.globalAlpha = .05; x.fillStyle = '#fff'; for (let y = 0; y < H; y += 92) x.fillRect(0, y, W, 46); x.globalAlpha = 1;
  /* forma şeridi */
  x.save(); x.translate(W, 0); x.rotate(Math.PI / 4);
  x.fillStyle = e.c1; x.fillRect(-300, 50, 1000, 92); x.fillStyle = e.c2; x.fillRect(-300, 142, 1000, 34); x.restore();
  const glow = x.createRadialGradient(W / 2, 360, 40, W / 2, 360, 700); glow.addColorStop(0, 'rgba(232,196,104,.16)'); glow.addColorStop(1, 'rgba(232,196,104,0)'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
  /* başlık */
  x.fillStyle = gold; x.font = `700 34px ${D}`; x.textBaseline = 'alphabetic'; x.fillText('MIRAS FC · A FOOTBALL LIFE', 72, 108);
  x.fillStyle = mut; x.font = `500 30px ${B}`; x.fillText(T('Miras Kartı'), 72, 150);
  /* isim */
  x.fillStyle = tx; cardFit(x, e.n.toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), W - 144, 128, 700, D); x.fillText(e.n.toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), 72, 300);
  x.fillStyle = mut; x.font = `500 34px ${B}`;
  const sub = [T(e.ct), `${e.y0}–${e.y1}`, T(`${e.age} yaş`), POSN[e.pos] ? T(POSN[e.pos]) : '', e.gen > 1 ? T(`${e.gen}. kuşak`) : ""].filter(Boolean).join(' · ');
  cardFit(x, sub, W - 144, 34, 500, B); x.fillText(sub, 72, 352);
  /* Miras Puanı */
  x.fillStyle = gold; x.font = `700 230px ${D}`; x.fillText(String(e.mp), 64, 590);
  const mpw = x.measureText(String(e.mp)).width;
  x.fillStyle = tx; x.font = `700 58px ${D}`; x.fillText(T(e.tier).toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), 64 + mpw + 28, 520);
  x.fillStyle = mut; x.font = `500 30px ${B}`; x.fillText(T('Miras Puanı'), 64 + mpw + 30, 568);
  /* üç miras çubuğu */
  const parts = [['Futbol mirası', e.parts.foot], ['İnsan mirası', e.parts.human], ['Para mirası', e.parts.money]], mx = Math.max(1, e.mp);
  parts.forEach(([t, v], i) => {
    const y = 650 + i * 64; x.fillStyle = mut; x.font = `500 30px ${B}`; x.fillText(T(t), 72, y + 24);
    x.fillStyle = '#22302a'; x.fillRect(340, y, 560, 22); const gr = x.createLinearGradient(340, 0, 900, 0); gr.addColorStop(0, '#b8913a'); gr.addColorStop(1, gold);
    x.fillStyle = gr; x.fillRect(340, y, Math.max(6, 560 * v / mx), 22); x.fillStyle = tx; x.font = `600 30px ${B}`; x.fillText(String(v), 924, y + 22);
  });
  /* istatistik ızgarası */
  const stats = [['Maç', e.ap], ['Gol', e.g], ['Asist', e.a], ['Toplam kupa', trophies(e)], ['A milli maç', e.caps], ['Servet', T(fm(e.w))]];
  stats.forEach(([t, v], i) => {
    const cx = 72 + (i % 3) * 320, cy = 880 + Math.floor(i / 3) * 150;
    x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(cx, cy, 296, 128); x.strokeStyle = '#2c3d35'; x.lineWidth = 2; x.strokeRect(cx + 1, cy + 1, 294, 126);
    x.fillStyle = tx; cardFit(x, String(v), 260, 66, 700, D); x.fillText(String(v), cx + 22, cy + 72);
    x.fillStyle = mut; x.font = `500 26px ${B}`; x.fillText(T(t).toLocaleUpperCase(LANG === 'en' ? 'en' : 'tr'), cx + 22, cy + 110);
  });
  /* öne çıkanlar ve kulüpler */
  const ep = hallEpitaph(e).map(s => T(s)).join(' · ');
  x.fillStyle = gold; cardFit(x, ep, W - 144, 36, 600, B); x.fillText(ep, 72, 1222);
  if (e.clubs.length) { const cl = e.clubs.map(c => clubName(c.n)).join(' › '); x.fillStyle = mut; cardFit(x, cl, W - 144, 28, 500, B); x.fillText(cl, 72, 1266); }
  x.fillStyle = '#22302a'; x.fillRect(72, 1290, W - 144, 2);
  x.fillStyle = mut; x.font = `500 24px ${B}`; x.fillText(T('Geriye ne bırakacaksın?'), 72, 1326);
  x.textAlign = 'right'; x.fillText('Sardur Technologies', W - 72, 1326); x.textAlign = 'left';
  return cv;
}

async function cardFonts() {
  try { if (document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('700 80px "Barlow Condensed"'), document.fonts.load('500 30px "Barlow"'), document.fonts.load('600 30px "Barlow"')]), new Promise(r => setTimeout(r, 1500))]); } catch (err) { }
}
let CARDE = null, CARDURL = '';
async function cardOpen(e) {
  CARDE = e; await cardFonts();
  const cv = cardCanvas(e); if (!cv) { toast('Bu cihazda kart çizilemedi'); return; }
  CARDURL = cv.toDataURL('image/png');
  let el = document.getElementById('mcard');
  if (!el) { el = document.createElement('div'); el.id = 'mcard'; el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  el.hidden = false;
  el.innerHTML = `<div class="tutc card mcardc"><div class="tutt"><span class="eyebrow gold">Miras Kartı</span><button class="lnk" onclick="cardClose()">Kapat ✕</button></div>
  <img class="mcardimg" src="${CARDURL}" alt="${esc(e.n)} · Miras Kartı">
  <p class="m">Paylaş düğmesi çalışmazsa karta uzun basıp fotoğraflarına kaydedebilirsin.</p>
  <div class="actions"><button class="btn big" style="flex:1" onclick="cardShare()">📤 Paylaş</button><button class="btn ghost" onclick="cardSave()">⬇ İndir</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
function cardOpenKey(i) { const k = HALLK[i]; const e = (acct().hall || []).find(x => x.key === k); if (e) cardOpen(e); }
function cardOpenCurrent() { if (!g) return; cardOpen(hallEntry(g)); }
function cardClose() { const el = document.getElementById('mcard'); if (el) { el.hidden = true; el.innerHTML = ''; } }
function cardBlob() { return fetch(CARDURL).then(r => r.blob()); }
function cardFile(b) { const slug = (CARDE && CARDE.n || 'miras').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-'); return new File([b], `miras-fc-${slug}.png`, { type: 'image/png' }); }
async function cardShare() {
  try {
    const f = cardFile(await cardBlob());
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Miras FC', text: T('Futbol hayatımın mirası') + ' · Miras FC' }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  cardSave();
}
async function cardSave() {
  try { const a = document.createElement('a'); a.href = CARDURL; a.download = cardFile(new Blob()).name; document.body.appendChild(a); a.click(); a.remove(); toast('Kart indirildi'); }
  catch (err) { toast('İndirilemedi; karta uzun basıp kaydet'); }
}

/* ---------- Bağlantılar ---------- */
const MS_CARD = `<div class="card"><div class="eyebrow">Miras Kartı</div><p class="m">Hayatının özetini paylaşılabilir bir görsel karta dönüştür.</p><div class="actions"><button class="btn" onclick="cardOpenCurrent()">🖼 Kartı oluştur</button></div></div>`;
/* Hayat bitince ya da miras devredilince Salon'a yaz */
const _inheritHall = inherit;
inherit = function (ki) { try { if (g && g.fam && g.fam.kids[ki]) hallRecord(g); } catch (err) { } return _inheritHall.apply(this, arguments); };
const _endUIHall = endUI;
endUI = function () { hallRecord(g); return _endUIHall() + MS_CARD; };
const _legUIHall = legUI;
legUI = function () { return _legUIHall() + MS_CARD; };
const _drawInnerHall = drawInner;
drawInner = function () {
  if (scr === 'hall') { $('app').innerHTML = `<div class="wrap">${hallScr()}</div>`; $('nav').innerHTML = ''; i18nApply($('app')); return; }
  return _drawInnerHall.apply(this, arguments);
};
const _menuHall = menu;
menu = function () {
  _menuHall();
  try {
    const w = document.getElementById('app').querySelector('.wrap'); if (!w) return;
    const L = hallList(), best = L[0];
    const card = document.createElement('div'); card.className = 'card hallmenu';
    card.innerHTML = `<div class="row-b"><div><div class="eyebrow gold">🏛 Miras Salonu</div><div class="slotn">${L.length ? `${L.length} hayat` : 'Henüz boş'}</div><div class="m">${best ? `Zirvede: ${esc(best.n)} · ${best.mp} (${esc(best.tier)})` : 'Biten hayatların burada sergilenecek.'}</div></div><button class="btn" onclick="hallOpen()">Salonu aç</button></div>`;
    const slots = w.querySelectorAll('.slot'), last = slots[slots.length - 1];
    if (last && last.nextSibling) w.insertBefore(card, last.nextSibling); else w.appendChild(card);
    if (typeof i18nApply === 'function') i18nApply(card);
  } catch (err) { }
};

/* ============================================================
   MİRAS FC — v4.0 · Ödül Gecesi
   Sezon sonunda aday olduğun kategorilerde tören: sahne, spot ışığı,
   üç aday, davul sesi, zarf açılır. Kazanırsan kupa yükselir, konfeti,
   tribün kükrer ve konuşmanı seçersin (aile / takım / taraftar).
   Kazanamazsan büyük kırmızı ✗ ve ödülü alan isim.
   Kategoriler: Yılın Oyuncusu, Gol Kralı, Asist Kralı, Yılın Genç
   Oyuncusu, Sezonun 11'i, Altın Top. Ömürlük rakibin de aday olabilir.
   ============================================================ */
const AWC = [
  { k: 'altin', n: 'Altın Top', e: '🥇', nom: x => x.t1 && x.ap >= 15 && x.avg >= 7.3 && x.ovr >= 82, win: x => x.ap >= 15 && x.avg >= 7.6 && x.ovr >= 84 && x.t1, rw: { rep: 0, hap: 0, tok: 25 } },
  { k: 'yilin', n: 'Yılın Oyuncusu', e: '⭐', nom: x => x.ap >= 12 && x.avg >= 7.0, win: x => x.ap >= 15 && x.avg >= 7.3, rw: { tok: 10 } },
  { k: 'golk', n: 'Gol Kralı', e: '👟', nom: x => x.pos !== 'DF' && x.g >= 12, win: x => x.g >= 20 && x.pos !== 'DF', rw: { tok: 10 } },
  { k: 'asist', n: 'Asist Kralı', e: '🎯', nom: x => x.a >= 8, win: x => x.a >= 14, rw: { rep: 3, hap: 4, tok: 8 } },
  { k: 'genc', n: 'Yılın Genç Oyuncusu', e: '🌟', nom: x => x.age <= 21 && x.ap >= 10 && x.avg >= 6.9, win: x => x.age <= 21 && x.ap >= 12 && x.avg >= 7.2, rw: { rep: 4, hap: 6, tok: 8 } },
  { k: 'onbir', n: 'Sezonun 11\'i', e: '🏟️', nom: x => x.ap >= 15 && x.avg >= 6.95, win: x => x.ap >= 18 && x.avg >= 7.15, rw: { rep: 2, hap: 3, tok: 5 } },
];
const SPEECH = [
  { k: 'aile', l: '❤️ “Bu ödül aileme…”', d: 'Mutluluk ++, aile bağı +', f: () => { g.hap = clr(g.hap + 6, 0, 100); try { aliveParent().forEach(p => relAdj(p, 6)); if (g.fam.partner) relAdj(g.fam.partner, 6); g.fam.kids.forEach(k => relAdj(k, 5)); } catch (e) { } } },
  { k: 'takim', l: '🤝 “Takım arkadaşlarım olmasa…”', d: 'Takım uyumu ++, moral +', f: () => { g.uyum = clr((g.uyum || 50) + 10, 0, 100); g.mor = clr(g.mor + 6, 0, 100); } },
  { k: 'taraftar', l: '📣 “Bu kupa tribünlerin!”', d: 'Ün ++, sponsorlar ilgilenir', f: () => { g.rep = cl(g.rep + 4, 0, 100); g.fans = (g.fans || 0) + 1; } },
  { k: 'mizah', l: '😄 Esprili bir konuşma', d: 'Ün +, sosyal medyada viral', f: () => { g.rep = cl(g.rep + 2, 0, 100); g.hap = clr(g.hap + 3, 0, 100); } },
];
function awNames(n, excl) {
  const out = [], NP = NAMES[cinfo(g.club ? g.club.ct : g.ct).lang] || NAMES.tr;
  if (g.rv && !g.rv.ret && g.rv.club && Math.random() < .6) out.push({ n: g.rv.n, rv: 1 });
  try { const L = []; Object.keys(g.sq || {}).forEach(id => { if (g.club && +id === g.club.id) return; (g.sq[id] || []).forEach(p => { if (p.r >= 78) L.push(p); }); }); L.sort(() => Math.random() - .5).slice(0, 6).forEach(p => out.push({ n: pname(p) })); } catch (e) { }
  while (out.length < n + 2) out.push({ n: P(NP.f) + ' ' + P(NP.l) });
  const o2 = []; out.forEach(x => { if (x.n !== excl && !o2.some(y => y.n === x.n)) o2.push(x); }); while (o2.length < n) o2.push({ n: P(NP.f) + ' ' + P(NP.l) }); return o2.slice(0, n);
}
/* sezon sonu: adaylıkları hesapla, yeni kategorilerin ödülünü ver */
const _seasonEndAw = seasonEnd;
seasonEnd = function () {
  const ss = g.ss || {}, x = { ap: ss.ap || 0, g: ss.g || 0, a: ss.a || 0, avg: ss.ap ? ss.rs / ss.ap : 0, ovr: ovr(), age: g.age, pos: g.pos, t1: !!(g.lg && g.lg.t === 1), club: g.club ? g.club.n : '' };
  const pro = g.phase === 'pro';
  _seasonEndAw.apply(this, arguments);
  if (!pro || !g.lastSeason) return;
  const aw = [];
  AWC.forEach(c => { if (!c.nom(x)) return; const win = !!c.win(x), rivals = awNames(2, g.name);
    aw.push({ k: c.k, n: c.n, e: c.e, win: win ? 1 : 0, nom: [{ n: g.name, me: 1 }].concat(rivals), w: win ? g.name : rivals[0].n, rv: rivals[0].rv ? 1 : 0 });
    if (win) { const r = c.rw || {}; if (r.rep) g.rep = cl(g.rep + r.rep, 0, 100); if (r.hap) g.hap = clr(g.hap + r.hap, 0, 100); if (r.tok) tokAdd(r.tok, `${c.n} ödülü`); g.car = g.car || {}; g.car['aw_' + c.k] = (g.car['aw_' + c.k] || 0) + 1; (g.cab = g.cab || []).push({ y: g.season - 1, k: c.e, n: c.n, c: x.club || g.ct }); if (!['altin', 'yilin', 'golk'].includes(c.k)) g.lastSeason.lines.push(`${c.e} ${c.n} ödülünü kazandın!`); }
    else if (rivals[0].rv) L(`${c.n} ödülünü ömürlük rakibin ${rivals[0].n} kazandı. Bu acıttı.`); });
  if (aw.length) { g.lastSeason.aw = aw; g.lastSeason.awSeen = 0; }
};
/* sezon sonu ekranında tören kartı; ilk açılışta tören kendiliğinden başlar */
const _seasonUIAw = seasonUI;
seasonUI = function () {
  const h = _seasonUIAw(), s = g.lastSeason; if (!s || !s.aw) return h;
  const won = s.aw.filter(a => a.win).length;
  const card = `<div class="card awc"><div class="eyebrow gold">🏆 Ödül Gecesi</div><p class="lead">${s.aw.length} kategoride aday gösterildin${s.awSeen ? `; ${won} ödül kazandın` : ''}.</p><div class="awl">${s.aw.map(a => `<span class="${s.awSeen ? (a.win ? 'w' : 'l') : ''}">${a.e} ${esc(a.n)}${s.awSeen ? (a.win ? ' ✓' : ' ✗') : ''}</span>`).join('')}</div><button class="btn ${s.awSeen ? 'ghost' : 'big'}" onclick="awOpen()">${s.awSeen ? '🎬 Töreni tekrar izle' : '🎬 Töreni izle'}</button></div>`;
  if (!s.awSeen && !AWS) setTimeout(() => { if (scr === 'season' && !AWS) awOpen(); }, 400);
  return card + h;
};
let AWS = null;
function awOpen() { const s = g.lastSeason; if (!s || !s.aw) return; try { audioUnlock(); } catch (e) { } AWS = { i: 0, st: 'intro' }; awDraw(); }
function awNext() { const s = g.lastSeason; AWS.i++; AWS.st = 'intro'; if (AWS.i >= s.aw.length) return awClose(); awDraw(); }
function awClose() { const el = document.getElementById('awp'); if (el) el.remove(); AWS = null; if (g.lastSeason) g.lastSeason.awSeen = 1; sv(); draw(); }
function awReveal() {
  if (!AWS || AWS.st !== 'intro') return; AWS.st = 'drum'; awDraw();
  try { for (let i = 0; i < 9; i++) setTimeout(() => clap(0), i * 170); } catch (e) { }
  setTimeout(() => { if (!AWS) return; const a = g.lastSeason.aw[AWS.i]; AWS.st = 'res'; awDraw();
    try { if (a.win) { sfx('roar'); voiceSay('goal', LANG === 'en' ? `And the award goes to... ${g.name}!` : `Ve ödül... ${g.name}!`, 3); if (typeof speak === 'function' && setOf('voice')) setTimeout(() => speak(LANG === 'en' ? `${g.name}!` : `${g.name}!`, 3), 1900); } else { sfx('groan'); } } catch (e) { }
  }, 1800);
}
function awSpeech(k) { const a = g.lastSeason.aw[AWS.i], sp = SPEECH.find(x => x.k === k); if (!sp || a.sp) return; sp.f(); a.sp = k; L(`${a.n} ödül konuşması: ${sp.l.replace(/^\S+\s/, '')}`); toast('🎤 ' + T(sp.d)); sv(); awDraw(); }
function awDraw() {
  const s = g.lastSeason, a = s && s.aw[AWS.i]; if (!a) return;
  let el = document.getElementById('awp'); if (!el) { el = document.createElement('div'); el.id = 'awp'; el.className = 'awp'; document.body.appendChild(el); }
  const nom = a.nom.map((n, i) => { const isW = AWS.st === 'res' && n.n === a.w, isL = AWS.st === 'res' && !isW; return `<div class="awn ${n.me ? 'me' : ''} ${isW ? 'win' : ''} ${isL ? 'lose' : ''}" style="animation-delay:${.15 + i * .18}s"><div class="awav">${esc(initials(n.n))}</div><b>${esc(n.n)}</b>${n.rv ? '<span>ömürlük rakibin</span>' : n.me ? '<span>sen</span>' : '<span>&nbsp;</span>'}</div>`; }).join('');
  let mid = '';
  if (AWS.st === 'intro') mid = `<button class="btn big awbtn" onclick="awReveal()">✉️ Zarfı aç</button>`;
  if (AWS.st === 'drum') mid = `<div class="awdrum">🥁 Ve ödülü kazanan…</div>`;
  if (AWS.st === 'res' && a.win) mid = `<div class="awtro">🏆</div><div class="awwin">${esc(g.name)}</div><div class="awconf">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 10) * .12}s;background:${['#ffe34d', '#ff6b5b', '#56c98d', '#7fb2ff', '#fff'][i % 5]}"></i>`).join('')}</div>
    ${a.sp ? `<p class="m awq">🎤 ${esc(T(SPEECH.find(x => x.k === a.sp).l))}</p><button class="btn big awbtn" onclick="awNext()">${AWS.i + 1 < s.aw.length ? 'Sonraki ödül →' : 'Töreni bitir'}</button>` : `<div class="eyebrow">Ödül konuşmanı yap</div><div class="opts">${SPEECH.map(sp => `<button class="opt" onclick="awSpeech('${sp.k}')"><b>${sp.l}</b><span>${sp.d}</span></button>`).join('')}</div>`}`;
  if (AWS.st === 'res' && !a.win) mid = `<div class="awx">✗</div><div class="awlose">Kazanamadın</div><p class="m">Ödülü <b>${esc(a.w)}</b> kazandı.${a.rv ? ' Ömürlük rakibin sahnede…' : ''}</p><button class="btn big awbtn" onclick="awNext()">${AWS.i + 1 < s.aw.length ? 'Sonraki ödül →' : 'Töreni bitir'}</button>`;
  el.innerHTML = `<div class="awstage"><div class="awspot"></div><div class="awtop"><span class="eyebrow">🏆 Ödül Gecesi · ${AWS.i + 1}/${s.aw.length}</span><button class="lnk" onclick="awClose()">Geç ✕</button></div>
    <div class="awcat"><div class="awe">${a.e}</div><h2>${esc(a.n)}</h2><div class="m">${g.season - 1}/${String(g.season).slice(2)} sezonu · adaylar</div></div><div class="awnoms">${nom}</div><div class="awmid">${mid}</div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}

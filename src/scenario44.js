/* ============================================================
   v4.4 — 🎭 SENARYO MODU
   Hazır bir hayatın ortasından başlarsın; her senaryonun bir hedefi ve
   süresi var. Hedefe ne kadar erken ulaşırsan o kadar çok yıldız (⭐1–3).
   Senaryo bitse de hayat devam eder (normal kariyer gibi).
   Yıldızlar hesaba yazılır (acct().scen), ana menüde görünür.
   ============================================================ */
const SCEN = [
  { id: 'harika', e: '🌱', n: 'Altyapı Harikası', who: 'Efe Yıldız', age: 17, pos: 'FW', st: 64, yrs: 4,
    d: '17 yaşında ülkenin en büyük kulübüne imza attın ama teknik direktör sana şans vermiyor.',
    goal: '21 yaşına girmeden 5 kez A milli takımda forma giy.' },
  { id: 'bag', e: '🩹', n: 'Çapraz Bağ', who: 'Mert Kalkan', age: 24, pos: 'MF', st: 77, yrs: 3,
    d: 'Büyük bir kulübün yıldızıyken çapraz bağların koptu. Doktorlar 30 hafta yoksun diyor.',
    goal: 'Gelecek sezon en az 20 maça çık ve yerini geri al.' },
  { id: 'dans', e: '🕯️', n: 'Son Dans', who: 'Volkan Arslan', age: 33, pos: 'FW', st: 70, yrs: 2,
    d: '33 yaşındasın, alt ligde oynuyorsun ve kötü yatırımlar yüzünden 1,2 M€ borcun var.',
    goal: 'İki sezon içinde 15 gol at ve borcunu kapat.' },
  { id: 'donus', e: '🏠', n: 'Memlekete Dönüş', who: 'Kaan Demirel', age: 31, pos: 'MF', st: 80, yrs: 3,
    d: 'Avrupa’da yıldız oldun. Çocukluk kulübün ise ligin dibinde ve senden yardım bekliyor.',
    goal: 'Çocukluk kulübüne dön ve 3 sezon içinde ligi ilk 6’da bitir.' },
];
function scAcct() { const A = acct(); A.scen = A.scen || {}; return A.scen; }
function scStars() { return Object.values(scAcct()).reduce((s, v) => s + (v || 0), 0); }
function scFreeSlot() { for (let i = 1; i <= acct().slots; i++) if (!ld(i)) return i; return 0; }
function scMenuHTML() {
  const A = scAcct();
  return `<div class="card scmenu"><div class="row-b"><div class="eyebrow gold">🎭 Senaryo Modu</div><span class="tag gold">⭐ ${scStars()} / ${SCEN.length * 3}</span></div>
  <p class="m">Hazır bir hayatın ortasından başla, hedefe ulaş. Erken başarırsan daha çok yıldız.</p>
  <div class="sclist">${SCEN.map(s => `<button class="scb" onclick="scOpen('${s.id}')"><span class="sce">${s.e}</span><span class="scn"><b>${s.n}</b><i>${s.age} yaş · ${s.yrs} sezon</i></span><span class="scs">${'⭐'.repeat(A[s.id] || 0)}${'<em>☆</em>'.repeat(3 - (A[s.id] || 0))}</span></button>`).join('')}</div></div>`;
}
function scOpen(id) {
  const s = SCEN.find(x => x.id === id); if (!s) return;
  let el = document.getElementById('scdlg'); if (!el) { el = document.createElement('div'); el.id = 'scdlg'; el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  const free = scFreeSlot(), best = scAcct()[id] || 0;
  el.hidden = false;
  el.innerHTML = `<div class="tutc card"><div class="tute">${s.e}</div><h2>${s.n}</h2><p class="m">${s.who} · ${s.age} yaş</p><p>${s.d}</p>
  <div class="scgoal"><b>🎯 Hedef</b><span>${s.goal}</span></div><p class="m">${s.id === 'bag' ? '⭐⭐⭐ ikinci sezonda · ⭐⭐ üçüncü' : '⭐⭐⭐ ilk sezonda · ⭐⭐ ikinci · ⭐ sonrasında'}${best ? ` · En iyin: ${'⭐'.repeat(best)}` : ''}</p>
  ${free ? '' : '<p class="m warn">Senaryo için boş bir kayıt yuvası gerekiyor. Ana menüden bir kaydı sil ya da mağazadan yuva aç.</p>'}
  <div class="actions"><button class="btn big" style="flex:1" ${free ? '' : 'disabled'} onclick="scStart('${s.id}')">Senaryoyu başlat</button><button class="btn ghost" onclick="document.getElementById('scdlg').hidden=true">Vazgeç</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
function scSetStats(v) { for (const k of K) g.st[k] = cl(v + R(-3, 3), 30, 95); g.pot = Math.max(g.pot || 0, v + 12); }
function scSign(c, ct, role) {
  g.of = [mkOffer(c, ct, 'win', { role })]; g.ofKind = 'win'; sign(0);
  if (scr === 'num') pickNum(freeNum(g.sq[g.club.id], g.pos));
  g.role = role; if (g.con) g.con.role = role; scr = 'game';
}
function scStart(id) {
  const s = SCEN.find(x => x.id === id), slotN = scFreeSlot(); if (!s || !slotN) return;
  const d = document.getElementById('scdlg'); if (d) d.hidden = true;
  nw(slotN); NC.pos = s.pos; NC.st = Object.keys(STYLES[s.pos])[0]; newScr();
  $('nn').value = s.who; if ($('nc')) $('nc').value = 'Türkiye'; if ($('ng')) $('ng').value = 'Türkiye'; if ($('ny')) $('ny').value = 'İstanbul';
  mk(); if (!g) return;
  /* çocukluğu hızlıca geç */
  let k = 0; while (g.phase === 'child' && k++ < 40) { if (g.q) answerQ(0); while (g.ev) choose(0); if (g.q) answerQ(0); childYear(); }
  if (scr === 'offers') { if (g.of && g.of.length) sign(0); else declineOffers(); }
  if (scr === 'num') pickNum(freeNum(g.sq[g.club.id], g.pos));
  g.ev = null; g.q = null; g.evq = [];
  const dAge = s.age - g.age; g.age = s.age; g.season += dAge; scSetStats(s.st); g.loanSureDone = 1; g.tutDone = 1;
  const ct = 'Türkiye', tiers = g.w[ct], top = tiers[0].slice().sort((a, b) => b.s - a.s);
  if (id === 'harika') { scSign(top[0], ct, 0); g.rep = 10; }
  if (id === 'bag') { scSign(top[1] || top[0], ct, 3); g.rep = 45; g.inj = 30; g.injLong = 3; L('Çapraz bağların koptu. Uzun bir dönüş yolu seni bekliyor.'); }
  if (id === 'dans') { const t2 = (tiers[1] || tiers[0]).slice().sort((a, b) => b.s - a.s); scSign(t2[Math.floor(t2.length / 2)], ct, 3); g.money = -1200; g.rep = 30; L('Kötü yatırımlar yüzünden 1,2 M€ borca girdin.'); }
  if (id === 'donus') {
    const abroad = COUNTRIES.find(c => c.n === 'İspanya') || COUNTRIES.find(c => c.n !== ct), at = g.w[abroad.n][0].slice().sort((a, b) => b.s - a.s);
    const home = top[Math.floor(top.length * .65)]; g.homeClub = home.id;
    scSign(at[2] || at[0], abroad.n, 3); g.rep = 70; g.money = 6000;
    g.of = [mkOffer(home, ct, 'win', { home: 1, role: 4, msg: 'Çocukluk kulübün seni geri istiyor. Taraftar havaalanında bekleyecek.' })]; g.ofKind = 'win'; scr = 'offers';
  }
  g.scn = { id, y0: g.season, g0: g.car.g, c0: g.nat.caps, yrs: s.yrs, done: 0, fail: 0 };
  L(`🎭 Senaryo başladı: ${s.n}. Hedef: ${s.goal}`);
  try { UNDO = null; } catch (e) { }
  sv(); draw(); window.scrollTo(0, 0);
}
function scProgress() {
  const c = g.scn, s = c && SCEN.find(x => x.id === c.id); if (!s) return '';
  const used = g.season - c.y0, left = Math.max(0, s.yrs - used);
  if (c.id === 'harika') return `A milli maç: ${g.nat.caps - (c.c0 || 0)} / 5 · ${Math.max(0, 21 - g.age)} yılın kaldı`;
  if (c.id === 'bag') return used === 0 ? `Sakatlık: ${g.inj} hafta kaldı` : `Bu sezon: ${g.ss.ap} / 20 maç`;
  if (c.id === 'dans') return `Gol: ${g.car.g - c.g0} / 15 · Servet: ${fm(wealth())} · ${left} sezon kaldı`;
  if (c.id === 'donus') return `${g.club && g.club.id === g.homeClub ? 'Çocukluk kulübündesin' : 'Henüz çocukluk kulübünde değilsin'} · ${left} sezon kaldı`;
  return '';
}
function scCardHTML() {
  const c = g && g.scn, s = c && SCEN.find(x => x.id === c.id); if (!s || c.seen) return '';
  const st = c.done ? `<div class="m">✅ Başardın! ${'⭐'.repeat(c.done)}</div>` : c.fail ? '<div class="m">❌ Hedefe süre içinde ulaşamadın. Hayat devam ediyor.</div>' : `<div class="m">${scProgress()}</div>`;
  return `<div class="card sccard"><div class="row-b"><div class="eyebrow gold">${s.e} Senaryo · ${s.n}</div>${c.done || c.fail ? `<button class="lnk" onclick="g.scn.seen=1;sv();draw()">Gizle</button>` : ''}</div><p><b>🎯 ${s.goal}</b></p>${st}</div>`;
}
function scFail(out) { const c = g.scn, s = SCEN.find(x => x.id === c.id); c.fail = 1; const t = `🎭 Senaryo süresi doldu: ${s.n}. Hayat devam ediyor.`; L(t); if (out && out.lines) out.lines.unshift(t); }
function scCheckSeason(pos) {
  const c = g.scn; if (!c || c.done || c.fail) return;
  const used = g.season - c.y0 + 1, s = SCEN.find(x => x.id === c.id), out = g.lastSeason;
  let ok = false;
  if (c.id === 'harika') ok = g.nat.caps - (c.c0 || 0) >= 5;
  if (c.id === 'bag') ok = used >= 2 && (g.seasons[0] && g.seasons[0].ap >= 20);
  if (c.id === 'dans') ok = g.car.g - c.g0 >= 15 && wealth() >= 0;
  if (c.id === 'donus') ok = g.club && g.club.id === g.homeClub && pos && pos <= 6;
  if (ok) { c.season = used; return scWin2(used, out); }
  if (c.id === 'harika' ? g.age >= 21 : used >= s.yrs) scFail(out);
}
function scWin2(used, out) { const c = g.scn, s = SCEN.find(x => x.id === c.id), e = c.id === 'bag' ? 2 : 1, stars = used <= e ? 3 : used <= e + 1 ? 2 : 1; c.done = stars; const A = scAcct(); A[c.id] = Math.max(A[c.id] || 0, stars); acctSave(); try { tokAdd(stars * 10, 'Senaryo ödülü'); } catch (e) { } const t = `🎭 SENARYO TAMAM: ${s.n} ${'⭐'.repeat(stars)}`; L(t); if (out && out.lines) out.lines.unshift(t); try { toast(t); } catch (e) { } }
{
  const _se44 = seasonEnd;
  seasonEnd = function () {
    const r = _se44.apply(this, arguments);
    try { if (g && g.scn) { g.season--; const pos = g.lastSeason && g.lastSeason.pos; scCheckSeason(pos); g.season++; } } catch (e) { console.error(e); }
    return r;
  };
  /* milli maç sezon ortasında gelirse harika senaryosu hemen tamamlanır */
  const _we44s = weekEnd;
  weekEnd = function () { const r = _we44s.apply(this, arguments); try { const c = g && g.scn; if (c && c.id === 'harika' && !c.done && !c.fail && g.nat && g.nat.caps - (c.c0 || 0) >= 5) scWin2(g.season - c.y0 + 1, null); } catch (e) { } return r; };
  const _ph44s = proHome; proHome = function () { const h = _ph44s.apply(this, arguments); try { return scCardHTML() + h; } catch (e) { return h; } };
  const _menu44 = menu;
  menu = function () { const r = _menu44.apply(this, arguments); try { const app = $('app'), w = app.querySelector('.wrap'), slot = w && w.querySelector('.card.slot'); if (slot) { slot.insertAdjacentHTML('beforebegin', scMenuHTML()); i18nApply(w); } } catch (e) { } return r; };
}

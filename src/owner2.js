/* ============================================================
   MİRAS FC — KULÜP SAHİPLİĞİ 2: holding ve derinlik
   - Birden fazla kulüp (kulüp grubu): aktif kulüp g.own, diğerleri g.owns
   - Genel müdür (CEO) ve otopilot: kulübü senin yerine yönetir
   - Sahip masası: teklifler, yatırımcılar, taraftar, belediye, cevherler
   - Tesisler: stadyum projesi, antrenman merkezi, sağlık, gözlem ağı, mağaza
   - Ticari: forma satışı, stadyum isim hakkı
   - Finans: banka kredisi, finansal fair play (FFP), hisse satışı
   - Grup içi transfer ve kiralık
   ============================================================ */
const MAXCLUBS = 5;
const allOwn = () => (typeof g !== 'undefined' && g ? [g.own].concat(g.owns || []).filter(Boolean) : []);
const ownById = id => allOwn().find(o => o.id === id) || null;
function switchOwn(id) { const o = (g.owns || []).find(x => x.id === id); if (!o) return; g.owns = g.owns.filter(x => x !== o).concat(g.own ? [g.own] : []); g.own = o; OV = 'ozet'; toast(`${clubName(o.n)} yönetiliyor`); sv(); draw(); }
function newOwnObj(x) {
  const c = club(x.id), NP = NAMES[cinfo(x.ct).lang] || NAMES.tr;
  return { id: x.id, ct: x.ct, n: x.n, price: x.p, bud: Math.round(x.p * .06), fan: c.fan, acad: 1, stad: 0, tick: 1, sp: null, yr: 0, t: 0, cup: 0, tl: c.t, last: null, coachR: R(62, 72), coachN: P(NP.f) + ' ' + P(NP.l), coachW: Math.round(clubRev(c) * .012), form: '4-4-2', sell: [], mk: 0, spOf: null, fin: [], train: 0, med: 0, scoutL: 0, shop: 0, stake: 1, debt: 0, inbox: [], ceo: null, auto: 0, ceoLog: [], vis: 'dengeli' };
}
buyClub = function (id) {
  const x = buyList().find(c => c.id === id); if (!x) return;
  if (allOwn().length >= MAXCLUBS) return toast(`En fazla ${MAXCLUBS} kulüp sahibi olabilirsin`);
  if (ownById(id)) return toast('Bu kulüp zaten senin');
  if (g.money < x.p) return toast(`Paran yetmiyor: ${fm(x.p)} gerekli`);
  ask(`${clubName(x.n)}, ${fm(x.p)} karşılığında satın alınsın mı?${g.own ? ' Kulüp grubuna eklenecek.' : ''}`, () => {
    money(-x.p, `Kulüp satın alındı: ${clubName(x.n)}`); const o = newOwnObj(x);
    if (g.own) g.owns = (g.owns || []).concat([g.own]); g.own = o;
    ensureSquad(x.id); youthIntake(x.id, 1); recalcStr(x.id); o.spOf = ownSponsorOffers();
    L(`${clubName(x.n)} kulübünü satın aldın!${allOwn().length > 1 ? ` Grubunda artık ${allOwn().length} kulüp var.` : ''}`); news(`${clubName(x.n)} kulübünün yeni sahibi: ${g.name}`); g.rep += 4; tab = 'own'; OV = 'ozet'; scr = 'game'; sv(); draw();
  });
};
sellClub = function () {
  const o = g.own, c = club(o.id), p = Math.round((c ? clubPrice(c) : o.price) * (o.stake == null ? 1 : o.stake)), net = p + o.bud - (o.debt || 0);
  ask(`${clubName(o.n)} satılsın mı? Payın ${fm(p)}${o.debt ? `, banka borcu ${fm(o.debt)} kapanır` : ''}.${g.coach && g.coach.id === o.id ? ' Teknik direktörlüğün de sona erer.' : ''}`, () => {
    if (g.coach && g.coach.id === o.id) coachLeave('Kulübü sattı', 0);
    money(net, 'Kulüp satışı'); g.oh = g.oh || { t: 0, yr: 0, cup: 0 }; g.oh.t += o.t; g.oh.yr += o.yr; g.oh.cup += o.cup; g.oh.n = o.n;
    L(`${clubName(o.n)} kulübünü sattın (eline geçen ${fm(net)}).`); const id = o.id; g.own = (g.owns || []).shift() || null; if (!(g.club && g.club.id === id)) dropSquad(id); tab = g.own ? 'own' : 'fin'; sv(); draw();
  });
};

/* ---------- Genel müdür (CEO) ve otopilot ---------- */
const VIS = { tutumlu: { n: 'Tutumlu', d: 'Kâr eder, az harcar, borçtan kaçar' }, dengeli: { n: 'Dengeli', d: 'Büyümeyi ve kasayı birlikte gözetir' }, iddiali: { n: 'İddialı', d: 'Başarı için harcar, risk alır' }, altyapi: { n: 'Altyapıcı', d: 'Gençlere, tesise ve gelecek yıllara yatırır' } };
function ceoCands(o) { const rnd = srng(hash(o.id + ':ceo:' + g.season)), NP = NAMES[cinfo(o.ct).lang] || NAMES.tr, c = club(o.id); return [0, 1, 2].map(i => { const r = Math.round(55 + rnd() * 38); return { n: NP.f[Math.floor(rnd() * NP.f.length)] + ' ' + NP.l[Math.floor(rnd() * NP.l.length)], r, w: Math.round(Math.pow(r / 70, 3) * (c ? clubRev(c) : 1000) * .004), bg: ['Eski futbolcu', 'Bankacı', 'Pazarlamacı', 'Avukat', 'Sportif direktör'][Math.floor(rnd() * 5)] }; }).sort((a, b) => b.r - a.r); }
function ceoHire(i) { const o = g.own, x = ceoCands(o)[i]; if (!x) return; o.ceo = x; o.auto = 1; L(`${clubName(o.n)} genel müdürü: ${x.n} (${x.bg}, kalite ${x.r}). Otopilot açık.`); toast(`${x.n} göreve başladı`); sv(); draw(); }
function ceoFire() { const o = g.own; if (!o.ceo) return; L(`${o.ceo.n} ile yollar ayrıldı.`); o.ceo = null; o.auto = 0; sv(); draw(); }
function ceoAuto() { const o = g.own; if (!o.ceo) return toast('Önce bir genel müdür tut'); o.auto = o.auto ? 0 : 1; toast(o.auto ? 'Otopilot açık: kulübü genel müdür yönetecek' : 'Otopilot kapalı: kararlar sende'); sv(); draw(); }
function setVis(k) { if (!VIS[k]) return; g.own.vis = k; toast(`Vizyon: ${VIS[k].n}`); sv(); draw(); }
function ceoLog(o, t) { o.ceoLog = [`${g.season}: ${t}`].concat(o.ceoLog || []).slice(0, 14); }
/* otopilot: tek kulüp için bir yönetim turu (transfer dönemi ve yıl sonu) */
function ceoRun(o, full) {
  if (!o.ceo || !o.auto) return; const c = club(o.id); if (!c) return; const v = o.vis || 'dengeli', q = (o.ceo.r - 70) / 100, self = g.coach && g.coach.id === o.id;
  const keep = g.own; g.own = o;
  try {
    /* ticari */
    const t0 = o.tick; o.tick = o.fan >= 72 && v !== 'altyapi' ? 2 : o.fan < 42 ? 0 : 1; if (t0 !== o.tick) ceoLog(o, `Bilet fiyatı: ${['Düşük', 'Normal', 'Yüksek'][o.tick]}.`);
    if (!o.sp) { const L2 = o.spOf || ownSponsorOffers(); const pick = L2.filter(s => !(s.fan < 0 && (o.fan < 60 || v !== 'tutumlu'))).sort((a, b) => b.v * b.y - a.v * a.y)[0]; if (pick) { o.sp = { ...pick, v: Math.round(pick.v * (1 + q * .3)) }; o.spOf = null; ceoLog(o, `Forma sponsoru: ${pick.n} (${fm(o.sp.v)}/yıl).`); } }
    /* teknik direktör */
    const exp = expRank(o.id), pos = g.prev ? g.prev[o.id] : 0;
    if (!self && (!o.coachN || (full && pos && pos > exp + 4))) { const cands = ownCoachCands(), aff = cands.filter(x => x.w * .5 < o.bud * .25); const x = aff[0]; if (x) { const i = cands.indexOf(x); const b0 = o.bud; ownHire(i); ceoLog(o, `Teknik direktör değişti: ${x.n} (${x.r}).${b0 !== o.bud ? '' : ''}`); } }
    /* kadro: sözleşme yenile, yaşlıları sat, takviye yap */
    if (!self) {
      const sq = g.sq[o.id] || [], xi = new Set(bestXI(o.id, o.form).map(p => p.id));
      sq.forEach(p => { if (p.yrs <= 1 && !p.renew && (xi.has(p.id) || p.age <= 22) && p.age < 32) p.renew = 1; });
      if (windowOpen() || g.phase === 'retired') {
        sq.filter(p => p.age >= 31 && !xi.has(p.id) && p.r < c.s - 2).slice(0, 2).forEach(p => { const fee = sellPlayer(o.id, p.id, o); ceoLog(o, `${pname(p)} satıldı (${fm(fee)}).`); });
        const share = { tutumlu: .18, dengeli: .32, iddiali: .55, altyapi: .2 }[v], cash = o.bud * share;
        if (!(o.ban && o.ban >= g.season) && cash > 0) { const M2 = market(o.id, o.mk + (o.scoutL || 0) * 11).filter(x => x.fee <= cash && (v !== 'altyapi' || x.age <= 23)).sort((a, b) => (b.r - a.r) + (v === 'altyapi' ? (a.age - b.age) * .5 : 0) + q * 3); const x = M2[0]; if (x && x.r >= c.s - 1) { if (buyPlayer(o.id, x, o)) { o.mk++; ceoLog(o, `Transfer: ${pname(x)} (${x.r}) ${fm(x.fee)}.`); } } }
      }
    }
    /* tesis yatırımı (yıl sonunda) */
    if (full) {
      const reserve = { tutumlu: .55, dengeli: .4, iddiali: .25, altyapi: .3 }[v], spend = o.bud * (1 - reserve);
      const order = v === 'altyapi' ? ['acad', 'train', 'scoutL', 'med', 'shop'] : v === 'iddiali' ? ['train', 'med', 'stad', 'acad', 'shop'] : v === 'tutumlu' ? ['shop', 'stad'] : ['acad', 'shop', 'train', 'stad', 'med'];
      for (const k of order) { const f = FAC[k]; if (!f) continue; const lv = facLv(o, k), cost = f.cost(o, lv); if (lv < f.max && cost <= spend && o.bud - cost > o.bud * reserve) { facUp(k, 1); ceoLog(o, `${f.n} seviye ${facLv(o, k)}.`); break; } }
      if ((o.debt || 0) > 0 && o.bud > o.debt * 1.5 && v !== 'iddiali') { const pay = Math.round(o.debt); o.bud -= pay; o.debt = 0; ceoLog(o, `Banka borcu kapatıldı (${fm(pay)}).`); }
    }
    /* masadaki kararlar */
    (o.inbox || []).slice().forEach(it => { const d = OWN_EV[it.id]; if (!d) return; ownAns(o.id, o.inbox.indexOf(it), d.def(o, it.x, v), 1); });
  } catch (e) { console.error(e); }
  g.own = keep;
}

/* ---------- Tesisler ---------- */
const facLv = (o, k) => k === 'stad' ? o.stad || 0 : o[k] || 0;
const FAC = {
  stad: { n: 'Stadyum', max: 4, d: 'Bilet, sponsor ve isim hakkı geliri artar. İnşaat bir sezon sürer; o sezon bilet geliri %15 düşer.', cost: (o, lv) => ownCostO(o, 440 * (lv + 1)) },
  acad: { n: 'Altyapı', max: 5, d: 'Her yıl gelen gençlerin potansiyeli yükselir.', cost: (o, lv) => ownCostO(o, 150 * (lv + 1)) },
  train: { n: 'Antrenman merkezi', max: 4, d: 'Oyuncular her yıl daha hızlı gelişir; takım gücü biraz artar.', cost: (o, lv) => ownCostO(o, 190 * (lv + 1)) },
  med: { n: 'Sağlık merkezi', max: 3, d: 'Sakatlıklar daha seyrek ve daha kısa.', cost: (o, lv) => ownCostO(o, 110 * (lv + 1)) },
  scoutL: { n: 'Gözlem ağı', max: 3, d: 'Transfer pazarında daha iyi ve daha genç oyuncular.', cost: (o, lv) => ownCostO(o, 90 * (lv + 1)) },
  shop: { n: 'Mağaza ve dijital', max: 3, d: 'Forma ve ürün satışı geliri artar.', cost: (o, lv) => ownCostO(o, 95 * (lv + 1)) },
};
const ownCostO = (o, base) => { const c = club(o.id); return c ? Math.round(base * clubRev(c) / 1200) : base; };
function facUp(k, quiet) {
  const o = g.own, f = FAC[k]; if (!f) return; const lv = facLv(o, k); if (lv >= f.max) return quiet || toast(`${f.n} en üst seviyede`);
  if (k === 'stad' && o.proj) return quiet || toast('Stadyum inşaatı zaten sürüyor');
  const cost = f.cost(o, lv); if (o.bud < cost) return quiet || toast(`Kulüp bütçesi yetmiyor: ${fm(cost)} gerekli`);
  o.bud -= cost;
  if (k === 'stad') { o.proj = { k: 'stad', to: lv + 1, y: g.season }; L(`${clubName(o.n)}: stadyum inşaatı başladı (${fm(cost)}); sezon sonunda ${STAD[lv + 1]} açılacak.`); }
  else { o[k] = lv + 1; if (k === 'train') recalcStr(o.id); L(`${clubName(o.n)}: ${f.n} seviye ${lv + 1} (${fm(cost)}).`); }
  if (!quiet) toast(`${f.n} → ${k === 'stad' ? 'inşaat başladı' : 'seviye ' + (lv + 1)}`); sv(); if (!quiet) draw();
}
ownStad = function () { facUp('stad'); }; ownAcad = function () { facUp('acad'); };

/* ---------- Finans: kredi, FFP, hisse ---------- */
function ownLoan(pct) { const o = g.own, c = club(o.id), amt = Math.round(clubPrice(c) * pct); if ((o.debt || 0) + amt > clubPrice(c) * .6) return toast('Banka daha fazla kredi vermiyor (kulüp değerinin %60\'ı sınır)'); o.debt = (o.debt || 0) + amt; o.bud += amt; L(`${clubName(o.n)} bankadan ${fm(amt)} kredi çekti (yıllık %7 faiz).`); toast(`+${fm(amt)} kredi`); sv(); draw(); }
function ownRepay() { const o = g.own; if (!o.debt) return toast('Borç yok'); const p = Math.min(o.debt, o.bud); if (p <= 0) return toast('Kasada para yok'); o.debt -= p; o.bud -= p; L(`${clubName(o.n)} ${fm(p)} borç ödedi.`); toast(`−${fm(p)} borç`); sv(); draw(); }
function ffpState(o) { const c = club(o.id), last = (o.fin || []).slice(0, 3).reduce((s, x) => s + x.net, 0), lim = -clubPrice(c) * .25; return { last, lim, ok: last >= lim, warn: last < lim * .6 }; }

/* ---------- Sahip masası (kararlar) ---------- */
const bestPl = o => [...(g.sq[o.id] || [])].sort((a, b) => valueOf(b.r, b.age) - valueOf(a.r, a.age))[0];
const OWN_EV = {
  bid: { if: o => !!bestPl(o), mk: o => { const p = bestPl(o), big = P(Object.values(g.w).flat(2).filter(c => c.s > club(o.id).s + 5)) || club(o.id); return { pid: p.id, pn: pname(p), fee: Math.round(valueOf(p.r, p.age) * cinfo(o.ct).e * (1.2 + Math.random() * .5)), from: big.id }; },
    t: (o, x) => `${cname(x.from)}, ${x.pn} için ${fm(x.fee)} teklif etti. Oyuncu gitmeye hevesli.`, c: ['Kabul et', 'Reddet', 'Daha fazlasını iste'],
    f: (o, x, i) => { const p = (g.sq[o.id] || []).find(q => q.id === x.pid); if (!p) return 'Oyuncu artık kulüpte değil.'; if (i === 0) { g.sq[o.id] = g.sq[o.id].filter(q => q.id !== p.id); o.bud += x.fee; o.fan = clr(o.fan - 4, 0, 100); recalcStr(o.id); return `${x.pn}, ${fm(x.fee)} karşılığında satıldı.`; } if (i === 1) { p.mor = clr((p.mor || 65) - 15, 0, 100); return `${x.pn} kalıyor ama morali bozuk.`; } if (Math.random() < .5) { const f2 = Math.round(x.fee * 1.18); g.sq[o.id] = g.sq[o.id].filter(q => q.id !== p.id); o.bud += f2; recalcStr(o.id); return `Pazarlık işe yaradı: ${x.pn}, ${fm(f2)} karşılığında satıldı.`; } return `${cname(x.from)} teklifini geri çekti.`; },
    def: (o, x, v) => v === 'tutumlu' ? 0 : v === 'iddiali' ? 1 : 2 },
  yatirimci: { if: o => (o.stake == null ? 1 : o.stake) > .55, mk: o => { const pct = P([.15, .2, .25]); return { pct, cash: Math.round(clubPrice(club(o.id)) * pct * (1.05 + Math.random() * .2)) }; },
    t: (o, x) => `Bir yatırım fonu kulübün %${Math.round(x.pct * 100)}'i için ${fm(x.cash)} ödemeye hazır. Para kulüp kasasına girer, satışta payın küçülür.`, c: ['Hisseyi sat', 'Reddet'],
    f: (o, x, i) => { if (i) return 'Yatırımcı teklifini geri çevirdin.'; o.stake = (o.stake == null ? 1 : o.stake) - x.pct; o.bud += x.cash; return `Kulübün %${Math.round(x.pct * 100)}'i satıldı; kasaya ${fm(x.cash)} girdi.`; }, def: (o, x, v) => v === 'iddiali' ? 0 : 1 },
  satinal: { if: o => o.yr >= 2 && Math.random() < .5, mk: o => ({ price: Math.round(clubPrice(club(o.id)) * (.92 + Math.random() * .38)) }),
    t: (o, x) => `Bir yatırımcı grubu kulübün tamamı için ${fm(x.price)} teklif ediyor.`, c: ['Kulübü sat', 'Satılık değil'],
    f: (o, x, i) => { if (i) return 'Kulüp satılık değil dedin.'; const share = Math.round(x.price * (o.stake == null ? 1 : o.stake) + o.bud - (o.debt || 0)); money(share, 'Kulüp satışı'); if (g.coach && g.coach.id === o.id) coachLeave('Kulübü sattı', 0); o.sold = 1; return `Kulübü sattın; eline ${fm(share)} geçti.`; }, def: () => 1 },
  tdbutce: { if: o => !!o.coachN && !(g.coach && g.coach.id === o.id), mk: o => ({ amt: ownCostO(o, R(40, 120)) }),
    t: (o, x) => `Teknik direktör ${o.coachN} kadroyu güçlendirmek için ${fm(x.amt)} ek bütçe istiyor.`, c: ['Bütçeyi ver', 'Reddet'],
    f: (o, x, i) => { if (i) { o.coachR = Math.max(50, o.coachR - 2); recalcStr(o.id); return 'Teknik direktör hayal kırıklığı yaşadı.'; } if (o.bud < x.amt) return 'Kasada yeterli para yoktu.'; o.bud -= x.amt; const M2 = market(o.id, o.mk + 3).filter(p => p.fee <= x.amt)[0]; if (M2 && buyPlayer(o.id, { ...M2, fee: 0 }, o)) { o.mk++; return `${pname(M2)} transfer edildi.`; } o.coachR = Math.min(95, o.coachR + 1); recalcStr(o.id); return 'Bütçe verildi; hoca memnun.'; }, def: (o, x, v) => v === 'tutumlu' ? 1 : 0 },
  taraftar: { if: o => o.fan < 60 || o.tick === 2, mk: () => ({}), t: o => `Taraftar grupları ${o.tick === 2 ? 'pahalı biletleri' : 'kötü gidişi'} protesto ediyor; tribünler boş kalabilir.`, c: ['Bilet fiyatını indir', 'Yıldız transferi sözü ver', 'Görmezden gel'],
    f: (o, x, i) => { if (i === 0) { o.tick = 0; o.fan = clr(o.fan + 7, 0, 100); return 'Biletler ucuzladı; taraftar memnun.'; } if (i === 1) { o.fan = clr(o.fan + 4, 0, 100); o.promise = g.season + 1; return 'Söz verdin; taraftar bekliyor.'; } o.fan = clr(o.fan - 7, 0, 100); return 'Protestolar büyüdü.'; }, def: (o, x, v) => v === 'tutumlu' ? 2 : 0 },
  belediye: { if: o => (o.stad || 0) <= 2 && !o.proj, mk: o => ({ cost: Math.round(FAC.stad.cost(o, o.stad || 0) * 1.3) }), t: (o, x) => `Belediye, yeni stadyum için şehir merkezinde arsa öneriyor. İnşaat ${fm(x.cost)}; stadyum iki seviye birden büyür.`, c: ['Projeyi başlat', 'Şimdi değil'],
    f: (o, x, i) => { if (i) return 'Arsa teklifini geri çevirdin.'; if (o.bud < x.cost) return 'Kasada yeterli para yoktu.'; o.bud -= x.cost; o.proj = { k: 'stad', to: Math.min(4, (o.stad || 0) + 2), y: g.season }; o.fan = clr(o.fan + 5, 0, 100); return 'Yeni stadyum inşaatı başladı!'; }, def: (o, x, v) => v === 'iddiali' || v === 'altyapi' ? 0 : 1 },
  cevher: { if: o => ((g.youth || {})[o.id] || []).length > 0, mk: o => { const y = [...g.youth[o.id]].sort((a, b) => b.pot - a.pot)[0]; return { yid: y.id, yn: y.n, pot: y.pot }; },
    t: (o, x) => `Altyapıdaki ${x.yn} (potansiyel ~${x.pot}) büyük kulüplerin radarında. Menajeri profesyonel sözleşme istiyor.`, c: ['A takıma al, sözleşme ver', 'Satış için pazarlık et', 'Bekle'],
    f: (o, x, i) => { const Y = (g.youth || {})[o.id] || [], y = Y.find(q => q.id === x.yid); if (!y) return 'Oyuncu artık altyapıda değil.'; if (i === 0) { promoteYouth(o.id, y.id); return `${x.yn} profesyonel oldu.`; } if (i === 1) { const fee = Math.round(valueOf(y.pot - 8, 17) * cinfo(o.ct).e * .5); g.youth[o.id] = Y.filter(q => q !== y); o.bud += fee; return `${x.yn}, ${fm(fee)} karşılığında satıldı.`; } if (Math.random() < .4) { g.youth[o.id] = Y.filter(q => q !== y); return `${x.yn} bedelsiz olarak başka kulübe gitti.`; } return `${x.yn} şimdilik kaldı.`; }, def: () => 0 },
  isim: { if: o => (o.stad || 0) >= 2 && !o.naming, mk: o => ({ n: P(BRANDS), v: ownCostO(o, R(30, 60) * (o.stad || 1)), y: R(3, 6) }), t: (o, x) => `${x.n}, stadyumun adı için ${x.y} yıl boyunca yılda ${fm(x.v)} ödemek istiyor.`, c: ['İmzala', 'Stadyumun adı tarihimizdir'],
    f: (o, x, i) => { if (i) { o.fan = clr(o.fan + 3, 0, 100); return 'Taraftar kararını alkışladı.'; } o.naming = { n: x.n, v: x.v, y: x.y }; o.fan = clr(o.fan - 3, 0, 100); return `Stadyumun yeni adı: ${x.n} Arena.`; }, def: (o, x, v) => v === 'tutumlu' || v === 'dengeli' ? 0 : 1 },
  kiralik: { if: o => club(o.id) && club(o.id).t >= 1, mk: o => { const big = P(Object.values(g.w).flat(2).filter(c => c.s >= club(o.id).s + 6)) || club(o.id), NP = NAMES[cinfo(clubCt(big.id)).lang] || NAMES.tr; return { from: big.id, n: P(NP.f) + ' ' + P(NP.l), r: club(o.id).s + R(0, 4), pos: P(['DF', 'MF', 'FW']) }; },
    t: (o, x) => `${cname(x.from)}, genç yeteneği ${x.n}'i (${POSN[x.pos]}, ${x.r}) bir sezonluğuna bedelsiz kiralamak istiyor.`, c: ['Kabul et', 'Kadroda yer yok'],
    f: (o, x, i) => { if (i) return 'Kiralık teklifini geri çevirdin.'; const L2 = ensureSquad(o.id), pl = { id: newPid(), n: x.n, real: 0, p: x.pos, r: x.r, age: R(19, 21), pot: x.r + R(5, 12), wage: 0, yrs: 1, num: 0, inj: 0, loanIn: 1 }; pl.num = freeNum(L2, pl.p); L2.push(pl); recalcStr(o.id); return `${x.n} kiralık olarak geldi.`; }, def: () => 0 },
};
function ownInbox(o, n) {
  o.inbox = o.inbox || []; if (o.inbox.length >= 4) return;
  const ks = Object.keys(OWN_EV).filter(k => OWN_EV[k].if(o) && !o.inbox.some(x => x.id === k)).sort(() => Math.random() - .5).slice(0, n);
  ks.forEach(k => { try { o.inbox.push({ id: k, x: OWN_EV[k].mk(o), y: g.season }); } catch (e) { } });
}
function ownAns(cid, idx, opt, auto) {
  const o = ownById(cid); if (!o || !o.inbox || !o.inbox[idx]) return; const it = o.inbox[idx], d = OWN_EV[it.id]; o.inbox.splice(idx, 1);
  let r = ''; const keep = g.own; g.own = o; try { r = d.f(o, it.x, opt) || ''; } catch (e) { console.error(e); } g.own = keep; if (!auto) ownNorm();
  const msg = `${clubName(o.n)} · ${r}`; L(msg); if (auto) ceoLog(o, `Masa: ${r}`); else { toast(r); sv(); draw(); }
}
/* satılan kulüpleri gruptan çıkar */
function ownNorm() { const L2 = allOwn(), sold = L2.filter(o => o.sold || !club(o.id)), keep = L2.filter(o => !sold.includes(o)); sold.forEach(o => { if (!(g.club && g.club.id === o.id) && !(g.coach && g.coach.id === o.id)) { if (g.sq) delete g.sq[o.id]; if (g.youth) delete g.youth[o.id]; } }); g.own = keep.includes(g.own) ? g.own : keep[0] || null; g.owns = keep.filter(o => o !== g.own); }
function inboxCount() { return allOwn().reduce((s, o) => s + (o.inbox || []).length, 0); }

/* ---------- Grup içi transfer ---------- */
function grpMove(pid, toId) {
  const o = g.own, t = ownById(toId); if (!t || t === o) return; if (!windowOpen() && g.phase !== 'retired') return toast('Transfer dönemi kapalı');
  const p = (g.sq[o.id] || []).find(x => x.id === pid); if (!p) return; const L2 = ensureSquad(t.id);
  g.sq[o.id] = g.sq[o.id].filter(x => x !== p); p.num = freeNum(L2, p.p); p.wage = wageOf(p.r, club(t.id).t, t.ct); L2.push(p); recalcStr(o.id); recalcStr(t.id); o.mv = null;
  L(`${pname(p)} grup içi transferle ${clubName(t.n)} kulübüne geçti.`); toast(`${pname(p)} → ${clubName(t.n)}`); sv(); draw();
}

/* ---------- Yıllık döngü: her kulüp için ---------- */
const _ownYear = ownYear;
ownYear = function (out) {
  const keep = g.own, list = allOwn();
  for (const o of list) {
    g.own = o; const c = club(o.id); if (!c) continue;
    /* stadyum projesi tamamlanır */
    if (o.proj && o.proj.k === 'stad' && o.proj.y < g.season + 1) { o.stad = o.proj.to; o.fan = clr(o.fan + 4, 0, 100); L(`${clubName(o.n)}: yeni stadyum açıldı — ${STAD[o.stad]}!`); news(`${clubName(o.n)} yeni stadyumunu açtı.`); o.projDone = 1; }
    const building = o.proj && !o.projDone; if (building) o.tick0 = 1;
    _ownYear(out); g.own = o;
    if (!club(o.id) || o.sold) continue;
    const e = cinfo(o.ct).e, t = c.t, stars = (g.sq[o.id] || []).filter(p => p.real).length;
    const merch = Math.round(clubRev(c) * .09 * Math.pow(o.fan / 70, 1.4) * (1 + stars * .05) * (1 + (o.shop || 0) * .18));
    const naming = o.naming ? o.naming.v : 0, ceoW = o.ceo ? o.ceo.w : 0, interest = Math.round((o.debt || 0) * .07), facC = Math.round(((o.train || 0) * 8 + (o.med || 0) * 6 + (o.scoutL || 0) * 5) * clubRev(c) / 1200);
    const constr = building ? -Math.round(clubRev(c) * .22 * .15) : 0;
    const extra = merch + naming - ceoW - interest - facC + constr; o.bud += extra; o.last = (o.last || 0) + extra;
    if (o.fin && o.fin[0]) { o.fin[0].merch = merch; o.fin[0].ex = naming - ceoW - interest - facC + constr; o.fin[0].net += extra; }
    if (o.naming) { o.naming.y--; if (o.naming.y <= 0) { L(`${clubName(o.n)}: stadyum isim hakkı sözleşmesi bitti.`); o.naming = null; } }
    if (o.debt) { const pay = Math.min(o.debt, Math.round(o.debt * .12)); if (o.bud > pay) { o.bud -= pay; o.debt -= pay; } }
    if (o.projDone) { o.proj = null; o.projDone = 0; }
    /* FFP */
    const F = ffpState(o); if (!F.ok) { if (o.ffpW) { o.ban = g.season; const fine = Math.round(clubPrice(c) * .04); o.bud -= fine; L(`${clubName(o.n)}: Finansal Fair Play ihlali! Bir sezon transfer yasağı ve ${fm(fine)} ceza.`); news(`${clubName(o.n)} FFP cezası aldı.`); o.ffpW = 0; } else { o.ffpW = 1; L(`${clubName(o.n)}: FFP uyarısı — zararı azaltmazsan transfer yasağı gelecek.`); } } else o.ffpW = 0;
    if (o.promise && o.promise <= g.season) { if (o.mk === (o.mk0 || 0)) { o.fan = clr(o.fan - 8, 0, 100); L(`${clubName(o.n)}: taraftara verdiğin transfer sözü tutulmadı.`); } o.promise = 0; } o.mk0 = o.mk;
    /* otomatik çözülmeyen kararlar: varsayılanla */
    (o.inbox || []).filter(it => it.y < g.season - 1).forEach(it => { const d = OWN_EV[it.id]; ownAns(o.id, o.inbox.indexOf(it), d ? d.def(o, it.x, o.vis || 'dengeli') : 1, 1); });
    ceoRun(o, 1);
    ownInbox(o, g.phase === 'retired' ? 2 : 1);
    if (out && o.ceo && o.auto && o.ceoLog && o.ceoLog[0]) out.lines.push(`${clubName(o.n)} genel müdürü: ${o.ceoLog.slice(0, 2).map(x => x.replace(/^\d+: /, '')).join(' ')}`);
  }
  g.own = keep; g.owns = list.filter(o => o !== keep); ownNorm();
};
/* antrenman merkezi: sahibi olduğun kulüplerde gelişim */
const _sqYear = sqYear; sqYear = function () { _sqYear(); allOwn().forEach(o => { (g.sq[o.id] || []).forEach(p => { if (p.age <= 27 && p.r < p.pot && Math.random() < (o.train || 0) * .14) p.r++; }); recalcStr(o.id); }); };
/* sezon içinde: transfer dönemlerinde otopilot, ara sıra masaya yeni dosya */
function ownWeek() { if (!allOwn().length) return; allOwn().forEach(o => { if ((g.week === 3 || g.week === 23) && o.ceo && o.auto) ceoRun(o, 0); if ([12, 30].includes(g.week) && Math.random() < .6) ownInbox(o, 1); }); }
const _weekStart = weekStart; weekStart = function (auto) { _weekStart(auto); if (g.phase === 'pro') ownWeek(); };
const _coachWeekStart2 = coachWeekStart; coachWeekStart = function (auto) { _coachWeekStart2(auto); if (g.phase === 'coach') { ownWeek(); const o = g.coach && ownById(g.coach.id); if (o && o.med) (g.sq[o.id] || []).forEach(p => { if (p.inj > 0 && Math.random() < o.med * .2) p.inj = Math.max(0, p.inj - 1); }); } };

/* ---------- Arayüz ---------- */
function ownUI() {
  const o = g.own; if (!o) return '<div class="card"><p class="m">Bir kulübün yok.</p></div>'; const c = club(o.id); if (!c) return '<div class="card"><p class="m">Kulüp bulunamadı.</p></div>';
  ensureSquad(o.id); const self = g.coach && g.coach.id === o.id, v = OV, ib = (o.inbox || []).length, A = allOwn();
  let h = '';
  if (A.length > 1) h += `<div class="card"><div class="eyebrow">Kulüp grubun · ${A.length} kulüp · toplam değer ${fm(A.reduce((s, x) => s + x.price * (x.stake == null ? 1 : x.stake), 0))}</div><div class="grp">${A.map(x => { const k = club(x.id); return k ? `<button class="grpc ${x === o ? 'on' : ''}" style="--c1:${k.c1};--c2:${k.c2}" onclick="switchOwn(${x.id})">${clubKit(x.id)}<b>${esc(clubName(k.n))}</b><span>${esc(tierName(x.ct, k.t))} · güç ${k.s}</span><span>kasa ${fmShort(x.bud)}${(x.inbox || []).length ? ` · 📥${x.inbox.length}` : ''}${x.ceo && x.auto ? ' · 🤖' : ''}</span></button>` : ''; }).join('')}</div></div>`;
  h += `<div class="card clubc" style="--c1:${c.c1};--c2:${c.c2}"><div class="eyebrow">Kulübün · ${o.yr} yıldır sahibisin${(o.stake == null ? 1 : o.stake) < 1 ? ` · payın %${Math.round(o.stake * 100)}` : ''}</div><h2>${esc(clubName(c.n))}</h2><div class="m">${esc(tierName(o.ct, c.t))} · ${esc(o.ct)} · güç ${c.s}${g.prev && g.prev[o.id] ? ` · geçen sezon ${g.prev[o.id]}.` : ''} · T.D.: ${self ? 'Sen' : o.coachN ? esc(o.coachN) + ' (' + o.coachR + ')' : 'yok'}${o.ceo ? ` · GM: ${esc(o.ceo.n)}${o.auto ? ' (otopilot)' : ''}` : ''}</div>
  <div class="kvs"><div class="kv"><span>Kulüp kasası</span><b>${fm(self ? g.coach.bud : o.bud)}</b></div><div class="kv"><span>Geçen yıl</span><b class="${(o.last || 0) < 0 ? 'neg' : 'pos'}">${o.last == null ? '—' : (o.last >= 0 ? '+' : '') + fm(o.last)}</b></div><div class="kv"><span>Değer</span><b>${fm(o.price)}</b></div><div class="kv"><span>Borç</span><b class="${o.debt ? 'neg' : ''}">${o.debt ? fm(o.debt) : '—'}</b></div></div><div class="prow"><span>Taraftar</span>${bar(o.fan, 100)}<b>${o.fan}</b></div>${o.ban && o.ban >= g.season ? '<div class="warn">FFP cezası: bu sezon transfer yasağı var.</div>' : o.ffpW ? '<div class="warn">FFP uyarısı: zarar sınırı aşıldı.</div>' : ''}</div>`;
  h += `<div class="segs">${seg('OV', 'ozet', 'Özet', v)}${seg('OV', 'masa', ib ? `Masa (${ib})` : 'Masa', v)}${seg('OV', 'gm', 'Yönetim', v)}${seg('OV', 'kadro', 'Kadro', v)}${seg('OV', 'td', 'T. Direktör', v)}${seg('OV', 'tr', 'Transfer', v)}${seg('OV', 'alt', 'Altyapı', v)}${seg('OV', 'tes', 'Tesisler', v)}${seg('OV', 'tic', 'Ticari', v)}${seg('OV', 'fin', 'Finans', v)}</div>`;
  if (self && ['kadro', 'tr', 'alt'].includes(v)) { h += `<div class="card"><p class="m">Takımı sen çalıştırıyorsun; kadro, transfer ve altyapı T. Direktör sekmesinde.</p><button class="btn" onclick="CV2='${v === 'tr' ? 'tr' : v === 'alt' ? 'alt' : 'kadro'}';setTab('coach')">T. Direktör sekmesine git</button></div>`; return h; }
  if (v === 'ozet') {
    h += `<div class="card"><div class="eyebrow">Durum</div>${ib ? `<div class="m">📥 Masanda ${ib} karar bekliyor.</div>` : ''}${o.proj ? `<div class="m">🏗 Stadyum inşaatı sürüyor → ${STAD[o.proj.to]}</div>` : ''}<div class="kvs"><div class="kv"><span>Stadyum</span><b>${STAD[o.stad || 0]}</b></div><div class="kv"><span>Altyapı</span><b>${o.acad}/5</b></div><div class="kv"><span>Antrenman merkezi</span><b>${o.train || 0}/4</b></div><div class="kv"><span>Forma sponsoru</span><b>${o.sp ? esc(o.sp.n) : '—'}</b></div></div></div>`;
    if (o.fin && o.fin[0]) { const x = o.fin[0]; h += `<div class="card"><div class="eyebrow">Geçen yılın bilançosu</div><div class="kvs"><div class="kv"><span>TV + ödül</span><b class="pos">+${fm(x.tv + x.prize)}</b></div><div class="kv"><span>Bilet</span><b class="pos">+${fm(x.tick)}</b></div><div class="kv"><span>Sponsor</span><b class="pos">+${fm(x.spn)}</b></div><div class="kv"><span>Ürün satışı</span><b class="pos">+${fm(x.merch || 0)}</b></div><div class="kv"><span>Maaşlar</span><b class="neg">−${fm(x.wages + x.coach)}</b></div><div class="kv"><span>Diğer</span><b class="${(x.ex || 0) - x.other < 0 ? 'neg' : 'pos'}">${fm((x.ex || 0) - x.other)}</b></div></div><div class="kv"><span>Net</span><b class="${x.net < 0 ? 'neg' : 'pos'}">${x.net >= 0 ? '+' : ''}${fm(x.net)}</b></div></div>`; }
    if (allOwn().length < MAXCLUBS) h += `<div class="card"><p class="m">En fazla ${MAXCLUBS} kulüplük bir grup kurabilirsin. Yeni kulüpleri Finans → Kulüp al ekranından satın alırsın; kulüpler arasında oyuncu gönderebilir, her birine ayrı genel müdür atayabilirsin.</p><button class="btn ghost" onclick="FINV='kulup';setTab('fin')">Kulüp al</button></div>`;
  }
  if (v === 'masa') {
    const IB = o.inbox || [];
    h += IB.length ? IB.map((it, i) => { const d = OWN_EV[it.id]; if (!d) return ''; return `<div class="card q"><div class="eyebrow gold">Sahip masası · ${it.y}</div><p class="lead">${esc(d.t(o, it.x))}</p><div class="opts">${d.c.map((l, j) => `<button class="opt sm" onclick="ownAns(${o.id},${i},${j})"><b>${esc(l)}</b></button>`).join('')}</div></div>`; }).join('') : '<div class="card"><p class="m">Masanda bekleyen karar yok. Teklifler, yatırımcılar ve taraftar talepleri burada birikir; cevap vermezsen yıl sonunda genel müdür (ya da varsayılan) karar verir.</p></div>';
  }
  if (v === 'gm') {
    h += `<div class="card"><div class="eyebrow">Genel müdür ve otopilot</div>${o.ceo ? `<div class="kv"><span>${esc(o.ceo.n)} · ${esc(o.ceo.bg)}</span><b>kalite ${o.ceo.r} · ${fm(o.ceo.w)}/yıl</b></div><div class="actions"><button class="btn ${o.auto ? '' : 'ghost'}" onclick="ceoAuto()">${o.auto ? '🤖 Otopilot açık' : 'Otopilotu aç'}</button><button class="btn ghost danger" onclick="ceoFire()">Görevden al</button></div>` : '<p class="m">Genel müdür tutarsan otopilotu açabilirsin: bilet, sponsor, sözleşmeler, transferler, teknik direktör ve tesis yatırımlarını senin vizyonuna göre o yönetir. Sen istediğin an araya girersin.</p>'}
    <div class="eyebrow">Kulüp vizyonu</div><div class="opts">${Object.entries(VIS).map(([k, x]) => `<button class="opt sm ${(o.vis || 'dengeli') === k ? 'on' : ''}" onclick="setVis('${k}')"><b>${x.n}</b><span>${x.d}</span></button>`).join('')}</div></div>`;
    if (!o.ceo) h += `<div class="card"><div class="eyebrow">Adaylar</div>${ceoCands(o).map((x, i) => `<div class="asset"><div><b>${esc(x.n)}</b><span class="m">${esc(x.bg)} · kalite ${x.r}</span></div><b>${fm(x.w)}/yıl</b><div class="actions tight"><button class="chip" onclick="ceoHire(${i})">İşe al</button></div></div>`).join('')}<div class="m">Kaliteli genel müdür daha iyi sponsor ve transfer bulur.</div></div>`;
    if ((o.ceoLog || []).length) h += `<div class="card"><div class="eyebrow">Genel müdür raporu</div>${o.ceoLog.map(x => `<div class="m">• ${esc(x)}</div>`).join('')}</div>`;
  }
  if (v === 'kadro') { const others = A.filter(x => x !== o); h += `<div class="card"><div class="eyebrow">Diziliş</div>${formChips(o.form || '4-4-2', 'ownSetForm')}</div><div class="card"><div class="eyebrow">Kadro · ${(g.sq[o.id] || []).length} oyuncu</div>${sqTable(o.id, 'own')}</div>`;
    if (others.length) h += `<div class="card"><div class="eyebrow">Grup içi transfer</div><p class="m">Bir oyuncuyu grubundaki başka kulübe bedelsiz gönder (transfer döneminde ya da emekliyken).</p><select id="gmv">${(g.sq[o.id] || []).map(p => `<option value="${p.id}">${p.p} ${esc(pname(p))} (${p.r}, ${p.age})</option>`).join('')}</select><div class="chips">${others.map(x => `<button class="chip" onclick="grpMove(+document.getElementById('gmv').value,${x.id})">→ ${esc(clubName(x.n))}</button>`).join('')}</div></div>`; }
  if (v === 'td') {
    h += `<div class="card"><div class="eyebrow">Teknik direktör</div>${self ? '<p class="lead">Takımı sen çalıştırıyorsun.</p>' : o.coachN ? `<div class="kv"><span>${esc(o.coachN)}</span><b>kalite ${o.coachR} · ${fm(o.coachW)}/yıl</b></div>` : '<p class="m">Teknik direktörün yok; takım zorlanır.</p>'}
    ${!self && g.phase === 'retired' && !g.coach ? `<button class="btn" onclick="ownSelfCoach()">Takımı kendim çalıştırayım</button>` : ''}${!self && g.phase !== 'retired' && !g.coach ? '<div class="m">Futbolu bıraktığında takımı kendin çalıştırabilirsin.</div>' : ''}</div>`;
    if (!self) h += `<div class="card"><div class="eyebrow">Adaylar</div>${ownCoachCands().map((x, i) => `<div class="asset"><div><b>${esc(x.n)}</b><span class="m">${x.age} yaş · ${x.st} · kalite ${x.r}</span></div><b>${fm(x.w)}/yıl</b><div class="actions tight"><button class="chip" onclick="ownHire(${i})">Göreve getir</button></div></div>`).join('')}<div class="m">Kaliteli teknik direktör takım gücünü artırır. Mevcut hocayı gönderirsen yarım yıllık tazminat ödenir.</div></div>`;
  }
  if (v === 'tr') h += (o.ban && o.ban >= g.season ? '<div class="card"><div class="warn">FFP cezası: bu sezon oyuncu alamazsın.</div></div>' : `<div class="card"><div class="eyebrow">Transfer pazarı${o.scoutL ? ` · gözlem ağı ${o.scoutL}` : ''}</div>${marketList(o.id, o.mk + (o.scoutL || 0) * 11, 'ownMarketBuy', o.bud)}</div>`);
  if (v === 'alt') h += `<div class="card"><div class="eyebrow">Altyapı · seviye ${o.acad}/5</div><button class="btn ghost" onclick="facUp('acad')">${o.acad >= 5 ? 'En üst seviye' : 'Altyapıyı geliştir · ' + fm(FAC.acad.cost(o, o.acad))}</button><div class="m">${FAC.acad.d}</div></div><div class="card"><div class="eyebrow">Bu yılın adayları</div>${youthList(o.id, 'ownPromote')}</div>`;
  if (v === 'tes') h += `<div class="card"><div class="eyebrow">Tesisler · kasa ${fm(o.bud)}</div>${['stad', 'train', 'med', 'scoutL', 'shop', 'acad'].map(k => { const f = FAC[k], lv = facLv(o, k), mx = lv >= f.max; return `<div class="asset"><div><b>${f.n} · ${k === 'stad' ? STAD[lv] : lv + '/' + f.max}</b><span class="m">${f.d}</span></div><button class="chip ${mx ? 'dis' : ''}" onclick="facUp('${k}')">${mx ? 'En üst' : k === 'stad' && o.proj ? 'İnşaatta' : fm(f.cost(o, lv))}</button></div>`; }).join('')}<div class="m">Tesislerin yıllık bakım gideri vardır; büyük yatırımlar kasayı zorlar.</div></div>`;
  if (v === 'tic') {
    h += `<div class="card"><div class="eyebrow">Bilet fiyatı</div><div class="chips">${['Düşük', 'Normal', 'Yüksek'].map((n, i) => `<button class="chip ${o.tick === i ? 'on' : ''}" onclick="ownTick(${i})">${n}</button>`).join('')}</div><div class="m">Pahalı bilet gelir getirir ama taraftarı küstürür.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Forma sponsoru</div>${o.sp ? `<div class="kv"><span>${esc(o.sp.n)} · ${o.sp.y} yıl</span><b>${fm(o.sp.v)}/yıl</b></div>` : (o.spOf || (o.spOf = ownSponsorOffers())).map((s, i) => `<div class="asset"><div><b>${esc(s.n)}</b><span class="m">${s.y} yıl${s.fan ? ' · taraftar tepki gösterir' : ''}</span></div><b>${fm(s.v)}/yıl</b><div class="actions tight"><button class="chip" onclick="ownSponsor(${i})">İmzala</button></div></div>`).join('')}</div>`;
    h += `<div class="card"><div class="eyebrow">Stadyum isim hakkı</div>${o.naming ? `<div class="kv"><span>${esc(o.naming.n)} Arena · ${o.naming.y} yıl</span><b>${fm(o.naming.v)}/yıl</b></div>` : '<p class="m">Stadyumun büyüdükçe markalar isim hakkı için teklif getirir (Masa).</p>'}</div>`;
    h += `<div class="card"><div class="eyebrow">Ürün satışı</div><p class="m">Forma ve ürün satışı taraftar sayısına, ligine, kadrodaki yıldızlara ve mağaza seviyene bağlıdır. Geçen yıl: ${fm((o.fin && o.fin[0] && o.fin[0].merch) || 0)}.</p></div>`;
  }
  if (v === 'fin') {
    const F = ffpState(o);
    h += `<div class="card"><div class="eyebrow">Kasa</div><div class="chips">${[.1, .25, .5].map(p => `<button class="chip" onclick="ownDeposit(g.money*${p})">Nakdinin %${p * 100}'ini aktar</button>`).join('')}<button class="chip" onclick="ownWithdraw(${self ? 'g.coach.bud' : 'g.own.bud'}*.25)">Kasadan %25 çek</button></div><div class="m">Kasaya aktardığın para transfer, altyapı ve stadyum için kullanılır.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Banka</div><div class="kv"><span>Borç</span><b class="${o.debt ? 'neg' : ''}">${fm(o.debt || 0)}</b></div><div class="chips"><button class="chip" onclick="ownLoan(.1)">Kredi: değerin %10'u</button><button class="chip" onclick="ownLoan(.25)">Kredi: değerin %25'i</button><button class="chip" onclick="ownRepay()">Borç öde</button></div><div class="m">Yıllık %7 faiz; her yıl borcun %12'si kasadan ödenir.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Finansal Fair Play</div><div class="kv"><span>Son 3 yıl net sonuç</span><b class="${F.last < 0 ? 'neg' : 'pos'}">${fm(F.last)}</b></div><div class="kv"><span>İzin verilen zarar</span><b>${fm(F.lim)}</b></div><div class="m">${F.ok ? (F.warn ? '⚠ Sınıra yaklaşıyorsun.' : '✔ Kurallara uygunsun.') : '✘ Sınır aşıldı: bir yıl daha aşarsan transfer yasağı ve para cezası.'} Kendi cebinden aktardığın para bu hesaba girmez.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Yıllık bilanço</div>${o.fin && o.fin.length ? `<div class="tw"><table class="tbl"><tr><th>Yıl</th><th>Sıra</th><th>TV+ödül</th><th>Bilet</th><th>Sponsor</th><th>Ürün</th><th>Maaş</th><th>Net</th></tr>${o.fin.map(x => `<tr><td>${x.y}</td><td>${x.pos || '—'}</td><td>${fmShort(x.tv + x.prize)}</td><td>${fmShort(x.tick)}</td><td>${fmShort(x.spn)}</td><td>${fmShort(x.merch || 0)}</td><td class="neg">${fmShort(x.wages + x.coach)}</td><td class="${x.net < 0 ? 'neg' : 'pos'}">${fmShort(x.net)}</td></tr>`).join('')}</table></div>` : '<p class="m">İlk sezon sonunda bilanço burada.</p>'}<div class="m">Oyuncu maaşları ${fm(wageBill(o.id))}/yıl.</div></div>`;
    h += `<div class="card"><button class="btn ghost danger" onclick="sellClub()">Kulübü sat (${fm(Math.round(clubPrice(c) * (o.stake == null ? 1 : o.stake)))})</button></div>`;
  }
  return h;
}
ownAcad = function () { facUp('acad'); sv(); draw(); }; ownStad = function () { facUp('stad'); sv(); draw(); };

/* ---------- Satılık kulüpler: servete göre merdiven (v2.4) ----------
   En üstte bütün yatırımlarını, mülklerini ve şirketlerini satarsan alabileceğin
   en pahalı kulüp; aşağı doğru servetinin ~%95, %88 … %2,5'i kadar 15 kulüp. */
const liquidW = () => Math.max(0, g.money) + portVal() + propVal() + Math.round(bizVal() * .95);
const BUY_LAD = [.99, .95, .89, .82, .74, .66, .58, .5, .42, .34, .27, .2, .13, .07, .025];
buyList = function () {
  const top = liquidW(), all = [];
  for (const ct in g.w) for (const X of g.w[ct]) for (const c of X) { if (ownById(c.id)) continue; const p = clubPrice(c); if (p <= top) all.push({ id: c.id, ct, n: c.n, t: c.t, s: c.s, p }); }
  all.sort((a, b) => b.p - a.p); const out = [], used = new Set();
  for (const f of BUY_LAD) { const c = all.find(x => !used.has(x.id) && x.p <= top * f); if (c) { used.add(c.id); out.push(c); } }
  return out.sort((a, b) => b.p - a.p);
};
/* nakit yetmezse: önce yatırımlar, sonra mülkler, en son şirketler satılır */
function liquidate(need) {
  let got = 0;
  for (const a of ASSETS) { if (got >= need) break; const v = Math.round(g.fin[a.k] || 0); if (v > 0) { money(v, `Bozdurma: ${a.n}`); g.fin[a.k] = 0; got += v; } }
  g.fin.props.sort((a, b) => a.v - b.v);
  while (got < need && g.fin.props.length) { const p = g.fin.props.pop(); money(p.v, `Mülk satışı: ${p.n}`); got += p.v; }
  while (got < need && g.fin.biz.length) { const b = g.fin.biz.pop(), v = Math.round(b.v * .95); money(v, `Şirket satışı: ${b.n}`); got += v; }
  L(`Kulüp alımı için varlıklar nakde çevrildi: ${fm(got)}.`); return got;
}
const _buyClub2 = buyClub;
buyClub = function (id) {
  const x = buyList().find(c => c.id === id); if (!x) return;
  if (g.money >= x.p) return _buyClub2(id);
  if (allOwn().length >= MAXCLUBS) return toast(`En fazla ${MAXCLUBS} kulüp sahibi olabilirsin`);
  if (liquidW() < x.p) return toast(`Bütün varlıkların bile yetmiyor: ${fm(x.p)} gerekli`);
  ask(`Nakit ${fm(g.money)}, kulüp ${fm(x.p)}. Eksik ${fm(x.p - g.money)} için yatırımların, mülklerin ve gerekirse şirketlerin satılsın mı?`, () => { liquidate(x.p - g.money); _buyClub2(id); }, 'Sat ve devam et');
};

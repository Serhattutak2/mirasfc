/* ============================================================
   MİRAS FC — FİNANS (v2)
   Ev (kira ya da mülk), araç, faturalar, çocuk okulu, personel,
   kalem kalem giderler; portföy, emlak, şirketler, sponsorlar, borç.
   Her buton ya işi yapar ya da NEDEN yapamadığını söyler (toast).
   ============================================================ */
const ASSETS = [
  { k: 'dep', n: 'Vadeli mevduat', m: .022, v: .005, d: 'Düşük getiri, risksiz' },
  { k: 'fund', n: 'Yatırım fonu', m: .045, v: .09, d: 'Orta risk, dengeli' },
  { k: 'stock', n: 'Hisse senetleri', m: .062, v: .2, d: 'Yüksek getiri, dalgalı' },
  { k: 'crypto', n: 'Kripto para', m: .07, v: .6, d: 'Çok riskli' },
];
const PROPS = [
  { n: 'Daire', c: 180, y: .045, gr: .04 }, { n: 'Rezidans katı', c: 650, y: .04, gr: .045 }, { n: 'Villa', c: 1600, y: .03, gr: .05 },
  { n: 'Ofis katı', c: 950, y: .065, gr: .03 }, { n: 'Arsa', c: 420, y: 0, gr: .08 }, { n: 'Butik otel', c: 4200, y: .08, gr: .035 },
];
const BIZ = [
  { n: 'Restoran zinciri', c: 300, m: .05, v: .14, s: 'Gıda' },
  { n: 'Spor giyim markası', c: 800, m: .07, v: .26, s: 'Spor' },
  { n: 'İnşaat şirketi', c: 1500, m: .05, v: .12, s: 'Yapı' },
  { n: 'Teknoloji girişimi', c: 500, m: .12, v: .55, s: 'Teknoloji' },
  { n: 'Futbol akademisi', c: 400, m: .02, v: .08, s: 'Futbol Akademisi' },
  { n: 'Medya ajansı', c: 250, m: .06, v: .2, s: 'Medya' },
  { n: 'Kafe ve spor barı', c: 120, m: .06, v: .18, s: 'Kafe' },
];
/* Evler: kira (yıllık) ya da satın alma; bakım/aidat yıllık */
const HOMES = [
  { n: 'Ailenin evi', rent: 0, buy: 0, up: 0, hap: 0, d: 'Annenle babanla yaşıyorsun.' },
  { n: 'Kiralık stüdyo daire', rent: 8, buy: 0, up: 0, hap: 0, d: 'Küçük ama senin.' },
  { n: 'Kiralık daire', rent: 18, buy: 0, up: 0, hap: 2, d: 'İki oda, balkon.' },
  { n: 'Kiralık rezidans', rent: 55, buy: 0, up: 0, hap: 4, d: 'Kapıcı, spor salonu, havuz.' },
  { n: 'Kiralık villa', rent: 160, buy: 0, up: 0, hap: 7, d: 'Bahçeli, deniz manzaralı.' },
  { n: 'Kendi dairen', rent: 0, buy: 200, up: 3, hap: 4, d: 'Kira derdi bitti.' },
  { n: 'Müstakil ev', rent: 0, buy: 600, up: 9, hap: 7, d: 'Bahçede çocuklar top oynar.' },
  { n: 'Villa', rent: 0, buy: 1800, up: 30, hap: 10, d: 'Havuzlu, güvenlikli.' },
  { n: 'Malikâne', rent: 0, buy: 6000, up: 90, hap: 14, d: 'Efsanelere yakışır.' },
];
const CARS = [{ n: 'Toplu taşıma', c: 0, up: 1 }, { n: 'İkinci el otomobil', c: 15, up: 3 }, { n: 'Orta sınıf otomobil', c: 40, up: 5 }, { n: 'Lüks otomobil', c: 180, up: 14 }, { n: 'Süper otomobil', c: 600, up: 40 }];
const STAFF = [
  { k: 'trainer', n: 'Kişisel antrenör', c: 40, d: 'Antrenman gelişimi +%15' },
  { k: 'asci', n: 'Özel aşçı / diyetisyen', c: 25, d: 'Kondisyon toparlanması +, sağlık +' },
  { k: 'psik', n: 'Spor psikoloğu', c: 20, d: 'Moral düşüşleri yumuşar' },
  { k: 'avukat', n: 'Avukat ve mali müşavir', c: 30, d: 'Vergi %3 azalır, dava riskine karşı koruma' },
  { k: 'guvenlik', n: 'Güvenlik ve şoför', c: 35, d: 'Ün +, kaza riski azalır', if: () => g.rep >= 40 },
];
const sur = () => g.name.trim().split(' ').slice(-1)[0];
const portVal = () => ASSETS.reduce((s, a) => s + (g.fin[a.k] || 0), 0);
const propVal = () => g.fin.props.reduce((s, p) => s + p.v, 0);
const bizVal = () => g.fin.biz.reduce((s, b) => s + b.v, 0);
const ownVal = () => allOwn().reduce((s, o) => s + o.price * (o.stake == null ? 1 : o.stake) - (o.debt || 0) * .5, 0);
const homeVal = () => HOMES[g.fin.house] ? HOMES[g.fin.house].buy * cinfo(g.ct).e * .85 : 0;
const wealth = () => g.money + portVal() + propVal() + bizVal() + ownVal() + homeVal() + CARS[g.fin.car].c * .4;
const hasStaff = k => g.staffP && g.staffP[k];

/* ---------- Giderler: kalem kalem ---------- */
function expenses() {
  const e = cinfo((g.club && g.club.ct) || g.ct).e, H = HOMES[g.fin.house] || HOMES[0], C = CARS[g.fin.car] || CARS[0], F = g.fam, it = [];
  const clubHouse = g.con && g.con.house && g.fin.house <= 4 && g.fin.house > 0;
  const rent = clubHouse ? 0 : Math.round(H.rent * e);
  if (H.rent) it.push([clubHouse ? 'Kira (kulüp ödüyor)' : 'Kira', rent]);
  if (H.up) it.push(['Ev bakımı ve aidat', Math.round(H.up * e)]);
  const people = 1 + (F.partner ? 1 : 0) + F.kids.filter(k => k.age < 22).length;
  /* gelir arttıkça yaşam standardı da yükselir (çevre, davetler, alışveriş) */
  const inc = (g.con ? g.con.sal : 0) + (g.coach ? g.coach.sal : 0) + (g.job ? JOBLIST[g.job.k].pay * 30 : 0);
  if (inc > 0) it.push(['Sosyal yaşam, alışveriş, tatil', Math.round(inc * [.04, .09, .18][g.lux == null ? 1 : g.lux])]);
  if (F.kids.length && aliveParent().length && g.age > 30) it.push(['Aileye ve akrabalara yardımlar', Math.round(inc * .02)]);
  it.push(['Mutfak ve günlük yaşam', Math.round((g.fin.house === 0 ? 2 : 5 + people * 3) * e * (1 + (g.lux || 0) * .5))]);
  it.push(['Faturalar (elektrik, su, internet)', Math.round((g.fin.house === 0 ? 0 : 1.5 + g.fin.house * .9) * e)]);
  if (g.fin.car) it.push([g.con && g.con.car ? 'Araç yakıtı (araç kulüpten)' : 'Araç sigorta ve yakıt', Math.round(C.up * e * (g.con && g.con.car ? .3 : 1))]);
  const school = F.kids.filter(k => k.age >= 4 && k.age <= 18).length; if (school) it.push([`Çocukların okulu (${school})`, Math.round(school * (g.fin.house >= 6 ? 18 : 6) * e)]);
  if (F.kids.some(k => k.acad)) it.push(['Çocukların futbol okulu', Math.round(F.kids.filter(k => k.acad).length * 4 * e)]);
  STAFF.forEach(s => { if (hasStaff(s.k)) it.push([s.n, Math.round(s.c * e)]); });
  if (g.trainer && !hasStaff('trainer')) it.push(['Kişisel antrenör', Math.round(40 * e)]);
  if (g.parentSupport) it.push(['Aileye aylık destek', Math.round(g.parentSupport * e)]);
  if (g.money < 0) it.push(['Borç faizi', Math.round(-g.money * .12)]);
  const total = it.reduce((s, x) => s + x[1], 0);
  return { total, rent, items: it };
}

/* ---------- Yaşam standardı ---------- */
function setHouse(i) {
  const H = HOMES[i], cur = HOMES[g.fin.house], e = cinfo(g.ct).e; if (!H || i === g.fin.house) return;
  if (i === 0 && !aliveParent().length) return toast('Ailenin evi artık yok');
  const sellBack = cur.buy ? Math.round(cur.buy * e * .85) : 0, cost = H.buy ? Math.round(H.buy * e) : 0;
  if (cost && g.money + sellBack < cost) return toast(`Paran yetmiyor: ${fm(cost)} gerekli (eski evin ${fm(sellBack)} eder, nakit ${fm(g.money)})`);
  money(sellBack - cost, `Ev: ${H.n}`); g.fin.house = i; g.hap = clr(g.hap + H.hap - cur.hap + 2, 0, 100); g.rep = cl(g.rep + (H.hap - cur.hap) * .2, 0, 100);
  L(`Taşındın: ${H.n}.${cost ? ` ${fm(cost)} ödedin.` : ''}${sellBack ? ` Eski evini ${fm(sellBack)} karşılığında sattın.` : ''}${H.rent ? ` Yıllık kira ${fm(Math.round(H.rent * e))}.` : ''}`);
  toast(`Yeni evin: ${H.n}`); sv(); draw();
}
function setCar(i) {
  const C = CARS[i], cur = CARS[g.fin.car], e = cinfo(g.ct).e; if (!C || i === g.fin.car) return;
  const back = Math.round(cur.c * e * .4), cost = Math.round(C.c * e);
  if (g.money + back < cost) return toast(`Paran yetmiyor: ${fm(cost)} gerekli`);
  money(back - cost, `Araç: ${C.n}`); g.fin.car = i; g.hap = clr(g.hap + (i > g.fin.car ? 2 : 0), 0, 100); L(`Yeni aracın: ${C.n}.`); toast(C.n); sv(); draw();
}
function toggleStaff(k) {
  const s = STAFF.find(x => x.k === k); if (!s) return; g.staffP = g.staffP || {};
  if (s.if && !s.if() && !g.staffP[k]) return toast('Bunun için ünün yetersiz');
  if (!g.staffP[k]) { const fee = Math.round(s.c * cinfo(g.ct).e * .25); if (g.money < fee) return toast(`İşe alım için ${fm(fee)} gerekli`); money(-fee, s.n + ' işe alım'); }
  g.staffP[k] = g.staffP[k] ? 0 : 1; if (k === 'trainer') g.trainer = g.staffP[k];
  toast(g.staffP[k] ? `${s.n}: −${fm(Math.round(s.c * cinfo(g.ct).e * .25))} şimdi, yılda ${fm(Math.round(s.c * cinfo(g.ct).e))}` : `${s.n} bırakıldı`);
  L(g.staffP[k] ? `${s.n} tuttun (yılda ${fm(Math.round(s.c * cinfo(g.ct).e))}).` : `${s.n} ile yollarınızı ayırdın.`); sv(); draw();
}
function setLux(v) { g.lux = v; toast(['Tutumlu yaşam', 'Normal yaşam', 'Lüks yaşam'][v]); g.hap = clr(g.hap + (v - 1) * 2, 0, 100); sv(); draw(); }
function setParentSupport(v) { g.parentSupport = v; if (v) { aliveParent().forEach(p => relAdj(p, 6)); L(`Ailene yılda ${fm(v * cinfo(g.ct).e)} destek vermeye başladın.`); } sv(); draw(); }
function hireTrainer(on) { toggleStaff('trainer'); }

/* ---------- Yatırım ---------- */
function invest(k, amt) { amt = Math.min(Math.round(amt), Math.max(0, Math.floor(g.money))); if (amt < 1) return toast('Yatıracak nakit yok'); money(-amt, `Yatırım: ${ASSETS.find(a => a.k === k).n}`); g.fin[k] += amt; L(`${ASSETS.find(a => a.k === k).n}: ${fm(amt)} yatırdın.`); toast(`${fm(amt)} yatırıldı`); sv(); draw(); }
function divest(k) { const v = Math.round(g.fin[k]); if (v < 1) return toast('Bu kalemde para yok'); money(v, `Bozdurma: ${ASSETS.find(a => a.k === k).n}`); g.fin[k] = 0; L(`${ASSETS.find(a => a.k === k).n} bozduruldu: ${fm(v)}.`); toast(`${fm(v)} nakde döndü`); sv(); draw(); }
function buyProp(i) { const p = PROPS[i], c = Math.round(p.c * cinfo(g.ct).e); if (g.money < c) return toast(`Paran yetmiyor: ${fm(c)} gerekli`); money(-c, `Mülk alımı: ${p.n}`); g.fin.props.push({ i, n: p.n, v: c, b: c }); L(`${p.n} satın aldın (${fm(c)}).`); toast(`${p.n} senin`); sv(); draw(); }
function sellProp(j) { const p = g.fin.props[j]; if (!p) return; ask(`${p.n}, ${fm(p.v)} karşılığında satılsın mı?`, () => { money(p.v, `Mülk satışı: ${p.n}`); g.fin.props.splice(g.fin.props.indexOf(p), 1); L(`${p.n} satıldı.`); sv(); draw(); }); }
function addBiz(i, cost, how) { const b = BIZ[i]; g.fin.biz.push({ i, n: sur() + ' ' + b.s, v: cost, inv: cost, lvl: 1, last: 0, mk: 0 }); L(`${how || 'Şirket kurdun'}: ${sur()} ${b.s}.`); }
function newBiz(i) {
  const b = BIZ[i], c = Math.round(b.c * cinfo(g.ct).e);
  if (g.fin.biz.some(x => x.i === i)) return toast('Bu sektörde zaten şirketin var');
  if (g.fin.biz.length >= 5) return toast('En fazla 5 şirket yönetebilirsin');
  if (g.money < c) return toast(`Paran yetmiyor: ${fm(c)} gerekli, nakit ${fm(g.money)}`);
  money(-c, `Şirket kuruldu: ${b.n}`); addBiz(i, c); toast(`${sur()} ${b.s} kuruldu`); sv(); draw();
}
const bizUpCost = b => Math.round(BIZ[b.i].c * cinfo(g.ct).e * .6 * b.lvl);
function bizUp(j) {
  const b = g.fin.biz[j]; if (!b) return; const c = bizUpCost(b);
  if (b.lvl >= 5) return toast('Şirket en üst seviyede');
  if (g.money < c) return toast(`Büyütmek için ${fm(c)} gerekli, nakit ${fm(g.money)}`);
  money(-c, `Şirket büyütme: ${b.n}`); b.lvl++; b.v += c; b.inv += c; L(`${b.n} büyüdü: seviye ${b.lvl}.`); toast(`${b.n} → seviye ${b.lvl}`); sv(); draw();
}
const bizMkCost = b => Math.round(b.v * .08 + 10);
function bizMk(j) { const b = g.fin.biz[j]; if (!b) return; const c = bizMkCost(b); if (b.mk) return toast('Bu yıl zaten kampanya var'); if (g.money < c) return toast(`Kampanya için ${fm(c)} gerekli`); money(-c, `Reklam kampanyası: ${b.n}`); b.mk = 1; L(`${b.n} için reklam kampanyası başlattın (${fm(c)}).`); toast('Kampanya başladı'); sv(); draw(); }
function bizSell(j) { const b = g.fin.biz[j]; if (!b) return; ask(`${b.n}, ${fm(b.v * .95)} karşılığında satılsın mı?`, () => { money(Math.round(b.v * .95), `Şirket satışı: ${b.n}`); g.fin.biz.splice(g.fin.biz.indexOf(b), 1); L(`${b.n} satıldı.`); sv(); draw(); }); }

/* ---------- Sponsorluk ---------- */
const BRANDS = ['Aura Spor', 'Kuzey Bank', 'Telnet', 'Goldline Saat', 'Volta Enerji', 'Peak Otomotiv', 'Nova Kozmetik', 'Atlas Sigorta', 'Mavi Hava Yolları', 'Fırtına İçecek'];
function sponsorOffers() {
  const n = g.rep >= 70 ? 3 : g.rep >= 40 ? 2 : g.rep >= 18 ? 1 : 0, out = [];
  for (let i = 0; i < n; i++) { const b = P(BRANDS.filter(x => !g.fin.spons.some(s => s.n === x) && !out.some(o => o.n === x))); if (b) out.push({ n: b, v: Math.round(g.rep * g.rep * .06 * cinfo(g.ct).e * R(70, 130) / 100), y: R(1, 3), med: R(1, 2) }); }
  return out;
}
function signSpons(i) { const o = (g.sponsOf || [])[i]; if (!o) return; if (g.fin.spons.length >= 4) return toast('En fazla 4 sponsorla çalışabilirsin'); g.fin.spons.push(o); g.sponsOf.splice(i, 1); L(`Sponsorluk: ${o.n}, yılda ${fm(o.v)}, ${o.y} yıl.`); toast(`${o.n} ile anlaştın`); sv(); draw(); }

/* ---------- Yıllık finans ---------- */
function finYear(out) {
  const F = g.fin, fy = g.fy || { inc: 0, tax: 0, exp: 0, agent: 0, spons: 0, rent: 0, job: 0 }, cri = g.cri > 0;
  if (g.cri) g.cri--; else if (Math.random() < .07) { g.cri = R(1, 2); news('Küresel ekonomik kriz: piyasalar sarsıldı.'); L('Ekonomik kriz başladı. Yatırımlar ve şirketler zor günlerde.'); }
  const crisis = g.cri > 0 || cri, ie = (g.invE || 0) * .004;
  let inv = 0;
  ASSETS.forEach(a => { if (F[a.k] > 0) { const r = a.m + ie + a.v * gauss() - (crisis ? a.v * 1.2 : 0); const d = F[a.k] * r; F[a.k] = Math.max(0, F[a.k] + d); inv += d; } });
  g.invE = 0;
  let rent = 0; F.props.forEach(p => { p.v = Math.round(p.v * (1 + PROPS[p.i].gr + gauss() * .05 - (crisis ? .08 : 0))); rent += p.v * PROPS[p.i].y; });
  const bE = Math.min(150, g.bizE || 0); g.bizE = 0;
  let bizP = 0;
  F.biz = F.biz.filter(b => {
    const d = BIZ[b.i], r = d.m + d.v * gauss() + (bE / Math.max(1, F.biz.length) - 40) * .0012 + b.lvl * .006 + (b.mk ? .05 : 0) - (crisis ? .14 : 0);
    const profit = Math.round(b.v * r * .5); b.last = profit; b.v = Math.max(0, Math.round(b.v * (1 + r * .6))); b.mk = 0; bizP += Math.max(0, profit) * .6;
    if (b.i === 4 && Math.random() < .2 + b.lvl * .05) { g.acp = (g.acp || 0) + 1; L(`${b.n}'nden yetişen bir genç profesyonel oldu.`); }
    if (b.v < b.inv * .15) { L(`${b.n} iflas etti.`); g.hap -= 6; return false; }
    return true;
  });
  let sp = 0; F.spons = F.spons.filter(s => { sp += s.v; s.y--; return s.y > 0; });
  const ct = g.club ? g.club.ct : g.ct, tr = cinfo(ct).tax - (hasStaff('avukat') ? .03 : 0), taxS = (sp + rent + bizP) * tr;
  money(rent + bizP + sp - taxS, 'Kira, şirket ve sponsor gelirleri (vergi sonrası)');
  fy.inc += rent + bizP + sp; fy.tax += taxS; fy.spons += sp;
  if (hasStaff('asci')) g.hp = clr(g.hp + 2, 0, 100);
  if (hasStaff('guvenlik')) g.rep = cl(g.rep + .5, 0, 100);
  F.hist.unshift({ y: g.season, inc: Math.round(fy.inc), tax: Math.round(fy.tax), exp: Math.round(fy.exp), agent: Math.round(fy.agent), inv: Math.round(inv), spons: Math.round(sp), rent: Math.round(fy.rent || 0), job: Math.round(fy.job || 0), net: Math.round(fy.inc - fy.tax - fy.exp - fy.agent + inv) });
  if (F.hist.length > 12) F.hist.length = 12;
  g.fy = { inc: 0, tax: 0, exp: 0, agent: 0, spons: 0, rent: 0, job: 0 };
  g.sponsOf = sponsorOffers();
  if (g.money < 0) { L(`Borçtasın (${fm(g.money)}). Faiz işliyor; varlık satmayı düşün.`); g.hap -= 4; }
  if (out) out.fin = F.hist[0];
}

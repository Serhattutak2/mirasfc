/* ============================================================
   MİRAS FC — KULÜP SAHİPLİĞİ (v2)
   Gerçek kadro (g.sq), teknik direktör tutma/kovma, stadyum,
   altyapı (genç yükseltme), bilet fiyatı, forma sponsoru,
   transfer (dönem dışı satış listesi), kasa yönetimi, kendin
   çalıştırma (emekliyken), satış.
   ============================================================ */
/* kulüp ekonomisi: gelir, kadronun tipik maaş yüküyle ölçeklenir; iyi yönetilen kulüp az kâr eder */
const clubRev = c => Math.round(1.08 * 22 * wageOf(c.s, c.t, clubCt(c.id)));
const clubPrice = c => Math.round(clubRev(c) * 3.2 * (.7 + c.fan / 100 * .6));
const STAD = ['Küçük tribünler', 'Yenilenmiş stat', 'Modern arena', 'Akıllı stadyum', 'Efsane arena'];
function buyList() { const B = []; for (const ct in g.w) for (const X of g.w[ct]) for (const c of X) { const p = clubPrice(c); if (p <= Math.max(0, g.money) * 1.15) B.push({ id: c.id, ct, n: c.n, t: c.t, s: c.s, p }); } return B.sort((a, b) => b.p - a.p).slice(0, 10); }
function cheapestClub() { let m = Infinity; for (const ct in g.w) for (const X of g.w[ct]) for (const c of X) m = Math.min(m, clubPrice(c)); return m; }
function buyClub(id) {
  const x = buyList().find(c => c.id === id); if (!x) return;
  if (g.own) return toast('Zaten bir kulübün var; önce onu sat');
  if (g.money < x.p) return toast(`Paran yetmiyor: ${fm(x.p)} gerekli`);
  ask(`${clubName(x.n)}, ${fm(x.p)} karşılığında satın alınsın mı?`, () => {
    money(-x.p, `Kulüp satın alındı: ${clubName(x.n)}`); const c = club(x.id);
    g.own = { id: x.id, ct: x.ct, n: x.n, price: x.p, bud: Math.round(x.p * .06), fan: c.fan, acad: 1, stad: 0, tick: 1, sp: null, yr: 0, t: 0, cup: 0, tl: c.t, last: null, coachR: R(62, 72), coachN: P((NAMES[cinfo(x.ct).lang] || NAMES.tr).f) + ' ' + P((NAMES[cinfo(x.ct).lang] || NAMES.tr).l), coachW: Math.round(30 * cinfo(x.ct).e * [0, 4, 1.2, .4][c.t]), form: '4-4-2', sell: [], mk: 0, spOf: null, fin: [] };
    ensureSquad(x.id); youthIntake(x.id, 1); recalcStr(x.id); g.own.spOf = ownSponsorOffers();
    L(`${clubName(x.n)} kulübünü satın aldın!`); news(`${clubName(x.n)} kulübünün yeni sahibi: ${g.name}`); g.rep += 4; tab = 'own'; OV = 'ozet'; scr = 'game'; sv(); draw();
  });
}
function ownDeposit(a) { const o = g.own; a = Math.min(Math.round(a), Math.max(0, Math.floor(g.money))); if (a < 1) return toast('Aktaracak nakit yok'); money(-a, 'Kulüp kasasına aktarım'); o.bud += a; L(`Kulübüne ${fm(a)} aktardın.`); toast(`${fm(a)} kulüp kasasına`); sv(); draw(); }
function ownWithdraw(a) { const o = g.own; a = Math.min(Math.round(a), Math.max(0, Math.floor(o.bud))); if (a < 1) return toast('Kulüp kasası boş'); o.bud -= a; money(a, 'Kulüp kasasından çekim'); o.fan = clr(o.fan - 2, 0, 100); L(`Kulüp kasasından ${fm(a)} çektin. Taraftar hoşnutsuz.`); toast(`${fm(a)} cebine`); sv(); draw(); }
const ownCost = (base) => Math.round(base * clubRev(club(g.own.id)) / 1200);
function ownAcad() { const o = g.own, c = ownCost(60 * o.acad); if (o.acad >= 5) return toast('Altyapı en üst seviyede'); if (o.bud < c) return toast(`Kulüp bütçesi yetmiyor: ${fm(c)} gerekli`); o.bud -= c; o.acad++; L(`${clubName(o.n)} altyapısı seviye ${o.acad} oldu.`); toast(`Altyapı seviye ${o.acad}`); sv(); draw(); }
function ownStad() { const o = g.own, c = ownCost(200 * (o.stad + 1)); if (o.stad >= 4) return toast('Stadyum zaten efsane'); if (o.bud < c) return toast(`Kulüp bütçesi yetmiyor: ${fm(c)} gerekli`); o.bud -= c; o.stad++; o.fan = clr(o.fan + 3, 0, 100); L(`Stadyum yatırımı: ${STAD[o.stad]} (${fm(c)}).`); toast(STAD[o.stad]); sv(); draw(); }
function ownTick(v) { g.own.tick = v; toast(['Ucuz bilet: taraftar mutlu', 'Normal bilet', 'Pahalı bilet: gelir artar, taraftar söylenir'][v]); sv(); draw(); }
function ownSponsorOffers() { const o = g.own, c = club(o.id), base = clubRev(c) * .13 * (.6 + o.fan / 100) * (1 + o.stad * .1); return [{ n: P(BRANDS), v: Math.round(base * 1.25), y: 1, fan: 0 }, { n: P(BRANDS), v: Math.round(base * 1.05), y: 4, fan: 0 }, { n: 'Bahis şirketi', v: Math.round(base * 1.7), y: 2, fan: -8 }]; }
function ownSponsor(i) { const o = g.own, s = (o.spOf || [])[i]; if (!s) return; if (o.sp) return toast('Mevcut sponsor sözleşmesi bitmeden yenisi yapılamaz'); o.sp = { ...s }; o.fan = clr(o.fan + s.fan, 0, 100); o.spOf = null; L(`${clubName(o.n)} forma sponsoru: ${s.n} (yılda ${fm(s.v)}, ${s.y} yıl).`); toast(`Sponsor: ${s.n}`); sv(); draw(); }

/* teknik direktör adayları */
function ownCoachCands() {
  const o = g.own, c = club(o.id), NP = NAMES[cinfo(o.ct).lang] || NAMES.tr, rnd = srng(hash(o.id + ':td:' + g.season + ':' + (o.tdk || 0))), out = [];
  for (let i = 0; i < 4; i++) { const r = Math.round(58 + rnd() * 34), w = Math.round(Math.pow(r / 70, 4) * clubRev(c) * .012); out.push({ n: NP.f[Math.floor(rnd() * NP.f.length)] + ' ' + NP.l[Math.floor(rnd() * NP.l.length)], r, w, st: ['Hücumcu', 'Dengeli', 'Savunmacı', 'Gençlere şans veren', 'Disiplinli'][Math.floor(rnd() * 5)], age: 38 + Math.floor(rnd() * 25) }); }
  return out.sort((a, b) => b.r - a.r);
}
function ownHire(i) {
  const o = g.own, x = ownCoachCands()[i]; if (!x) return;
  if (g.coach && g.coach.id === o.id) return toast('Takımı şu an sen çalıştırıyorsun');
  const comp = o.coachN ? Math.round(o.coachW * .5) : 0;
  if (o.bud < comp + x.w * .5) return toast(`Bütçe yetmiyor: tazminat ${fm(comp)} + ön ödeme ${fm(Math.round(x.w * .5))}`);
  o.bud -= comp + Math.round(x.w * .5); if (o.coachN) L(`${o.coachN} görevden alındı (tazminat ${fm(comp)}).`);
  o.coachN = x.n; o.coachR = x.r; o.coachW = x.w; o.tdk = (o.tdk || 0) + 1; recalcStr(o.id);
  L(`Yeni teknik direktör: ${x.n} (${x.st}, kalite ${x.r}). Yıllık ${fm(x.w)}.`); news(`${clubName(o.n)} teknik direktörünü açıkladı: ${x.n}`); toast(`${x.n} göreve başladı`); sv(); draw();
}
function ownSelfCoach() {
  const o = g.own, c = o && club(o.id); if (!o || !c) return;
  if (g.phase === 'pro' || g.club) return toast('Futbolu bırakmadan kendi takımını çalıştıramazsın');
  if (g.coach) return toast('Zaten bir takım çalıştırıyorsun');
  ask(`${clubName(o.n)} teknik direktörlüğünü kendin üstlen? ${o.coachN ? o.coachN + ' görevden alınacak.' : ''}${g.lic >= 1 ? '' : ' Lisansın olmadığı için federasyondan özel izin alınacak.'}`, () => {
    if (o.coachN) L(`${o.coachN} ile yollar ayrıldı; takımı sen çalıştıracaksın.`);
    o.coachN = null; o.coachR = 0;
    g.cof = [{ ...mkCoachOffer(c, o.ct), sal: 0, bud: o.bud, yrs: 99, own: 1, bonusT: 0, comp: 0 }]; coachSign(0);
    g.coach.bud = o.bud; g.coach.ownLink = 1; g.coach.form = o.form || '4-4-2';
  });
}
function ownMarketBuy(i) {
  const o = g.own; if (!windowOpen() && !(g.phase === 'retired')) return toast('Transfer dönemi kapalı (1-4. ve 22-25. haftalar)');
  const x = market(o.id, o.mk)[i]; if (!x) return;
  if (buyPlayer(o.id, x, o)) { o.mk++; o.fan = clr(o.fan + (x.r > club(o.id).s ? 2 : 0), 0, 100); }
  sv(); draw();
}
function ownSell(pid) {
  const o = g.own, p = (g.sq[o.id] || []).find(x => x.id === pid); if (!p) return;
  if (!windowOpen() && g.phase !== 'retired') { o.sell = o.sell || []; if (o.sell.includes(pid)) { o.sell = o.sell.filter(x => x !== pid); toast('Listeden çıkarıldı'); } else { o.sell.push(pid); toast('Transfer listesine kondu; dönem açılınca satılacak'); } sv(); draw(); return; }
  ask(`${pname(p)} satılsın mı? (tahmini ${fm(Math.round(valueOf(p.r, p.age) * cinfo(o.ct).e))})`, () => { const fee = sellPlayer(o.id, pid, o); if (p.r >= club(o.id).s) o.fan = clr(o.fan - 3, 0, 100); toast(`${fm(fee)} kasaya girdi`); sv(); draw(); });
}
function ownPromote(yid) { promoteYouth(g.own.id, yid); g.own.fan = clr(g.own.fan + 1, 0, 100); }
function ownRenew(pid) { const p = (g.sq[g.own.id] || []).find(x => x.id === pid); if (!p) return; p.renew = p.renew ? 0 : 1; toast(p.renew ? 'Sözleşmesi yenilenecek' : 'Yenileme iptal'); sv(); draw(); }
function ownSetForm(f) { const o = g.own; o.form = f; if (g.coach && g.coach.id === o.id) g.coach.form = f; recalcStr(o.id); toast(`Diziliş ${f} · güç ${club(o.id).s}`); sv(); draw(); }
function sellClub() {
  const o = g.own, c = club(o.id), p = c ? clubPrice(c) : o.price;
  ask(`${clubName(o.n)}, ${fm(p)} karşılığında satılsın mı?${g.coach && g.coach.id === o.id ? ' Teknik direktörlüğün de sona erer.' : ''}`, () => {
    if (g.coach && g.coach.id === o.id) coachLeave('Kulübü sattı', 0);
    money(p + o.bud, 'Kulüp satışı'); g.oh = g.oh || { t: 0, yr: 0, cup: 0 }; g.oh.t += o.t; g.oh.yr += o.yr; g.oh.cup += o.cup; g.oh.n = o.n;
    L(`${clubName(o.n)} kulübünü ${fm(p)} karşılığında sattın.`); const id = o.id; g.own = null; if (!(g.club && g.club.id === id)) dropSquad(id); tab = 'fin'; sv(); draw();
  });
}
function ownYear(out) {
  const o = g.own; if (!o) return; const c = club(o.id); if (!c) { g.own = null; return; }
  const e = cinfo(o.ct).e, self = g.coach && g.coach.id === o.id; o.yr++; o.n = c.n;
  if (self) o.bud = g.coach.bud;
  const pos = g.prev ? g.prev[o.id] : 0;
  if (c.t < o.tl) { o.fan += 8; L(`Kulübün ${clubName(c.n)} üst lige çıktı!`); } else if (c.t > o.tl) { o.fan -= 8; L(`Kulübün ${clubName(c.n)} küme düştü.`); }
  if (g.chs[o.id] && o.tl === 1) { o.t++; o.fan += 6; g.hap += 6; L(`Kulübün ${clubName(c.n)} lig şampiyonu oldu!`); }
  const rev = clubRev(c), nT = (g.w[o.ct] && g.w[o.ct][o.tl - 1] || []).length || 18, tv = rev * .45, prize = pos ? Math.max(0, (nT - pos + 1) / nT) * rev * .14 : 0;
  const tick = rev * .22 * (o.fan / 70) * [.75, 1, 1.25][o.tick] * (1 + o.stad * .12), spn = o.sp ? o.sp.v : 0;
  const wages = wageBill(o.id), coachW = self ? 0 : (o.coachN ? o.coachW : 0), acadC = 25 * o.acad * e + rev * .16, stadC = rev * .01 * o.stad;
  const net = Math.round(tv + prize + tick + spn - wages - coachW - acadC - stadC);
  o.bud += net; o.last = net;
  o.fin.unshift({ y: g.season - 1, tv: Math.round(tv), prize: Math.round(prize), tick: Math.round(tick), spn: Math.round(spn), wages: Math.round(wages), coach: Math.round(coachW), other: Math.round(acadC + stadC), net, pos }); if (o.fin.length > 8) o.fin.length = 8;
  if (o.sp) { o.sp.y--; if (o.sp.y <= 0) o.sp = null; }
  o.fan = clr(o.fan + [3, 0, -6][o.tick] + (g.chs[o.id] ? 4 : 0), 5, 100);
  if (o.bud < 0) {
    const need = -o.bud;
    if (g.money > need) { money(-need, 'Kulüp borcunu kapattın'); o.bud = 0; L(`Kulübün borcunu kendi cebinden kapattın (${fm(need)}).`); }
    else { const sq = (g.sq[o.id] || []).sort((a, b) => b.r - a.r); for (const p of sq.slice(0, 3)) { if (o.bud >= 0) break; sellPlayer(o.id, p.id, o); } L('Kulüp borç içindeydi; en iyi oyuncular satıldı.'); o.fan = clr(o.fan - 6, 0, 100); o.bud = Math.max(0, o.bud); }
  }
  if (self) g.coach.bud = o.bud;
  o.tl = c.t; o.price = clubPrice(c); o.spOf = o.sp ? null : ownSponsorOffers();
  if (out) out.lines.push(`Kulübün ${clubName(o.n)}: ${pos ? pos + '. sıra, ' : ''}${tierName(o.ct, c.t)}, yıllık sonuç ${net >= 0 ? '+' : ''}${fm(net)}, kasa ${fm(o.bud)}.`);
}

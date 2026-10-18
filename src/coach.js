/* ============================================================
   MİRAS FC — TEKNİK DİREKTÖRLÜK (v2)
   Lisans: kurs dersleri haftalık enerjiyle ilerler (oynarken de).
   Kadro (g.sq), diziliş, taktik, teknik ekip, altyapı, transfer
   (dönem dışı satış listesi), dinamik hedefler, sözleşme kalemleri,
   maçı yönetme (devre arası kararları), sürpriz iş teklifleri,
   basın toplantıları (kimlikle saklanır).
   ============================================================ */
const LIC = ['Yok', 'UEFA C', 'UEFA B', 'UEFA A', 'UEFA Pro'], LIC_C = [0, 20, 40, 80, 150], LIC_N = [0, 6, 10, 14, 20];
const TACT = { hucum: { n: 'Hücum', us: 1.16, th: 1.1, d: 'Çok gol atar, çok yer' }, denge: { n: 'Dengeli', us: 1, th: 1, d: 'Riski dengeler' }, savunma: { n: 'Otobüs', us: .8, th: .76, d: 'Az gol, az risk' }, kontra: { n: 'Kontra', us: 1, th: .92, d: 'Güçlü rakibe karşı etkili' }, pres: { n: 'Yüksek pres', us: 1.1, th: .95, d: 'Etkili ama yorar' }, topa: { n: 'Topa sahip ol', us: 1.05, th: .9, d: 'Teknik kadro ister' } };
const STAFFC = [
  { k: 'asst', n: 'Yardımcı antrenör', d: 'Takım gücü +' },
  { k: 'ana', n: 'Maç analisti', d: 'Takım gücü +, rakip analizi' },
  { k: 'fiz', n: 'Fizyoterapi ekibi', d: 'Sakatlık riski ve süresi azalır' },
  { k: 'gkc', n: 'Kaleci antrenörü', d: 'Kalecilerin gelişimi +' },
  { k: 'scout', n: 'Gözlemci ağı', d: 'Transfer pazarında daha iyi oyuncular' },
  { k: 'genc', n: 'Altyapı direktörü', d: 'Altyapı adayları daha yetenekli' },
];
const licNeed = c => c.t === 1 ? (c.s >= 80 ? 4 : 3) : c.t === 2 ? 2 : 1;
const licCost = n => Math.max(10, Math.round((LIC_C[n] - g.edu * 6) * cinfo(g.ct).e));
function licStart() {
  const n = (g.lic || 0) + 1; if (n > 4) return toast('En üst lisansa sahipsin'); if (g.licYr) return toast('Zaten bir kurstasın');
  const c = licCost(n); if (g.money < c) return toast(`Kurs ücreti ${fm(c)}, nakit ${fm(g.money)}`);
  money(-c, `${LIC[n]} kurs ücreti`); g.licYr = 1; g.licP = 0; L(`${LIC[n]} kursuna yazıldın (${fm(c)}). ${LIC_N[n]} ders gerekiyor; dersleri Enerji sekmesinden alabilirsin.`); toast(`${LIC[n]} kursu başladı`); sv(); draw();
}
function licDone() { if (!g.licYr) return; g.licYr = 0; g.licP = 0; g.lic = (g.lic || 0) + 1; L(`🎓 ${LIC[g.lic]} lisansını aldın!`); toast(`${LIC[g.lic]} lisansı alındı`); g.crep = (g.crep || 0) + 2; }

/* ---------- İş teklifleri ---------- */
const coachRep = () => (g.crep || 0) + g.rep * .35 + (g.car.ap > 300 ? 6 : 0);
function mkCoachOffer(c, ct, ex) {
  const X = g.w[ct][c.t - 1], rank = [...X].sort((a, b) => b.s - a.s).findIndex(x => x.id === c.id) + 1, e = cinfo(ct).e;
  const sal = Math.round(Math.pow(c.s / 60, 4) * [0, 1600, 300, 70][c.t] * e * R(85, 120) / 100 * (1 + CAG[g.cag || 0].sal));
  return { id: c.id, ct, n: c.n, t: c.t, s: c.s, exp: Math.max(1, rank + R(-1, 1)), sal, yrs: R(1, 3), bud: Math.round(Math.pow(c.s / 60, 6) * [0, 3000, 500, 90][c.t] * e * R(55, 95) / 100), bonusT: Math.round(sal * R(20, 60) / 100), comp: R(3, 6) / 10, style: P(['hucum', 'denge', 'kontra', 'topa', 'pres']), ...ex };
}
function coachOffers() {
  const rep = coachRep(), out = [];
  for (const ct of [g.ct, ...COUNTRIES.map(x => x.n).filter(x => x !== g.ct)]) for (const c of g.w[ct].flat()) {
    if (licNeed(c) > (g.lic || 0) || (g.coach && g.coach.id === c.id)) continue;
    const need = (c.s - 55) * 1.6 + (ct === g.ct ? 0 : 12);
    if (Math.random() < 1 / (1 + Math.exp(-(rep - need) / 6)) * .25) out.push(c);
  }
  return out.sort(() => Math.random() - .5).slice(0, 6).sort((a, b) => b.s - a.s).map(c => mkCoachOffer(c, clubCt(c.id)));
}
function coachLook() { if (!(g.lic >= 1)) return toast('Önce UEFA C lisansı almalısın'); g.cof = coachOffers(); if (!g.cof.length) { L('Şu an teknik direktörlük için uygun bir teklif yok.'); toast('Uygun teklif yok; ün ve lisans gerekli'); } sv(); draw(); }
/* çocukluk kulübü gibi doğrudan teklif (olaylardan) */
function coachOfferDirect(id) { const c = club(id); if (!c) return; const o = mkCoachOffer(c, clubCt(id), { home: 1 }); g.cof = [o]; L(`${clubName(c.n)} sana teknik direktörlük teklif etti.`); tab = 'coach'; }
function coachSign(i) {
  const o = (g.cof || [])[i]; if (!o) return;
  if (g.club || ['pro', 'pro0', 'free', 'child'].includes(g.phase)) return toast('Teknik direktör olmak için önce futbolu bırakmalısın');
  if (g.coach) coachLeave('Başka kulübe geçti', o.buyout ? 0 : 1);
  g.coach = { id: o.id, ct: o.ct, n: o.n, sal: o.sal, yrs: o.yrs, start: g.season, bonusT: o.bonusT || 0, comp: o.comp || .4, bud: o.bud, conf: 55, harm: 60, tacUse: {}, ult: null, form: '4-4-2', tac: o.style || 'denge', rot: 1, load: 1, staff: { asst: 1 }, s: 0, t: 0, cup: 0, ec: 0, tr: 0, hist: [], sell: [], fat: 0, mk: 0, askB: 0, obj: [], wins: 0, gp: 0, own: o.own || 0 };
  g.cof = null; g.phase = 'coach'; g.cjob = null;
  ensureSquad(o.id); recalcStr(o.id); g.youth = g.youth || {}; if (!g.youth[o.id]) youthIntake(o.id, 1 + (g.coach.staff.genc || 0));
  L(`Teknik direktör oldun: ${clubName(o.n)} (${tierName(o.ct, o.t)}). Maaş ${fm(o.sal)}/yıl, ${o.yrs} yıl.`); news(`${clubName(o.n)} yeni teknik direktörünü açıkladı: ${g.name}`);
  const mid = g.week > 1 && g.week < SEASON_W - 4;
  setupSeason(mid ? g.week : 1); mkObjectives(); g.wstage = 0;
  tab = 'coach'; CV2 = 'ozet'; scr = 'game'; sv(); draw();
}
function coachLeave(why, paid) {
  const C = g.coach; if (!C) return;
  C.hist.unshift({ y: g.season, n: C.n, r: why }); g.cHist = (g.cHist || []).concat(C.hist.map(h => ({ ...h, n: C.n })));
  g.co = g.co || { t: 0, s: 0, cup: 0 }; g.co.t += C.t; g.co.cup += C.cup + C.ec; g.co.s += C.s;
  if (paid) { const comp = Math.round(C.sal * C.yrs * C.comp); if (comp > 0 && !C.own) { money(comp, 'Teknik direktör tazminatı'); L(`Tazminat aldın: ${fm(comp)}.`); } }
  if (!ownById(C.id)) dropSquad(C.id);
  g.coach = null; g.phase = 'retired'; g.cal = []; g.lg = null; g.cup = null; g.euro = null; g.wq = null; g.wstage = 0;
}

/* ---------- Dinamik hedefler ---------- */
function expRank(id) { const c = club(id), X = g.w[clubCt(id)][c.t - 1]; return [...X].sort((a, b) => b.s - a.s).findIndex(x => x.id === id) + 1; }
function mkObjectives() {
  const C = g.coach, c = club(C.id), r = expRank(C.id), n = g.w[C.ct][c.t - 1].length, O = [];
  const lp = Math.max(1, Math.min(n - 3, r - (C.conf > 75 ? 1 : 0)));
  O.push({ k: 'lig', n: lp === 1 ? 'Şampiyonluk' : c.t > 1 && lp <= 3 ? 'Üst lige çık (ilk 3)' : lp >= n - 4 ? 'Ligde kal' : `Ligi ilk ${lp} içinde bitir`, v: lp >= n - 4 ? n - 3 : lp, w: 3 });
  O.push({ k: 'kupa', n: c.s >= 76 ? 'Kupada yarı final' : 'Kupada son 16', v: c.s >= 76 ? 4 : 2, w: 1 });
  if (g.euro) O.push({ k: 'euro', n: g.euro.top && c.s >= 82 ? 'Avrupa’da çeyrek final' : 'Avrupa’da gruptan çık', v: g.euro.top && c.s >= 82 ? 1 : 0, w: 2 });
  if (Math.random() < .6) O.push({ k: 'genc', n: 'Altyapıdan en az 1 oyuncu yükselt', v: 1, w: 1, have: 0 });
  if (Math.random() < .5) O.push({ k: 'maas', n: 'Maaş bütçesini aşma', v: Math.round(wageBill(C.id) * 1.08), w: 1 });
  C.obj = O; C.objNote = '';
}
function objState(o) {
  const C = g.coach; if (!C) return { cur: '—', ok: 0 };
  if (o.k === 'lig') { if (!g.lg) return { cur: '—', ok: 0 }; const pos = sortT(g.lg.teams).findIndex(x => x.id === C.id) + 1; return { cur: pos + '.', ok: pos <= o.v ? 1 : pos <= o.v + 2 ? 0 : -1, pos }; }
  if (o.k === 'kupa') { const r = g.cup ? g.cup.r : 0; return { cur: g.cup && g.cup.won ? 'Kazandı' : (g.cup && g.cup.alive ? 'Devam · ' : 'Elendi · ') + (CUP_R[r] || ''), ok: (g.cup && (g.cup.r >= o.v + 2 || g.cup.won)) ? 1 : g.cup && g.cup.alive ? 0 : -1 }; }
  if (o.k === 'euro') { const E = g.euro; if (!E) return { cur: '—', ok: 0 }; const reach = E.gr >= 6 ? E.ko : -1; return { cur: E.won ? 'Kazandı' : E.alive ? 'Devam' : 'Elendi', ok: reach >= o.v || E.won ? 1 : E.alive ? 0 : -1 }; }
  if (o.k === 'genc') return { cur: (o.have || 0) + ' yükseltildi', ok: (o.have || 0) >= o.v ? 1 : 0 };
  if (o.k === 'maas') { const w = wageBill(C.id); return { cur: fm(w), ok: w <= o.v ? 1 : -1 }; }
  return { cur: '—', ok: 0 };
}
/* sezon ortası yönetim değerlendirmesi: hedef değişebilir */
function midReview() {
  const C = g.coach, o = C.obj.find(x => x.k === 'lig'); if (!o || !g.lg) return;
  const pos = objState(o).pos, n = g.lg.teams.length;
  if (pos <= o.v - 3 && o.v > 1) { o.v = Math.max(1, pos); o.n = o.v === 1 ? 'Şampiyonluk' : `Ligi ilk ${o.v} içinde bitir`; C.objNote = 'Yönetim iyi gidişi gördü ve çıtayı yükseltti.'; C.conf = clr(C.conf + 4, 0, 100); }
  else if (pos >= o.v + 4) { if (C.conf < 50) { o.v = Math.min(n - 3, pos - 1); o.n = o.v >= n - 4 ? 'Ligde kal' : `Ligi ilk ${o.v} içinde bitir`; C.objNote = 'Yönetim hedefi düşürdü ama sabrı azalıyor.'; } else C.objNote = 'Yönetim: “Hedef değişmedi, toparlanmanı bekliyoruz.”'; C.conf = clr(C.conf - 6, 0, 100); }
  else C.objNote = 'Yönetim gidişattan memnun.';
  L(`Sezon ortası değerlendirme: ${C.objNote}`);
}

/* ---------- Kadro yönetimi ---------- */
function setForm(f) { const C = g.coach; if (!C || !FORMS[f]) return; C.form = f; recalcStr(C.id); toast(`Diziliş: ${f} · güç ${club(C.id).s}`); sv(); draw(); }
function setTac(t) { const C = g.coach; if (!C || !TACT[t]) return; C.tac = t; toast(`Taktik: ${TACT[t].n}`); sv(); draw(); }
function setRot(v) { g.coach.rot = v; toast(['Rotasyon az: en iyiler oynar, yorulur', 'Dengeli rotasyon', 'Bol rotasyon: dinç ama zayıf'][v]); sv(); draw(); }
function setLoad(v) { g.coach.load = v; toast(['Hafif antrenman', 'Normal antrenman', 'Ağır antrenman'][v]); sv(); draw(); }
function togOut(pid) { const sq = g.sq[myClubId()] || [], p = sq.find(x => x.id === pid); if (!p) return; p.out = p.out ? 0 : 1; recalcStr(myClubId()); toast(p.out ? `${pname(p)} kadro dışı` : `${pname(p)} kadroya döndü`); sv(); draw(); }
function hireStaff(k) {
  const C = g.coach; if (!C) return; C.staff = C.staff || {}; const lv = (C.staff[k] || 0) + 1, c = Math.round(lv * 12 * cinfo(C.ct).e * [0, 3, 1.2, .5][club(C.id).t]);
  if (lv > 3) return toast('En iyi ekip zaten burada'); if (C.bud < c) return toast(`Bütçe yetmiyor: ${fm(c)} gerekli, bütçe ${fm(C.bud)}`);
  C.bud -= c; C.staff[k] = lv; recalcStr(C.id); L(`${STAFFC.find(s => s.k === k).n} seviye ${lv}: imza ${fm(c)}, yıllık maaş ${fm(staffWage1(k, lv))} bütçeden ödenecek.`); toast(`${STAFFC.find(s => s.k === k).n} → ${lv}. seviye · −${fm(c)} · yılda −${fm(staffWage1(k, lv))}`); sv(); draw();
}
/* teknik ekip maaşları kulüp bütçesinden haftalık düşer */
const staffWage1 = (k, lv) => { const C = g.coach; return Math.round(lv * 9 * cinfo(C.ct).e * [0, 3, 1.2, .5][club(C.id) ? club(C.id).t : 2]); };
const staffWages = () => { const C = g.coach; if (!C || !C.staff) return 0; return Object.entries(C.staff).reduce((s, [k, lv]) => s + (lv ? staffWage1(k, lv) : 0), 0); };
function staffPayWeek() { const C = g.coach; if (!C) return; const w = staffWages() / SEASON_W; C.bud = Math.round(C.bud - w); C.stPaid = (C.stPaid || 0) + w; if (C.bud < 0) { C.conf = clr(C.conf - 2, 0, 100); if (!C.bnote) { C.bnote = 1; L('Kulüp bütçesi eksiye düştü; yönetim harcamalardan rahatsız.'); } } else C.bnote = 0;
}
const windowOpen = () => g.week <= 4 || (g.week >= 22 && g.week <= 25);
function coachBuy(i) { const C = g.coach; if (!C) return; if (!windowOpen()) return toast('Transfer dönemi kapalı (1-4. ve 22-25. haftalar)'); const x = market(C.id, C.mk + (C.staff.scout || 0) * 7)[i]; if (!x) return; if (buyPlayer(C.id, x, C)) { C.mk++; C.conf = clr(C.conf + 1, 0, 100); recheckObj(); } sv(); draw(); }
function coachSellNow(pid) {
  const C = g.coach; if (!C) return; const p = (g.sq[C.id] || []).find(x => x.id === pid); if (!p) return;
  if (!windowOpen()) { C.sell = C.sell || []; if (!C.sell.includes(pid)) { C.sell.push(pid); L(`${pname(p)} transfer listesine kondu; dönem açılınca satılacak.`); toast('Transfer listesine kondu'); } else { C.sell = C.sell.filter(x => x !== pid); toast('Listeden çıkarıldı'); } sv(); draw(); return; }
  ask(`${pname(p)} satılsın mı? (tahmini ${fm(Math.round(valueOf(p.r, p.age) * cinfo(C.ct).e))})`, () => { const fee = sellPlayer(C.id, pid, C); toast(`${fm(fee)} karşılığında satıldı`); if (p.r >= club(C.id).s + 3) C.conf = clr(C.conf - 2, 0, 100); recheckObj(); sv(); draw(); });
}
function processSellList(id, B) { if (!B.sell || !B.sell.length || !windowOpen()) return; B.sell.forEach(pid => { const fee = sellPlayer(id, pid, B); if (fee) news(`${cname(id)} bir oyuncusunu ${fm(fee)} karşılığında sattı.`); }); B.sell = []; }
function renewP(pid) { const sq = g.sq[myClubId()] || [], p = sq.find(x => x.id === pid); if (!p) return; p.renew = p.renew ? 0 : 1; toast(p.renew ? `${pname(p)}: sözleşme yenilenecek (+%10 maaş)` : 'Yenileme iptal'); sv(); draw(); }
function coachPromote(yid) { const C = g.coach; if (!C) return; const Y = (g.youth || {})[C.id] || []; const y = Y.find(x => x.id === yid); if (!y) return; promoteYouth(C.id, yid); const o = C.obj.find(x => x.k === 'genc'); if (o) o.have = (o.have || 0) + 1; g.crep = (g.crep || 0) + .5; }
function askBudget() {
  const C = g.coach; if (!C) return; if (C.askB === g.season) return toast('Bu sezon zaten bütçe istedin');
  C.askB = g.season; const c = club(C.id), amt = Math.round(Math.pow(c.s / 60, 6) * [0, 900, 150, 30][c.t] * cinfo(C.ct).e);
  if (Math.random() < (C.conf - 30) / 60) { C.bud += amt; L(`Yönetim ek transfer bütçesi verdi: ${fm(amt)}.`); toast(`+${fm(amt)} bütçe`); }
  else { C.conf = clr(C.conf - 5, 0, 100); L('Yönetim ek bütçe talebini reddetti; ilişkiler gerildi.'); toast('Talep reddedildi'); }
  sv(); draw();
}
function recheckObj() { /* kadro güçlendiyse yönetim beklentisini yeniden hesaplar */
  const C = g.coach, o = C && C.obj.find(x => x.k === 'lig'); if (!o) return; const r = expRank(C.id);
  if (r < o.v - 1) { o.v = Math.max(1, r); o.n = o.v === 1 ? 'Şampiyonluk' : `Ligi ilk ${o.v} içinde bitir`; C.objNote = 'Kadro güçlendi; yönetimin beklentisi de yükseldi.'; toast('Yönetim hedefi yükseltti'); }
}

/* ---------- Basın ---------- */
const PRESS = {
  disiplin: { t: 'Bir gazeteci yıldız oyuncunun disiplinsizliğini soruyor.', c: [['Oyuncumu korurum', () => { g.coach.conf -= 1; g.coach.fat = Math.max(0, g.coach.fat - 2); }], ['Kurallar herkese eşit', () => { g.coach.conf += 2; }]] },
  baskan: { t: 'Başkan yüksek sesle transfer eleştirisi yaptı.', c: [['Kamuoyu önünde cevap ver', () => { g.coach.conf -= 5; g.crep = (g.crep || 0) + 1; }], ['Kapalı kapılar ardında konuş', () => { g.coach.conf += 2; }]] },
  pankart: { t: 'Taraftarlar tesise pankart astı: “Taktik yok, ruh yok!”', c: [['Hücum futboluna dön', () => { g.coach.tac = 'hucum'; g.coach.conf += 1; }], ['Kendi yolumdan şaşmam', () => { g.coach.conf -= 2; }]] },
  rakip: { t: 'Rakip teknik direktör seni “şanslı” diye küçümsedi.', c: [['Sahada cevap veririz', () => { }], ['Sert bir karşılık ver', () => { g.crep = (g.crep || 0) + 1; g.coach.conf -= 1; }]] },
  hakem: { t: 'Hakem kararları soruluyor; maçta net bir penaltı verilmedi.', c: [['Hakemi eleştir (ceza riski)', () => { if (Math.random() < .4) { money(-famCost(5), 'Federasyon para cezası'); L('Federasyon para cezası verdi.'); } g.coach.conf += 1; }], ['Konuşmayayım', () => { }]] },
  genc: { t: 'Altyapıdan bir genç çok konuşuluyor. “Ne zaman şans vereceksiniz?”', c: [['Yakında A takımda', () => { g.coach.conf += 1; }], ['Acele etmeyeceğiz', () => { }]] },
};
function pressAnswer(i) { const p = g.press && PRESS[g.press]; if (!p) { g.press = null; return draw(); } p.c[i][1](); L(`Basın: ${p.t} → ${p.c[i][0]}`); g.press = null; g.coach && (g.coach.conf = clr(g.coach.conf, 0, 100)); sv(); draw(); }
function pressAuto() { const p = g.press && PRESS[g.press]; if (p) p.c[R(0, p.c.length - 1)][1](); g.press = null; if (g.coach) g.coach.conf = clr(g.coach.conf, 0, 100); }

/* ---------- Haftalık döngü ---------- */
function coachWeekStart(auto) {
  const C = g.coach; if (!C || g.phase !== 'coach') return;
  g.tw = (g.tw || 0) + 1; payWeek(); relWeek(); staffPayWeek();
  const sq = g.sq[C.id] || [], fiz = (C.staff.fiz || 0);
  sq.forEach(p => { if (p.inj > 0) p.inj = Math.max(0, p.inj - 1 - (fiz >= 2 ? 1 : 0)); if (p.outW && g.week >= p.outW) { p.out = 0; p.outW = 0; } });
  if (C.load === 2 && Math.random() < .1 - fiz * .02) { const p = P(sq.filter(x => !x.inj)); if (p) { p.inj = R(2, 6); L(`Ağır antrenman: ${pname(p)} ${p.inj} hafta sakat.`); } }
  if (C.load === 2) K.forEach(() => { const p = P(sq); if (p && p.age < 27 && Math.random() < .15) p.r = Math.min(p.pot, p.r + 1); });
  if (C.load === 0) C.fat = Math.max(0, C.fat - 1);
  if (C.staff.gkc && Math.random() < .05 * C.staff.gkc) { const gk = sq.filter(p => p.p === 'GK').sort((a, b) => b.r - a.r)[0]; if (gk && gk.r < gk.pot) gk.r++; }
  recalcStr(C.id);
  processSellList(C.id, C);
  if (g.week === 23) midReview();
  if (g.week % 4 === 0) { interestTick(); interestOffer(auto); }
  if (!auto) boardTick();
  /* soyunma odası olayları */
  if (!g.cev && !auto) {
    const sq2 = g.sq[C.id] || [], star = sq2.filter(q => (q.mor || 65) < 35 && q.r >= club(C.id).s && !q.asked).sort((a, b) => b.r - a.r)[0], ren = sq2.filter(q => q.yrs <= 1 && q.r >= club(C.id).s + 1 && !q.renew && !q.asked)[0];
    if (C.conf < 35 && !C.ult && !C.own && g.week > 6) { C.ult = { n: 3, pts: 0, need: 4 }; g.cev = { k: 'ult' }; }
    else if (star && Math.random() < .5) { star.asked = 1; g.cev = { k: 'star', pid: star.id }; }
    else if (ren && Math.random() < .25) { ren.asked = 1; g.cev = { k: 'ren', pid: ren.id }; }
    else if (Math.random() < .05 && sq2.length) { const q = P(sq2); g.cev = { k: 'disiplin', pid: q.id }; }
  }
  if (!g.press && Math.random() < .14) { g.press = P(Object.keys(PRESS)); if (auto) pressAuto(); }
  if (!g.cjob && !C.own && g.week > 6 && Math.random() < .006 + coachRep() / 9000) { const o = coachOffers().filter(x => x.s > club(C.id).s - 2)[0]; if (o) { o.mid = 1; o.buyout = 1; g.cjob = o; if (auto) g.cjob = null; else L(`Sürpriz teklif: ${clubName(o.n)} seni istiyor.`); } }
  if (!g.ev && Math.random() < .12) { g.ev = pickAdultEvent(); if (g.ev && auto) autoChoose(); }
  g.wq = g.cal.filter(e => e.w === g.week && e.k !== 'N').map(e => g.cal.indexOf(e));
  g.wres = []; g.wstage = 1; tidy();
}
function coachWeekEnd() {
  const C = g.coach; restLeft(); bpXP(6); g.wstage = 0; g.wq = null;
  if (C && !C.own && ((g.week > 8 && C.conf < 15) || C.fireNow)) { L(`${clubName(C.n)} yönetimi seni görevden aldı.`); news(`${clubName(C.n)}, ${g.name} ile yollarını ayırdı.`); g.crep = Math.max(0, (g.crep || 0) - 4); g.hap -= 8; coachLeave('Görevden alındı', 1); sv(); draw(); return; }
  g.week++; g.en = enMax(); g.wa = {};
  if (g.week > SEASON_W) return coachSeasonEnd();
  sv(); draw();
}
function coachSim(n) {
  for (let i = 0; i < n && g.phase === 'coach' && scr === 'game'; i++) {
    if (!g.wstage) coachWeekStart(1);
    if (g.ev) autoChoose(); if (g.press) pressAuto(); if (g.cev) { g.cev = null; } g.cjob = null;
    let m; while ((m = nextWeekMatch())) { const r = cmQuick(m.e, m.info); cmApply(m.e, m.info, r); g.wq.shift(); } autoPlan(g.routine || 'Dengeli', 1);
    const wk = g.week; coachWeekEnd(); if (g.week === wk || !g.coach || scr !== 'game') break;
  }
  sv(); draw();
}
function cjobAnswer(yes) {
  const o = g.cjob; g.cjob = null; if (!o) return draw();
  if (yes) { g.cof = [o]; coachSign(0); L(`${clubName(o.n)} teklifini kabul ettin; eski kulübüne bonservis ödendi.`); }
  else { if (g.coach) g.coach.conf = clr(g.coach.conf + 3, 0, 100); L(`${clubName(o.n)} teklifini geri çevirdin. Yönetim sadakatini takdir etti.`); sv(); draw(); }
}

/* ---------- Maç: güç, hızlı sonuç, yönetme ---------- */
function cmMods(info, tac) {
  const C = g.coach, T = TACT[tac || C.tac], opp = info.oid ? club(info.oid) : null, me = club(C.id);
  let us = T.us, th = T.th;
  if (T.n === 'Kontra' && opp && opp.s > me.s + 3) { us *= 1.08; th *= .9; }
  if (tac === 'topa' || C.tac === 'topa') { const tek = (g.sq[C.id] || []).slice(0, 14).reduce((s, p) => s + p.r, 0) / 14; if (tek < me.s) us *= .95; }
  us *= 1 - C.fat * .005; us *= [1.03, 1, .97][C.rot]; th *= [1, 1, 1.02][C.rot];
  /* soyunma odası uyumu ve rakiplerin taktiğine alışması */
  us *= 1 + ((C.harm || 60) - 60) / 350; const used = (C.tacUse || {})[tac || C.tac] || 0; if (used > 8) { us *= Math.max(.88, 1 - (used - 8) * .012); th *= Math.min(1.08, 1 + (used - 8) * .006); }
  return { us, th };
}
function cmStr(info) { const C = g.coach; return { a: teamStr(C.id, info.home && !info.neutral) + (C.staff.ana ? .4 : 0), b: teamStr(info.oid, !info.home && !info.neutral) }; }
function cmScorer(id) { const xi = bestXI(id, g.coach.form); const w = xi.filter(x => x.p !== 'GK').map(x => [x, (x.p === 'FW' ? 3 : x.p === 'MF' ? 1.5 : .4) * x.r / 70]); let t = w.reduce((s, x) => s + x[1], 0) * Math.random(); for (const [x, v] of w) { t -= v; if (t <= 0) return x; } return w[0] && w[0][0]; }
function cmHalf(m, half, tac) {
  const md = cmMods(m.info, tac), wm = WXM[m.info.wx || 'acik'] || 1, ga = pois(xg(m.a, m.b) * md.us * wm * m.boost / 2), gb = pois(xg(m.b, m.a) * md.th * wm / 2);
  for (let i = 0; i < ga; i++) { const p = cmScorer(g.coach.id), mn = half ? R(46, 90) : R(1, 45); m.ev.push({ m: mn, s: 0, p: p ? pname(p) : '', pid: p && p.id }); }
  for (let i = 0; i < gb; i++) m.ev.push({ m: half ? R(46, 90) : R(1, 45), s: 1, p: '' });
  m.ev.sort((a, b) => a.m - b.m); m.sc = [m.ev.filter(x => !x.s).length, m.ev.filter(x => x.s).length];
}
function cmNew(e, info) { const s = cmStr(info); return { e, info, a: s.a, b: s.b, ev: [], sc: [0, 0], boost: 1, h: 0, us: cname(g.coach.id), opp: info.on }; }
function cmFinish(m) {
  let pens = null; if (m.info.ko && m.sc[0] === m.sc[1]) { pens = Math.random() < .5 + (m.a - m.b) / 100 ? [5, 4] : [4, 5]; }
  const win = m.sc[0] > m.sc[1] || (pens && pens[0] > pens[1]), draw2 = m.sc[0] === m.sc[1] && !pens;
  return { sc: [...m.sc], pens, win, draw: draw2, ev: m.ev, my: { played: false, g: 0, a: 0, rating: 0, mins: 0 }, us: m.us, opp: m.opp };
}
function cmQuick(e, info) { const m = cmNew(e, info); cmHalf(m, 0); cmHalf(m, 1); return cmFinish(m); }
function cmApply(e, info, res) {
  const C = g.coach; applyTables(e, info, res); clubIncome(e, info, res); C.f5 = (C.f5 || []).concat([res.win ? 3 : res.draw ? 1 : 0]).slice(-6);
  const sq = g.sq[C.id] || [], xi = bestXI(C.id, C.form);
  xi.forEach(p => { const q = sq.find(x => x.id === p.id); if (q) { q.ap = (q.ap || 0) + 1; if (Math.random() < .012 * (C.load + 1) * [1.3, 1, .7][C.rot] - (C.staff.fiz || 0) * .004) { q.inj = R(1, 5); L(`${pname(q)} maçta sakatlandı (${q.inj} hafta).`); } } });
  (res.ev || []).forEach(x => { if (!x.s && x.pid) { const q = sq.find(y => y.id === x.pid); if (q) q.g = (q.g || 0) + 1; } });
  const rel = (club(info.oid) ? club(info.oid).s : 70) - club(C.id).s, big = info.ko ? 2 : 1;
  C.conf = clr(C.conf + (res.win ? 1.5 + Math.max(0, rel) * .2 : res.draw ? (rel > 3 ? 1 : -2) : -4 - Math.max(0, -rel) * .35) * big, 0, 100);
  /* taktik alışkanlığı: hep aynı oynarsan rakipler çözer */
  C.tacUse = C.tacUse || {}; for (const k in C.tacUse) if (k !== C.tac) C.tacUse[k] = Math.max(0, C.tacUse[k] - .5); C.tacUse[C.tac] = (C.tacUse[C.tac] || 0) + 1;
  /* oyuncu morali: oynamayan iyi oyuncular küser */
  const top = [...sq].sort((a, b) => b.r - a.r).slice(0, 18), inXI = new Set(xi.map(x => x.id));
  top.forEach(q => { q.mor = clr((q.mor == null ? 65 : q.mor) + (inXI.has(q.id) ? 1.5 : q.r >= club(C.id).s ? -3 : -1) + (res.win ? 1 : res.draw ? 0 : -1), 0, 100); });
  C.harm = Math.round(top.reduce((a, q) => a + (q.mor == null ? 65 : q.mor), 0) / Math.max(1, top.length));
  if (C.ult) { C.ult.n--; C.ult.pts += res.win ? 3 : res.draw ? 1 : 0; if (C.ult.n <= 0) { if (C.ult.pts >= C.ult.need) { L('Yönetimin ültimatomunu geçtin; güven tazelendi.'); C.conf = clr(C.conf + 10, 0, 100); C.ult = null; } else { C.ult = null; C.conf = 0; C.fireNow = 1; } } }
  C.fat = cl(C.fat + [1.6, 1, .4][C.rot] * [.8, 1, 1.3][C.load] - .8, 0, 30); C.gp++; if (res.win) C.wins++;
  g.wres = g.wres || []; g.wres.push({ c: info.short, t: `${info.home ? res.us : res.opp} ${info.home ? res.sc[0] : res.sc[1]}-${info.home ? res.sc[1] : res.sc[0]} ${info.home ? res.opp : res.us}${res.pens ? ` (pen. ${res.pens[0]}-${res.pens[1]})` : ''}`, r: null, w: res.win ? 1 : res.draw ? 0 : -1 });
  if (res.win) g.hap = clr(g.hap + 1, 0, 100); else if (!res.draw) g.hap = clr(g.hap - 1, 0, 100);
}
/* Maçı yönet: ilk yarı → devre arası kararları → ikinci yarı */
let CM = null;
function cmStart() { const m = nextWeekMatch(); if (!m) return; CM = cmNew(m.e, m.info); CM.tac = g.coach.tac; cmHalf(CM, 0, CM.tac); CM.h = 1; scr = 'cmatch'; draw(); }
function cmTalk(k) {
  if (!CM || CM.h !== 1) return; const r = Math.random();
  if (k === 'motive') { CM.boost = r < .65 ? 1.15 : .95; CM.talk = CM.boost > 1 ? 'Soyunma odası ateşlendi!' : 'Konuşma ters tepti, oyuncular gergin.'; }
  if (k === 'sakin') { CM.boost = 1.04; CM.talk = 'Sakin konuştun; takım planına sadık.'; }
  if (k === 'sert') { CM.boost = r < .45 ? 1.25 : .88; CM.talk = CM.boost > 1 ? 'Sert eleştiri işe yaradı!' : 'Sert eleştiri bazı oyuncuları kırdı.'; if (CM.boost < 1) g.coach.conf = clr(g.coach.conf - 1, 0, 100); }
  CM.talked = 1; draw();
}
function cmTac(t) { if (!CM || CM.h !== 1) return; CM.tac = t; toast(`İkinci yarı: ${TACT[t].n}`); draw(); }
function cmSub() { if (!CM || CM.h !== 1 || CM.subbed) return; CM.subbed = 1; CM.a += .8 + (g.coach.rot === 2 ? .4 : 0); CM.subT = 'Taze bacaklar oyuna girdi.'; draw(); }
function cmSecond() { if (!CM) return; cmHalf(CM, 1, CM.tac); CM.h = 2; CM.res = cmFinish(CM); draw(); }
function cmDone() { if (!CM || !CM.res) return; cmApply(CM.e, CM.info, CM.res); g.wq.shift(); CM = null; scr = 'game'; sv(); draw(); }
function cmQuickBtn() { const m = nextWeekMatch(); if (!m) return; const r = cmQuick(m.e, m.info); cmApply(m.e, m.info, r); g.wq.shift(); sv(); draw(); }

/* ---------- Sezon sonu ---------- */
function coachSeasonEnd() {
  const C = g.coach, T = sortT(g.lg.teams), pos = T.findIndex(x => x.id === C.id) + 1, t0 = g.lg.t;
  const res = C.obj.map(o => ({ n: o.n, st: objState(o) }));
  let s = `${pos}. sırada bitirdin.`, met = 0, tot = 0;
  C.obj.forEach((o, i) => { tot += o.w; if (res[i].st.ok > 0) met += o.w; });
  if (pos === 1) { C.t++; s += t0 === 1 ? ' 🏆 ŞAMPİYON!' : ' Lig şampiyonu!'; g.crep = (g.crep || 0) + (t0 === 1 ? 12 : 5); g.hap += 10; if (C.bonusT) { money(C.bonusT, 'Şampiyonluk primi'); s += ` Şampiyonluk primi ${fm(C.bonusT)}.`; } }
  const score = tot ? met / tot : .5;
  C.conf = clr(C.conf + (score - .5) * 40, 0, 100);
  g.crep = Math.max(0, (g.crep || 0) + (score - .4) * 6 + 1);
  closeSeason();
  const c = club(C.id); if (c.t < t0) { s += ' Takım üst lige çıktı!'; crepAdd(5, 'şampiyonluk ya da terfi'); } if (c.t > t0) { s += ' Küme düştünüz.'; C.conf -= 25; crepAdd(-8, 'küme düşme'); }
  const prize = seasonPrize(pos, T.length, t0); if (prize) s += ` Sıralama primi ${fm(prize)} bütçeye eklenecek.`;
  if (pos >= T.length - 2 && c.t === t0) crepAdd(-3, 'kümede zor kalış'); cwYear();
  C.s++; C.hist.unshift({ y: g.season, n: C.n, r: s + ` Hedefler: %${Math.round(score * 100)}` });
  L(`Teknik direktör sezonu: ${s}`);
  const out = { lines: [s, ...res.map(r => `${r.st.ok > 0 ? '✔' : r.st.ok < 0 ? '✘' : '•'} ${r.n} — ${r.st.cur}`)] };
  (g.sq[C.id] || []).forEach(p => { p.ap = 0; p.g = 0; });
  yearTick(out); if (g.licYr && (g.licP || 0) >= LIC_N[g.lic + 1]) licDone();
  C.yrs--;
  if (g.ended) { }
  else if (!C.own && C.conf < 30) { out.lines.push('Yönetim sözleşmeni feshetti.'); coachLeave('Sözleşme feshedildi', 1); }
  else if (C.yrs <= 0 && !C.own) {
    if (C.conf >= 45) { C.yrs = R(1, 3); C.sal = Math.round(C.sal * (C.conf > 70 ? 1.25 : 1.05)); out.lines.push(`Sözleşmen ${C.yrs} yıl uzatıldı, yeni maaş ${fm(C.sal)}.`); }
    else { out.lines.push('Sözleşmen sona erdi; yönetim yenilemedi.'); coachLeave('Sözleşme bitti', 0); }
  }
  if (g.coach && C.own && ownById(C.id)) C.bud = ownById(C.id).bud;
  else if (g.coach) { C.bud = Math.round(C.bud * .5 + Math.pow(c.s / 60, 6) * [0, 3000, 500, 90][c.t] * cinfo(C.ct).e + prize); C.fat = 0; C.askB = 0; C.inc = 0; }
  g.lastSeason = out; g.season++; g.week = 1; g.cal = []; g.lg = null; g.cup = null; g.euro = null; g.en = enMax(); g.wa = {};
  if (g.coach) { setupSeason(); mkObjectives(); }
  scr = 'season'; g.seasonPending = 1; sv(); draw();
}
function coachQuit() { ask('Görevinden istifa etmek istediğine emin misin? Tazminat alamazsın.', () => { L(`${cname(g.coach.id)} görevinden istifa ettin.`); coachLeave('İstifa', 0); tab = 'coach'; sv(); draw(); }); }

/* ---------- Soyunma odası kararları ---------- */
function cevText() {
  const C = g.coach, e = g.cev; if (!e || !C) return null; const q = e.pid ? (g.sq[C.id] || []).find(x => x.id === e.pid) : null;
  if (e.k === 'ult') return { t: `Yönetim kurulu toplandı: “Sonraki 3 maçta en az 4 puan istiyoruz, yoksa yollar ayrılır.”`, c: [['Anlaşıldı, takımı toparlayacağım']] };
  if (!q) { g.cev = null; return null; }
  if (e.k === 'star') return { t: `${pname(q)} (güç ${q.r}) oynamadığı için mutsuz ve basına konuşmaya hazırlanıyor.`, c: [['İlk 11’e alacağım (söz ver)'], ['Formayı hak etmeli'], ['Satış listesine koy']] };
  if (e.k === 'ren') return { t: `${pname(q)} sözleşmesinin bitmek üzere olduğunu söylüyor ve %30 zam istiyor (şimdi ${fm(q.wage)}/yıl).`, c: [['Zammı ver, 3 yıl uzat'], ['%10 öner'], ['Reddet, giderse gitsin']] };
  if (e.k === 'disiplin') return { t: `${pname(q)} antrenmana geç kaldı ve kaptanla tartıştı.`, c: [['Para cezası ver'], ['Kadro dışı bırak (1 hafta)'], ['Görmezden gel']] };
  return null;
}
function cevAnswer(i) {
  const C = g.coach, e = g.cev; g.cev = null; if (!C || !e) return draw(); const q = e.pid ? (g.sq[C.id] || []).find(x => x.id === e.pid) : null;
  if (e.k === 'star' && q) { if (i === 0) { q.mor = 70; q.force = 1; L(`${pname(q)} ilk 11 sözü aldı.`); } else if (i === 1) { q.mor = clr((q.mor == null ? 65 : q.mor) - 10, 0, 100); C.harm = clr(C.harm - 4, 0, 100); if (Math.random() < .5) { L(`${pname(q)} basına konuştu: “Teknik direktör bana güvenmiyor.”`); C.conf = clr(C.conf - 3, 0, 100); } } else { C.sell = C.sell || []; if (!C.sell.includes(q.id)) C.sell.push(q.id); L(`${pname(q)} transfer listesinde.`); } }
  if (e.k === 'ren' && q) { if (i === 0) { q.wage = Math.round(q.wage * 1.3); q.yrs = 3; q.mor = 80; L(`${pname(q)} 3 yıl daha imzaladı.`); } else if (i === 1) { if (Math.random() < .45) { q.wage = Math.round(q.wage * 1.1); q.yrs = 3; L(`${pname(q)} %10 zamla kaldı.`); } else { q.mor = clr((q.mor == null ? 65 : q.mor) - 20, 0, 100); L(`${pname(q)} teklifi küçümsedi; sezon sonunda gidecek.`); } } else { q.mor = clr((q.mor == null ? 65 : q.mor) - 25, 0, 100); C.harm = clr(C.harm - 3, 0, 100); L(`${pname(q)} ile anlaşamadınız.`); } }
  if (e.k === 'disiplin' && q) { if (i === 0) { C.harm = clr(C.harm + 2, 0, 100); q.mor = clr((q.mor == null ? 65 : q.mor) - 5, 0, 100); } else if (i === 1) { q.out = 1; q.outW = g.week + 1; C.harm = clr(C.harm + 4, 0, 100); q.mor = clr((q.mor == null ? 65 : q.mor) - 15, 0, 100); recalcStr(C.id); } else C.harm = clr(C.harm - 4, 0, 100); }
  sv(); draw();
}

/* ---------- Teknik direktör sözleşme pazarlığı ---------- */
const CNEGK = [
  { k: 'sal', n: 'Yıllık maaş', step: o => Math.max(1, Math.round(o.sal * .06)), fmt: v => fm(v) },
  { k: 'yrs', n: 'Sözleşme süresi', step: () => 1, fmt: v => v + ' yıl', min: 1, max: 4 },
  { k: 'bud', n: 'Transfer bütçesi', step: o => Math.max(5, Math.round(o.bud * .1)), fmt: v => fm(v) },
  { k: 'bonusT', n: 'Şampiyonluk primi', step: o => Math.max(1, Math.round(o.sal * .1)), fmt: v => fm(v) },
  { k: 'comp', n: 'Kovulma tazminatı (kalan maaşın)', step: () => .1, fmt: v => '%' + Math.round(v * 100), min: .1, max: 1 },
];
function cnegoOpen(i) {
  const o = (g.cof || [])[i]; if (!o) return; const want = cl((coachRep() - (o.s - 55) * 1.6) / 30, 0, 1);
  const base = { sal: o.sal, yrs: o.yrs, bud: o.bud, bonusT: o.bonusT || 0, comp: o.comp || .4 };
  const max = { sal: Math.round(o.sal * (1.05 + want * .4)), yrs: Math.min(4, o.yrs + (want > .5 ? 1 : 0)), bud: Math.round(o.bud * (1.05 + want * .35)), bonusT: Math.round((o.bonusT || 0) * (1.2 + want)), comp: Math.min(1, (o.comp || .4) + .1 + want * .3) };
  g.cnego = { oi: i, dem: { ...base }, base, max, pat: 100, round: 0, log: [`Başkan masaya oturdu: “${want > .6 ? 'Sizi gerçekten istiyoruz.' : 'Teklifimiz ortada, hocam.'}”`] };
  scr = 'cnego'; sv(); draw();
}
function cnegoAdj(k, d) { const N = g.cnego; if (!N) return; const o = g.cof[N.oi], def = CNEGK.find(x => x.k === k); let v = N.dem[k] + d * def.step(o); if (def.min != null) v = cl(v, def.min, def.max); N.dem[k] = k === 'comp' ? Math.round(Math.max(0, v) * 10) / 10 : Math.max(0, Math.round(v)); sv(); draw(); }
function cnegoSubmit() {
  const N = g.cnego; if (!N) return; N.round++; let over = 0, spend = 0;
  CNEGK.forEach(d => { const b = N.base[d.k], m = N.max[d.k], v = N.dem[d.k]; if (v > m) over += (v - m) / Math.max(.1, m - b || m * .2 || 1); else if (v > b) spend += (v - b) / Math.max(.1, m - b || 1); });
  if (!over && spend <= 3.2) { N.done = 1; N.log.unshift('Başkan: “Tamam hocam, anlaştık.”'); sv(); draw(); return; }
  N.pat = clr(N.pat - cl(10 + over * 16 + (spend > 3.2 ? 10 : 0), 10, N.round <= 1 ? 35 : 55), 0, 100);
  if (N.pat <= 0) { N.done = -1; N.log.unshift('Başkan: “Başka bir isimle devam edeceğiz.”'); const o = g.cof[N.oi]; if (o) o.gone = 1; sv(); draw(); return; }
  CNEGK.forEach(d => { const m = N.max[d.k]; if (N.dem[d.k] > m) N.dem[d.k] = m; });
  N.log.unshift(`Başkan: “${over > 1.5 ? P(['Bu şartlar kulübü batırır.', 'Çok uzaktayız hocam.']) : P(['Biraz daha yaklaşın.', 'Bir iki kalemde zorlanıyoruz.'])} Karşı teklifimizi yazdık.”`); sv(); draw();
}
function cnegoSign() { const N = g.cnego; if (!N) return; const o = g.cof[N.oi]; if (!o || o.gone) { g.cnego = null; scr = 'game'; return draw(); } if (N.done === 1) Object.assign(o, N.dem); g.cnego = null; scr = 'game'; coachSign(N.oi); }
function cnegoLeave() { g.cnego = null; scr = 'game'; tab = 'coach'; sv(); draw(); }

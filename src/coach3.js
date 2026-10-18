/* ============================================================
   MİRAS FC — TEKNİK DİREKTÖRLÜK 3: derinlik
   - Rakip analizi ve maç planı (taş-kâğıt-makas: doğru plan kazandırır)
   - Canlı maç: 15'er dakikalık bölümler, bağırma, oyuncu değişikliği,
     taktik değişimi, devre arası konuşması, momentum, kart ve sakatlık
   - Antrenman programı ve taktik uyumu
   - Oyuncularla birebir konuşma, kişilikler, kaptanlık, verilen sözler
   - Transfer pazarlığı (bonservis + maaş), kiralık
   - Yönetim felsefesi, Yılın Teknik Direktörü, kupa dolabı
   - Milli takım teknik direktörlüğü
   ============================================================ */

/* ---------- Rakip profili ve maç planı ---------- */
const OSTY = {
  kanat: { n: 'Kanat ağırlıklı', d: 'Kanatlardan orta ve bindirmeyle gelir.', good: { hat: 'orta', pres: 1 }, bad: { hat: 'yuksek' } },
  uzun: { n: 'Uzun top', d: 'Savunmanın arkasına uzun toplar atar.', good: { hat: 'derin' }, bad: { hat: 'yuksek', pres: 2 } },
  pres: { n: 'Ön alan presi', d: 'Topu kaptığı yerde bitirmek ister.', good: { tac: 'kontra', hat: 'derin' }, bad: { tac: 'topa' } },
  kontra: { n: 'Kontra atak', d: 'Bekler, topu kazanınca hızla çıkar.', good: { tac: 'topa', hat: 'orta' }, bad: { tac: 'hucum', hat: 'yuksek' } },
  topa: { n: 'Topa sahip olma', d: 'Sabırlı pas oyunu, oyunu uyutur.', good: { pres: 2, tac: 'pres' }, bad: { pres: 0, tac: 'savunma' } },
  otobus: { n: 'Otobüsü çeker', d: 'Derinde bekler, beraberliğe oynar.', good: { tac: 'hucum' }, bad: { tac: 'savunma' } },
};
const HAT = { derin: 'Derin', orta: 'Orta', yuksek: 'Yüksek' }, PRES = ['Düşük', 'Orta', 'Yüksek'], SIDES = { sol: 'Sol kanat', merkez: 'Merkez', sag: 'Sağ kanat' };
const PKN = { tac: 'Oyun anlayışı', hat: 'Savunma hattı', pres: 'Pres' };
const pkv = (k, v) => k === 'tac' ? TACT[v].n : k === 'hat' ? HAT[v] : PRES[v];
function oppProfile(oid) {
  const rnd = srng(hash(oid + ':op:' + g.season)), ks = Object.keys(OSTY), st = ks[Math.floor(rnd() * ks.length)], weak = ['sol', 'merkez', 'sag'][Math.floor(rnd() * 3)];
  const key = squad(oid).filter(p => p.p !== 'GK').sort((a, b) => b.r - a.r)[0];
  return { st, weak, key: key ? { n: pname(key), r: key.r, p: key.p } : null };
}
function planOf() { const C = g.coach; if (!C) return {}; C.plan = C.plan || { hat: 'orta', pres: 1, side: 'merkez', mark: 0 }; return C.plan; }
function setPlan(k, v) { const p = planOf(); if ((k === 'hat' && !HAT[v]) || (k === 'pres' && PRES[v] == null) || (k === 'side' && !SIDES[v])) return; if (k === 'mark') v = v ? 1 : 0; p[k] = v; if (k === 'pres') toast(`Pres: ${PRES[v]}`); sv(); draw(); }
function prepMod(info, tac) {
  const C = g.coach; if (!C || !info || !info.oid || !club(info.oid)) return { us: 1, th: 1, hits: 0, miss: 0 };
  const P0 = { ...planOf(), tac: tac || C.tac }, O = oppProfile(info.oid), S0 = OSTY[O.st]; let us = 1, th = 1, hits = 0, miss = 0;
  for (const k in S0.good) if (P0[k] === S0.good[k]) { us *= 1.035; th *= .965; hits++; }
  for (const k in S0.bad) if (P0[k] === S0.bad[k]) { us *= .97; th *= 1.045; miss++; }
  if (P0.side !== 'merkez') { if (P0.side === O.weak) { us *= 1.045; hits++; } else us *= .985; }
  if (P0.mark && O.key) { th *= .965; us *= .985; }
  us *= [.97, 1, 1.035][P0.pres]; th *= [1.02, 1, .975][P0.pres];
  return { us, th, hits, miss, O };
}
/* analist seviyesine göre ne kadarını görürsün */
function scoutReport(info) {
  const C = g.coach, lv = (C.staff || {}).ana || 0, O = oppProfile(info.oid), S0 = OSTY[O.st], lines = [`Oyun tarzı: ${S0.n} — ${S0.d}`];
  const good = Object.entries(S0.good), bad = Object.entries(S0.bad);
  if (lv >= 1 && good[0]) lines.push(`Öneri: ${PKN[good[0][0]]} → ${pkv(good[0][0], good[0][1])}`);
  if (lv >= 2) { good.slice(1).forEach(([k, v]) => lines.push(`Öneri: ${PKN[k]} → ${pkv(k, v)}`)); bad.forEach(([k, v]) => lines.push(`Kaçın: ${PKN[k]} → ${pkv(k, v)}`)); }
  if (lv >= 3) lines.push(`Zayıf bölge: ${SIDES[O.weak]}${O.key ? ` · Tehlikeli isim: ${O.key.n} (${O.key.r})` : ''}`);
  if (lv < 3) lines.push(lv ? 'Daha fazla ayrıntı için maç analistini geliştir (Ekip).' : 'Maç analisti tutarsan rakibin zaafları ortaya çıkar (Ekip).');
  return { O, S0, lines };
}

/* ---------- Antrenman programı ---------- */
const TRN = { taktik: { n: 'Taktik çalışma', d: 'Taktik uyumu hızla artar' }, fizik: { n: 'Kondisyon', d: 'Yorgunluk ve sakatlık azalır' }, duran: { n: 'Duran toplar', d: 'Korner ve frikiklerden gol' }, bitir: { n: 'Bitiricilik', d: 'Hücum etkinliği artar' }, savunma: { n: 'Savunma organizasyonu', d: 'Daha az gol yersin' }, genc: { n: 'Gençlere özel', d: '21 yaş altı hızlı gelişir' } };
function setTrn(k) { const C = g.coach; if (!C || !TRN[k]) return; C.trn = k; toast(`Antrenman: ${TRN[k].n}`); sv(); draw(); }
function trnWeek() {
  const C = g.coach; if (!C) return; C.trn = C.trn || 'taktik'; C.tf = C.tf == null ? 55 : C.tf;
  C.tf = clr(C.tf + (C.trn === 'taktik' ? 6 : 1.5) - (C.fat > 18 ? 1 : 0), 0, 100);
  if (C.trn === 'fizik') C.fat = Math.max(0, C.fat - 1.5);
  if (C.trn === 'genc') (g.sq[C.id] || []).forEach(p => { if (p.age <= 21 && p.r < p.pot && Math.random() < .2) p.r++; });
}
function trnMod() { const C = g.coach; if (!C) return { us: 1, th: 1 }; const tf = C.tf == null ? 55 : C.tf; return { us: (1 + (tf - 60) / 700) * (C.trn === 'bitir' ? 1.025 : C.trn === 'duran' ? 1.02 : 1), th: (1 - (tf - 60) / 900) * (C.trn === 'savunma' ? .97 : 1) }; }
const _setTac = setTac; setTac = function (t) { const C = g.coach; if (C && C.tac !== t) C.tf = Math.max(25, (C.tf == null ? 55 : C.tf) - 30); _setTac(t); };
const _cmMods = cmMods; cmMods = function (info, tac) { const m = _cmMods(info, tac), p = prepMod(info, tac), t = trnMod(); return { us: m.us * p.us * t.us, th: m.th * p.th * t.th }; };

/* ---------- Oyuncularla birebir ---------- */
const PERS = { lider: 'Lider', hirsli: 'Hırslı', hassas: 'Hassas', pro: 'Profesyonel', asi: 'Asi' };
const persOf = q => q.pers || (q.pers = P(['pro', 'pro', 'hirsli', 'hassas', 'lider', 'asi']));
const TALK = {
  ov: { n: 'Öv', d: 'Güven ver', e: { lider: 6, hirsli: 4, hassas: 9, pro: 3, asi: 2 } },
  el: { n: 'Eleştir', d: 'Daha fazlasını iste', e: { lider: 5, hirsli: 6, hassas: -12, pro: 2, asi: -7 } },
  soz: { n: 'Forma sözü ver', d: '6 hafta içinde en az 3 maç', e: { lider: 8, hirsli: 10, hassas: 8, pro: 6, asi: 6 } },
  kapt: { n: 'Kaptan yap', d: 'Takımın sesi olsun', e: { lider: 12, hirsli: 8, hassas: 4, pro: 6, asi: 3 } },
};
function pTalk(pid, k) {
  const C = g.coach; if (!C) return; const q = (g.sq[C.id] || []).find(x => x.id === pid), T0 = TALK[k]; if (!q || !T0) return;
  if (q.tk === g.tw) return toast(`${pname(q)} ile bu hafta zaten konuştun`); if ((g.en || 0) < 3) return toast('Konuşma için 3⚡ gerekli');
  g.en -= 3; q.tk = g.tw; const ps = persOf(q); let d = T0.e[ps];
  if (k === 'el' && ps === 'hirsli' && Math.random() < .35) d = -8;
  q.mor = clr((q.mor == null ? 65 : q.mor) + d, 0, 100);
  let msg = d >= 6 ? 'çok olumlu karşıladı' : d > 0 ? 'olumlu karşıladı' : 'kırıldı';
  if (k === 'soz') { q.force = 1; q.prom = { w: g.tw + 6, ap: q.ap || 0 }; }
  if (k === 'kapt') { const old = (g.sq[C.id] || []).find(x => x.id === C.capt); if (old && old.id !== q.id) { old.mor = clr((old.mor || 65) - 8, 0, 100); L(`${pname(old)} kaptanlık bandını kaybettiği için üzgün.`); } C.capt = q.id; C.harm = clr((C.harm || 60) + (ps === 'lider' ? 6 : ps === 'asi' ? -3 : 2), 0, 100); }
  if (k === 'el' && ps === 'asi' && Math.random() < .25) { msg += ' ve basına konuştu'; C.conf = clr(C.conf - 2, 0, 100); }
  C.harm = Math.round(((C.harm || 60) * 4 + q.mor) / 5);
  L(`${pname(q)} ile konuştun (${T0.n}): ${msg}.`); toast(`${pname(q)}: ${msg}`); sv(); draw();
}
function promiseWeek() {
  const C = g.coach; if (!C) return;
  (g.sq[C.id] || []).forEach(q => { if (!q.prom || g.tw < q.prom.w) return; const kept = (q.ap || 0) - q.prom.ap >= 3; q.prom = null; q.force = 0;
    if (kept) { q.mor = clr((q.mor || 65) + 8, 0, 100); L(`${pname(q)}'e verdiğin forma sözünü tuttun.`); }
    else { q.mor = clr((q.mor || 65) - 25, 0, 100); C.harm = clr((C.harm || 60) - 6, 0, 100); L(`${pname(q)}'e verdiğin sözü tutmadın; soyunma odasında güven sarsıldı.`); } });
}

/* ---------- Yönetim felsefesi ---------- */
const PHIL = { genc: { n: 'Gençlere şans', d: 'Altyapıdan oyuncu oynatmak güven kazandırır' }, hucum: { n: 'Hücum futbolu', d: 'Bol gollü galibiyetler güven kazandırır' }, mali: { n: 'Mali disiplin', d: 'Maaş bütçesini aşmamak önemli' }, basari: { n: 'Hemen başarı', d: 'Sonuç her şeydir: galibiyet ve yenilgi çok sert yansır' } };
const _coachSign = coachSign; coachSign = function (i) {
  const o = (g.cof || [])[i]; _coachSign(i);
  const C = g.coach; if (C && o && C.id === o.id && !C.phil) { C.phil = C.own ? null : P(Object.keys(PHIL)); C.wb0 = wageBill(C.id); C.trn = 'taktik'; C.tf = 50; if (C.phil) L(`${clubName(C.n)} yönetim felsefesi: ${PHIL[C.phil].n}.`); sv(); }
};
const _cmApply = cmApply; cmApply = function (e, info, res) {
  _cmApply(e, info, res); const C = g.coach; if (!C) return;
  const us = res.sc[0];
  if (C.phil === 'hucum') C.conf = clr(C.conf + (res.win && us >= 2 ? .8 : 0) - (C.tac === 'savunma' ? .5 : 0), 0, 100);
  if (C.phil === 'basari') C.conf = clr(C.conf + (res.win ? .8 : res.draw ? -.4 : -1.2), 0, 100);
  if (C.phil === 'genc') { const xi = bestXI(C.id, C.form); if (xi.some(p => p.age <= 21)) C.conf = clr(C.conf + .4, 0, 100); }
  if (C.phil === 'mali' && C.wb0 && wageBill(C.id) > C.wb0 * 1.1) C.conf = clr(C.conf - .4, 0, 100);
  if (C.capt) { const k = (g.sq[C.id] || []).find(x => x.id === C.capt); if (k && persOf(k) === 'lider') C.harm = clr((C.harm || 60) + .3, 0, 100); }
};
const _coachWeekStart = coachWeekStart; coachWeekStart = function (auto) { _coachWeekStart(auto); if (g.coach && g.phase === 'coach') { trnWeek(); promiseWeek(); } };

/* ---------- Sezon sonu: ödüller, kupa dolabı, kiralıkların dönüşü ---------- */
const _coachSeasonEnd = coachSeasonEnd; coachSeasonEnd = function () {
  const C = g.coach; if (!C || !g.lg) return _coachSeasonEnd();
  const T = sortT(g.lg.teams), pos = T.findIndex(x => x.id === C.id) + 1, t0 = g.lg.t, cupW = g.cup && g.cup.won, euW = g.euro && g.euro.won, euN = g.euro && g.euro.n, cupN = g.cup && g.cup.n, lgN = tierName(g.lg.ct, t0), clubN = C.n, sea = g.season;
  let met = 0, tot = 0; C.obj.forEach(o => { tot += o.w; if (objState(o).ok > 0) met += o.w; }); const score = tot ? met / tot : .5;
  if (C.phil === 'mali') C.conf = clr(C.conf + (wageBill(C.id) <= (C.wb0 || 1e9) ? 6 : -5), 0, 100);
  g.sq[C.id] = (g.sq[C.id] || []).filter(p => { if (p.loanIn) { L(`${pname(p)} kiralık süresi bitti, kulübüne döndü.`); return false; } return true; });
  g.cab = g.cab || [];
  if (pos === 1) g.cab.push({ y: sea, k: '🏆', n: `${lgN} şampiyonu`, c: clubN });
  if (cupW) g.cab.push({ y: sea, k: '🏆', n: cupN, c: clubN });
  if (euW) g.cab.push({ y: sea, k: '🌍', n: euN, c: clubN });
  const awd = score >= .8 && (pos <= 3 || pos === 1 || cupW || euW) && Math.random() < .55 + (pos === 1 ? .3 : 0);
  if (awd) { g.cab.push({ y: sea, k: '🎖', n: `${g.lg.ct} Yılın Teknik Direktörü`, c: clubN }); crepAdd(5, 'Yılın Teknik Direktörü ödülü'); news(`${g.name} Yılın Teknik Direktörü seçildi.`); }
  _coachSeasonEnd();
  if (awd && g.lastSeason) g.lastSeason.lines.push('🎖 Yılın Teknik Direktörü seçildin!');
};

/* ---------- Transfer pazarlığı ve kiralık ---------- */
const clubAcceptP = f => cl((f - .72) / .42, .04, .97);
function playerAcceptP(x, w) { const C = g.coach, mine = club(C.id).s, th = club(x.from) ? club(x.from).s : mine; return cl(.42 + (mine - th) / 22 + (w - 1) * 2.4 + (cRep() - 30) / 200 + (g.euro ? .08 : 0), .06, .97); }
function trMarket() { const C = g.coach; return market(C.id, C.mk + ((C.staff || {}).scout || 0) * 7); }
function trPick(i) { const C = g.coach; if (!C) return; C.trSel = C.trSel === i ? null : i; sv(); draw(); }
function trOffer(i, f, w) {
  const C = g.coach; if (!C) return; if (!windowOpen()) return toast('Transfer dönemi kapalı (1-4. ve 22-25. haftalar)');
  const x = trMarket()[i]; if (!x) return; C.trT = C.trT || {}; const key = x.n + ':' + g.season + ':' + g.week; if (C.trT[key]) return toast('Bu oyuncu için bu hafta zaten teklif yaptın');
  const fee = Math.round(x.fee * f); if (C.bud < fee) return toast(`Bütçe yetmiyor: ${fm(fee)} gerekli`); C.trT[key] = 1;
  if (Math.random() > clubAcceptP(f)) { L(`${cname(x.from)}, ${pname(x)} için ${fm(fee)} teklifini reddetti.`); toast(`${cname(x.from)} reddetti; daha yüksek teklif ister`); sv(); return draw(); }
  if (Math.random() > playerAcceptP(x, w)) { L(`${pname(x)} kulübüne gelmek istemedi.`); toast(`${pname(x)} teklifini geri çevirdi`); sv(); return draw(); }
  const buy = { ...x, fee, wage: Math.round(x.wage * w) }; if (buyPlayer(C.id, buy, C)) { C.mk++; C.trSel = null; C.conf = clr(C.conf + 1, 0, 100); recheckObj(); toast(`${pname(x)} imzaladı!`); }
  sv(); draw();
}
function trLoan(i) {
  const C = g.coach; if (!C) return; if (!windowOpen()) return toast('Transfer dönemi kapalı (1-4. ve 22-25. haftalar)');
  const x = trMarket()[i]; if (!x) return; C.trT = C.trT || {}; const key = 'L' + x.n + ':' + g.season; if (C.trT[key]) return toast('Bu oyuncuyu bu sezon zaten kiralamak istedin'); C.trT[key] = 1;
  const from = club(x.from), p = cl((from ? (from.s + 2 - x.r) / 10 : .4) + .25 + (club(C.id).s - (from ? from.s : 70)) / 40, .05, .8);
  if (Math.random() > p) { toast(`${cname(x.from)} kiralamaya yanaşmadı`); L(`${cname(x.from)}, ${pname(x)} için kiralık talebini reddetti.`); sv(); return draw(); }
  const list = ensureSquad(C.id), pl = { id: newPid(), n: x.n, real: x.real, p: x.p, r: x.r, age: x.age, pot: x.pot || x.r, wage: Math.round(x.wage * .5), yrs: 1, num: 0, inj: 0, loanIn: 1 }; pl.num = freeNum(list, pl.p); list.push(pl); recalcStr(C.id);
  L(`${pname(x)} sezon sonuna kadar kiralandı (maaşının yarısını sen ödüyorsun).`); news(`${pname(x)} kiralık olarak ${clubName(club(C.id).n)} yolunda.`); toast(`${pname(x)} kiralandı`); C.trSel = null; sv(); draw();
}

/* ---------- Canlı maç ---------- */
const SHOUT = { one: { n: 'Öne çık!', us: 1.16, th: 1.12, mom: 6 }, tut: { n: 'Topu tut, sakin', us: .88, th: .84, mom: -2 }, kanat: { n: 'Kanatları kullan', us: 1.06, th: 1, mom: 3 }, sert: { n: 'Sert oyna', us: 1.02, th: .94, mom: 4, card: 1 }, ates: { n: 'Takımı ateşle', us: 1.08, th: .98, mom: 9 } };
let LM = null;
function lmStart() {
  const m = nextWeekMatch(); if (!m) return; const C = g.coach;
  LM = cmNew(m.e, m.info); LM.tac = C.tac; LM.seg = 0; LM.mom = 0; LM.xi = bestXI(C.id, C.form).map(p => p.id); LM.subs = 0; LM.maxS = 5; LM.fresh = 0; LM.red = 0; LM.ored = 0; LM.used = {};
  const pm = prepMod(m.info, C.tac); LM.log = [{ m: 0, t: `Başlama düdüğü. ${pm.hits ? `Planın rakibe uyuyor (${pm.hits} doğru hamle).` : pm.miss ? 'Plan rakibin oyununa ters olabilir.' : ''}`, k: 'mut' }];
  scr = 'lmatch'; draw();
}
function lmOn() { const C = g.coach, sq = g.sq[C.id] || []; return LM.xi.map(id => sq.find(p => p.id === id)).filter(Boolean); }
function lmBench() { const C = g.coach, set = new Set(LM.xi); return (g.sq[C.id] || []).filter(p => !set.has(p.id) && !p.inj && !p.out && !(LM.offIds || []).includes(p.id)).sort((a, b) => b.r - a.r).slice(0, 9); }
function lmSeg() {
  const m = LM; if (!m || m.res) return; const C = g.coach, s = m.seg, md = cmMods(m.info, m.tac), wm = WXM[m.info.wx || 'acik'] || 1, sh = SHOUT[m.shout] || { us: 1, th: 1, mom: 0 };
  const tired = s >= 4 ? (C.fat || 0) * .03 + (s - 3) * .25 : 0, a = m.a + m.fresh - m.red * 3.5 - tired + (m.ored * 3.5), push = m.oppPush ? 1.12 : 1;
  const lu = xg(a, m.b) * md.us * wm * m.boost * sh.us * (1 + m.mom / 220) / 6, lt = xg(m.b, a) * md.th * wm * sh.th * push * (1 - m.mom / 260) / 6;
  const gu = pois(lu), gt = pois(lt), m0 = s * 15, SL = [];
  for (let i = 0; i < gu; i++) { const on = lmOn().filter(p => p.p !== 'GK'), w = on.map(p => (p.p === 'FW' ? 3 : p.p === 'MF' ? 1.5 : .4) * p.r / 70); let r = Math.random() * w.reduce((x, y) => x + y, 0), pk = on[0]; for (let j = 0; j < on.length; j++) { r -= w[j]; if (r <= 0) { pk = on[j]; break; } } const mn = m0 + R(1, 15); m.ev.push({ m: mn, s: 0, p: pk ? pname(pk) : '', pid: pk && pk.id }); SL.push({ m: mn, t: `⚽ GOL! ${pk ? pname(pk) : ''}`, k: 'good' }); }
  for (let i = 0; i < gt; i++) { const mn = m0 + R(1, 15); m.ev.push({ m: mn, s: 1, p: '' }); SL.push({ m: mn, t: `⚽ ${m.info.on} golü`, k: 'bad' }); }
  m.ev.sort((x, y) => x.m - y.m); m.sc = [m.ev.filter(x => !x.s).length, m.ev.filter(x => x.s).length];
  /* olaylar */
  const ev = [];
  if (!gu && !gt) ev.push(P(lu > lt ? ['Baskı sizde, rakip kendi yarı alanına gömüldü.', 'Bir şut direği yaladı!', 'Kaleci son anda çeldi.', 'Orta sahada topu çeviren siz oldunuz.'] : ['Rakip baskı kuruyor.', 'Kalecin iki kritik kurtarış yaptı.', 'Savunma zor anlar yaşadı.', 'Oyun ortada kilitlendi.']));
  if (Math.random() < .03 + (sh.card ? .06 : 0)) { if (Math.random() < .2) { m.red++; ev.push('🟥 Kırmızı kart! 10 kişi kaldınız.'); } else ev.push('🟨 Sarı kart; oyuncun dikkatli olmalı.'); }
  if (Math.random() < .025) { m.ored++; ev.push('🟥 Rakipten kırmızı kart! Sayısal üstünlük sizde.'); }
  if (Math.random() < .035) { const on = lmOn().filter(p => p.p !== 'GK'); const q = P(on); if (q) { m.injP = q.id; ev.push(`🚑 ${pname(q)} sakatlandı! Değişiklik yapmalısın.`); } }
  if (s >= 3 && m.sc[1] < m.sc[0] && !m.oppPush) { m.oppPush = 1; ev.push('Rakip hücuma döndü; arkada boşluk bırakıyor.'); }
  ev.forEach(t => SL.push({ m: m0 + R(2, 14), t, k: t.includes('🟥') || t.includes('🚑') ? 'bad' : 'mut' }));
  SL.sort((x, y) => x.m - y.m).forEach(x => m.log.unshift(x));
  m.mom = cl(m.mom * .6 + (gu - gt) * 18 + (lu - lt) * 25 + sh.mom + (Math.random() - .5) * 10, -50, 50);
  m.seg++; m.shout = null; if (m.seg === 3) m.log.unshift({ m: 45, t: `Devre: ${m.sc[0]}-${m.sc[1]}`, k: 'mut' });
  if (m.seg >= 6) { m.res = cmFinish(m); m.log.unshift({ m: 90, t: `Maç bitti: ${m.sc[0]}-${m.sc[1]}${m.res.pens ? ` (pen. ${m.res.pens[0]}-${m.res.pens[1]})` : ''}`, k: m.res.win ? 'good' : m.res.draw ? 'mut' : 'bad' }); }
  draw();
}
function lmShout(k) { if (!LM || LM.res || LM.shout) return; LM.shout = k; toast(SHOUT[k].n); draw(); }
function lmTac(t) { if (!LM || LM.res) return; LM.tac = t; toast(`Taktik: ${TACT[t].n}`); draw(); }
function lmTalk(k) { if (!LM || LM.seg !== 3 || LM.talked) return; const r = Math.random(), h = (g.coach.harm || 60) / 100;
  if (k === 'motive') { LM.boost = r < .5 + h * .3 ? 1.15 : .95; LM.talk = LM.boost > 1 ? 'Soyunma odası ateşlendi!' : 'Konuşma ters tepti, oyuncular gergin.'; }
  if (k === 'sakin') { LM.boost = 1.05; LM.talk = 'Sakin konuştun; takım planına sadık.'; }
  if (k === 'sert') { LM.boost = r < .35 + h * .25 ? 1.25 : .86; LM.talk = LM.boost > 1 ? 'Sert eleştiri işe yaradı!' : 'Sert eleştiri bazı oyuncuları kırdı.'; if (LM.boost < 1) g.coach.harm = clr((g.coach.harm || 60) - 2, 0, 100); }
  LM.talked = 1; draw(); }
function lmOut(pid) { if (!LM || LM.res) return; LM.out = LM.out === pid ? null : pid; draw(); }
function lmSub(inId) {
  const m = LM, C = g.coach; if (!m || m.res || !m.out) return; if (m.subs >= m.maxS) return toast('Değişiklik hakkın bitti');
  const sq = g.sq[C.id] || [], o = sq.find(p => p.id === m.out), i = sq.find(p => p.id === inId); if (!o || !i) return;
  m.xi = m.xi.map(id => id === o.id ? i.id : id); m.offIds = (m.offIds || []).concat([o.id]); m.subs++;
  m.a += (i.r - o.r) / 11 + (m.seg >= 3 ? .3 : .1) * (m.fresh < 1.2 ? 1 : 0); m.fresh = Math.min(1.5, m.fresh + (m.seg >= 3 ? .15 : 0));
  if (m.injP === o.id) m.injP = null; m.out = null; m.showSubs = 0; m.log.unshift({ m: m.seg * 15, t: `🔁 ${pname(i)} oyuna girdi, ${pname(o)} çıktı.`, k: 'mut' }); draw();
}
function lmSimAll() { let k = 0; while (LM && !LM.res && k++ < 8) { if (LM.injP) { const b = lmBench()[0]; if (b) { LM.out = LM.injP; lmSub(b.id); } else LM.injP = null; } lmSeg(); } }
function lmDone() { if (!LM || !LM.res) return; const m = LM; (m.offIds || []).forEach(() => { }); cmApply(m.e, m.info, m.res); g.wq.shift(); LM = null; scr = 'game'; sv(); draw(); }
function lmatchUI() {
  const m = LM, i = m.info, C = g.coach, us = clubName(club(C.id).n), w = WX[i.wx || 'acik'], mn = m.res ? 90 : m.seg * 15;
  let h = `<div class="sb"><div class="sbc">${esc(i.comp)} · ${esc(i.round)} · ${w.i} ${w.n}</div><div class="sbr"><span class="tm">${clubKit(C.id)}${esc(i.home ? us : i.on)}</span><b class="sc">${i.home ? m.sc[0] : m.sc[1]} – ${i.home ? m.sc[1] : m.sc[0]}</b><span class="tm r">${esc(i.home ? i.on : us)}</span></div><div class="sbc">${m.res ? 'Maç sonu' + (m.res.pens ? ` · pen. ${m.res.pens[0]}-${m.res.pens[1]}` : '') : mn === 45 ? 'Devre arası' : mn + "'"}</div></div>`;
  h += `<div class="card"><div class="prow"><span>Momentum</span><div class="mom"><i style="left:${50 + m.mom}%"></i></div><b>${m.mom > 8 ? 'Siz' : m.mom < -8 ? 'Rakip' : '—'}</b></div><div class="m">${TACT[m.tac].n} · Pres ${PRES[planOf().pres]} · Hat ${HAT[planOf().hat]} · Değişiklik ${m.subs}/${m.maxS}${m.red ? ` · <span class="neg">${10 - m.red + 1} kişi</span>` : ''}</div></div>`;
  h += `<div class="feed">${m.log.slice(0, 14).map(x => `<div class="fi ${x.k}"><b>${x.m}'</b> ${esc(x.t)}</div>`).join('')}</div>`;
  if (m.res) return h + `<div class="card"><p class="lead">${m.res.win ? 'Kazandınız!' : m.res.draw ? 'Berabere.' : 'Kaybettiniz.'}</p><button class="btn big" onclick="lmDone()">Devam</button></div>`;
  let c = '';
  if (m.seg === 3 && !m.talked) c += `<div class="eyebrow gold">Devre arası konuşması</div><div class="opts"><button class="opt" onclick="lmTalk('motive')"><b>Motive et</b><span>Genelde işe yarar</span></button><button class="opt" onclick="lmTalk('sakin')"><b>Sakin kal, plana güven</b><span>Küçük ama güvenli etki</span></button><button class="opt" onclick="lmTalk('sert')"><b>Sert eleştir</b><span>Büyük etki ya da ters tepki</span></button></div>`;
  else if (m.talk && m.seg === 3) c += `<p class="m note">${esc(m.talk)}</p>`;
  if (m.injP) c += `<div class="warn">Sakatlık! Önce çıkacak oyuncu seçili; yedeklerden birini oyuna al.</div>`;
  c += `<div class="eyebrow">Kenardan talimat ${m.shout ? '· ' + SHOUT[m.shout].n : ''}</div><div class="chips">${Object.entries(SHOUT).map(([k, s]) => `<button class="chip ${m.shout === k ? 'on' : ''} ${m.shout && m.shout !== k ? 'dis' : ''}" onclick="lmShout('${k}')">${s.n}</button>`).join('')}</div>`;
  c += `<div class="eyebrow">Oyun anlayışı</div><div class="chips">${Object.entries(TACT).map(([k, t]) => `<button class="chip ${m.tac === k ? 'on' : ''}" onclick="lmTac('${k}')">${t.n}</button>`).join('')}</div>`;
  const out = m.out || m.injP; if (m.injP && !m.out) m.out = m.injP;
  if (!m.showSubs && !m.injP) c += `<button class="btn ghost" onclick="LM.showSubs=1;draw()">🔁 Oyuncu değişikliği (${m.subs}/${m.maxS})</button>`; else c += `<div class="eyebrow">Oyuncu değişikliği · ${m.subs}/${m.maxS}</div><div class="sq">${lmOn().map(p => `<div class="sqr ${m.out === p.id ? 'inxi' : ''}"><span class="sqp p-${p.p}">${p.p}</span><span class="sqn">${esc(pname(p))}${p.id === m.injP ? ' <span class="neg">🚑</span>' : ''}</span><b class="sqr-r">${p.r}</b><span class="sqa"><button class="mini" onclick="lmOut(${p.id})">${m.out === p.id ? '✓' : '⇄'}</button></span></div>`).join('')}</div>`;
  if (m.out && (m.showSubs || m.injP)) c += `<div class="m">Yerine girecek:</div><div class="chips">${lmBench().map(p => `<button class="chip" onclick="lmSub(${p.id})">${p.p} ${esc(short(pname(p)))} ${p.r}</button>`).join('') || '<span class="m">Yedek yok</span>'}</div>`;
  c += `<div class="actions"><button class="btn big" ${m.injP ? 'disabled' : ''} onclick="lmSeg()">${m.seg === 3 ? 'İkinci yarıyı başlat' : '15 dakika oynat'}</button><button class="btn ghost" onclick="lmSimAll()">Sonuna kadar</button></div>`;
  return h + `<div class="card">${c}</div>`;
}

/* ---------- Maç planı kartı ---------- */
function planCard(info) {
  const C = g.coach, P0 = planOf(), R0 = scoutReport(info), pm = prepMod(info, C.tac);
  return `<div class="card"><div class="eyebrow gold">Maç planı · ${esc(info.on)}</div>${R0.lines.map(l => `<div class="m">• ${esc(l)}</div>`).join('')}
  <div class="eyebrow">Oyun anlayışı</div><div class="chips">${Object.entries(TACT).map(([k, t]) => `<button class="chip ${C.tac === k ? 'on' : ''}" onclick="setTac('${k}')">${t.n}</button>`).join('')}</div>
  <div class="eyebrow">Savunma hattı</div><div class="chips">${Object.entries(HAT).map(([k, n]) => `<button class="chip ${P0.hat === k ? 'on' : ''}" onclick="setPlan('hat','${k}')">${n}</button>`).join('')}</div>
  <div class="eyebrow">Pres</div><div class="chips">${PRES.map((n, i) => `<button class="chip ${P0.pres === i ? 'on' : ''}" onclick="setPlan('pres',${i})">${n}</button>`).join('')}</div>
  <div class="eyebrow">Hücum yönü</div><div class="chips">${Object.entries(SIDES).map(([k, n]) => `<button class="chip ${P0.side === k ? 'on' : ''}" onclick="setPlan('side','${k}')">${n}</button>`).join('')}</div>
  ${R0.O.key ? `<div class="chips"><button class="chip ${P0.mark ? 'on' : ''}" onclick="setPlan('mark',${P0.mark ? 0 : 1})">${P0.mark ? '✓ ' : ''}${esc(R0.O.key.n)}'ı özel markaja al</button></div>` : ''}
  <div class="m">Taktik uyumu ${Math.round(C.tf == null ? 55 : C.tf)} · Antrenman: ${TRN[C.trn || 'taktik'].n}${(C.staff || {}).ana >= 2 ? ` · Plan değerlendirmesi: ${pm.hits - pm.miss > 0 ? '👍 rakibe uygun' : pm.hits - pm.miss < 0 ? '⚠ riskli' : 'nötr'}` : ''}</div></div>`;
}

/* ---------- Milli takım teknik direktörlüğü ---------- */
function ntjOfferMaybe() {
  if (g.ntj || g.coach || !(g.lic >= 3) || cRep() < 42 || Math.random() > .3) return;
  const all = COUNTRIES.map(c => c.n).concat(NATIONS.map(x => x[0])), tgt = 55 + cRep() * .35;
  const L2 = all.filter(ct => Math.abs(ntStr(ct) - tgt) < 7 && ct !== (g.ntLock || '')).sort(() => Math.random() - .5);
  if (!L2.length) return; const ct = L2[0]; g.ntjOf = { ct, sal: Math.round((40 + ntStr(ct) * 3) * 4 * (cinfo(g.ct).e || 1)) };
  L(`${ct} Futbol Federasyonu sana milli takım teknik direktörlüğü teklif etti.`);
}
function ntjSign() { const o = g.ntjOf; if (!o) return; g.ntj = { ct: o.ct, sal: o.sal, yrs: 4, conf: 60, start: g.season, w: 0, d: 0, l: 0, tr: [] }; g.ntjOf = null; L(`${o.ct} Milli Takımı'nın teknik direktörü oldun!`); news(`${o.ct} milli takımına yeni hoca: ${g.name}`); crepAdd(3, 'milli takım görevi'); sv(); draw(); }
function ntjReject() { g.ntjOf = null; sv(); draw(); }
function ntjQuit() { ask('Milli takım görevinden ayrılmak istiyor musun?', () => { L(`${g.ntj.ct} milli takımındaki görevini bıraktın.`); g.ntj = null; g.ntjT = null; sv(); draw(); }); }
const ntjTourName = ct => { const k = (COUNTRIES.find(c => c.n === ct) || {}).k || ((NATIONS.find(x => x[0] === ct) || [])[2]) || 'e'; return g.season % 4 === 2 ? 'Dünya Kupası' : ({ e: 'Avrupa Şampiyonası', s: 'Copa América', a: 'Asya Kupası', n: 'Gold Cup', f: 'Afrika Uluslar Kupası' }[k] || 'Kıta Kupası'); };
/* yıllık: eleme maçları (simüle), çift yıllarda turnuva (oynanır) */
function ntjYear(out) {
  const J = g.ntj; if (!J) return; money(J.sal * (1 - cinfo(g.ct).tax), 'Milli takım maaşı'); const s = ntStr(J.ct);
  let w = 0, d = 0, l = 0; for (let i = 0; i < 6; i++) { const o = ntStr(P(NATIONS)[0]) + R(-6, 6), r = quickScore(s + 1, o); if (r[0] > r[1]) w++; else if (r[0] === r[1]) d++; else l++; }
  J.w += w; J.d += d; J.l += l; J.conf = clr(J.conf + (w * 3 + d - l * 3) * 1.2 - 4, 0, 100);
  if (out) out.lines.push(`${J.ct} milli takımı: eleme/hazırlık maçlarında ${w}G ${d}B ${l}M.`);
  if (g.season % 2 === 0) { g.ntjT = ntjTourNew(); if (out) out.lines.push(`${g.ntjT.n} başlıyor! T. Direktör sekmesinden turnuvayı yönet.`); }
  J.yrs--; if (J.conf < 20) { L(`${J.ct} federasyonu seninle yollarını ayırdı.`); crepAdd(-4, 'milli takımdan gönderilme'); g.ntj = null; g.ntjT = null; }
  else if (J.yrs <= 0) { J.yrs = J.conf > 55 ? 4 : 0; if (!J.yrs) { L(`${J.ct} ile sözleşmen bitti.`); g.ntj = null; } else L(`${J.ct} federasyonu sözleşmeni 4 yıl uzattı.`); }
}
function ntjTourNew() { const J = g.ntj, pool = NATIONS.map(x => x[0]).concat(COUNTRIES.map(c => c.n)).filter(x => x !== J.ct).sort(() => Math.random() - .5); return { n: ntjTourName(J.ct), ct: J.ct, grp: [J.ct, pool[0], pool[1], pool[2]].map(c => ({ ct: c, p: 0, gf: 0, ga: 0 })), gi: 0, ko: 0, pool: pool.slice(3), log: [], done: 0, sq: 'denge' }; }
function ntjPlay(mode) {
  const T = g.ntjT, J = g.ntj; if (!T || T.done || !J) return; const us = ntStr(J.ct) + ({ tecrube: 1, genc: -1, denge: 0 }[T.sq] || 0), md = { savunma: [.82, .75], denge: [1, 1], hucum: [1.18, 1.12] }[mode] || [1, 1];
  const opp = T.gi < 3 ? T.grp[T.gi + 1].ct : T.pool[T.ko + 2] || P(NATIONS)[0], os = ntStr(opp);
  let a = pois(xg(us, os) * md[0]), b = pois(xg(os, us) * md[1]), pens = null;
  if (T.gi < 3) {
    const me = T.grp[0], o = T.grp[T.gi + 1]; me.gf += a; me.ga += b; o.gf += b; o.ga += a; if (a > b) me.p += 3; else if (a === b) { me.p++; o.p++; } else o.p += 3;
    /* diğer grup maçı */
    const others = T.grp.slice(1).filter(x => x !== o), r = quickScore(ntStr(others[0].ct), ntStr(others[1].ct)); others[0].gf += r[0]; others[0].ga += r[1]; others[1].gf += r[1]; others[1].ga += r[0]; if (r[0] > r[1]) others[0].p += 3; else if (r[0] === r[1]) { others[0].p++; others[1].p++; } else others[1].p += 3;
    T.log.unshift(`Grup ${T.gi + 1}. maç: ${J.ct} ${a}-${b} ${opp}`); T.gi++;
    if (T.gi === 3) { const S2 = [...T.grp].sort((x, y) => y.p - x.p || (y.gf - y.ga) - (x.gf - x.ga)), pos = S2.findIndex(x => x.ct === J.ct) + 1; if (pos <= 2) T.log.unshift(`Grubu ${pos}. bitirdiniz, son 16'dasınız!`); else { T.log.unshift(`Grupta ${pos}. oldunuz, elendiniz.`); ntjTourEnd('Grupta elendi', -8); } }
  } else {
    if (a === b) pens = Math.random() < .5 + (us - os) / 60 ? [5, 4] : [4, 5]; const won = a > b || (pens && pens[0] > pens[1]), rn = ['Son 16', 'Çeyrek final', 'Yarı final', 'Final'][T.ko];
    T.log.unshift(`${rn}: ${J.ct} ${a}-${b} ${opp}${pens ? ` (pen. ${pens[0]}-${pens[1]})` : ''}`);
    if (!won) ntjTourEnd(`${rn}de elendi`, [-3, 2, 6, 10][T.ko]); else { T.ko++; if (T.ko >= 4) ntjTourEnd('ŞAMPİYON', 25); }
  }
  sv(); draw();
}
function ntjTourEnd(r, d) { const T = g.ntjT, J = g.ntj; T.done = 1; T.res = r; J.conf = clr(J.conf + d, 0, 100); J.tr.unshift({ y: g.season, n: T.n, r }); crepAdd(d / 3, `${T.n}: ${r}`); if (r === 'ŞAMPİYON') { (g.cab = g.cab || []).push({ y: g.season, k: '🏆', n: T.n, c: J.ct }); news(`${J.ct}, ${g.name} yönetiminde ${T.n} şampiyonu!`); g.hap += 15; } L(`${T.n}: ${r}.`); }
function ntjSimAll() { let k = 0; while (g.ntjT && !g.ntjT.done && k++ < 10) ntjPlay('denge'); }
const _retiredYear = retiredYear; retiredYear = function () { if (g.ntjT && !g.ntjT.done) return toast('Önce milli takım turnuvasını tamamla'); _retiredYear(); };
const _yearTick = yearTick; yearTick = function (out) { _yearTick(out); if (g.phase === 'retired' && !g.coach) { ntjYear(out); ntjOfferMaybe(); } };
function ntjCard() {
  const J = g.ntj, O = g.ntjOf, T = g.ntjT; let h = '';
  if (O) h += `<div class="card q"><div class="eyebrow gold">Milli takım teklifi</div><p class="lead">${kit(...(NTCOL[O.ct] || ['#333', '#fff']))}<b>${esc(O.ct)}</b> federasyonu seni milli takımın başında görmek istiyor. Maaş ${fm(O.sal)}/yıl, 4 yıl. Milli takım gücü ${Math.round(ntStr(O.ct))}.</p><div class="actions"><button class="btn" onclick="ntjSign()">Kabul et</button><button class="btn ghost" onclick="ntjReject()">Reddet</button></div></div>`;
  if (!J) return h;
  h += `<div class="card"><div class="eyebrow">Milli takım teknik direktörü</div><div class="row-b"><div>${kit(...(NTCOL[J.ct] || ['#333', '#fff']))}<b class="h3">${esc(J.ct)}</b></div><span class="m">güç ${Math.round(ntStr(J.ct))}</span></div><div class="prow"><span>Federasyon güveni</span>${bar(J.conf, 100, J.conf < 30 ? 'bad' : '')}<b>${Math.round(J.conf)}</b></div><div class="kvs"><div class="kv"><span>Maçlar</span><b>${J.w}G ${J.d}B ${J.l}M</b></div><div class="kv"><span>Sözleşme</span><b>${J.yrs} yıl · ${fm(J.sal)}/yıl</b></div></div>${J.tr.length ? J.tr.slice(0, 5).map(x => `<div class="kv"><span>${x.y} ${esc(x.n)}</span><b>${esc(x.r)}</b></div>`).join('') : ''}<button class="btn ghost danger" onclick="ntjQuit()">Görevi bırak</button></div>`;
  if (T) {
    const S2 = [...T.grp].sort((x, y) => y.p - x.p || (y.gf - y.ga) - (x.gf - x.ga));
    h += `<div class="card q"><div class="eyebrow gold">${esc(T.n)} ${g.season}</div><table class="tbl"><tr><th>#</th><th>Takım</th><th>A</th><th>Y</th><th>P</th></tr>${S2.map((x, i) => `<tr class="${x.ct === J.ct ? 'me' : ''}"><td>${i + 1}</td><td>${esc(x.ct)}</td><td>${x.gf}</td><td>${x.ga}</td><td>${x.p}</td></tr>`).join('')}</table>
    ${T.done ? `<p class="lead">Sonuç: ${esc(T.res)}</p><button class="btn" onclick="g.ntjT=null;sv();draw()">Kapat</button>` : `<div class="eyebrow">Kadro tercihi</div><div class="chips">${[['tecrube', 'Tecrübe'], ['denge', 'Dengeli'], ['genc', 'Gençlik']].map(([k, n]) => `<button class="chip ${T.sq === k ? 'on' : ''}" onclick="g.ntjT.sq='${k}';draw()">${n}</button>`).join('')}</div>
    <div class="m">Sıradaki: ${T.gi < 3 ? 'Grup ' + (T.gi + 1) + '. maç · ' + esc(T.grp[T.gi + 1].ct) : ['Son 16', 'Çeyrek final', 'Yarı final', 'Final'][T.ko] + ' · ' + esc(T.pool[T.ko + 2] || '')}</div><div class="actions"><button class="btn" onclick="ntjPlay('savunma')">Savunmada kal</button><button class="btn" onclick="ntjPlay('denge')">Dengeli oyna</button><button class="btn" onclick="ntjPlay('hucum')">Hücuma çık</button></div><button class="btn ghost" onclick="ntjSimAll()">Turnuvayı simüle et</button>`}
    <div class="feed">${T.log.map(x => `<div class="fi">${esc(x)}</div>`).join('')}</div></div>`;
  }
  return h;
}
function cabinetCard() { const C = g.cab || []; if (!C.length) return ''; return `<div class="card"><div class="eyebrow">Kupa dolabı</div><div class="cab">${C.slice().reverse().slice(0, 18).map(x => `<div><span>${x.k}</span><b>${esc(x.n)}</b><em>${x.y} · ${esc(clubName(x.c) || x.c)}</em></div>`).join('')}</div></div>`; }

/* ---------- Oyuncu konuşma paneli (kadro sekmesinde) ---------- */
function talkPanel() {
  const C = g.coach, q = C && C.talk && (g.sq[C.id] || []).find(x => x.id === C.talk); if (!q) return '';
  const ps = persOf(q);
  return `<div class="card q"><div class="row-b"><div><div class="eyebrow gold">Birebir görüşme</div><b class="h3">${esc(pname(q))}</b> <span class="m">${POSN[q.p]} · ${q.age} yaş · güç ${q.r} · ${PERS[ps]}${C.capt === q.id ? ' · Kaptan' : ''}</span></div><button class="lnk" onclick="g.coach.talk=null;draw()">Kapat</button></div>
  <div class="prow"><span>Moral</span>${bar(q.mor == null ? 65 : q.mor, 100, (q.mor || 65) < 40 ? 'bad' : '')}<b>${Math.round(q.mor == null ? 65 : q.mor)}</b></div>${q.prom ? `<div class="m note">Forma sözü verdin: ${Math.max(0, q.prom.w - g.tw)} hafta içinde ${Math.max(0, 3 - ((q.ap || 0) - q.prom.ap))} maç daha.</div>` : ''}
  <div class="opts">${Object.entries(TALK).map(([k, t]) => `<button class="opt sm" onclick="pTalk(${q.id},'${k}')"><b>${t.n}</b><span>${t.d} · ⚡3</span></button>`).join('')}</div><div class="m">Kişilik tepkiyi belirler: hassas oyuncular eleştiriyi kaldıramaz, liderler kaptanlıkla soyunma odasını toparlar. Sözünü tutmazsan güven sarsılır.</div></div>`;
}
/* ---------- Transfer kartı (teklif paneli) ---------- */
function trCard() {
  const C = g.coach, L2 = trMarket(), sel = C.trSel != null ? L2[C.trSel] : null;
  let h = '';
  if (sel) { const fee = f => fm(Math.round(sel.fee * f));
    h += `<div class="card q"><div class="row-b"><div><div class="eyebrow gold">Transfer görüşmesi</div><b class="h3">${esc(pname(sel))}</b> <span class="m">${POSN[sel.p]} · ${sel.age} yaş · ${sel.r} · ${esc(cname(sel.from))}</span></div><button class="lnk" onclick="trPick(${C.trSel})">Kapat</button></div>
    <div class="m">İstenen bonservis ${fm(sel.fee)} · maaş beklentisi ${fm(sel.wage)}/yıl · bütçe ${fm(C.bud)}</div>
    <div class="eyebrow">Bonservis teklifi × maaş</div><div class="trg">${[.85, 1, 1.2].map(f => [1, 1.15, 1.3].map(w => `<button class="chip" onclick="trOffer(${C.trSel},${f},${w})"><b>${fee(f)}</b> · maaş %${Math.round(w * 100)}<small>kulüp %${Math.round(clubAcceptP(f) * 100)} · oyuncu %${Math.round(playerAcceptP(sel, w) * 100)}</small></button>`).join('')).join('')}</div>
    <button class="btn ghost" onclick="trLoan(${C.trSel})">Sezon sonuna kadar kiralık iste</button><div class="m">Her oyuncuya haftada bir teklif yapabilirsin. Düşük teklif kulübü, düşük maaş oyuncuyu kaçırır.</div></div>`; }
  h += `<div class="card"><div class="eyebrow">Transfer pazarı</div><div class="m">${windowOpen() ? '🟢 Transfer dönemi açık' : '🔴 Transfer dönemi kapalı (1-4. ve 22-25. haftalar)'} · Bütçe ${fm(C.bud)}</div>${L2.map((x, i) => `<div class="asset"><div><b>${esc(pname(x))}${x.real ? ' <i class="star">★</i>' : ''}</b><span class="m">${POSN[x.p]} · ${x.age} yaş · reyting ${x.r} · ${esc(cname(x.from))} · maaş ${fm(x.wage)}</span></div><b>${fm(x.fee)}</b><div class="actions tight"><button class="chip ${C.trSel === i ? 'on' : ''}" onclick="trPick(${i})">Görüş</button></div></div>`).join('') || '<p class="m">Pazarda uygun oyuncu yok.</p>'}</div>
  <div class="card"><div class="eyebrow">Satış</div><p class="m">Kadro sekmesinde oyuncunun yanındaki € ile satarsın. Dönem kapalıyken oyuncu satış listesine girer ve dönem açılınca satılır.${(C.sell || []).length ? ` Listede ${C.sell.length} oyuncu var.` : ''}</p><button class="btn ghost" onclick="CV2='kadro';draw()">Kadroya git</button></div>`;
  return h;
}

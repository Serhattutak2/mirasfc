/* ============================================================
   MİRAS FC — TEKNİK DİREKTÖRLÜK 2: kariyer ve piyasa
   İtibar ve dünya sıralaması, seni izleyen kulüpler (ilgi),
   boş koltuklar ve başvuru, antrenör menajeri, kulüp gelirleri
   (bilet, prim, kupa), yönetim kurulu toplantıları, gerçekçi altyapı.
   ============================================================ */
const CW_REAL = ['Pep Guardiola', 'Carlo Ancelotti', 'Jürgen Klopp', 'Xabi Alonso', 'Mikel Arteta', 'Luis Enrique', 'Diego Simeone', 'Simone Inzaghi', 'Arne Slot', 'Hansi Flick', 'Unai Emery', 'Thomas Tuchel', 'Antonio Conte', 'José Mourinho', 'Okan Buruk', 'Vincent Kompany', 'Enzo Maresca', 'Ange Postecoglou', 'Roberto De Zerbi', 'Julian Nagelsmann', 'Luciano Spalletti', 'Didier Deschamps', 'Marcelo Gallardo', 'Abel Ferreira', 'Gian Piero Gasperini', 'Stefano Pioli', 'Erik ten Hag', 'Mauricio Pochettino', 'Rúben Amorim', 'Vincenzo Montella', 'Şenol Güneş', 'Fatih Terim', 'Ernesto Valverde', 'Marco Silva', 'Oliver Glasner', 'Sebastian Hoeneß', 'Thiago Motta', 'Luis de la Fuente', 'Lionel Scaloni', 'Carlo Ancelotti Jr'];
const CAG = [{ n: 'Menajerim yok', cut: 0, int: 1, sal: 0 }, { n: 'Antrenör menajeri', cut: .06, int: 1.35, sal: .08 }, { n: 'Uluslararası süper menajer', cut: .12, int: 1.8, sal: .18, rep: 40 }];
const cRep = () => clr(coachRep(), 0, 100);
function ensureCW() {
  if (g.cw && g.cw.length) return g.cw;
  g.cw = CW_REAL.slice(0, 36).map((n, i) => ({ n, r: clr(96 - i * 2 + R(-4, 4), 25, 99) }));
  return g.cw;
}
function cwYear() { ensureCW().forEach(c => { c.r = clr(c.r + gauss() * 3.5 - (c.r > 90 ? 1 : 0), 20, 99); }); if (Math.random() < .15) { const i = R(25, g.cw.length - 1); g.cw[i] = { n: P((NAMES[cinfo(g.ct).lang] || NAMES.tr).f) + ' ' + P((NAMES[cinfo(g.ct).lang] || NAMES.tr).l), r: R(40, 60), nw: 1 }; } }
const cwRank = () => ensureCW().filter(c => c.r > cRep()).length + 1;
/* itibar değişimi: tek noktadan, gerekçesiyle */
function crepAdd(d, why) { g.crep = Math.max(0, (g.crep || 0) + d); if (why && Math.abs(d) >= 2) L(`İtibarın ${d > 0 ? 'yükseldi' : 'düştü'} (${d > 0 ? '+' : ''}${Math.round(d)}): ${why}.`); }

/* ---------- Seni izleyen kulüpler ---------- */
function coachForm() { const C = g.coach; const f = (C && C.f5) || []; return f.length ? f.reduce((a, b) => a + b, 0) / (f.length * 3) : .5; }
function interestTick() {
  if (!(g.lic >= 1)) return; g.cint = g.cint || {}; const rep = coachRep(), ag = CAG[g.cag || 0], form = g.coach ? coachForm() : .45, cur = g.coach ? club(g.coach.id) : null;
  for (const id in g.cint) { g.cint[id] = Math.round(g.cint[id] * .9 - 1); if (g.cint[id] <= 0 || !club(+id)) delete g.cint[id]; }
  const cands = []; for (const ct in g.w) g.w[ct].flat().forEach(c => { if (licNeed(c) > g.lic || (cur && c.id === cur.id)) return; const need = (c.s - 55) * 1.6 + (ct === g.ct ? 0 : 10); if (rep > need - 12 && (!cur || c.s >= cur.s - 3)) cands.push({ c, need }); });
  cands.sort(() => Math.random() - .5).slice(0, 4).forEach(({ c, need }) => { g.cint[c.id] = clr((g.cint[c.id] || 0) + (form - .35) * 30 * ag.int + (rep - need) * .4 + R(0, 8), 0, 100); });
  const ids = Object.keys(g.cint).sort((a, b) => g.cint[b] - g.cint[a]); ids.slice(8).forEach(id => delete g.cint[id]);
}
function interestOffer(auto) {
  if (!g.cint || g.cjob) return; const C = g.coach; if (C && C.own) return;
  const id = Object.keys(g.cint).find(k => g.cint[k] >= 75 && Math.random() < .3); if (!id) return; const c = club(+id); if (!c) return;
  const o = mkCoachOffer(c, clubCt(c.id), { mid: 1, buyout: 1, int: g.cint[id] }); delete g.cint[id];
  if (C) { if (auto) return; g.cjob = o; L(`${clubName(c.n)} seni uzun süredir izliyordu ve resmi teklif yaptı.`); }
  else { g.cof = (g.cof || []).concat([o]); L(`${clubName(c.n)} sana teknik direktörlük teklif etti.`); }
}
function cagSet(i) { const a = CAG[i]; if (a.rep && cRep() < a.rep) return toast(`Bu menajer için itibar ${a.rep} gerekli (senin ${cRep()})`); g.cag = i; L(i ? `${a.n} ile çalışmaya başladın (maaşının %${Math.round(a.cut * 100)}'i).` : 'Antrenör menajerinle yollarını ayırdın.'); toast(a.n); sv(); draw(); }

/* ---------- Boş koltuklar ve başvuru (işsizken) ---------- */
function vacancies() {
  if (!g.vac || g.vacY !== g.season) { g.vacY = g.season; g.vapp = 0; const out = []; for (const ct in g.w) g.w[ct].flat().forEach(c => { if (licNeed(c) <= (g.lic || 0) && Math.random() < .045) out.push(c.id); }); g.vac = out.sort(() => Math.random() - .5).slice(0, 8); }
  return g.vac.map(id => club(id)).filter(c => c && !(g.coach && g.coach.id === c.id));
}
function applyJob(id) {
  const c = club(id); if (!c) return; if ((g.vapp || 0) >= 3) return toast('Bu yıl en fazla 3 başvuru yapabilirsin');
  g.vapp = (g.vapp || 0) + 1; const need = (c.s - 55) * 1.6 + (clubCt(id) === g.ct ? 0 : 10), p = 1 / (1 + Math.exp(-(coachRep() - need + (g.cag || 0) * 4) / 5));
  g.vac = g.vac.filter(x => x !== id);
  if (Math.random() < p) { const o = mkCoachOffer(c, clubCt(id)); g.cof = (g.cof || []).filter(x => x.id !== id).concat([o]); L(`${clubName(c.n)} başvurunu olumlu karşıladı ve sözleşme önerdi.`); toast('Teklif geldi!'); }
  else { L(`${clubName(c.n)} başka bir adayla anlaştı.`); toast(`Reddedildin (şansın ~%${Math.round(p * 100)} idi)`); }
  sv(); draw();
}

/* ---------- Kulüp gelirleri: bilet, maç ve kupa primleri ---------- */
function clubIncome(e, info, res) {
  const C = g.coach; if (!C) return; const c = club(C.id); if (!c) return; const ec = cinfo(C.ct).e, t = c.t;
  let p = 0, why = '';
  if (e.k === 'L') { p = (res.win ? [0, 28, 6, 1.4][t] : res.draw ? [0, 9, 2, .5][t] : 0) * ec; why = 'Lig primi'; if (info.home) { p += [0, 22, 5, 1.2][t] * ec * (c.fan / 70) * .4; why = 'Bilet + lig primi'; } }
  if (e.k === 'C' && res.win) { p = [6, 10, 16, 28, 45, 90][e.r] * ec * [0, 1, .5, .25][t]; why = 'Kupa turu primi'; }
  if (e.k === 'E') { p = e.r < 6 ? (res.win ? 70 : res.draw ? 23 : 0) * ec : res.win ? [180, 300, 480, 900][e.r - 6] * ec : 0; why = 'Avrupa primi'; }
  p = Math.round(p); if (p <= 0) return;
  C.bud += Math.round(p * .5); C.inc = (C.inc || 0) + p; /* gelirin yarısı transfer bütçesine */
}
/* sezon sonu sıralama primi (bütçe yenilenmeden önce raporlanır) */
function seasonPrize(pos, n, t) { const C = g.coach; if (!C) return 0; return Math.round(Math.max(0, n - pos + 1) / n * [0, 900, 160, 35][t] * cinfo(C.ct).e); }

/* ---------- Yönetim kurulu toplantıları ---------- */
const BOARD = {
  satis: { t: c => `Yönetim kurulu: “Kasayı rahatlatmak için en değerli oyuncumuz ${c} satılmalı.”`, c: ['Kabul, satıyoruz', 'Hayır, o takımın yıldızı', 'Bir sezon daha süre iste'] },
  maas: { t: () => 'Yönetim maaş yükünden şikâyetçi: “Maaş bütçesini %10 düşür.”', c: ['Yüksek maaşlı iki yedeği gönder', 'Mümkün değil', 'Kendi maaşımdan %10 indirim yap'] },
  genc: { t: () => 'Başkan altyapıdan oyuncu görmek istiyor: “Bu sezon en az iki genç forma giymeli.”', c: ['Söz veriyorum', 'Kadro buna hazır değil'] },
  hedef: { t: () => 'Kulüp sponsorları büyük hedef istiyor. Başkan: “Hedefi bir sıra yükseltelim, bütçe de artsın.”', c: ['Kabul (bütçe +, hedef +)', 'Mevcut hedefte kal'] },
  stad: { t: () => 'Taraftar grupları son sonuçlardan rahatsız; tribünlerde tepki var.', c: ['Taraftarla buluş, özür dile', 'Sahada cevap veririz'] },
};
function boardTick() {
  const C = g.coach; if (!C || C.own || g.cev) return;
  if (![12, 24, 36].includes(g.week)) return;
  const best = [...(g.sq[C.id] || [])].sort((a, b) => valueOf(b.r, b.age) - valueOf(a.r, a.age))[0];
  const k = coachForm() < .35 ? 'stad' : P(['satis', 'maas', 'genc', 'hedef'].filter(x => x !== 'satis' || best));
  g.cev = { k: 'board', b: k, pid: best ? best.id : null };
}
function boardText(e) { const C = g.coach, B = BOARD[e.b]; if (!B) return null; const q = e.pid ? (g.sq[C.id] || []).find(x => x.id === e.pid) : null; return { t: B.t(q ? pname(q) : 'yıldız'), c: B.c.map(x => [x]) }; }
function boardAnswer(e, i) {
  const C = g.coach, q = e.pid ? (g.sq[C.id] || []).find(x => x.id === e.pid) : null, ec = cinfo(C.ct).e;
  if (e.b === 'satis') { if (i === 0 && q) { const fee = sellPlayer(C.id, q.id, C); C.conf = clr(C.conf + 8, 0, 100); C.harm = clr(C.harm - 6, 0, 100); L(`Yönetimin isteğiyle ${pname(q)} ${fm(fee)} karşılığında satıldı.`); } else if (i === 1) { C.conf = clr(C.conf - 9, 0, 100); C.harm = clr(C.harm + 4, 0, 100); } else { C.conf = clr(C.conf - 3, 0, 100); } }
  if (e.b === 'maas') { if (i === 0) { const sq = (g.sq[C.id] || []).filter(p => !bestXI(C.id, C.form).some(x => x.id === p.id)).sort((a, b) => b.wage - a.wage).slice(0, 2); sq.forEach(p => { g.sq[C.id] = g.sq[C.id].filter(x => x.id !== p.id); L(`${pname(p)} ile karşılıklı anlaşarak yollar ayrıldı.`); }); recalcStr(C.id); C.conf = clr(C.conf + 5, 0, 100); C.harm = clr(C.harm - 3, 0, 100); } else if (i === 1) C.conf = clr(C.conf - 7, 0, 100); else { C.sal = Math.round(C.sal * .9); C.conf = clr(C.conf + 6, 0, 100); crepAdd(1); } }
  if (e.b === 'genc') { if (i === 0) { C.gencSoz = 2; C.conf = clr(C.conf + 4, 0, 100); C.obj.push({ k: 'genc', n: 'Altyapıdan 2 oyuncu yükselt', v: 2, w: 1, have: 0 }); } else C.conf = clr(C.conf - 4, 0, 100); }
  if (e.b === 'hedef') { if (i === 0) { const o = C.obj.find(x => x.k === 'lig'); if (o && o.v > 1) { o.v--; o.n = o.v === 1 ? 'Şampiyonluk' : `Ligi ilk ${o.v} içinde bitir`; } C.bud += Math.round(Math.pow(club(C.id).s / 60, 6) * [0, 500, 90, 20][club(C.id).t] * ec); C.conf = clr(C.conf + 3, 0, 100); } }
  if (e.b === 'stad') { if (i === 0) { C.conf = clr(C.conf + 3, 0, 100); crepAdd(-1); } else { C.conf = clr(C.conf - 2, 0, 100); } }
}
/* soyunma odası kartına yönetim toplantısını ekle */
const _cevText = cevText; cevText = function () { const e = g.cev; if (e && e.k === 'board' && g.coach) return boardText(e); return _cevText(); };
const _cevAnswer = cevAnswer; cevAnswer = function (i) { const e = g.cev; if (e && e.k === 'board' && g.coach) { g.cev = null; boardAnswer(e, i); sv(); draw(); return; } return _cevAnswer(i); };

/* ---------- Gerçekçi altyapı: çoğu genç sıradan, nadiren cevher ---------- */
youthIntake = function (id, lvl) {
  g.youth = g.youth || {}; const ct = clubCt(id), NP = NAMES[cinfo(ct).lang] || NAMES.tr, out = [], L0 = Math.max(1, lvl || 1);
  for (let i = 0; i < 3 + Math.min(2, Math.floor(L0 / 2)); i++) {
    const gem = Math.random() < .015 + L0 * .008, pot = clr(48 + L0 * 2.5 + gauss() * 6 + (gem ? R(14, 22) : 0), 42, 94), r = clr(pot - R(20, 32) + (gem ? 4 : 0), 34, 68);
    out.push({ id: newPid(), n: P(NP.f) + ' ' + P(NP.l), real: 0, p: P(['GK', 'DF', 'DF', 'MF', 'MF', 'FW']), r, pot, age: R(16, 18), gem: gem ? 1 : 0 });
  }
  g.youth[id] = out; return out;
};

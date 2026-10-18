/* ============================================================
   MİRAS FC — KARİYER (v2)
   Teklifler (zengin kulüp, çocukluk kulübü, kiralık), forma no,
   uyum, rol, sözleşme kalemleri, haftalık ENERJİ ve eylemler,
   hafta döngüsü, milli takım kararları, sezon sonu, geçmiş
   ============================================================ */
const facOf = c => clr((c.s - 55) / 6 + (c.fan > 80 ? 1 : 0), 1, 5);
const AGENTS = [{ n: 'Menajer yok', cut: 0 }, { n: 'Yerel menajer', cut: .05, offers: 2, sal: .08, neg: .12 }, { n: 'Üst düzey menajer', cut: .10, offers: 4, sal: .18, neg: .24, rep: 30 }];
const agentCut = () => (g.agentCutX || 0) * (g.agent ? 1 : 0) + (g.agent ? (g.agent === 1 && g.flags.ermenajer ? .08 : g.agent === 1 && g.flags.akillimenajer ? .05 : AGENTS[g.agent].cut) : 0);
const ROLE_SAL = [.2, .55, .8, 1, 1.35];
function salary(o, t, ct, role) { return Math.round(Math.pow(o / 60, 5) * 770 * [0, 1, .3, .1][t] * cinfo(ct).e * ROLE_SAL[role] * (1 + (g.agent ? AGENTS[g.agent].sal : 0)) * R(92, 110) / 100); }
const mValue = () => Math.round(valueOf(Math.max(30, ovr()), g.age) * (g.pot > ovr() + 5 ? 1.2 : 1));
const effOvr = () => ovr() + (g.sf || 0) + ((g.uyum || 50) - 50) / 12 + (g.form - 6.5) * 1.5;

/* ---------- Teklifler ---------- */
function mkOffer(c, ct, kind, extra) {
  const o = ovr(), rich = c.rich && kind !== '16';
  let role = roleFor(o + (g.flags.atakim && kind === '16' && g.acadClub && g.acadClub.id === c.id ? 4 : 0), c.s, g.age);
  const yrs = kind === '16' ? R(2, 3) : kind === 'loan' ? 1 : g.age >= 32 ? R(1, 2) : R(2, 5);
  let sal = salary(Math.max(o, 40), c.t, ct, role) * (kind === '16' ? .6 : 1) * (rich ? R(180, 300) / 100 : 1);
  const x = { id: c.id, ct, n: c.n, t: c.t, s: c.s, role, sal: Math.round(sal), yrs, kind, rich: rich ? 1 : 0,
    bonus: Math.round(sal * (kind === 'renew' ? .15 : R(5, 30) / 100)), fac: facOf(c), rel: Math.round(mValue() * R(15, 30) / 10),
    app: Math.round(sal * R(4, 10) / 1000), goal: g.pos === 'DF' ? 0 : Math.round(sal * R(5, 15) / 1000), house: rich || c.fan > 85 ? 1 : 0, car: Math.random() < .4 ? 1 : 0, img: R(0, 2) * 5, ...extra };
  return x;
}
function startOffers(kind) {
  if (g.coach || g.phase === 'coach' || g.phase === 'retired') { scr = 'game'; return toast('Futbolu bıraktın; oyuncu teklifleri artık gelmiyor'); }
  const o = ovr(), out = [], seen = {};
  const add = (c, ct, k, ex) => { if (seen[c.id] || (g.club && c.id === g.club.id && k !== 'renew')) return; seen[c.id] = 1; out.push(mkOffer(c, ct, k || kind, ex)); };
  const interest = (c, ct) => {
    let b = o + (g.agent ? AGENTS[g.agent].offers : 0) + g.rep / 20 + (g.form - 6.5) * 2 + (g.sf || 0);
    if (kind === '16') { b += g.acad * 4 + (g.flags.u17 ? 4 : 0) + (g.flags.sadik16 ? 3 : 0); if (g.flags.yurtdisi === ct) b += 8; if (g.acadClub && g.acadClub.id === c.id) b += 14; if (g.homeClub === c.id) b += 6; }
    if (g.favClub === c.id) b += 3;
    const need = c.s - (kind === '16' ? 20 : 6) - (g.age < 21 ? 3 : 0) - (c.rich ? 8 : 0);
    if (kind === 'win' && g.club && club(g.club.id) && c.s < club(g.club.id).s - 2 && !c.rich) return 0;
    return 1 / (1 + Math.exp(-(b - need) / 1.5));
  };
  const countries = [g.ct, ...(g.flags.yurtdisi ? [g.flags.yurtdisi] : []), ...COUNTRIES.map(x => x.n).filter(x => x !== g.ct)];
  if (kind !== 'loan') for (const ct of countries) {
    const abroad = ct !== g.ct && ct !== g.flags.yurtdisi;
    for (const c of g.w[ct].flat()) { let p = interest(c, ct) * (abroad ? (o >= 70 ? .25 : .06) : .55); if (kind === 'win') p *= .35; if (Math.random() < p) add(c, ct); }
  }
  /* özel teklifler */
  if (kind === '16' && g.acadClub && club(g.acadClub.id)) add(club(g.acadClub.id), clubCt(g.acadClub.id), '16', { acadOffer: 1 });
  if (kind !== '16' && kind !== 'loan' && g.homeClub && club(g.homeClub) && g.age >= 24 && Math.random() < .12 && (!g.club || g.club.id !== g.homeClub)) add(club(g.homeClub), clubCt(g.homeClub), kind, { home: 1, bonus: Math.round(salary(o, club(g.homeClub).t, clubCt(g.homeClub), 3) * .4) });
  if ((kind === 'win' || kind === 'free') && Math.random() < .25) { const rc = P(Object.values(CI).map(x => x.c).filter(c => c.rich && !seen[c.id])); if (rc) add(rc, clubCt(rc.id), kind); }
  if (kind === 'loan') { const pool = g.w[g.club.ct].flat().concat(Math.random() < .5 ? P(COUNTRIES.filter(c => c.n !== g.club.ct && c.k === cinfo(g.club.ct).k).map(c => g.w[c.n][0])) || [] : []).filter(c => c.id !== g.club.id && roleFor(o, c.s, g.age) >= 2 && c.s >= club(g.club.id).s - 16).sort(() => Math.random() - .5).slice(0, R(2, 4));
    pool.forEach(c => add(c, clubCt(c.id), 'loan', { loan: 1, sal: g.con ? g.con.sal : 0, bonus: 0, yrs: 1, loanTop: g.con ? Math.round(g.con.sal * R(0, 35) / 100) : 0 }));
    if (!out.length) { toast('Şu an seni kiralamak isteyen kulüp çıkmadı'); L('Kiralık talebin vardı ama ilgilenen kulüp çıkmadı.'); g.loanAsk = g.season; sv(); draw(); return; } }
  if (kind === 'win' && g.club && g.age <= 22 && g.role <= 1) { const lc = P(g.w[g.club.ct].flat().filter(c => roleFor(o, c.s, g.age) >= 3 && c.id !== g.club.id)); if (lc) add(lc, clubCt(lc.id), 'loan', { loan: 1, sal: g.con ? g.con.sal : 0, bonus: 0, loanTop: g.con ? Math.round(g.con.sal * R(0, 35) / 100) : 0 }); }
  let L2 = out.sort((a, b) => b.s - a.s);
  if (L2.length > 10) { const keep = L2.filter(x => x.acadOffer || x.home || x.rich || x.loan), top = L2.filter(x => !keep.includes(x)).slice(0, 4), rest = L2.filter(x => !keep.includes(x) && !top.includes(x)).sort(() => Math.random() - .5).slice(0, Math.max(0, 6 - keep.length)); L2 = keep.concat(top, rest).sort((a, b) => b.s - a.s); }
  if (kind === '16' || kind === 'free') { const low = g.w[g.ct][g.w[g.ct].length - 1].filter(c => !seen[c.id]).sort(() => Math.random() - .5); while (L2.length < 4 && low.length) { const c = low.pop(); seen[c.id] = 1; L2.push(mkOffer(c, g.ct, kind)); } }
  if (kind === 'renew' && g.club) { const c = club(g.club.id); if (c) L2.unshift({ ...mkOffer(c, clubCt(c.id), 'renew'), renew: 1 }); }
  g.of = L2; g.ofKind = kind; scr = 'offers'; sv(); draw();
}
function sign(i) {
  const x = g.of[i]; if (!x || x.gone) return;
  const prev = g.club && g.club.id, prevCt = g.club && g.club.ct;
  if (prev && prev !== x.id && g.val.sa > 65 && !x.loan) { g.hap -= 6; g.val.sa = clr(g.val.sa - 6, 0, 100); L('Taraftarlar ayrılışını kolay affetmedi.'); }
  if (x.loan) g.loan = { from: prev, ct: prevCt, n: g.club.n, con: g.con, top: x.loanTop || 0 };
  if (prev && prev !== x.id) { closeHist(); if (!isUserManaged(prev)) dropSquad(prev); }
  g.club = { id: x.id, ct: x.ct, n: x.n };
  if (!x.loan) g.con = { sal: x.sal, yrs: x.yrs, role: x.role, promise: x.promise || 0, start: g.season, rel: x.rel, app: x.app, goal: x.goal, house: x.house, car: x.car, img: x.img, loyal: x.loyal || 0 };
  g.role = x.role; money(x.bonus || 0, 'İmza parası');
  ensureSquad(x.id);
  if (prev !== x.id) {
    const c = club(x.id);
    g.hist.push({ id: x.id, n: x.n, ct: x.ct, t: c.t, s: c.s, y0: g.season, y1: null, ap: 0, g: 0, a: 0, role: x.role, sal: x.sal, how: x.loan ? 'kiralık' : x.kind === '16' ? (x.acadOffer || (g.acadClub && g.acadClub.id === x.id) ? 'altyapıdan A takıma' : 'ilk sözleşme') : x.kind === 'free' ? 'serbest' : x.kind === 'renew' ? 'yenileme' : 'transfer' });
    g.clubYears = 0; g.captain = 0; g.uyum = clr(25 + (x.ct === g.ct ? 15 : cinfo(x.ct).lang === cinfo(g.ct).lang ? 8 : 0) + (x.home ? 25 : 0) + (x.acadOffer ? 25 : 0) + (g.flags.dil && x.ct !== g.ct ? 6 : 0), 10, 90);
    g.numPick = 1;
    const pr = g.fam.partner; if (pr && prevCt && x.ct !== prevCt && !x.loan) { if (pr.rel >= 60 || pr.st === 'evli' && pr.rel >= 45) { pmem(`seninle ${x.ct}'${loc(x.ct)} yeni bir hayata başladı`); relAdj(pr, pr.tr === 'maceraci' ? 6 : pr.tr === 'kariyerci' ? -6 : 0); } else { pr.far = 2; relAdj(pr, -8); pmem('uzak mesafe ilişkisi başladı'); L(`${pr.n} seninle ${x.ct}'${loc(x.ct)} gelmedi; uzak mesafe ilişkisi başladı.`); } }
  }
  L(`${x.renew ? 'Sözleşme yeniledin' : x.loan ? 'Kiralık gittin' : 'İmza attın'}: ${clubName(x.n)} (${tierName(x.ct, x.t)}) · ${ROLES[x.role]}${x.loan ? '' : ` · ${fm(x.sal)}/yıl · ${x.yrs} yıl`}${x.bonus ? ' · imza parası ' + fm(x.bonus) : ''}`);
  if (x.home) { L('Çocukluk kulübüne döndün. Şehir seni bayramla karşıladı.'); g.hap += 10; g.val.sa = clr(g.val.sa + 6, 0, 100); }
  g.of = []; g.nego = null; g.phase = 'pro'; scr = 'game'; tab = 'home';
  if ((g.ofKind === 'win' || g.ofKind === 'free' || g.ofKind === 'loan') && g.week > 1 && prev !== x.id) setupSeason(g.week);
  else if (g.ofKind !== 'win' && g.ofKind !== 'renew' && (!g.cal || !g.cal.length || g.week <= 1)) setupSeason();
  if (!g.cal || !g.cal.length) setupSeason(g.week > 1 ? g.week : undefined);
  sv(); if (g.numPick) { scr = 'num'; draw(); } else afterOffers();
}
function reqLoan() {
  if (!g.club || g.loan) return toast('Zaten kiralıksın');
  if (g.age > 23) return toast('Kiralık talebi genç oyuncular içindir (23 yaş ve altı)');
  if (g.role >= 3) return toast('Takımında as oynuyorsun; kulüp seni bırakmaz');
  if (g.loanAsk === g.season) return toast('Bu sezon zaten talep ettin');
  g.loanAsk = g.season; const ok = Math.random() < (g.role <= 1 ? .8 : .5);
  if (!ok) { L('Kulüp kiralık talebini reddetti: “Seni burada izlemek istiyoruz.”'); g.mor = clr(g.mor - 3, 0, 100); toast('Kulüp kiralık talebini reddetti'); sv(); draw(); return; }
  L('Kulüp kiralık gitmene izin verdi; teklifler masada.'); startOffers('loan');
}
function closeHist() { const h = g.hist[g.hist.length - 1]; if (h && !h.y1) h.y1 = g.season; }
function pickNum(n, steal) {
  const list = ensureSquad(g.club.id), holder = list.find(p => p.num === n);
  if (holder) {
    if (!steal) return;
    const ok = g.role >= 3 && Math.random() < .35 + g.rep / 200 + (g.role === 4 ? .2 : 0);
    if (!ok) { toast(`${pname(holder)} numarasını vermedi`); g.uyum -= 3; sv(); draw(); return; }
    holder.num = freeNum(list, holder.p); L(`${pname(holder)} ${n} numarayı sana bıraktı.`); g.uyum -= 2;
  }
  g.num = n; g.numPick = 0; const h = g.hist[g.hist.length - 1]; if (h) h.num = n; L(`Forma numaran: ${n}.`); scr = 'game'; sv(); afterOffers();
}
function declineOffers() {
  if (g.ofKind === '16' || g.ofKind === 'free') { if (!g.club) { g.phase = 'free'; L('Şimdilik hiçbir teklifi kabul etmedin. Serbest oyuncusun.'); } }
  else if (g.ofKind === 'renew') { L('Sözleşme yenileme teklifini reddettin.'); g.noRenew = 1; }
  g.of = []; g.nego = null; scr = 'game'; sv(); afterOffers();
}
function afterOffers() { const a = g.after; g.after = null; if (a === 'newSeason') return newSeasonOffers(); if (a === 'setup') { setupSeason(); scr = 'game'; tab = 'home'; sv(); } draw(); }

/* ---------- ENERJİ ve EYLEMLER ---------- */
const enMax = () => clr(100 + (g.age >= 18 && g.age <= 28 ? 10 : 0) - (g.age > 30 ? (g.age - 30) * 2 : 0) + (g.hp - 70) / 5 + (g.flags.diyet ? 5 : 0), 40, 120);
const xpAdd = (k, v) => { const c = g.club ? club(g.club.id) : null, fac = c ? .85 + facOf(c) * .07 : .8, room = cl((g.pot + 4 - g.st[k]) / 14, 0, 1.2); g.xp[k] += v * ageF(g.age) * room * fac * (g.trainer ? 1.15 : 1) * (g.val.am > 65 ? 1.08 : 1) * (g.fit < 40 ? .6 : 1); levelUp(); };
function levelUp() { const wk = g.wk || (g.wk = { gain: {}, loss: {} }); K.forEach(k => { while (g.xp[k] >= 1) { g.xp[k] -= 1; if (g.st[k] < Math.min(99, g.cap[k])) { g.st[k]++; wk.gain[k] = (wk.gain[k] || 0) + 1; } } }); }
const ageF = a => { const base = a <= 18 ? 1.45 : a <= 21 ? 1.25 : a <= 24 ? 1 : a <= 27 ? .7 : a <= 30 ? .42 : .15; const arc = g.arc === 'erken' ? (a <= 21 ? 1.2 : a >= 27 ? .8 : 1) : g.arc === 'gec' ? (a <= 20 ? .8 : a >= 23 && a <= 29 ? 1.3 : 1) : 1; return base * arc; };
const ACTS = [
  ...K.map(k => ({ id: 'tr_' + k, g: 'Antrenman', n: { hiz: 'Sprint ve çeviklik', pas: 'Pas ve oyun görüşü', sut: 'Şut ve bitiricilik', tek: 'Top tekniği ve çalım', def: 'Savunma ve pozisyon', fiz: 'Kuvvet ve dayanıklılık' }[k], en: 12, max: 3, d: `${KN[k]} gelişir, kondisyon −4`, if: () => g.phase !== 'child', f: m => { xpAdd(k, .22 * m); g.fit = clr(g.fit - 4, 0, 100); } })),
  { id: 'tr_video', g: 'Antrenman', n: 'Rakip ve maç videosu analizi', en: 8, max: 1, d: 'Form +, uyum +', if: () => g.club, f: m => { g.form = cl(g.form + .12 * m, 3, 10); g.uyum = clr((g.uyum || 50) + 1, 0, 100); } },
  { id: 'tr_takim', g: 'Antrenman', n: 'Takım arkadaşlarıyla ek idman', en: 10, max: 1, d: 'Uyum ++', if: () => g.club, f: m => { g.uyum = clr((g.uyum || 50) + 3 * m, 0, 100); xpAdd(P(K), .08); } },
  { id: 're_fizyo', g: 'Toparlanma', n: 'Fizyoterapi ve masaj', en: 6, max: 1, cost: 2, d: 'Kondisyon +12', f: m => { g.fit = clr(g.fit + 12, 0, 100); } },
  { id: 're_uyku', g: 'Toparlanma', n: 'Erken yat, telefonu kapat', en: 8, max: 1, d: 'Kondisyon +8, mutluluk +', f: m => { g.fit = clr(g.fit + 8, 0, 100); g.hap += 1; } },
  { id: 'ev_partner', g: 'Yaşam', n: 'Partnerinle akşam yemeği', en: 8, max: 2, cost: 1, d: 'İlişki +, mutluluk +', if: () => g.fam.partner, f: m => { relAdj(g.fam.partner, 6 * m); g.hap += 3; touch('p'); } },
  { id: 'ev_cocuk', g: 'Yaşam', n: 'Çocuklarınla vakit geçir', en: 8, max: 2, d: 'Çocuklarla bağ +', if: () => g.fam.kids.some(k => k.age < 25), f: m => { g.fam.kids.forEach((k, i) => { relAdj(k, 5 * m); touch('k' + i); if (k.age >= 5 && k.age <= 17 && Math.random() < .3) k.tal = clr(k.tal + 1, 1, 99); }); g.hap += 3; } },
  { id: 'ev_aile', g: 'Yaşam', n: 'Anne-babanı ziyaret et', en: 10, max: 1, d: 'Aile bağı +', if: () => aliveParent().length && g.phase !== 'child', f: m => { aliveParent().forEach(p => relAdj(p, 6 * m)); touch('par'); g.hap += 2; } },
  { id: 'ev_kardes', g: 'Yaşam', n: 'Kardeşlerinle buluş', en: 6, max: 1, d: 'Kardeş bağı +', if: () => g.fam.sibs.some(s => s.age > 10), f: m => { g.fam.sibs.forEach(s => relAdj(s, 5 * m)); g.hap += 1; } },
  { id: 'ev_arkadas', g: 'Yaşam', n: 'Arkadaşlarınla buluş', en: 8, max: 2, cost: 1, d: 'Dostluk +, mutluluk +', if: () => (g.friends || []).some(f => !f.dead), f: m => { g.friends.forEach((f, i) => { if (!f.dead) { relAdj(f, 5 * m); touch('f' + i); } }); g.hap += 4; } },
  { id: 'ev_tanis', g: 'Yaşam', n: 'Dışarı çık, yeni insanlarla tanış', en: 10, max: 1, d: 'İlişki fırsatı', if: () => !g.fam.partner && g.age >= 18, f: () => { g.hap += 2; if (Math.random() < .35 && !g.ev) g.ev = buildEv(EVMAP.tanis); } },
  { id: 'ev_hayir', g: 'Yaşam', n: 'Hastanedeki çocukları ziyaret et', en: 8, max: 1, d: 'Ün +, mutluluk +', f: () => { g.rep = cl(g.rep + 1.5, 0, 100); g.hap += 4; } },
  { id: 'is_vardiya', g: 'İş', n: () => g.job ? `İşe git: ${JOBLIST[g.job.k].n}` : 'İşe git', en: () => g.job ? JOBLIST[g.job.k].en : 15, max: 3, d: () => g.job ? `Kazanç ${fm(JOBLIST[g.job.k].pay)}` : '', if: () => g.job, f: m => { money(JOBLIST[g.job.k].pay * m); g.fit = clr(g.fit - 3, 0, 100); } },
  { id: 'is_sirket', g: 'İş', n: 'Şirket toplantıları', en: 10, max: 2, d: 'Şirket performansı +', if: () => g.fin.biz.length, f: m => { g.bizE = (g.bizE || 0) + 25 * m; } },
  { id: 'is_yatirim', g: 'İş', n: 'Yatırım araştırması', en: 8, max: 1, d: 'Portföy getirisi +', if: () => portVal() > 0, f: m => { g.invE = Math.min(12, (g.invE || 0) + 1 * m); } },
  { id: 'is_kurs', g: 'İş', n: 'Kurs dersine çalış', en: 12, max: 2, d: () => g.licYr ? `${LIC[g.lic + 1]} ilerlemesi` : 'Eğitim +', if: () => g.licYr || g.age >= 16, f: m => { if (g.licYr) { g.licP = (g.licP || 0) + m; if (g.licP >= LIC_N[g.lic + 1]) licDone(); } else g.edu = Math.min(5, g.edu + .1 * m); } },
  { id: 'md_sosyal', g: 'Medya', n: 'Sosyal medya paylaşımı', en: 4, max: 2, d: 'Ün +', f: m => { g.rep = cl(g.rep + .5 * m, 0, 100); } },
  { id: 'md_roportaj', g: 'Medya', n: 'Röportaj ver', en: 8, max: 1, d: 'Ün ++', if: () => g.rep >= 10, f: m => { g.rep = cl(g.rep + 1.5 * m, 0, 100); money(Math.round(g.rep / 10)); } },
  { id: 'md_reklam', g: 'Medya', n: 'Reklam çekimi', en: 12, max: 1, d: 'Sponsor geliri', if: () => g.fin.spons.length, f: m => { money(Math.round(g.fin.spons.reduce((s, x) => s + x.v, 0) * .04 * m)); g.rep = cl(g.rep + .5, 0, 100); } },
  { id: 'md_imza', g: 'Medya', n: 'Taraftar imza günü', en: 8, max: 1, d: 'Moral +, uyum +', if: () => g.club, f: () => { g.mor = clr(g.mor + 4, 0, 100); g.uyum = clr((g.uyum || 50) + 1, 0, 100); g.rep = cl(g.rep + .5, 0, 100); } },
];
/* ---------- Özel yetenekler: belirli çalışmayı tekrarlayınca açılır, maçta gerçekten etki eder ---------- */
const PERKS = {
  falso: { n: 'Frikik ustası', d: 'Vuruşların daha çok falso alır', dr: 'Duran top ve falso çalışması', st: 'sut', min: 62, need: 10 },
  bitirici: { n: 'Bitirici', d: 'Ceza sahası içinde şut isabeti artar', dr: 'Kale önünde bitiricilik', st: 'sut', min: 66, need: 12 },
  uzak: { n: 'Uzaktan şutör', d: 'Ceza sahası dışından isabet artar', dr: 'Uzaktan şut çalışması', st: 'sut', min: 64, need: 12 },
  hava: { n: 'Hava hâkimi', d: 'Kafa vuruşları isabetli ve güçlü', dr: 'Kafa ve zıplama çalışması', st: 'fiz', min: 60, need: 10 },
  pasor: { n: 'Oyun kurucu', d: 'Paslar daha isabetli', dr: 'Uzun ve ara pas çalışması', st: 'pas', min: 64, need: 12 },
  kontrol: { n: 'İlk dokunuş', d: 'Sert gelen topu kolay kontrol edersin', dr: 'Top karşılama çalışması', st: 'tek', min: 60, need: 10 },
  calim: { n: 'Çalımcı', d: 'Müdahalelerden daha kolay sıyrılırsın', dr: 'Birebir çalım çalışması', st: 'tek', min: 64, need: 12 },
  kesici: { n: 'Top kesici', d: 'Müdahalelerin daha başarılı', dr: 'Zamanlama ve müdahale çalışması', st: 'def', min: 60, need: 10 },
  soguk: { n: 'Soğukkanlı', d: 'Penaltıda titremezsin', dr: 'Penaltı çalışması', st: 'sut', min: 55, need: 8 },
};
Object.entries(PERKS).forEach(([k, pk]) => ACTS.push({ id: 'dr_' + k, g: 'Özel çalışma', n: pk.dr, en: 10, max: 1, d: () => g.perks && g.perks[k] ? `✔ ${pk.n} (tekrar: ${KN[pk.st]} +)` : `${pk.n} yolunda: ${(g.perkP || {})[k] || 0}/${pk.need} · ${KN[pk.st]} en az ${pk.min}`, if: () => g.phase === 'pro' || g.phase === 'free', f: () => { xpAdd(pk.st, .12); g.perkP = g.perkP || {}; g.perks = g.perks || {}; g.perkP[k] = (g.perkP[k] || 0) + 1; if (!g.perks[k] && g.perkP[k] >= pk.need && g.st[pk.st] >= pk.min) { g.perks[k] = 1; L(`✨ Yeni özel yetenek: ${pk.n}! ${pk.d}.`); g.perkNew = k; } } }));
const actCost = a => Math.round(famCost(a.cost) + ((g.con && g.con.sal) || 0) * .0015 * a.cost);
const actVal = (a, k) => typeof a[k] === 'function' ? a[k]() : a[k];
function canAct(a) { if (a.if && !a.if()) return 'yok'; const en = actVal(a, 'en'); if ((g.wa || {})[a.id] >= (a.max || 1)) return 'Bu dönem sınırına ulaştın'; if (g.en < en) return `Enerjin yetmiyor (${en} gerekli, ${Math.round(g.en)} kaldı)`; if (a.cost && g.money < famCost(a.cost)) return 'Paran yetmiyor'; return ''; }
function doAct(id, quiet) {
  const a = ACTS.find(x => x.id === id); if (!a) return; const why = canAct(a); if (why) { if (!quiet) toast(why); return; }
  const m = g.phase === 'retired' ? 3 : 1;
  g.en -= actVal(a, 'en'); g.wa = g.wa || {}; g.wa[id] = (g.wa[id] || 0) + 1; if (a.cost) money(-actCost(a), actVal(a, 'n'));
  const before = { ...g.st }, xb = { ...g.xp };
  MCTX = actVal(a, 'n'); a.f(m); MCTX = ''; tidy();
  const up = K.filter(k => g.st[k] > before[k]).map(k => `${T(KN[k])} ${before[k]}→${g.st[k]}`), prog = K.filter(k => g.st[k] === before[k] && g.xp[k] > xb[k] + .001).map(k => `${T(KN[k])} %${Math.round(g.xp[k] * 100)}`);
  const pk = g.perkNew ? PERKS[g.perkNew].n : ''; g.perkNew = null;
  if (quiet) { if (pk) L(`✨ Yeni yetenek: ${pk}!`); return 1; }
  toast(pk ? `✨ Yeni yetenek: ${pk}!` : up.length ? `⬆ ${up.join(', ')}` : prog.length ? `${actVal(a, 'n')} · ${prog.join(', ')} · −${actVal(a, 'en')}⚡` : `${actVal(a, 'n')} · −${actVal(a, 'en')}⚡`); sv(); draw();
}
/* Kalan enerji: seçili rutine göre otomatik harcanır */
/* Hafta planı: otomatik doldurma görünür şekilde eylemleri yapar; kalan enerji dinlenmeye döner */
const PRESETS = { 'Gelişim': {}, 'Dengeli': {}, 'Aile': {}, 'Dinlen': {} };
const PLAN = {
  'Gelişim': ['F', 'F', 'F', 'tr_video', 'tr_takim', 'X', 'X', 're_fizyo'],
  'Dengeli': ['F', 'F', 'tr_takim', 'ev_partner', 'ev_cocuk', 'ev_arkadas', 'ev_aile', 're_uyku'],
  'Aile': ['ev_partner', 'ev_partner', 'ev_cocuk', 'ev_cocuk', 'ev_aile', 'ev_kardes', 'ev_arkadas', 'F'],
  'Dinlen': ['re_uyku', 're_fizyo'],
};
function autoPlan(name, quiet) {
  const focus = g.focus || (g.pos === 'DF' ? 'def' : g.pos === 'MF' ? 'pas' : 'sut'), sec = K.filter(k => k !== focus).sort((a, b) => (g.pot - g.st[b]) - (g.pot - g.st[a]))[0];
  const done = []; (PLAN[name] || PLAN['Dengeli']).forEach(id0 => { const id = id0 === 'F' ? 'tr_' + focus : id0 === 'X' ? 'tr_' + sec : id0; const a = ACTS.find(x => x.id === id); if (a && g.phase !== 'child' && !canAct(a) && doAct(id, 1)) done.push(actVal(a, 'n')); });
  if (!quiet) { toast(done.length ? `${name}: ${done.length} iş yapıldı · kalan ${Math.round(g.en)}⚡` : 'Plana uygun yapılacak iş kalmadı'); sv(); draw(); }
  return done;
}
/* Harcanmayan enerji = dinlenme: her 10⚡ → +2 kondisyon, biraz mutluluk */
function restLeft() { const e = Math.max(0, g.en || 0); g.fit = clr(g.fit + e * .2, 0, 100); g.hap = clr(g.hap + e * .02, 0, 100); g.lastRest = Math.round(e); g.en = 0; }
function routine() { autoPlan(g.routine || 'Dengeli', 1); restLeft(); }

/* ---------- Haftalık döngü ---------- */
function teamTraining() {
  const a = g.age;
  K.forEach(k => xpAdd(k, .045));
  if (a >= 30) K.forEach(k => { if ((k === 'hiz' || k === 'fiz') && Math.random() < .011 * (a - 29)) { g.st[k] = Math.max(1, g.st[k] - 1); g.wk.loss[k] = 1; } else if (a >= 33 && Math.random() < .005 * (a - 32)) { g.st[k] = Math.max(1, g.st[k] - 1); g.wk.loss[k] = 1; } });
  g.fit = clr(g.fit + 9, 15, 100);
  if (g.inj > 0) { g.inj--; if (!g.inj) L('Sakatlığın geçti, takımla çalışmaya döndün.'); }
  g.uyum = clr((g.uyum || 50) + .5 + (g.captain ? .3 : 0), 0, 100);
  g.mor = clr(g.mor + (60 - g.mor) * .05, 0, 100);
}
function injure(w, where) {
  if (Math.random() < .06 + (g.age > 29 ? .05 : 0) + (g.fit < 40 ? .05 : 0)) {
    const k = P(['hiz', 'fiz', 'tek']), x = R(3, 6); g.st[k] = Math.max(1, g.st[k] - x); g.cap[k] = Math.max(25, Math.min(g.cap[k], g.st[k] + R(3, 8)));
    g.inj = R(8, 16); g.sc.push({ a: g.age, t: `Ağır sakatlık: ${KN[k]} kalıcı olarak düştü` }); L(`Ağır sakatlık ${where}! ${KN[k]} artık eskisi gibi olmayacak. ${g.inj} hafta yoksun.`);
  } else { g.inj = Math.max(g.inj, w); L(`Sakatlandın (${where}), ${w} hafta yoksun.`); }
}
function payWeek() {
  const fy = g.fy || (g.fy = { inc: 0, tax: 0, exp: 0, agent: 0, spons: 0, rent: 0, job: 0 });
  if (g.con && g.club && !g.loanFree) {
    const ct = g.loan ? g.loan.ct : g.club.ct, gross = (g.con.sal + (g.loan ? g.loan.top || 0 : 0)) / SEASON_W, ag = gross * agentCut(), tx = gross * cinfo(ct).tax;
    money(gross - ag - tx, g.loan ? 'Maaş (ana kulüp) + kiralık katkısı' : 'Maaş (vergi ve menajer sonrası)'); fy.inc += gross; fy.tax += tx; fy.agent += ag;
  }
  if (g.coach) { const gross = g.coach.sal / SEASON_W, tx = gross * cinfo(g.coach.ct).tax, ag = gross * CAG[g.cag || 0].cut; money(gross - tx - ag, 'Teknik direktör maaşı'); fy.inc += gross; fy.tax += tx; fy.agent += ag; }
  const ex = expenses(), wk = ex.total / SEASON_W; money(-wk, 'Yaşam giderleri (kira, faturalar…)'); fy.exp += wk; fy.rent += ex.rent / SEASON_W;
}
/* Seçilme */
function selection(info) {
  if (g.inj > 0) return { out: 1, why: `Sakatsın (${g.inj} hafta)` };
  if (g.susp > 0 && !info.nt) { g.susp--; return { out: 1, why: 'Kırmızı kart cezalısın' }; }
  let role = g.role;
  if (info.nt) role = roleFor(effOvr(), ntStr(ntCt()) - 4 - (info.u21 ? 9 : 0), g.age);
  const fb = (g.form - 6.5) * .08 + (g.coachBonus || 0) * .05 + ((g.uyum || 50) - 50) / 400;
  if (g.fit < 45 && role < 4) return Math.random() < .5 ? { sub: 1, on: R(60, 80), why: 'Yorgunsun, kulübede başlıyorsun' } : { out: 1, why: 'Yorgunluk nedeniyle dinlendirildin' };
  if (Math.random() < START_P[role] + fb) return { start: 1, off: role >= 3 || Math.random() < .6 ? 90 : R(62, 82) };
  if (Math.random() < SUB_P[role]) return { sub: 1, on: R(55, 82), why: 'Yedek kulübesindesin' };
  return { out: 1, why: role === 0 ? 'Genç takımdasın; A takım kadrosunda yer almadın' : 'Teknik direktör seni kadroya almadı' };
}
function weekStart(auto) {
  if (g.phase !== 'pro') return;
  g.tw = (g.tw || 0) + 1; g.wk = { gain: {}, loss: {} };
  teamTraining(); payWeek(); relWeek();
  if (g.week % 4 === 0) roleCheck();
  if (g.week === 23 && Math.random() < .45 + (g.form - 6.5) * .2 + (g.wantOut ? .3 : 0)) g.winQ = 1;
  if (BREAKS.includes(g.week) && !g.ev && !g.ntLock && g.club && g.age >= 17) { const alt = (g.nats || []).filter(n => n.ct !== ntCt() && ovr() + (g.form - 6.5) * 2 >= natNeed(n.ct) - 2 && !(g.ntNo || {})[n.ct]); if (alt.length && Math.random() < .55) { const n = P(alt); g.ev = { id: 'ntoffer', x: { ct: n.ct, why: n.why }, t: NTOFFER_EV.t({ ct: n.ct, why: n.why }) }; if (auto) { g.ev = null; } } }
  if (BREAKS.includes(g.week) && !g.ev && !g.ntLock && !g.ntPick && g.club && g.age >= 17 && ntChoices().length > 1 && (ntEligible() || ntChoices().slice(1).some(o => ovr() + (g.form - 6.5) * 2 >= natNeed(o.ct) - 2))) g.ev = { id: 'ntchoice', x: {}, t: NTCHOICE_EV.t() };
  if (g.ev && g.ev.id === 'ntchoice') { /* önce karar */ }
  else if (BREAKS.includes(g.week) && ntEligible() && !g.ev) { g.ev = { id: 'ntcall', x: {}, t: NT_EV.t() }; if (auto) { g.ntIn = 1; g.ev = null; } }
  else if (BREAKS.includes(g.week - 1)) g.ntIn = 0;
  if (!g.ev && Math.random() < .2) { g.ev = pickAdultEvent(); if (g.ev && auto) autoChoose(); }
  g.wq = g.cal.filter(e => e.w === g.week).map(e => g.cal.indexOf(e));
  g.wres = []; g.wstage = 1; tidy();
}
function roleCheck() {
  if (!g.club) return; const c = club(g.club.id); if (!c) return;
  const eff = effOvr() + (g.coachBonus || 0) * 2 + (g.mor - 60) / 20 + (g.captain ? 1 : 0);
  const nr = roleFor(eff, c.s, g.age);
  if (nr !== g.role) { L(nr > g.role ? `Takımdaki rolün yükseldi: ${ROLES[nr]}.` : `Takımdaki rolün düştü: ${ROLES[nr]}.`); g.role = nr; }
  if (g.con && g.con.promise && g.role < g.con.role) { g.mor -= 6; L('Sözleşmede söz verilen rol verilmiyor; morali bozuk.'); }
  g.coachBonus = 0;
}
function nextWeekMatch() {
  while (g.wq && g.wq.length) { const e = g.cal[g.wq[0]], info = e && entryInfo(e); if (!info) { g.wq.shift(); continue; } return { e, info }; }
  return null;
}
function weekEnd() {
  restLeft(); bpXP(5);
  g.wstage = 0; g.wq = null; g.week++; g.en = enMax(); g.wa = {};
  if (g.week === 24 && g.winQ) { g.winQ = 0; return startOffers('win'); }
  if (g.week > SEASON_W) return seasonEnd();
  sv(); draw();
}
function simWeeks(n) {
  for (let i = 0; i < n && g.phase === 'pro' && scr === 'game'; i++) {
    if (!g.wstage) weekStart(1);
    if (g.ev && g.ev.id === 'ntchoice') { toast('Milli takım kararını vermen gerekiyor'); break; }
    if (g.ev) autoChoose();
    let m; while ((m = nextWeekMatch())) { m.info.sel = selection(m.info); const res = quickMatch(m.e, m.info); applyMatch(m.e, m.info, res); g.wq.shift(); }
    autoPlan(g.routine || 'Dengeli', 1); const wk = g.week; weekEnd(); if (g.week === wk || scr !== 'game') break;
  }
  sv(); draw();
}

/* ---------- Sezon sonu ---------- */
function seasonEnd() {
  const out = { lines: [] }, cid = g.club && g.club.id, ss = g.ss;
  if (g.lg) {
    const T = sortT(g.lg.teams), pos = T.findIndex(x => x.id === myClubId()) + 1;
    out.pos = pos; out.league = tierName(g.lg.ct, g.lg.t);
    if (pos === 1 && g.lg.t === 1 && ss.ap >= 10 && g.club) { g.car.t++; out.lines.push(`🏆 ${out.league} ŞAMPİYONU!`); g.hap += 10; g.rep += 6; }
    else out.lines.push(`Ligi ${pos}. sırada bitirdiniz.`);
  }
  const t0 = g.lg ? g.lg.t : 0;
  closeSeason();
  if (cid && club(cid) && t0) { const c = club(cid); if (c.t < t0) out.lines.push('Takımın üst lige çıktı!'); if (c.t > t0) out.lines.push('Takımın küme düştü.'); }
  const avg = ss.ap ? ss.rs / ss.ap : 0;
  if (ss.ap >= 15 && avg >= 7.6 && ovr() >= 84 && t0 === 1) { g.car.bal = (g.car.bal || 0) + 1; out.lines.push('🥇 Altın Top senin!'); g.rep += 15; g.hap += 15; }
  else if (ss.ap >= 15 && avg >= 7.3) { g.car.sezon = (g.car.sezon || 0) + 1; out.lines.push('⭐ Ligin en iyi oyuncusu seçildin.'); g.rep += 5; }
  if (ss.g >= 20 && g.pos !== 'DF') { g.car.gk = (g.car.gk || 0) + 1; out.lines.push(`👟 Gol kralı oldun (${ss.g} gol).`); }
  const sfTxt = g.sf >= 2.5 ? 'Bu sezon hayatının formundaydın.' : g.sf <= -2.5 ? 'Bu sezon hiçbir şey yolunda gitmedi.' : '';
  if (sfTxt) out.lines.push(sfTxt);
  g.seasons.unshift({ y: g.season, c: g.club ? g.club.n : '—', ap: ss.ap, g: ss.g, a: ss.a, r: avg ? +avg.toFixed(2) : 0, role: ROLES[g.role] || '—' });
  const h = g.hist[g.hist.length - 1]; if (h && !h.y1 && g.club && h.id === g.club.id) { h.ap += ss.ap; h.g += ss.g; h.a += ss.a; h.role = g.role; }
  out.ss = { ...ss, avg };
  yearTick(out);
  if (g.licYr && (g.licP || 0) >= LIC_N[g.lic + 1]) licDone();
  /* kiralık dönüş */
  if (g.loan) { const Ln = g.loan; L(`Kiralık dönemin bitti; ${clubName(Ln.n)} kulübüne döndün.`); closeHist(); if (!isUserManaged(g.club.id)) dropSquad(g.club.id); g.club = { id: Ln.from, ct: Ln.ct, n: Ln.n }; g.con = Ln.con; g.loan = null; ensureSquad(g.club.id); g.uyum = 45; g.hist.push({ id: Ln.from, n: Ln.n, ct: Ln.ct, t: club(Ln.from).t, s: club(Ln.from).s, y0: g.season + 1, y1: null, ap: 0, g: 0, a: 0, role: g.role, sal: g.con ? g.con.sal : 0, how: 'kiralıktan dönüş' }); }
  if (g.con) {
    g.con.yrs--; g.clubYears = (g.clubYears || 0) + 1;
    if (g.con.yrs <= 0) {
      if (g.con.loyal) { money(g.con.loyal, 'Sadakat primi'); out.lines.push(`Sadakat primi: ${fm(g.con.loyal)}.`); }
      out.lines.push(`${cname(g.club.id)} ile sözleşmen bitti. Serbest oyuncusun.`); L(`${cname(g.club.id)} ile sözleşmen sona erdi.`);
      closeHist(); dropSquad(g.club.id); g.con = null; g.club = null; g.captain = 0; g.phase = 'free';
    }
  }
  bpXP(40); g.lastSeason = out; g.season++; g.week = 1; g.ss = { ap: 0, g: 0, a: 0, rs: 0, st: 0 };
  g.cal = []; g.lg = null; g.cup = null; g.euro = null; g.en = enMax(); g.wa = {};
  g.sf = clr(gauss() * ({ istikrarli: .9, dalgali: 3.2 }[g.arc] || 1.7), -6, 6);
  if (g.ended) { scr = 'game'; sv(); draw(); return; }
  scr = 'season'; g.seasonPending = 1; sv(); draw();
}
function seasonGo() {
  g.seasonPending = 0;
  const nt = ntSummer();
  if (nt) { g.tourInv = nt; scr = 'tourinv'; sv(); draw(); return; }
  seasonNext();
}
function seasonNext() {
  if (g.phase === 'free') return startOffers('free');
  if (g.club && g.con && g.con.yrs === 1 && g.role >= 2 && !g.noRenew && !g.loan) { g.after = 'newSeason'; return startOffers('renew'); }
  newSeasonOffers();
}
function newSeasonOffers() {
  if (g.phase === 'pro' && Math.random() < .3 + (g.form - 6.5) * .2 + (g.wantOut ? .45 : 0) + (g.role <= 1 && g.age <= 22 ? .3 : 0)) { g.after = 'setup'; g.wantOut = 0; return startOffers('win'); }
  if (g.phase === 'pro') setupSeason();
  scr = 'game'; tab = 'home'; sv(); draw();
}
function yearTick(out) {
  g.age++; famAge(); rvYear(); finYear(out); ownYear(out); sqYear();
  if (g.age >= 30 && g.phase !== 'child') K.forEach(k => { if (Math.random() < (g.age - 29) * .08) g.st[k] = Math.max(1, g.st[k] - 1); });
  if (g.age >= 40 && g.club) { L('40 yaşında kramponları astın.'); retire(1); }
  if (g.age >= 72 && Math.random() < (g.age - 70) / 40 * (g.hp < 50 ? 1.6 : 1)) { g.ended = 1; L('Hayatını kaybettin.'); }
  g.peak = Math.max(g.peak || 0, ovr());
  allOwn().forEach(o => youthIntake(o.id, o.acad));
  if (g.coach && !ownById(g.coach.id)) youthIntake(g.coach.id, 1 + ((g.coach.staff || {}).genc || 0));
  if (!g.ev && Math.random() < .5) g.ev = pickAdultEvent();
  tidy();
}
function retire(silent) {
  if (g.club) { L(`Futbolu bıraktın. Son kulübün: ${cname(g.club.id)}.`); closeHist(); if (!isUserManaged(g.club.id)) dropSquad(g.club.id); }
  g.club = null; g.con = null; g.phase = 'retired'; g.cal = []; g.lg = null; g.cup = null; g.euro = null; g.role = 0; g.captain = 0; g.loan = null; g.en = enMax(); g.wa = {};
  if (!silent) { sv(); draw(); }
}
/* Emeklilikte bir yıl: kalan enerji rutine gider, işler yıllık kazandırır */
function retiredYear() {
  if (g.coach) return;
  const fy = g.fy || (g.fy = { inc: 0, tax: 0, exp: 0, agent: 0, spons: 0, rent: 0, job: 0 });
  const ex = expenses(); money(-ex.total, 'Yıllık yaşam giderleri'); fy.exp += ex.total; fy.rent += ex.rent;
  if (g.job) { const j = JOBLIST[g.job.k], inc = j.pay * 46 * .6; money(inc * (1 - cinfo(g.ct).tax), 'İş geliri'); fy.inc += inc; fy.tax += inc * cinfo(g.ct).tax; fy.job += inc; }
  routine();
  if (g.lic >= 1 && !g.coach) { interestTick(); interestTick(); interestOffer(); }
  g.tw = (g.tw || 0) + 46;
  if (g.fam.partner && !(g.wa || {}).ev_partner) relAdj(g.fam.partner, -10);
  if (g.fam.partner && (g.wa || {}).ev_partner) touch('p');
  g.fam.kids.forEach((k, i) => { if (!(g.wa || {}).ev_cocuk && k.age < 25) relAdj(k, -6); });
  (g.friends || []).forEach(f => { if (!(g.wa || {}).ev_arkadas) relAdj(f, -6); });
  const out = { lines: [] };
  closeSeason(); g.season++;
  yearTick(out); if (g.licYr) licDone();
  g.en = enMax(); g.wa = {};
  g.lastSeason = out; sv(); draw();
}
function tidy() { K.forEach(k => g.st[k] = clr(g.st[k], 1, 99)); g.hp = clr(g.hp, 1, 100); g.hap = clr(g.hap, 0, 100); g.mor = clr(g.mor, 0, 100); g.fit = clr(g.fit, 0, 100); g.rep = cl(g.rep, 0, 100); g.form = cl(g.form, 3, 10); if (g.uyum != null) g.uyum = clr(g.uyum, 0, 100); g.en = cl(g.en || 0, 0, 200); }

/* ---------- Milli takım yaz turnuvaları ---------- */
const ELN = { 'Son 16': "Son 16'da elendi", 'Çeyrek Final': 'Çeyrek finalde elendi', 'Yarı Final': 'Yarı finalde elendi', 'Final': 'Finalist' };
function ntSummer() {
  if (!g.club || g.age < 18 || g.age > 37 || g.ntRet || ovr() + (g.form - 6.5) * 2 < natNeed(ntCt())) return null;
  const y = g.season, ci = { k: ntK(ntCt()) }; let n = null, wc = 0;
  if (y % 4 === 2) { n = 'Dünya Kupası'; wc = 1; } else if (y % 4 === 0) n = (CONT[ci.k] || CONT.e).nt;
  if (!n) return null;
  if (Math.random() > cl((ntStr(ntCt()) - 70) / 16, .3, .95)) { L(`${ntCt()}, ${y} ${n} elemelerini geçemedi.`); return null; }
  return { n, wc };
}
function tourAccept(yes) {
  const t = g.tourInv; g.tourInv = null;
  if (!yes) { L(`${t.n} kadrosundan çekildin.`); g.rep -= 3; g.fit = 100; sv(); return seasonNext(); }
  L(`${g.season} ${t.n} kadrosundasın!`); g.after = 'seasonNext'; startTour(t);
}
function startTour(t) {
  const k = ntK(ntCt()), kont = ntK;
  const pool = COUNTRIES.map(c => c.n).concat(NATIONS.map(x => x[0])).filter(n => n !== ntCt() && (t.wc || kont(n) === k)).sort((a, b) => ntStr(b) - ntStr(a));
  const third = Math.ceil(pool.length / 3), gr = [];
  [0, 1, 2].forEach(i => { const c = pool.slice(i * third, (i + 1) * third).filter(x => !gr.includes(x)); gr.push(P(c.length ? c : pool.filter(x => !gr.includes(x)))); });
  const row = n => ({ id: n, n, W: 0, D: 0, L: 0, GF: 0, GA: 0, pt: 0 });
  g.tour = { n: t.n, y: g.season, wc: t.wc, grp: [row(ntCt()), ...gr.map(row)], gm: 0, ko: 0, kos: t.wc ? ['Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'] : ['Çeyrek Final', 'Yarı Final', 'Final'], pool: pool.filter(x => !gr.includes(x)), alive: 1, log: [] };
  scr = 'tour'; sv(); draw();
}
function tourInfo() {
  const T = g.tour; if (!T || !T.alive) return null;
  const wx = weatherFor(T.y % 2 ? 2 : 44, g.ct);
  if (T.gm < 3) return { comp: T.n, short: 'Milli', nt: 1, tour: 1, on: T.grp[T.gm + 1].n, home: true, neutral: 1, round: `Grup ${T.gm + 1}. maç`, wx };
  if (!T.cur) { const n = Math.max(1, Math.ceil(T.pool.length * (1 - T.ko / 5))); T.cur = P(T.pool.slice(0, n)); }
  return { comp: T.n, short: 'Milli', nt: 1, tour: 1, on: T.cur, home: true, neutral: 1, ko: 1, round: T.kos[T.ko], wx };
}
function tourApply(info, res) {
  const T = g.tour, us = res.sc[0], th = res.sc[1];
  T.log.unshift(`${info.round}: ${ntCt()} ${us}-${th} ${info.on}${res.pens ? ` (pen. ${res.pens[0]}-${res.pens[1]})` : ''}${res.my.played ? ` · puanın ${res.my.rating}${res.my.g ? ', ' + res.my.g + ' gol' : ''}` : ''}`);
  if (T.gm < 3) {
    const me = T.grp[0], o = T.grp[T.gm + 1]; rec(me, us, th); rec(o, th, us); T.gm++;
    if (T.gm === 3) { const [, a, b, c] = T.grp; [[a, b], [a, c], [b, c]].forEach(([x, y]) => { const s = quickScore(ntStr(x.n), ntStr(y.n)); rec(x, s[0], s[1]); rec(y, s[1], s[0]); }); const pos = sortT(T.grp).findIndex(x => x.n === ntCt()) + 1; if (pos > 2) { T.alive = 0; T.end = 'Grupta elendi'; } }
  } else if (res.win) { T.pool = T.pool.filter(x => x !== T.cur); T.cur = null; T.ko++; if (T.ko >= T.kos.length) { T.alive = 0; T.won = 1; T.end = 'Şampiyon'; } }
  else { T.alive = 0; T.end = ELN[T.kos[T.ko]]; T.by = T.cur; }
}
function playTour() { const info = tourInfo(); if (!info) return; info.sel = selection(info); M = mkMatch({ k: 'T' }, info, info.sel); M.src = 'tour'; M.stage = 'live'; scr = 'match'; draw(); }
function quickTour() { const info = tourInfo(); if (!info) return; info.sel = selection(info); const res = quickMatch({ k: 'T' }, info); applyMatch({ k: 'T' }, info, res); sv(); draw(); }
function tourEnd() {
  const T = g.tour; g.trh.unshift({ y: T.y, n: T.n, r: T.end, nt: 1 });
  if (T.won) { if (T.wc) g.ntw.wc++; else g.ntw.rc++; g.hap += 20; g.rep += 15; L(`🏆 ${T.y} ${T.n} ŞAMPİYONU! Ülken sokaklarda.`); news(`${T.y} ${T.n} şampiyonu: ${ntCt()}`); }
  else { L(`${T.y} ${T.n}: ${T.end}.`); const S2 = [...T.pool].sort((x, y) => ntStr(y) - ntStr(x)); news(`${T.y} ${T.n} şampiyonu: ${T.by && Math.random() < .4 ? T.by : S2[R(0, Math.min(2, S2.length - 1))]}`); }
  g.tour = null; scr = 'game'; sv();
  const a = g.after; g.after = null; if (a === 'seasonNext') return seasonNext(); draw();
}

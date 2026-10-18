/* ============================================================
   MİRAS FC — PAZARLIK MASASI
   Kulübün gizli sınırları (ne kadar istediğine göre), sabır,
   karşı teklif, menajerin konuşması, kalem kalem sözleşme.
   ============================================================ */
const SD_NAMES = ['Erdem Kaya', 'Michael Brandt', 'Javier Ortega', 'Luca Bernardi', 'Pierre Laurent', 'Tom Hughes', 'Rafael Costa', 'Nicolás Ferreyra', 'Selim Aksoy', 'Thomas Wolf'];
const NEGK = [
  { k: 'sal', n: 'Yıllık maaş', step: o => Math.max(1, Math.round(o.sal * .05)), fmt: v => fm(v) },
  { k: 'yrs', n: 'Sözleşme süresi', step: () => 1, fmt: v => v + ' yıl', min: 1, max: 5 },
  { k: 'bonus', n: 'İmza parası', step: o => Math.max(1, Math.round(o.sal * .05)), fmt: v => fm(v) },
  { k: 'role', n: 'Rol garantisi', step: () => 1, fmt: v => ROLES[v], min: 0, max: 4 },
  { k: 'app', n: 'Maç başı prim', step: o => Math.max(1, Math.round(o.sal * .002)), fmt: v => fm(v) },
  { k: 'goal', n: 'Gol / asist primi', step: o => Math.max(1, Math.round(o.sal * .003)), fmt: v => fm(v) },
  { k: 'rel', n: 'Serbest kalma bedeli', step: o => Math.max(5, Math.round(o.rel * .1)), fmt: v => fm(v), lowGood: 1 },
  { k: 'house', n: 'Kulüp evi', step: () => 1, fmt: v => v ? 'Var' : 'Yok', min: 0, max: 1 },
  { k: 'car', n: 'Kulüp aracı', step: () => 1, fmt: v => v ? 'Var' : 'Yok', min: 0, max: 1 },
  { k: 'img', n: 'İmaj hakları payı', step: () => 5, fmt: v => '%' + v, min: 0, max: 40 },
  { k: 'loyal', n: 'Sadakat primi (sözleşme sonunda)', step: o => Math.max(1, Math.round(o.sal * .05)), fmt: v => fm(v) },
];
function negoOpen(i) {
  const o = g.of[i]; if (!o || o.gone) return;
  const c = club(o.id), want = cl((ovr() - o.s + 12) / 22, 0, 1) + (g.agent ? .06 * g.agent : 0) + g.rep / 250 + (o.rich ? .25 : 0) + (o.home ? .15 : 0);
  const base = { sal: o.sal, yrs: o.yrs, bonus: o.bonus, role: o.role, app: o.app, goal: o.goal, rel: o.rel, house: o.house, car: o.car, img: o.img, loyal: 0 };
  const max = {
    sal: Math.round(o.sal * (1.08 + want * .5)), yrs: g.age >= 31 ? Math.min(3, o.yrs + 1) : 5, bonus: Math.round(o.bonus * (1.4 + want) + 5), role: Math.min(4, o.role + (want > .55 ? 1 : 0)),
    app: Math.round(o.app * (1.4 + want)), goal: Math.round(o.goal * (1.4 + want)), rel: Math.round(o.rel * (.75 - want * .35)), house: want > .35 || o.rich ? 1 : o.house, car: want > .3 ? 1 : o.car, img: Math.round(5 + want * 30), loyal: Math.round(o.sal * .35 * want),
  };
  const sd = P(SD_NAMES);
  g.nego = { oi: i, sd, pat: 100, round: 0, dem: { ...base }, base, max, log: [`${sd} masaya oturdu: “${o.rich ? 'Paramız var, ama aptal değiliz.' : want > .6 ? 'Seni gerçekten istiyoruz.' : 'Teklifimiz ortada.'}”`] };
  scr = 'nego'; sv(); draw();
}
function negoAdj(k, d) {
  const N = g.nego; if (!N) return; const o = g.of[N.oi], def = NEGK.find(x => x.k === k);
  let v = N.dem[k] + d * def.step(o);
  if (def.min != null) v = cl(v, def.min, def.max);
  v = Math.max(0, Math.round(v)); N.dem[k] = v; sv(); draw();
}
/* Kulübün değerlendirmesi */
function negoEval() {
  const N = g.nego, o = g.of[N.oi], B = N.base, X = N.max, D = N.dem; let over = 0, refuse = [], spend = 0;
  for (const def of NEGK) {
    const k = def.k, b = B[k], m = X[k], d = D[k];
    if (def.lowGood) { if (d < m) { over += (m - d) / Math.max(1, b - m + 1) * 1.2; refuse.push(k); } else if (d < b) spend += (b - d) / Math.max(1, b - m + 1) * .3; continue; }
    if (d > m) { over += (d - m) / Math.max(1, m - b || m * .2 || 1); refuse.push(k); }
    else if (d > b) spend += (d - b) / Math.max(1, m - b);
  }
  return { over, refuse, spend };
}
function negoSubmit(agent) {
  const N = g.nego; if (!N) return; const o = g.of[N.oi]; N.round++;
  if (agent && g.agent) { /* menajer: sınırların hemen altına çeker */ for (const def of NEGK) { const k = def.k; if (def.lowGood) N.dem[k] = Math.round(Math.max(N.max[k], N.dem[k] * .5 + N.max[k] * .5)); else N.dem[k] = Math.round(N.base[k] + (N.max[k] - N.base[k]) * (.75 + Math.random() * .2)); } N.log.unshift(`Menajerin söz aldı ve masayı yönetti.`); }
  const E = negoEval();
  const greedy = E.spend > 4.5;
  if (!E.refuse.length && !greedy) {
    N.log.unshift(`${N.sd}: “Anlaştık. Hoş geldin!”`);
    Object.assign(o, { sal: N.dem.sal, yrs: N.dem.yrs, bonus: N.dem.bonus, role: N.dem.role, promise: N.dem.role > N.base.role ? 1 : 0, app: N.dem.app, goal: N.dem.goal, rel: N.dem.rel, house: N.dem.house, car: N.dem.car, img: N.dem.img, loyal: N.dem.loyal });
    g.val.pa = clr(g.val.pa + (E.spend > 2 ? 2 : 0), 0, 100); N.done = 1; sv(); draw(); return;
  }
  const lose = Math.round(cl(8 + E.over * 14 + (greedy ? 12 : 0), 8, N.round <= 1 ? 35 : 55) - (agent && g.agent ? 8 : 0) - (g.edu >= 2 ? 3 : 0));
  N.pat = clr(N.pat - lose, 0, 100);
  if (N.pat <= 0) { N.log.unshift(`${N.sd} dosyayı kapattı: “Bu şartlarla devam edemeyiz.”`); o.gone = 1; o.msg = 'Kulüp masadan kalktı.'; N.done = -1; sv(); draw(); return; }
  /* karşı teklif: aşan kalemleri sınıra çek, açgözlüyse genelde ortala */
  const names = [];
  for (const k of E.refuse) { const def = NEGK.find(x => x.k === k); N.dem[k] = def.lowGood ? N.max[k] : N.max[k] - (Math.random() < .5 ? 0 : Math.round(def.step(o) * .5)); names.push(def.n.toLocaleLowerCase('tr')); }
  if (greedy && !E.refuse.length) { for (const def of NEGK) if (!def.lowGood && N.dem[def.k] > N.base[def.k]) N.dem[def.k] = Math.round((N.dem[def.k] + N.base[def.k]) / 2); names.push('toplam paket'); }
  N.log.unshift(`${N.sd}: “${E.over > 2 ? P(['Bu talepler gerçekçi değil.', 'Çok uzaktayız.', 'Başka adaylarımız da var.']) : E.over > .6 ? P(['Bu rakamlar bizi zorluyor.', 'Bir adım geri atmanız lazım.', 'Yönetimi bununla ikna edemem.']) : P(['Yakınız ama tam değil.', 'Biraz daha esneyin.', 'Bir iki kalemde anlaşamıyoruz.'])} Karşı teklifimizi masaya koyduk.”`);
  sv(); draw();
}
function negoSign() { const N = g.nego; if (!N) return; const i = N.oi; if (N.done !== 1) { const o = g.of[i]; Object.assign(o, { sal: N.base.sal, yrs: N.base.yrs, bonus: N.base.bonus, role: N.base.role }); } g.nego = null; sign(i); }
function negoLeave() { g.nego = null; scr = 'offers'; sv(); draw(); }

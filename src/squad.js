/* ============================================================
   MİRAS FC — KALICI KADROLAR
   Oyuncunun kulübü, teknik direktörlük yaptığı kulüp ve sahibi
   olduğu kulüp için kadro g.sq[kulüpId] içinde tutulur.
   Bu kulüplerin gücü (c.s) kadrodan hesaplanır.
   ============================================================ */
const FORMS = { '4-4-2': { DF: 4, MF: 4, FW: 2 }, '4-3-3': { DF: 4, MF: 3, FW: 3 }, '4-2-3-1': { DF: 4, MF: 5, FW: 1 }, '3-5-2': { DF: 3, MF: 5, FW: 2 }, '5-3-2': { DF: 5, MF: 3, FW: 2 }, '4-1-4-1': { DF: 4, MF: 5, FW: 1 } };
const NUMS = { GK: [1, 12, 23, 13, 31], DF: [2, 3, 4, 5, 6, 15, 22, 24, 26, 33, 34], MF: [8, 6, 16, 14, 18, 20, 21, 25, 28, 30], FW: [9, 11, 7, 10, 17, 19, 27, 29, 99] };
const wageOf = (r, t, ct) => Math.round(Math.pow(Math.max(30, r) / 60, 5) * 520 * [0, 1, .3, .1][t || 1] * cinfo(ct).e);
const valueOf = (r, age) => Math.round(Math.pow(Math.max(30, r) / 60, 6) * 700 * (age < 22 ? 1.6 : age < 25 ? 1.35 : age < 29 ? 1 : age < 32 ? .55 : .2));
function freeNum(list, pos) { const used = new Set(list.map(p => p.num)); if (g.club && list === (g.sq || {})[g.club.id] && g.num) used.add(g.num); for (const n of NUMS[pos] || []) if (!used.has(n)) return n; for (let n = 2; n < 99; n++) if (!used.has(n)) return n; return 99; }
function newPid() { g.pid = (g.pid || 0) + 1; return g.pid; }
function ensureSquad(id) {
  g.sq = g.sq || {}; if (g.sq[id]) return g.sq[id];
  const c = club(id); if (!c) return [];
  const ct = clubCt(id), base = squad(id).filter(x => !(x.real && g.moved && g.moved[x.n] && g.moved[x.n] !== id)), list = [];
  base.forEach(x => { const pl = { id: newPid(), n: x.n, real: x.real || 0, p: x.p, r: x.r, age: x.age, pot: clr(x.r + (x.age < 22 ? R(4, 12) : x.age < 26 ? R(1, 5) : 0), x.r, 96), wage: wageOf(x.r, c.t, ct), yrs: R(1, 4), num: 0, inj: 0 }; pl.num = freeNum(list, pl.p); list.push(pl); });
  g.sq[id] = list; recalcStr(id); return list;
}
function dropSquad(id) { if (g.sq && g.sq[id] && id !== (g.club && g.club.id) && id !== (g.coach && g.coach.id) && !ownById(id)) { delete g.sq[id]; if (g.youth) delete g.youth[id]; } }
/* yorgun oyuncu (enerji < 100) seçimde geri düşer; enerji alanı yalnız teknik direktörün kadrosunda tutulur */
const enPen = p => p.en == null ? 0 : (100 - p.en) * .09;
function bestXI(id, form, excl) {
  const sq = (g.sq[id] || []).filter(p => !p.inj && !p.out && !(excl || []).includes(p.id)), F = FORMS[form || '4-4-2'] || FORMS['4-4-2'];
  const used = new Set(), xi = [];
  const pick = (pos, n) => { n -= xi.filter(x => x.p === pos).length; if (n <= 0) return 0; const L = sq.filter(p => p.p === pos && !used.has(p.id)).sort((a, b) => (b.r - enPen(b)) - (a.r - enPen(a))).slice(0, n); L.forEach(p => { used.add(p.id); xi.push(p); }); return L.length; };
  sq.filter(p => p.force && p.p !== 'GK').sort((a, b) => b.r - a.r).slice(0, 2).forEach(p => { if (xi.filter(x => x.p === p.p).length < (F[p.p] || 0)) { used.add(p.id); xi.push(p); } });
  pick('GK', 1);
  for (const pos of ['DF', 'MF', 'FW']) { pick(pos, F[pos]); let k = xi.filter(x => x.p === pos).length; while (k < F[pos]) { const alt = sq.filter(p => !used.has(p.id) && p.p !== 'GK').sort((a, b) => b.r - a.r)[0]; if (!alt) break; used.add(alt.id); xi.push({ ...alt, r: alt.r - 6, oop: 1 }); k++; } }
  return xi;
}
function recalcStr(id) {
  const c = club(id); if (!c || !g.sq || !g.sq[id]) return;
  const oo = ownById(id), form = g.coach && g.coach.id === id ? g.coach.form : oo && oo.form ? oo.form : '4-4-2';
  const xi = bestXI(id, form), all = [...g.sq[id]].sort((a, b) => b.r - a.r).slice(0, 18);
  const a = xi.reduce((s, p) => s + p.r, 0) / Math.max(1, xi.length), d = all.reduce((s, p) => s + p.r, 0) / Math.max(1, all.length);
  let bonus = 0;
  if (oo && oo.coachR && !(g.coach && g.coach.id === id)) bonus += (oo.coachR - 70) * .06 + (oo.train || 0) * .25;
  if (g.coach && g.coach.id === id) bonus += staffBonus();
  c.s = Math.round(a * .85 + d * .15 + bonus + (xi.length < 11 ? -(11 - xi.length) * 3 : 0));
}
const staffBonus = () => { const S = (g.coach && g.coach.staff) || {}; return ((S.asst || 0) * .35 + (S.ana || 0) * .2); };

/* Yıllık kadro döngüsü: yaşlanma, gelişim, sözleşmeler, emeklilik, YZ transferleri */
function sqYear() {
  for (const id in (g.sq || {})) {
    const c = club(+id); if (!c) { delete g.sq[id]; continue; }
    const ct = clubCt(+id);
    const list = g.sq[id];
    list.forEach(p => {
      p.age++;
      const d = p.age <= 21 ? R(1, 5) : p.age <= 24 ? R(0, 3) : p.age <= 29 ? R(-1, 1) : p.age <= 32 ? -R(0, 2) : -R(1, 4);
      p.r = clr(p.r + d, 30, Math.max(p.r, p.pot)); p.yrs--; p.inj = 0;
    });
    /* emeklilik ve biten sözleşmeler */
    const kept = [];
    list.forEach(p => {
      if (p.age >= 36 && Math.random() < (p.age - 34) / 4) { if (p.real) news(`${alter(p.n)} futbolu bıraktı.`); return; }
      if (p.yrs <= 0) {
        const keep = isUserManaged(+id) ? p.renew : p.r >= c.s - 6 && Math.random() < .75;
        if (keep) { p.yrs = R(1, 3); p.wage = Math.round(wageOf(p.r, c.t, ct) * (p.renew ? 1.1 : 1)); p.renew = 0; }
        else { if (isUserManaged(+id)) L(`${pname(p)} sözleşmesi bittiği için kulüpten ayrıldı.`); return; }
      }
      kept.push(p);
    });
    g.sq[id] = kept;
    /* YZ: eksik mevkileri doldur (kullanıcı yönetmiyorsa ya da kadro çok azsa) */
    if (!isUserManaged(+id) || kept.length < 16) fillSquad(+id, isUserManaged(+id) ? 16 : 24);
    recalcStr(+id);
  }
}
const isUserManaged = id => (g.coach && g.coach.id === id) || !!ownById(id);
function fillSquad(id, min) {
  const list = g.sq[id], c = club(id), ct = clubCt(id), NP = NAMES[cinfo(ct).lang] || NAMES.tr, need = { GK: 3, DF: 8, MF: 8, FW: 5 };
  list.forEach(p => need[p.p]--);
  for (const pos of ['GK', 'DF', 'MF', 'FW']) while (need[pos]-- > 0 || list.length < min) {
    const r = Math.round((c.b || c.s) - 5 + R(-5, 6)), age = R(19, 30);
    const pl = { id: newPid(), n: P(NP.f) + ' ' + P(NP.l), real: 0, p: pos, r, age, pot: clr(r + (age < 23 ? R(3, 10) : 0), r, 92), wage: wageOf(r, c.t, ct), yrs: R(1, 4), num: 0, inj: 0 };
    pl.num = freeNum(list, pos); list.push(pl);
    if (list.length >= 30) break;
  }
}

/* Altyapı: her sezon 4-6 genç, seviye potansiyeli belirler */
function youthIntake(id, lvl) {
  g.youth = g.youth || {}; const ct = clubCt(id), NP = NAMES[cinfo(ct).lang] || NAMES.tr, out = [];
  for (let i = 0; i < 4 + Math.min(2, lvl || 0); i++) { const pot = clr(R(55, 72) + (lvl || 1) * R(2, 5), 50, 96), r = clr(pot - R(14, 26), 38, 72); out.push({ id: newPid(), n: P(NP.f) + ' ' + P(NP.l), real: 0, p: P(['GK', 'DF', 'DF', 'MF', 'MF', 'FW']), r, pot, age: R(16, 18) }); }
  g.youth[id] = out; return out;
}
function promoteYouth(id, yid) {
  const Y = (g.youth || {})[id] || [], y = Y.find(x => x.id === yid), c = club(id); if (!y || !c) return;
  const list = ensureSquad(id); const pl = { ...y, wage: Math.round(wageOf(y.r, c.t, clubCt(id)) * .5), yrs: 3, num: 0, inj: 0 }; pl.num = freeNum(list, pl.p); list.push(pl);
  g.youth[id] = Y.filter(x => x.id !== yid); recalcStr(id); L(`${y.n} altyapıdan A takıma yükseldi (${pl.num} numara, potansiyel ${y.pot}).`); sv(); draw();
}

/* Transfer pazarı: diğer kulüplerin gerçek ve üretilmiş oyuncuları */
function market(id, seed) {
  const c = club(id); if (!c) return [];
  const rnd = srng(hash(id + ':mk:' + g.season + ':' + (seed || 0))), out = [], pool = [];
  for (const ct in g.w) g.w[ct].forEach(X => X.forEach(o => { if (o.id !== id && Math.abs(o.s - c.s) < 12) pool.push(o); }));
  for (let i = 0; i < 40 && out.length < 10; i++) {
    const o = pool[Math.floor(rnd() * pool.length)]; if (!o) break;
    const sq = squad(o.id).filter(p => !(p.real && g.moved && g.moved[p.n])), p = sq[Math.floor(rnd() * Math.min(sq.length, 14))];
    if (!p || out.some(x => x.n === p.n) || p.r < c.s - 8) continue;
    out.push({ n: p.n, real: p.real || 0, p: p.p, r: p.r, age: p.age, from: o.id, fee: Math.round(valueOf(p.r, p.age) * cinfo(clubCt(o.id)).e * (.8 + rnd() * .5)), wage: Math.round(wageOf(p.r, c.t, clubCt(id)) * (1 + rnd() * .3)), pot: clr(p.r + (p.age < 23 ? 6 : 0), p.r, 95) });
  }
  return out.sort((a, b) => b.r - a.r);
}
function buyPlayer(id, x, budgetObj) {
  const c = club(id); if (!c || !x) return false;
  if (budgetObj.bud < x.fee) { toast(`Bütçe yetmiyor: ${fm(x.fee)} gerekli, bütçe ${fm(budgetObj.bud)}`); return false; }
  const list = ensureSquad(id); budgetObj.bud -= x.fee;
  const pl = { id: newPid(), n: x.n, real: x.real, p: x.p, r: x.r, age: x.age, pot: x.pot || x.r, wage: x.wage, yrs: R(2, 5), num: 0, inj: 0 }; pl.num = freeNum(list, pl.p); list.push(pl);
  if (x.real) { g.moved = g.moved || {}; g.moved[x.n] = id; }
  recalcStr(id); L(`${pname(x)} transfer edildi (${fm(x.fee)}). Yeni güç ${c.s}.`); news(`${pname(x)} → ${clubName(c.n)} (${fm(x.fee)})`);
  return true;
}
function sellPlayer(id, pid, budgetObj) {
  const list = g.sq[id] || [], p = list.find(x => x.id === pid), c = club(id); if (!p) return 0;
  const fee = Math.round(valueOf(p.r, p.age) * cinfo(clubCt(id)).e * (.85 + Math.random() * .3));
  g.sq[id] = list.filter(x => x.id !== pid); budgetObj.bud += fee; recalcStr(id);
  L(`${pname(p)} satıldı (${fm(fee)}). Yeni güç ${c.s}.`); return fee;
}
const wageBill = id => (g.sq && g.sq[id] || []).reduce((s, p) => s + p.wage, 0);

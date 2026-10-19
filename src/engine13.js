/* ============================================================
   MİRAS FC — MAÇ MOTORU v13 · "Topla birlikte ilerle"
   - Topu önüne, boşluğa sürersen (sen oraya arkadaşından önce
     yetişiyorsan) top arkadaşına gitmez: SEN topla birlikte koşarsın
     (en fazla ~16 m'lik uzun sürüş). Eskiden 6 m'den uzun her ok
     arkadaşa pas sayılıyordu; oyuncu yerinde kalıyordu.
   - Pas verdikten sonra pası atan oyuncu boş kalmaz: ileri, boşluğa
     koşar (ver-kaç), takım topla birlikte ileri çıkar.
   ============================================================ */
const V13 = { longDrib: 16 };
const _stickEval13 = stickEval;
stickEval = function (px, py, st1) {
  const e = _stickEval13(px, py, st1), s = S; if (!e || !s || e.k !== 'pass' || !e.tip || s.head || s.type === 'pen' || (s.type === 'fk' && s.dead)) return e;
  const car = s.car, tip = e.tip, d = Math.hypot(tip.x - car.x, tip.y - car.y);
  if (d > V13.longDrib || tip.y < car.y - 2) return e;
  /* ok bir arkadaşın ayağına (3.5 m) uzanmıyorsa, kısa-orta ok = topu önüne alıp sen sürersin */
  const mateD = e.to ? Math.hypot(e.to.x - tip.x, e.to.y - tip.y) : 99;
  if (mateD > Math.max(3.5, d * .55)) {
    const r = { k: 'drib', P: [{ x: car.x, y: car.y }, { x: tip.x, y: tip.y }], pw: 1, tip, long: 1 };
    try { r.dang = pDanger(r.P, 'drib', 1); } catch (x) { }
    return r;
  }
  return e;
};
/* ver-kaç: pası atan ileri koşar */
const _launch13 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  const car = S && S.car; _launch13(P, ev, q, oy, ox);
  const s = S, r = s && s.run; if (!r || s.mode !== 'atk' || r.k !== 'pass' || !car || car.side !== 'us' || car.gk || car === r.to || (r.L || 0) > 22) return;
  const e = r.P[r.P.length - 1], T = Math.max(.5, r.T || .8), ln = typeof offLine === 'function' ? Math.min(offLine() - .8, 100) : 100;
  const fy = Math.min(ln, car.y + rf(6, 11)), fx = cl(car.x + (e.x - car.x) * .1 + (34 - car.x) * .12, 4, 64);
  const dx = fx - car.x, dy = fy - car.y, dd = Math.hypot(dx, dy), mx = V7.mateV * T * .95, f = dd > mx ? mx / dd : 1;
  if (dd < .5) return;
  S.anims = S.anims.filter(a => a.o !== car); anim(car, car.x + dx * f, car.y + dy * f, T * .95, { lin: 1 });
};

/* ============================================================
   MİRAS FC — MAÇ MOTORU v11 · "Gerçek savunma, gerçek kaleci"
   - Kaleci: erişimi şut mesafesiyle artar (uzaktan şut = daha çok
     tepki süresi), köşeler artık otomatik gol değil; sert, falsolu ve
     iyi basılmış şut yine de geçer. Dar açıdan şut daha zor.
   - Baskı: sen nişan alırken en yakın savunmacı yavaşça üstüne gelir,
     ikinci savunmacı pas yolunu kapatmaya kayar; beklemek bedava değil.
   - Adam adama: hamle sırasında diğer savunmacılar en tehlikeli
     hücumcularını kale tarafından takip eder (koşuyu bırakmazlar).
   - Topu kapan rakip durmaz: topla kontraya sürer.
   ============================================================ */
const KEEP = { base: 2.75, dist: .048, kr: 34, fall: .56, tip: .13, ang: .12, pen: 1.4 };
const DEF11 = { press: 1.05, pressMin: 1.7, lane: .45, mark: 1.6 };
V6.mid = .18;

/* ---------- canlı baskı: nişan alırken ---------- */
const _step11 = step;
step = function (dt) {
  const s = S; _step11(dt); if (!S || S !== s || !dt) return;
  s.P.forEach(p => { if (p.slide && s.t - p.slide.t0 > .75) { p.slide = null; p.slp = 0; } });
  if (s.mode !== 'atk' || s.phase !== 'draw' || s.dead || s.type === 'pen' || s.type === 'fk' || s.head || !s.car) return;
  const car = s.car, ga = Math.atan2(34 - car.x, GY - car.y);
  const ops = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP && !(p.down > 0)).sort((a, b) => dist(a, car) - dist(b, car));
  const mv = (p, tx, ty, sp) => { const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy); if (L > .05) { const m = Math.min(L, sp * dt); p.x += dx / L * m; p.y += dy / L * m; p.spd = sp; } };
  const df = Math.pow(s.df || 1, .4), t = (s.drawT = (s.drawT || 0) + dt);
  if (ops[0] && t > .5) { const d = ops[0], tx = car.x + Math.sin(ga) * DEF11.pressMin, ty = car.y + Math.cos(ga) * DEF11.pressMin; if (dist(d, car) > DEF11.pressMin + .1) mv(d, tx, ty, DEF11.press * df); }
  if (ops[1] && t > .8) {
    /* pas yolunu kapat: topla en yakın arkadaş arasındaki çizgiye kay */
    const m = s.P.filter(p => p.side === 'us' && p !== car && !p.gk).sort((a, b) => dist(a, ops[1]) - dist(b, ops[1]))[0];
    if (m) mv(ops[1], car.x + (m.x - car.x) * .55, car.y + (m.y - car.y) * .55, DEF11.lane * df);
  }
  if (s.gk) gkPlace();
};
const _nextDraw11 = nextDraw;
nextDraw = function () { if (S) S.drawT = 0; return _nextDraw11(); };

/* ---------- adam adama takip ---------- */
const _planMoves11 = planMoves;
planMoves = function (r) {
  _planMoves11(r); const s = S; if (!s || s.mode !== 'atk' || r.k === 'shot') return;
  const e = r.P[r.P.length - 1], nc = r.k === 'pass' ? r.to : r.car, T = Math.max(.45, r.T || .8), maxD = V6.defV * 1.05 * T;
  const ops = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP && p !== (r.fail && r.fail.d)).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(2);
  const dest = p => { const a = S.anims.find(q => q.o === p); return a ? { x: a.x1, y: a.y1 } : { x: p.x, y: p.y }; };
  const tgts = s.P.filter(p => p.side === 'us' && !p.gk && p !== nc && p !== r.car).map(p => ({ p, d: dest(p) })).sort((a, b) => b.d.y - a.d.y);
  const used = new Set();
  ops.forEach(o => {
    let best = null, bd = 1e9; tgts.forEach(t => { if (used.has(t.p)) return; const dd = Math.hypot(t.d.x - o.x, t.d.y - o.y) - t.d.y * .08; if (dd < bd) { bd = dd; best = t; } });
    if (!best || Math.hypot(best.d.x - o.x, best.d.y - o.y) > 22) return; used.add(best.p);
    const ga = Math.atan2(34 - best.d.x, GY - best.d.y), tx = best.d.x + Math.sin(ga) * DEF11.mark, ty = best.d.y + Math.cos(ga) * DEF11.mark;
    const dx = tx - o.x, dy = ty - o.y, dd = Math.hypot(dx, dy), f = dd > maxD ? maxD / dd : 1;
    S.anims = S.anims.filter(a => a.o !== o); anim(o, cl(o.x + dx * f, 2, 66), cl(o.y + dy * f, 2, 103), T * .95, { lin: 1 });
  });
};

/* ---------- topu kapan rakip kontraya sürer ---------- */
const _pathFail11 = pathFail;
pathFail = function (r) {
  const s = S, d = r.fail && r.fail.d; _pathFail11(r);
  if (S !== s || !d || r.fail.miss || r.k === 'shot' || s.ball.owner !== d) return;
  const tx = cl(d.x + (34 - d.x) * .3 + rf(-3, 3), 4, 64), ty = Math.max(4, d.y - rf(7, 11));
  S.anims = S.anims.filter(a => a.o !== d); anim(d, tx, ty, 1.5, { lin: 1 }); d.dx = 0; d.dy = -1;
  s.P.forEach(p => { if (p.side === 'us' && !p.gk && p !== d) { S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + (tx - p.x) * .25, p.y - rf(2, 5), 1.5, { lin: 1 }); } });
  s.P.forEach(p => { if (p.side === 'th' && !p.gk && p !== d) { S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + rf(-2, 2), p.y - rf(4, 8), 1.5, { lin: 1 }); } });
};

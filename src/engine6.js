/* ============================================================
   MİRAS FC — MAÇ MOTORU v6 · "Yaşayan saha"
   engine5'in üstüne:
   1) Top hep sahibinin ayağında: oyuncu nereye koşarsa top da
      onun önünde (koşu yönüne göre), sürerken küçük dokunuşlarla.
   2) Pas/sürüş anında herkes AYNI ANDA hareket eder: arkadaşların
      boş alana koşar, biri kısa pas için yaklaşır, savunma topun
      gideceği yere kayar, en yakın rakip basar. Hamle bitince hiç
      beklemeden sıra sende.
   3) Mantıklı pas: bir rakip ancak topun geçtiği noktaya ZAMANINDA
      yetişebiliyorsa keser (mesafe + hız + tepki). Boşluktaki
      arkadaşa pas hep gider; rakibin dibinden geçen pas kesilir.
      Havadan pas sadece kalkışta ve inişte kesilebilir.
   4) Ofsayt: pas anında alıcı, sondan ikinci rakipten öndeyse (rakip
      yarı sahada ve toptan önde) ofsayt. Sahada kesikli çizgi.
      Boşluğa atılan ara pasta koşu çizgiden başlarsa ofsayt değil.
   5) Savunma: rakip bazen pas yerine topla üstüne sürer; yolunu
      kesip müdahale edersin. Topu kazanınca saha DÖNER: aynı
      yerden atağa çıkarsın, arkadaşların koşarak gelir.
   ============================================================ */
const V6 = { react: .45, defV: 6.2, mateV: 7.2, onside: .6, mid: .18, k: 5 };

/* ---------- 1) Top ayakta: yön takibi ---------- */
function defDir(o) { const s = S; if (!s) return { x: 0, y: 1 }; if (s.mode === 'def') return o.side === 'th' ? { x: 0, y: 1 } : { x: 0, y: -1 }; return o.side === 'us' ? { x: 0, y: 1 } : { x: 0, y: -1 }; }
function attach() {
  const s = S; if (!s) return; const B = s.ball, o = B.owner; if (!o) return;
  const d = o.dx != null ? { x: o.dx, y: o.dy } : defDir(o), mv = o.spd || 0;
  const k = .62 + (mv > .5 ? Math.abs(Math.sin((s.t || 0) * 7 + (o.ph || 0))) * .55 : 0);
  B.x = o.x + d.x * k; B.y = o.y + d.y * k; B.z = 0;
}
function trackDirs(dt) {
  const s = S; if (!s || !dt) return;
  s.P.forEach(p => {
    if (p.lx == null) { p.lx = p.x; p.ly = p.y; return; }
    const vx = (p.x - p.lx) / dt, vy = (p.y - p.ly) / dt, sp = Math.hypot(vx, vy); p.lx = p.x; p.ly = p.y;
    p.spd = (p.spd || 0) * .8 + sp * .2;
    if (sp > .4) { const nx = vx / sp, ny = vy / sp, ox = p.dx != null ? p.dx : nx, oy = p.dy != null ? p.dy : ny, mx = ox * .75 + nx * .25, my = oy * .75 + ny * .25, L = Math.hypot(mx, my) || 1; p.dx = mx / L; p.dy = my / L; }
  });
}
/* topu alan oyuncu kaleye döner */
function faceGoal(p) { const s = S, d = s.mode === 'def' ? (p.side === 'th' ? 1 : -1) : (p.side === 'us' ? 1 : -1), gy = d > 0 ? 105 : 0, a = Math.atan2(34 - p.x, gy - p.y); p.dx = Math.sin(a); p.dy = Math.cos(a); }

/* ---------- 3) Mantıklı kesilme: zamanında yetişebilen keser ---------- */
const passV = (L, pw) => (L > V5.longLen ? V5.longV : V5.passV) * cl(.75 + (pw || 1) * .3, .8, 1.35);
function ballTime(kind, L, u, loft, pw) {
  if (kind === 'shot') { const T = L / V5.shotV * 1.05; return T * (1 - Math.pow(1 - u, 1 / 1.15)); }
  if (kind === 'drib') return u * L / (V5.dribV * Math.sqrt((S.car === S.me ? st('hiz') : S.car.r) / 70));
  const v = passV(L, pw); if (loft) return u * L / v; const T = L / v * 1.35; return T * (1 - Math.pow(1 - u, 1 / 1.6));
}
function pDanger(P, kind, pw) {
  const s = S, out = [], L = plen(P), car = s.car, loft = kind === 'pass' && !!s._loft; pw = pw || s._pw || 1;
  if (L < .5) return out;
  const sk = car === s.me ? (kind === 'drib' ? (st('tek') + st('hiz')) / 2 + (hasPerk('calim') ? 6 : 0) : kind === 'shot' ? st('sut') : st('pas') + (hasPerk('pasor') ? 6 : 0)) : car.r;
  const to = kind === 'pass' ? (s._rec || pKind(P).to) : null, N = Math.max(8, Math.round(L / 1.2));
  s.P.forEach(d => {
    if (d.side !== 'th' || d.gk || d.down > 0) return;
    const vd = V6.defV * (d.r / 72) * Math.pow(s.df, .3), rr = (d.wallP ? .75 : kind === 'drib' ? 1.1 : .95) + (d.r - 70) / 90;
    let best = -9, bu = 0;
    for (let i = 1; i <= N; i++) {
      const u = i / N, pt = pAt(P, u), dd = Math.hypot(d.x - pt.x, d.y - pt.y);
      if (u * L < 1.3 && kind !== 'drib') continue;
      if (loft && u > .14 && u < .95) continue; /* havadan: kalkışta ve inişte (hava topu) kesilebilir */
      if (kind === 'shot' && u > .9) continue;
      if (d.wallP && kind === 'shot') { if (dd < rr) { best = Math.max(best, .9); bu = u; } continue; }
      const tb = ballTime(kind, L, u, loft, pw), td = (d.wallP ? 0 : V6.react) + Math.max(0, dd - rr) / vd;
      let m = tb - td; if (to && u > .8) { const tr = .1 + Math.max(0, Math.hypot(to.x - pt.x, to.y - pt.y) - .8) / V6.mateV; m = Math.max(tb, tr) - .3 - td; }
      if (m > best) { best = m; bu = u; }
    }
    if (best <= -9) return;
    let p = 1 / (1 + Math.exp(-(best - V6.mid) * V6.k));
    p *= cl(1 + (d.r - sk) / 140 + (s.df - 1) * .35, .6, 1.4);
    if (kind === 'shot') p *= d.wallP ? .62 : .55;
    if (kind === 'drib') p *= cl(.5 + (d.r - sk) / 80 + (s.df - 1) * .4, .22, .8); /* yetişince bire bir mücadele */
    p = cl(p, 0, .95); if (p > .06) out.push({ d, u: bu, p });
  });
  return out.sort((a, b) => a.u - b.u);
}

/* ---------- 4) Ofsayt ---------- */
function offLine() { const s = S; if (!s || s.mode !== 'atk') return 999; const ys = s.P.filter(p => p.side === 'th').map(p => p.y).sort((a, b) => b - a); const ln = ys.length >= 2 ? ys[1] : ys[0] || 105; return Math.max(ln, 52.5); }
function isOff(p, fromY) { const ln = offLine(); return p.y > ln + .25 && p.y > 52.5 && p.y > fromY + .2; }

/* ---------- 2) Aynı anda hareket: koşu ve savunma planı ---------- */
function planMoves(r) {
  const s = S; if (!s || s.mode !== 'atk' || r.k === 'shot') return;
  const nc = r.k === 'pass' ? r.to : r.car, e = r.P[r.P.length - 1], T = Math.max(.45, r.T || .8), busy = new Set([nc, r.car, r.fail && r.fail.d].filter(Boolean));
  const ga = Math.atan2(34 - e.x, GY - e.y);
  /* savunma: en yakın basar, ikinci kapatır, diğerleri hat kurar */
  const ops = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP && !busy.has(p)).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y));
  const line = cl(Math.max(e.y + 13, 77), 77, 99), maxD = V6.defV * 1.05 * T;
  ops.forEach((p, i) => {
    let tx, ty;
    if (i === 0) { tx = e.x + Math.sin(ga) * 3; ty = e.y + Math.cos(ga) * 3; }
    else if (i === 1) { const sd = p.x < e.x ? -1 : 1; tx = e.x + sd * 6; ty = e.y + 5.5; }
    else { tx = p.x + (e.x - p.x) * .25; ty = Math.max(line - 1 + rf(-1, 1.5), Math.min(p.y, line + 3)); }
    const dx = tx - p.x, dy = ty - p.y, dd = Math.hypot(dx, dy), f = dd > maxD ? maxD / dd : 1;
    S.anims = S.anims.filter(a => a.o !== p); anim(p, cl(p.x + dx * f, 2, 66), cl(p.y + dy * f, 2, 103), T * .95, { lin: 1 });
  });
  /* hücum: biri kısa pas için gelir, diğerleri boş alana ve ofsayta düşmeden koşar */
  const mates = s.P.filter(p => p.side === 'us' && !p.gk && !busy.has(p));
  const futLine = Math.max(52.5, line - .5), taken = [], maxM = V6.mateV * T;
  mates.sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).forEach((p, i) => {
    let best = null, bs = -1e9;
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2, rad = i === 0 ? rf(7, 11) : rf(10, 22), x = cl(e.x + Math.sin(a) * rad, 4, 64), y = cl(e.y + Math.cos(a) * rad, e.y - 12, 100);
      if (Math.hypot(x - p.x, y - p.y) > maxM * 1.6) continue;
      let open = 9; ops.forEach(o => open = Math.min(open, Math.hypot(o.x - x, o.y - y))); s.P.forEach(o => { if (o.side === 'th' && !o.gk) open = Math.min(open, Math.hypot(o.x - x, o.y - y) + 1); });
      let sc = Math.min(open, 8) * 1.1 + (i === 0 ? -Math.abs(rad - 9) * .4 : (y - e.y) * .22) - Math.abs(x - 34) * .03;
      taken.forEach(t => { const dt2 = Math.hypot(t.x - x, t.y - y); if (dt2 < 9) sc -= (9 - dt2) * 1.2; });
      if (y > futLine && y > 52.5 && Math.random() > .08) sc -= 12;
      if (sc > bs) { bs = sc; best = { x, y }; }
    }
    if (!best) best = { x: p.x, y: Math.min(p.y + 3, futLine) };
    taken.push(best);
    const dx = best.x - p.x, dy = best.y - p.y, dd = Math.hypot(dx, dy), f = dd > maxM ? maxM / dd : 1;
    S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + dx * f, p.y + dy * f, T * .95, { lin: 1 });
  });
}
/* launchPath'e ek: alıcı topla buluşur, ofsayt kontrolü, aynı anda hareket */
const _launch5 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  const s = S, thru = s.thru, to = ev.to, car = s.car;
  if (ev.k === 'pass' && to && !thru && P.length >= 2) { const a = P[P.length - 2], e = P[P.length - 1], L = Math.hypot(e.x - a.x, e.y - a.y) || 1, mv = Math.min(1.2, plen(P) * .06); P[P.length - 1] = { x: e.x - (e.x - a.x) / L * mv, y: e.y - (e.y - a.y) / L * mv }; }
  const off = ev.k === 'pass' && to && car.side === 'us' && isOff(to, s.ball.y);
  const pw = s.stickPw || 1; s._pw = pw;
  _launch5(P, ev, q, oy, ox); s._pw = 0;
  const r = s.run; if (!r) return;
  r.off = off; r.T = ballTime(r.k, r.L, 1, r.loft, pw);
  if (r.k === 'drib') { s.ball.owner = r.car; attach(); }
  if (r.fail && r.fail.d && r.fail.d.wallP && (oy || 0) > .3 && Math.random() < .75) r.fail = null;
  if (r.k === 'pass' && to) { const e = r.P[r.P.length - 1]; S.anims = S.anims.filter(a => a.o !== to); anim(to, e.x, e.y, Math.max(.3, r.T * .98), { lin: 1 }); }
  planMoves(r);
};
/* pas bitti: ofsayt mı? */
const _pathDone5 = pathDone;
pathDone = function (r) {
  const s = S;
  if (r.k === 'pass' && r.off) { s.phase = 'anim'; s.ball.owner = null; flash('🚩 OFSAYT'); if (r.car === s.me) M.my.bad++; return endScene({ t: 'OFSAYT', s: `${short(r.to.n)} ofsayt çizgisinin gerisinde değildi`, c: '#d8e2dc' }, 0); }
  if (r.k === 'pass' && r.to) faceGoal(r.to);
  return _pathDone5(r);
};
/* hamle sonrası: planlanan koşular bitince hemen sıra sende */
nextDraw = function () {
  const s = S, car = s.car; s.dead = 0;
  if (s.n >= s.maxN) return endScene({ t: 'POZİSYON SÖNDÜ', s: 'Savunma yerleşti', c: '#d8e2dc' }, 0);
  s.wall && s.wall.forEach(w => w.wallP = 0);
  faceGoal(car); attach();
  const go = () => { if (!S || S !== s || s.phase === 'done') return; s.phase = 'draw'; s.hint = drawHint(); gkPlace(); drawUIControls(); };
  if (s.anims.some(a => (s.at - a.t0) / a.d < 1)) { s.phase = 'anim'; then(go); drawUIControls(); } else go();
};

/* ---------- 5) Savunma: sürerek gelen rakip + topu kazanınca saha döner ---------- */
const _icptStart5 = icptStart;
icptStart = function () {
  const s = S; _icptStart5();
  const ic = s.ic, car = s.carrier;
  if (Math.random() < (ic.step === 1 ? .38 : .25)) {
    const tx = cl(car.x + (34 - car.x) * .4 + rf(-4, 4), 8, 60), ty = Math.min(98, car.y + rf(11, 16));
    Object.assign(ic, { drib: 1, to: { x: tx, y: ty }, rec: car, wait: 1.4, v: (4.6 + (car.r - 70) / 20) * Math.pow(s.df, .2) * 1.15 });
    s.msg = '⚠️ Rakip topla üstüne sürüyor! Oyuncunu önüne SÜRÜKLE, yolunu kes ve müdahale et.';
    drawUIControls();
  }
};
const _icptTick5 = icptTick;
icptTick = function (dt) {
  const s = S, ic = s.ic; if (!ic.drib) return _icptTick5(dt);
  const me = s.me, car = s.carrier, h = dt * IC_TS; ic.t += dt;
  const mv = (p, t, sp) => { const dx = t.x - p.x, dy = t.y - p.y, L = Math.hypot(dx, dy); if (L > .05) { const m = Math.min(L, sp * h); p.x += dx / L * m; p.y += dy / L * m; } };
  if (ic.mt) mv(me, ic.mt, (6.4 + (st('hiz') - 60) / 12) * 1.6);
  if (ic.t < ic.wait) { attach(); return; }
  /* sürücü: önüne biri çıkarsa yana kaçar */
  const ahead = (me.y - car.y) > 0 && Math.abs(me.x - car.x) < 2.2 && me.y - car.y < 5;
  if (ahead && ic.cut == null) ic.cut = Math.random() < .3 + (car.r - 70) / 100 ? (me.x > car.x ? -1 : 1) : 0;
  const tgt = ic.cut && ahead ? { x: car.x + ic.cut * 3, y: car.y + 2 } : ic.to;
  mv(car, tgt, ic.v); attach();
  const d = Math.hypot(me.x - car.x, me.y - car.y);
  if (d < 1.35 + (st('def') - 60) / 160 && !ic.tried) {
    ic.tried = ic.t; const front = me.y > car.y - .3;
    const p = cl(.68 + (st('def') - car.r) / 160 + (front ? .14 : -.16) - (s.df - 1) * .3 + (hasPerk('kesici') ? .06 : 0), .3, .92);
    if (Math.random() < p) { M.my.ok++; M.my.tk++; s.ball.owner = me; attach(); flash('💥 TOPU KAPTIN'); M.feed.unshift({ m: s.min, t: 'Müdahale: topu kaptın!', k: 'good' }); return winBall(); }
    car.y += .8; flash('😤 GEÇTİ'); s.msg = `${short(car.n)} müdahaleni atlattı!`; drawUIControls();
  }
  if (ic.tried && (d > 3 || ic.t - ic.tried > 1.6)) ic.tried = 0;
  if (Math.hypot(car.x - ic.to.x, car.y - ic.to.y) < .6 || toGoal(car) < 20) { M.my.bad++; s.phase = 'anim'; return oppShot(1.1); }
};
/* pası kesince de saha dönsün (yeni sahne yerine) */
const _chain5 = chainScene;
chainScene = function (type, msg) { if (S && S.mode === 'def' && type === 'build') { flash('💥 TOP BİZDE'); return winBall(); } return _chain5(type, msg); };
/* topu kazandın: saha 180° döner, aynı konumdan atağa çıkarsın */
function winBall() {
  const s = S, me = s.me; s.phase = 'anim'; s.ic = null;
  s.P.forEach(p => { p.x = 68 - p.x; p.y = 105 - p.y; p.dx = p.dx != null ? -p.dx : null; p.dy = p.dy != null ? -p.dy : null; p.lx = null; p.car = 0; p.sup = 0; p.down = 0; });
  const ourGk = s.gk; s.P = s.P.filter(p => p !== ourGk);
  s.mode = 'atk'; s.type = 'build'; s.car = me; s.ball.owner = me; s.n = 0; s.combo = 0; s.chain = (s.chain || 0) + 1; s.chained = 1;
  s.maxN = Math.round(cl(5 + toGoal(me) / 8, 6, 12));
  const mo = s.mo, th = M.T.th, us = M.T.us, thSq = th.sq.filter(x => x.p !== 'GK'), usSq = us.sq.filter(x => x.p !== 'GK'), gkO = th.sq.find(x => x.p === 'GK') || { n: 'Kaleci', r: 75 };
  const mk = (x, y, side, d, ex) => { const p = { x, y, side, n: d ? (d.real ? alter(d.n) : d.n) : '', r: d ? d.r : 70, num: d && d.num ? d.num : R(2, 30), skin: P(SKIN), c: side === 'us' ? us.c : th.c, ph: Math.random() * 6, ...ex }; s.P.push(p); return p; };
  const pick = (L, i) => L[(i * 7 + mo.min) % Math.max(1, L.length)] || L[0] || { n: '—', r: 70 };
  s.gk = mk(34, 104, 'th', gkO, { gk: 1, c: ['#f2f2f2', '#111'] });
  const DF_ = thSq.filter(x => x.p === 'DF');
  for (let i = 0; i < 3; i++) mk(cl(34 + (i - 1) * 13 + (me.x - 34) * .3, 8, 60), Math.min(97, me.y + R(20, 28)), 'th', pick(DF_, i + 3), {});
  /* arkadaşların koşarak gelir */
  const ups = s.P.filter(p => p.side === 'us' && !p.me);
  [[-14, 4], [13, 6], [0, 13]].forEach(([dx, dy], i) => { let p = ups[i]; const tx = cl(me.x + dx, 6, 62), ty = Math.min(96, me.y + dy); if (!p) p = mk(cl(me.x + dx * 1.3, 2, 66), me.y - 16 - i * 3, 'us', pick(usSq, i + 1), { mate: 1 }); p.mate = 1; anim(p, tx, ty, .9, { lin: 1 }); });
  faceGoal(me); attach(); s.cam.dist = null;
  then(() => { if (S !== s) return; s.phase = 'draw'; s.hint = drawHint(); s.msg = '⚡ Top sende! Arkadaşların koşuyor: atağı kur.'; gkPlace(); drawUIControls(); });
  drawUIControls();
}

/* ---------- vizyon kısıtı yok: her atakta en az 3 arkadaş ---------- */
const _mkScene5 = mkScene;
mkScene = function (mo) {
  const s = _mkScene5(mo) || S;
  if (S && S.mode === 'atk' && (S.type === 'build' || S.type === 'atk')) {
    const ms = S.P.filter(p => p.mate), me = S.me, us = M.T.us, usSq = us.sq.filter(x => x.p !== 'GK');
    const spots = [[13, 7], [-13, 6], [0, 14], [-4, -9]];
    for (let i = ms.length; i < 3; i++) { const [dx, dy] = spots[i]; S.P.push({ x: cl(me.x + dx, 6, 62), y: Math.min(96, me.y + dy), side: 'us', n: (usSq[(i * 5 + mo.min) % usSq.length] || { n: '—' }).n, r: 70, num: R(2, 30), skin: P(SKIN), c: us.c, ph: Math.random() * 6, mate: 1 }); }
    /* başlangıçta kimse ofsaytta durmasın */
    const ln = offLine(); S.P.forEach(p => { if (p.side === 'us' && !p.me && p.y > ln - .3 && p.y > 52.5) p.y = ln - rf(.5, 2); });
  }
  if (S) { S.P.forEach(p => { p.lx = null; }); if (S.ball.owner) { faceGoal(S.ball.owner); attach(); } }
  return s;
};

/* ---------- döngü: yön takibi + top her karede ayakta ---------- */
const _step5 = step;
step = function (dt) {
  if (!S) return; _step5(dt); if (!S) return;
  trackDirs(dt);
  if (S.ball.owner && !(S.phase === 'run' && S.run && S.run.k !== 'drib')) attach();
};

/* ---------- görüntü: ofsayt çizgisi + ofsayttaki arkadaş ---------- */
const _drawScene5 = drawScene;
drawScene = function () {
  _drawScene5(); const s = S; if (!s || s.mode !== 'atk' || !['draw', 'anim', 'run'].includes(s.phase)) return;
  const cv = $('cv'); if (!cv) return; const x = cv.getContext('2d'); if (!x) return;
  const ln = offLine(); if (ln > 104) return;
  const a = P3(0, ln, 0), b = P3(68, ln, 0); if (a.Y < 0 || a.Y > CV.H) return;
  x.save(); x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0); x.strokeStyle = 'rgba(255,225,80,.55)'; x.lineWidth = 1.5; x.setLineDash([6, 7]); x.beginPath(); x.moveTo(a.X, a.Y); x.lineTo(b.X, b.Y); x.stroke(); x.setLineDash([]);
  x.font = '11px sans-serif'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('🚩', CV.W - 18, a.Y - 3);
  if (s.phase === 'draw') s.P.forEach(p => { if (p.side === 'us' && !p.me && p !== s.car && isOff(p, s.ball.y)) { const v = P3(p.x, p.y, 0); x.font = '12px sans-serif'; x.textAlign = 'center'; x.fillText('🚩', v.X + 9, v.Y - 18); x.textAlign = 'left'; } });
  x.restore();
};
/* çubuk etiketinde ofsayt uyarısı */
const _stickEval5 = stickEval;
stickEval = function (px, py, st1) { const e = _stickEval5(px, py, st1); if (e && e.k === 'pass' && e.to && isOff(e.to, S.ball.y)) e.off = 1; if (e && e.k !== 'none') e.dang = pDanger(e.P, e.k, e.pw); return e; };
const _drawStick5 = drawStick;
drawStick = function (x, e) { _drawStick5(x, e); if (e.off) { const t = P3(e.tip.x, e.tip.y, 0); x.font = '700 12px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.fillStyle = '#ffe14d'; x.fillText(T('🚩 OFSAYT'), t.X, t.Y - 42); x.textAlign = 'left'; } };

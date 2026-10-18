/* ============================================================
   MİRAS FC — MAÇ MOTORU v8 · "Gerçekçi ayrıntılar"
   - İlk dokunuş: sert ya da havadan gelen top her zaman kontrol
     edilemez; alıcının tekniğine göre top ayağından açılabilir.
   - Sahipsiz top yarışı: seken, kontrol edilemeyen, kaleciden dönen
     top kime yakınsa onun olur (koşu hızına göre).
   - Kaleciden dönen top (rebound): ilk şutun kurtarılsa da
     arkadaşın ya da sen yetişirsen pozisyon sürer.
   - Aşırtma: kaleci önde ise topun altına basıp aşırtabilirsin.
   - Faul: topla sürerken müdahalede faul olabilir; ceza sahasında
     penaltı, kaleye yakınsa serbest vuruş, değilse oyun sende devam.
   ============================================================ */
const recSkill = p => p.me ? (st('tek') * .6 + st('pas') * .4) : p.r;

/* ---------- sahipsiz top: kim yetişirse ---------- */
function looseBall(pt, lostT) {
  const s = S; s.phase = 'anim'; s.ball.owner = null; s.free = null;
  pt = { x: cl(pt.x, 1.5, 66.5), y: cl(pt.y, 2, 103.5) };
  S.anims = S.anims.filter(a => a.o !== s.ball); anim(s.ball, pt.x, pt.y, .55, { lin: 1 });
  const us = s.P.filter(p => p.side === 'us' && !p.gk).sort((a, b) => dist(a, pt) - dist(b, pt))[0];
  const th = s.P.filter(p => p.side === 'th' && (!p.gk || (pt.y > 99 && Math.abs(pt.x - 34) < 10))).sort((a, b) => dist(a, pt) - dist(b, pt))[0];
  const tU = us ? dist(us, pt) / V7.mateV : 99, tT = th ? .15 + dist(th, pt) / (V6.defV * Math.pow(s.df, .3)) : 99;
  const win = tU + rf(-.2, .2) <= tT ? us : th, lose = win === us ? th : us, T = Math.max(.55, Math.min(1.6, (win === us ? tU : tT)));
  if (win) { S.anims = S.anims.filter(a => a.o !== win); anim(win, pt.x, pt.y - (win.side === 'us' ? .5 : -.5), T, { lin: 1 }); }
  if (lose) { const k = .7; S.anims = S.anims.filter(a => a.o !== lose); anim(lose, lose.x + (pt.x - lose.x) * k, lose.y + (pt.y - lose.y) * k, T, { lin: 1 }); }
  flash('⚽ BOŞTA TOP');
  then(() => {
    if (S !== s || s.phase === 'done') return;
    if (win && win.side === 'us') { s.ball.owner = win; s.car = win; faceGoal(win); attach(); flash(win.me ? '🙌 TOP SENDE' : '🙌 TOP BİZDE'); s.n = Math.min(s.n, s.maxN - 1); return nextDraw(); }
    if (win) { s.ball.owner = win; attach(); }
    endScene(lostT || { t: 'TOP RAKİPTE', s: win ? `${short(win.n)} boştaki topu aldı` : 'Top oyun dışına çıktı', c: '#d8e2dc' }, 0);
  });
  drawUIControls();
}

/* ---------- şut: aşırtma ve kaleciden dönen top ---------- */
const _shotResult7 = shotResult;
shotResult = function (P, run) {
  const res = _shotResult7(P, run), s = S, k = s.gk, oy = run.oy || 0;
  if (!k || s.type === 'pen' || s.head) return res;
  const out = 105 - k.y, D = Math.hypot(GY - P[0].y, 34 - P[0].x);
  if (oy > .4 && out > 2.2 && D < 26) {
    /* aşırtma: kalecinin üstünden; isabet tekniğe, yükseklik basışa bağlı */
    const sk = s.car === s.me ? (st('sut') + st('tek')) / 2 : s.car.r, overP = cl((oy - .4) * .5 + Math.max(0, (run.pw || 1) - 1.25) * .6 - (out - 2) * .05 + (70 - sk) / 200, .03, .6);
    res.chip = 1;
    if (Math.random() < overP) { Object.assign(res, { over: true, goal: false, save: false, wide: false, post: false }); }
    else if (res.save && Math.random() < .75) { Object.assign(res, { save: false, held: false, goal: true }); }
  }
  /* kaleci çelerse top bazen kale önünde kalır */
  if (res.save && !res.held) res.reb = 1;
  return res;
};
const _pathDone7 = pathDone;
pathDone = function (r) {
  const s = S;
  /* ilk dokunuş: sert ya da havadan gelen top açılabilir */
  if (r.k === 'pass' && r.to && !r.off && !r.ft) {
    const to = r.to, e = r.P[r.P.length - 1], far = Math.hypot(to.x - e.x, to.y - e.y);
    if (far <= 1.1) { r.ft = 1;
      const bad = cl((r.v - 18) * .025 + (r.loft ? .1 + (r.lh || 0) * .012 : 0) + Math.max(0, (r.pw || 1) - 1.3) * .2 + (70 - recSkill(to)) / 220, 0, .35);
      if (Math.random() < bad) { const a = Math.atan2(e.x - r.P[0].x, e.y - r.P[0].y) + rf(-.9, .9), d = rf(2, 4.5); flash('😬 KÖTÜ KONTROL'); if (r.car === s.me) M.my.bad++; return looseBall({ x: e.x + Math.sin(a) * d, y: e.y + Math.cos(a) * d }); }
    }
  }
  /* kaleciden dönen top: arkadaşın yetişirse pozisyon sürer */
  if (r.k === 'shot' && r.res && r.res.reb && !r.res.goal) {
    const B = s.ball, side = B.x < 34 ? -1 : 1, pt = { x: 34 + side * rf(4, 10), y: 104 - rf(4, 10) };
    if (r.car === s.me) M.my.ok++; flash('🧤 KALECİ ÇELDİ'); s.shake = s.t;
    s.n = Math.max(s.n, s.maxN - 2);
    return looseBall(pt, { t: 'KALECİ ÇELDİ', s: 'Dönen topu savunma uzaklaştırdı', c: '#d8e2dc' });
  }
  return _pathDone7(r);
};

/* ---------- sürüşte faul ---------- */
const _pathFail7 = pathFail;
pathFail = function (r) {
  const s = S, d = r.fail && r.fail.d;
  if (r.k === 'drib' && d && Math.random() < .22 + (s.df < 1 ? .05 : 0)) {
    const c = r.car, box = c.y > 88.5 && Math.abs(c.x - 34) < 20; s.phase = 'anim';
    flash('🟨 FAUL'); M.feed.unshift({ m: s.min, t: `🟨 ${short(d.n)} faul yaptı`, k: 'mut' });
    if (box && c === s.me) { s.msg = 'Faul! Hakem penaltıyı gösterdi!'; return toSetPiece('pen'); }
    if (toGoal(c) < 30 && c === s.me) { s.msg = 'Faul! Serbest vuruş kazandın.'; return toSetPiece('fk'); }
    s.ball.owner = c; attach(); d.down = .8; s.dead = 1; s.msg = 'Faul! Top yine sizde, oyun devam ediyor.'; return nextDraw();
  }
  return _pathFail7(r);
};

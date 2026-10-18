/* ============================================================
   MİRAS FC — MAÇ MOTORU v7 · "Ok nereyi gösterirse"
   - Nişan: parmağını koy ve çek; ok oyuncundan o yöne uzar.
     Okun UCU topun gideceği yerdir. Az çekersen yumuşak ve kısa,
     çok çekersen sert ve uzun gider. Arkadaşının ÖNÜNE atabilirsin:
     oraya en çabuk yetişen arkadaşın koşar ve topla buluşur.
   - Kaleye uzanan ok şut olur; uzunluğu şutun sertliğidir.
   - Kısa ok (≤ 6 m) topla sürmedir.
   - Top havadan mı yerden mi? Bunu topa BASTIĞIN yer belirler:
     alt tarafı = havadan (ne kadar alttan, o kadar yüksek),
     orta/üst = yerden. Yanı = falso.
   - Takım uyumu yüksekse arkadaşına dokunup sürükleyerek koşacağı
     yeri gösterirsin (uyum ≥ 90: 3 koşu, ≥ 70: 2, ≥ 40: 1).
   ============================================================ */
const V7 = { drib: 6, maxL: 46, mateV: 7.2 };
const runCmds = () => { const u = g.uyum == null ? 50 : g.uyum; return u >= 90 ? 3 : u >= 70 ? 2 : u >= 40 ? 1 : 0; };

/* ---------- okun yorumu ---------- */
function bestRec(tip) {
  const s = S; let best = null, bt = 1e9;
  s.P.forEach(p => { if (p.side !== 'us' || p === s.car || p.gk) return; const t = Math.max(0, Math.hypot(p.x - tip.x, p.y - tip.y) - .8) / V7.mateV; if (t < bt) { bt = t; best = p; } });
  return best ? { p: best, t: bt } : null;
}
stickEval = function (px, py, st1) {
  const s = S, st0 = st1 || s.stick, car = s.car, sc = PR.sc, dx = (px - st0.p0[0]) / sc, dy = -(py - st0.p0[1]) / sc, Lpx = Math.hypot(px - st0.p0[0], py - st0.p0[1]);
  if (Lpx < 8) return null; const n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, Lw = Math.min(V7.maxL, Lpx / sc * 2.1);
  const tip = { x: cl(car.x + ux * Lw, .5, 67.5), y: cl(car.y + uy * Lw, 1, 107) }, P0 = { x: car.x, y: car.y };
  const head = s.head || s.type === 'pen', dead = s.type === 'fk' && s.dead;
  /* şut: ok kale ağzına doğru ve kaleye yetecek kadar uzun */
  if (uy > .12) {
    const t = (GY - car.y) / uy, gx = car.x + ux * t, D = Math.hypot(GY - car.y, gx - car.x);
    if (gx > GOAL_L - 3.5 && gx < GOAL_R + 3.5 && D < 42 && (Lw >= D * .55 || head || tip.y > GY - 3))
      return { k: 'shot', P: [P0, { x: cl(gx, GOAL_L - 2.5, GOAL_R + 2.5), y: GY + .4 }], pw: cl(Lw / Math.max(6, D), .35, 1.9), tip: { x: cl(gx, GOAL_L - 2, GOAL_R + 2), y: GY }, aim: gx };
  }
  if (head) return { k: 'none', tip, P: [P0, tip] };
  if (Lw <= V7.drib && !dead) return { k: 'drib', P: [P0, tip], pw: 1, tip };
  /* pas: okun ucuna. Oraya en çabuk yetişen arkadaş topla buluşur */
  const r = bestRec(tip); if (!r) return { k: 'none', tip, P: [P0, tip] };
  const e = { k: 'pass', to: r.p, lead: Math.hypot(r.p.x - tip.x, r.p.y - tip.y) > 1.5, P: [P0, tip], pw: 1, tip, rt: r.t };
  s._rec = r.p; e.dang = pDanger(e.P, 'pass', 1); s._rec = null;
  if (typeof isOff === 'function' && isOff(r.p, s.ball.y)) e.off = 1;
  return e;
};
/* ---------- girdi: ok, dokunuş ve koşu komutu ---------- */
function mateAt(px, py) { const s = S, w = unprojG(px, py); let best = null, bd = 2.6; s.P.forEach(p => { if (p.side !== 'us' || p === s.car || p.gk) return; const d = Math.hypot(p.x - w.x, p.y - w.y); if (d < bd) { bd = d; best = p; } }); return best; }
v5Down = function (px, py) {
  const s = S; if (s.phase !== 'draw') return;
  const m = mateAt(px, py);
  s.stick = { p0: [px, py], cur: [px, py], e: null, t0: s.t, mate: m && (s.cmdLeft == null ? (s.cmdLeft = runCmds()) : s.cmdLeft) > 0 ? m : null };
};
v5Move = function (px, py) {
  const s = S, sk = s.stick; if (!sk || s.phase !== 'draw') return; sk.cur = [px, py];
  if (sk.mate && Math.hypot(px - sk.p0[0], py - sk.p0[1]) > 12) { const w = unprojG(px, py), m = sk.mate, d = Math.hypot(w.x - m.x, w.y - m.y), k = d > 22 ? 22 / d : 1; sk.cmd = { x: cl(m.x + (w.x - m.x) * k, 3, 65), y: cl(m.y + (w.y - m.y) * k, 3, 101) }; sk.e = null; return; }
  sk.e = stickEval(px, py);
};
v5Up = function () {
  const s = S, sk = s.stick; s.stick = null; if (!sk || s.phase !== 'draw') return;
  if (sk.cmd && sk.mate) { sk.mate.cmd = sk.cmd; s.cmdLeft = Math.max(0, (s.cmdLeft || 0) - 1); flash('🏃 KOŞU VERİLDİ'); s.msg = s.cmdLeft ? `${short(sk.mate.n)} bir sonraki hamlede oraya koşacak. Kalan koşu: ${s.cmdLeft}` : `${short(sk.mate.n)} bir sonraki hamlede oraya koşacak.`; return drawUIControls(); }
  const moved = Math.hypot(sk.cur[0] - sk.p0[0], sk.cur[1] - sk.p0[1]), car = s.car;
  if (moved < 12) {
    const w = unprojG(sk.p0[0], sk.p0[1]), gp = unprojY(sk.p0[0], sk.p0[1], GY);
    if (gp && Math.abs(gp.x - 34) < 6 && w.y > 100) return doStick({ k: 'shot', P: [{ x: car.x, y: car.y }, { x: cl(gp.x, GOAL_L - 1, GOAL_R + 1), y: GY + .4 }], pw: 1 });
    const m = mateAt(sk.p0[0], sk.p0[1]); if (m) return doStick({ k: 'pass', to: m, P: [{ x: car.x, y: car.y }, { x: m.x, y: m.y }], pw: 1 });
    if (!s.head && s.type !== 'pen' && Math.hypot(w.x - car.x, w.y - car.y) > 1.5) { const d = Math.min(V7.drib + 2, Math.hypot(w.x - car.x, w.y - car.y)), a = Math.atan2(w.x - car.x, w.y - car.y); return doStick({ k: 'drib', P: [{ x: car.x, y: car.y }, { x: car.x + Math.sin(a) * d, y: car.y + Math.cos(a) * d }], pw: 1 }); }
    return;
  }
  const e = stickEval(sk.cur[0], sk.cur[1], sk); if (!e) return;
  if (e.k === 'none') { s.msg = s.head || s.type === 'pen' ? '🎯 Oku kaleye doğru çek.' : '👟 Oku kaleye ya da boşluğa çek; ucuna en yakın arkadaşın koşar.'; return drawUIControls(); }
  doStick(e);
};
/* pas her zaman okun ucuna gider (arkadaşın üstüne yapıştırılmaz) */
doStick = function (e) {
  const s = S; s.stickPw = e.pw || 1; s.thru = e.k === 'pass' ? 1 : null; s._rec = e.k === 'pass' ? e.to : null;
  doPath(e.P, { k: e.k, to: e.to, len: plen(e.P), dang: e.k === 'none' ? [] : pDanger(e.P, e.k, e.pw) });
};
/* ---------- vuruş: yükseklik topa bastığın yerden ---------- */
const _launch6 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  const s = S; oy = oy || 0;
  const loft = ev.k === 'pass' && (oy > .2 || (s.type === 'fk' && s.dead && oy > -.2));
  s._loft = loft; if (ev.k === 'pass' && !s._rec) s._rec = ev.to;
  _launch6(P, ev, q, oy, ox);
  const r = s.run; s._loft = null; s._rec = null; if (!r) return;
  if (r.k === 'pass') {
    r.loft = loft; r.lh = loft ? cl(1.4 + (oy - .2) / .8 * Math.min(9, r.L / 3), 1.4, 10) : 0;
    r.T = ballTime('pass', r.L, 1, loft, r.pw);
    /* alıcı topun yerine koşar; geç kalırsa top orada bekler */
    const to = r.to, e = r.P[r.P.length - 1];
    if (to) { const tr = Math.max(0, Math.hypot(to.x - e.x, to.y - e.y) - .8) / V7.mateV; S.anims = S.anims.filter(a => a.o !== to); anim(to, e.x, e.y, Math.max(.3, r.T * .98, tr), { lin: 1 }); r.tr = tr; }
  }
  if (r.k === 'shot') r.zt = oy > .25 ? 1.2 + (oy - .25) * 3.4 : oy < -.3 ? .3 : .9;
};
/* top yolculuğu: havadan pasın yüksekliği vuruşa göre */
const _runTick6 = runTick;
runTick = function (dt) {
  const s = S, r = s.run; _runTick6(dt); if (!S || S.run !== r || s.phase !== 'run') return;
  if (r.k === 'pass' && r.loft) { const tt = Math.min(1, r.t / r.T); s.ball.z = tt < .9 ? Math.sin(tt / .9 * Math.PI) * r.lh : Math.sin((tt - .9) / .1 * Math.PI) * r.lh * .1; }
  else if (r.k === 'pass') s.ball.z = 0;
  if (r.k === 'shot' && r.zt != null) { const tt = Math.min(1, r.t / (r.L / r.v * 1.05)); s.ball.z = (r.res && r.res.over ? 3.4 : r.zt) * tt + Math.sin(tt * Math.PI) * .6; }
};
/* pas vardı: alıcı yetişmediyse top durur, o gelince alır; havadan topta hava mücadelesi */
const _pathDone6 = pathDone;
pathDone = function (r) {
  const s = S;
  if (r.k === 'pass' && r.to && !r.off && !r.waited) {
    const to = r.to, e = r.P[r.P.length - 1], far = Math.hypot(to.x - e.x, to.y - e.y);
    if (r.loft) { const df = s.P.filter(p => p.side === 'th' && !p.gk).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
      if (df && Math.hypot(df.x - e.x, df.y - e.y) < 2.2 && Math.random() > cl(.55 + ((to.me ? st('fiz') : to.r) - df.r) / 80 - (s.df - 1) * .4, .2, .85)) { s.phase = 'anim'; s.ball.owner = df; attach(); flash('🛡️ HAVA TOPU'); if (r.car === s.me) M.my.bad++; return endScene({ t: 'SAVUNMA UZAKLAŞTIRDI', s: `${short(df.n)} havada önce davrandı`, c: '#d8e2dc' }, 0); } }
    if (far > 1.1) { r.waited = 1; s.phase = 'anim'; s.ball.owner = null; s.ball.z = 0; then(() => { if (S !== s || s.phase === 'done') return; pathDone(r); }); return; }
  }
  return _pathDone6(r);
};
/* ---------- koşu komutları: planlanan hareketlerde öncelikli ---------- */
const _planMoves6 = planMoves;
planMoves = function (r) {
  const s = S; _planMoves6(r); if (!s || s.mode !== 'atk' || r.k === 'shot') return;
  const T = Math.max(.45, r.T || .8), maxM = V7.mateV * T * 1.05;
  s.P.forEach(p => { if (!p.cmd || p === r.to || p === r.car) return; const dx = p.cmd.x - p.x, dy = p.cmd.y - p.y, d = Math.hypot(dx, dy), f = d > maxM ? maxM / d : 1;
    S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + dx * f, p.y + dy * f, T * .95, { lin: 1 }); if (f >= 1) p.cmd = null; });
};
const _nextDraw6 = nextDraw;
nextDraw = function () { const s = S; if (s) s.cmdLeft = runCmds(); return _nextDraw6(); };
const _mkScene6 = mkScene;
mkScene = function (mo) { const r = _mkScene6(mo); if (S) { S.cmdLeft = runCmds(); S.P.forEach(p => p.cmd = null); } return r; };

/* ---------- çizim: ok, alıcı, koşu komutları ---------- */
drawStick = function (x, e) {
  const s = S, c = P3(s.car.x, s.car.y, 0), t = P3(e.tip.x, e.tip.y, 0), pw = e.pw || 1;
  const pr = (e.dang || []).reduce((m, q) => m * (1 - q.p), 1), risky = pr < .55;
  const col = e.k === 'none' ? 'rgba(255,255,255,.55)' : e.k === 'shot' ? (pw > 1.55 ? '#ff6b5b' : '#ffe34d') : e.k === 'drib' ? '#ffffff' : risky ? '#ff9f5b' : '#7cfc8a';
  const ang = Math.atan2(t.Y - c.Y, t.X - c.X), L = Math.hypot(t.X - c.X, t.Y - c.Y);
  x.save(); x.translate(c.X, c.Y); x.rotate(ang);
  const w = 4 + Math.min(5, L / 40);
  const gr = x.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, col);
  x.fillStyle = gr; rr(x, 6, -w / 2, Math.max(4, L - 14), w, w / 2); x.fill();
  x.fillStyle = col; x.beginPath(); x.moveTo(L + 4, 0); x.lineTo(L - 12, -9); x.lineTo(L - 12, 9); x.closePath(); x.fill();
  x.restore();
  /* hedef noktası ve alıcının koşusu */
  x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.ellipse(t.X, t.Y, 10, 4.5, 0, 0, 7); x.stroke();
  if (e.k === 'pass' && e.to) { const q = P3(e.to.x, e.to.y, 0); x.setLineDash([4, 4]); x.strokeStyle = 'rgba(124,252,138,.85)'; x.beginPath(); x.moveTo(q.X, q.Y); x.lineTo(t.X, t.Y); x.stroke(); x.setLineDash([]); x.lineWidth = 3; x.beginPath(); x.ellipse(q.X, q.Y, 15, 6.5, 0, 0, 7); x.stroke(); }
  (e.dang || []).forEach(d => { if (d.p < .3) return; const q = P3(d.d.x, d.d.y, 0); x.strokeStyle = '#ff4b3a'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(q.X, q.Y, 13, 5.5, 0, 0, 7); x.stroke(); x.font = '13px sans-serif'; x.textAlign = 'center'; x.fillText('⚠️', q.X, q.Y - 18); x.textAlign = 'left'; });
  const dist = Math.round(plen(e.P));
  const lbl = e.k === 'shot' ? `⚽ ${T('ŞUT')} · ${T('GÜÇ')} ${Math.round(Math.min(pw, 2) * 50)}` : e.k === 'pass' ? `👟 ${T('PAS')} ${dist} m${e.lead ? ' · ' + T('önüne') : ''}${risky ? ' · ⚠️' : ''}` : e.k === 'drib' ? `💨 ${T('SÜR')}` : T('hedef yok');
  x.font = '700 12px "Barlow Condensed",sans-serif'; const tw = x.measureText(lbl).width + 14, lx = cl(t.X, tw / 2 + 4, CV.W - tw / 2 - 4), ly = Math.max(24, t.Y - 24); x.fillStyle = 'rgba(0,0,0,.6)'; rr(x, lx - tw / 2, ly - 10, tw, 20, 10); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lbl, lx, ly);
  if (e.off) { x.fillStyle = '#ffe14d'; x.fillText(T('🚩 OFSAYT'), lx, ly - 22); }
  x.textAlign = 'left';
};
const _drawScene6 = drawScene;
drawScene = function () {
  _drawScene6(); const s = S; if (!s || s.mode !== 'atk') return; const cv = $('cv'); if (!cv) return; const x = cv.getContext('2d'); if (!x) return;
  x.save(); x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
  const arrow = (a, b, col) => { const p = P3(a.x, a.y, 0), q = P3(b.x, b.y, 0), an = Math.atan2(q.Y - p.Y, q.X - p.X); x.strokeStyle = col; x.lineWidth = 2.5; x.setLineDash([6, 5]); x.beginPath(); x.moveTo(p.X, p.Y); x.lineTo(q.X, q.Y); x.stroke(); x.setLineDash([]); x.fillStyle = col; x.beginPath(); x.moveTo(q.X + Math.cos(an) * 7, q.Y + Math.sin(an) * 7); x.lineTo(q.X + Math.cos(an + 2.5) * 7, q.Y + Math.sin(an + 2.5) * 7); x.lineTo(q.X + Math.cos(an - 2.5) * 7, q.Y + Math.sin(an - 2.5) * 7); x.fill(); };
  if (['draw', 'anim', 'run', 'tap'].includes(s.phase)) s.P.forEach(p => { if (p.cmd) arrow(p, p.cmd, 'rgba(127,178,255,.9)'); });
  if (s.stick && s.stick.cmd && s.stick.mate) arrow(s.stick.mate, s.stick.cmd, '#7fb2ff');
  if (s.phase === 'draw') { const tag = `🏃 ${s.cmdLeft || 0}`; x.font = '700 12px "Barlow Condensed",sans-serif'; const tw = x.measureText(tag).width + 14; x.fillStyle = 'rgba(0,0,0,.45)'; rr(x, 8, 32, tw, 20, 10); x.fill(); x.fillStyle = (s.cmdLeft || 0) ? '#7fb2ff' : 'rgba(255,255,255,.5)'; x.textBaseline = 'top'; x.fillText(tag, 15, 36); }
  x.restore();
};
drawHint = function () {
  const s = S; if (s.type === 'pen') return '🎯 Penaltı! Oku kaleye doğru çek (uzunluk = sertlik), sonra topa bas. Yanına basarsan falso.';
  if (s.type === 'fk' && s.n === 0) return '🎯 Serbest vuruş: oku kaleye çek, sonra topun alt-yanına bas: havalanıp falsoyla barajı aşar. Ya da bir arkadaşının önüne çek.';
  const c = runCmds();
  return `🏹 Parmağını koy ve ÇEK: okun ucu topun gideceği yer. Az çek = yumuşak, çok çek = sert. Arkadaşının önüne atabilirsin. Topun altına basarsan havadan, ortasına basarsan yerden gider.${c ? ` 🏃 Arkadaşına dokunup sürükle: koşacağı yeri göster (${c}).` : ''}`;
};
/* panel açıklaması */
const _ctlHTML6 = ctlHTML;
ctlHTML = function () {
  const h = _ctlHTML6(); return h.replace(/<div class="v5leg">[\s\S]*?<\/div>/, `<div class="v5leg"><span>🏹 okun ucu = hedef</span><span>📏 uzun = sert</span><span>⬆️ alttan bas = havadan</span><span>💨 kısa = sür</span>${runCmds() ? '<span>🏃 arkadaşı sürükle = koşu</span>' : ''}</div>`);
};

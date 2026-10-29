/* ============================================================
   MİRAS FC — MAÇ MOTORU v5 · "ÇİZ VE OYNA"
   Telefona göre tasarlandı; tek hareket, net geri bildirim:
   - Pozisyonda oyun DURUR. Topu kimde ise (sen ya da takım
     arkadaşın) ondan başlayarak parmağınla bir YOL ÇİZ:
       · yol bir arkadaşında biterse  → PAS
       · kalede biterse               → ŞUT (yolun kavisi = falso)
       · boşlukta biterse (≤12 m)     → TOPLA SÜR
   - Çizerken rakibin keseceği yerler KIRMIZI yanar; yeşil yol temiz.
     Riski sen seçersin: kırmızıdan geçen pas çoğu zaman kesilir.
   - Uzun paslar (24 m+) havadan gider: sadece başında ve sonunda
     kesilebilir. Her pastan sonra savunma ve arkadaşların yer değiştirir.
   - Şutta isabet yeteneğine, mesafeye, baskıya bağlı; kaleci uzanır.
   - Bir pozisyonda en fazla 8 hamle. Gol atarsan, asist yaparsan
     ya da hamle zinciri kurarsan puanın artar.
   Savunma anı (araya girme) ve sahne kurulumu engine.js'ten gelir.
   ============================================================ */
const V5 = { maxN: 8, passV: 17, longV: 21, shotV: 27, dribV: 6.6, maxPass: 42, maxDrib: 12, longLen: 24 };
const EMO = { goal: '⚽', save: '🧤', cut: '❌', star: '⭐', fire: '🔥', post: '🥅', boot: '👟', run: '💨' };

/* ---------- sahne kurulumunu v5'e çevir ---------- */
const _mkScene4 = mkScene;
mkScene = function (mo) {
  _mkScene4(mo); const s = S; s.v5 = 1; s.parts = []; s.combo = 0;
  if (s.mode === 'def') return s; /* araya girme mini oyunu aynen kalır */
  s.car = s.me; s.ball.owner = s.me; s.n = 0; s.maxN = s.type === 'fk' || s.type === 'one' ? 4 : Math.round(cl(5 + toGoal(s.me) / 8, 6, 12));
  if (s.type === 'head') { s.phase = 'crossIn'; s.ci = { t: 0, from: { x: s.crosser.x, y: s.crosser.y }, d: .95 }; s.ball.owner = null; Object.assign(s.ball, { x: s.crosser.x, y: s.crosser.y, z: 0 }); s.hint = 'Orta geliyor! Top başına gelince çubuğu kaleye doğru çek: kafa vuruşu.'; return s; }
  s.phase = 'draw'; s.hint = drawHint(); attach(); gkPlace(); return s;
};
function drawHint() {
  const s = S; if (s.type === 'pen') return '🎯 Penaltı! Çubuğu kaleye doğru çek, sonra topa bas. Topun yanına basarsan falso verirsin.';
  if (s.type === 'fk' && s.n === 0) return '🎯 Serbest vuruş: çubuğu kaleye çek, sonra topun yanına bas: falsoyla barajın etrafından dolanır. Ya da arkadaşına çek.';
  return '🏒 Parmağını koy ve hedefe doğru ÇEK: çubuk uzar. Arkadaşa uzanırsa pas, kaleye uzanırsa şut, kısa çekersen topla sürersin. Uzun çubuk = sert vuruş. ⚠️ = rakip keser.';
}

/* ---------- yol analizi ---------- */
function plen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); return L; }
function psmooth(P) { if (P.length < 3) return P; const o = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; o.push({ x: a.x * .75 + b.x * .25, y: a.y * .75 + b.y * .25 }, { x: a.x * .25 + b.x * .75, y: a.y * .25 + b.y * .75 }); } o.push(P[P.length - 1]); return o; }
function ptrim(P, max) { const o = [P[0]]; let L = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); if (L + d > max) { const f = (max - L) / d; o.push({ x: P[i - 1].x + (P[i].x - P[i - 1].x) * f, y: P[i - 1].y + (P[i].y - P[i - 1].y) * f }); return o; } L += d; o.push(P[i]); } return o; }
function pAt(P, u) { /* u: 0..1 boy oranı */ const L = plen(P) * cl(u, 0, 1); let acc = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); if (acc + d >= L) { const f = d ? (L - acc) / d : 0; return { x: P[i - 1].x + (P[i].x - P[i - 1].x) * f, y: P[i - 1].y + (P[i].y - P[i - 1].y) * f }; } acc += d; } return P[P.length - 1]; }
function pCurl(P) { const a = P[0], b = P[P.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1; let m = 0; P.forEach(p => { const d = ((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L; if (Math.abs(d) > Math.abs(m)) m = d; }); return m / L; }
/* yolun türü: pas / şut / sür */
function pKind(P) {
  const s = S, e = P[P.length - 1], car = s.car;
  const AS = (typeof gsAssist === 'function' && gsAssist()) ? 1 : 0;
  if (e.y > GY - 2.2 && e.x > GOAL_L - 3 - AS * 1.6 && e.x < GOAL_R + 3 + AS * 1.6) return { k: 'shot' };
  let best = null, bd = 2.6 + AS * 1.1; s.P.forEach(p => { if (p.side !== 'us' || p === car || p.gk) return; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < bd) { bd = d; best = p; } });
  if (best) return { k: 'pass', to: best };
  return { k: s.head || s.type === 'pen' || (s.type === 'fk' && s.dead) ? 'none' : 'drib' };
}
/* rakiplerin yola uzaklığı → tehlike listesi */
function pDanger(P, kind) {
  const s = S, out = [], L = plen(P), car = s.car, lofted = kind === 'pass' && L > V5.longLen;
  const sk = car === s.me ? (kind === 'drib' ? (st('tek') + st('hiz')) / 2 + (hasPerk('calim') ? 6 : 0) : st('pas') + (hasPerk('pasor') ? 6 : 0)) : car.r;
  s.P.forEach(d => {
    if (d.side !== 'th' || d.gk || d.down > 0) return;
    const reach = (d.wallP ? .9 : kind === 'drib' ? 1.7 : 1.2) + (d.r - 70) / 60 + (s.df - 1) * .8;
    let best = 99, bu = 0, acc = 0;
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dl = Math.hypot(b.x - a.x, b.y - a.y); for (let k = 0; k <= 4; k++) { const f = k / 4, x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, u = (acc + dl * f) / (L || 1); if (u * L < 1.2) continue; if (lofted && u > .18 && u < .8) continue; const dd = Math.hypot(d.x - x, d.y - y); if (dd < best) { best = dd; bu = u; } } acc += dl; }
    if (best < reach) { const base = kind === 'drib' ? .42 : kind === 'shot' ? .28 : .32; out.push({ d, u: bu, p: cl(base + (1 - best / reach) * .5 + (d.r - sk) / 110 + (s.df - 1) * .45 + (d.wallP ? .25 : 0), .08, .95) }); }
  });
  return out.sort((a, b) => a.u - b.u);
}
function pEval(P) { const k = pKind(P); return { ...k, len: plen(P), dang: k.k === 'none' ? [] : pDanger(P, k.k) }; }

/* ---------- ÇUBUK ile nişan (v3.2) ----------
   Parmağını koy ve hedefe doğru çek: oyuncudan o yöne bir çubuk uzar.
   Çubuk ne kadar uzunsa vuruş o kadar sert / uzun. Çubuk bir arkadaşa
   uzanırsa pas, kaleye uzanırsa şut, kısa ise topla sürme. */
function stickEval(px, py, st1) {
  const s = S, st0 = st1 || s.stick, car = s.car, sc = PR.sc, dx = (px - st0.p0[0]) / sc, dy = -(py - st0.p0[1]) / sc, Lpx = Math.hypot(px - st0.p0[0], py - st0.p0[1]);
  if (Lpx < 8) return null; const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), Lw = Math.min(46, Lpx / sc * 2.1);
  const AS = (typeof gsAssist === 'function' && gsAssist()) ? 1 : 0;
  const tip = { x: cl(car.x + ux * Lw, .5, 67.5), y: cl(car.y + uy * Lw, 1, 107) };
  const head = s.head || s.type === 'pen' || (s.type === 'fk' && s.dead);
  /* kale: çubuğun doğrultusu kale ağzından geçiyor mu? */
  if (uy > .15) { const t = (GY - car.y) / uy, gx = car.x + ux * t, D = Math.hypot(GY - car.y, gx - car.x);
    if (gx > GOAL_L - 3.5 - AS * 1.8 && gx < GOAL_R + 3.5 + AS * 1.8 && D < 40 && (Lw > D * .45 || head || D < 16)) return { k: 'shot', P: [{ x: car.x, y: car.y }, { x: cl(gx, GOAL_L - 2.5, GOAL_R + 2.5), y: GY + .4 }], pw: cl(Lw / Math.max(8, D), .35, 1.9), tip, aim: gx }; }
  /* arkadaş: çubuğun ucuna ya da doğrultusuna en yakın */
  let best = null, bs = 1e9;
  s.P.forEach(p => { if (p.side !== 'us' || p === car || p.gk) return; const ax = p.x - car.x, ay = p.y - car.y, along = ax * ux + ay * uy, perp = Math.abs(ax * uy - ay * ux); if (along < 2) return; const tipD = Math.hypot(p.x - tip.x, p.y - tip.y), sc2 = perp * 1.6 + tipD * .6; const dd = Math.hypot(ax, ay); if ((perp < 4 + AS * 2 || tipD < 5 + AS * 2) && (Lw >= dd * .45 || tipD < 5 + AS * 2) && sc2 < bs) { bs = sc2; best = p; } });
  if (best) { const d = Math.hypot(best.x - car.x, best.y - car.y); return { k: 'pass', to: best, P: [{ x: car.x, y: car.y }, { x: best.x, y: best.y }], pw: cl(Lw / Math.max(4, d), .3, 2), tip }; }
  if (head) return { k: 'none', tip, P: [{ x: car.x, y: car.y }, tip] };
  if (Lw <= 13) return { k: 'drib', P: [{ x: car.x, y: car.y }, tip], pw: 1, tip };
  /* boşluğa ara pas: uca en yakın arkadaş koşar */
  const run = s.P.filter(p => p.side === 'us' && p !== car && !p.gk).sort((a, b) => Math.hypot(a.x - tip.x, a.y - tip.y) - Math.hypot(b.x - tip.x, b.y - tip.y))[0];
  if (run && Math.hypot(run.x - tip.x, run.y - tip.y) < 10) return { k: 'pass', to: run, thru: tip, P: [{ x: car.x, y: car.y }, { x: tip.x, y: tip.y }], pw: 1, tip };
  return { k: 'none', tip, P: [{ x: car.x, y: car.y }, tip] };
}
function v5Down(px, py) { const s = S; if (s.phase !== 'draw') return; s.stick = { p0: [px, py], cur: [px, py], e: null, t0: s.t }; }
function v5Move(px, py) { const s = S; if (!s.stick || s.phase !== 'draw') return; s.stick.cur = [px, py]; const e = stickEval(px, py); s.stick.e = e; if (e && e.k !== 'none' && !e.dang) e.dang = pDanger(e.P, e.k, e.pw); }
function v5Up() {
  const s = S, sk = s.stick; s.stick = null; if (!sk || s.phase !== 'draw') return;
  const moved = Math.hypot(sk.cur[0] - sk.p0[0], sk.cur[1] - sk.p0[1]);
  if (moved < 12) { /* dokunuş: arkadaşa pas, kaleye şut, boşluğa kısa sürüş */
    const w = unprojG(sk.p0[0], sk.p0[1]), gp = unprojY(sk.p0[0], sk.p0[1], GY), car = s.car;
    if (gp && Math.abs(gp.x - 34) < 6 && w.y > 100) return doStick({ k: 'shot', P: [{ x: car.x, y: car.y }, { x: cl(gp.x, GOAL_L - 1, GOAL_R + 1), y: GY + .4 }], pw: 1 });
    const mate = s.P.filter(p => p.side === 'us' && p !== car && !p.gk).sort((a, b) => Math.hypot(a.x - w.x, a.y - w.y) - Math.hypot(b.x - w.x, b.y - w.y))[0];
    if (mate && Math.hypot(mate.x - w.x, mate.y - w.y) < 4) return doStick({ k: 'pass', to: mate, P: [{ x: car.x, y: car.y }, { x: mate.x, y: mate.y }], pw: 1 });
    if (!s.head && s.type !== 'pen' && Math.hypot(w.x - car.x, w.y - car.y) > 1.5) { const d = Math.min(12, Math.hypot(w.x - car.x, w.y - car.y)), a = Math.atan2(w.x - car.x, w.y - car.y); return doStick({ k: 'drib', P: [{ x: car.x, y: car.y }, { x: car.x + Math.sin(a) * d, y: car.y + Math.cos(a) * d }], pw: 1 }); }
    return;
  }
  const e = stickEval(sk.cur[0], sk.cur[1], sk); if (!e) return;
  if (e.k === 'none') { s.msg = s.head || s.type === 'pen' ? '🎯 Çubuğu kaleye doğru çek.' : '👟 Çubuğu bir arkadaşına ya da kaleye doğru çek; kısa çekersen topla sürersin.'; return drawUIControls(); }
  doStick(e);
}
function doStick(e) { S.stickPw = e.pw || 1; S.thru = e.thru || null; doPath(e.P, { k: e.k, to: e.to, len: plen(e.P), dang: e.k === 'none' ? [] : pDanger(e.P, e.k) }); }
/* ---------- hamleyi uygula ---------- */
function doPath(P, ev0) {
  const s = S, ev = ev0 || pEval(P);
  if (ev.k === 'none') { s.msg = 'Bu pozisyonda yol bir arkadaşında ya da kalede bitmeli.'; return drawUIControls(); }
  if (ev.k === 'drib') P = ptrim(P, V5.maxDrib + (st('hiz') - 60) / 10);
  if (ev.k === 'pass' && !s.thru) { P[P.length - 1] = { x: ev.to.x, y: ev.to.y }; P = ptrim(P, V5.maxPass); }
  if (ev.k === 'shot') { const e = P[P.length - 1]; P[P.length - 1] = { x: cl(e.x, GOAL_L - 2.5, GOAL_R + 2.5), y: GY + .4 }; }
  /* vuruşta top havaya çıkar, sen topa basarsın (NSS gibi ama kolay) */
  if (ev.k === 'shot' || (ev.k === 'pass' && s.car === s.me)) { s.pend = { P, ev }; s.tp = { t0: s.t, dur: 2.9, k: ev.k, hit: null }; s.phase = 'tap'; s.path = null; s.msg = ev.k === 'shot' ? '⚽ Top havada! Topa BAS: ortasına basarsan mükemmel vuruş.' : '👟 Topa BAS: ortasına basarsan kusursuz pas.'; return drawUIControls(); }
  launchPath(P, ev, .6, 0, 0);
}
/* topa basma: q = 0 (ıskaladın) .. 1 (tam ortası), oy: -1 üst .. 1 alt, ox: -1 sol .. 1 sağ.
   Ortaya ne kadar yakınsa o kadar sert ve isabetli; kenara doğru gittikçe
   etki (falso / yükseklik) artar, isabet biraz düşer. Iskalasan da top gider. */
function tapBall(px, py) {
  const s = S; if (!s || s.phase !== 'tap' || s.tp.hit) return; const b = tpBall(s.t), R = tpR(), dx = px - b.x, dy = py - b.y, d = Math.hypot(dx, dy) / R;
  const q = d <= 1 ? 1 - d * .35 : d < 1.35 ? .45 : .2, ox = cl(dx / R, -1, 1), oy = cl(dy / R, -1, 1);
  s.tp.hit = { x: px, y: py, q, oy, ox, t: s.t }; M.my.tq = (M.my.tq || 0) + q;
  const fx = [d > 1.35 ? '😅 ISKALADIN' : d < .3 ? '✨ TAM ORTASI' : d < .65 ? '👍 İYİ VURUŞ' : '🙂 KENARINDAN'];
  if (d <= 1.35) { if (Math.abs(ox) > .3) fx.push(ox > 0 ? '↩️ FALSO' : '↪️ FALSO'); if (oy > .3) fx.push('⬆️ HAVALI'); else if (oy < -.3) fx.push('⬇️ ALÇAK'); }
  flash(fx.join(' '));
}
function tpR() { return Math.min(CV.W * .2, CV.H * .16); }
function tpBall(t) { const s = S, u = cl((t - s.tp.t0) / s.tp.dur, 0, 1.1), W = CV.W, H = CV.H, gy = H * .82, R = tpR(); return { x: W * .16 + W * .68 * u, y: gy - R - Math.sin(Math.min(1, u) * Math.PI) * (gy - R * 2.7), u, rot: u * 5 }; }
function tapTick(dt) {
  const s = S, tp = s.tp;
  if (tp.hit && s.t - tp.hit.t > .55) { const h = tp.hit, pd = s.pend; s.pend = null; s.tp = null; return launchPath(pd.P, pd.ev, h.q, h.oy, h.ox); }
  if (!tp.hit && s.t - tp.t0 > tp.dur) { tp.hit = { x: -99, y: -99, q: .35, oy: 0, ox: 0, t: s.t }; flash('⏱️ GEÇ KALDIN'); }
}
/* güzel bir top: gölgeli küre, ortada siyah beşgen, çevresinde beşgenler ve dikiş çizgileri */
function drawFancyBall(x, X, Y, R, rot) {
  x.save(); x.translate(X, Y);
  const gr = x.createRadialGradient(-R * .35, -R * .45, R * .1, 0, 0, R * 1.02); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.65, '#eef1f3'); gr.addColorStop(1, '#aab3b9');
  x.fillStyle = gr; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(0, 0, R, 0, 7); x.clip(); x.rotate(rot);
  const pent = (cx, cy, r, a0, sq) => { x.beginPath(); for (let j = 0; j < 5; j++) { const a = a0 + j * 1.2566, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * sq; j ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
  x.fillStyle = '#1b1f24'; pent(0, 0, R * .3, -Math.PI / 2, 1); x.fill();
  x.strokeStyle = 'rgba(40,45,50,.55)'; x.lineWidth = Math.max(1, R * .025);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566, cx = Math.cos(a) * R * .3, cy = Math.sin(a) * R * .3, ex = Math.cos(a) * R * .62, ey = Math.sin(a) * R * .62; x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey); x.stroke();
    const a2 = a + .628, ox2 = Math.cos(a2) * R * .86, oy2 = Math.sin(a2) * R * .86; x.fillStyle = '#1b1f24'; pent(ox2, oy2, R * .26, a2 + Math.PI, .8); x.fill(); x.beginPath(); x.moveTo(ex, ey); x.lineTo(Math.cos(a2) * R * .64, Math.sin(a2) * R * .64); x.stroke(); }
  x.restore();
  const sh = x.createRadialGradient(R * .3, R * .4, R * .2, 0, 0, R); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.22)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(-R * .38, -R * .45, R * .2, R * .12, -.6, 0, 7); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, R, 0, 7); x.stroke();
  x.restore();
}
function drawTap(x, W, H) {
  const tp = S.tp; if (!tp) return; const b = tpBall(S.t), R = tpR(), gy = H * .82;
  const sky = x.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#2c5fc4'); sky.addColorStop(1, '#a4c9f4'); x.fillStyle = sky; x.fillRect(0, 0, W, gy);
  x.fillStyle = 'rgba(255,255,255,.95)'; [[.12, .66, 1], [.4, .7, .8], [.68, .68, 1.1], [.9, .71, .9], [.26, .18, .7], [.78, .12, .6]].forEach(([cx, cy, k]) => { for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(W * cx + (i - 1.5) * 15 * k, H * cy - (i % 2) * 8 * k, 13 * k, 0, 7); x.fill(); } });
  x.fillStyle = '#25324a'; x.fillRect(0, gy - 26, W, 26); for (let i = 0; i < 90; i++) { x.fillStyle = ['#e8c468', '#ff6b5b', '#fff', '#7fb2ff', '#56c98d'][i % 5]; x.fillRect((i * 37.3) % W, gy - 24 + (i * 13) % 20, 3, 3); }
  const gg = x.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#4fb83a'); gg.addColorStop(1, '#2f8a22'); x.fillStyle = gg; x.fillRect(0, gy, W, H - gy);
  x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(b.x, gy + 12, R * (.45 + (b.y / gy) * .45), R * .13, 0, 0, 7); x.fill();
  drawFancyBall(x, b.x, b.y, R, b.rot);
  if (!tp.hit) {
    /* vuruş bölgeleri: ortası sert, üstü alçak, altı havalı, yanları falso */
    const pu = (Math.sin(performance.now() / 170) + 1) / 2;
    x.strokeStyle = `rgba(255,227,77,${.55 + pu * .35})`; x.lineWidth = 3; x.beginPath(); x.arc(b.x, b.y, R + 6 + pu * 4, 0, 7); x.stroke();
    x.strokeStyle = 'rgba(255,138,30,.9)'; x.lineWidth = 2; x.beginPath(); x.arc(b.x, b.y, R * .3, 0, 7); x.stroke(); x.fillStyle = 'rgba(255,138,30,.9)'; x.beginPath(); x.arc(b.x, b.y, 3, 0, 7); x.fill();
    x.setLineDash([4, 5]); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(b.x - R, b.y); x.lineTo(b.x + R, b.y); x.moveTo(b.x, b.y - R); x.lineTo(b.x, b.y + R); x.stroke(); x.setLineDash([]);
    x.font = '700 11px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const lab = (t, X, Y) => { const w = x.measureText(t).width + 10; x.fillStyle = 'rgba(0,0,0,.5)'; rr(x, X - w / 2, Y - 8, w, 16, 8); x.fill(); x.fillStyle = '#fff'; x.fillText(t, X, Y); };
    lab(T('⬇️ ALÇAK'), b.x, b.y - R - 20); lab(T('⬆️ HAVALI'), b.x, b.y + R + 20); lab(T('↪️ FALSO'), b.x - R - 34, b.y); lab(T('FALSO ↩️'), b.x + R + 34, b.y);
  }
  if (tp.hit && tp.hit.x > -50) { const k = (S.t - tp.hit.t) / .55; x.fillStyle = '#ff8a1e'; star(x, tp.hit.x, tp.hit.y, 10 + k * 26); x.fillStyle = '#fff'; star(x, tp.hit.x, tp.hit.y, 5 + k * 12); }
  x.fillStyle = '#fff'; x.font = '800 22px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top'; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 4;
  x.fillText(T(tp.k === 'shot' ? '⚽ TOPA BAS!' : '👟 TOPA BAS!'), W / 2, 12); x.shadowBlur = 0;
  x.font = '600 12px "Barlow",sans-serif'; x.textBaseline = 'bottom'; x.fillText(T('Ortası = sert ve isabetli · Kenara gittikçe etki artar'), W / 2, H - 10); x.textAlign = 'left';
  /* süre çubuğu */
  if (!tp.hit) { const f = cl(1 - (S.t - tp.t0) / tp.dur, 0, 1); x.fillStyle = 'rgba(0,0,0,.35)'; rr(x, W * .2, 44, W * .6, 6, 3); x.fill(); x.fillStyle = f > .3 ? '#ffe34d' : '#ff6b5b'; rr(x, W * .2, 44, W * .6 * f, 6, 3); x.fill(); }
}
function launchPath(P, ev, q, oy, ox) {
  const s = S; q = q == null ? .6 : q;
  /* topun yanına vurmak falso verir: yol kavislenir (sağına vurursan top önce sağa açılıp sola döner) */
  if ((ev.k === 'shot' || ev.k === 'pass') && Math.abs(ox || 0) > .12 && P.length === 2) {
    const a = P[0], e = P[1], L0 = Math.hypot(e.x - a.x, e.y - a.y) || 1, ux = (e.x - a.x) / L0, uy = (e.y - a.y) / L0, k = (ev.k === 'shot' ? .2 : .13) * L0 * ox;
    const c = { x: (a.x + e.x) / 2 + uy * k, y: (a.y + e.y) / 2 - ux * k }, Q = []; for (let i = 0; i <= 16; i++) { const t = i / 16; Q.push({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * e.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * e.y }); } P = Q;
  }
  const L = plen(P), car = s.car; s.n++; M.my.touch = (M.my.touch || 0) + 1;
  const pw = s.stickPw || 1; s.stickPw = 1; const thru = s.thru; s.thru = null;
  const run = { P, L, k: ev.k, to: ev.to, t: 0, u: 0, car, fail: null, res: null, q, oy, pw, thru };
  run.v = ev.k === 'shot' ? V5.shotV * (s.head ? .7 : 1) : ev.k === 'drib' ? V5.dribV * Math.sqrt((car === s.me ? st('hiz') : car.r) / 70) : L > V5.longLen ? V5.longV : V5.passV;
  run.loft = ev.k === 'pass' && (L > V5.longLen || (s.dead && s.type === 'fk') || oy > .35);
  if (ev.k === 'pass') run.v *= cl(.75 + pw * .3, .8, 1.35); if (ev.k === 'shot') run.v *= cl(.7 + pw * .3, .75, 1.3);
  /* kesilme: yol boyunca ilk başarılı rakip */
  const dang = pDanger(P, ev.k); for (const d of dang) if (Math.random() < d.p * (ev.k === 'shot' ? .75 : 1) * (1.15 - q * .45)) { run.fail = d; break; }
  run.T = L / (ev.k === 'shot' ? 1 : .8) / (ev.k === 'shot' ? 1 : 1) ;
  if (ev.k === 'shot') run.res = shotResult(P, run);
  if (ev.k === 'pass' && !run.fail && Math.random() < (.015 + Math.max(0, L - 30) * .005) * (1.3 - q) + Math.max(0, .72 - pw) * 1.1 + Math.max(0, pw - 1.55) * .5) run.fail = { d: null, u: .98, miss: 1 };
  /* başlık / kafa düellosu */
  if (s.head && !s.headDone) { s.headDone = 1; const mk = s.P.find(p => p.marker); if (mk && Math.random() > duelP(mk)) { M.my.hd = (M.my.hd || 0) + 1; M.my.bad++; flash('🤕 DÜELLO'); return endScene({ t: 'KAFA DÜELLOSU', s: `${short(mk.n)} senden önce yükseldi`, c: '#d8e2dc' }, 0); } }
  if (car === s.me && ev.k === 'shot') { M.my.sh++; if (s.type === 'pen') M.my.pen = 1; if (s.head) M.my.hd = (M.my.hd || 0) + 1; }
  if (run.fail && run.fail.d) { const d = run.fail.d, pt = pAt(P, run.fail.u); anim(d, pt.x, pt.y - .3, cl(run.fail.u * L / run.v, .25, 1.6)); }
  if (ev.k === 'shot' && s.gk) { const r = run.res, kx = r.save ? r.x : r.gx; anim(s.gk, cl(kx, GOAL_L - .4, GOAL_R + .4), 104.3, cl(L / run.v * .9, .2, 1.2)); if (Math.abs(kx - s.gk.x) > 1.2) s.gk.down = .8; }
  if (ev.k === 'pass' && ev.to) { const to = ev.to, e = P[P.length - 1]; if (thru) anim(to, e.x, e.y, L / run.v * 1.2); else anim(to, to.x + rf(-.5, .5), to.y + rf(0, 1.2), L / run.v); }
  /* boşluğa ara pas: rakip savunma da topun düştüğü noktaya koşar (yalnız bizim oyuncu değil) ve yarışı kazanabilir */
  if (ev.k === 'pass' && thru && ev.to) {
    const to = ev.to, e = P[P.length - 1];
    const defs = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP && !(p.down > 0)).sort((a, b) => dist(a, e) - dist(b, e));
    const defSpd = p => 7.5 * ((p.r || 70) / 72);
    if (defs[0]) { const d0 = defs[0]; anim(d0, cl(e.x + rf(-.5, .5), 2, 66), Math.min(106, e.y - .3), cl(dist(d0, e) / defSpd(d0), .3, 1.8)); }
    if (defs[1] && dist(defs[1], e) < 15) { const d1 = defs[1]; anim(d1, cl(e.x + rf(-1.4, 1.4), 2, 66), Math.min(106, e.y + rf(.4, 2.2)), cl(dist(d1, e) / defSpd(d1), .3, 1.8)); }
    if (!run.fail && defs[0]) {
      const tDef = dist(defs[0], e) / defSpd(defs[0]), tMate = dist(to, e) / (7.5 * ((to === s.me ? st('hiz') : to.r) / 72));
      if (tDef < tMate - .12 && Math.random() < cl(.28 + (tMate - tDef) * .75 + (s.df - 1) * .4 - (q - .6) * .3, .08, .85)) run.fail = { d: defs[0], u: .97 };
    }
  }
  s.ball.owner = null; s.run = run; s.phase = 'run'; s.trail = []; s.lastKick = car; s.msg = ''; drawUIControls();
}
/* şutun sonucu (önceden belirlenir, sonra canlandırılır) */
function shotResult(P, run) {
  const s = S, car = s.car, me = car === s.me, D = Math.hypot(GY - P[0].y, 34 - P[0].x), pen = s.type === 'pen';
  const sk = me ? st('sut') + (hasPerk('bitirici') && D < 18 ? 6 : 0) + (hasPerk('uzak') && D > 20 ? 7 : 0) + (s.type === 'fk' && hasPerk('falso') ? 8 : 0) + (pen && hasPerk('soguk') ? 8 : 0) + (s.head ? ((st('fiz') - st('sut')) / 2 + (hasPerk('hava') ? 7 : 0)) : 0) : car.r;
  const curl = Math.abs(pCurl(P)), press = s.P.some(d => d.side === 'th' && !d.gk && Math.hypot(d.x - car.x, d.y - car.y) < 2.2);
  const q = run.q == null ? .6 : run.q, sig = (1.3 - q * .6) * (.26 + D * .03) * (1 + (76 - sk) / 55) * Math.pow(s.df, .5) * (s.head ? 1.6 : 1) * (pen ? .55 : 1) * (press ? 1.25 : 1) * (1 + curl * .8) * cl(1 - mood() * 2, .7, 1.3) / s.W0.acc;
  const aim = P[P.length - 1].x, x = aim + gauss() * sig, over = !pen && Math.random() < cl((D - 17) * .011 + Math.max(0, (run.oy || 0) - .45) * .5 + Math.max(0, (run.pw || 1) - 1.45) * .6, 0, .6) * (1 + (72 - sk) / 50) * (1.2 - q * .5);
  const k = s.gk, kr = k ? k.r : 70; let gx = k ? k.x : 34;
  const out = { x, gx, goal: false, save: false, wide: false, post: false, over };
  if (over) return out;
  if (Math.abs(x - GOAL_L) < .16 || Math.abs(x - GOAL_R) < .16) { out.post = true; return out; }
  if (x < GOAL_L || x > GOAL_R) { out.wide = true; return out; }
  if (pen) { const r = Math.random(); gx = r < .4 ? GOAL_L + 1.6 : r < .8 ? GOAL_R - 1.6 : 34; out.gx = gx; }
  /* kaleci: erişim mesafeyle artar (tepki süresi), köşeler artık kurtarılabilir; sert ve falsolu şut zorlaştırır */
  const KP = typeof KEEP !== 'undefined' ? KEEP : { base: 2, dist: .032, kr: 40, fall: .7, tip: .04, ang: 0 };
  const reach = (pen ? KP.pen || 1.25 : KP.base + D * KP.dist) + (kr - 70) / KP.kr, dx = Math.abs(x - gx), angF = Math.abs(P[0].x - 34) > 12 && D < 18 ? KP.ang : 0;
  const p = dx < reach * 1.25 ? cl(.93 - Math.pow(dx / reach, 2) * KP.fall - curl * .4 - q * .12 - ((run.pw || 1) - 1) * .2 + (kr - 70) / 140 - (sk - 70) / 160 + (s.df - 1) * .5 + (s.head ? .1 : 0) + angF, .06, .94) : KP.tip;
  if (Math.random() < p) { out.save = true; out.held = dx < reach * .45 && Math.random() < .6; } else { out.goal = true; out.gx = gx + (x - gx) * rf(.4, .8); }
  return out;
}
/* ---------- her kare ---------- */
function runTick(dt) {
  const s = S, r = s.run, B = s.ball; r.t += dt;
  /* gerçekçi hız: yerden paslar yavaşlayarak gider, şut neredeyse sabit hızda */
  const T = r.L / r.v * (r.k === 'pass' && !r.loft ? 1.35 : r.k === 'shot' ? 1.05 : 1), tt = Math.min(1, r.t / T);
  const u = r.k === 'pass' && !r.loft ? 1 - Math.pow(1 - tt, 1.6) : r.k === 'shot' ? 1 - Math.pow(1 - tt, 1.15) : tt;
  if (s.anims.length) runAnims(dt);
  if (r.fail && u >= r.fail.u) return pathFail(r);
  const p = pAt(r.P, u);
  if (r.k === 'drib') { r.car.x = p.x; r.car.y = p.y; attach(); }
  else {
    B.x = p.x; B.y = p.y;
    if (r.loft) { const h = Math.min(7, r.L / 4.5); B.z = tt < .86 ? Math.sin(tt / .86 * Math.PI) * h : Math.sin((tt - .86) / .14 * Math.PI) * h * .12; }
    else if (r.k === 'shot') { const zt = r.res && r.res.over ? 3.4 : (r.oy || 0) > .3 ? 2 : (r.oy || 0) < -.3 ? .35 : 1.05; B.z = zt * tt + Math.sin(tt * Math.PI) * .7; }
    else B.z = 0;
    B.spin = (B.spin || 0) + dt * r.v;
  }
  s.trail.push({ x: B.x, y: B.y, z: B.z }); if (s.trail.length > 16) s.trail.shift();
  if (tt >= 1) pathDone(r);
}
/* serbest top: gol ağı, kaleciden seken, direkten dönen, auta giden top */
function freeTick(dt) {
  const s = S, f = s.free, B = s.ball; if (!f) return;
  B.x += f.vx * dt; B.y += f.vy * dt; B.z = (B.z || 0) + f.vz * dt; f.vz -= 9.8 * dt;
  if (B.z <= 0) { B.z = 0; if (f.vz < -1.5) { f.vz = -f.vz * .45; f.vx *= .8; f.vy *= .8; } else f.vz = 0; }
  if (B.z === 0) { const k = Math.max(0, 1 - 1.4 * dt); f.vx *= k; f.vy *= k; }
  if (f.net && B.y > GY + 1.7) { B.y = GY + 1.7; f.vy = 0; f.vx *= .3; }
  if (Math.hypot(f.vx, f.vy) < .2 && B.z === 0) s.free = null;
}
function pathFail(r) {
  const s = S, d = r.fail.d, me = r.car === s.me;
  if (r.fail.miss) { if (me) M.my.bad++; flash('😬 KONTROL'); return endScene({ t: 'TOP KAÇTI', s: `${short(r.to.n)} topu kontrol edemedi`, c: '#d8e2dc' }, 0); }
  s.ball.owner = d; attach(); s.phase = 'anim';
  if (r.k === 'shot') { if (me) M.my.ok++; flash('🛡️ BLOK'); return endScene({ t: d.wallP ? 'BARAJA TAKILDI' : 'BLOK', s: `${short(d.n)} şutu engelledi`, c: '#d8e2dc' }, 0); }
  if (me) M.my.bad++; flash(EMO.cut + ' KESİLDİ');
  return endScene({ t: r.k === 'drib' ? 'TOP KAPILDI' : 'PAS KESİLDİ', s: `${short(d.n)} ${r.k === 'drib' ? 'topu ayağından aldı' : 'araya girdi'}`, c: '#d8e2dc' }, 0);
}
function pathDone(r) {
  const s = S, me = r.car === s.me;
  if (r.k === 'drib') { s.ball.owner = r.car; attach(); s.combo++; if (me) { M.my.ok++; M.my.drib = (M.my.drib || 0) + 1; } flash(EMO.run + ' ' + (s.combo > 1 ? `${EMO.fire} x${s.combo}` : 'SÜRDÜ')); return nextDraw(); }
  if (r.k === 'pass') {
    const to = r.to;
    if (r.loft && to.y > 86 && Math.abs(to.x - 34) < 22) { const df = s.P.filter(p => p.side === 'th' && !p.gk).sort((a, b) => dist(a, to) - dist(b, to))[0]; if (df && dist(df, to) < 4 && Math.random() > cl(.55 + ((to.me ? st('fiz') : to.r) - df.r) / 80 - (s.df - 1) * .5, .2, .8)) { s.ball.owner = df; attach(); flash('🛡️ UZAKLAŞTIRDI'); if (me) M.my.ok++; return endScene({ t: 'SAVUNMA UZAKLAŞTIRDI', s: `${short(df.n)} havada önce davrandı`, c: '#d8e2dc' }, 0); } }
    s.ball.owner = to; attach(); s.combo++; s.lastPasser = r.car;
    const d = r.L, rate = d < 15 ? 0 : d < 22 ? 1 : d < 30 ? 2 : 3;
    if (me) { M.my.ok += 1 + (rate > 1 ? 1 : 0); M.my.pas = (M.my.pas || 0) + 1; }
    s.distL = { d, t: s.t }; flash(`${rate >= 2 ? EMO.star + ' ' : ''}${['PAS', 'İYİ PAS', 'HARİKA PAS', 'MUHTEŞEM PAS'][rate]}${s.combo > 2 ? ` ${EMO.fire}x${s.combo}` : ''}`);
    s.car = to; return nextDraw();
  }
  /* şut */
  const res = r.res, shooter = r.car, B = s.ball; s.phase = 'anim';
  if (res.goal) {
    s.net = s.t; s.shake = s.t; confetti(); flash(EMO.goal + ' GOL!'); { const a = r.P[r.P.length - 2] || r.P[0], e = r.P[r.P.length - 1], L = Math.hypot(e.x - a.x, e.y - a.y) || 1; s.free = { vx: (e.x - a.x) / L * 9, vy: Math.max(6, (e.y - a.y) / L * 12), vz: 0, net: 1 }; }
    if (me) return scoreMe(s.head ? 'Kafayla!' : s.type === 'pen' ? 'Penaltı golü' : s.type === 'fk' ? 'Serbest vuruştan!' : Math.abs(pCurl(r.P)) > .12 ? 'Falsoyla köşeye!' : r.L > 22 ? 'Uzaktan füze!' : 'Ağlarla buluştu');
    M.sc[0]++; const ast = s.lastPasser === s.me; if (ast) M.my.a++; else if (s.combo > 1) M.my.ok++;
    M.feed.unshift({ m: s.min, t: `⚽ GOL! ${short(shooter.n)}${ast ? ' — asist senden' : ''}`, k: 'good' });
    return endScene({ t: 'GOL!', s: ast ? `Asist: ${g.name}` : `${short(shooter.n)} bitirdi`, c: '#e8c468' }, 1);
  }
  if (res.save) { if (me) M.my.ok++; flash(EMO.save + ' KURTARIŞ'); s.ball.owner = res.held ? s.gk : null; if (!res.held) s.free = { vx: (B.x < 34 ? -1 : 1) * rf(3, 8), vy: -rf(4, 8), vz: rf(2, 5) }; else { B.x = s.gk.x; B.y = s.gk.y - .3; B.z = .8; } return endScene({ t: res.held ? 'KALECİ YAKALADI' : 'KALECİ ÇELDİ', s: me ? 'İyi şuttu ama kaleci yerindeydi' : `${short(shooter.n)} şutunu kaleci çıkardı`, c: '#d8e2dc' }, 0); }
  if (me) M.my.bad++;
  if (res.post) { flash(EMO.post + ' DİREK'); s.shake = s.t; s.free = { vx: (B.x < 34 ? 1 : -1) * rf(1, 4), vy: -rf(7, 11), vz: rf(.5, 2) }; return endScene({ t: 'DİREK!', s: 'Top direkten döndü', c: '#d8e2dc' }, 0); }
  flash(res.over ? '😩 ÜSTTEN' : '😩 AUT'); { const a = r.P[r.P.length - 2] || r.P[0], e = r.P[r.P.length - 1], L = Math.hypot(e.x - a.x, e.y - a.y) || 1; s.free = { vx: (e.x - a.x) / L * 12, vy: (e.y - a.y) / L * 12, vz: res.over ? 2 : 0 }; }
  return endScene({ t: res.over ? 'ÜSTTEN AUT' : 'AUT', s: res.over ? 'Top üst direğin üzerinden gitti' : 'Hedefi tutturamadın', c: '#d8e2dc' }, 0);
}
/* her hamleden sonra: savunma kayar, arkadaşlar koşar, sıra yine sende */
function nextDraw() {
  const s = S, car = s.car; s.dead = 0;
  if (s.n >= s.maxN) return endScene({ t: 'POZİSYON SÖNDÜ', s: 'Savunma yerleşti', c: '#d8e2dc' }, 0);
  const ops = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP).sort((a, b) => dist(a, car) - dist(b, car));
  const ga = Math.atan2(34 - car.x, GY - car.y), side = Math.random() < .5 ? -1 : 1;
  ops.forEach((p, i) => { p.down = 0; let tx, ty;
    if (i === 0) { tx = car.x + Math.sin(ga) * 2.1; ty = car.y + Math.cos(ga) * 2.1; }
    else if (i === 1) { tx = car.x + Math.sin(ga + side * .5) * 5.5; ty = car.y + Math.cos(ga + side * .5) * 5.5; }
    else { tx = p.x + (car.x - p.x) * .35; ty = Math.max(p.y, car.y + 6) - rf(0, 1.5); }
    anim(p, cl(tx + rf(-.6, .6), 3, 65), Math.min(103, ty), .45); });
  s.P.forEach(p => { if (p.side === 'us' && p !== car && !p.gk) { const fx = cl(p.x + (p.x < car.x ? -1 : 1) * rf(0, 3), 5, 63), fy = Math.min(98, p.y + rf(4, 10)); anim(p, fx, fy, .45); } });
  s.wall && s.wall.forEach(w => w.wallP = 0);
  s.phase = 'anim'; then(() => { s.phase = 'draw'; s.hint = drawHint(); gkPlace(); drawUIControls(); }); drawUIControls();
}
/* orta: top kafana gelir, sonra yol çizersin */
function crossTick(dt) {
  const s = S, c = s.ci; c.t += dt; const u = Math.min(1, c.t / c.d), B = s.ball, me = s.me;
  B.x = c.from.x + (me.x - c.from.x) * u; B.y = c.from.y + (me.y + .3 - c.from.y) * u; B.z = Math.sin(u * Math.PI) * 5 + u * 1.6;
  if (u >= 1) { s.phase = 'draw'; s.head = 1; s.car = me; s.ball.owner = me; attach(); B.z = 1.8; s.hint = '🎯 Kafa! Çubuğu kaleye ya da bir arkadaşına doğru çek.'; flash('🎯 KAFA!'); drawUIControls(); }
}
/* ---------- görsel efektler ---------- */
function confetti() { const s = S, cols = ['#ffe34d', '#ff6b5b', '#56c98d', '#7fb2ff', '#ffffff']; for (let i = 0; i < 70; i++) s.parts.push({ x: CV.W / 2 + rf(-40, 40), y: CV.H * .35, vx: rf(-160, 160), vy: rf(-260, -60), c: P(cols), l: rf(1.2, 2.2), r: rf(0, 6) }); }
function partsTick(dt) { const s = S; if (!s.parts) return; s.parts.forEach(p => { p.vy += 380 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; p.r += dt * 8; }); s.parts = s.parts.filter(p => p.l > 0); }
function drawParts(x) { (S.parts || []).forEach(p => { x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = Math.min(1, p.l); x.fillRect(-3, -1.5, 6, 3); x.restore(); }); }

/* ---------- döngü (eski step'i ezer) ---------- */
function step(dt) {
  if (!S) return; S.t += dt; partsTick(dt); freeTick(dt);
  if (S.phase === 'tap') return tapTick(dt);
  if (S.phase === 'icpt') { S.at += dt; return icptTick(dt); }
  if (S.phase === 'run') return runTick(dt);
  if (S.phase === 'crossIn') { S.at += dt; return crossTick(dt); }
  if (S.phase === 'meter' && S.at - S.meter.t0 > 4.5) { fireTackle(); return; }
  if (S.phase === 'meter' || S.phase === 'anim' || S.anims.length) runAnims(dt); else S.at += dt;
}
function camWant() {
  const s = S, B = s.ball, sc = CV.W / NSS_W, halfH = CV.H / 2 / sc, halfW = NSS_W / 2;
  const ref = s.phase === 'run' || s.phase === 'icpt' || s.phase === 'crossIn' ? B : (s.car || s.me), near = toGoal(ref) < 42 || s.mode !== 'atk';
  let cy = near ? Math.max(ref.y + halfH * .4, Math.min(ref.y + halfH * .72, 108 - halfH)) : ref.y + halfH * .35;
  cy = cl(cy, halfH - 6, 109 - halfH);
  return { x: cl(ref.x * .7 + 34 * .3, halfW - 4, 72 - halfW), ty: cy, dist: sc };
}

/* ---------- girdi (eski bindInput'u ezer) ---------- */
function bindInput(cv) {
  const pos = ev => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  cv.onpointerdown = ev => { if (!S) return; ev.preventDefault(); const [px, py] = pos(ev);
    if (S.phase === 'icpt') { S.icDrag = 1; return icptAim(px, py); }
    if (S.phase === 'meter') return fireTackle();
    if (S.phase === 'tap') return tapBall(px, py);
    if (S.phase === 'draw') { try { cv.setPointerCapture(ev.pointerId); } catch (e) { } v5Down(px, py); } };
  cv.onpointermove = ev => { if (!S) return; const [px, py] = pos(ev); if (S.icDrag && S.phase === 'icpt') return icptAim(px, py); if (S.stick) v5Move(px, py); };
  cv.onpointerup = () => { if (!S) return; S.icDrag = 0; if (S.stick) v5Up(); };
  cv.onpointercancel = () => { if (S) { S.stick = null; S.icDrag = 0; } };
}

/* ---------- çizim (eski drawScene'i ezer) ---------- */
function drawScene() {
  const cv = $('cv'); if (!cv || !S) return; const x = cv.getContext('2d'); if (!x) return;
  const W = CV.W, H = CV.H, s = S; x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0); camBasis();
  const sh = s.shake != null && s.t - s.shake < .45 ? (1 - (s.t - s.shake) / .45) * 6 : 0; if (sh) x.translate(rf(-sh, sh), rf(-sh, sh));
  const pt = typeof acct === 'function' ? acct().pitch : 'klasik';
  drawPitch(x, W, H);
  if (!s.flashed) { s.flashed = 1; flash((FLASHE[s.type] || '') + ' ' + (FLASHT[s.type] || 'SIRA SENDE')); }
  /* uygun arkadaşlar: hafif yeşil halka */
  const tpulse = (Math.sin(performance.now() / 260) + 1) / 2;
  if (s.phase === 'draw') s.P.forEach(p => { if (p.side !== 'us' || p === s.car || p.gk) return; const v = P3(p.x, p.y, 0); x.strokeStyle = `rgba(124,252,138,${.35 + tpulse * .35})`; x.lineWidth = 2; x.beginPath(); x.ellipse(v.X, v.Y, 11 + tpulse * 3, 5 + tpulse, 0, 0, 7); x.stroke(); });
  /* top sahibi: sarı halka + ayak izi */
  if (s.phase === 'draw' && s.car) { const v = P3(s.car.x, s.car.y, 0); x.strokeStyle = '#ffe34d'; x.lineWidth = 3; x.beginPath(); x.ellipse(v.X, v.Y, 15, 6.5, 0, 0, 7); x.stroke(); }
  /* çizilen yol */
  if (s.stick && s.stick.e) drawStick(x, s.stick.e);
  if (s.trail && s.trail.length > 1) s.trail.forEach((q, i) => { const v = P3(q.x, q.y, q.z); x.fillStyle = `rgba(255,255,255,${i / s.trail.length * .5})`; x.beginPath(); x.arc(v.X, v.Y, 2.2, 0, 7); x.fill(); });
  if (s.phase === 'icpt' && s.ic) { const ic = s.ic; x.strokeStyle = ic.go ? 'rgba(255,107,91,.25)' : 'rgba(255,107,91,.8)'; x.lineWidth = 3; x.setLineDash([8, 7]); const a = P3(ic.from.x, ic.from.y, 0), b = P3(ic.to.x, ic.to.y, 0); x.beginPath(); x.moveTo(a.X, a.Y); x.lineTo(b.X, b.Y); x.stroke(); x.setLineDash([]); if (ic.mt) { const v = P3(ic.mt.x, ic.mt.y, 0); x.strokeStyle = '#ffe34d'; x.lineWidth = 2; x.beginPath(); x.ellipse(v.X, v.Y, 12, 5, 0, 0, 7); x.stroke(); x.font = '14px sans-serif'; x.textAlign = 'center'; x.fillText('🏃', v.X, v.Y - 8); x.textAlign = 'left'; }
    /* önerilen kesme noktası: pas yolunda sana en yakın yer */
    const ib = icBest(), hp = P3(ib.x, ib.y, 0), pu = (Math.sin(performance.now() / 200) + 1) / 2;
    if (!ic.mt) { x.strokeStyle = `rgba(124,252,138,${.5 + pu * .4})`; x.lineWidth = 3; x.beginPath(); x.ellipse(hp.X, hp.Y, 14 + pu * 4, 6 + pu * 2, 0, 0, 7); x.stroke(); x.font = '700 11px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(T('BURAYA KOŞ'), hp.X, hp.Y - 14); x.textAlign = 'left'; }
    if (!ic.go) { const left = Math.max(0, ic.wait - ic.t); x.font = '800 30px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(left > 0 ? '⏳ ' + Math.ceil(left * 2) : '', W / 2, H * .2); x.textAlign = 'left'; } }
  const ents = s.P.map(p => ({ p, y: p.y })); ents.push({ ball: 1, y: s.ball.y - .01 }); ents.push({ goal: 1, y: GY + .5 });
  ents.sort((a, b) => b.y - a.y).forEach(e => e.ball ? drawBall(x) : e.goal ? drawGoal(x, 1) : drawPl(x, e.p));
  /* üst bilgi: hamle sayısı, kombo, rüzgâr */
  x.font = '700 12px "Barlow Condensed",sans-serif'; x.textBaseline = 'top';
  if (s.mode === 'atk' && s.phase !== 'done') { const tag = `${EMO.boot} ${s.n}/${s.maxN || V5.maxN}${s.combo > 1 ? `  ${EMO.fire} ${s.combo}` : ''}`; const tw = x.measureText(tag).width + 14; x.fillStyle = 'rgba(0,0,0,.45)'; rr(x, 8, 8, tw, 20, 10); x.fill(); x.fillStyle = '#fff'; x.fillText(tag, 15, 12); }
  if (s.mode === 'atk' && Math.abs(s.wind || 0) > .05 && s.phase !== 'done') { const tag = `🌬️ ${s.wind < 0 ? '←' : '→'} ${Math.abs(s.wind * 10).toFixed(0)}`; x.textAlign = 'right'; x.fillStyle = 'rgba(0,0,0,.45)'; const tw = x.measureText(tag).width + 14; rr(x, W - 8 - tw, 8, tw, 20, 10); x.fill(); x.fillStyle = '#fff'; x.fillText(tag, W - 15, 12); x.textAlign = 'left'; }
  if (s.phase === 'draw' && !s.stick && s.n === 0) { const v = P3(s.car.x, s.car.y, 0), a = (performance.now() / 700) % 1; x.globalAlpha = 1 - a; x.font = '22px sans-serif'; x.textAlign = 'center'; x.fillText('👆', v.X + 14, v.Y - 30 - a * 26); x.globalAlpha = 1; x.textAlign = 'left'; }
  if (pt === 'gece') { const gr2 = x.createRadialGradient(W / 2, H * .45, 40, W / 2, H * .45, W); gr2.addColorStop(0, 'rgba(255,250,220,.04)'); gr2.addColorStop(1, 'rgba(0,0,10,.4)'); x.fillStyle = gr2; x.fillRect(0, 0, W, H); }
  weatherFx(x, W, H); drawDist(x, W, H); drawFlash(x, W, H); drawParts(x);
  if (s.phase === 'meter') drawMeter(x, W, H);
  if (s.phase === 'tap') { drawTap(x, W, H); drawFlash(x, W, H); }
  if (s.banner && !s.flash) { const cy = H * .42; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,.5)'; rr(x, 20, cy - 34, W - 40, 72, 14); x.fill(); x.fillStyle = s.banner.c === '#e8c468' ? '#ffe34d' : '#fff'; x.font = `800 ${Math.round(W * .085)}px "Barlow Condensed",sans-serif`; x.fillText(T(s.banner.t), W / 2, cy - 8); if (s.banner.s) { x.fillStyle = '#e6eee9'; x.font = '500 13px "Barlow",sans-serif'; x.fillText(T(s.banner.s), W / 2, cy + 22); } x.textAlign = 'left'; }
}
const FLASHE = { def: '🛡️', build: '🎯', drib: '💨', atk: '⚡', one: '🔥', kontra: '⚡', head: '🎯', fk: '🎯', pen: '🥅' };
/* nişan çubuğu: oyuncudan uzanan kalın çubuk; uzunluk = güç */
function drawStick(x, e) {
  const s = S, c = P3(s.car.x, s.car.y, 0), t = P3(e.tip.x, e.tip.y, 0), pw = e.pw || 1;
  const col = e.k === 'none' ? 'rgba(255,255,255,.55)' : pw < .72 ? '#7fb2ff' : pw > 1.55 ? '#ff6b5b' : e.k === 'shot' ? '#ffe34d' : e.k === 'drib' ? '#ffffff' : '#7cfc8a';
  const ang = Math.atan2(t.Y - c.Y, t.X - c.X), L = Math.hypot(t.X - c.X, t.Y - c.Y);
  x.save(); x.translate(c.X, c.Y); x.rotate(ang);
  const gr = x.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(255,255,255,.15)'); gr.addColorStop(1, col);
  x.fillStyle = gr; rr(x, 6, -4, Math.max(4, L - 14), 8, 4); x.fill();
  x.fillStyle = col; x.beginPath(); x.moveTo(L + 4, 0); x.lineTo(L - 12, -9); x.lineTo(L - 12, 9); x.closePath(); x.fill();
  x.restore();
  (e.dang || []).forEach(d => { if (d.p < .35) return; const q = P3(d.d.x, d.d.y, 0); x.strokeStyle = '#ff4b3a'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(q.X, q.Y, 13, 5.5, 0, 0, 7); x.stroke(); x.font = '13px sans-serif'; x.textAlign = 'center'; x.fillText('⚠️', q.X, q.Y - 18); x.textAlign = 'left'; });
  if (e.k === 'pass' && e.to) { const q = P3(e.to.x, e.to.y, 0); x.strokeStyle = '#7cfc8a'; x.lineWidth = 3; x.beginPath(); x.ellipse(q.X, q.Y, 16, 7, 0, 0, 7); x.stroke(); }
  if (e.k === 'shot') { const q = P3(e.aim != null ? e.aim : e.P[1].x, GY, 1); x.font = '18px sans-serif'; x.textAlign = 'center'; x.fillText('🎯', q.X, q.Y); x.textAlign = 'left'; }
  const lbl = e.k === 'shot' ? `⚽ ${T('ŞUT')} · ${T('GÜÇ')} ${Math.round(Math.min(pw, 2) * 50)}` : e.k === 'pass' ? `👟 ${T('PAS')} · ${pw < .72 ? T('kısa kalır') : pw > 1.55 ? T('çok sert') : T('iyi')}` : e.k === 'drib' ? `💨 ${T('SÜR')}` : T('hedef yok');
  x.font = '700 12px "Barlow Condensed",sans-serif'; const w = x.measureText(lbl).width + 14; x.fillStyle = 'rgba(0,0,0,.6)'; rr(x, t.X - w / 2, t.Y - 34, w, 20, 10); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lbl, t.X, t.Y - 24); x.textAlign = 'left';
}
function drawPath(x, P, ev) {
  const red = new Set((ev && ev.dang || []).filter(d => d.p > .35).map(d => Math.round(d.u * 40)));
  const k = ev ? ev.k : 'drib', col = k === 'shot' ? '#ffe34d' : k === 'pass' ? '#7cfc8a' : k === 'none' ? 'rgba(255,255,255,.5)' : '#ffffff';
  const L = plen(P); let acc = 0; x.lineWidth = 5; x.lineCap = 'round';
  for (let i = 1; i < P.length; i++) { const a = P3(P[i - 1].x, P[i - 1].y, 0), b = P3(P[i].x, P[i].y, 0), dl = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y), u = (acc + dl / 2) / (L || 1); acc += dl;
    const bad = [...red].some(r => Math.abs(r - u * 40) <= 2); x.strokeStyle = bad ? '#ff4b3a' : col; x.globalAlpha = .9; x.beginPath(); x.moveTo(a.X, a.Y); x.lineTo(b.X, b.Y); x.stroke(); }
  x.globalAlpha = 1; x.lineCap = 'butt';
  const e = P[P.length - 1], v = P3(e.x, e.y, 0); x.font = '18px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(k === 'shot' ? '🎯' : k === 'pass' ? '👟' : k === 'drib' ? '💨' : '🚫', v.X, v.Y - 14); x.textAlign = 'left';
  (ev && ev.dang || []).forEach(d => { if (d.p < .35) return; const q = P3(d.d.x, d.d.y, 0); x.strokeStyle = '#ff4b3a'; x.lineWidth = 2; x.beginPath(); x.ellipse(q.X, q.Y, 12, 5, 0, 0, 7); x.stroke(); });
  if (ev && ev.k === 'drib' && ev.len > V5.maxDrib) { x.fillStyle = '#fff'; x.font = '600 11px "Barlow",sans-serif'; x.fillText(T('çok uzun: sürüş kısalır'), v.X + 10, v.Y + 12); }
}

/* ---------- alt panel (eski ctlHTML'i ezer) ---------- */
function ctlHTML() {
  if (!S) return ''; const s = S; let h = '';
  if (s.phase !== 'done') h += `<div class="hint">${esc(s.msg || s.hint || '')}</div>`;
  if (s.phase === 'draw') h += `<div class="v5leg"><span>👟 arkadaşa çek = pas</span><span>🎯 kaleye çek = şut</span><span>💨 kısa çek = sür</span><span>📏 uzun = sert</span><span>⚠️ = kesilir</span></div><button class="btn ghost sm" onclick="autoMove()">⚡ Otomatik hamle</button>`;
  else if (s.phase === 'meter') h += `<button class="btn big" onclick="fireTackle()">MÜDAHALE!</button>`;
  else if (s.phase === 'done') h += `<button class="btn big" onclick="sceneContinue()">Devam ▶</button>${!s.good && s.mode === 'atk' && !M.adRetry ? `<button class="btn ghost" onclick="adRetry()">📺 Reklam izle, pozisyonu tekrar oyna</button>` : ''}`;
  return h;
}
/* tek dokunuşla akıllı hamle (yardım; test botu da bunu kullanır) */
function bestPath(smart) {
  const s = S, car = s.car, cands = [], ok = d => d.reduce((m, q) => m * (1 - q.p), 1), D = toGoal(car), head = s.head || s.type === 'pen';
  if (D < 32 || head) [GOAL_L + .9, GOAL_R - .9, 34].forEach(gx => { const P = [{ x: car.x, y: car.y }, { x: gx, y: GY + .4 }]; cands.push({ P, v: ok(pDanger(P, 'shot')) * cl(1 - D * .03, .06, .92) * (gx === 34 ? .55 : 1) * 1.25 }); });
  if (s.type !== 'pen') s.P.forEach(p => { if (p.side !== 'us' || p === car || p.gk) return; if (typeof isOff === 'function' && isOff(p, s.ball.y)) return; const P = [{ x: car.x, y: car.y }, { x: p.x, y: p.y }], L = plen(P); if (L > V5.maxPass || L < 4) return; const prog = cl((p.y - car.y) / 30, -.25, .55); cands.push({ P, v: ok(pDanger(P, 'pass')) * (.3 + prog + (toGoal(p) < 22 ? .3 : 0)) }); });
  if (!head && !(s.type === 'fk' && s.n === 0)) [-.6, 0, .6].forEach(a => { const ang = Math.atan2(34 - car.x, GY - car.y) * .5 + a, P = [{ x: car.x, y: car.y }, { x: cl(car.x + Math.sin(ang) * 8, 3, 65), y: Math.min(101, car.y + Math.cos(ang) * 8) }]; cands.push({ P, v: ok(pDanger(P, 'drib')) * (.2 + Math.max(0, P[1].y - car.y) / 40) }); });
  if (!cands.length) return null; cands.forEach(c => c.v += smart ? 0 : Math.random() * .4); cands.sort((a, b) => b.v - a.v); return cands[0].P;
}
function autoMove() { if (!S || S.phase !== 'draw') return; const P = bestPath(1); if (P) doPath(P); }
function botMove() {
  if (!S) return; const s = S, smart = typeof BOTSMART !== 'undefined' && BOTSMART;
  if (s.phase === 'draw') { const P = bestPath(smart); if (!P) return endScene({ t: 'POZİSYON BİTTİ', s: '', c: '#d8e2dc' }, 0); return doPath(P); }
  if (s.phase === 'icpt') { const ic = s.ic; if (!ic.mt) { const ib = icBest(); ic.mt = { x: ib.x + gauss() * (smart ? 1 : 2.2), y: ib.y + gauss() * (smart ? 1 : 2.2) }; } return step(.05); }
  if (s.phase === 'tap') { if (!s.tp.hit) { const b = tpBall(s.t), R = tpR(); tapBall(b.x + gauss() * R * (smart ? .35 : .7), b.y + gauss() * R * (smart ? .35 : .7)); } s.t += .5; return tapTick(.05); }
  if (s.phase === 'meter') { s.at = s.meter.t0 + Math.random() * 3; return fireTackle(); }
  return step(.05);
}

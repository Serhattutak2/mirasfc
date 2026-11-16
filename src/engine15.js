/* ============================================================
   MİRAS FC — MAÇ MOTORU v15 (v4.5) · "Gerçek şut fiziği"
   Test oyuncularından: uzaktan şutlar fazla gol oluyordu, top çok sık
   direğe çarpıyordu ve top kaleye düz çizgide gidiyordu.
   - Şut artık fiziksel: topun hızı (vuruş kalitesi, güç, şut yeteneği),
     açısal sapma (mesafe arttıkça kale ağzında daha çok sapar), yükseklik.
   - Kaleci gerçek tepki süresi + plonjon hızıyla kurtarır: yakından
     köşeye vurulan şut çoğu kez gol, kalecinin üstüne vurulan şut
     kurtarılır; uzaktan şutu kaleci görür ve yetişir (gol nadir,
     ama sert, köşeye, falsolu ya da önü kapalıysa girebilir).
   - Direk/üst direk yalnızca top gerçekten direğe değerse: topun
     yarıçapı + direk kalınlığı. Direğin iç yarısına çarpan top içeri
     girebilir, dış yarısına çarpan dışarı seker (yansıma fiziği).
   - Top havada gerçek bir yay çizer: uzaktan şut yükselip düşer,
     yerden şut yerde gider, üstten aut gerçekten üstten gider.
   ============================================================ */
const PHY15 = { R: .11, postR: .06, bar: 2.44, react: .24, acc: 16, cap: 2.05, arm: 1.0, err: .03, aimPull: .9, sig: .047, k: .28 };
let LAST_SHOT15 = null;
shotResult = function (P, run) {
  const s = S, car = s.car, me = car === s.me, pen = s.type === 'pen', fk = s.type === 'fk', head = !!s.head;
  const p0 = P[0], D = Math.max(1, Math.hypot(GY - p0.y, 34 - p0.x));
  const sk = me ? st('sut') + (hasPerk('bitirici') && D < 18 ? 6 : 0) + (hasPerk('uzak') && D > 20 ? 7 : 0) + (fk && hasPerk('falso') ? 8 : 0) + (pen && hasPerk('soguk') ? 8 : 0) + (head ? ((st('fiz') - st('sut')) / 2 + (hasPerk('hava') ? 7 : 0)) : 0) : car.r;
  const q = run.q == null ? .6 : cl(run.q, 0, 1), pw = run.pw || 1, oy = run.oy || 0, curl = Math.abs(pCurl(P));
  const fpw = cl(.7 + pw * .3, .75, 1.3);
  const press = s.P.some(d => d.side === 'th' && !d.gk && Math.hypot(d.x - car.x, d.y - car.y) < 2.2);
  const md = typeof mood === 'function' ? cl(1 - mood() * 2, .7, 1.3) : 1, acc = (s.W0 && s.W0.acc) || 1;
  /* topun hızı (m/s) */
  let v = head ? 9 + q * 3.5 + ((me ? st('fiz') : car.r) - 70) * .05 : pen ? 19 + q * 6 : (15.5 + q * 7.5 + (sk - 70) * .08) * fpw;
  v = cl(v, 8, 34);
  /* nişan: parmağın gösterdiği nokta, biraz içe (insan gözü gibi) */
  const aim0 = P[P.length - 1].x, aimX = cl(34 + (aim0 - 34) * (pen ? .86 : head ? .78 : PHY15.aimPull), GOAL_L - 2.5, GOAL_R + 2.5);
  let aimZ = head ? 1.0 : oy > .3 ? cl(1.55 + (oy - .3) * 1.4, 1.5, 2.2) : oy < -.3 ? .22 : .75;
  if (fk) aimZ = Math.max(aimZ, 1.55);
  if (!head && !pen) aimZ += Math.max(0, D - 16) * .03;
  /* açısal sapma (radyan): kalite, yetenek, baskı, falso, aşırı güç, kafa */
  const sth = PHY15.sig * (1.35 - .7 * q) * (1 + (72 - sk) / 60) * (head ? 2.1 : 1) * (press ? 1.3 : 1) * (1 + curl * 1.1) * (1 + Math.max(0, fpw - 1.05) * 1.6) * Math.pow(s.df || 1, .4) * md / acc * (pen ? .85 : 1);
  const ground = !head && oy < -.3, x = aimX + gauss() * sth * D, z = ground ? cl(aimZ + Math.abs(gauss()) * sth * .3 * D, .05, .55) : Math.max(.05, aimZ + gauss() * sth * 1.15 * D + Math.max(0, fpw - 1.1) * D * .045);
  const k = s.gk, kr = k ? k.r : 70, kx = k ? k.x : 34, ky = k ? k.y : 104.3;
  const out = { x, z, gx: kx, v, goal: false, save: false, held: false, wide: false, post: false, over: false, bar: false, postIn: false };
  const R = PHY15.R + PHY15.postR;
  /* aşırtma: kaleci önde, top havadan */
  const kout = 105 - ky;
  if (!pen && !head && k && oy > .4 && kout > 2.6 && D < 24) {
    out.chip = 1;
    const overP = cl((oy - .4) * .5 + Math.max(0, pw - 1.25) * .6 - (kout - 2) * .05 + (70 - sk) / 200, .03, .6);
    if (Math.random() < overP) { out.over = true; out.z = 2.9; return out; }
    if (x < GOAL_L - R || x > GOAL_R + R) { out.wide = true; return out; }
    out.z = Math.min(z, 2.2);
    if (Math.random() < cl(.5 - (kout - 2.6) * .12 - q * .25 + (kr - 70) / 150, .08, .6)) { out.save = true; out.held = Math.random() < .5; out.gx = cl(x, kx - 2, kx + 2); }
    else { out.goal = true; out.gx = kx + (x - kx) * .4; }
    return out;
  }
  /* çerçeve: üstten, direk, üst direk, aut */
  if (z > PHY15.bar + R) { out.over = true; return out; }
  const nearPost = Math.abs(x - GOAL_L) < Math.abs(x - GOAL_R) ? GOAL_L : GOAL_R, dp = Math.abs(x - nearPost);
  if (dp < R && z < PHY15.bar + PHY15.postR && (dp < PHY15.postR + .03 || Math.random() < .15)) {
    const inside = nearPost === GOAL_L ? x > nearPost : x < nearPost;
    out.postX = nearPost; out.postOff = (x - nearPost) / R;
    if (inside && Math.random() < .6) out.postIn = true; else { out.post = true; return out; }
  } else if (x < GOAL_L || x > GOAL_R) { out.wide = true; return out; }
  else if (z > PHY15.bar - R && (Math.abs(z - PHY15.bar) < PHY15.postR + .03 || Math.random() < .15)) {
    out.bar = true; if (z > PHY15.bar || Math.random() < .45) { out.post = true; return out; }
    out.postIn = true;
  }
  /* kaleci: topun kaleci hizasından geçtiği nokta, tepki süresi, plonjon */
  if (!k) { out.goal = true; return out; }
  const f = cl((ky - p0.y) / ((105 - p0.y) || 1), 0, 1), xb = p0.x + (x - p0.x) * f, zb = z * (.55 + .45 * f), dx = Math.abs(xb - kx);
  const dk = Math.hypot(xb - p0.x, ky - p0.y), Tk = dk / v;
  /* önü kapalı mı (araya giren oyuncu kalecinin görüşünü keser) */
  const screen = s.P.some(d => d !== car && !d.gk && d.y > p0.y + 1.5 && d.y < ky - 1 && Math.abs(d.x - (p0.x + (x - p0.x) * ((d.y - p0.y) / ((105 - p0.y) || 1)))) < 1.1);
  let tr = PHY15.react - (kr - 70) * .003 + (screen ? .09 : 0) + curl * .5 + (head ? -.04 : 0);
  if (pen) { /* penaltıda kaleci önceden bir tarafa atlar */
    const r = Math.random(), guess = r < .4 ? -1 : r < .8 ? 1 : 0, side = Math.abs(x - 34) < 1.1 ? 0 : Math.sign(x - 34);
    tr = guess === side ? 0 : guess === 0 ? .24 : .6;
  }
  const td = Math.max(0, Tk - tr), dive = Math.min(PHY15.cap + Math.max(0, td - .55) * 1.6, .5 * PHY15.acc * td * td); /* çok vakit varsa adım atıp uçar */ /* plonjon ivmeyle hızlanır */
  let reach = PHY15.arm + dive + (kr - 70) * .012;
  if (zb > 1.85) reach *= .8; else if (zb < .35 && dx > 1.2) reach *= .9;
  const margin = reach - dx;
  let pS = 1 / (1 + Math.exp(-margin / PHY15.k));
  pS *= 1 - (PHY15.err + Math.max(0, 70 - kr) / 600 + Math.max(0, v - 27) * .01); /* kaleci hatası, çok sert top */
  if (out.postIn) pS *= .35;
  if (Math.random() < pS) {
    out.save = true; out.bar = false; out.postIn = false;
    out.held = margin > .9 && v < 25 && Math.random() < .65;
    out.gx = kx + Math.sign(xb - kx) * Math.min(dx, reach); out.x = x; out.zb = zb;
  } else {
    out.goal = true; out.gx = kx + Math.sign(xb - kx) * Math.max(0, Math.min(reach, dx - .35));
  }
  out.reb = out.save && !out.held ? 1 : 0;
  return out;
};
/* şutu canlandır: yol kale çizgisinde sonucun gerçek noktasına gider, hız fiziksel.
   (yol burada, kalecinin kurtarış kesmesinden ÖNCE düzeltilir) */
{
  const _sr15 = shotResult;
  shotResult = function (P, run) {
    const res = _sr15(P, run);
    try {
      const n = P.length, e = P[n - 1], a = P[0], ty = 105.2;
      if (n >= 2 && res.x != null) {
        const dxs = res.x - e.x; for (let i = 0; i < n; i++) P[i] = { x: P[i].x + dxs * (i / (n - 1)), y: P[i].y };
        const L1 = P[n - 1], L0 = P[n - 2];
        if (Math.abs(L1.y - ty) > .05 && Math.abs(L1.y - L0.y) > .01) { const k = (ty - L0.y) / (L1.y - L0.y); P[n - 1] = { x: L0.x + (L1.x - L0.x) * k, y: ty }; }
        if (res.over || res.wide) { const A = P[n - 1], B0 = P[n - 2], ux = A.x - B0.x, uy = A.y - B0.y, l = Math.hypot(ux, uy) || 1; P.push({ x: A.x + ux / l * 2.2, y: A.y + uy / l * 2.2 }); }
        run.L = plen(P); run.v = cl(res.v * 1.05, 12, 32); run.z0 = .11;
        run.arc = (run.oy || 0) < -.3 || S.head ? .05 : cl(Math.hypot(GY - a.y, 34 - a.x) * .04, .2, 1.4) * (res.v > 26 ? .7 : 1);
      }
      LAST_SHOT15 = res;
    } catch (e) { }
    return res;
  };
  /* top yüksekliği: kalkış, yay, kale çizgisindeki yükseklik */
  const _rt15 = runTick;
  runTick = function (dt) {
    const s = S, r = s && s.run; _rt15(dt);
    if (!S || S.run !== r || !r || r.k !== 'shot' || !r.res || r.res.z == null || r.z0 == null || S.phase !== 'run') return;
    const T = r.L / r.v * 1.05, tt = Math.min(1, r.t / T), zEnd = r.gkSave && r.res.zb != null ? r.res.zb : r.res.z;
    S.ball.z = Math.max(0, r.z0 + (zEnd - r.z0) * tt + r.arc * Math.sin(tt * Math.PI));
  };
  /* direk / üst direk: gerçek yansıma; direkten içeri yazısı */
  const _pd15 = pathDone;
  pathDone = function (r) {
    const s = S, res = r && r.k === 'shot' ? r.res : null, o = _pd15.apply(this, arguments);
    try {
      if (res && res.post && s.free) {
        const n = r.P.length, a = r.P[n - 2] || r.P[0], e = r.P[n - 1], l = Math.hypot(e.x - a.x, e.y - a.y) || 1, ux = (e.x - a.x) / l, uy = (e.y - a.y) / l, sp = res.v * .55;
        if (res.bar) { s.free.vx = ux * sp * .5; s.free.vy = -Math.abs(uy) * sp * .7; s.free.vz = rf(1, 3.5); }
        else { const nx = cl(res.postOff || 0, -1, 1), ny = -Math.sqrt(Math.max(0, 1 - nx * nx)), dot = ux * nx + uy * ny, rx = ux - 2 * dot * nx, ry = uy - 2 * dot * ny; s.free.vx = rx * sp; s.free.vy = ry * sp; s.free.vz = rf(.3, 1.6); }
      }
      if (res && res.goal && (res.postIn)) { flash('🥅 ' + (res.bar ? 'ÜST DİREKTEN İÇERİ!' : 'DİREKTEN İÇERİ!')); s.shake = s.t; }
    } catch (e) { }
    return o;
  };
}
/* kaleci yerleşimi (gerçekçi): topla kale ortası arasındaki çizgide durur, yakın
   direğe hafif kayar; uzaktan şutta çizgiden yalnız 1–2 m çıkar, bire birde öne atılır. */
gkIdeal = function () {
  const s = S, k = s && s.gk; if (!k || s.mode !== 'atk') return null;
  const bx = s.ball.x, by = s.ball.y, D = Math.max(1, Math.hypot(34 - bx, 105 - by));
  const cover = s.P.some(d => d.side === 'th' && !d.gk && d.y > by + .5 && Math.abs(d.x - bx) < 6);
  let out = cl(1.1 + (28 - D) * .06, 1, 2.3);
  if (D < 14 && by > 88 && !cover) out = cl((14 - D) * .28 + 2.2, 2.2, 4);
  out = Math.min(out, Math.max(.8, D - 3.6));
  const lat = cl(out / D * 1.1 + .05, .06, .7);
  return { x: cl(34 + (bx - 34) * lat, GOAL_L - .3, GOAL_R + .3), y: cl(104.6 - out, 96, 104.6) };
};

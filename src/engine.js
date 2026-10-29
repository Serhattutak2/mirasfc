/* ============================================================
   MİRAS FC — MAÇ MOTORU v4 ("Gerçek top fiziği")
   New Star Soccer ruhu, daha derin:
   - Top sendeyken oyun DURUR. Parmağını ekranda KAYDIR: yön =
     kaydırma yönü, güç = kaydırma uzunluğu, kavis = kaydırmanın
     eğriliği (falso). "Havadan" açıkken top yükselir (aşırtma,
     orta, baraj üstü). Fazla güç topu kaleden uçurur.
   - Top gerçek fizikle uçar: yerçekimi, hava direnci, Magnus
     etkisi (falso), sekme, yuvarlanma, direk ve üst direk, rüzgâr.
   - Rakipler topun yoluna koşar ve keser; kaleci tepki süresi,
     dalış hızı ve erişimiyle gerçekten kurtarmaya çalışır.
     Kaleci çelerse dönen top yeniden oyuna girer.
   - Kafa: orta gerçek yörüngeyle gelir, top başına yaklaşınca
     zaman yavaşlar; o anda kaydır.
   - Dokunarak oynamak isteyenler için yardımlı düğmeler kalır;
     oyuncuya yüzde gösterilmez; riski oyuncu tartar.
   - Rakip ne kadar güçlüyse kaleci o kadar hızlı, savunma o kadar
     sıkı, senin vuruşun o kadar baskı altında.
   Dünya: x 0..68, y 0..105 (hücum +y, kale y=105), z yükseklik (m)
   ============================================================ */
let M = null, S = null, RAF = 0;
const GOAL_L = 30.34, GOAL_R = 37.66, GCX = 34, GY = 105;
const NTCOL = { 'Türkiye': ['#e30a17', '#ffffff'], 'İngiltere': ['#ffffff', '#1d2a5b'], 'İspanya': ['#c60b1e', '#ffc400'], 'Almanya': ['#ffffff', '#111111'], 'İtalya': ['#1f5bb5', '#ffffff'], 'Fransa': ['#1d2f6f', '#ffffff'], 'Brezilya': ['#ffdf00', '#009c3b'], 'Arjantin': ['#75aadb', '#ffffff'], 'Hollanda': ['#f36c21', '#111111'], 'Portekiz': ['#c8102e', '#046a38'], 'Belçika': ['#c8102e', '#111111'], 'Hırvatistan': ['#ffffff', '#d50032'], 'Uruguay': ['#5cbfeb', '#111111'], 'Yunanistan': ['#0d5eaf', '#ffffff'], 'Sırbistan': ['#c6363c', '#ffffff'], 'Suudi Arabistan': ['#ffffff', '#006c35'], 'Japonya': ['#1d2a6b', '#ffffff'], 'Güney Kore': ['#c60c30', '#111111'], 'ABD': ['#ffffff', '#1d2a5b'], 'Meksika': ['#006847', '#ffffff'], 'Mısır': ['#c8102e', '#ffffff'], 'Fas': ['#c1272d', '#006233'] };
const SKIN = ['#f1c9a5', '#e0ac7e', '#c68642', '#8d5524', '#5c3a21', '#f5d5b8'];
const lum = h => { const n = parseInt((h || '#888').slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114); };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const WXP = { acik: { acc: 1, wind: 0 }, bulut: { acc: 1, wind: .3 }, yagmur: { acc: .9, wind: .4, slip: 1 }, ruzgar: { acc: .88, wind: 1.6 }, kar: { acc: .85, wind: .6, slip: 1 }, sicak: { acc: .95, wind: 0 }, sis: { acc: .93, wind: .2 } };
const hasPerk = k => !!(g && g.perks && g.perks[k]);
const pct = p => Math.round(cl(p, 0, 1) * 100);
const MTITLE = { drib: 'Çalım koşusu', atk: 'Hücum pozisyonu', one: 'Birebir!', build: 'Oyun kurma', kontra: 'Kontra atak!', head: 'Orta geliyor', fk: 'Serbest vuruş', pen: 'Penaltı', def: 'Rakip hücumda' };

/* ---------- Yetenek ve durum ---------- */
function mood() { return (g.form - 6.5) * .025 + (g.mor - 60) / 900 + (g.fit < 45 ? -.06 : 0) + ((g.uyum || 50) - 50) / 900; }
const st = k => (g.st[k] || 50);
function pressure(p) { let d = 9; S.P.forEach(q => { if (q.side !== p.side && !q.gk) d = Math.min(d, dist(q, p)); }); return d; }
function laneGap(a, b, side) { let m = 99; const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1; S.P.forEach(p => { if (p.side !== side || p === a || p === b) return; const t = cl(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2, 0, 1); m = Math.min(m, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t)); }); return m; }
const toGoal = p => Math.hypot(GCX - p.x, GY - p.y);

/* ---------- Sahne kurulumu ---------- */
function mkScene(mo) {
  const t = mo.type, us = M.T.us, th = M.T.th, wx = M.info.wx || 'acik';
  const usSq = us.sq.filter(x => x.p !== 'GK'), thSq = th.sq.filter(x => x.p !== 'GK');
  const gkO = th.sq.find(x => x.p === 'GK') || { n: 'Kaleci', r: 75 }, gkU = us.sq.find(x => x.p === 'GK') || { n: 'Kaleci', r: 75 };
  /* rakip gücü: fark büyüdükçe her şey zorlaşır; rakip temelde bir tık güçlü */
  const diff = (th.s || 70) - (us.s || 70), df = cl((1.12 + diff / 28) * (typeof gsDiff === 'function' ? gsDiff() : 1), .8, 1.6);
  const s = { df, type: t, min: mo.min, mo, P: [], ball: { x: 0, y: 0, z: 0, owner: null }, phase: 'decide', at: 0, anims: [], after: null, cam: { x: 34, y: 70 }, wx, W0: WXP[wx] || WXP.acik, n: 0, msg: '', opts: [], fx: [], t: 0 };
  S = s;
  s.air = false;
  s.wind = (WXP[wx] || WXP.acik).wind * .55 * ((mo.min * 7) % 2 ? 1 : -1);
  const mk = (x, y, side, d, ex) => { const p = { x, y, side, n: d ? (d.real ? alter(d.n) : d.n) : '', r: d ? d.r : 70, num: d && d.num ? d.num : R(2, 30), skin: P(SKIN), c: side === 'us' ? us.c : th.c, ph: Math.random() * 6, ...ex }; s.P.push(p); return p; };
  const pick = (L, i) => L[(i * 7 + mo.min) % Math.max(1, L.length)] || L[0] || { n: '—', r: 70 };
  const meD = { n: g.name, r: ovr(), num: g.num };
  const DF_ = thSq.filter(x => x.p === 'DF'), AT_ = thSq.filter(x => x.p !== 'DF');
  if (t === 'def') {
    const ax = R(16, 52), ay = R(58, 70);
    const car = mk(ax, ay, 'th', pick(AT_, 1), { car: 1 });
    mk(cl(ax + (ax < 34 ? R(13, 19) : -R(13, 19)), 6, 62), ay + R(4, 10), 'th', pick(thSq, 2), { sup: 1 });
    if (Math.random() < .6) mk(cl(68 - ax + R(-6, 6), 8, 60), ay + R(-2, 6), 'th', pick(thSq, 3), { sup: 1 });
    s.me = mk(cl(ax + R(-3, 3), 6, 62), ay + R(5, 7), 'us', meD, { me: 1 });
    mk(cl(34 + (ax - 34) * .4, 10, 58), Math.min(96, ay + R(16, 22)), 'us', pick(usSq.filter(x => x.p === 'DF'), 1), { mate: 1 });
    mk(cl(68 - ax, 10, 58), Math.min(97, ay + R(18, 24)), 'us', pick(usSq.filter(x => x.p === 'DF'), 2), { mate: 1 });
    s.gk = mk(34, 104, 'us', gkU, { gk: 1, c: ['#2a2a2a', '#d4ff4a'] });
    s.mode = 'def'; s.ball.owner = car; s.carrier = car;
    s.hint = 'Rakip pas atacak. Oyuncunu pas yoluna SÜRÜKLE ya da yola dokun; yetişirsen keser.';
    attach(); s.cam = { x: ax, y: ay + 8 }; icptStart(); return s;
  }
  s.mode = 'atk';
  s.gk = mk(34, 104, 'th', gkO, { gk: 1, c: ['#f2f2f2', '#111'] });
  if (t === 'pen') {
    s.me = mk(34, 92.5, 'us', meD, { me: 1 }); Object.assign(s.ball, { x: 34, y: 94 });
    s.hint = 'Penaltı: geri çekip bırak (uzunluk = güç) ya da köşe seç; sonra topa dokun. Topun altına vurursan üstten gidebilir.';
    s.cam = { x: 34, y: 92 }; s.phase = 'aim'; s.shot = { kind: 'pen' }; aimPrev(); return s;
  }
  if (t === 'fk') {
    const bx = R(18, 50), by = R(76, 84); Object.assign(s.ball, { x: bx, y: by });
    s.me = mk(bx - 1 * Math.sign(bx - 34 || 1), by - 1.4, 'us', meD, { me: 1 });
    const ang = Math.atan2(34 - bx, 105 - by); s.wall = [];
    for (let i = 0; i < 4; i++) { const off = (i - 1.5) * .7; s.wall.push(mk(bx + Math.sin(ang) * 9.15 + Math.cos(ang) * off, by + Math.cos(ang) * 9.15 - Math.sin(ang) * off, 'th', pick(thSq, i), { wallP: 1 })); }
    s.gk.x = 34 + (bx < 34 ? 1.2 : -1.2);
    mk(cl(bx + 9, 24, 46), 96, 'us', pick(usSq, 1), { mate: 1 }); mk(cl(bx - 7, 24, 46), 97, 'us', pick(usSq, 2), { mate: 1 });
    mk(cl(bx + 8, 24, 46), 98, 'th', pick(DF_, 5), {}); mk(cl(bx - 6, 24, 46), 99, 'th', pick(DF_, 6), {});
    s.hint = 'Serbest vuruş: geri çekip bırak, sonra topun alt-yanına vur: top barajı aşıp falsoyla kaleye insin. Rüzgârı hesaba kat.';
    s.cam = { x: bx, y: by + 10 }; s.dead = 1; return decideAtk();
  }
  if (t === 'head') {
    const mx = R(29, 39), my = R(94, 98), wing = Math.random() < .5 ? 6 : 62;
    s.me = mk(mx, my, 'us', meD, { me: 1 });
    s.crosser = mk(wing, 88 + R(-3, 3), 'us', pick(usSq, 2), { mate: 1 });
    mk(mx + R(-1, 1), my + 1.2, 'th', pick(DF_, 1), { marker: 1 }); mk(R(30, 38), 101, 'th', pick(DF_, 2), {}); mk(R(30, 40), 89, 'us', pick(usSq, 3), { mate: 1 });
    Object.assign(s.ball, { x: s.crosser.x, y: s.crosser.y });
    s.hint = 'Orta geliyor! Top başına yaklaşınca zaman yavaşlar: o anda kafayı kaleye doğru KAYDIR ya da köşe seç.';
    s.ball.owner = s.crosser; attach(); s.cam = { x: mx, y: my - 6 }; s.phase = 'cross'; s.shot = { kind: 'head' }; return s;
  }
  if (t === 'drib') return mkDrib(s, mk, pick, DF_, usSq, meD);
  let mx, my;
  if (t === 'one') { mx = R(27, 41); my = R(74, 80); }
  else if (t === 'build') { mx = R(16, 52); my = R(42, 54); }
  else if (t === 'kontra') { mx = R(26, 42); my = R(48, 56); }
  else { mx = R(14, 54); my = R(60, 72); }
  s.me = mk(mx, my, 'us', meD, { me: 1 }); s.ball.owner = s.me;
  if (t === 'one') { mk(mx + R(-4, 4), my - 3.5, 'th', pick(DF_, 1), { chaser: 1 }); mk(cl(mx + (mx < 34 ? 14 : -14), 8, 60), my - 5, 'us', pick(usSq, 1), { mate: 1 }); }
  else if (t === 'kontra') {
    mk(cl(mx - R(12, 16), 8, 60), my + R(1, 5), 'us', pick(usSq, 1), { mate: 1 }); mk(cl(mx + R(12, 16), 8, 60), my + R(2, 6), 'us', pick(usSq, 2), { mate: 1 });
    mk(cl(mx + R(-6, 6), 12, 56), my + R(14, 18), 'th', pick(DF_, 1), {}); mk(cl(mx + R(-14, 14), 12, 56), my + R(22, 28), 'th', pick(DF_, 2), {});
    mk(mx + R(-3, 3), my - 4, 'th', pick(AT_, 3), { chaser: 1 });
  } else {
    mk(cl(mx + R(11, 16), 6, 62), my + R(5, 11), 'us', pick(usSq, 1), { mate: 1 });
    mk(cl(mx - R(11, 16), 6, 62), my + R(3, 9), 'us', pick(usSq, 2), { mate: 1 });
    mk(cl(mx + R(-6, 6), 6, 62), my - R(8, 12), 'us', pick(usSq, 4), { mate: 1 });
    mk(mx + R(-3, 3), my + R(5, 7), 'th', pick(thSq, 1), {});
    const nb = t === 'build' ? 4 : 3;
    for (let i = 0; i < nb; i++) mk(cl(34 + (i - (nb - 1) / 2) * 11 + (mx - 34) * .3, 6, 62), Math.min(97, my + R(14, 22)), 'th', pick(DF_, i + 2), {});
    if (t === 'build') mk(cl(mx + R(-10, 10), 8, 60), my + R(9, 12), 'th', pick(thSq, 7), {});
  }
  if (t === 'build' || t === 'atk') { const vis = cl(1 + Math.floor((st('pas') - 45) / 14), 1, 3), ms = s.P.filter(p => p.mate); ms.slice(vis).forEach(p => s.P.splice(s.P.indexOf(p), 1)); }
  s.hint = 'Top sende, oyun durdu. Parmağını koy, GERİ çek ve bırak: ok yönü ve uzunluğu vuruşu gösterir. Sonra yuvarlanan topun neresine vuracağını seç.';
  attach(); s.cam = { x: mx, y: my + 10 };
  return decideAtk();
}
function attach() { const B = S.ball, o = B.owner; if (o) { B.x = o.x; B.y = o.y + (o.side === 'us' ? .7 : -.7); B.z = 0; } }

/* ---------- Animasyon ---------- */
function anim(o, x, y, d, ex) { S.anims.push({ o, x0: o.x, y0: o.y, x1: x, y1: y, d: Math.max(.05, d), t0: S.at, arc: (ex && ex.arc) || 0, ease: ex && ex.lin ? 0 : 1 }); }
function then(f) { S.after = f; }
function runAnims(dt) {
  S.at += dt; let busy = false;
  for (const a of S.anims) {
    const k = cl((S.at - a.t0) / a.d, 0, 1), e = a.ease ? (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) : k;
    a.o.x = a.x0 + (a.x1 - a.x0) * e; a.o.y = a.y0 + (a.y1 - a.y0) * e; if (a.o === S.ball) S.ball.z = a.arc * 4 * k * (1 - k);
    if (k < 1) busy = true;
  }
  if (S.ball.owner && !S.anims.some(a => a.o === S.ball)) attach();
  if (!busy) { S.anims = []; const f = S.after; S.after = null; if (f) f(); }
}
/* yanındakiler biraz hareket etsin (sahne canlı görünsün) */
function drift(d) {
  S.P.forEach(p => { if (p.me || p.gk || p.wallP || S.anims.some(a => a.o === p)) return; const ref = S.ball; let tx = p.x + (ref.x - p.x) * .12 + (Math.random() - .5) * 3, ty = p.y + (Math.random() - .5) * 2;
    if (S.mode === 'atk' && p.side === 'th') { ty = Math.max(p.y, Math.min(100, p.y + (ref.y - p.y) * .2)); }
    if (S.mode === 'atk' && p.side === 'us' && p.mate) ty = Math.min(100, p.y + R(1, 4));
    anim(p, cl(tx, 3, 65), cl(ty, 2, 103), d); });
}
function gkMove(d) { const k = S.gk; if (!k) return; const ref = S.ball, ang = Math.atan2(ref.x - 34, 105 - ref.y), out = cl((30 - toGoal(ref)) * .06 + .6, .6, 2); anim(k, cl(34 + Math.sin(ang) * out, GOAL_L - 1, GOAL_R + 1), 104.4 - Math.cos(ang) * out, d); }
function passChance(a, b) {
  const d = dist(a, b), gap = laneGap(a, b, 'th'), pas = a.me ? st('pas') + (hasPerk('pasor') ? 6 : 0) : a.r;
  let p = .96 - d * .007 + (pas - 62) / 160 + mood();
  if (gap < 1) p -= .5; else if (gap < 2) p -= .26; else if (gap < 3.5) p -= .1;
  if (a.me && pressure(a) < 2) p -= .08;
  p -= (S.df - 1) * .3; if (S.W0.slip) p -= .04;
  return cl(p, .06, .97);
}
function threat(p) { const d = toGoal(p); return cl(1 - (d - 8) / 50, 0, 1) * (Math.abs(p.x - 34) < 20 ? 1 : .7); }
function dribbleChance(ang) {
  const me = S.me, tx = me.x + Math.sin(ang) * 8, ty = me.y + Math.cos(ang) * 8;
  let near = null, nd = 99; S.P.forEach(q => { if (q.side !== 'th' || q.gk || q.wallP) return; const d = Math.hypot(q.x - (me.x + tx) / 2, q.y - (me.y + ty) / 2); if (d < nd) { nd = d; near = q; } });
  if (!near || nd > 7) return { p: cl(.93 - (S.df - 1) * .2, .5, .96), q: null };
  const ab = st('tek') * .55 + st('hiz') * .45 + (hasPerk('calim') ? 7 : 0);
  return { p: cl(.58 + (ab - near.r) / 75 + mood() - (S.df - 1) * .38 + (nd > 4 ? .12 : 0) - (S.W0.slip ? .05 : 0), .1, .92), q: near };
}

/* ---------- FİZİK ---------- */
/* birimler: metre, saniye. TS: ekranda oyunun akış hızı (biraz ağır çekim) */
const PH = { g: 9.81, drag: .0105, mag: .24, roll: 2.9, TS: 1.0, SLOW: .2, LIVE: .4, H: 1 / 60, HD: 1 / 40 };
const rf = (a, b) => a + Math.random() * (b - a);
const SHOTK = { shot: 1, fk: 1, pen: 1, head: 1, chip: 1 };
function kSkill(kind, by) {
  if (!by || !by.me) return (by && by.r) || 70; const d = toGoal(S.ball);
  if (kind === 'pass' || kind === 'cross') return st('pas') + (hasPerk('pasor') ? 6 : 0);
  if (kind === 'head') return (st('fiz') + st('sut')) / 2 + (hasPerk('hava') ? 7 : 0);
  if (kind === 'chip') return (st('sut') + st('tek')) / 2;
  return st('sut') + (hasPerk('bitirici') && d < 18 ? 6 : 0) + (hasPerk('uzak') && d > 20 ? 7 : 0) + (kind === 'fk' && hasPerk('falso') ? 8 : 0) + (kind === 'pen' && hasPerk('soguk') ? 8 : 0);
}
/* sahnenin fizik kopyası: canlıda gerçek oyuncular, önizlemede kopyalar */
function mkWorld(dry) {
  if (!dry) return { P: S.P, B: S.ball, gk: S.gk, me: S.me, dry: 0 };
  const map = new Map(), P = S.P.map(p => { const q = { ...p }; map.set(p, q); return q; });
  return { P, B: { ...S.ball }, gk: map.get(S.gk), me: map.get(S.me), map, dry: 1 };
}
const wm = (W, p) => p && W.map ? W.map.get(p) || p : p;
/* vuruş: k = { ang (y eksenine göre), pw 0..1, spin -1.3..1.3, kind, by, tgt, zt (kaleye varınca hedef yükseklik), loft (açı), vz, assist } */
function launch(W, k) {
  const B = W.B, by = wm(W, k.by) || W.me, kind = k.kind || 'pass';
  if (kind === 'head') { B.x = by.x; B.y = by.y + .35; B.z = 1.9; }
  const sk = kSkill(kind, k.by || S.me), nn = W.noNoise ? 0 : 1;
  let pw = cl(k.pw, .02, 1.08);
  const err = (kind === 'pen' ? .5 : 1) * (1 + (72 - sk) / 58) * (kind !== 'pen' && pressure(by) < 2 ? 1.3 : 1) * Math.pow(S.df, .6) / S.W0.acc * cl(1 - mood() * 2, .6, 1.4) * (1 + Math.max(0, pw - .86) * 3.2) * (kind === 'head' ? 1.6 : 1) * (k.assist ? (kind === 'fk' ? 1.75 : 1.18) : 1) * (by.me ? 1 : .9) * (k.volley ? 1.3 : 1) * (kind === 'drib' ? .5 : 1);
  const ang = k.ang + gauss() * .032 * err * nn; pw *= 1 + gauss() * .045 * err * nn;
  const spin = (k.spin || 0) + gauss() * .07 * err * nn;
  const v = (kind === 'head' ? 8 + pw * 14 : kind === 'drib' ? 3 + pw * 16 : 5 + pw * 27) * (by.me && SHOTK[kind] ? 1 + (sk - 70) / 260 : 1);
  B.vx = Math.sin(ang) * v; B.vy = Math.cos(ang) * v;
  let vz = 0;
  if (k.vz != null) vz = k.vz;
  else if (k.zt != null) { const c = Math.cos(ang), dt = c > .15 ? Math.max(4, (GY - B.y) / c) : 22, t = (Math.exp(PH.drag * dt) - 1) / (PH.drag * v) * 1.04; vz = ((k.zt + Math.max(0, pw - .9) * 13) - (B.z || 0) + 4.9 * t * t) / t; }
  else if (k.loft) vz = Math.tan(k.loft) * v * .8;
  if (SHOTK[kind]) vz += gauss() * .85 * err * nn;
  B.vz = vz; B.spin = cl(spin, -1.4, 1.4); B.owner = null; B.z = B.z || 0;
  W.from = { x: B.x, y: B.y };
  Object.assign(W, { kind, by, sk: by && by.me ? sk : 70, t: 0, tested: new Set(by ? [by] : []), gkDone: 0, tgt: wm(W, k.tgt) || null, react: (W.gk ? .17 - (W.gk.r - 70) / 700 : .2) + (kind === 'fk' ? .0 : 0), cross: kind === 'cross', post: 0, parried: 0, hw: 0, last: by, gkGuess: null, spd0: v });
  if (kind === 'pen' && W.gk) { const r = Math.random(); W.gkGuess = r < .38 ? GOAL_L + 1.5 : r < .76 ? GOAL_R - 1.5 : 34; }
  W.run = by && by.me && !SHOTK[kind] && kind !== 'drib' ? runSpot(by) : null;
}
function physStep(W, h) {
  const B = W.B, vh = Math.hypot(B.vx, B.vy), air = B.z > .02 || B.vz > .4;
  if (air) {
    const v = Math.hypot(vh, B.vz), dr = PH.drag * v;
    B.vx -= dr * B.vx * h; B.vy -= dr * B.vy * h; B.vz -= (PH.g + dr * B.vz) * h;
    if (vh > .5) { const m = PH.mag * B.spin * vh; B.vx += B.vy / vh * m * h; B.vy += -B.vx / vh * m * h; }
    B.vx += (S.wind || 0) * h;
  } else {
    B.z = 0; B.vz = 0;
    if (vh > 0) { const dec = (PH.roll * (S.W0.slip ? .78 : 1) + .012 * vh * vh) * h, f = Math.max(0, vh - dec) / vh; B.vx *= f; B.vy *= f; if (vh > 2) { const m = PH.mag * .25 * B.spin * vh; B.vx += B.vy / vh * m * h; B.vy += -B.vx / vh * m * h; } }
  }
  B.spin *= 1 - .45 * h;
  B.x += B.vx * h; B.y += B.vy * h; B.z += B.vz * h;
  if (B.z < 0) { if (B.vz < -1.3) { B.z = -B.z * .3; B.vz = -B.vz * .46; B.vx *= .84; B.vy *= .84; B.spin *= .5; } else { B.z = 0; B.vz = 0; } }
}
/* p noktasının a→b doğru parçasına uzaklığı */
function segD(p, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, t = cl(((p.x - ax) * dx + (p.y - ay) * dy) / L2, 0, 1); return Math.hypot(p.x - ax - dx * t, p.y - ay - dy * t); }
/* bir alt adım: top + oyuncular + temaslar. Bir olay olursa döndürür. */
function flySub(W, h) {
  const B = W.B, k = W.gk, x0 = B.x, y0 = B.y; physStep(W, h); W.t += h;
  const spd = Math.hypot(B.vx, B.vy), sp3 = Math.hypot(spd, B.vz);
  /* oyuncular topa koşar */
  const ux = spd > .3 ? B.vx / spd : 0, uy = spd > .3 ? B.vy / spd : 0;
  for (const p of W.P) {
    if (p.gk || p.wallP || p.down > 0) continue;
    let tx = null, ty = 0, sp = 0;
    if (p === W.me && W.kind === 'drib' && W.by === W.me) { tx = B.x + B.vx * .3; ty = B.y + B.vy * .3; sp = 5.4 * Math.sqrt(st('hiz') / 70); }
    else if (p === W.me && W.run && W.by === W.me && W.t < 1.6) { tx = W.run.x; ty = W.run.y; sp = 5; }
    else if (W.t > .2 && p !== W.by) {
      let u = Math.max(0, (p.x - B.x) * ux + (p.y - B.y) * uy); if (spd < 3) u = 0;
      const px = B.x + ux * u, py = B.y + uy * u, dd = Math.hypot(px - p.x, py - p.y), want = p === W.tgt ? 13 : spd < 4 ? 9 : 6.5;
      if (dd < want && !(W.cross && p === W.me)) { tx = px; ty = py; sp = p.side === 'th' ? 2.9 * (p.r / 72) * Math.pow(S.df, .3) : p === W.tgt ? 4.6 : 3.4; }
      else if (W.cross && p === W.me) { const L = Math.max(0, (p.x - B.x) * ux + (p.y - B.y) * uy); tx = B.x + ux * L; ty = B.y + uy * L; sp = 3; }
    }
    if (tx != null) { const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy); if (L > .05) { const m = Math.min(L, sp * h); p.x += dx / L * m; p.y += dy / L * m; } }
  }
  /* kaleci */
  if (k) {
    let tx = k.x, ty = k.y, sp = 0;
    if (W.gkGuess != null) { if (W.t > .04) { tx = W.gkGuess; sp = 5.6 + (k.r - 70) / 25; } }
    else if (B.vy > 1.5 && W.t > W.react && B.y < k.y) {
      const tt = (k.y - B.y) / B.vy, px = B.x + B.vx * tt;
      if (px > GOAL_L - 3 && px < GOAL_R + 3) { tx = cl(px, GOAL_L - .2, GOAL_R + .2); sp = (3.7 + (k.r - 60) / 20) * Math.pow(S.df, .3); }
    } else if (spd < 11 && B.y > 88.5 && Math.abs(B.x - 34) < 20 && W.t > W.react) { tx = B.x; ty = Math.max(B.y, 99); sp = 4.4; }
    const dx = tx - k.x, dy = ty - k.y, L = Math.hypot(dx, dy);
    if (L > .03 && sp) { const m = Math.min(L, sp * h); k.x += dx / L * m; k.y += dy / L * m; k.down = sp > 4.5 && L > .6 ? .45 : k.down; }
    /* kaleci çizgisi: kurtarış denemesi */
    if (!W.gkDone && y0 < k.y && B.y >= k.y) {
      W.gkDone = 1; const dx2 = Math.abs(B.x - k.x), reach = .7 + k.r / 100 * 1.3 + (S.type === 'one' ? .25 : 0);
      if (dx2 < reach && B.z < 2.5) {
        const m = dx2 / reach; let p = .985 - m * m * .62 - Math.max(0, sp3 - 13) * .014 + (k.r - 72) / 120 - (W.sk - 70) / 150 - (B.z > 1.75 ? .12 : 0) - (W.post ? .2 : 0);
        p = cl(1 - (1 - cl(p, .02, .99)) / Math.pow(S.df, .55), .02, .97) * (W.kind === 'pen' ? .8 : 1);
        if (dx2 > .9) k.down = 1;
        if (Math.random() < p) {
          if (W.kind === 'pen' || m < .5 && sp3 < 21 && Math.random() < .62) return { e: 'held' };
          if (Math.random() < .45) return { e: 'corner' };
          B.vy = -Math.abs(B.vy) * .3 - 2; B.vx = B.vx * .3 + (Math.random() < .5 ? -1 : 1) * rf(3, 9); B.vz = Math.abs(B.vz) * .3 + rf(.5, 3); B.spin = 0; W.parried = 1; W.last = k; W.tested = new Set([k]); W.t = Math.min(W.t, .25);
        }
      }
    }
    /* kalecinin topu toplaması */
    if (!W.parried || W.t > .5) { const d = Math.hypot(B.x - k.x, B.y - k.y); if (d < 1.5 && B.z < 2.5 && sp3 < 15 && W.last !== k) return { e: 'held' }; }
  }
  /* kale çizgisi */
  if (y0 < GY && B.y >= GY) {
    const f = (GY - y0) / ((B.y - y0) || 1e-6), xl = x0 + (B.x - x0) * f, z = B.z;
    const nearPost = Math.min(Math.abs(xl - GOAL_L), Math.abs(xl - GOAL_R));
    if (nearPost < .2 && z < 2.44) { B.vy = -Math.abs(B.vy) * .55; B.vx += (xl < 34 ? 1 : -1) * rf(1, 4); B.y = GY - .05; W.post = 1; W.last = null; W.gkDone = 0; return null; }
    if (xl > GOAL_L && xl < GOAL_R && z > 2.3 && z < 2.6) { B.vy = -Math.abs(B.vy) * .45; B.vz = -Math.abs(B.vz) * .4; B.y = GY - .05; W.post = 1; W.bar = 1; W.last = null; W.gkDone = 0; return null; }
    if (xl > GOAL_L && xl < GOAL_R && z <= 2.3) return { e: 'goal', x: xl, z };
    return { e: W.parried ? 'corner' : z > 2.4 && xl > GOAL_L - 1.5 && xl < GOAL_R + 1.5 ? 'over' : 'wide', x: xl };
  }
  if (B.x < -.3 || B.x > 68.3) return { e: 'side' };
  if (B.y < -1) return { e: 'side' };
  /* temaslar */
  for (const p of W.P) {
    if (p.gk || p === W.last && W.t < .5) continue;
    const d = segD(p, x0, y0, B.x, B.y);
    if (p.side === 'th') {
      if (W.kind === 'head' && p.marker) continue;
      if (W.cross && p.marker) continue;
      const reach = p.wallP ? .6 : .66 + (p.r - 60) / 250, zr = p.wallP ? 2.0 : 1.95;
      if (spd < 4 && B.z < .5 && d < .7) return { e: 'int', who: p };
      if (d < reach && B.z < zr && !W.tested.has(p)) {
        W.tested.add(p);
        const pI = p.wallP ? cl(.93 - sp3 * .004, .7, .95) : cl(.4 + (p.r - 70) / 110 - (W.sk - 70) / 150 + (S.df - 1) * .5 - Math.max(0, sp3 - 11) * .021 - (B.z > 1.2 ? .14 : 0) - d * .15, .05, .93);
        if (Math.random() < pI) return { e: sp3 > 14 && SHOTK[W.kind] ? 'block' : 'int', who: p };
      }
    } else {
      if (p === W.by && W.t < (W.kind === 'drib' ? .16 : .9) && !W.parried && !W.post) continue;
      const isMe = p === W.me;
      if (isMe && S.fwOn && !W.dry && !W.cross && W.kind === 'pass' && W.by !== W.me && !W.fw && W.t > .15 && Math.hypot(p.x - B.x, p.y - B.y) < 2.8 && B.z < 1.4) { W.fw = 1; return { e: 'fwin' }; }
      if (isMe && W.cross && !W.hw && Math.hypot(p.x - B.x, p.y - B.y) < 2.6 && B.z > .75 && B.z < 3.4) { W.hw = 1; return { e: 'hwin' }; }
      if (isMe && W.cross && B.z > .7) continue;
      const zr = W.cross && !isMe ? 2.6 : 1.7;
      if (spd < 4 && B.z < .5 && d < .8) return { e: 'recv', who: p };
      if (d < 1 && B.z < zr && !W.tested.has(p)) {
        W.tested.add(p);
        const pc = W.kind === 'drib' && isMe ? .99 : cl(1.05 - Math.max(0, sp3 - 15) * .045 - (B.z > .9 ? .14 : 0), .22, .99);
        if (Math.random() < pc) return { e: 'recv', who: p, air: B.z > 1.2 };
        B.vx *= .45; B.vy *= .45; B.vx += rf(-2, 2); W.last = p;
      }
    }
  }
  if (W.hw === 1 && Math.hypot(W.me.x - B.x, W.me.y - B.y) > 3 && ((B.x - W.me.x) * B.vx + (B.y - W.me.y) * B.vy) > 0) { W.hw = 2; return { e: 'hmiss' }; }
  if (sp3 < .6 && B.z < .05 || W.t > 7) {
    /* sahipsiz top: en yakın kim? */
    let best = null, bd = 99; W.P.forEach(p => { if (p.gk) return; const d = Math.hypot(p.x - B.x, p.y - B.y) / (p.side === 'th' ? Math.pow(S.df, .3) : 1); if (d < bd) { bd = d; best = p; } });
    if (k && Math.hypot(k.x - B.x, k.y - B.y) < bd && B.y > 88.5) return { e: 'held' };
    return best && best.side === 'us' ? { e: 'recv', who: best } : { e: 'int', who: best };
  }
  return null;
}
function flyStep(W, dt) { W.acc = (W.acc || 0) + dt; while (W.acc >= PH.H) { W.acc -= PH.H; const e = flySub(W, PH.H); if (e) { W.acc = 0; return e; } } return null; }
/* önizleme: aynı fizikle N deneme */
function simKick(k, N, ok) {
  let n = 0; const keepS = S.wind;
  for (let i = 0; i < N; i++) { const W = mkWorld(1); launch(W, k); let e = null; for (let j = 0; j < 260 && !e; j++) e = flySub(W, PH.HD); if (e && ok(e, W)) n++; }
  S.wind = keepS; return n / N;
}
/* sadece top (gürültüsüz): yörünge önizlemesi ve çözücüler için */
function ballOnly(k, maxT) {
  const W = { B: { x: S.ball.x, y: S.ball.y, z: S.ball.z || 0 }, P: [], gk: null, me: S.me, noNoise: 1 }; launch(W, k);
  const B = W.B, ox = B.x, oy = B.y, pts = [{ x: B.x, y: B.y, z: B.z }]; let zLine = null, xLine = null, t = 0;
  while (t < (maxT || 3.5)) { const py = B.y; physStep(W, PH.H); t += PH.H; pts.push({ x: B.x, y: B.y, z: B.z, d: Math.hypot(B.x - ox, B.y - oy) }); if (py < GY && B.y >= GY) { zLine = B.z; xLine = B.x; break; } if (Math.hypot(B.vx, B.vy, B.vz) < .5 && B.z < .05) break; if (B.x < -2 || B.x > 70) break; }
  return { pts, zLine, xLine, zAt: d => { const p = pts.find(q => q.d >= d); return p ? p.z : -1; }, stopD: pts[pts.length - 1].d || 0 };
}
/* güç bulucular */
function solveBin(f, target, lo, hi) { for (let i = 0; i < 13; i++) { const m = (lo + hi) / 2; if (f(m) < target) lo = m; else hi = m; } return (lo + hi) / 2; }
function passKick(from, to, air) {
  const B = S.ball, lead = to.me ? 0 : 1.6, tx = cl(to.x, 3, 65), ty = Math.min(101, to.y + lead), d = Math.hypot(tx - B.x, ty - B.y), ang = Math.atan2(tx - B.x, ty - B.y);
  const lofted = air || d > 30 || laneGap(from, to, 'th') < 1.1 && d > 12;
  if (lofted) { const k = { ang, pw: .5, loft: .5, kind: 'pass', by: from, tgt: to, assist: 1 }; k.pw = solveBin(p => ballOnly({ ...k, pw: p }).zAt(d), .5, .05, 1); return k; }
  const k = { ang, pw: .3, kind: 'pass', by: from, tgt: to, assist: 1 }; k.pw = solveBin(p => ballOnly({ ...k, pw: p }).stopD, d + 2.5, .02, 1); return k;
}
function crossKick(from, to) {
  const B = S.ball, tx = to.x + rf(-.6, .6), ty = to.y + .6, d = Math.hypot(tx - B.x, ty - B.y), ang = Math.atan2(tx - B.x, ty - B.y);
  const k = { ang, pw: .5, loft: .5, kind: 'cross', by: from, tgt: to, assist: 1 }; k.pw = solveBin(p => ballOnly({ ...k, pw: p }).zAt(d), 1.9, .05, 1); return k;
}
function shotKick(aimX, kind, assist) {
  const B = S.ball, ang = Math.atan2(aimX - B.x, GY - B.y), d = toGoal(B);
  if (kind === 'fk') return fkKick(aimX);
  if (kind === 'chip') { const k = { ang, pw: .4, loft: .75, kind: 'chip', by: S.me, assist }; k.pw = solveBin(p => ballOnly({ ...k, pw: p }).zLine == null ? -1 : ballOnly({ ...k, pw: p }).zLine, 1.3, .05, 1); return k; }
  return { ang, pw: kind === 'pen' ? .76 : cl(.7 + d * .009, .72, .9), spin: 0, kind, by: S.me, zt: kind === 'pen' ? .55 : .7, assist };
}
/* serbest vuruş: barajın üstünden aşıp kaleye inen en hızlı yörüngeyi bul */
function fkKick(aimX) {
  const B = S.ball, d = toGoal(B), side = aimX < 34 ? -1 : 1, spin = -side * .5;
  const ang0 = Math.atan2(aimX - B.x, GY - B.y) - spin * .11; let best = null, bs = -1e9;
  for (let pw = .34; pw <= 1.0; pw += .04) {
    const k = { ang: ang0, pw, spin, kind: 'fk', by: S.me, zt: 1.75 }, r = ballOnly(k), wz = r.zAt(9.3), zl = r.zLine, xl = r.xLine;
    let sc = (wz >= 2.08 ? 3 : wz - 2.08) + (zl != null && zl > .3 && zl < 2.25 ? 3 : -2) + pw * 2 - (xl != null ? Math.abs(xl - aimX) * .5 : 3);
    if (sc > bs) { bs = sc; best = k; }
  }
  /* yön düzeltmesi: kavisi hesaba kat */
  for (let i = 0; i < 3; i++) { const r = ballOnly(best); if (r.xLine != null) best = { ...best, ang: best.ang + (aimX - r.xLine) / Math.max(8, d) * .9 }; }
  best.assist = 1; return best;
}
function headKick(aimX) { const me = S.me, ang = Math.atan2(aimX - me.x, GY - me.y); return { ang, pw: .82, spin: 0, kind: 'head', by: me, zt: .45, assist: 1 }; }
/* kaydırmayı vuruşa çevir */
function goalish(ang) { const B = S.ball, c = Math.cos(ang); if (c < .2 || toGoal(B) > 42) return false; const xl = B.x + Math.tan(ang) * (GY - B.y); return xl > GOAL_L - 5 && xl < GOAL_R + 5; }
function swipeKindK(sp) {
  const s = S; let kind = s.phase === 'hwin' && !s.fwin ? 'head' : s.type === 'pen' ? 'pen' : goalish(sp.ang) ? (s.dead && s.type === 'fk' ? 'fk' : 'shot') : 'pass';
  const k = { ang: sp.ang, pw: sp.pw, spin: sp.spin, kind, by: s.me };
  if (kind === 'head') { k.pw = sp.pw * .9; k.spin = sp.spin * .3; k.zt = s.air ? 1.8 : .45; }
  else if (SHOTK[kind]) k.zt = kind === 'pen' ? .55 : .7;
  return k;
}
function previewPath(k) { const r = ballOnly(k, 2.2), n = Math.max(6, Math.floor(r.pts.length * .42)); return r.pts.slice(0, n).filter((_, i) => i % 3 === 0); }

/* ---------- HÜCUM: seçenekler (yüzdeler fizik denemelerinden) ---------- */
function gkPlace() { const k = S.gk; if (!k || S.mode !== 'atk') return; const ref = S.ball, ang = Math.atan2(ref.x - 34, 105 - ref.y), out = cl((30 - toGoal(ref)) * .13 + .6, .6, 4.2); k.x = cl(34 + Math.sin(ang) * out, GOAL_L - 1, GOAL_R + 1); k.y = 104.4 - Math.cos(ang) * out; k.down = 0; }
const NPV = 10;
const PV = () => typeof BOTSMART !== 'undefined' && !!BOTSMART; /* yüzdeler oyuncuya gösterilmez; sadece test botu hesaplar */
function shotPv(kind) { const xs = [GOAL_L + 1.1, GOAL_R - 1.1]; let t = 0; xs.forEach(x => { t += simKick(shotKick(x, kind, 1), 16, e => e.e === 'goal'); }); return t / xs.length; }
function passPv(to) { const k = passKick(S.me, to); return simKick(k, NPV, (e, W) => e.e === 'recv' && e.who === W.tgt); }
function decideAtk() {
  const s = S, me = s.me; s.phase = 'decide'; s.opts = []; s.fw = null;
  if (s.n >= 10) { endScene({ t: 'POZİSYON SÖNDÜ', s: 'Savunma yerleşti', c: '#d8e2dc' }, 0); return s; }
  if (s.ball.owner) attach();
  const dG = toGoal(me), dead = s.dead; if (!dead) gkPlace();
  if (s.type === 'fk' && dead) {
    s.opts.push({ k: 'shot', l: 'Kaleye vur', d: 'Barajın üstünden falso', p: PV() ? shotPv('fk') : null });
    const tgt = s.P.filter(p => p.mate && !p.me).sort((a, b) => toGoal(a) - toGoal(b))[0];
    if (tgt) s.opts.push({ k: 'cross', who: tgt, l: `Orta aç: ${short(tgt.n)}`, d: 'Kafa vuruşu için ceza sahasına', p: PV() ? simKick(crossKick(me, tgt), NPV, (e, W) => e.e === 'recv' && e.who === W.tgt) * .42 : null });
    const sh = s.P.filter(p => p.mate && !p.me).sort((a, b) => dist(a, me) - dist(b, me))[0];
    if (sh) s.opts.push({ k: 'pass', who: sh, l: `Kısa pas: ${short(sh.n)}`, d: 'Oyunu baştan kur', p: PV() ? passPv(sh) : null });
    return s;
  }
  if (dG < 36 && Math.cos(Math.atan2(34 - me.x, 105 - me.y)) > .2) s.opts.push({ k: 'shot', l: 'Şut çek', d: 'Köşe seç ya da kaleye kaydır', p: PV() ? shotPv('shot') : null });
  s.P.filter(p => p.side === 'us' && !p.me && !p.gk).forEach(p => { s.opts.push({ k: 'pass', who: p, l: `Pas: ${short(p.n)}`, d: threat(p) > threat(me) + .05 ? 'İleride, tehlikeli' : threat(p) < threat(me) - .15 ? 'Geriye, güvenli' : 'Yanına', p: PV() ? passPv(p) : null, th: threat(p) }); });
  [[-.75, '↖'], [0, '⬆'], [.75, '↗']].forEach(([da, ic]) => { const ang = Math.atan2(34 - me.x, 105 - me.y) * .5 + da; const dc = dribbleChance(ang); s.opts.push({ k: 'drib', ang, ic, l: `${ic} Topla sür`, d: dc.q ? `${short(dc.q.n)} karşında` : 'Önün boş', p: dc.p }); });
  if (dG < 24 && s.gk && toGoal(s.gk) > 1.6) s.opts.push({ k: 'chip', l: 'Aşırtma', d: 'Kalecinin üstünden', p: PV() ? simKick(shotKick(34, 'chip', 1), NPV, e => e.e === 'goal') : null });
  return s;
}

/* ---------- HÜCUM: eylemler ---------- */
function act(i) {
  if (!S || S.phase !== 'decide') return; const o = S.opts[i]; if (!o) return;
  S.n++; S.msg = ''; M.my.touch = (M.my.touch || 0) + 1;
  if (S.mode === 'def') return defAct(o);
  if (o.k === 'shot') { S.phase = 'aim'; S.shot = { kind: S.type === 'fk' && S.dead ? 'fk' : 'shot' }; aimPrev(); S.msg = 'Köşeni seç, kaleye dokun ya da kaleye doğru KAYDIR.'; return drawUIControls(); }
  if (o.k === 'chip') { S.dead = 0; return startContact(shotKick(34, 'chip', 1)); }
  if (o.k === 'pass') { S.dead = 0; return startContact(passKick(S.me, o.who)); }
  if (o.k === 'cross') { S.dead = 0; return startContact(crossKick(S.me, o.who)); }
  if (o.k === 'drib') return doDrib(o.ang, o.p);
}
const AIMX = [GOAL_L + 1.1, 34, GOAL_R - 1.1];
function aimPrev() { if (!PV()) { S.aimP = null; return; } const k = S.shot.kind; S.aimP = AIMX.map(x => simKick(shotKick(x, k, 1), 24, e => e.e === 'goal')); }
/* canlı vuruş */
function kickNow(k) {
  const s = S; if (!s) return; s.anims = s.anims.filter(a => a.o !== s.ball);
  if (k.by && k.by !== s.me && s.ball.owner === k.by) attach();
  const W = mkWorld(0); launch(W, k); s.fw = W; s.phase = 'fly'; s.trail = []; s.drag = null;
  if (k.by === s.me && SHOTK[k.kind]) { M.my.sh++; if (k.kind === 'pen') M.my.pen = 1; if (k.kind === 'head') M.my.hd = (M.my.hd || 0) + 1; }
  if (k.by === s.me && (k.kind === 'pass' || k.kind === 'cross')) M.my.pas = (M.my.pas || 0) + 1;
  W.mateShot = k.mateShot; W.assistMe = k.assistMe;
  drawUIControls();
}
function aimAt(x) {
  if (!S || S.phase !== 'aim') return;
  if (S.shot.kind === 'head') return headAt(x);
  S.aimX = cl(x, GOAL_L - .8, GOAL_R + .8); S.dead = 0;
  startContact(shotKick(S.aimX, S.shot.kind, 1));
}
function swipeKick(sp) {
  const s = S; if (!s || s.mode !== 'atk' || !['decide', 'aim', 'hwin'].includes(s.phase)) return;
  const k = swipeKindK(sp);
  if (s.phase === 'hwin' && s.fwin) { s.fwin = 0; k.volley = 1; s.msg = SHOTK[k.kind] ? 'Tek vuruş!' : 'Tek pas!'; return kickNow(k); }
  if (s.phase === 'hwin') return doHeader(k);
  if (s.phase === 'decide') { s.n++; M.my.touch = (M.my.touch || 0) + 1; }
  s.dead = 0; s.aimX = null; startContact(k);
}
/* uçuş sonucu (canlı) */
function resolveFly(ev) {
  const s = S, W = s.fw, k = W.kind, byMe = W.by === s.me, sh = !!SHOTK[k], B = s.ball, who = ev.who;
  if (ev.e === 'hwin') { s.phase = 'hwin'; s.hwT = s.t; s.shot = { kind: 'head' }; const mk = s.P.find(p => p.marker); s.duel = duelP(mk); s.aimP = PV() ? AIMX.map(x => s.duel * simKick(headKick(x), 16, e => e.e === 'goal')) : null; s.msg = 'ŞİMDİ! Kafayı kaleye doğru KAYDIR ya da köşe seç.'; return drawUIControls(); }
  if (ev.e === 'fwin') { s.phase = 'hwin'; s.fwin = 1; s.hwT = s.t; s.shot = { kind: 'shot' }; s.aimP = null; s.msg = 'Top geliyor! Tek vuruşta KAYDIR (şut/pas) ya da bekle, top ayağına gelsin.'; return drawUIControls(); }
  if (ev.e === 'hmiss') { if (s.phase === 'hwin') { s.phase = 'anim'; M.my.bad++; return endScene({ t: 'KAFAYI KAÇIRDIN', s: 'Top başının üzerinden geçti', c: '#d8e2dc' }, 0); } return; }
  s.phase = 'anim';
  if (ev.e === 'goal') {
    s.net = s.t;
    if (byMe) return scoreMe(W.post ? 'Direkten içeri!' : k === 'head' ? 'Kafayla!' : k === 'pen' ? 'Penaltı golü' : k === 'fk' ? 'Serbest vuruştan!' : k === 'chip' ? 'Aşırtma! Kaleci çaresiz' : ev.z > 1.7 ? 'Doksana!' : Math.abs(B.spin) > .5 ? 'Falsoyla köşeye!' : W.spd0 > 28 ? 'Füze gibi!' : 'Ağlarla buluştu');
    M.sc[0]++; if (W.assistMe) M.my.a++;
    M.feed.unshift({ m: s.min, t: `⚽ GOL! ${short(W.by.n)}${W.assistMe ? ' — asist senden' : ''}`, k: 'good' });
    return endScene({ t: 'GOL!', s: W.assistMe ? `Asist: ${g.name}` : `${short(W.by.n)} bitirdi`, c: '#e8c468' }, 1);
  }
  if (ev.e === 'recv') {
    B.owner = who; attach(); B.vx = B.vy = B.vz = 0;
    s.fwin = 0;
    if (who === s.me) { s.msg = W.kind === 'drib' ? '' : W.parried ? 'Kaleci çeldi, dönen top sende!' : W.post ? 'Direkten döndü, top yine sende!' : byMe ? 'Top yine sende.' : `${short(W.by.n)} topu sana verdi. Sıra sende!`; decideAtk(); return drawUIControls(); }
    if (byMe && W.kind === 'pass') { const pr = passRate(W, who); if (s.type === 'build' && !s.chained) return chainAfterPass(pr, who); }
    if (W.kind === 'cross' && ev.air) { if (Math.random() < .42 * Math.pow(s.df, .5)) { if (byMe) M.my.ok++; return endScene({ t: 'SAVUNMA UZAKLAŞTIRDI', s: 'Orta iyiydi ama rakip kafayla uzaklaştırdı', c: '#d8e2dc' }, 0); } return mateHeader(who); }
    return mateTurn(who);
  }
  const shotEnd = (t, sub) => { if (byMe) { if (t.good) M.my.ok++; else M.my.bad++; } return endScene({ t: t.t, s: sub, c: '#d8e2dc' }, 0); };
  switch (ev.e) {
    case 'held': return shotEnd({ t: sh ? 'KALECİ YAKALADI' : 'KALECİ TOPU ALDI', good: sh }, sh ? (byMe ? 'İyi şuttu ama kaleci yerindeydi' : `${short(W.by.n)} şutunu tuttu`) : 'Top kaleciye gitti');
    case 'corner': return shotEnd({ t: 'KORNER', good: 1 }, 'Kaleci son anda kornere çeldi');
    case 'over': return shotEnd({ t: W.post ? 'DİREK!' : 'ÜSTTEN AUT', good: W.post }, W.bar ? 'Top üst direkten döndü' : W.post ? 'Top direkten döndü' : sh ? 'Top üst direğin üzerinden gitti' : 'Top auta çıktı');
    case 'wide': return shotEnd({ t: W.post ? 'DİREK!' : 'AUT', good: W.post }, W.post ? 'Top direkten döndü' : sh ? 'Hedefi tutturamadın' : 'Top auta çıktı');
    case 'side': return shotEnd({ t: 'TAÇ', good: 0 }, 'Top taça çıktı');
    case 'block': return shotEnd({ t: who && who.wallP ? 'BARAJA TAKILDI' : 'BLOK', good: 1 }, who && who.wallP ? 'Top barajdan döndü' : `${short(who.n)} vücuduyla engelledi`);
    case 'int': if (k === 'drib') return shotEnd({ t: 'TOP KAPILDI', good: 0 }, who ? `${short(who.n)} topu önünden aldı` : 'Top kaçtı');
      return shotEnd({ t: sh ? 'TOP RAKİPTE' : 'PAS KESİLDİ', good: 0 }, who ? `${short(who.n)} araya girdi` : 'Top sahipsiz kaldı');
  }
  endScene({ t: 'POZİSYON BİTTİ', s: '', c: '#d8e2dc' }, 0);
}
function laneDist(q, a, b) { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, t = cl(((q.x - a.x) * dx + (q.y - a.y) * dy) / L2, 0, 1); return Math.hypot(q.x - a.x - dx * t, q.y - a.y - dy * t); }
function runSpot(p) {
  let best = { x: p.x, y: p.y + 6 }, bs = -1e9;
  for (let i = 0; i < 10; i++) { const a = -1.1 + i * .244, x = cl(p.x + Math.sin(a) * 9, 6, 62), y = Math.min(97, p.y + Math.cos(a) * 9); let md = 99; S.P.forEach(q => { if (q.side === 'th' && !q.gk) md = Math.min(md, Math.hypot(q.x - x, q.y - y)); }); const sc = Math.min(md, 7) * 1.2 + (y - p.y) * .25 - Math.abs(x - 34) * .05; if (sc > bs) { bs = sc; best = { x, y }; } }
  return best;
}
/* arkadaşın topla: şut, sana geri pas, orta (hepsi fizikle) */
function mateTurn(m) {
  const s = S, me = s.me, dG = toGoal(m), wide = m.x < 15 || m.x > 53;
  M.my.passOk = (M.my.passOk || 0) + 1; s.phase = 'anim';
  if (wide && m.y > 78 && Math.random() < .55) {
    s.msg = `${short(m.n)} kanattan ortaya çeviriyor!`; s.crosser = m; s.type = 'head';
    const tx = cl(34 + R(-4, 4), 28, 40), ty = R(94, 98); anim(me, tx, ty, .45); drift(.45);
    then(() => startCross(m)); return drawUIControls();
  }
  const shootP = dG < 22 && laneGap(m, { x: 34, y: 105 }, 'th') > 1.2 ? .35 : .08;
  if (Math.random() < shootP) {
    const aim = 34 + (Math.random() < .5 ? -1 : 1) * rf(1.4, 3);
    s.msg = `${short(m.n)} şutunu çekiyor!`;
    return kickNow({ ang: Math.atan2(aim - m.x, GY - m.y), pw: .84, spin: 0, kind: 'shot', by: m, zt: .7, assist: 1, assistMe: 1 });
  }
  const k = passKick(m, me); k.assist = 0; s.msg = `${short(m.n)} topu sana çeviriyor…`; kickNow(k);
}
function mateHeader(m) { const aim = 34 + (Math.random() < .5 ? -1 : 1) * rf(.8, 3); S.msg = `${short(m.n)} kafayı vuruyor!`; kickNow({ ang: Math.atan2(aim - m.x, GY - m.y), pw: .8, kind: 'head', by: m, zt: .5, assist: 1, assistMe: 1 }); }
function doDrib(ang, p) {
  const s = S, me = s.me, dc = dribbleChance(ang), ok = Math.random() < p, len = 6 + st('hiz') / 25;
  const tx = cl(me.x + Math.sin(ang) * len, 4, 64), ty = Math.min(101, me.y + Math.cos(ang) * len); M.my.drib = (M.my.drib || 0) + 1; s.dead = 0;
  if (dc.q) anim(dc.q, (me.x + tx) / 2, (me.y + ty) / 2, .45);
  if (ok) {
    anim(me, tx, ty, .42); drift(.42);
    then(() => { if (dc.q) { anim(dc.q, dc.q.x + (dc.q.x < tx ? -2 : 2), dc.q.y - 2.5, .3); s.msg = `${short(dc.q.n)} geride kaldı!`; M.my.ok++; } decideAtk(); drawUIControls(); });
  } else {
    anim(me, (me.x + tx) / 2, (me.y + ty) / 2, .34);
    then(() => {
      const box = dc.q && dc.q.y > 88.5 && Math.abs(dc.q.x - 34) < 20, foul = Math.random() < (box ? .14 : .22);
      if (foul && dc.q) { if (box) { s.msg = 'Faul! Hakem penaltıyı gösterdi!'; return toSetPiece('pen'); } s.msg = 'Faul! Serbest vuruş kazandın.'; if (toGoal(me) < 32) return toSetPiece('fk'); }
      M.my.bad++; endScene({ t: 'TOP KAPILDI', s: dc.q ? `${short(dc.q.n)} müdahale etti` : 'Top ayağından kaçtı', c: '#d8e2dc' }, 0);
    });
  }
  s.phase = 'anim'; drawUIControls();
}
/* aynı sahnede duran topa geç */
function toSetPiece(k) { const mo = { ...S.mo, type: k }, old = S, n = old.n; mkScene(mo); S.n = n; S.msg = old.msg; if (k === 'pen') aimPrev(); drawUIControls(); }
/* kafa: orta gerçek yörüngeyle gelir */
function startCross(cr) {
  const s = S; cr = cr || s.crosser; if (!s || !cr) return; s.crosser = cr;
  s.ball.owner = cr; attach(); s.msg = 'Orta geliyor… top başına yaklaşınca zaman yavaşlayacak!';
  kickNow(crossKick(cr, s.me));
}
function duelP(mk) { return mk ? cl(.72 + (st('fiz') + (hasPerk('hava') ? 7 : 0) - mk.r) / 85 - (S.df - 1) * .45 + mood(), .22, .93) : .95; }
function doHeader(k) {
  const s = S; if (!s || s.phase !== 'hwin') return; s.phase = 'anim';
  const mk = s.P.find(p => p.marker);
  if (Math.random() > s.duel) { if (mk) { mk.x = s.ball.x; mk.y = s.ball.y - .3; } M.my.bad++; M.my.hd = (M.my.hd || 0) + 1; return endScene({ t: 'KAFA DÜELLOSU', s: mk ? `${short(mk.n)} senden önce yükseldi` : 'Topa yetişemedin', c: '#d8e2dc' }, 0); }
  s.msg = 'Kafa!'; kickNow(k);
}
function headAt(x) { if (!S || S.phase !== 'hwin') return; if (S.fwin) { S.fwin = 0; S.msg = 'Tek vuruş!'; return kickNow({ ...shotKick(x, 'shot', 1), volley: 1 }); } doHeader(headKick(x)); }
function scoreMe(sub) { M.sc[0]++; M.my.g++; M.feed.unshift({ m: S.min, t: `⚽ GOL! ${g.name}`, k: 'gold' }); endScene({ t: 'GOL!', s: sub, c: '#e8c468' }, 1); }

/* ---------- SAVUNMA ---------- */
function decideDef() {
  const s = S; s.phase = 'decide'; s.opts = [];
  if (s.n >= 6) { M.my.ok++; endScene({ t: 'TEHLİKE GEÇTİ', s: 'Atak yavaşladı, takım yerleşti', c: '#bde5c8' }, 1); return s; }
  const car = s.carrier, d = dist(s.me, car), w = tackleW(0);
  if (d < 4.5) { s.opts.push({ k: 'tk', l: 'Müdahale', d: 'Göstergeyi yeşilde durdur', p: w * 3.2 }); s.opts.push({ k: 'slide', l: 'Kayarak', d: 'Geniş ama faul riski', p: w * 4.2 }); }
  s.opts.push({ k: 'jockey', l: 'Kolla', d: d < 4.5 ? 'Önünde kal, yavaşlat' : 'Yaklaş ve önünü kes', p: null });
  const sup = s.P.filter(p => p.sup).sort((a, b) => toGoal(a) - toGoal(b))[0];
  if (sup && laneGap(car, sup, 'us') > 1.5) s.opts.push({ k: 'lane', who: sup, l: `Pas yolunu kapat: ${short(sup.n)}`, d: 'Taşıyıcı tek kalır', p: null });
  return s;
}
function tackleW(slide) { const car = S.carrier; return cl((.16 + (st('def') + (hasPerk('kesici') ? 7 : 0) - (car ? car.r : 70)) / 230 + mood() * .5 - (S.df - 1) * .1) * (slide ? 1.5 : 1), .06, .34); }
function defAct(o) {
  const s = S, car = s.carrier, me = s.me;
  if (o.k === 'tk' || o.k === 'slide') { s.phase = 'meter'; s.tk = o.k; s.meter = { t0: s.at, w: tackleW(o.k === 'slide'), c: .25 + Math.random() * .5, sp: .8 * (.85 + s.df * .2) }; s.msg = 'Göstergeyi YEŞİLDE durdur: müdahale anı!'; return drawUIControls(); }
  const lane = o.k === 'lane';
  /* taşıyıcı ilerler: kollarsan yavaş, pas yolunu kapatırsan pas veremez */
  const fwd = lane ? 7 : 4.5, ang = Math.atan2(34 - car.x, 105 - car.y) + (Math.random() - .5) * .6, nx = cl(car.x + Math.sin(ang) * fwd, 5, 63), ny = Math.min(100, car.y + Math.cos(ang) * fwd);
  s.phase = 'anim';
  const sup = s.P.filter(p => p.sup && (!lane || p !== o.who)).sort((a, b) => toGoal(a) - toGoal(b))[0];
  if (!lane && sup && Math.random() < .3 && laneGap(car, sup, 'us') > 1.4) {
    /* pas verdi: yeni taşıyıcı */
    car.car = 0; car.sup = 1; sup.sup = 0; sup.car = 1; s.carrier = sup; s.ball.owner = null;
    anim(s.ball, sup.x, sup.y - .6, .45); anim(me, sup.x + (34 - sup.x) * .1, Math.min(100, sup.y + 4), .7); drift(.6);
    then(() => { s.ball.owner = sup; s.msg = `Pas! Şimdi ${short(sup.n)} topla.`; decideDef(); drawUIControls(); });
    return drawUIControls();
  }
  anim(car, nx, ny, .6); const ma = Math.atan2(34 - nx, 105 - ny); anim(me, nx + Math.sin(ma) * 2.2, Math.min(103, ny + Math.cos(ma) * 2.2), .6); drift(.6); gkMove(.6);
  then(() => {
    /* kollama: arkadaşın yardıma gelir */
    if (Math.random() < (lane ? .12 : .2) + (st('def') - 65) / 300) { M.my.ok++; M.my.tk += 0; return endScene({ t: 'TOP BİZDE', s: 'Kollaman işe yaradı, arkadaşın topu aldı', c: '#bde5c8' }, 1); }
    if (toGoal(car) < 21) return oppShot(lane ? .85 : .7);
    decideDef(); drawUIControls();
  });
  drawUIControls();
}
function oppShot(mult) {
  const s = S, car = s.carrier, me = s.me; s.phase = 'anim';
  const blk = dist(me, car) < 3.2 && Math.random() < .22, q = cl((.3 + (car.r - 70) / 100) * s.df * mult * (toGoal(car) < 12 ? 1.35 : 1) * (1 - ((s.gk ? s.gk.r : 70) - 70) / 150), .06, .62), goal = !blk && Math.random() < q;
  const lx = goal ? 34 + (Math.random() < .5 ? -2.7 : 2.7) : 34 + R(-5, 5);
  s.ball.owner = null; anim(s.ball, blk ? me.x : lx, blk ? me.y : (goal ? 105.6 : 104.2), blk ? .25 : .5, { arc: .8 }); if (!goal && !blk) anim(s.gk, cl(lx, GOAL_L, GOAL_R), 104.2, .4);
  then(() => {
    if (blk) { M.my.ok++; M.my.tk++; return endScene({ t: 'ŞUTU BLOKLADIN', s: 'Vücudunu siper ettin', c: '#bde5c8' }, 1); }
    if (goal) { M.sc[1]++; M.my.con++; M.feed.unshift({ m: s.min, t: `⚽ ${M.T.th.n} golü`, k: 'bad' }); return endScene({ t: 'GOL YEDİNİZ', s: `${short(car.n)} affetmedi`, c: '#ff6b5b' }, 0); }
    M.my.ok++; endScene({ t: 'KALECİ KURTARDI', s: 'Tehlike geçti', c: '#bde5c8' }, 1);
  });
  drawUIControls();
}
function fireTackle() {
  const s = S, m = s.meter, v = meterVal(), off = Math.abs(v - m.c), car = s.carrier, me = s.me, slide = s.tk === 'slide'; m.v = v; s.phase = 'anim';
  const dodge = cl(.22 + ((car ? car.r : 70) - st('def')) / 120 + (s.df - 1) * .5, .06, .58);
  const win = (off <= m.w / 2 || (off <= m.w && Math.random() < .45)) && Math.random() > dodge;
  anim(me, car.x, car.y - .3, .3);
  if (win) {
    then(() => { M.my.ok++; M.my.tk++; if (slide) { s.ball.owner = null; anim(s.ball, car.x + R(-6, 6), car.y - 6, .4); car.down = 1; then(() => endScene({ t: 'KAYARAK KESTİN!', s: 'Topu uzaklaştırdın', c: '#bde5c8' }, 1)); } else { s.ball.owner = me; endScene({ t: 'TOPU KAPTIN!', s: off <= m.w / 2 ? 'Kusursuz zamanlama' : 'Son anda', c: '#bde5c8' }, 1); } });
    return drawUIControls();
  }
  const foul = slide ? (off > m.w * 1.6 && Math.random() < .55) || Math.random() < .12 : off > m.w * 3 && Math.random() < .22;
  then(() => {
    if (foul) {
      const box = car.y > 88.5 && Math.abs(car.x - 34) < 20, red = slide && off > m.w * 2.6 && Math.random() < .3; M.my.bad += 2; g.cards = (g.cards || 0) + 1;
      if (red) { g.susp = 2; M.feed.unshift({ m: s.min, t: '🟥 Kırmızı kart! 2 maç cezalısın.', k: 'bad' }); }
      if (box) { const gl = Math.random() < .76; if (gl) { M.sc[1]++; M.my.con++; M.feed.unshift({ m: s.min, t: `⚽ Penaltı golü: ${M.T.th.n}`, k: 'bad' }); } return endScene({ t: 'PENALTI', s: gl ? 'Faul; penaltı gol oldu' : 'Penaltıyı kaleci kurtardı', c: '#ff6b5b' }, 0); }
      return endScene({ t: red ? 'KIRMIZI KART' : 'SARI KART', s: slide ? 'Sert kayarak müdahale' : 'Geç kaldın, faul', c: red ? '#ff6b5b' : '#f2c500' }, 0);
    }
    M.my.bad++; me.down = .6;
    /* geçildin: taşıyıcı ilerler */
    const nx = cl(car.x + R(-3, 3), 8, 60), ny = Math.min(98, car.y + 6); anim(car, nx, ny, .5); anim(me, me.x + R(-2, 2), me.y - 2, .5);
    then(() => { s.msg = 'Geçildin!'; if (toGoal(car) < 24) oppShot(1.1); else { decideDef(); drawUIControls(); } });
    drawUIControls();
  });
  drawUIControls();
}

/* ---------- Sahne bitişi ---------- */
function endScene(b, good) {
  if (!S || S.phase === 'done') return;
  S.banner = b; S.phase = 'done'; S.good = good; S.opts = []; M.mi++;
  try { const e = document.querySelector('.sb .sc'); if (e) e.textContent = `${M.sc[0]} – ${M.sc[1]}`; } catch (x) { }
  if (!b.t.startsWith('GOL') && !b.t.startsWith('PENALTI')) M.feed.unshift({ m: S.min, t: `${b.t[0] + b.t.slice(1).toLocaleLowerCase('tr')}: ${b.s}`, k: good ? 'good' : 'mut' });
  drawUIControls();
}
function sceneContinue() { cancelAnimationFrame(RAF); S = null; M.stage = 'live'; draw(); }
/* test botu: rastgele makul bir hamle (akıllı mod: insan gibi kaydırır) */
function botMove() {
  if (!S) return; const s = S;
  const smart = typeof BOTSMART !== 'undefined' && BOTSMART;
  const human = (x, kind) => { const B = kind === 'head' ? s.me : s.ball; return { ang: Math.atan2(x + gauss() * .35 - B.x, GY - B.y), pw: cl(.8 + gauss() * .07, .45, 1.02), spin: gauss() * .12 }; };
  if (s.phase === 'decide') {
    const o = s.opts; if (!o.length) return endScene({ t: 'POZİSYON BİTTİ', s: '', c: '#d8e2dc' }, 0); let i = Math.floor(Math.random() * o.length);
    if (smart) { let bv = -1; o.forEach((x, j) => { const v = x.k === 'shot' ? x.p * 1.6 + .05 : x.k === 'pass' ? x.p * (.25 + (x.th || 0)) * .7 : x.k === 'drib' ? x.p * .32 : x.k === 'tk' ? .5 : x.k === 'jockey' ? .35 : x.k === 'lane' ? .3 : x.p ? x.p * .8 : .2; if (v > bv) { bv = v; i = j; } }); }
    else { const sh = o.findIndex(x => x.k === 'shot'); if (sh >= 0 && Math.random() < .5) i = sh; }
    return act(i);
  }
  const corner = () => Math.random() < .5 ? GOAL_L + 1.1 : GOAL_R - 1.1;
  if (s.phase === 'aim') { if (smart && s.shot.kind !== 'fk' && Math.random() < .5) return swipeKick(human(corner(), s.shot.kind)); return aimAt(smart ? corner() : 34 + (Math.random() - .5) * 6.4); }
  if (s.phase === 'hwin' && s.fwin) { if (toGoal(s.ball) > 20 || Math.random() < .5) return step(.05); return smart ? swipeKick(human(corner(), 'shot')) : headAt(corner()); }
  if (s.phase === 'hwin') { if (smart && Math.random() < .5) return swipeKick({ ...human(corner(), 'head'), pw: .8 }); return headAt(smart ? corner() : 34 + (Math.random() - .5) * 6); }
  if (s.phase === 'drun') { const d = s.dfs.filter(d => !d.beat && d.y - s.me.y > 0).sort((a, b) => a.y - b.y)[0]; if (d && d.y - s.me.y < (smart ? 3.5 : 6) && Math.abs(d.x - s.me.x) < 1.6 && Math.random() < (smart ? .5 : .25)) drunSide(d.x > s.me.x ? -1 : 1); return step(.05); }
  if (s.phase === 'contact') { const sh = SHOTK[s.ct.k.kind]; return contactHit(gauss() * (smart ? .28 : .5), (sh ? -.15 : 0) + gauss() * (smart ? .25 : .5), gauss() * (smart ? .3 : .6)); }
  if (s.phase === 'icpt') { const ic = s.ic; if (!ic.mt) { const dx = ic.to.x - ic.from.x, dy = ic.to.y - ic.from.y, L2 = dx * dx + dy * dy, t = cl(((s.me.x - ic.from.x) * dx + (s.me.y - ic.from.y) * dy) / L2, .15, .9); ic.mt = { x: ic.from.x + dx * t + gauss() * (smart ? 1 : 2.2), y: ic.from.y + dy * t + gauss() * (smart ? 1 : 2.2) }; } return step(.05); }
  if (s.phase === 'meter') {
    const m = s.meter; if (smart) { const target = cl(m.c + gauss() * m.w * .6, 0, 1), ph = Math.asin(target * 2 - 1) + Math.PI / 2; s.at = m.t0 + ph / Math.PI / m.sp; } else s.at = s.meter.t0 + Math.random() * 3;
    return fireTackle();
  }
}
/* her kare */
function step(dt) {
  if (!S) return; S.t += dt;
  if (S.phase === 'meter' && S.at - S.meter.t0 > 4.5) { fireTackle(); return; }
  if (S.phase === 'fly' || S.phase === 'hwin') {
    S.at += dt; const ev = flyStep(S.fw, dt * (S.phase === 'hwin' ? PH.SLOW : PH.TS));
    if (S.trail) { S.trail.push({ x: S.ball.x, y: S.ball.y, z: S.ball.z }); if (S.trail.length > 18) S.trail.shift(); }
    if (ev) return resolveFly(ev);
    if (S.phase === 'hwin' && !S.fwin && S.t - S.hwT > 3.2) headAt(34 + (Math.random() - .5) * 5);
    return;
  }
  if (S.phase === 'cross') { S.at += dt; if (S.at > .45) startCross(); return; }
  if (S.phase === 'contact') { S.at += dt; if (S.ct && S.t - S.ct.t0 > S.ct.dur * 1.15) contactHit(9, 9, 9); return; }
  if (S.phase === 'icpt') { S.at += dt; return icptTick(dt); }
  if (S.phase === 'drun') { S.at += dt; return drunTick(dt); }
  if (S.phase === 'meter' || S.phase === 'anim' || S.anims.length) runAnims(dt);
  else S.at += dt;
  if (S && S.phase === 'decide' && S.mode === 'atk' && !S.drag) liveTick(dt);
}
/* ---------- CANLI OYUN (NSS gibi): top sendeyken zaman ağır akar, rakipler üstüne gelir ---------- */
function liveTick(dt) {
  const s = S; if (s.mode !== 'atk' || s.dead || s.type === 'pen' || s.ball.owner !== s.me) return;
  const h = dt * PH.LIVE, me = s.me; s.lt = (s.lt || 0) + dt;
  const mv = (p, tx, ty, sp) => { const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy); if (L > .05) { const m = Math.min(L, sp * h); p.x += dx / L * m; p.y += dy / L * m; } };
  s.P.forEach(p => { if (p.down > 0 && !p.gk) p.down = Math.max(0, p.down - dt * .35); });
  const ops = s.P.filter(p => p.side === 'th' && !p.gk && !p.wallP && !(p.down > 0)).sort((a, b) => dist(a, me) - dist(b, me));
  ops.forEach((p, i) => {
    if (i === 0) mv(p, me.x, me.y + .5, 2.6 * (p.r / 72) * Math.pow(s.df, .3));
  });
  attach();
  const q = ops[0]; if (q && dist(q, me) < 1.05) liveTackle(q);
}
function liveTackle(q) {
  const s = S, me = s.me, ab = st('tek') * .6 + st('hiz') * .4 + (hasPerk('calim') ? 6 : 0), win = cl(.52 + (q.r - ab) / 90 + (s.df - 1) * .5 - mood(), .15, .88);
  if (Math.random() < win) {
    const box = me.y > 88.5 && Math.abs(me.x - 34) < 20;
    if (Math.random() < .14) { s.msg = box ? 'Faul! Hakem penaltıyı gösterdi!' : 'Faul! Serbest vuruş kazandın.'; if (box) return toSetPiece('pen'); if (toGoal(me) < 32) return toSetPiece('fk'); }
    M.my.bad++; s.ball.owner = q; attach(); return endScene({ t: 'TOP KAPILDI', s: `${short(q.n)} ayağından aldı`, c: '#d8e2dc' }, 0);
  }
  q.down = 1; q.x += (q.x < me.x ? -1.3 : 1.3); q.y -= 1; M.my.ok++; s.msg = `${short(q.n)} kaydı, sıyrıldın!`; drawUIControls();
}
/* ============================================================
   NSS VURUŞU: 1) sapan gibi geri çek (yön + güç)  2) topun neresine
   vuracağını seç: yuvarlanan topa dokun. Üst = alçak ve sert,
   alt = havalı, sağ/sol = falso. Zamanlama gücü belirler; topu
   ıskalarsan vuruş bozulur. (New Star Soccer'ın iki aşamalı vuruşu)
   ============================================================ */
const CT_DUR = 1.25;
function startContact(k) {
  const s = S; if (!s) return; s.drag = null;
  const sk = kSkill(k.kind, s.me), head = k.kind === 'head';
  s.ct = { k, t0: s.t, dur: CT_DUR / Math.pow(s.df, .35) * (1 + (sk - 70) / 220) * (head ? .8 : 1), R: cl(.105 + (sk - 70) / 900, .08, .14), b: Math.random() * 6, head };
  s.phase = 'contact'; s.msg = head ? 'Topa doğru anda dokun!' : 'Topun neresine vuracaksın? Yuvarlanan topa dokun: üst = alçak, alt = havalı, yan = falso.';
  drawUIControls();
}
/* panel geometrisi (ekran) */
function ctGeo() { const W = CV.W, H = CV.H, ph = Math.min(H * .36, 170), py = H - ph - 10; return { x0: 12, x1: W - 12, y0: py, y1: py + ph, cx: W / 2, gy: py + ph * .78, R: S.ct.R * W }; }
function ctBall(t) {
  const c = S.ct, G = ctGeo(), u = cl((t - c.t0) / c.dur, 0, 1.15), x = G.x0 - G.R + (G.x1 - G.x0 + 2 * G.R) * u;
  const bounce = Math.abs(Math.sin(u * Math.PI * 2.2 + c.b)) * (G.gy - G.y0 - G.R * 2.2) * .55 * (1 - u * .4);
  return { x, y: G.gy - G.R - bounce, u, rot: u * 14 };
}
function contactTap(px, py) {
  const s = S; if (!s || s.phase !== 'contact') return;
  const b = ctBall(s.t), G = ctGeo(), ox = (px - b.x) / G.R, oy = (py - b.y) / G.R;
  contactHit(ox, oy, (b.x - G.cx) / ((G.x1 - G.x0) / 2));
}
/* ox: -1 sol .. 1 sağ, oy: -1 üst .. 1 alt, te: zamanlama (0 = tam ortada) */
function contactHit(ox, oy, te) {
  const s = S, c = s.ct; if (!c) return; s.ct = null; const k = { ...c.k }, miss = Math.hypot(ox, oy) > 1.08 || Math.abs(te) > 1.05;
  const tm = Math.min(1, Math.abs(te));
  if (miss) {
    k.pw = (k.pw || .5) * rf(.25, .5); k.ang += gauss() * .25; k.spin = gauss() * .4; k.zt = k.zt != null ? rf(0, .6) : null; k.vz = null; k.loft = 0; k.assist = 1; k.volley = 1;
    s.msg = c.head ? 'Kafayı tam vuramadın!' : 'Topu ıskaladın, vuruş bozuldu!';
  } else {
    oy = cl(oy, -1, 1); ox = cl(ox, -1, 1);
    k.pw = (k.pw || .6) * (1 - tm * tm * .35); k.ang += gauss() * .05 * tm + ox * .04; k.mis = tm;
    if (!c.head) k.spin = (k.spin || 0) * .3 - ox * 1.25;
    if (k.vz != null) k.vz += oy * 2.6;
    else if (k.zt != null) k.zt = cl(k.zt + oy * 1.7 - (oy < -.3 ? .2 : 0), .12, 3.4);
    else k.loft = cl((k.loft || 0) + Math.max(0, oy) * .62, 0, .75);
    if (oy > .35 && k.kind === 'shot' && toGoal(s.ball) < 20 && s.gk && toGoal(s.gk) > 2) { k.kind = 'chip'; k.zt = null; k.loft = .55 + oy * .25; k.pw *= .62; }
    s.msg = tm < .15 ? 'Tam zamanında!' : tm < .45 ? '' : 'Geç kaldın, güç kaçtı';
    if (Math.abs(ox) > .45 && !c.head) s.msg = (s.msg ? s.msg + ' ' : '') + 'Falsolu!';
  }
  if (c.head) return doHeader(k);
  kickNow(k);
}
function drawContact(x, W, H) {
  const c = S.ct; if (!c) return; const G = ctGeo(), b = ctBall(S.t);
  x.fillStyle = 'rgba(6,10,12,.86)'; rr(x, G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0, 14); x.fill();
  const gg = x.createLinearGradient(0, G.gy - 10, 0, G.y1); gg.addColorStop(0, '#2b7035'); gg.addColorStop(1, '#1b4d24'); x.fillStyle = gg; rr(x, G.x0 + 6, G.gy, G.x1 - G.x0 - 12, G.y1 - G.gy - 6, 8); x.fill();
  x.strokeStyle = 'rgba(232,196,104,.6)'; x.setLineDash([5, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(G.cx, G.y0 + 10); x.lineTo(G.cx, G.y1 - 8); x.stroke(); x.setLineDash([]);
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(b.x, G.gy + 4, G.R * .9, G.R * .22, 0, 0, 7); x.fill();
  /* top: büyük, dönen, panel dokunma bölgeleri ince çizgilerle */
  x.save(); x.translate(b.x, b.y);
  const gr = x.createRadialGradient(-G.R * .35, -G.R * .4, G.R * .15, 0, 0, G.R); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b9c0c4'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, G.R, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(0, 0, G.R, 0, 7); x.clip(); x.rotate(b.rot); x.fillStyle = '#222';
  for (let i = 0; i < 6; i++) { const a = i * 1.047, d = i ? G.R * .62 : 0; x.beginPath(); for (let j = 0; j < 5; j++) { const aa = j * 1.2566 + a, rr2 = G.R * .2; const X = Math.cos(a) * d + Math.cos(aa) * rr2, Y = Math.sin(a) * d + Math.sin(aa) * rr2; j ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.fill(); }
  x.restore();
  x.strokeStyle = 'rgba(232,196,104,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-G.R, 0); x.lineTo(G.R, 0); x.moveTo(0, -G.R); x.lineTo(0, G.R); x.stroke();
  x.restore();
  x.fillStyle = '#e8c468'; x.font = '700 11px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top';
  if (!c.head) { x.fillText(T('ÜST: ALÇAK VE SERT'), G.cx, G.y0 + 8); x.textBaseline = 'bottom'; x.fillText(T('ALT: HAVALI · YAN: FALSO'), G.cx, G.y1 - 4); }
  else { x.fillText(T('DOKUN: KAFA!'), G.cx, G.y0 + 8); }
  x.textAlign = 'left';
}

/* ============================================================
   NSS SAVUNMASI: rakip pas atar, top yavaş akar; oyuncunu
   pas yoluna SÜRÜKLE (ya da dokun), oraya koşar. Yetişirsen keser.
   Hızın (pace) ne kadar yüksekse o kadar çok pas kesersin.
   ============================================================ */
const IC_TS = .42;
function icptStart() {
  const s = S, car = s.carrier, sups = s.P.filter(p => p.sup);
  const tgt = sups.sort((a, b) => toGoal(a) - toGoal(b))[0] || car;
  const run = { x: cl(tgt.x + (34 - tgt.x) * .35, 8, 60), y: Math.min(98, tgt.y + R(5, 9)) };
  s.ic = { from: { x: car.x, y: car.y }, to: run, rec: tgt, t: 0, wait: 1.8, v: 14 * Math.pow(s.df, .25), go: null, mt: null, step: (s.ic ? s.ic.step : 0) + 1 };
  s.ball.owner = car; attach(); s.phase = 'icpt';
  s.msg = s.ic.step === 1 ? 'Rakip pas atmak üzere! Oyuncunu pas yoluna SÜRÜKLE ya da yola dokun: oraya koşar.' : 'Bir pas daha geliyor, yolu kes!';
  drawUIControls();
}
/* yetişebileceğin en erken kesme noktası (öneri ve test botu için) */
function icBest() {
  const s = S, ic = s.ic, me = s.me, L = Math.hypot(ic.to.x - ic.from.x, ic.to.y - ic.from.y), mv = (6.4 + (st('hiz') - 60) / 12) * 1.6;
  for (let t = .08; t <= .98; t += .03) { const x = ic.from.x + (ic.to.x - ic.from.x) * t, y = ic.from.y + (ic.to.y - ic.from.y) * t, bt = Math.max(0, ic.wait - ic.t) / IC_TS + t * L / ic.v - (ic.go ? ic.d / ic.v : 0), mt = Math.max(0, Math.hypot(x - me.x, y - me.y) - 1) / mv; if (mt <= bt * .85) return { x, y, t }; }
  return { x: ic.to.x, y: ic.to.y, t: 1 };
}
function icptAim(px, py) { const s = S; if (!s || s.phase !== 'icpt') return; const w = unprojG(px, py); if (!w) return; s.ic.mt = { x: cl(w.x, 1, 67), y: cl(w.y, 1, 104) }; }
function icptTick(dt) {
  const s = S, ic = s.ic, me = s.me, h = dt * IC_TS, B = s.ball; ic.t += dt;
  const mv = (p, t, sp) => { const dx = t.x - p.x, dy = t.y - p.y, L = Math.hypot(dx, dy); if (L > .05) { const m = Math.min(L, sp * h); p.x += dx / L * m; p.y += dy / L * m; } };
  if (ic.mt) mv(me, ic.mt, (6.4 + (st('hiz') - 60) / 12) * 1.6 * (hasPerk('kesici') ? 1.08 : 1));
  ic.rec && mv(ic.rec, ic.to, 4.6 * Math.pow(s.df, .2));
  if (ic.t < ic.wait) return;
  if (!ic.go) { ic.go = 1; B.owner = null; B.x = ic.from.x; B.y = ic.from.y; const L = Math.hypot(ic.to.x - B.x, ic.to.y - B.y); ic.ux = (ic.to.x - B.x) / L; ic.uy = (ic.to.y - B.y) / L; ic.L = L; ic.d = 0; s.trail = []; }
  const x0 = B.x, y0 = B.y; ic.d += ic.v * h; B.x = ic.from.x + ic.ux * Math.min(ic.d, ic.L); B.y = ic.from.y + ic.uy * Math.min(ic.d, ic.L); B.z = 0;
  s.trail && (s.trail.push({ x: B.x, y: B.y, z: 0 }), s.trail.length > 14 && s.trail.shift());
  const reach = 1.2 + (st('def') - 60) / 140;
  if (segD(me, x0, y0, B.x, B.y) < reach) {
    const p = cl(.88 + (st('def') - 65) / 220 - (s.df - 1) * .3 - Math.max(0, ic.v - 13) * .02, .6, .98);
    if (Math.random() < p) { M.my.ok++; M.my.tk++; B.owner = me; attach(); M.feed.unshift({ m: s.min, t: 'Pası kestin!', k: 'good' }); return chainScene('build', 'Pası kestin! Şimdi oyunu kur: arkadaşına pas ver.'); }
    ic.v *= .6; s.msg = 'Dokundun ama top sekti…';
  }
  if (ic.d >= ic.L) {
    const r = ic.rec; r.x = B.x; r.y = B.y - .4; B.owner = r; attach(); s.carrier.car = 0; r.car = 1; r.sup = 0; s.carrier = r;
    if (toGoal(r) < 24 || ic.step >= 2) { M.my.bad++; s.phase = 'anim'; return oppShot(1); }
    s.P.forEach(p => { if (p.side === 'th' && !p.gk && p !== r) p.sup = 1; });
    icptStart();
  }
}
/* ============================================================
   NSS ZİNCİRİ: pas kesme → orta saha pası → çalım koşusu → hücum.
   Başarılı olursan bir sonraki ana geçersin, başarısızsan maç akar.
   ============================================================ */
function chainScene(type, msg) {
  const mo = { ...S.mo, type }, n = S.n, ch = (S.chain || 0) + 1, tr = S.trail;
  mkScene(mo); S.n = n; S.chain = ch; S.chained = ch >= 3; if (msg) S.msg = msg; drawUIControls();
}
/* pas puanı: NSS gibi uzunluğa göre */
function passRate(W, who) {
  const d = Math.hypot(who.x - W.from.x, who.y - W.from.y), fwd = who.y - W.from.y;
  const r = fwd < -2 || d < 15 ? 0 : d < 20 ? 1 : d < 30 ? 2 : 3, L = ['Basit pas', 'İyi pas', 'Harika pas!', 'Muhteşem pas!!'][r];
  M.my.ok += r ? r : 0; M.feed.unshift({ m: S.min, t: `${L} (${Math.round(d)} m)`, k: r ? 'good' : 'mut' }); S.distL = { d, t: S.t }; flash(['PAS', 'İYİ PAS', 'HARİKA PAS!', 'MUHTEŞEM PAS!!'][r]); S.msg = `${L} · ${Math.round(d)} m`; return r;
}
function chainAfterPass(pr, who) {
  const s = S, drib = (st('tek') + st('hiz')) / 2 + (hasPerk('calim') ? 8 : 0);
  if (Math.random() < cl(.35 + (drib - 60) / 60, .2, .8)) return chainScene('drib', `${s.msg}. Top yine sende, şimdi çalım koşusu!`);
  if (Math.random() < .5) return chainScene('atk', `${s.msg}. Hücum başlıyor!`);
  return endScene({ t: pr >= 2 ? 'HARİKA PAS!' : pr ? 'İYİ PAS' : 'BASİT PAS', s: `${short(who.n)} topla buluştu`, c: '#bde5c8' }, 1);
}
/* ÇALIM KOŞUSU: oyuncu topla ileri koşar, önüne 4 rakip çıkar. Sağa/sola dokunarak sıyrıl. */
function mkDrib(s, mk, pick, DF_, usSq, meD) {
  const x0 = R(22, 46), y0 = R(42, 52);
  s.me = mk(x0, y0, 'us', meD, { me: 1 }); s.ball.owner = s.me; s.lane = x0;
  s.dfs = []; for (let i = 0; i < 4; i++) { const side = i % 2 ? 1 : -1; s.dfs.push(mk(cl(x0 + side * rf(.5, 2.5), 8, 60), y0 + 9 + i * 8.5, 'th', pick(DF_.length ? DF_ : usSq, i + 1), { dd: 1 })); }
  mk(cl(x0 + 14, 8, 60), y0 + 4, 'us', pick(usSq, 1), { mate: 1 }); mk(cl(x0 - 14, 8, 60), y0 + 2, 'us', pick(usSq, 2), { mate: 1 });
  s.phase = 'drun'; s.mode = 'atk'; s.dv = 5.2 + (st('hiz') - 60) / 12; s.cam = { x: x0, y: y0 + 10 };
  s.hint = 'Çalım koşusu! Oyuncun topla ileri koşuyor. Rakip önüne çıkınca ekranın SOLUNA ya da SAĞINA dokun (ya da kaydır): o yana sıyrılırsın. Doğru anda yaparsan rakip ters yöne gider.';
  attach(); return s;
}
function drunSide(dir) {
  const s = S; if (!s || s.phase !== 'drun') return; s.lane = cl(s.me.x + dir * 2.6, 6, 62);
  const near = s.dfs.filter(d => !d.beat && d.y - s.me.y > 0 && d.y - s.me.y < 4.5)[0];
  if (near && Math.random() < cl(.3 + (st('tek') - 60) / 90 + (hasPerk('calim') ? .1 : 0) - (s.df - 1) * .4, .1, .75)) { near.fooled = .6; near.fx = near.x - dir * 2.5; s.msg = `Çalım! ${short(near.n)} ters yöne gitti`; drawUIControls(); }
}
function drunTick(dt) {
  const s = S, me = s.me, h = dt * .75; me.y += s.dv * h; const dx = s.lane - me.x; me.x += Math.sign(dx) * Math.min(Math.abs(dx), 7.5 * h); attach();
  for (const d of s.dfs) {
    if (d.beat) continue; const dy = d.y - me.y;
    if (dy < -1.2) { d.beat = 1; M.my.ok++; s.msg = `${short(d.n)} geride kaldı!`; drawUIControls(); continue; }
    if (dy < 7) { const tx = d.fooled > 0 ? d.fx : me.x; if (d.fooled > 0) d.fooled -= dt; const ddx = tx - d.x; d.x += Math.sign(ddx) * Math.min(Math.abs(ddx), 3.3 * (d.r / 72) * Math.pow(s.df, .3) * h); d.y -= 1.2 * h; }
    if (Math.abs(d.x - me.x) < .95 && Math.abs(d.y - me.y) < 1) {
      const p = cl(.72 + (d.r - st('tek')) / 100 + (s.df - 1) * .4 - (d.fooled > 0 ? .4 : 0), .3, .95);
      if (Math.random() < p) { M.my.bad++; s.ball.owner = d; attach(); return endScene({ t: 'TOP KAPILDI', s: `${short(d.n)} önünü kesti`, c: '#d8e2dc' }, 0); }
      d.beat = 1; d.down = 1; M.my.ok++; s.msg = `${short(d.n)} kaydı, sıyrıldın!`; drawUIControls();
    }
  }
  if (s.dfs.every(d => d.beat) || me.y > 84) {
    M.feed.unshift({ m: s.min, t: 'Çalım koşusu: savunmayı geçtin!', k: 'good' });
    s.dfs.forEach(d => d.down = 3); s.type = 'one'; s.n = Math.max(s.n, 4); s.msg = 'Savunmayı geçtin! Şimdi bitir.'; decideAtk(); drawUIControls();
  }
}
function meterVal() { const m = S.meter, t = (S.at - m.t0) * m.sp; return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2; }
function toggleAir() { if (!S) return; S.air = !S.air; try { localStorage.setItem('mfc_air', S.air ? '1' : ''); } catch (e) { } drawUIControls(); }

/* ---------- Girdi: dokun (yardımlı) ya da kaydır (serbest vuruş) ---------- */
const canSwipe = () => S && S.mode === 'atk' && ['decide', 'aim', 'hwin'].includes(S.phase);
/* ekrandaki noktaya en yakın seçenek (3B izdüşümüyle) */
function tapAt(px, py) {
  if (S.phase === 'meter') return fireTackle();
  const gp = unprojY(px, py, GY), onGoal = gp && Math.abs(gp.x - 34) < 7 && gp.z > -1 && gp.z < 4;
  if (S.phase === 'hwin') { if (onGoal) return headAt(gp.x); return; }
  if (S.phase === 'aim') { if (onGoal) return aimAt(gp.x); return; }
  if (S.phase !== 'decide') return;
  if (onGoal) { const i = S.opts.findIndex(o => o.k === 'shot'); if (i >= 0) { act(i); return aimAt(gp.x); } }
  let bi = -1, bd = 46;
  S.opts.forEach((o, i) => {
    let q = null; if (o.who) q = P3(o.who.x, o.who.y, .9); else if (o.k === 'drib' && 0) q = P3(S.me.x + Math.sin(o.ang) * 5, S.me.y + Math.cos(o.ang) * 5, 0); else if (o.k === 'jockey' || o.k === 'tk') q = S.carrier && P3(S.carrier.x, S.carrier.y, .9);
    if (!q) return; const d = Math.hypot(q.X - px, q.Y - py); if (d < bd) { bd = d; bi = i; }
  });
  if (bi >= 0) act(bi);
}
function bindInput(cv) {
  const pos = ev => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top, performance.now()]; };
  cv.onpointerdown = ev => { if (!S) return; const q = pos(ev); ev.preventDefault(); if (S.phase === 'contact') return contactTap(q[0], q[1]); if (S.phase === 'drun') return drunSide(q[0] < CV.W / 2 ? -1 : 1); if (S.phase === 'icpt') { S.icDrag = 1; return icptAim(q[0], q[1]); } try { cv.setPointerCapture(ev.pointerId); } catch (e) { } S.drag = { pts: [q], prev: null }; };
  cv.onpointermove = ev => {
    if (S && S.icDrag && S.phase === 'icpt') { const q = pos(ev); return icptAim(q[0], q[1]); }
    if (!S || !S.drag) return; S.drag.pts.push(pos(ev)); if (S.drag.pts.length > 80) S.drag.pts.splice(1, 1);
    const d = S.drag, a = d.pts[0], b = d.pts[d.pts.length - 1];
    if (canSwipe() && Math.hypot(b[0] - a[0], b[1] - a[1]) > 16) { d.sp = swipeParams(d); d.k = swipeKindK(d.sp); d.prev = previewPath(d.k); } else { d.sp = d.k = d.prev = null; }
  };
  const up = ev => {
    if (S) S.icDrag = 0; if (!S || !S.drag) return; const d = S.drag; S.drag = null; d.pts.push(pos(ev));
    const a = d.pts[0], b = d.pts[d.pts.length - 1];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 16) return tapAt(a[0], a[1]);
    if (canSwipe()) swipeKick(swipeParams(d));
  };
  cv.onpointerup = up; cv.onpointercancel = () => { if (S) S.drag = null; };
}

/* ---------- Görüntü: 3B yayın kamerası (oyuncunun arkasından, kaleye doğru) ---------- */
let CV = { W: 360, H: 420, dpr: 1, F: 400 };
let PR = { cx: 34, cy: 40, cz: 20, sp: .6, cp: .8 };
const PITCH_A = .5;
/* kamera: topun arkasında; kaleye yakınken top ekranın altında, kale üstte kalacak kadar uzaklaşır */
function camFit(x, by, Yb, gy, Yg, d0) {
  const save = PR; let best = null;
  for (let dist = d0 || 12; dist <= 80; dist += 1.5) {
    let lo = by - 40, hi = by + 60;
    for (let i = 0; i < 18; i++) { const ty = (lo + hi) / 2; PR = mkPR(x, ty, dist); const v = P3(x, by, 0); if (!v || v.Y > Yb) hi = ty; else lo = ty; }
    const ty = (lo + hi) / 2; PR = mkPR(x, ty, dist);
    if (gy == null) { best = { x, ty, dist }; break; }
    const v = P3(34, gy, 2.6); if (v && v.Y >= Yg) { best = { x, ty, dist }; break; }
    best = { x, ty, dist };
  }
  PR = save; return best;
}
function mkPR(x, ty, dist) { const sp = Math.sin(PITCH_A), cp = Math.cos(PITCH_A); return { cx: x, cy: ty - cp * dist, cz: sp * dist, sp, cp }; }
function camWant() {
  const B = S.ball, me = S.me, H = CV.H;
  const goalMode = S.mode !== 'atk' || toGoal(me) < 46 || ['aim', 'hwin', 'cross'].includes(S.phase) || (S.phase === 'fly' && B.vy > 0 && toGoal(B) < 50);
  const hd = S.phase === 'cross' || S.phase === 'hwin' || (S.phase === 'fly' && S.fw && S.fw.cross);
  const ny = hd ? me.y - 4 : Math.min(B.y, me.y, S.mode === 'def' && S.carrier ? S.carrier.y : 999), nx = hd || ny === me.y ? me.x : B.x;
  if (goalMode) return camFit(nx * .7 + 34 * .3, ny, H * .8, GY + 2, H * .16);
  return camFit(B.x, B.y, H * .7, null, null, 19);
}
function camSet(dt) {
  const w = camWant(), c = S.cam, k = Math.min(1, dt * 2.4);
  if (c.dist == null) Object.assign(c, w);
  c.x += (w.x - c.x) * k; c.ty += (w.ty - c.ty) * k; c.dist += (w.dist - c.dist) * k;
  camBasis();
}
function camBasis() { const c = S.cam; if (c.dist == null) Object.assign(c, camWant()); PR = mkPR(c.x, c.ty, c.dist); }
/* dünya → ekran */
function P3(x, y, z) {
  const dx = x - PR.cx, dy = y - PR.cy, dz = z - PR.cz, zc = dy * PR.cp - dz * PR.sp; if (zc < .6) return null;
  const yc = dy * PR.sp + dz * PR.cp, s = CV.F / zc; return { X: CV.W / 2 + dx * s, Y: CV.H / 2 - yc * s, s };
}
/* ekran → dünyada ışın */
function ray(px, py) { const a = (px - CV.W / 2) / CV.F, b = -(py - CV.H / 2) / CV.F; return { x: a, y: PR.sp * b + PR.cp, z: PR.cp * b - PR.sp }; }
function unprojG(px, py) { const r = ray(px, py); if (r.z > -1e-3) return null; const t = -PR.cz / r.z; return { x: PR.cx + r.x * t, y: PR.cy + r.y * t }; }
function unprojY(px, py, Y) { const r = ray(px, py); if (r.y < 1e-3) return null; const t = (Y - PR.cy) / r.y; return { x: PR.cx + r.x * t, z: PR.cz + r.z * t }; }
const toWorld = (px, py) => unprojG(px, py) || { x: 34, y: 105 };
/* kaydırmayı vuruşa çevir: yön, topun ekrandaki yerinde yerel izdüşümle dünyaya taşınır */
function swipeParams(d) {
  /* sapan: parmağı geri çekersin, top ters yöne gider */
  const p0 = d.pts[0], p1 = d.pts[d.pts.length - 1], vx = p0[0] - p1[0], vy = p0[1] - p1[1], L = Math.hypot(vx, vy) || 1e-6;
  const B = S.phase === 'hwin' ? S.me : S.ball, bs = P3(B.x, B.y, 0) || { X: CV.W / 2, Y: CV.H * .8 };
  let ang = Math.atan2(vx, -vy);
  for (const st of [24, 10, 4]) { const a = unprojG(bs.X, bs.Y), b = unprojG(bs.X + vx / L * st, bs.Y + vy / L * st); if (a && b && Math.hypot(b.x - a.x, b.y - a.y) > 1e-3) { ang = Math.atan2(b.x - a.x, b.y - a.y); break; } }
  return { ang, pw: cl(L / (CV.W * .5), .05, 1.06), spin: 0, sx: vx / L, sy: vy / L };
}

/* sahne nesneleri: tribün seyircileri (bir kez üretilir) */
function crowd() {
  if (S.crowd) return S.crowd; const L = [], cols = [M.T.us.c[0], M.T.th.c[0], '#d8d2c4', '#3a4250', '#8b8f99', '#c9b48a'];
  for (let i = 0; i < 520; i++) { const side = i % 4; L.push(side < 2 ? { w: 'b', x: rf(-14, 82), z: rf(.6, 10.5), c: P(cols) } : { w: side === 2 ? 'l' : 'r', y: rf(40, 114), z: rf(.6, 8), c: P(cols) }); }
  return S.crowd = L;
}
const GC = { k: ['#2b7035', '#266530'], n: ['#174a24', '#14421f'], r: ['#6b7a44', '#5f6e3c'], s: ['#e2e8e5', '#d6dedb'], w: ['#24602f', '#205529'] };
function polyW(x, pts, fill, stroke) { const q = pts.map(p => P3(p[0], p[1], p[2] || 0)); if (q.some(v => !v)) return false; x.beginPath(); q.forEach((v, i) => i ? x.lineTo(v.X, v.Y) : x.moveTo(v.X, v.Y)); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.stroke(); } return true; }
function lineW(x, pts) { let open = false; x.beginPath(); pts.forEach(p => { const v = P3(p[0], p[1], p[2] || 0); if (!v) { open = false; return; } if (open) x.lineTo(v.X, v.Y); else { x.moveTo(v.X, v.Y); open = true; } }); x.stroke(); }
const arcPts = (cx, cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
function drawPitch(x, W, H) {
  const pt = typeof acct === 'function' ? acct().pitch : 'klasik', snow = S.wx === 'kar', wet = S.wx === 'yagmur', night = pt === 'gece', retro = pt === 'retro';
  const gc = snow ? GC.s : retro ? GC.r : night ? GC.n : wet ? GC.w : GC.k;
  /* gökyüzü / stadyum karanlığı */
  const sky = x.createLinearGradient(0, 0, 0, H * .5); sky.addColorStop(0, night ? '#05070d' : '#1a2433'); sky.addColorStop(1, night ? '#0e1420' : '#2c3a4c'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
  const gb = unprojG(CV.W / 2, CV.H + 4), yNear = Math.max(PR.cy - PR.cz * PR.sp / PR.cp + .8 / PR.cp, gb ? gb.y - 3 : -50);
  /* tribünler */
  polyW(x, [[-16, 113, 0], [84, 113, 0], [84, 113, 12], [-16, 113, 12]], night ? '#141a26' : '#222b38');
  polyW(x, [[-9, yNear, 0], [-9, 114, 0], [-9, 114, 9], [-9, yNear, 9]], night ? '#10151f' : '#1d2531');
  polyW(x, [[77, yNear, 0], [77, 114, 0], [77, 114, 9], [77, yNear, 9]], night ? '#10151f' : '#1d2531');
  crowd().forEach(c => { const v = c.w === 'b' ? P3(c.x, 113, c.z) : c.y > yNear ? P3(c.w === 'l' ? -9 : 77, c.y, c.z) : null; if (!v) return; const r = cl(v.s * .22, .8, 2.6); x.fillStyle = c.c; x.fillRect(v.X - r, v.Y - r * 1.4, r * 2, r * 2.2); });
  /* reklam panoları */
  polyW(x, [[-6, 110.5, 0], [74, 110.5, 0], [74, 110.5, .9], [-6, 110.5, .9]], '#0f3b5c');
  /* zemin: çim çevresi + şeritler */
  polyW(x, [[-9, yNear, 0], [77, yNear, 0], [77, 114, 0], [-9, 114, 0]], snow ? '#c9d3cf' : '#1d5428');
  for (let k = 0; k < 22; k++) { let y1 = k * 5.25, y2 = y1 + 5.25; if (y2 < yNear) continue; y1 = Math.max(y1, yNear); polyW(x, [[0, y1], [68, y1], [68, y2], [0, y2]], gc[k % 2]); }
  /* çizgiler */
  x.strokeStyle = snow ? 'rgba(40,60,90,.7)' : 'rgba(255,255,255,.88)'; x.lineWidth = 2;
  const R = (a, b, c, d) => lineW(x, [[a, b], [c, b], [c, d], [a, d], [a, b]].map(p => p).filter((p, i, A) => true));
  const clampY = p => [p[0], Math.max(p[1], yNear)];
  lineW(x, [[0, Math.max(0, yNear)], [0, 105], [68, 105], [68, Math.max(0, yNear)]]);
  if (52.5 > yNear) lineW(x, [[0, 52.5], [68, 52.5]]);
  lineW(x, arcPts(34, 52.5, 9.15, 0, Math.PI * 2, 40).filter(p => p[1] > yNear));
  lineW(x, [[13.84, 105], [13.84, 88.5], [54.16, 88.5], [54.16, 105]].map(clampY));
  lineW(x, [[24.84, 105], [24.84, 99.5], [43.16, 99.5], [43.16, 105]]);
  lineW(x, arcPts(34, 94, 9.15, -Math.PI * .8, -Math.PI * .2, 16).map(p => [p[0], 2 * 94 - p[1]]).filter(p => p[1] < 88.5));
  const ps = P3(34, 94, 0); if (ps) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ps.X, ps.Y, Math.max(1.5, ps.s * .12), Math.max(1, ps.s * .07), 0, 0, 7); x.fill(); }
  void R;
}
/* kale: ağ ve direkler (ağ dalgalanması gol anında) */
function drawGoal(x, front) {
  const L = GOAL_L, Rr = GOAL_R, Hh = 2.44, D = 2.2, bul = S.net != null && S.t - S.net < 1.4 ? (1 - (S.t - S.net) / 1.4) * .9 : 0, bx = S.ball.x;
  const back = (xx, z) => [xx, GY + D + bul * Math.max(0, 1 - Math.abs(xx - bx) / 3) * (z < 1.6 ? 1 : .5), z];
  if (!front) {
    x.lineWidth = 1;
    polyW(x, [back(L, 0), back(Rr, 0), back(Rr, 2), back(L, 2)], 'rgba(255,255,255,.07)');
    polyW(x, [[L, GY, Hh], [Rr, GY, Hh], back(Rr, 2), back(L, 2)], 'rgba(255,255,255,.05)');
    x.strokeStyle = 'rgba(255,255,255,.28)';
    for (let i = 0; i <= 14; i++) { const xx = L + (Rr - L) * i / 14; lineW(x, [[xx, GY, Hh], back(xx, 2), back(xx, 0)]); }
    for (let j = 0; j <= 5; j++) { const z = 2 * j / 5; lineW(x, [back(L, z), ...Array.from({ length: 9 }, (_, i) => back(L + (Rr - L) * (i + 1) / 9, z))]); }
    for (const sx_ of [L, Rr]) for (let j = 0; j <= 4; j++) lineW(x, [[sx_, GY, Hh * j / 4], back(sx_, 2 * j / 4)]);
    return;
  }
  x.strokeStyle = '#ffffff'; x.lineCap = 'round';
  const a = P3(L, GY, 0), b = P3(L, GY, Hh), c = P3(Rr, GY, Hh), d = P3(Rr, GY, 0);
  if (a && b && c && d) { x.lineWidth = Math.max(2.5, a.s * .12); x.beginPath(); x.moveTo(a.X, a.Y); x.lineTo(b.X, b.Y); x.lineTo(c.X, c.Y); x.lineTo(d.X, d.Y); x.stroke(); }
  x.lineCap = 'butt';
}
function drawScene() {
  const cv = $('cv'); if (!cv || !S) return; const x = cv.getContext('2d'); if (!x) return;
  const W = CV.W, H = CV.H; x.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0); camBasis();
  const pt = typeof acct === 'function' ? acct().pitch : 'klasik', retro = pt === 'retro', night = pt === 'gece';
  drawPitch(x, W, H); drawGoal(x, 0);
  if (!S.flashed) { S.flashed = 1; flash(FLASHT[S.type] || 'SIRA SENDE'); }
  /* hedef bölgeleri (kale yüzeyinde) */
  if ((S.phase === 'aim' || S.phase === 'hwin') && S.mode === 'atk') {
    const t = performance.now() / 300; AIMX.forEach((ax, i) => polyW(x, [[ax - 1.15, GY, .05], [ax + 1.15, GY, .05], [ax + 1.15, GY, 2.38], [ax - 1.15, GY, 2.38]], `rgba(232,196,104,${.16 + .08 * Math.sin(t + i)})`));
  }
  if (S.phase === 'decide') drawOpts(x);
  /* izler */
  const dot = (q, r, c) => { const v = P3(q.x, q.y, q.z || 0); if (!v) return; x.fillStyle = c; x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.fill(); };
  if (S.trail && S.trail.length > 1) S.trail.forEach((q, i) => dot(q, 2, `rgba(255,255,255,${i / S.trail.length * .4})`));
  if (S.drag && S.drag.prev) { const d = S.drag; d.prev.forEach((q, i) => { dot({ x: q.x, y: q.y, z: 0 }, 1.6, 'rgba(0,0,0,.28)'); dot(q, 2.8, `rgba(232,196,104,${.95 - i / d.prev.length * .7})`); }); }
  /* gölgeler, sonra uzaktan yakına oyuncular ve top */
  const ents = S.P.map(p => ({ p, y: p.y })); ents.push({ ball: 1, y: S.ball.y });
  ents.forEach(e => { if (e.ball) return; const v = P3(e.p.x, e.p.y, 0); if (!v) return; x.fillStyle = 'rgba(0,0,0,.32)'; x.beginPath(); x.ellipse(v.X + v.s * .25, v.Y, v.s * .55, v.s * .2, 0, 0, 7); x.fill(); });
  const bsh = P3(S.ball.x, S.ball.y, 0); if (bsh) { x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(bsh.X + (S.ball.z || 0) * bsh.s * .15, bsh.Y, Math.max(2, bsh.s * .14), Math.max(1, bsh.s * .06), 0, 0, 7); x.fill(); }
  ents.push({ goal: 1, y: GY + .01 });
  ents.sort((a, b) => b.y - a.y).forEach(e => e.ball ? drawBall(x) : e.goal ? drawGoal(x, 1) : drawPl(x, e.p));
  if (S.phase === 'icpt' && S.ic) { const ic = S.ic; x.strokeStyle = ic.go ? 'rgba(255,107,91,.25)' : 'rgba(255,107,91,.75)'; x.lineWidth = 3; x.setLineDash([8, 7]); lineW(x, [[ic.from.x, ic.from.y, .05], [ic.to.x, ic.to.y, .05]]); x.setLineDash([]); if (ic.mt) { const v = P3(ic.mt.x, ic.mt.y, 0); if (v) { x.strokeStyle = '#e8c468'; x.lineWidth = 2; x.beginPath(); x.ellipse(v.X, v.Y, v.s * .7, v.s * .25, 0, 0, 7); x.stroke(); } } }
  if (S.phase === 'meter') drawMeter(x, W, H);
  if (S.phase === 'contact') drawContact(x, W, H);
  if (S.phase === 'drun') { x.fillStyle = 'rgba(232,196,104,.85)'; x.font = '700 22px "Barlow Condensed",sans-serif'; x.textBaseline = 'bottom'; x.textAlign = 'left'; x.fillText('◀', 14, H - 14); x.textAlign = 'right'; x.fillText('▶', W - 14, H - 14); x.textAlign = 'center'; x.font = '700 12px "Barlow Condensed",sans-serif'; x.fillText(T('SOLA / SAĞA DOKUN: SIYRIL'), W / 2, H - 16); x.textAlign = 'left'; }
  if (S.drag && S.drag.pts.length > 1 && canSwipe()) drawSwipe(x, W, H);
  x.textAlign = 'center';
  if ((S.phase === 'aim' || S.phase === 'hwin') && S.mode === 'atk') { x.fillStyle = '#e8c468'; x.font = '700 13px "Barlow Condensed",sans-serif'; x.textBaseline = 'top'; x.fillText(T('KALEYE KAYDIR YA DA DOKUN'), W / 2, 34); }
  if (S.phase === 'hwin') { x.fillStyle = 'rgba(10,20,40,.16)'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8c468'; x.font = '700 15px "Barlow Condensed",sans-serif'; x.textBaseline = 'bottom'; x.fillText(T('AĞIR ÇEKİM — ŞİMDİ KAYDIR!'), W / 2, H - 14); }
  x.textAlign = 'left';
  if (S.phase === 'decide' && S.mode === 'atk') { x.fillStyle = 'rgba(232,196,104,.95)'; x.font = '700 12px "Barlow Condensed",sans-serif'; x.textBaseline = 'top'; x.fillText(T('⏸ SIRA SENDE'), 10, 10); }
  if (S.mode === 'atk' && Math.abs(S.wind || 0) > .05 && S.phase !== 'done') { x.fillStyle = 'rgba(216,226,220,.9)'; x.font = '700 12px "Barlow Condensed",sans-serif'; x.textBaseline = 'top'; x.textAlign = 'right'; x.fillText(`${T('RÜZGÂR')} ${S.wind < 0 ? '←' : '→'} ${Math.abs(S.wind * 10).toFixed(0)}`, W - 10, 10); x.textAlign = 'left'; }
  if (retro) { x.fillStyle = 'rgba(0,0,0,.12)'; for (let yy = 0; yy < H; yy += 3) x.fillRect(0, yy, W, 1); }
  if (night) { const gr2 = x.createRadialGradient(W / 2, H * .45, 40, W / 2, H * .45, W); gr2.addColorStop(0, 'rgba(255,250,220,.06)'); gr2.addColorStop(1, 'rgba(0,0,10,.42)'); x.fillStyle = gr2; x.fillRect(0, 0, W, H); }
  weatherFx(x, W, H);
  drawDist(x, W, H); drawFlash(x, W, H);
  if (S.banner) {
    const cy = H * .4; x.save(); x.globalAlpha = .9; x.fillStyle = S.banner.c === '#e8c468' ? '#ffffff' : (S.banner.c || '#fff'); x.font = `800 ${Math.round(W * .1)}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 5; x.fillText(T(S.banner.t), W / 2, cy); x.shadowBlur = 0;
    if (S.banner.c === '#e8c468') { x.fillStyle = '#ffe34d'; for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + S.t; star(x, W / 2 + Math.cos(an) * W * .24, cy + Math.sin(an) * W * .13, 4); } }
    x.restore();
    if (S.banner.s) { x.fillStyle = 'rgba(0,0,0,.5)'; const tw = Math.min(W - 20, x.measureText(T(S.banner.s)).width + 120); rr(x, (W - tw) / 2, cy + 26, tw, 22, 11); x.fill(); x.fillStyle = '#fff'; x.font = `500 13px "Barlow",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(T(S.banner.s), W / 2, cy + 37); }
    x.textAlign = 'left';
  }
}
const pcol = p => p == null ? '#e8c468' : p >= .66 ? '#56c98d' : p >= .4 ? '#e8c468' : '#ff8a6b';
/* seçenekler: yüzde yok; sadece pas çizgisi, sürme oku, kale çerçevesi */
function drawOpts(x) {
  const s = S, me = s.me, t = performance.now() / 400;
  x.lineWidth = 2; x.strokeStyle = 'rgba(232,196,104,.75)';
  s.opts.forEach(o => {
    if (o.who) { const v = P3(o.who.x, o.who.y, 0); if (v) { x.beginPath(); x.ellipse(v.X, v.Y, v.s * (.8 + Math.sin(t) * .06), v.s * .3, 0, 0, 7); x.stroke(); } }
    else if (o.k === 'drib' && 0) { const a = o.ang, p0 = [me.x + Math.sin(a) * 1.4, me.y + Math.cos(a) * 1.4], p1 = [me.x + Math.sin(a) * 6, me.y + Math.cos(a) * 6]; x.lineWidth = 3; x.strokeStyle = 'rgba(189,229,200,.8)'; lineW(x, [p0, p1]); const e1 = P3(p1[0] + Math.sin(a) * 1.2, p1[1] + Math.cos(a) * 1.2, 0), e2 = P3(p1[0] + Math.sin(a + 1.9) * .9, p1[1] + Math.cos(a + 1.9) * .9, 0), e3 = P3(p1[0] + Math.sin(a - 1.9) * .9, p1[1] + Math.cos(a - 1.9) * .9, 0); if (e1 && e2 && e3) { x.fillStyle = 'rgba(189,229,200,.85)'; x.beginPath(); x.moveTo(e1.X, e1.Y); x.lineTo(e2.X, e2.Y); x.lineTo(e3.X, e3.Y); x.fill(); } x.lineWidth = 2; x.strokeStyle = 'rgba(232,196,104,.75)'; }
    else if (o.k === 'shot' && 0) polyW(x, [[GOAL_L - .3, GY, 0], [GOAL_R + .3, GY, 0], [GOAL_R + .3, GY, 2.7], [GOAL_L - .3, GY, 2.7]], null, `rgba(232,196,104,${.5 + .3 * Math.sin(t)})`);
  });
}
/* kaydırma izi + güç göstergesi */
function drawSwipe(x, W, H) {
  const d = S.drag, P0 = d.pts[0], P1 = d.pts[d.pts.length - 1];
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.setLineDash([4, 5]); x.beginPath(); x.moveTo(P0[0], P0[1]); x.lineTo(P1[0], P1[1]); x.stroke(); x.setLineDash([]);
  if (d.sp) { const B = S.phase === 'hwin' ? S.me : S.ball, b = P3(B.x, B.y, 0); if (b) { const L = 30 + d.sp.pw * 110, ex = b.X + d.sp.sx * L, ey = b.Y + d.sp.sy * L, col = d.sp.pw > .92 ? '#ff6b5b' : d.sp.pw > .7 ? '#e8c468' : '#bde5c8';
    x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(b.X, b.Y); x.lineTo(ex, ey); x.stroke(); x.lineCap = 'butt'; const a = Math.atan2(d.sp.sy, d.sp.sx); x.fillStyle = col; x.beginPath(); x.moveTo(ex + Math.cos(a) * 14, ey + Math.sin(a) * 14); x.lineTo(ex + Math.cos(a + 2.4) * 12, ey + Math.sin(a + 2.4) * 12); x.lineTo(ex + Math.cos(a - 2.4) * 12, ey + Math.sin(a - 2.4) * 12); x.fill(); } }
  if (!d.sp) return; const pw = d.sp.pw, bw = Math.min(W - 60, 220), bx = (W - bw) / 2, by = H - 34;
  x.fillStyle = 'rgba(6,10,12,.78)'; rr(x, bx - 8, by - 20, bw + 16, 38, 8); x.fill();
  const gr = x.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#56c98d'); gr.addColorStop(.78, '#e8c468'); gr.addColorStop(.86, '#ff8a6b'); gr.addColorStop(1, '#ff3b2f');
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(bx, by, bw, 9); x.fillStyle = gr; x.fillRect(bx, by, bw * cl(pw / 1.06, 0, 1), 9);
  x.fillStyle = '#fff'; x.fillRect(bx + bw * .9 / 1.06 - 1, by - 3, 2, 15);
  const lbl = `${T('GÜÇ')} ${Math.round(pw * 100)}`;
  x.fillStyle = pw > .92 ? '#ff8a6b' : '#e8c468'; x.font = '700 12px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(lbl, W / 2, by - 4); x.textAlign = 'left';
}
function drawMeter(x, W, H) {
  const m = S.meter, bw = Math.min(W - 40, 300), bx = (W - bw) / 2, by = H - 46, v = meterVal();
  x.fillStyle = 'rgba(6,10,12,.82)'; rr(x, bx - 10, by - 22, bw + 20, 50, 10); x.fill();
  x.fillStyle = 'rgba(255,107,91,.55)'; x.fillRect(bx, by, bw, 12);
  x.fillStyle = 'rgba(232,196,104,.8)'; x.fillRect(bx + (m.c - m.w) * bw, by, m.w * 2 * bw, 12);
  x.fillStyle = '#56c98d'; x.fillRect(bx + (m.c - m.w / 2) * bw, by, m.w * bw, 12);
  const nx = bx + (m.v != null ? m.v : v) * bw; x.fillStyle = '#fff'; x.fillRect(nx - 2, by - 6, 4, 24);
  x.fillStyle = '#e8c468'; x.font = '700 12px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(T('DOKUN: MÜDAHALE!'), W / 2, by - 6); x.textAlign = 'left';
}
function weatherFx(x, W, H) {
  const t = performance.now() / 1000;
  if (S.wx === 'yagmur') { x.strokeStyle = 'rgba(190,210,230,.35)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 90; i++) { const X = (i * 97.3 + t * 260 * (1 + (i % 3) * .2)) % (W + 40) - 20, Y = (i * 53.1 + t * 900) % H; x.moveTo(X, Y); x.lineTo(X - 3, Y + 12); } x.stroke(); }
  if (S.wx === 'kar') { x.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 70; i++) { const X = (i * 71.7 + Math.sin(t + i) * 20) % W, Y = (i * 37.9 + t * 60 * (1 + (i % 4) * .15)) % H; x.beginPath(); x.arc((X + W) % W, Y, 1.2 + (i % 3) * .5, 0, 7); x.fill(); } }
  if (S.wx === 'sis') { const v = P3(S.ball.x, S.ball.y, 0) || { X: W / 2, Y: H / 2 }, gr = x.createRadialGradient(v.X, v.Y, 30, v.X, v.Y, W * .7); gr.addColorStop(0, 'rgba(200,210,215,0)'); gr.addColorStop(1, 'rgba(200,210,215,.6)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
  if (S.wx === 'sicak') { x.fillStyle = 'rgba(255,170,60,.06)'; x.fillRect(0, 0, W, H); }
}
/* oyuncu: ayaktan başa ölçeklenen basit 3B figür */
function drawPl(x, p) {
  const f = P3(p.x, p.y, 0), hd = P3(p.x, p.y, 1.82); if (!f || !hd) return;
  const X = f.X, Y = f.Y, h = Math.max(8, Y - hd.Y), w = h * .3; if (X < -40 || X > CV.W + 40 || Y < -20 || Y > CV.H + h + 20) return;
  const shirt = p.c[0], trim = p.c[1] || '#fff', shorts = p.gk ? '#222' : lum(shirt) > 150 ? '#22262b' : trim, skin = p.skin, run = S.phase === 'fly' || S.anims.length ? Math.sin(S.t * 11 + p.ph) : Math.sin(S.t * 2 + p.ph) * .15;
  if (p.me) { x.strokeStyle = '#e8c468'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(X, Y, w * 1.5, w * .5, 0, 0, 7); x.stroke(); }
  if (S.ball.owner === p && !p.me) { x.strokeStyle = p.side === 'us' ? 'rgba(189,229,200,.9)' : 'rgba(255,107,91,.9)'; x.lineWidth = 2; x.beginPath(); x.ellipse(X, Y, w * 1.35, w * .45, 0, 0, 7); x.stroke(); }
  x.save(); x.translate(X, Y);
  if (p.down > 0) { x.rotate((p.x < 34 ? -1 : 1) * Math.PI / 2 * Math.min(1, p.down * 1.6)); }
  /* bacaklar */
  const lg = w * .26, lh = h * .44;
  x.fillStyle = shirt === '#f2f2f2' ? '#333' : shirt; // çorap
  x.fillRect(-w * .32 + run * w * .12, -lh * .5, lg, lh * .5); x.fillRect(w * .06 - run * w * .12, -lh * .5, lg, lh * .5);
  x.fillStyle = skin; x.fillRect(-w * .32 + run * w * .06, -lh, lg, lh * .52); x.fillRect(w * .06 - run * w * .06, -lh, lg, lh * .52);
  x.fillStyle = '#111'; x.fillRect(-w * .36 + run * w * .12, -h * .04, lg * 1.3, h * .04); x.fillRect(w * .02 - run * w * .12, -h * .04, lg * 1.3, h * .04);
  /* şort */
  x.fillStyle = shorts; rr(x, -w * .42, -h * .56, w * .84, h * .17, w * .1); x.fill();
  /* gövde */
  const g = x.createLinearGradient(-w * .5, 0, w * .5, 0); g.addColorStop(0, shirt); g.addColorStop(.6, shirt); g.addColorStop(1, 'rgba(0,0,0,.35)');
  x.fillStyle = shirt; rr(x, -w * .5, -h * .82, w, h * .3, w * .2); x.fill(); x.fillStyle = g; rr(x, -w * .5, -h * .82, w, h * .3, w * .2); x.fill();
  x.fillStyle = trim; x.fillRect(-w * .06, -h * .82, w * .12, h * .3);
  /* kollar */
  x.fillStyle = shirt; x.fillRect(-w * .66, -h * .8 - run * w * .1, w * .18, h * .14); x.fillRect(w * .48, -h * .8 + run * w * .1, w * .18, h * .14);
  x.fillStyle = skin; x.fillRect(-w * .65, -h * .66 - run * w * .1, w * .15, h * .14); x.fillRect(w * .5, -h * .66 + run * w * .1, w * .15, h * .14);
  /* baş */
  x.fillStyle = skin; x.beginPath(); x.arc(0, -h * .9, w * .3, 0, 7); x.fill();
  x.fillStyle = '#1b130c'; x.beginPath(); x.arc(0, -h * .93, w * .3, Math.PI * 1.05, Math.PI * 1.95); x.fill();
  if (h > 34 && !p.gk) { x.fillStyle = lum(shirt) > 150 ? '#111' : '#fff'; x.font = `700 ${Math.round(h * .13)}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.num, w * .22, -h * .7); }
  x.restore();
  if (p.me || p.gk || S.ball.owner === p) { const lbl = p.me ? T('SEN') : short(p.n); x.font = '600 11px "Barlow",sans-serif'; x.textAlign = 'center'; const tw = x.measureText(lbl).width + 8, ly = Y - h - 18; x.fillStyle = p.me ? 'rgba(232,196,104,.95)' : 'rgba(6,10,12,.65)'; rr(x, X - tw / 2, ly, tw, 14, 3); x.fill(); x.fillStyle = p.me ? '#111' : '#fff'; x.textBaseline = 'middle'; x.fillText(lbl, X, ly + 7); }
  x.textAlign = 'left';
}
function drawBall(x) {
  const B = S.ball, v = P3(B.x, B.y, (B.z || 0) + .11); if (!v) return; const r = Math.max(2.8, v.s * .25);
  const gr = x.createRadialGradient(v.X - r * .35, v.Y - r * .35, r * .1, v.X, v.Y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#aab2b6');
  x.fillStyle = gr; x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.fill();
  x.fillStyle = '#2b2b2b'; x.beginPath(); x.arc(v.X + Math.cos(S.t * 9) * r * .35, v.Y + Math.sin(S.t * 9) * r * .35, r * .3, 0, 7); x.fill();
}
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

const FLASHT = { def: 'ARAYA GİR', build: 'PAS', drib: 'ÇALIM', atk: 'HÜCUM', one: 'BİREBİR', kontra: 'KONTRA', head: 'KAFA', fk: 'SERBEST VURUŞ', pen: 'PENALTI' };
/* ============================================================
   NSS GÖRÜNÜMÜ (v2.8): düz, yukarıdan 2B saha (kale üstte), küçük
   oyuncular, açık yeşil çim, büyük soluk olay yazıları (PAS, GOL!,
   ARAYA GİR) ve yıldız halkası, pas mesafesi altta, turuncu nişan oku,
   vuruş anında gökyüzü önünde uçan büyük top.
   Aşağıdaki fonksiyonlar 3B sürümün aynı adlı fonksiyonlarını ezer;
   girdi (P3 / unprojG) aynı arayüzle çalışmaya devam eder.
   ============================================================ */
const NSS_W = 40; /* ekranda görünen genişlik (m) */
function camWant() {
  const B = S.ball, me = S.me, sc = CV.W / NSS_W, halfH = CV.H / 2 / sc, halfW = NSS_W / 2;
  const goalMode = S.mode !== 'atk' || toGoal(me) < 40 || ['aim', 'hwin', 'cross'].includes(S.phase) || (S.phase === 'fly' && B.vy > 0 && toGoal(B) < 45);
  const ref = S.phase === 'fly' || S.phase === 'icpt' ? B : me;
  let cy = goalMode ? Math.max(ref.y + halfH * .45, Math.min(ref.y + halfH * .7, 108 - halfH)) : ref.y + halfH * .35;
  cy = cl(cy, halfH - 6, 109 - halfH);
  return { x: cl(ref.x * .7 + 34 * .3, halfW - 4, 72 - halfW), ty: cy, dist: sc };
}
function camSet(dt) {
  const w = camWant(), c = S.cam, k = Math.min(1, dt * 3);
  if (c.dist == null) Object.assign(c, w);
  c.x += (w.x - c.x) * k; c.ty += (w.ty - c.ty) * k; c.dist = w.dist; camBasis();
}
function camBasis() { const c = S.cam; if (c.dist == null) Object.assign(c, camWant()); PR = { cx: c.x, cy: c.ty, sc: CV.W / NSS_W }; }
/* 2B izdüşüm: yükseklik (z) ekranda yukarı kaydırma olarak görünür */
function P3(x, y, z) { const sc = PR.sc || CV.W / NSS_W; return { X: CV.W / 2 + (x - PR.cx) * sc, Y: CV.H / 2 - (y - PR.cy) * sc - (z || 0) * sc * .45, s: sc }; }
function unprojG(px, py) { const sc = PR.sc; return { x: PR.cx + (px - CV.W / 2) / sc, y: PR.cy - (py - CV.H / 2) / sc }; }
function unprojY(px, py, Y) { const sc = PR.sc, x = PR.cx + (px - CV.W / 2) / sc, gy = CV.H / 2 - (Y - PR.cy) * sc; return { x, z: (gy - py) / (sc * .45) }; }
function drawPitch(x, W, H) {
  const pt = typeof acct === 'function' ? acct().pitch : 'klasik', snow = S.wx === 'kar', night = pt === 'gece', retro = pt === 'retro';
  const c1 = snow ? '#dfe6e2' : retro ? '#6f8a3c' : night ? '#1e6a1e' : '#35a32c', c2 = snow ? '#d3dbd7' : retro ? '#67813a' : night ? '#1c621c' : '#30992a';
  x.fillStyle = c1; x.fillRect(0, 0, W, H);
  for (let k = -2; k < 24; k++) { const a = P3(0, k * 5.25 + 5.25, 0).Y, b = P3(0, k * 5.25, 0).Y; if (b < 0 || a > H) continue; x.fillStyle = k % 2 ? c1 : c2; x.fillRect(0, a, W, b - a); }
  /* saha dışı (kale arkası): reklam panosu + tribün + seyirci */
  const gl = P3(0, 105, 0).Y;
  if (gl > 0) {
    const grass2 = snow ? '#c9d2ce' : '#238020'; x.fillStyle = grass2; x.fillRect(0, 0, W, gl);
    const standH = Math.min(gl, Math.max(16, PR.sc * 7)), standTop = Math.max(0, gl - standH);
    /* tribün zemini */
    const sg = x.createLinearGradient(0, standTop, 0, gl); sg.addColorStop(0, night ? '#0c1016' : '#1d222b'); sg.addColorStop(1, night ? '#161c26' : '#2b323d'); x.fillStyle = sg; x.fillRect(0, standTop, W, gl - standTop);
    /* seyirci benekleri (sabit desen, titremez) */
    if (!snow && standH > 10) { const cols = ['#d8b24a', '#c75b4b', '#e9e4d6', '#5c86b8', '#6aa06a', '#b56fa0']; const rows = Math.max(2, Math.floor(standH / 6)); for (let r = 0; r < rows; r++) { const yy = standTop + 4 + r * (standH - 6) / rows; for (let cx = 0; cx < W; cx += 7) { const k = (r * 131 + cx * 7) % 97; if (k % 4 === 0) continue; x.fillStyle = cols[(r * 3 + cx) % cols.length]; x.globalAlpha = .5 + (k % 5) * .1; x.fillRect(cx + (r % 2) * 3, yy, 3.2, 3.2); } } x.globalAlpha = 1; }
    /* reklam panosu */
    x.fillStyle = night ? '#0e1a2a' : '#11325e'; x.fillRect(0, gl - 4, W, 4); x.fillStyle = 'rgba(255,255,255,.12)'; for (let cx = 0; cx < W; cx += 60) x.fillRect(cx, gl - 4, 42, 4);
  }
  x.strokeStyle = snow ? 'rgba(40,60,90,.65)' : 'rgba(255,255,255,.92)'; x.lineWidth = 2;
  const L = pts => { x.beginPath(); pts.forEach((p, i) => { const v = P3(p[0], p[1], 0); i ? x.lineTo(v.X, v.Y) : x.moveTo(v.X, v.Y); }); x.stroke(); };
  L([[0, 0], [0, 105], [68, 105], [68, 0]]); L([[0, 52.5], [68, 52.5]]);
  L(arcPts(34, 52.5, 9.15, 0, Math.PI * 2, 48)); L([[13.84, 105], [13.84, 88.5], [54.16, 88.5], [54.16, 105]]); L([[24.84, 105], [24.84, 99.5], [43.16, 99.5], [43.16, 105]]);
  L(arcPts(34, 94, 9.15, -Math.PI * .8, -Math.PI * .2, 16).map(p => [p[0], 2 * 94 - p[1]]).filter(p => p[1] < 88.5));
  /* köşe yayları */
  L(arcPts(0, 0, 1, 0, Math.PI / 2, 6)); L(arcPts(68, 0, 1, Math.PI / 2, Math.PI, 6)); L(arcPts(0, 105, 1, -Math.PI / 2, 0, 6)); L(arcPts(68, 105, 1, Math.PI, Math.PI * 1.5, 6));
  const ps = P3(34, 94, 0), cs = P3(34, 52.5, 0); x.fillStyle = '#fff'; [ps, cs].forEach(v => { x.beginPath(); x.arc(v.X, v.Y, 2.2, 0, 7); x.fill(); });
  /* derinlik için hafif kenar karartması */
  const vg = x.createRadialGradient(W / 2, H * .52, H * .22, W / 2, H * .52, H * .82); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, night ? 'rgba(0,0,10,.3)' : 'rgba(0,0,0,.16)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
}
function drawGoal(x, front) {
  if (!front) return; const a = P3(GOAL_L, GY, 0), b = P3(GOAL_R, GY + 2, 0), net = S.net != null && S.t - S.net < 1.4 ? (1 - (S.t - S.net) / 1.4) : 0;
  const left = a.X, right = b.X, bot = a.Y, top = b.Y - net * 6;
  x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(left, top, right - left, bot - top);
  /* ağ örgüsü: dikey + yatay + çapraz */
  x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 1; x.beginPath();
  for (let i = 1; i < 14; i++) { const X = left + (right - left) * i / 14; x.moveTo(X, top); x.lineTo(X, bot); }
  for (let j = 1; j < 4; j++) { const Y = top + (bot - top) * j / 4; x.moveTo(left, Y); x.lineTo(right, Y); } x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = .7; x.beginPath();
  for (let i = -13; i < 14; i++) { const X = left + (right - left) * i / 14; x.moveTo(X, top); x.lineTo(X + (bot - top) * .5, bot); } x.stroke();
  /* direkler ve üst direk */
  x.strokeStyle = '#fff'; x.lineWidth = Math.max(3, a.s * .13); x.lineCap = 'round'; x.beginPath(); x.moveTo(left, bot); x.lineTo(left, top); x.lineTo(right, top); x.lineTo(right, bot); x.stroke(); x.lineCap = 'butt';
}
/* küçük oyuncu: yukarıdan hafif eğik görünüm, gölge, forma, şort, baş */
function drawPl(x, p) {
  const v = P3(p.x, p.y, 0), s = PR.sc, h = Math.max(9, s * 1.3), w = h * .42; if (v.X < -20 || v.X > CV.W + 20 || v.Y < -30 || v.Y > CV.H + 30) return;
  const X = v.X, Y = v.Y, moving = (S.phase === 'fly' || S.phase === 'drun' || S.phase === 'icpt' || S.anims.length) ? 1 : 0;
  const run = Math.sin(S.t * (moving ? 14 : 3) + (p.ph || 0)) * (moving ? 1 : .22); /* hareket yoksa hafif nefes alışı */
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(X + 2, Y, w * .82, w * .33, 0, 0, 7); x.fill();
  if (p.me) { x.strokeStyle = '#ffe34d'; x.lineWidth = 2; x.beginPath(); x.ellipse(X, Y, w * 1.28, w * .52, 0, 0, 7); x.stroke(); }
  x.save(); x.translate(X, Y); if (p.down > 0) x.rotate((p.x < 34 ? -1 : 1) * Math.PI / 2 * Math.min(1, p.down * 1.6));
  const gk = p.gk, shirt = gk ? '#16d184' : p.c[0], trim = gk ? '#0a7a4a' : (p.c[1] || '#fff');
  /* bacaklar (koşu salınımı) */
  x.fillStyle = '#17120b'; x.fillRect(-w * .34 + run * w * .16, -h * .3, w * .26, h * .3); x.fillRect(w * .08 - run * w * .16, -h * .3, w * .26, h * .3);
  /* şort */
  x.fillStyle = lum(shirt) > 150 ? '#262b31' : trim; x.fillRect(-w * .45, -h * .5, w * .9, h * .22);
  /* forma + kol + hafif gölge + kontur */
  x.fillStyle = shirt; x.fillRect(-w * .5, -h * .82, w, h * .36);
  x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(-w * .5, -h * .62, w, h * .16);
  x.fillStyle = trim; x.fillRect(-w * .5, -h * .82, w * .18, h * .36); x.fillRect(w * .32, -h * .82, w * .18, h * .36);
  x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1; x.strokeRect(-w * .5, -h * .82, w, h * .36);
  /* baş + saç + ışık */
  x.fillStyle = p.skin; x.beginPath(); x.arc(0, -h * .92, w * .33, 0, 7); x.fill();
  x.fillStyle = '#1b130c'; x.beginPath(); x.arc(0, -h * .96, w * .33, Math.PI * 1.05, Math.PI * 1.95); x.fill();
  x.fillStyle = 'rgba(255,255,255,.3)'; x.beginPath(); x.arc(-w * .12, -h * .96, w * .1, 0, 7); x.fill();
  x.restore();
  if (p.me || (p.gk && S.mode === 'atk') || S.ball.owner === p) { const lbl = p.me ? T('SEN') : short(p.n); x.font = '600 10px "Barlow",sans-serif'; x.textAlign = 'center'; const tw = x.measureText(lbl).width + 6, ly = Y - h - 14; x.fillStyle = p.me ? 'rgba(255,227,77,.95)' : 'rgba(6,10,12,.6)'; rr(x, X - tw / 2, ly, tw, 12, 3); x.fill(); x.fillStyle = p.me ? '#111' : '#fff'; x.textBaseline = 'middle'; x.fillText(lbl, X, ly + 6); x.textAlign = 'left'; }
}
function drawBall(x) {
  const B = S.ball, z = B.z || 0, g0 = P3(B.x, B.y, 0), v = P3(B.x, B.y, z + .1), r = Math.max(3.2, PR.sc * .33) * (1 + z * .04);
  const sp = 1 + Math.min(1.2, z * .13); /* yükseldikçe gölge büyür ve soluklaşır */
  x.save(); x.globalAlpha = .3 / sp; x.fillStyle = '#000'; x.beginPath(); x.ellipse(g0.X + 1.5, g0.Y + 2, r * sp, r * .5 * sp, 0, 0, 7); x.fill(); x.restore();
  if (typeof drawFancyBall === 'function') drawFancyBall(x, v.X, v.Y, r, B.spin != null ? B.spin * .6 : S.t * 6);
  else { x.fillStyle = '#fff'; x.beginPath(); x.arc(v.X, v.Y, r, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 1; x.stroke(); x.fillStyle = '#222'; x.beginPath(); x.arc(v.X + Math.cos(S.t * 9) * r * .35, v.Y + Math.sin(S.t * 9) * r * .35, r * .32, 0, 7); x.fill(); }
}
/* olay yazısı: büyük, soluk, etrafında yıldız halkası (NSS gibi) */
function flash(txt) { if (S) S.flash = { txt, t: S.t }; }
function drawFlash(x, W, H) {
  const f = S.flash; if (!f) return; const a = S.t - f.t; if (a > 1.6) { S.flash = null; return; }
  const k = a < .2 ? a / .2 : a > 1.1 ? 1 - (a - 1.1) / .5 : 1, cy = H * .38;
  x.save(); x.globalAlpha = .85 * k; x.fillStyle = '#ffffff'; const ft = T(f.txt); x.font = `800 ${Math.round(Math.min(W * .11, W * 1.5 / Math.max(6, ft.length)))}px "Barlow Condensed",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 4; x.fillText(T(f.txt), W / 2, cy); x.shadowBlur = 0;
  x.fillStyle = '#ffe34d'; const R0 = W * .2 + a * 18; for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + a; star(x, W / 2 + Math.cos(an) * R0, cy + Math.sin(an) * R0 * .55, 4); }
  x.restore();
}
function star(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * .45 : r; i ? x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2) : x.moveTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); x.fill(); }
function drawDist(x, W, H) { const d = S.distL; if (!d || S.t - d.t > 3) return; x.fillStyle = 'rgba(0,0,0,.45)'; rr(x, W / 2 - 38, H - 26, 76, 20, 10); x.fill(); x.fillStyle = '#fff'; x.font = '600 12px "Barlow",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`${d.d.toFixed(1)} m`, W / 2, H - 16); x.textAlign = 'left'; }
/* NSS nişan oku: toptan çıkan ince turuncu ok */
function drawSwipe(x, W, H) {
  const d = S.drag; if (!d.sp) return; const B = S.phase === 'hwin' ? S.me : S.ball, b = P3(B.x, B.y, 0), L = 18 + d.sp.pw * 70, ex = b.X + d.sp.sx * L, ey = b.Y + d.sp.sy * L, a = Math.atan2(d.sp.sy, d.sp.sx);
  x.strokeStyle = '#ff8a1e'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(b.X, b.Y); x.lineTo(ex, ey); x.stroke(); x.lineCap = 'butt';
  x.fillStyle = '#ff8a1e'; x.beginPath(); x.moveTo(ex + Math.cos(a) * 9, ey + Math.sin(a) * 9); x.lineTo(ex + Math.cos(a + 2.5) * 8, ey + Math.sin(a + 2.5) * 8); x.lineTo(ex + Math.cos(a - 2.5) * 8, ey + Math.sin(a - 2.5) * 8); x.fill();
}
/* vuruş ekranı: gökyüzü, bulutlar, çim; büyük top kavis çizerek geçer, dokun */
function ctGeo() { const W = CV.W, H = CV.H; return { x0: 0, x1: W, y0: 0, y1: H, cx: W / 2, gy: H * .84, R: S.ct.R * W * 1.15 }; }
function ctBall(t) {
  const c = S.ct, G = ctGeo(), u = cl((t - c.t0) / c.dur, 0, 1.15), x = -G.R + (CV.W + 2 * G.R) * u;
  const y = G.gy - G.R - Math.sin(Math.min(1, u) * Math.PI) * (G.gy - G.R * 3) * .82;
  return { x, y, u, rot: u * 10 };
}
function drawContact(x, W, H) {
  const c = S.ct; if (!c) return; const G = ctGeo(), b = ctBall(S.t);
  const sky = x.createLinearGradient(0, 0, 0, G.gy); sky.addColorStop(0, '#2f63c9'); sky.addColorStop(1, '#9cc2f2'); x.fillStyle = sky; x.fillRect(0, 0, W, G.gy);
  x.fillStyle = 'rgba(255,255,255,.95)'; [[.15, .78, 1], [.38, .8, .8], [.62, .79, 1.1], [.86, .8, .9], [.3, .25, .7], [.75, .18, .6]].forEach(([cx, cy, s]) => { for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(W * cx + (i - 1.5) * 14 * s, H * cy - (i % 2) * 7 * s, 12 * s, 0, 7); x.fill(); } });
  const gg = x.createLinearGradient(0, G.gy, 0, H); gg.addColorStop(0, '#4fb83a'); gg.addColorStop(1, '#2f8a22'); x.fillStyle = gg; x.fillRect(0, G.gy, W, H - G.gy);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(b.x, G.gy + 8, G.R * .8, G.R * .18, 0, 0, 7); x.fill();
  x.save(); x.translate(b.x, b.y);
  const gr = x.createRadialGradient(-G.R * .35, -G.R * .4, G.R * .15, 0, 0, G.R); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c4cace'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, G.R, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(0, 0, G.R, 0, 7); x.clip(); x.rotate(b.rot); x.fillStyle = '#1d1d1d';
  for (let i = 0; i < 6; i++) { const a = i * 1.047, d = i ? G.R * .62 : 0; x.beginPath(); for (let j = 0; j < 5; j++) { const aa = j * 1.2566 + a, r2 = G.R * .21; const X = Math.cos(a) * d + Math.cos(aa) * r2, Y = Math.sin(a) * d + Math.sin(aa) * r2; j ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.fill(); }
  x.restore(); x.restore();
  if (S.ctHit) { const h = S.ctHit; x.fillStyle = '#ff8a1e'; star(x, h.x, h.y, 14); }
  x.fillStyle = '#fff'; x.font = '700 13px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top';
  x.font = '800 18px "Barlow Condensed",sans-serif'; x.fillText(T(c.head ? 'DOKUN: KAFA!' : 'TOPA DOKUN!'), W / 2, 10);
  if (!c.head) { x.font = '700 12px "Barlow Condensed",sans-serif'; x.textBaseline = 'bottom'; x.fillText(T('ÜST: ALÇAK · ALT: HAVALI · YAN: FALSO'), W / 2, H - 8); } x.textAlign = 'left';
}

/* ---------- Kontroller (canvas altındaki düğmeler: her zaman bir çıkış var) ---------- */
function ctlHTML() {
  if (!S) return '';
  const s = S; let h = '';
  const air = s.mode === 'atk' && ['decide', 'aim', 'hwin'].includes(s.phase) ? `<button class="btn ghost sm airt${s.air ? ' on' : ''}" onclick="toggleAir()">${s.air ? '⬆ Havadan: AÇIK' : '⬆ Havadan: kapalı'}</button>` : '';
  if (s.phase !== 'done') h += `<div class="hint">${esc(s.msg || s.hint || '')}</div>`;
  if (s.phase === 'decide') {
    const mo = `<div class="mopts">${s.opts.map((o, i) => `<button class="mopt" onclick="act(${i})"><b>${esc(o.l)}</b><span>${esc(o.d || '')}</span><em>→</em></button>`).join('')}</div>`;
    if (s.mode === 'atk') h += `<div class="swh">👆 Parmağını sahaya koy, sapan gibi GERİ çek ve bırak: yön + güç. Sonra topun neresine vuracağını seç.</div><details class="assist"${s.showAs ? ' open' : ''} ontoggle="S&&(S.showAs=this.open)"><summary>Yardımlı oyna (dokunarak)</summary>${mo}</details>`;
    else h += mo;
  } else if (s.phase === 'aim' || s.phase === 'hwin') {
    const P = s.aimP || [];
    h += `<div class="swh">${s.phase === 'hwin' ? '🎯 Kafa: geri çek ve bırak ya da köşe seç' : '🎯 Geri çekip bırak ya da köşe seç'}</div>`;
    h += `<div class="ctl3">${[[AIMX[0], 'Sol köşe'], [AIMX[1], 'Orta'], [AIMX[2], 'Sağ köşe']].map(([ax, l], i) => `<button class="btn ghost" onclick="${s.phase === 'hwin' ? 'headAt' : 'aimAt'}(${ax})">${l}</button>`).join('')}</div>`;
  } else if (s.phase === 'meter') {
    h += `<button class="btn big" onclick="fireTackle()">MÜDAHALE!</button>`;
  } else if (s.phase === 'done') {
    h += `<button class="btn big" onclick="sceneContinue()">Devam</button>${!s.good && s.mode === 'atk' && !M.adRetry ? `<button class="btn ghost" onclick="adRetry()">📺 Reklam izle, pozisyonu tekrar oyna</button>` : ''}`;
  }
  return h;
}
function drawUIControls() { const el = $('mctl'); if (el) { el.innerHTML = ctlHTML(); i18nApply(el); } }

/* ---------- Döngü ---------- */
let LAST = 0;
function sceneStart() {
  cancelAnimationFrame(RAF); const cv = $('cv'); if (!cv || !S) return;
  const W = Math.min(cv.parentElement.clientWidth || 360, 560), H = Math.round(Math.min(W * 1.45, (window.innerHeight || 800) * .66)), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  CV = { W, H, dpr, F: H * 1.1 }; S.cam.dist = null;
  bindInput(cv); LAST = performance.now();
  const loop = now => { if (!S || $('cv') !== cv) return; const dt = Math.min(.05, (now - LAST) / 1000); LAST = now; step(dt); camSet(dt); drawScene(); RAF = requestAnimationFrame(loop); };
  RAF = requestAnimationFrame(loop);
}

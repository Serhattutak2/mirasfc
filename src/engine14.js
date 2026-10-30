/* ============================================================
   MİRAS FC — MAÇ MOTORU v14 (v4.2)
   1) Koşu oku: koşu verdiğin arkadaş topu alınca (ya da topu taşıyan
      olunca) mavi ok söner. Koşu verilen oyuncu oku sonuna kadar,
      depar hızında takip eder; vardığında ok kaybolur.
   2) Uzun topta: rakipte yalnızca topa gerçekten yetişebilecek EN YAKIN
      oyuncu koşar; diğerleri adamını bırakmaz. Pası atan SEN, uzun topun
      peşinden koşmazsın: kısa paslarda ileri (ver-kaç), uzun paslarda
      yerini korursun.
   3) Kaleci: kurtarışta top kalecinin eldivenlerinde durur (top kale
      çizgisine kadar gidip geri sekmez). Kaleci topun geldiği noktaya,
      topla AYNI anda varacak şekilde uçar; çeldiği top kaleden dışarı,
      yana ve ileri seker; tuttuğu top elinde kalır.
   4) Zorluk takım gücüne göre: eşit güçte normal (eskiden eşitte bile bir
      tık zordu); rakip güçlüyse zor, zayıfsa kolay.
   ============================================================ */
/* ---------- 4) zorluk ---------- */
const _mkScene14 = mkScene;
mkScene = function (mo) {
  const r = _mkScene14(mo); const s = S;
  try { if (s && M && M.T) { const diff = (M.T.th.s || 70) - (M.T.us.s || 70); s.df = cl(1 + diff / 24, .78, 1.6); } } catch (e) { }
  return r;
};
/* ---------- 1) koşu oku ---------- */
const _planMoves14 = planMoves;
planMoves = function (r) {
  const s = S; if (s) s.P.forEach(p => { if (p.cmd && (p === r.to || p === r.car)) p.cmd = null; });
  _planMoves14(r); if (!s || s.mode !== 'atk' || r.k === 'shot') return;
  const T = Math.max(.45, r.T || .8), maxM = V7.mateV * 1.3 * T;
  s.P.forEach(p => {
    if (!p.cmd || p === r.to || p === r.car) return;
    const dx = p.cmd.x - p.x, dy = p.cmd.y - p.y, d = Math.hypot(dx, dy); if (d < 1.2) { p.cmd = null; return; }
    const f = d > maxM ? maxM / d : 1; S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + dx * f, p.y + dy * f, T * .95, { lin: 1 }); p.cmdGo = f >= 1 ? 1 : 0;
  });
};
const _nextDraw14 = nextDraw;
nextDraw = function () {
  const s = S; if (s) s.P.forEach(p => { if (!p.cmd) return; if (p === s.car || p.cmdGo || Math.hypot(p.cmd.x - p.x, p.cmd.y - p.y) < 1.4) { p.cmd = null; p.cmdGo = 0; } });
  return _nextDraw14();
};
/* ---------- 2) uzun top: adam bırakılmaz, pası atan peşinden koşmaz ---------- */
const _launch14 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  const s0 = S, car0 = s0 && s0.car;
  _launch14(P, ev, q, oy, ox);
  const s = S, r = s && s.run; if (!r || s !== s0 || s.mode !== 'atk') return;
  const e = r.P[r.P.length - 1], T = Math.max(.5, r.T || .8), L = r.L || plen(r.P);
  if (r.k === 'pass') {
    /* pası atan: uzun topta yerinde kalır (ya da biraz ileri), kısa pasta ver-kaç */
    if (car0 && car0.side === 'us' && !car0.gk && car0 !== r.to && L > 22) {
      S.anims = S.anims.filter(a => a.o !== car0); const ln = typeof offLine === 'function' ? Math.min(offLine() - .8, 100) : 100;
      anim(car0, car0.x + (34 - car0.x) * .05, Math.min(ln, car0.y + rf(2, 4)), T * .95, { lin: 1 });
    }
  }
  /* ---------- 3) kaleci kurtarışı ---------- */
  if (r.k === 'shot' && r.res && s.gk && !s.head) {
    const k = s.gk, res = r.res, a = S.anims.find(x => x.o === k), ky = a ? a.y1 : k.y, n = r.P.length, p1 = r.P[n - 1], p0 = r.P[n - 2] || r.P[0];
    if (res.save && p1.y > ky - .2 && p0.y < ky) {
      const f = (ky - .25 - p0.y) / ((p1.y - p0.y) || 1e-6), xi = p0.x + (p1.x - p0.x) * f, yi = ky - .25;
      r.P = r.P.slice(0, n - 1).concat([{ x: xi, y: yi }]); r.L = plen(r.P); res.x = xi;
      const tb = r.L / r.v * 1.05;
      S.anims = S.anims.filter(x => x.o !== k); const lat = xi - k.x;
      anim(k, xi - Math.sign(lat) * .35, ky, Math.max(.15, tb * .92), { lin: 1 });
      if (Math.abs(lat) > 1.05) { k.dive = { dir: lat > 0 ? 1 : -1, t0: s.t, T: Math.max(.22, tb * .95) }; k.down = 0; } else k.dive = null;
      r.gkSave = 1;
    } else if (res.goal && a) {
      /* gol: kaleci topa uzanır ama yetişemez */
      const lat = (res.x != null ? res.x : p1.x) - k.x; if (Math.abs(lat) > 1.05) { k.dive = { dir: lat > 0 ? 1 : -1, t0: s.t, T: Math.max(.25, a.d) }; k.down = 0; }
    }
  }
};
/* kurtarış sonrası top: çelinirse dışarı ve ileri seker, tutulursa elde kalır */
const _pathDone14 = pathDone;
pathDone = function (r) {
  const s = S, out = _pathDone14(r);
  try {
    if (s && r && r.k === 'shot' && r.res && r.res.save && r.gkSave && s.free && !r.res.held) {
      const B = s.ball, sideOut = B.x < 34 ? -1 : 1, hard = (r.pw || 1) > 1.2;
      s.free.vx = sideOut * rf(4, 9); s.free.vy = -rf(hard ? 6 : 3, hard ? 10 : 7); s.free.vz = rf(1.5, 4.5);
      if (Math.random() < .3) { s.free.vy = rf(1, 3); s.free.vx = sideOut * rf(6, 10); } /* köşeye, dışarı */
    }
  } catch (e) { }
  return out;
};

/* ============================================================
   KALECİ v4.3 · "Gerçek kaleci gibi yaşar"
   - Her karede topun açısına göre kale çizgisi boyunca kayar (açı kapatır),
     top yaklaştıkça ölçülü çıkar, bire birde daha çok çıkar.
   - Hareket ANİ değil: sınırlı hızla yumuşakça süzülür (ışınlanma yok).
   - Şut/dalış sırasında bu takip durur; dalışı mevcut kurtarış animasyonu yapar.
   ============================================================ */
function gkIdeal() {
  const s = S, k = s && s.gk; if (!k || s.mode !== 'atk') return null;
  const bx = s.ball.x, by = s.ball.y, D = Math.hypot(34 - bx, 105 - by);
  const cover = s.P.some(d => d.side === 'th' && !d.gk && d.y > by + .5 && Math.abs(d.x - bx) < 6);
  /* YANAL: top hangi taraftaysa kaleci o yakın direğe doğru belirgin kayar (açı kapatma) */
  const latF = cl(.34 + (30 - D) * .009, .24, .6);
  const tx = cl(34 + (bx - 34) * latF, 24, 44);
  /* DERİNLİK: top yaklaştıkça çıkar, bire birde daha cesur */
  let out = cl((42 - D) * .12 + 1.4, 1.4, 5.5);
  if (D < 15 && by > 84 && !cover) out = cl((15 - D) * .55 + 3, 3, 9);
  out = Math.min(out, Math.max(1, D - 2));
  return { x: tx, y: cl(104.6 - out, 95, 104.6) };
}
/* ilk yerleşim anında ideal noktaya; sonrası her karede süzülerek (snap yok) */
const _gkPlace14b = gkPlace;
gkPlace = function () {
  const s = S, k = s && s.gk; if (!k || s.mode !== 'atk') return _gkPlace14b();
  const id = gkIdeal(); if (!id) return _gkPlace14b();
  if (!s._gkReady) { s._gkReady = 1; k.x = id.x; k.y = id.y; k.down = 0; } /* sahne başı: anında yerleş */
  /* sonrası: step() içindeki sürekli takip kaleciyi yumuşakça taşır */
};
const _step14b = step;
step = function (dt) {
  _step14b(dt); const s = S; if (!s || s.mode !== 'atk' || !s.gk) return;
  const k = s.gk;
  if (k.dive || s.type === 'pen' || s.dead) return;                 /* penaltı/dalış: dokunma */
  if (s.phase === 'run' && s.run && s.run.k === 'shot') return;      /* şut uçuşu: kurtarış animasyonu yönetir */
  if (s.anims.some(a => a.o === k)) return;                          /* kurtarış animasyonu sürüyorsa karışma */
  const id = gkIdeal(); if (!id) return;
  const vmax = (6.4 + (k.r - 70) / 16) * Math.max(0, dt);           /* kaleci hızı (reytingle artar) */
  const dx = id.x - k.x, dy = id.y - k.y, d = Math.hypot(dx, dy);
  if (d > .03) { const m = Math.min(d, vmax); k.x += dx / d * m; k.y += dy / d * m; } /* trackDirs hız/yönü konumdan hesaplar */
  k.down = 0;
};

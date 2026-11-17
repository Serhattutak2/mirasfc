/* ============================================================
   MİRAS FC — MAÇ MOTORU v16 (v4.6) · Test oyuncularının geri bildirimi
   1) Akış: açık oyunda şut ve uzun pas için ayrı "TOPA BAS" ekranı
      açılmaz. Vuruşun kalitesi okun gücünden (sarı bölge = ideal,
      kırmızı = fazla sert) ve şut/pas yeteneğinden gelir; top anında
      gider, maçtan kopmazsın. Penaltı, serbest vuruş ve kafa
      düellosunda "topa bas" kalır (oralarda zamanlama oyunun kendisi).
      Uzun pasta araya rakip giriyorsa top kendiliğinden havadan gider.
   2) Ekran: her pasta ekranın ortasında kocaman "PAS" yazısı çıkmaz.
      Küçük olaylar sahanın üstünde küçük bir etiketle görünür; büyük
      yazı yalnızca gol, kurtarış, aut gibi pozisyon sonuçlarında.
   3) Kontrol açıklaması ilk birkaç pozisyondan sonra tek satıra iner.
   4) Kamera daha yakın, oyuncular ve top daha büyük (engine10/9/update44).
   ============================================================ */
const BIGFLASH16 = /GOL|KURTAR|ÇELDİ|YAKALADI|DİREK|AUT|KESİLDİ|BARAJ|OFSAYT|SÖNDÜ|KAÇTI|KAPTI|FAUL|PENALTI|SERBEST VURUŞ|BİREBİR|KONTRA|KAFA|ARAYA GİR|OVER|SAVE|POST|WIDE|BLOCK|OFFSIDE/;
{
  /* ---------- 1) açık oyunda vuruş: ayrı ekran yok ---------- */
  const _dp16 = doPath;
  doPath = function (P, ev0) {
    const s = S; if (!s) return _dp16.apply(this, arguments);
    const ev = ev0 || pEval(P), setPiece = s.type === 'pen' || (s.type === 'fk' && s.dead);
    if (!s.head && !setPiece && (ev.k === 'shot' || (ev.k === 'pass' && s.car === s.me && plen(P) >= CAM44.longTap))) {
      const pw = s.stickPw || 1;
      if (ev.k === 'shot') {
        const e = P[P.length - 1]; P[P.length - 1] = { x: cl(e.x, GOAL_L - 2.5, GOAL_R + 2.5), y: GY + .4 };
        const sk = s.car === s.me ? st('sut') : (s.car.r || 70), sweet = pw >= .8 && pw <= 1.55 ? .16 : pw < .8 ? -.12 + (pw - .5) * .3 : -(pw - 1.55) * .6;
        const q = cl(.5 + (sk - 70) / 110 + sweet + rf(-.12, .12), .15, 1), oy = pw > 1.55 ? .35 : 0;
        s.path = null;
        flash(q > .82 ? '✨ TAM ORTASI' : q > .6 ? '👍 İYİ VURUŞ' : q > .4 ? '🙂 KENARINDAN' : '😅 ISKALADIN');
        return launchPath(P, ev, q, oy, 0);
      }
      /* uzun pas */
      if (!s.thru && ev.to) { P[P.length - 1] = { x: ev.to.x, y: ev.to.y }; P = ptrim(P, V5.maxPass); }
      const risk = (ev.dang || []).reduce((m, d) => Math.max(m, d.p || 0), 0);
      const q = cl(.6 + (st('pas') - 65) / 90 + rf(-.1, .1) - Math.max(0, pw - 1.6) * .3, .3, .95), oy = risk > .2 ? .55 : 0;
      s.path = null; return launchPath(P, ev, q, oy, 0);
    }
    return _dp16.apply(this, arguments);
  };
  /* ---------- 2) olay yazıları ---------- */
  const _df16 = drawFlash;
  drawFlash = function (x, W, H) {
    const s = S, f = s && s.flash; if (!f) return;
    const txt = T(f.txt), raw = String(f.txt);
    if (BIGFLASH16.test(raw) || BIGFLASH16.test(txt)) return _df16.apply(this, arguments);
    const a = s.t - f.t; if (a > 1.1) { s.flash = null; return; }
    const k = a < .12 ? a / .12 : a > .8 ? 1 - (a - .8) / .3 : 1;
    x.save(); x.globalAlpha = k; x.font = '700 15px "Barlow Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const tw = x.measureText(txt).width + 22, cy = 70;
    x.fillStyle = 'rgba(10,20,14,.72)'; rr(x, W / 2 - tw / 2, cy - 13, tw, 26, 13); x.fill();
    x.fillStyle = '#ffe34d'; x.fillText(txt, W / 2, cy + 1); x.restore();
  };
  /* ---------- 3) kısa açıklama ---------- */
  const _dh16 = drawHint;
  drawHint = function () {
    const s = S; if (!s || s.type === 'pen' || (s.type === 'fk' && s.n === 0)) return _dh16.apply(this, arguments);
    const A = typeof acct === 'function' ? acct() : {}, c = runCmds(), kisa = (A.hint16 || 0) >= 4;
    const base = kisa ? '🏹 Oku çek: pas ya da şut (sarı ok = iyi vuruş, kırmızı = fazla sert) · 👟 Dokun: top sür'
      : '🏹 ÇEK = PAS/ŞUT: okun ucu topun gideceği yer. Şutta ok sarıysa iyi vurursun, kırmızıysa fazla serttir. Araya rakip giriyorsa uzun pas kendiliğinden havadan gider. 👟 Top sürmek için gitmek istediğin yere DOKUN.';
    return c ? base + (kisa ? ' · 🏃 Arkadaşı sürükle: koşu ({0})' : ' 🏃 Arkadaşına dokunup sürükle: koşacağı yeri göster ({0}).').replace('{0}', c) : base;
  };
  const _mk16 = mkScene;
  mkScene = function () { const r = _mk16.apply(this, arguments); try { const A = acct(); A.hint16 = (A.hint16 || 0) + 1; acctSave(); } catch (e) { } return r; };
}
/* ---------- 5) kamera: aksiyonu (topu / topu süreni) takip eder ----------
   Eski kamera hep "sen"i takip ediyordu ve zum hesaba katılmadığı için pas
   sonrası top ekranın altında kayboluyordu. Şimdi odak: koşuda top, çizimde
   topu süren; kale yakınsa kale de görünür kalır. */
{
  const _cw16 = camWant;
  camWant = function () {
    const r = _cw16.apply(this, arguments), s = S;
    if (!s || !r || s.cel || s.rp || s.mode !== 'atk' || s.type === 'pen' || (s.type === 'fk' && s.dead) || s.phase === 'crossIn') return r;
    const z = zoom44(), sc = (CV.W / NSS_W) * z, halfH = CV.H / 2 / sc, halfW = CV.W / 2 / sc;
    const B = s.ball, car = s.car || s.me, f = s.phase === 'run' || s.phase === 'icpt' || !car ? B : car;
    const fy = s.phase === 'run' && B.vy != null ? f.y : f.y;
    let ty = fy + halfH * .32;
    if (GY - fy < halfH * 1.7) ty = Math.max(ty, Math.min(GY + 4 - halfH, fy + halfH * .5));
    r.ty = cl(ty, halfH - 6, 112 - halfH);
    r.x = cl(f.x * .8 + 34 * .2, halfW - 5, 73 - halfW);
    return r;
  };
}
/* ---------- 6) oyuncular saha dışına çıkmaz ----------
   Testte arkadaşlar koşu planında taç çizgisinin (x=0.5) ve kale çizgisinin
   arkasına (y=107) koşup orada pas alıyordu; top oyundan çıkmış olmasına
   rağmen hücum sürüyordu. Oyuncu hedefleri saha içine sınırlanır. */
{
  const _an16 = anim;
  anim = function (o, x, y, d, ex) {
    const s = S;
    if (s && o && o.side && !s.cel && !s.rp && (s.mode === 'atk' || s.mode === 'def')) { x = cl(x, 1.2, 66.8); y = cl(y, 1, o.gk ? 106 : 103.8); }
    return _an16(o, x, y, d, ex);
  };
  /* ---------- 7) her pastan sonra bekleme kısalır ----------
     Pas alındıktan sonra herkes yerini alana kadar 1–1.5 sn donuyordu.
     Artık en fazla ~0.4 sn: koşular hızlanarak tamamlanır, sıra hemen sende. */
  const _nd16 = nextDraw;
  nextDraw = function () {
    const r = _nd16.apply(this, arguments), s = S;
    if (s && s.phase === 'anim' && s.mode === 'atk') {
      const MAXR = .4;
      s.anims.forEach(a => { if (a.o === s.ball) return; const left = a.d - (s.at - a.t0); if (left > MAXR) { a.x0 = a.o.x; a.y0 = a.o.y; a.t0 = s.at; a.d = MAXR; a.ease = 0; } });
    }
    return r;
  };
}
/* ---------- 8) kaleciden dönen top en fazla bir kez ----------
   Testte kaleci aynı pozisyonda 5-6 kez üst üste topu çelip hücumcunun
   önüne bırakıyordu (bitmeyen pinball). İkinci kurtarışta kaleci topu tutar. */
{
  const _sr16 = shotResult;
  shotResult = function (P, run) {
    const res = _sr16.apply(this, arguments), s = S;
    if (s && res && res.reb) { if ((s.reb16 || 0) >= 1) { res.reb = 0; res.held = true; } else s.reb16 = 1; }
    return res;
  };
}
/* ---------- 9) pas alan oyuncu topla aynı anda varır ----------
   Testte top hedefe varıp yerde duruyor, alıcı 0.5–1.4 sn sonra gelip
   alıyordu (her pasta donma). Alıcı artık topun varış süresine göre
   hızlanır; top durup beklerse yalnız alıcı beklenir, diğer koşular değil. */
{
  const left = a => a.d - (S.at - a.t0);
  const rebase = (a, d) => { a.x0 = a.o.x; a.y0 = a.o.y; a.t0 = S.at; a.d = Math.max(.08, d); a.ease = 0; };
  const _lp16 = launchPath;
  launchPath = function (P, ev, q, oy, ox) {
    const r0 = _lp16.apply(this, arguments), s = S, r = s && s.run;
    if (r && r.k === 'pass' && r.to && s.mode === 'atk') {
      const T = r.T || (r.L && r.v ? r.L / r.v : 0);
      s.anims.forEach(a => { if (a.o !== r.to) return; const L = left(a), dist = Math.hypot(a.x1 - a.o.x, a.y1 - a.o.y);
        if (T > 0 && L > T) rebase(a, Math.max(T, dist / 9.5)); });
    }
    return r0;
  };
  const _pd16 = pathDone;
  pathDone = function (r) {
    const out = _pd16.apply(this, arguments), s = S;
    if (s && r && r.waited && s.phase === 'anim' && s.mode === 'atk') {
      const ra = s.anims.find(a => a.o === r.to), rl = ra ? Math.max(0, left(ra)) : 0;
      if (ra && rl > .35) rebase(ra, .35);
      s.anims.forEach(a => { if (a.o === s.ball || a.o === r.to) return; if (left(a) > Math.min(rl, .35) + .02) rebase(a, Math.min(rl, .35)); });
    }
    return out;
  };
}

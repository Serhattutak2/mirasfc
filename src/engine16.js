/* ============================================================
   MİRAS FC — MAÇ MOTORU v16 (v4.6) · Test oyuncularının geri bildirimi
   (Şut/pas hissi ve oyuncu hareketleri kullanıcı isteğiyle 4.5'teki
    gibi bırakıldı: TOPA BAS ekranı ve eski koşu zamanlaması duruyor.)
   2) Ekran: her pasta ekranın ortasında kocaman "PAS" yazısı çıkmaz.
      Küçük olaylar sahanın üstünde küçük bir etiketle görünür; büyük
      yazı yalnızca gol, kurtarış, aut gibi pozisyon sonuçlarında.
   4) Kamera daha yakın, oyuncular ve top daha büyük (engine10/9/update44).
   ============================================================ */
const BIGFLASH16 = /GOL|KURTAR|ÇELDİ|YAKALADI|DİREK|AUT|KESİLDİ|BARAJ|OFSAYT|SÖNDÜ|KAÇTI|KAPTI|FAUL|PENALTI|SERBEST VURUŞ|BİREBİR|KONTRA|KAFA|ARAYA GİR|OVER|SAVE|POST|WIDE|BLOCK|OFFSIDE/;
{
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

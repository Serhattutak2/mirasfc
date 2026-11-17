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
/* ---------- 5) kamera: topu süren oyuncu ekranın altına sıkışmasın ---------- */
{
  const _cw16 = camWant;
  camWant = function () {
    const r = _cw16.apply(this, arguments), s = S; if (!s || s.cel || s.rp || s.type === 'pen' || (s.type === 'fk' && s.dead) || !r) return r;
    const z = zoom44(), halfH = CV.H / 2 / ((CV.W / NSS_W) * z), ref = s.phase === 'run' ? s.ball : (s.car || s.me || s.ball);
    if (ref && r.ty != null) r.ty = Math.min(r.ty, ref.y + halfH * .5);
    return r;
  };
}

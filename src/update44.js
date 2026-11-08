/* ============================================================
   v4.4 güncellemesi — İlk kiralık teklifi
   Profesyonel kariyerin başında forma bulamayan genç oyuncuya
   (ilk sezonun 3.–20. haftası, 21 yaş ve altı, rolü yedek/kadro dışı)
   kulüp bir kez mutlaka kiralık teklifleri getirir. Böylece yeni oyuncu
   "oynamıyorum, ne yapacağım?" noktasında oyunun mantığını öğrenir:
   kiralık = 1 sezon başka kulüpte forma, sonra kulübüne dönüş.
   ============================================================ */
function loanSureCheck() {
  if (!g || g.phase !== 'pro' || !g.club || g.loan || g.loanSureDone || g.coach) return false;
  if ((g.role || 0) > 1 || g.age > 21 || g.week < 3 || g.week > 20) return false;
  if (scr !== 'game' || g.ev || g.q || g.nego) return false;
  g.loanSureDone = 1;
  L('Kulüp, forma bulman için seni bir sezonluğuna kiralık göndermeyi önerdi.');
  startOffers('loan');
  if (scr !== 'offers' || !g.of || !g.of.length) {
    /* uygun kulüp çıkmadıysa: aynı ülkede seni oynatacak en uygun kulüpler */
    const o = ovr(), cur = club(g.club.id);
    let pool = g.w[g.club.ct].flat().filter(c => c.id !== g.club.id && roleFor(o, c.s, g.age) >= 2);
    if (!pool.length) pool = g.w[g.club.ct][g.w[g.club.ct].length - 1].filter(c => c.id !== g.club.id);
    pool = pool.sort((a, b) => Math.abs(a.s - (cur ? cur.s - 8 : a.s)) - Math.abs(b.s - (cur ? cur.s - 8 : b.s))).slice(0, 3);
    g.of = pool.map(c => mkOffer(c, clubCt(c.id), 'loan', { loan: 1, sal: g.con ? g.con.sal : 0, bonus: 0, yrs: 1, loanTop: g.con ? Math.round(g.con.sal * R(0, 25) / 100) : 0 }));
    if (!g.of.length) { scr = 'game'; return false; }
    g.ofKind = 'loan'; scr = 'offers';
    try { clearTimeout(toastT); $('toast').hidden = true; } catch (e) { } /* "kiralık isteyen çıkmadı" uyarısı yanlış olur */
  }
  g.loanIntro = 1; sv(); draw();
  return true;
}
{
  const _we44 = weekEnd;
  weekEnd = function () { const r = _we44.apply(this, arguments); try { loanSureCheck(); } catch (e) { } return r; };
  const _ou44 = offersUI;
  offersUI = function () {
    const h = _ou44.apply(this, arguments);
    if (g.ofKind !== 'loan' || !g.loanIntro) return h;
    return `<div class="card gold-edge"><div class="eyebrow gold">💡 Kiralık nedir?</div><p>Kulübünde şu an forma şansı bulamıyorsun. <b>Kiralık</b> gidersen bir sezon başka bir kulüpte düzenli oynarsın, maç tecrübesi ve form kazanırsın; maaşını yine ana kulübün öder. Sezon bitince kulübüne daha güçlü dönersin.</p><p class="m">İstemezsen “Kulübümde kalıyorum” de, yerin için savaşmaya devam et.</p></div>` + h;
  };
  const _sg44 = sign; sign = function () { g.loanIntro = 0; return _sg44.apply(this, arguments); };
  const _do44 = declineOffers; declineOffers = function () { g.loanIntro = 0; return _do44.apply(this, arguments); };
}

/* ============================================================
   v4.4 — Maç kamerası ve akış
   - Oyuncular ve top daha büyük görünsün diye kamera biraz yakınlaştı.
   - Penaltıda kamera kalecinin karşısına yakın plan geçer, serbest vuruşta
     top ile kale aynı karede ve daha yakın.
   - "Topa bas" vuruş oyunu artık yalnızca şutta ve 32 m'den uzun paslarda açılır;
     kısa, orta ve ara paslar beklemeden gider (isabet pas yeteneğinle belirlenir),
     böylece atak akıp gider.
   ============================================================ */
const CAM44 = { play: 1.16, one: 1.24, head: 1.22, fk: 1.32, pen: 1.62, longTap: 32 };
function zoom44() {
  const s = S; if (!s) return 1; if (s.cel || s.rp) return 1;
  if (s.type === 'pen') return CAM44.pen;
  if (s.type === 'fk' && s.dead) return CAM44.fk;
  if (s.type === 'one') return CAM44.one;
  if (s.head || s.type === 'head') return CAM44.head;
  return CAM44.play;
}
{
  const _cw44 = camWant;
  camWant = function () {
    const r = _cw44.apply(this, arguments), s = S; if (!s || s.cel || s.rp) return r;
    const z = zoom44(), halfH = CV.H / 2 / ((CV.W / NSS_W) * z);
    if (s.type === 'pen') { r.x = 34; r.ty = GY - halfH * .62; }
    else if (s.type === 'fk' && s.dead) { const B = s.ball; r.x = cl(B.x * .55 + 34 * .45, 14, 54); r.ty = cl((B.y + GY) / 2 - halfH * .08, halfH - 6, 109 - halfH); }
    else if (z > 1) { /* yakınlaşınca kale görünür kalsın: topa kale arası yarıya yaklaşırken merkez kaleye doğru kayar */
      const ref = s.phase === 'run' ? s.ball : (s.car || s.me || s.ball); if (ref && GY - ref.y < 30) r.ty = Math.max(r.ty, Math.min(GY + 3 - halfH * .9, ref.y + halfH * .55)); }
    return r;
  };
  const _cb44 = camBasis;
  camBasis = function () {
    _cb44.apply(this, arguments); const s = S; if (!s) return;
    const zt = zoom44(); s.z44 = s.z44 == null ? zt : s.z44 + (zt - s.z44) * .12; PR.sc *= s.z44;
  };
  const _dp44 = doPath;
  doPath = function (P, ev0) {
    const s = S, ev = ev0 || pEval(P);
    if (s && s.maxN > 8) s.maxN = 8; /* pozisyon en fazla 8 dokunuş: atak uzayıp sıkmasın */
    if (ev.k === 'pass' && s.car === s.me && !s.head) {
      const L = plen(P);
      if (L < CAM44.longTap) { /* kısa/orta pas ve ara pas: vuruş oyunu yok, isabet pas yeteneğinden (akış kesilmez) */
        if (ev.k === 'pass' && !s.thru) { P[P.length - 1] = { x: ev.to.x, y: ev.to.y }; P = ptrim(P, V5.maxPass); }
        const q = cl(.62 + (st('pas') - 60) / 90 + rf(-.08, .08), .4, .95);
        s.path = null; return launchPath(P, ev, q, 0, 0);
      }
    }
    return _dp44.apply(this, arguments);
  };
}

/* ============================================================
   v4.4 — Maç motoru ayarı (oyun testi sonuçlarına göre)
   Test: 70 genel oyuncu, insan gibi oynayan bot, 45 an.
   - Açık oyunda (hücum, oyun kurma, kontra) pasların ~%65'i kesiliyordu;
     iyi seçilmiş paslar artık daha sık arkadaşına ulaşır. Kontra atakta
     savunma dağınık olduğu için kesilme daha da az.
   - Penaltı golü %40'tayken gerçekçi seviyeye (~%70–75) çekildi.
   - Kafa düellosunda topa iyi basmak (zamanlama) düelloyu kazanma
     şansını artırır; taban şans biraz yükseldi.
   ============================================================ */
const ENG44 = { keep: { kontra: .58, build: .66, atk: .7, drib: .7, one: .75 }, shortKeep: .55, penSave: .66, duelBonus: .28, duelMin: .35 };
{
  const _lp44 = launchPath;
  launchPath = function (P, ev, q, oy, ox) {
    const s = S; if (s && s.head && !s.headDone) s._hq = q;
    const r = _lp44.apply(this, arguments);
    try {
      const run = S && S.run;
      if (run && run.k === 'pass' && run.fail && run.fail.d && !run.fail.d.wallP && !run.fail.miss) {
        let keep = ENG44.keep[S.type] != null ? ENG44.keep[S.type] : .6;
        if ((run.L || plen(run.P || P)) < 12) keep = Math.min(keep, ENG44.shortKeep);
        keep += ((S.df || 1) - 1) * .5; /* güçlü rakip yine daha çok keser */
        if (Math.random() > keep) run.fail = null;
      }
    } catch (e) { }
    return r;
  };
  const _duel44 = duelP;
  duelP = function (mk) {
    const base = _duel44.apply(this, arguments), q = S && S._hq != null ? S._hq : .6;
    return cl(Math.max(ENG44.duelMin, base) + (q - .6) * ENG44.duelBonus * 2, .2, .95);
  };
  const _sr44 = shotResult;
  shotResult = function (P, run) {
    const o = _sr44.apply(this, arguments);
    try { if (S && S.type === 'pen' && o.save && Math.random() > ENG44.penSave) { o.save = false; o.held = false; o.goal = true; o.gx = (o.gx || 34) + ((o.x || 34) - (o.gx || 34)) * .6; } } catch (e) { }
    return o;
  };
}

/* ============================================================
   MİRAS FC — MAÇ MOTORU v12 · "Topun peşinde herkes"
   - Boşluğa / arkadaşının önüne atılan pasta EN YAKIN RAKİP de topa koşar
     (kaleciler ceza sahasındaysa çıkar). Yetişemezse topu alan arkadaşına
     omuz omuza basar; yetişirse zaten kesme hesabında kazanır.
   - İkinci en yakın rakip pası alanın kale tarafını kapatır.
   - Boştaki topa her takımdan İKİ oyuncu koşar.
   - Sürüşte en yakın rakip dribling yapanın önüne kayar, biri arkadan takip eder.
   - Pas giderken diğer arkadaşlar ileri doğru destek koşusuna çıkar.
   ============================================================ */
function chaseTo(p, e, T, stop, sp) {
  const d = dist(p, e); if (d < .05) return; const reach = sp * T, k = cl(Math.min(reach, d - stop) / d, 0, 1);
  S.anims = S.anims.filter(a => a.o !== p); anim(p, p.x + (e.x - p.x) * k, p.y + (e.y - p.y) * k, T, { lin: 1 }); p.chase = 1;
}
const thV = p => V6.defV * (p.r / 72) * Math.pow(S.df || 1, .3);
const _launch12 = launchPath;
launchPath = function (P, ev, q, oy, ox) {
  _launch12(P, ev, q, oy, ox);
  const s = S, r = s && s.run; if (!r || s.mode !== 'atk' || r.k === 'shot') return;
  const e = r.P[r.P.length - 1], T = Math.max(.45, r.T || .8), failD = r.fail && r.fail.d;
  const cands = s.P.filter(p => p.side === 'th' && !p.wallP && p !== failD && (!p.gk || (e.y > 97 && Math.abs(e.x - 34) < 14))).sort((a, b) => dist(a, e) - dist(b, e));
  if (r.k === 'pass') {
    const c1 = cands[0]; if (c1) chaseTo(c1, e, T, failD ? 0 : .95, thV(c1) * (c1.gk ? 1.1 : 1));
    const c2 = cands[1]; if (c2 && !c2.gk) { const ga = Math.atan2(34 - e.x, GY - e.y); chaseTo(c2, { x: e.x + Math.sin(ga) * 4, y: e.y + Math.cos(ga) * 4 }, T, .3, thV(c2)); }
  } else if (r.k === 'drib') {
    const c1 = cands[0]; if (c1 && !c1.gk) chaseTo(c1, { x: e.x + (e.x - c1.x) * .1, y: e.y + 1.2 }, T, .9, thV(c1));
    const c2 = cands.find(p => !p.gk && p !== c1 && p.y < r.car.y + 2); if (c2) chaseTo(c2, e, T, 1.6, thV(c2) * .9);
  }
  /* arkadaşlar: alıcı dışındakiler ileri destek */
  s.P.filter(p => p.side === 'us' && !p.gk && p !== r.to && p !== r.car && !S.anims.some(a => a.o === p)).forEach(p => {
    const ln = typeof offLine === 'function' ? offLine() - .6 : 100; const tx = cl(p.x + (e.x - p.x) * .15, 4, 64), ty = Math.min(ln, p.y + rf(2, 5));
    anim(p, tx, ty, T, { lin: 1 });
  });
};
/* boştaki topa ikişer oyuncu */
const _loose12 = looseBall;
looseBall = function (pt, lostT) {
  _loose12(pt, lostT); const s = S; if (!s) return; const p2 = { x: cl(pt.x, 1.5, 66.5), y: cl(pt.y, 2, 103.5) };
  const busy = new Set(S.anims.map(a => a.o));
  ['us', 'th'].forEach(side => { const p = s.P.filter(q => q.side === side && !q.gk && !busy.has(q)).sort((a, b) => dist(a, p2) - dist(b, p2))[0]; if (p) anim(p, p.x + (p2.x - p.x) * .6, p.y + (p2.y - p.y) * .6, .9, { lin: 1 }); });
};
/* koşu bitince "chase" bayrağını temizle */
const _nextDraw12 = nextDraw;
nextDraw = function () { if (S) S.P.forEach(p => p.chase = 0); return _nextDraw12(); };

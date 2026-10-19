/* ============================================================
   MİRAS FC — v3.9 · Teknik direktör: enerji, maç puanı, maçı izle
   - Her oyuncunun ENERJİSİ var (0-100). Maçta oynayan yorulur (yaş ve
     antrenman yüküyle), oynamayan ve haftalık dinlenme toparlar.
     Yorgun oyuncu ilk 11 seçiminde geri düşer, takımın gücünü düşürür,
     sakatlanma riski artar. Yani rotasyon şart.
   - Her maçta oynayanlara puan verilir (3.5-10): sonuç, rakip gücü,
     gol ve kalesini gole kapatma. Ortalama ve son puan kadroda görünür.
   - Canlı maçta MAÇI İZLE: her 15 dakika sahada canlanır; formalarda
     numara, top oyuncular arasında dolaşır, goller ağlara gider.
   ============================================================ */
const EN11 = { play: 15, age: .7, rest: 14, bench: 6, tiredInj: .05, teamW: .1 };
const pen11 = p => p.en == null ? 100 : p.en;
/* takım gücüne etkisi */
const _cmMods5 = cmMods;
cmMods = function (info, tac) {
  const md = _cmMods5(info, tac), C = g.coach; if (!C) return md;
  const xi = typeof LM !== 'undefined' && LM && LM.info === info ? lmOn() : bestXI(C.id, C.form).map(p => (g.sq[C.id] || []).find(q => q.id === p.id) || p);
  const avg = xi.length ? xi.reduce((s, p) => s + pen11(p), 0) / xi.length : 100;
  md.us *= 1 - EN11.teamW + EN11.teamW * avg / 100; return md;
};
/* maç sonrası: enerji, puan, yorgunluk sakatlığı */
let CM_PLAYED = null;
const _lmDone5 = lmDone;
lmDone = function () { if (LM) CM_PLAYED = LM.xi.concat(LM.offIds || []); _lmDone5(); CM_PLAYED = null; };
const _cmApply5 = cmApply;
cmApply = function (e, info, res) {
  const C = g.coach, sq = g.sq[C.id] || [], ids = CM_PLAYED || bestXI(C.id, C.form).map(p => p.id);
  _cmApply5(e, info, res);
  const played = new Set(ids), ev = res.ev || [], gf = ev.filter(x => !x.s).length, ga = ev.filter(x => x.s).length, xi = sq.filter(p => played.has(p.id)), avgR = xi.length ? xi.reduce((s, p) => s + p.r, 0) / xi.length : 70;
  const oppS = club(info.oid) ? club(info.oid).s : 70, base = 6.4 + (res.win ? .45 : res.draw ? 0 : -.45) + (oppS - club(C.id).s) * .02;
  sq.forEach(p => {
    if (played.has(p.id)) {
      const goals = ev.filter(x => !x.s && x.pid === p.id).length, def = p.p === 'GK' || p.p === 'DF';
      let rt = base + (p.r - avgR) / 10 + gauss() * .55 + goals * .9 + (def ? (ga === 0 ? .35 : -ga * .22) : gf * .08) - (pen11(p) < 40 ? .4 : 0);
      rt = Math.round(cl(rt, 3.5, 10) * 10) / 10; p.rt = Math.round(((p.rt || 0) + rt) * 10) / 10; p.rn = (p.rn || 0) + 1; p.lr = rt;
      const drop = (EN11.play + Math.max(0, p.age - 28) * EN11.age + Math.random() * 6) * (C.load === 2 ? 1.1 : C.load === 0 ? .92 : 1) * (p.p === 'GK' ? .5 : 1);
      p.en = Math.max(5, Math.round(pen11(p) - drop));
      if (p.en < 35 && !p.inj && Math.random() < EN11.tiredInj) { p.inj = R(1, 4); L(`${pname(p)} yorgunluktan sakatlandı (${p.inj} hafta). Rotasyon yapmalısın.`); }
    } else p.en = Math.min(100, Math.round(pen11(p) + EN11.bench));
  });
};
/* haftalık toparlanma */
const _cws5 = coachWeekStart;
coachWeekStart = function (auto) {
  _cws5(auto); const C = g.coach; if (!C || g.phase !== 'coach') return;
  const rec = EN11.rest + (C.load === 0 ? 6 : C.load === 2 ? -4 : 0) + ((C.staff || {}).fiz || 0) * 2;
  (g.sq[C.id] || []).forEach(p => { p.en = Math.min(100, Math.round(pen11(p) + rec)); });
};
const _cse5 = coachSeasonEnd;
coachSeasonEnd = function () { const C = g.coach; if (C) (g.sq[C.id] || []).forEach(p => { p.rt = 0; p.rn = 0; p.en = 100; }); return _cse5(); };
const avgRt = p => p.rn ? (p.rt / p.rn).toFixed(1) : '—';
const enCol = v => v >= 70 ? '#56c98d' : v >= 45 ? '#e8c468' : '#ff6b5b';

/* ---------- kadro: enerji ve puan tablosu ---------- */
function formCard(id) {
  const C = g.coach, sq = (g.sq[id] || []).slice(), xi = new Set(bestXI(id, C.form).map(p => p.id)), ord = { GK: 0, DF: 1, MF: 2, FW: 3 };
  sq.sort((a, b) => (ord[a.p] - ord[b.p]) || (b.r - a.r));
  return `<div class="card"><div class="eyebrow">⚡ Enerji ve maç puanları</div><div class="m">Oynayan yorulur, oynamayan toparlanır. Yorgun oyuncu daha kötü oynar ve sakatlanabilir; rotasyon yap.</div>
  <div class="ent"><div class="enh"><span>#</span><span>Oyuncu</span><span>Enerji</span><span>Ort.</span><span>Son</span></div>${sq.map(p => { const v = pen11(p); return `<div class="enr ${xi.has(p.id) ? 'xi' : ''} ${p.inj ? 'inj' : ''}" onclick="cPl(${p.id})"><span class="enn">${p.num || ''}</span><span class="enm"><i class="sqp p-${p.p}">${p.p}</i>${esc(short(pname(p)))}${p.inj ? ' 🚑' : ''}</span><span class="enbar"><i style="width:${v}%;background:${enCol(v)}"></i><b>${v}</b></span><span class="enav">${avgRt(p)}</span><span class="enl2">${p.lr != null ? p.lr.toFixed(1) : '—'}</span></div>`; }).join('')}</div>
  <div class="m">Yeşil satır: şu anki ilk 11. Dinlenme ve hafif antrenman enerjiyi hızlı toparlar; fizyoterapist (Ekip) de yardım eder.</div></div>`;
}
const _coachUI5 = coachUI;
coachUI = function () {
  let h = _coachUI5(); const C = g.coach; if (!C || CV2 !== 'kadro') return h;
  const k = h.indexOf('<div class="card"><div class="eyebrow">📈 Gelişim raporu');
  return k < 0 ? h + formCard(C.id) : h.slice(0, k) + formCard(C.id) + h.slice(k);
};
/* taktik tahtası jetonunda enerji halkası ve ortalama puan */
const _pitchSVG5 = pitchSVG;
pitchSVG = function (id, form) {
  let h = _pitchSVG5(id, form); const sq = g.sq[id] || [];
  return h.replace(/<g class="tok" onclick="cPl\((\d+)\)"><circle cx="([\d.]+)" cy="([\d.]+)"/g, (all, pid, x, y) => {
    const p = sq.find(q => q.id === +pid); if (!p) return all; const v = pen11(p), C2 = 2 * Math.PI * 9.4;
    return `<g class="tok" onclick="cPl(${pid})"><circle cx="${x}" cy="${y}" r="9.4" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="9.4" fill="none" stroke="${enCol(v)}" stroke-width="1.6" stroke-dasharray="${C2 * v / 100} ${C2}" transform="rotate(-90 ${x} ${y})"/>${p.num ? `<text x="${+x - 7.5}" y="${+y - 6.5}" font-size="3.6" font-weight="800" fill="#fff">${p.num}</text>` : ''}${p.rn ? `<text x="${x}" y="${+y + 17}" text-anchor="middle" font-size="3.4" fill="#e8c468">⌀ ${avgRt(p)}</text>` : ''}<circle cx="${x}" cy="${y}"`;
  });
};
/* oyuncu kartına enerji ve puan */
const _cPl5 = cPl;
cPl = function (pid) {
  _cPl5(pid); const C = g.coach, q = C && (g.sq[C.id] || []).find(x => x.id === pid), el = document.getElementById('setp'); if (!q || !el) return;
  const box = el.querySelector('.prow'); if (!box) return; const v = pen11(q), d = document.createElement('div');
  d.innerHTML = `<div class="prow"><span>Enerji</span>${bar(v, 100, v < 45 ? 'bad' : '')}<b>${v}</b></div><div class="kvs"><div class="kv"><span>Ortalama puan</span><b>${avgRt(q)}</b></div><div class="kv"><span>Son maç</span><b>${q.lr != null ? q.lr.toFixed(1) : '—'}</b></div><div class="kv"><span>Forma no</span><b>${q.num || '—'}</b></div></div>`;
  box.parentNode.insertBefore(d, box); if (typeof i18nApply === 'function') i18nApply(d);
};

/* ---------- canlı maç: MAÇI İZLE ---------- */
let LMV = null;
const _lmSeg5 = lmSeg;
lmSeg = function () {
  const m = LM; if (!m || m.res || m.noAnim) return _lmSeg5();
  const s = m.seg, sc0 = m.sc.slice(), n0 = m.log.length; _lmSeg5(); if (!LM || LM !== m) return;
  const evs = m.ev.filter(x => x.m > s * 15 && x.m <= s * 15 + 15).map(x => ({ t: cl((x.m - s * 15) / 15, .08, .96), side: x.s ? 1 : 0, n: x.p || '' })).sort((a, b) => a.t - b.t);
  LMV = { s, t0: performance.now(), dur: 9000 + evs.length * 1500, evs, sc: sc0.slice(), sc0, nNew: m.log.length - n0, mom: m.mom || 0, pos: 0, ball: { x: 50, y: 30 }, to: null, tt: 0, carrier: null, flash: null, fired: 0 };
  draw(); lmvLoop();
};
const _lmSimAll5 = lmSimAll;
lmSimAll = function () { if (LM) LM.noAnim = 1; LMV = null; _lmSimAll5(); if (LM) LM.noAnim = 0; draw(); };
function lmvSkip() { if (LMV) { LMV.skip = 1; } }
function lmvTeams() {
  const C = g.coach, us = lmOn(), c = club(C.id), oc = LM.info.oid && club(LM.info.oid), oxi = LM.info.oid && g.sq[LM.info.oid] ? bestXI(LM.info.oid, '4-4-2') : null;
  const lay = (L, side) => { const by = p => L.filter(q => q.p === p), rows = [['GK', 6], ['DF', 22], ['MF', 42], ['FW', 62]], out = [];
    rows.forEach(([pos, x]) => { const R0 = by(pos); R0.forEach((p, i) => out.push({ hx: side ? 100 - x : x, hy: R0.length === 1 ? 30 : 8 + 44 * i / (R0.length - 1), num: p.num || (i + 2), gk: pos === 'GK', id: p.id, n: p.n ? short(pname(p)) : '' })); }); return out; };
  const fake = n => ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'].map((p, i) => ({ p, num: [1, 2, 4, 5, 3, 8, 6, 10, 7, 9, 11][i] }));
  return { A: lay(us, 0), B: lay(oxi || fake(), 1), ca: [c.c1, c.c2], cb: oc ? [oc.c1, oc.c2] : ['#f2f2f2', '#c0392b'] };
}
function lmvLoop() {
  const V = LMV; if (!V) return;
  const cv = document.getElementById('lmcv'); if (!cv) { if (scr === 'game' || !LM) { LMV = null; return; } return requestAnimationFrame(lmvLoop); }
  const now = performance.now(), k = V.skip ? 1 : cl((now - V.t0) / V.dur, 0, 1);
  if (!V.T) V.T = lmvTeams();
  const W = cv.clientWidth || 340, H = Math.round(W * .62), dpr = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; }
  const x = cv.getContext && cv.getContext('2d'); if (!x) { LMV = null; return; } x.setTransform(dpr * W / 100, 0, 0, dpr * H / 60, 0, 0);
  /* saha */
  x.fillStyle = '#2f8f2a'; x.fillRect(0, 0, 100, 60); for (let i = 0; i < 10; i += 2) { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(i * 10, 0, 10, 60); }
  x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = .35; x.strokeRect(2, 2, 96, 56); x.beginPath(); x.moveTo(50, 2); x.lineTo(50, 58); x.stroke(); x.beginPath(); x.arc(50, 30, 7, 0, 7); x.stroke(); x.strokeRect(2, 18, 12, 24); x.strokeRect(86, 18, 12, 24); x.strokeRect(0, 26, 2, 8); x.strokeRect(98, 26, 2, 8);
  /* olay: gol zamanı geldi mi */
  const nextEv = V.evs[V.fired], tEv = nextEv ? nextEv.t : 2, lead = tEv - k;
  let poss = V.pos;
  if (nextEv && lead < .1) poss = nextEv.side; else if (Math.random() < .012) poss = Math.random() < .5 + (V.mom || 0) / 160 ? 0 : 1;
  V.pos = poss;
  const t = now / 1000, push = side => (side === poss ? 10 : -6) * (side ? -1 : 1);
  const pl = [];
  V.T.A.forEach((p, i) => pl.push({ ...p, side: 0, x: cl(p.hx + (p.gk ? 0 : push(0) + Math.sin(t * .9 + i) * 3), 3, 97), y: cl(p.hy + Math.cos(t * .7 + i * 1.3) * 3, 3, 57) }));
  V.T.B.forEach((p, i) => pl.push({ ...p, side: 1, x: cl(p.hx + (p.gk ? 0 : push(1) + Math.sin(t * .8 + i * 2) * 3), 3, 97), y: cl(p.hy + Math.cos(t * .6 + i) * 3, 3, 57) }));
  /* top: oyuncular arasında pas */
  const mates = pl.filter(p => p.side === poss && !p.gk);
  if (!V.to || now > V.tt) { const fwd = mates.slice().sort((a, b) => poss ? a.x - b.x : b.x - a.x), pick = lead < .1 && lead > -0.02 ? fwd[0] : mates[Math.floor(Math.random() * mates.length)]; V.from = { ...V.ball }; V.to = pick; V.tf = now; V.tt = now + rf(500, 950); }
  const tgt = pl.find(p => p.side === V.to.side && p.num === V.to.num) || V.to, u = cl((now - V.tf) / Math.max(1, V.tt - V.tf), 0, 1);
  V.ball = { x: V.from.x + (tgt.x - V.from.x) * u, y: V.from.y + (tgt.y - V.from.y) * u };
  /* gol */
  if (nextEv && k >= tEv) {
    V.fired++; V.flash = { t: now, txt: nextEv.side ? T('GOL YEDİK') : `⚽ GOL! ${nextEv.n}`, side: nextEv.side }; V.sc[nextEv.side]++; V.ball = { x: nextEv.side ? 1 : 99, y: 30 }; V.from = { ...V.ball }; V.tt = now + 900; V.tf = now;
    try { if (!nextEv.side) { sfx('net'); sfx('roar'); voiceSay('goal', 'Gol!', 3); } else { sfx('groan'); voiceSay('concede', 'Gol yedik.', 2); } } catch (e) { }
    const sc = document.getElementById('lmsc'); if (sc) sc.textContent = lmvScore();
  }
  pl.forEach(p => { const col = p.side ? V.T.cb : V.T.ca, gk = p.gk; x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(p.x + .4, p.y + 1.8, 1.9, .7, 0, 0, 7); x.fill();
    x.fillStyle = gk ? (p.side ? '#ffd23f' : '#3ad1ff') : col[0]; x.strokeStyle = gk ? '#111' : col[1]; x.lineWidth = .45; x.beginPath(); x.arc(p.x, p.y, 2.1, 0, 7); x.fill(); x.stroke();
    x.fillStyle = lum(gk ? '#ffd23f' : col[0]) > 150 ? '#111' : '#fff'; x.font = '800 2.3px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.num, p.x, p.y + .1); });
  x.fillStyle = '#fff'; x.strokeStyle = '#111'; x.lineWidth = .3; x.beginPath(); x.arc(V.ball.x, V.ball.y, .9, 0, 7); x.fill(); x.stroke();
  if (V.flash && now - V.flash.t < 1800) { const a = 1 - (now - V.flash.t) / 1800; x.globalAlpha = Math.min(1, a * 2); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 22, 100, 16); x.fillStyle = V.flash.side ? '#ff8a6b' : '#ffe34d'; x.font = '900 7px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(V.flash.txt, 50, 30, 94); x.globalAlpha = 1; }
  const clk = document.getElementById('lmclock'); if (clk) clk.textContent = `${Math.min(90, Math.round(V.s * 15 + k * 15))}'`;
  if (k >= 1) { while (V.fired < V.evs.length) { V.sc[V.evs[V.fired].side]++; V.fired++; } V.done = 1; LMV = null; return draw(); }
  requestAnimationFrame(lmvLoop);
}
function lmvScore() { const V = LMV, i = LM.info; if (!V) return ''; return i.home ? `${V.sc[0]} – ${V.sc[1]}` : `${V.sc[1]} – ${V.sc[0]}`; }
const _lmatchUI5 = lmatchUI;
lmatchUI = function () {
  let h = _lmatchUI5(); const m = LM; if (!m) return h; const V = LMV;
  const view = `<div class="card lmv"><div class="row-b"><div class="eyebrow">📺 Maçı izle</div><span id="lmclock" class="m">${V ? V.s * 15 : m.res ? 90 : m.seg * 15}'</span></div><canvas id="lmcv" style="width:100%;display:block;border-radius:10px"></canvas>${V ? '<button class="btn ghost sm" onclick="lmvSkip()">⏩ Geç</button>' : `<div class="m">${m.res ? 'Maç bitti.' : '“15 dakika oynat” deyince bu bölüm sahada canlanır.'}</div>`}</div>`;
  h = h.replace('<div class="card lviz">', view + '<div class="card lviz">');
  if (V) {
    h = h.replace(/<b class="sc">[^<]*<\/b>/, `<b class="sc" id="lmsc">${lmvScore()}</b>`);
    if (V.nNew > 0) { let cut = 0; h = h.replace(/<div class="fi [^"]*"><b>\d+'<\/b>[^]*?<\/div>/g, mt => cut++ < V.nNew ? '' : mt); }
    const ci = h.lastIndexOf('<div class="card">'); if (ci > 0) h = h.slice(0, ci);
  }
  return h;
};
const _draw5 = draw;
draw = function () { _draw5(); if (LMV && document.getElementById('lmcv')) requestAnimationFrame(lmvLoop); else if (LM && document.getElementById('lmcv') && !LMV) lmvStatic(); };
function lmvStatic() { const tmp = { s: LM.seg, t0: performance.now() - 1, dur: 1e12, evs: [], sc: LM.sc.slice(), mom: LM.mom || 0, pos: 0, ball: { x: 50, y: 30 }, stat: 1 }; LMV = tmp; lmvLoop(); if (LMV === tmp) { LMV = null; } }

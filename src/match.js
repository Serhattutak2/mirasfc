/* ============================================================
   MİRAS FC — MAÇ AKIŞI (v2)
   mkMatch: maçın akışı (takım golleri + senin pozisyonların)
   Pozisyonlar engine.js içinde NSS tarzı fizikle oynanır.
   quickMatch / resolveAuto: hızlı sonuç (hava, uyum, form etkili)
   applyMatch: lig/kupa/Avrupa/milli tabloları + e.res (fikstür bağlantısı)
   ============================================================ */
function ntSquad(ct) {
  const lang = COUNTRIES.find(x => x.n === ct) ? cinfo(ct).lang : ({ 'Portekiz': 'pt', 'Uruguay': 'es', 'Kolombiya': 'es', 'Ekvador': 'es', 'Şili': 'es', 'Paraguay': 'es', 'Peru': 'es', 'Meksika': 'es', 'Belçika': 'fr' }[ct] || 'en');
  const NP = NAMES[lang] || NAMES.en, rnd = srng(hash(ct + g.season)), s = ntStr(ct), out = [];
  ['GK', 'GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'].forEach((p, i) => out.push({ n: NP.f[Math.floor(rnd() * NP.f.length)] + ' ' + NP.l[Math.floor(rnd() * NP.l.length)], p, r: Math.round(s - 2 + (rnd() - .5) * 8), num: i + 1 }));
  return out.sort((a, b) => b.r - a.r);
}
function sideInfo(info) {
  const myId = myClubId();
  if (info.nt) { const nc = ntCt(), u = info.u21 ? 9 : 0; return { us: { n: nc + (u ? ' U21' : ''), s: ntStr(nc) - u, c: NTCOL[nc] || ['#1d3f8f', '#fff'], sq: ntSquad(nc).map(x => ({ ...x, r: x.r - u })) }, th: { n: info.on + (u ? ' U21' : ''), s: ntStr(info.on) - u, c: NTCOL[info.on] || [P(PALETTE), '#ffffff'], sq: ntSquad(info.on).map(x => ({ ...x, r: x.r - u })) } }; }
  const a = club(myId), b = club(info.oid);
  return { us: { n: clubName(a.n), s: teamStr(myId, info.home && !info.neutral), c: [a.c1, a.c2], sq: (g.sq && g.sq[myId]) || squad(myId) }, th: { n: clubName(b.n), s: teamStr(info.oid, !info.home && !info.neutral), c: [b.c1, b.c2], sq: (g.sq && g.sq[info.oid]) || squad(info.oid) } };
}
const WXM = { acik: 1, bulut: 1, yagmur: .92, ruzgar: .95, kar: .82, sicak: .93, sis: .9 };

function mkMatch(e, info, sel) {
  const T = sideInfo(info), plays = !sel.out, on = sel.start ? 0 : sel.sub ? sel.on : 91, off = sel.start ? (sel.off || 90) : 90;
  if (Math.abs(lum(T.us.c[0]) - lum(T.th.c[0])) < 40) T.th.c = [T.th.c[1], T.th.c[0]];
  if (Math.abs(lum(T.us.c[0]) - lum(T.th.c[0])) < 40) T.th.c = ['#f2f2f2', '#222'];
  const mins = plays ? Math.max(0, off - on) : 0, wx = info.wx || 'acik';
  const eff = T.us.s + (plays ? (effOvr() - T.us.s) * .08 * mins / 90 : 0) + (info.nt ? 0 : ((g.uyum || 50) - 50) / 40);
  const n = plays ? Math.max(1, Math.round({ FW: 6.4, MF: 6.3, DF: 6 }[g.pos] * (.72 + g.role * .08) * mins / 90 + R(-1, 1))) : 0;
  const mom = [];
  for (let i = 0; i < n; i++) mom.push({ min: R(on + 1, Math.max(on + 1, off)), type: momentType(info) });
  mom.sort((a, b) => a.min - b.min);
  const nA = mom.filter(m => m.type !== 'def').length, nD = mom.filter(m => m.type === 'def').length, wm = WXM[wx] || 1;
  const lu = xg(eff, T.th.s) * wm * (1 - Math.min(.5, .065 * nA)), lt = xg(T.th.s, eff) * wm * (1 - Math.min(.4, .06 * nD));
  const ev = [];
  for (let i = pois(lu); i > 0; i--) ev.push({ min: R(1, 90), side: 0, who: scorer(T.us.sq) });
  for (let i = pois(lt); i > 0; i--) ev.push({ min: R(1, 90), side: 1, who: scorer(T.th.sq) });
  ev.sort((a, b) => a.min - b.min);
  return { e, info, sel, T, on, off, plays, mom, mi: 0, ev, ei: 0, t: 0, sc: [0, 0], feed: [], stage: 'live', my: { g: 0, a: 0, ok: 0, bad: 0, sh: 0, con: 0, tk: 0, mins }, rating: 6 };
}
function momentType(info) {
  const t = momentType0(info), w = g.wr || 'dengeli', r = Math.random();
  if (w === 'hucum' && t === 'def' && r < .55) return r < .25 ? 'drib' : 'atk';
  if (w === 'savunma' && t !== 'def' && t !== 'pen' && t !== 'fk' && r < .35) return 'def';
  return t;
}
function momentType0(info) {
  const r = Math.random(), p = g.pos, star = g.role >= 3 && g.st.sut >= 66;
  if (p === 'FW') return r < .3 ? 'atk' : r < .38 ? 'drib' : r < .46 ? 'kontra' : r < .62 ? 'head' : r < .74 ? 'one' : r < .9 ? 'build' : r < .95 && star ? 'fk' : r < .97 && star ? 'pen' : r < .99 ? 'def' : 'atk';
  if (p === 'MF') return r < .22 ? 'atk' : r < .28 ? 'drib' : r < .34 ? 'kontra' : r < .58 ? 'def' : r < .76 ? 'build' : r < .84 ? 'one' : r < .92 && star ? 'fk' : r < .97 ? 'head' : r < .99 && star ? 'pen' : 'build';
  return r < .6 ? 'def' : r < .76 ? 'head' : r < .9 ? 'build' : r < .95 ? 'atk' : r < .98 && star ? 'fk' : 'def';
}
function scorer(sq) { const w = sq.filter(x => x.p !== 'GK').map(x => [x, x.p === 'FW' ? 3 : x.p === 'MF' ? 1.6 : .4]); let t = w.reduce((s, x) => s + x[1], 0) * Math.random(); for (const [x, v] of w) { t -= v; if (t <= 0) return pname(x); } return w.length ? pname(w[0][0]) : '—'; }

/* ---------- Canlı akış ---------- */
function feedTo(min) {
  while (M.ei < M.ev.length && M.ev[M.ei].min <= min) {
    const x = M.ev[M.ei++]; M.sc[x.side]++;
    M.feed.unshift({ m: x.min, t: `⚽ ${x.side ? M.T.th.n : M.T.us.n} golü: ${short(x.who)}`, k: x.side ? 'bad' : 'good' });
  }
  if (M.t < 45 && min >= 45) M.feed.unshift({ m: 45, t: `Devre: ${M.T.us.n} ${M.sc[0]}-${M.sc[1]} ${M.T.th.n}`, k: 'mut' });
  if (M.plays && M.on > 0 && M.t < M.on && min >= M.on) M.feed.unshift({ m: M.on, t: 'Oyuna girdin!', k: 'gold' });
  M.t = min;
}
function nextMoment() {
  if (M.mi >= M.mom.length) { endMatch(); return; }
  const mo = M.mom[M.mi]; feedTo(mo.min); M.stage = 'scene'; S = mkScene(mo); draw();
}
function simRest() {
  if (S) { cancelAnimationFrame(RAF); S = null; }
  while (M.mi < M.mom.length) { const mo = M.mom[M.mi]; feedTo(mo.min); resolveAuto(M, mo); M.mi++; }
  endMatch();
}
function endMatch() {
  feedTo(90); M.t = 90;
  if (M.info.ko && M.sc[0] === M.sc[1]) shootout(M);
  finishMatch(M); M.stage = 'post'; S = null; cancelAnimationFrame(RAF); draw();
}
function shootout(m) {
  let a = 0, b = 0; const pk = s => Math.random() < .74 + (s - 75) / 300;
  for (let i = 0; i < 5; i++) { if (pk(m.T.us.s)) a++; if (pk(m.T.th.s)) b++; }
  while (a === b) { if (pk(m.T.us.s)) a++; if (pk(m.T.th.s)) b++; }
  m.pens = [a, b]; m.feed.unshift({ m: 120, t: `Penaltılar: ${a}-${b} ${a > b ? '— kazandınız!' : '— elendiniz.'}`, k: a > b ? 'good' : 'bad' });
}
function finishMatch(m) {
  const my = m.my, w = m.sc[0] > m.sc[1] || (m.pens && m.pens[0] > m.pens[1]), d = m.sc[0] === m.sc[1] && !m.pens;
  let r = 6 + my.g * 1.05 + my.a * .65 + my.ok * .14 - my.bad * .16 - my.con * .45 + my.tk * .2 + (w ? .35 : d ? 0 : -.3);
  if (m.my.mins < 30) r = 6 + (r - 6) * .7;
  m.rating = m.plays ? +cl(r, 3, 10).toFixed(1) : 0;
  m.res = { sc: [...m.sc], pens: m.pens || null, win: w, draw: d, my: { ...my, played: m.plays, rating: m.rating }, opp: m.T.th.n, us: m.T.us.n };
}

/* ---------- Otomatik çözüm ---------- */
function resolveAuto(m, mo) {
  const st = g.st, wx = m.info.wx || 'acik', fm2 = (1 + (g.form - 6.5) * .06 + (g.sf || 0) * .02 + ((g.uyum || 50) - 50) / 500) * (wx === 'kar' || wx === 'yagmur' ? .92 : wx === 'ruzgar' ? .95 : 1);
  const my = m.my, rel = s => Math.pow(cl(s / m.T.th.s, .6, 1.3), 2);
  const goal = () => { m.sc[0]++; my.g++; m.feed.unshift({ m: mo.min, t: `⚽ GOL! ${g.name}`, k: 'gold' }); };
  const conc = () => { m.sc[1]++; my.con++; m.feed.unshift({ m: mo.min, t: `⚽ ${m.T.th.n} golü (pozisyonda sen vardın)`, k: 'bad' }); };
  const ast = () => { m.sc[0]++; my.a++; m.feed.unshift({ m: mo.min, t: `⚽ Gol! Asist: ${g.name}`, k: 'good' }); };
  const t = mo.type, pk = k => g.perks && g.perks[k] ? 1 : 0, q = rel(st.sut * .6 + st.tek * .4) * fm2 * (1 + (pk('bitirici') + pk('uzak')) * .07 + pk('calim') * .04);
  if (t === 'pen') { my.sh++; Math.random() < .72 + (st.sut - 70) / 220 + pk('soguk') * .08 ? goal() : (my.bad++, m.feed.unshift({ m: mo.min, t: 'Penaltıyı kaçırdın.', k: 'bad' })); return; }
  if (t === 'fk') { my.sh++; Math.random() < .07 * q * (1 + pk('falso') * .6) ? goal() : my.ok++; return; }
  if (t === 'head') { my.sh++; const p = .07 * rel((st.fiz + st.sut) / 2) * fm2 * (1 + pk('hava') * .4); Math.random() < p ? goal() : Math.random() < .5 ? my.ok++ : my.bad++; return; }
  if (t === 'def') { const p = cl(.62 + (st.def - m.T.th.s) / 70 + (g.form - 6.5) * .05 + pk('kesici') * .06, .25, .92); if (Math.random() < p) { my.tk++; my.ok++; } else { my.bad++; if (Math.random() < .3) conc(); } return; }
  const base = { drib: { FW: .07, MF: .045, DF: .02 }, atk: { FW: .05, MF: .033, DF: .016 }, kontra: { FW: .08, MF: .05, DF: .02 }, one: { FW: .16, MF: .09, DF: .05 }, build: { FW: .018, MF: .013, DF: .007 } }[t][g.pos];
  const ab = { drib: .03, atk: .03, kontra: .05, one: .02, build: .045 }[t] * rel(st.pas) * fm2;
  const r = Math.random();
  if (r < base * q) { my.sh++; goal(); } else if (r < base * q + ab) { ast(); my.ok++; } else if (Math.random() < .55) my.ok++; else my.bad++;
}
function quickMatch(e, info) {
  const sel = info.sel || selection(info), m = mkMatch(e, info, sel);
  m.mom.forEach(mo => resolveAuto(m, mo));
  m.ev.forEach(x => m.sc[x.side]++);
  if (info.ko && m.sc[0] === m.sc[1]) shootout(m);
  finishMatch(m); return m.res;
}

/* ---------- Sonuçları tablolara işle (oyuncu ve teknik direktör ortak) ---------- */
function applyTables(e, info, res) {
  const us = res.sc[0], th = res.sc[1], won = res.win;
  if (e.k === 'L' && g.lg) simLeagueRound(e.r, [us, th]);
  if (e.k === 'C' && g.cup) {
    if (won) { g.cup.pool = g.cup.pool.filter(x => x !== g.cup.cur); g.cup.cur = null; g.cup.r++; if (g.cup.r >= 6) { g.cup.alive = 0; g.cup.won = 1; if (g.club && (res.my.played || g.ss.ap >= 8)) g.car.cup++; if (g.coach) g.coach.tr = (g.coach.tr || 0) + 1; news(`${g.cup.n} şampiyonu: ${res.us}`); L(`🏆 ${g.cup.n}'nı kazandınız!`); g.hap += 8; g.rep += 3; } }
    else { g.cup.alive = 0; news(`${g.cup.n}: ${res.us}, ${CUP_R[e.r]} turunda ${res.opp} karşısında elendi.`); }
  }
  if (e.k === 'E' && g.euro) {
    const E = g.euro;
    if (e.r < 6) {
      const me = E.grp[0], o = E.grp.find(x => x.id === info.oid); rec(me, us, th); rec(o, th, us);
      E.gfx[e.r].filter(p => !p.includes(0)).forEach(([i, j]) => { const s = quickScore(teamStr(E.grp[i].id, 1), teamStr(E.grp[j].id, 0)); rec(E.grp[i], s[0], s[1]); rec(E.grp[j], s[1], s[0]); });
      E.gr = e.r + 1;
      if (E.gr === 6) { const pos = sortT(E.grp).findIndex(x => x.id === myClubId()) + 1; if (pos <= 2) L(`${E.n}: grubu ${pos}. bitirdiniz, Son 16'dasınız.`); else { E.alive = 0; L(`${E.n}: grupta ${pos}. oldunuz, elendiniz.`); } }
    } else {
      if (won) { E.pool = E.pool.filter(x => x !== E.cur); E.cur = null; E.ko++; if (E.ko >= 4) { E.alive = 0; E.won = 1; if (g.club) { if (E.top) g.car.ec++; else g.car.el = (g.car.el || 0) + 1; } if (g.coach) g.coach.tr = (g.coach.tr || 0) + 2; news(`${E.n} şampiyonu: ${res.us}`); L(`🏆 ${E.n} ŞAMPİYONU!`); g.hap += 15; g.rep += 10; } }
      else { E.alive = 0; L(`${E.n}: ${EU_KR[e.r - 6]} turunda elendiniz.`); }
    }
  }
  if (g.tour && info.tour) tourApply(info, res);
  e.res = `${info.home ? us : th}-${info.home ? th : us}${res.pens ? ` (p ${res.pens[0]}-${res.pens[1]})` : ''}`; e.w2 = won ? 1 : res.draw ? 0 : -1;
}
function applyMatch(e, info, res) {
  applyTables(e, info, res);
  const my = res.my, won = res.win, us = res.sc[0], th = res.sc[1];
  bpXP(my.played ? 8 + my.g * 4 : 3);
  if (my.played) {
    if (info.nt && info.u21) { g.nat.u21 = (g.nat.u21 || 0) + 1; g.nat.u21g = (g.nat.u21g || 0) + my.g; } else if (info.nt) { g.nat.caps++; g.nat.g += my.g; if (!info.tour && e.r === 0 || info.tour) { if (!g.ntLock) { g.ntLock = ntCt(); L(`${ntCt()} adına resmi maça çıktın; artık başka bir milli takımı seçemezsin.`); } } } else { g.car.ap++; g.car.g += my.g; g.car.a += my.a; g.ss.ap++; g.ss.g += my.g; g.ss.a += my.a; g.ss.rs += my.rating; g.uyum = clr((g.uyum || 50) + .6, 0, 100); }
    e.my = my.rating;
    g.form = cl(g.form * .7 + my.rating * .3, 3, 10);
    const heat = info.wx === 'sicak' ? 1.25 : 1;
    g.fit = clr(g.fit - my.mins * .24 * heat * (1.1 - g.st.fiz / 500), 0, 100);
    g.mor = clr(g.mor + (my.rating - 6.4) * 3 + (won ? 2 : res.draw ? 0 : -2), 0, 100);
    g.rep = cl(g.rep + (my.rating - 6.5) * .25 + (my.g ? .3 : 0) * (info.eu || info.nt ? 2 : 1), 0, 100);
    K.forEach(k => g.xp[k] += my.mins / 90 * .05 * W[g.pos][k] * 3 * ageF(g.age));
    if (g.con && !info.nt) { money((g.con.app || 0) + (g.con.goal || 0) * (my.g + my.a), 'Maç ve gol primleri'); }
    if (Math.random() < .018 + (100 - g.fit) / 1400 + (g.age > 30 ? .01 : 0) + (info.wx === 'kar' || info.wx === 'yagmur' ? .006 : 0)) injure(R(1, 4), 'maçta');
  } else if (!info.nt) g.mor = clr(g.mor - (g.role >= 2 ? 3 : 1), 0, 100);
  if (won && g.con && my.played) money(Math.round(g.con.sal * .004), 'Galibiyet primi');
  g.wres = g.wres || [];
  g.wres.push({ c: info.short, t: `${info.home ? res.us : res.opp} ${info.home ? us : th}-${info.home ? th : us} ${info.home ? res.opp : res.us}${res.pens ? ` (pen. ${res.pens[0]}-${res.pens[1]})` : ''}`, r: my.played ? my.rating : null, g: my.g, a: my.a, w: won ? 1 : res.draw ? 0 : -1 });
  tidy();
}

/* ---------- Maç ekranı ---------- */
function scoreBar() {
  const T = M.T, cb = c => `<i class="kit" style="background:linear-gradient(90deg,${c[0]} 60%,${c[1]} 60%)"></i>`, w = WX[M.info.wx || 'acik'];
  return `<div class="sb"><div class="sbc">${esc(M.info.comp)} · ${esc(M.info.round)} · ${w.i} ${w.n}</div><div class="sbr"><span class="tm">${cb(T.us.c)}${esc(T.us.n)}</span><b class="sc">${M.sc[0]} – ${M.sc[1]}</b><span class="tm r">${esc(T.th.n)}${cb(T.th.c)}</span></div><div class="sbc">${M.stage === 'post' ? 'Maç sonu' + (M.pens ? ` · pen. ${M.pens[0]}-${M.pens[1]}` : '') : M.t + "'"}</div></div>`;
}
function feedHTML(n) { return `<div class="feed">${M.feed.slice(0, n || 40).map(x => `<div class="fi ${x.k}"><b>${x.m}'</b> ${esc(x.t)}</div>`).join('') || '<div class="fi mut">Hakem düdüğü çaldı.</div>'}</div>`; }
const WXTIP = { yagmur: 'Zemin kaygan: top ıslak çimde hızlı kayar, kontrol zorlaşır.', kar: 'Kar: top çabuk durur, sekme düşük. Yerden paslar kısa kalır.', ruzgar: 'Rüzgâr havadaki topu sürükler; sağ üstteki oka bak.', sicak: 'Sıcak: ikinci yarıda oyuncular yavaşlar, kondisyon hızlı düşer.', sis: 'Sis: uzağı görmek zor.', acik: '', bulut: '' };
function matchUI() {
  if (!M) return '';
  if (M.stage === 'scene' && S) return `${scoreBar()}<div class="scene"><div class="stitle">${MTITLE[S.type]} <span>${S.min}'</span></div><div class="cvwrap"><canvas id="cv" aria-label="Maç sahnesi"></canvas></div><div id="mctl" class="mctl">${ctlHTML()}</div></div>`;
  if (M.stage === 'post') {
    const my = M.res.my;
    return `${scoreBar()}<div class="card"><div class="eyebrow">Maç raporu</div>${M.plays ? `<div class="rate"><b>${my.rating.toFixed(1)}</b><span>Senin puanın</span></div><div class="stats4"><div><b>${my.g}</b>Gol</div><div><b>${my.a}</b>Asist</div><div><b>${my.sh}</b>Şut</div><div><b>${my.tk}</b>Top kapma</div></div><div class="m">${my.mins} dakika oynadın.</div>` : '<div class="m">Bu maçta forma giymedin.</div>'}</div>${feedHTML()}<div class="bar-actions"><button class="btn big" onclick="matchDone()">Devam</button></div>`;
  }
  const wr = g.wr || 'dengeli', wrUI = M.plays ? `<div class="m">Oyun tarzın (pozisyon türlerini ve kondisyonu etkiler):</div><div class="segs">${[['savunma', 'Savunma'], ['dengeli', 'Dengeli'], ['hucum', 'Hücum']].map(([k, l]) => `<button class="seg ${wr === k ? 'on' : ''}" onclick="setWR('${k}')">${l}</button>`).join('')}</div>` : '';
  const nx = M.mom[M.mi], waiting = M.plays && M.on > 0 && M.t < M.on, tip = WXTIP[M.info.wx || 'acik'];
  return `${scoreBar()}<div class="card">${tip ? `<div class="m">${WX[M.info.wx].i} ${tip}</div>` : ''}${M.plays ? (waiting ? `<div class="m">Yedek kulübesindesin. ${M.on}. dakikada oyuna gireceksin.</div>` : '') : `<div class="m">${esc(M.sel.why || 'Bu maçta oynamıyorsun')}.</div>`}
  ${wrUI}
  ${M.mi === 0 && M.plays ? `<div class="m dim">Nasıl oynanır: pozisyonda oyun durur. Topu kimde ise ondan başlayarak parmağınla bir YOL ÇİZ: arkadaşında biterse pas, kalede biterse şut (kavis = falso), boşlukta biterse topla sürersin. Şut ve paslarında top havaya çıkar: topa bas, ortasına basarsan mükemmel vuruş. Kırmızı yanan yerleri rakip keser. Pası kesersen ya da hamle zinciri kurarsan 🔥 puanın artar. Savunmada oyuncunu pas yoluna sürükle.</div>` : ''}
  ${nx ? `<button class="btn big" onclick="nextMoment()">Sonraki pozisyon · ${nx.min}' · ${MTITLE[nx.type]}</button><button class="btn ghost" onclick="simRest()">Kalan ${M.mom.length - M.mi} pozisyonu simüle et</button>` : `<button class="btn big" onclick="endMatch()">Maçı tamamla</button>`}</div>${feedHTML()}`;
}
function playMatch() {
  const m = nextWeekMatch(); if (!m) return;
  const e = m.e, info = m.info; info.sel = g.cur && g.cur.ci === g.wq[0] ? g.cur.sel : selection(info); g.cur = null;
  M = mkMatch(e, info, info.sel); M.src = 'week'; M.stage = 'live'; scr = 'match';
  M.feed.unshift({ m: 0, t: `${M.T.us.n} – ${M.T.th.n}: maç başladı. ${M.plays ? (M.on ? 'Yedek kulübesindesin.' : "İlk 11'desin.") : ''}`, k: 'mut' });
  draw();
}
function matchDone() {
  const m = M; if (!m) return; applyMatch(m.e, m.info, m.res); M = null;
  if (m.src === 'week') { g.wq.shift(); scr = 'game'; }
  else if (m.src === 'tour') scr = 'tour';
  sv(); draw();
}
function quickWeekMatch() {
  const m = nextWeekMatch(); if (!m) return;
  m.info.sel = g.cur && g.cur.ci === g.wq[0] ? g.cur.sel : selection(m.info); g.cur = null;
  const res = quickMatch(m.e, m.info); applyMatch(m.e, m.info, res); g.wq.shift(); g.lastQuick = res; sv(); draw();
}

/* NSS gibi oyun tarzı: hücum = daha çok atak ve çalım anı ama kondisyon düşer; savunma = daha çok pas kesme */
function setWR(k) { g.wr = k; if (M) for (let i = M.mi; i < M.mom.length; i++) M.mom[i].type = momentType(M.info); sv(); draw(); }
const _finishMatchWR = finishMatch;
finishMatch = function (m) { const r = _finishMatchWR(m); if (m.plays) { if (g.wr === 'hucum') g.fit = Math.max(0, (g.fit || 80) - 5); else if (g.wr === 'savunma') g.fit = Math.min(100, (g.fit || 80) + 2); } return r; };

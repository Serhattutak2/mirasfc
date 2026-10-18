/* ============================================================
   MİRAS FC — ÇEKİRDEK (v2): yardımcılar, isimler, kayıt, dünya,
   takvim (lig + kupa + Avrupa + milli), hava durumu, sezon sonu
   KURAL: g içinde asla fonksiyon saklanmaz (kayıt JSON'dur).
   ============================================================ */
const $ = id => document.getElementById(id);
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const P = a => a[Math.floor(Math.random() * a.length)];
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const clr = (v, a, b) => Math.round(cl(v, a, b));
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 0.816;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function srng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const fm = k => { const a = Math.abs(k), s = k < 0 && a >= .05 ? '−' : ''; return a >= 1e6 ? s + (a / 1e6).toFixed(2) + ' Mr€' : a >= 1000 ? s + (a / 1000).toFixed(1) + ' M€' : a < .05 ? '0 B€' : a < 10 ? s + a.toFixed(1).replace(/\.0$/, '') + ' B€' : s + Math.round(a) + ' B€'; };
const loc = w => /[aıou][^aeıioöuü]*$/i.test(w) ? 'da' : 'de';

/* ---------- İsim değiştirme ---------- */
const VSW = { a: 'e', e: 'a', ı: 'i', i: 'e', o: 'u', u: 'o', ö: 'o', ü: 'u', á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ã: 'a', õ: 'o', â: 'a', ê: 'e', ø: 'o', å: 'a', ä: 'a', y: 'i' };
const CSW = { k: 'c', c: 'k', s: 'z', z: 's', t: 'd', d: 't', n: 'm', m: 'n', r: 'l', l: 'r', v: 'w', w: 'v' };
/* Gerçeğe çok yakın, tek değişiklik: önce şapka/nokta (ç→c, ü→u, é→e), sonra çift harf (ll→l),
   sonra okunuşu koruyan ünsüz (c→k/s, z→s, w→v, ph→f), en son içteki bir ünlü */
const VWL = 'aeıioöuüáéíóúãõâêøåäy', DIA = { ç: 'c', ş: 's', ğ: 'g', ö: 'o', ü: 'u', é: 'e', í: 'i', á: 'a', ó: 'o', ú: 'u', ã: 'a', õ: 'o', ê: 'e', â: 'a', ñ: 'n', ć: 'c', č: 'c', š: 's', ž: 'z', đ: 'd', ø: 'o', å: 'a', ä: 'a', ë: 'e', ï: 'i' };
function altWord(w) {
  const L = [...w], lo = L.map(c => c.toLocaleLowerCase('tr')), n = L.length, isV = c => VWL.includes(c);
  const put = (i, c, len) => { const up = L[i] !== lo[i]; L.splice(i, len || 1, ...(c && up ? c[0].toLocaleUpperCase('tr') + c.slice(1) : c)); return L.join(''); };
  if (n < 4) return w;
  for (let i = n - 1; i >= 0; i--) if (DIA[lo[i]]) return put(i, DIA[lo[i]]);
  for (let i = n - 2; i > 0; i--) if (lo[i] === lo[i + 1] && !isV(lo[i])) return put(i, '', 1);
  for (let i = n - 2; i >= 0; i--) { if (lo[i] === 'p' && lo[i + 1] === 'h') return put(i, 'f', 2); if (lo[i] === 'q' && lo[i + 1] === 'u') return put(i, 'k', 2); if (lo[i] === 'c' && lo[i + 1] === 'k') return put(i, 'k', 2); }
  for (let i = n - 1; i >= 0; i--) {
    const c = lo[i], nx = lo[i + 1] || '', pv = lo[i - 1] || '';
    if (c === 'c' && nx && 'eiy'.includes(nx) && pv !== 's') return put(i, 's');
    if (c === 'c' && nx && 'aou'.includes(nx) && pv !== 's') return put(i, 'k');
    if (c === 'z' && i > 0) return put(i, 's');
    if (c === 'w' && i > 0) return put(i, 'v');
    if (c === 'x') return put(i, 'ks');
    if (c === 'y' && i > 0 && i < n - 1 && !isV(nx)) return put(i, 'i');
    if (c === 'k' && 'aou'.includes(nx) && i > 0) return put(i, 'c');
  }
  for (let i = n - 2; i > 0; i--) { const c = lo[i]; if (VSW[c] && L[i - 1] !== '-' && lo[i - 1] !== VSW[c] && lo[i + 1] !== VSW[c]) return put(i, VSW[c]); }
  for (let i = n - 1; i > 0; i--) { const c = lo[i]; if (CSW[c]) return put(i, CSW[c]); }
  return w;
}
/* oyuncu: isimde 1, soyisimde 1 harf */
function alter(full) { const p = full.split(' '); p[0] = altWord(p[0]); if (p.length > 1) p[p.length - 1] = altWord(p[p.length - 1]); return p.join(' '); }
/* kulüp: en uzun kelimede 1 harf */
const CN = {};
function clubName(real) {
  if (CN[real]) return CN[real];
  const p = real.split(' '); let k = 0; p.forEach((w, i) => { if (w.replace(/[^\p{L}]/gu, '').length > p[k].replace(/[^\p{L}]/gu, '').length) k = i; });
  p[k] = altWord(p[k]); return (CN[real] = p.join(' '));
}
const short = n => { const p = n.split(' '); return p.length > 1 ? p[0][0] + '. ' + p.slice(1).join(' ') : n; };
const code3 = n => { const p = n.replace(/[^\p{L} ]/gu, '').split(' ').filter(w => w.length > 2 && !/^(FC|AFC|SC|CF|VfB|VfL|RB|de|da|y)$/.test(w)); const w = p.sort((a, b) => b.length - a.length)[0] || n; return w.slice(0, 3).toLocaleUpperCase('tr'); };

/* ---------- Oyuncu özellikleri ---------- */
const K = ['hiz', 'pas', 'sut', 'tek', 'def', 'fiz'];
const KN = { hiz: 'Hız', pas: 'Pas', sut: 'Şut', tek: 'Teknik', def: 'Savunma', fiz: 'Fizik' };
const POSN = { FW: 'Forvet', MF: 'Orta saha', DF: 'Defans', GK: 'Kaleci' };
const W = { FW: { hiz: .22, pas: .10, sut: .33, tek: .2, def: .0, fiz: .15 }, MF: { hiz: .12, pas: .32, sut: .12, tek: .2, def: .1, fiz: .14 }, DF: { hiz: .15, pas: .1, sut: 0, tek: .05, def: .45, fiz: .25 } };
const ovrOf = (st, pos) => Math.round(K.reduce((s, k) => s + st[k] * W[pos][k], 0));
const ovr = () => ovrOf(g.st, g.pos);
const ROLES = ['Genç', 'Yedek', 'Rotasyon', 'As', 'Yıldız'];

/* ---------- Kayıt ---------- */
let g = null, slot = 1, scr = 'menu', tab = 'home';
const MEM = {};
function ld(i) { try { const s = localStorage.getItem('mfc2_' + i); if (s) return JSON.parse(s); } catch (e) { } return MEM[i] ? JSON.parse(MEM[i]) : null; }
function sv() { if (!g) return; if (g.coach && g.phase === 'retired') g.phase = 'coach'; else if (!g.coach && g.phase === 'coach') g.phase = 'retired'; if (typeof achCheck === 'function') achCheck(); const s = JSON.stringify(g); MEM[slot] = s; try { localStorage.setItem('mfc2_' + slot, s); } catch (e) { } }
function L(t) { if (!g) return; g.log.unshift((g.phase === 'child' ? '' : g.season + ' · ') + g.age + ' yaş: ' + t); if (g.log.length > 120) g.log.length = 120; }
function news(t) { g.news.unshift(t); if (g.news.length > 16) g.news.length = 16; }

/* ---------- Dünya ---------- */
const cinfo = ct => COUNTRIES.find(c => c.n === ct) || COUNTRIES[0];
const BIAS = { 'Türkiye': 0, 'İngiltere': 3, 'İspanya': 2, 'Almanya': 2, 'İtalya': 2, 'Fransa': 1, 'Brezilya': 0, 'Arjantin': -1, 'Yunanistan': -3, 'Sırbistan': -5, 'Hırvatistan': -4, 'Suudi Arabistan': 0, 'Japonya': -2, 'Güney Kore': -3, 'ABD': -1, 'Meksika': -1, 'Mısır': -4, 'Fas': -4 };
/* Kıta kupaları ve milli turnuvalar */
const CONT = { e: { cl: 'Avrupa Şampiyonlar Kupası', el: 'Avrupa Ligi', nt: 'Avrupa Şampiyonası' }, s: { cl: 'Libertadores Kupası', el: 'Sudamericana Kupası', nt: 'Copa América' }, a: { cl: 'Asya Şampiyonlar Ligi', el: 'Asya Kupası 2', nt: 'Asya Kupası' }, n: { cl: 'CONCACAF Şampiyonlar Kupası', el: 'Liglerarası Kupa', nt: 'Altın Kupa' }, f: { cl: 'Afrika Şampiyonlar Ligi', el: 'Konfederasyon Kupası', nt: 'Afrika Uluslar Kupası' } };
/* Zengin yatırımcı kotası: ülke başına en fazla */
const RICHQ = { 'Türkiye': 1, 'İngiltere': 3, 'Almanya': 1, 'İspanya': 1, 'İtalya': 2, 'Fransa': 1, 'Suudi Arabistan': 2, 'ABD': 1, 'Meksika': 1, 'Brezilya': 1, 'Yunanistan': 1 };
const TIERB = [0, 0, 64, 57];
let CI = {};
function reindex() { CI = {}; for (const ct in g.w) g.w[ct].forEach((X, ti) => X.forEach(c => { c.t = ti + 1; CI[c.id] = { c, ct }; })); }
const club = id => CI[id] ? CI[id].c : null;
const clubCt = id => CI[id] ? CI[id].ct : null;
const cname = id => { const c = club(id); return c ? clubName(c.n) : '—'; };
const tierName = (ct, t) => (cinfo(ct).tiers[t - 1] || { n: t + '. Lig' }).n;
const PALETTE = ['#1d3f8f', '#c8102e', '#0a7a3d', '#f2c500', '#111111', '#6b2c91', '#ef7d00', '#5fa8d3', '#7a1c33', '#ffffff', '#00843d', '#e30613'];
function genWorld() {
  g.w = {}; g.wid = 1; const used = {};
  for (const ci of COUNTRIES) {
    const W2 = [];
    ci.tiers.forEach((tr, ti) => {
      const X = [], mk = (n, s, c1, c2, fan, city) => { used[n] = 1; X.push({ id: g.wid++, n, s, b: s, c1, c2, fan, city: city || n.split(' ')[0] }); };
      if (ti === 0) for (const r of CLUBS1[ci.n]) mk(r[0], r[1], r[2], r[3], r[4], r[5]);
      else if (ti === 1 && CLUBS2[ci.n]) CLUBS2[ci.n].slice(0, tr.size).forEach((n, i) => { const a = P(PALETTE); let b = P(PALETTE); if (b === a) b = '#ffffff'; mk(n, Math.round(TIERB[2] + BIAS[ci.n] + 4 - i * .35 + R(-3, 3)), a, b, R(30, 70)); });
      else {
        const towns = TOWNS[ci.lang] || TOWNS.tr, suf = SUFFIX[ci.lang] || SUFFIX.tr; let k = 0;
        while (X.length < tr.size && k++ < 600) { const t = P(towns), n = t + ' ' + P(suf); if (used[n] || used[t + '*']) continue; used[t + '*'] = 1; const a = P(PALETTE); let b = P(PALETTE); if (b === a) b = '#ffffff'; mk(n, Math.round(TIERB[ti + 1] + BIAS[ci.n] + R(-4, 4)), a, b, R(15, 45), t); }
      }
      W2.push(X);
    });
    g.w[ci.n] = W2;
  }
  /* zengin yatırımcılı küçük kulüpler: güçsüz ama yüksek maaş verir */
  for (const ct in g.w) { const q = RICHQ[ct] || 0, n = q ? R(Math.max(0, q - 1), q) : 0; if (!n) continue;
    /* aday: üst ligin orta sırası ya da 2. ligin üst yarısı (dipteki kulüpler değil) */
    const T1 = [...g.w[ct][0]].sort((a, b) => b.s - a.s), T2 = g.w[ct][1] ? [...g.w[ct][1]].sort((a, b) => b.s - a.s) : [];
    const pool = T1.slice(4, Math.ceil(T1.length * .7)).concat(T2.slice(0, Math.ceil(T2.length / 3)));
    for (let i = 0; i < n && pool.length; i++) pool.splice(R(0, pool.length - 1), 1)[0].rich = 1; }
  reindex(); seedQual();
}
function seedQual() { g.ql = {}; for (const ci of COUNTRIES) { const S = [...g.w[ci.n][0]].sort((a, b) => b.s - a.s); S.slice(0, ci.euro).forEach(c => g.ql[c.id] = 'cl'); S.slice(ci.euro, ci.euro + ci.el).forEach(c => g.ql[c.id] = 'el'); } }
/* Şehrinin kulübü (çocukluk kulübü) */
function homeClubFor(city, ct) {
  const all = g.w[ct].flat(), lc = String(city).toLocaleLowerCase('tr');
  const m = all.filter(c => (c.city || '').toLocaleLowerCase('tr') === lc || c.n.toLocaleLowerCase('tr').startsWith(lc.slice(0, 5)));
  return (m.length ? m.sort((a, b) => b.t - a.t)[0] : P(all.filter(c => c.t >= 2))) || P(all);
}

/* ---------- Kadrolar ---------- */
/* Gerçek oyuncular yaşlanır: 2025 yaşı + geçen yıl; 37 yaşından sonra kadrodan düşer */
function squad(id) {
  if (g.sq && g.sq[id]) return g.sq[id];
  const c = club(id); if (!c) return [];
  const ct = clubCt(id), rnd = srng(hash(id + ':' + (g.season || 0))), lang = cinfo(ct).lang, NP = NAMES[lang] || NAMES.tr, dy = (g.season || 2026) - 2025;
  const out = (STARS[c.n] || []).map(x => { const [n, p, r, a] = x.split('|'); const age = +a + dy; return { n, real: 1, p, r: Math.round(+r - (age > 31 ? (age - 31) * 1.5 : 0) + (age < 23 && dy > 0 ? Math.min(dy, 23 - +a) * 1.5 : 0)), age }; }).filter(x => x.age <= 37);
  const need = { GK: 3, DF: 8, MF: 8, FW: 5 }; out.forEach(x => need[x.p]--);
  for (const p in need) for (let i = 0; i < need[p]; i++) {
    const f = NP.f[Math.floor(rnd() * NP.f.length)], l = NP.l[Math.floor(rnd() * NP.l.length)];
    out.push({ n: f + ' ' + l, p, r: Math.round(c.s - 4 + (rnd() - .55) * 12), age: 18 + Math.floor(rnd() * 16) });
  }
  return out.sort((a, b) => b.r - a.r);
}
const pname = x => x.real ? alter(x.n) : x.n;

/* ---------- Rol ve oynama ---------- */
function roleFor(o, s, age) { const d = o - s; return d >= 5 ? 4 : d >= 0 ? 3 : d >= -4 ? 2 : (d >= -10 || age >= 21) ? 1 : 0; }
const START_P = [.03, .12, .5, .88, .97], SUB_P = [.2, .45, .6, .8, 1];

/* ---------- Takvim ---------- */
const SEASON_W = 46, BREAKS = [10, 20, 31];
const CUP_W = [6, 13, 19, 26, 33, 41], CUP_R = ['1. Tur', '2. Tur', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'];
const EU_GW = [4, 8, 12, 16, 22, 25], EU_KW = [29, 34, 38, 44], EU_KR = ['Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'];
function leagueWeeks(rounds) { const av = []; for (let w = 1; w <= 45; w++) if (!BREAKS.includes(w)) av.push(w); const out = []; for (let i = 0; i < rounds; i++) out.push(av[Math.floor(i * av.length / rounds)]); return out; }
function mkFx(N) { const a = [...Array(N).keys()], fx = []; for (let r = 0; r < N - 1; r++) { const rd = []; for (let i = 0; i < N / 2; i++) rd.push(r % 2 ? [a[N - 1 - i], a[i]] : [a[i], a[N - 1 - i]]); fx.push(rd); a.splice(1, 0, a.pop()); } return fx.concat(fx.map(r => r.map(p => [p[1], p[0]]))); }
const poolSorted = ids => [...ids].sort((a, b) => club(b).s - club(a).s);
function euroPool(top, kont, self) {
  const tag = top ? 'cl' : 'el', T1 = COUNTRIES.filter(x => x.k === kont).flatMap(x => g.w[x.n][0]);
  let ids = T1.filter(c => c.id !== self && g.ql[c.id] === tag).map(c => c.id);
  if (ids.length < 10) ids = ids.concat(T1.filter(c => c.id !== self && !g.ql[c.id]).sort((a, b) => b.s - a.s).map(c => c.id).slice(0, 10 - ids.length));
  return ids;
}
const myClubId = () => (g.club && g.club.id) || (g.coach && g.coach.id) || null;
function setupSeason(fromWeek) {
  g.week = fromWeek || 1; g.cal = []; g.lg = null; g.cup = null; g.euro = null;
  const cid = myClubId();
  if (cid && club(cid)) {
    const ct = clubCt(cid), c = club(cid), X = g.w[ct][c.t - 1];
    const teams = X.map(x => ({ id: x.id, n: x.n, W: 0, D: 0, L: 0, GF: 0, GA: 0, pt: 0 }));
    g.lg = { ct, t: c.t, teams, fx: mkFx(teams.length), r: 0 };
    leagueWeeks(g.lg.fx.length).forEach((w, i) => g.cal.push({ w, k: 'L', r: i }));
    g.cup = { n: ct + ' Kupası', alive: 1, r: 0, pool: g.w[ct].flat().filter(x => x.id !== cid).map(x => x.id) };
    CUP_W.forEach((w, i) => g.cal.push({ w, k: 'C', r: i, mid: 1 }));
    const q = (g.ql || {})[cid];
    if (q) {
      const ci = cinfo(ct), top = q === 'cl';
      const n = (CONT[ci.k] || CONT.e)[top ? 'cl' : 'el'];
      const opp = poolSorted(euroPool(top, ci.k, cid)), third = Math.ceil(opp.length / 3), gr = [];
      [0, 1, 2].forEach(i => { const cc = opp.slice(i * third, (i + 1) * third).filter(id => !gr.includes(id)); gr.push(P(cc.length ? cc : opp.filter(id => !gr.includes(id)))); });
      const T = [cid, ...gr].map(id => ({ id, n: club(id).n, W: 0, D: 0, L: 0, GF: 0, GA: 0, pt: 0 }));
      g.euro = { n, top, alive: 1, grp: T, gfx: [[[0, 1], [2, 3]], [[3, 0], [1, 2]], [[0, 2], [3, 1]], [[1, 0], [3, 2]], [[0, 3], [2, 1]], [[2, 0], [1, 3]]], gr: 0, ko: 0, pool: opp.filter(id => !gr.includes(id)) };
      EU_GW.forEach((w, i) => g.cal.push({ w, k: 'E', r: i, mid: 1 }));
      EU_KW.forEach((w, i) => g.cal.push({ w, k: 'E', r: 6 + i, mid: 1 }));
    }
  }
  if (g.club) BREAKS.forEach(w => { g.cal.push({ w, k: 'N', r: 0, mid: 1 }); g.cal.push({ w, k: 'N', r: 1 }); });
  g.cal.sort((a, b) => a.w - b.w || (b.mid ? 1 : 0) - (a.mid ? 1 : 0));
  g.cal.forEach(e => e.wx = weatherFor(e.w, cid ? clubCt(cid) : g.ct));
  if (g.week > 1) {
    g.cal.filter(e => e.k === 'L' && e.w < g.week).forEach(e => { simLeagueRound(e.r); e.res = 'Oynandı (sen yoktun)'; });
    if (g.cup) g.cup.alive = 0; if (g.euro) g.euro.alive = 0;
    if (g.cup || g.euro) L('Sezon ortasında geldiğin için bu sezon kupa ve Avrupa kadrosunda yoksun.');
  }
}
function entryInfo(e) {
  const cid = myClubId();
  if (e.k === 'L') {
    if (!g.lg) return null; const rd = g.lg.fx[e.r], me = g.lg.teams.findIndex(x => x.id === cid), p = rd && rd.find(q => q.includes(me));
    if (!p) return null; const home = p[0] === me, o = g.lg.teams[home ? p[1] : p[0]];
    return { comp: tierName(g.lg.ct, g.lg.t), short: 'Lig', home, oid: o.id, on: clubName(o.n), round: (e.r + 1) + '. hafta', wx: e.wx };
  }
  if (e.k === 'C') {
    if (!g.cup || !g.cup.alive || g.cup.r !== e.r) return null;
    if (!g.cup.cur) { const S = poolSorted(g.cup.pool), n = Math.max(1, Math.ceil(S.length * (1 - e.r / 7))); g.cup.cur = P(S.slice(0, n)); g.cup.home = Math.random() < .5; }
    return { comp: g.cup.n, short: 'Kupa', home: e.r === 5 ? true : g.cup.home, oid: g.cup.cur, on: cname(g.cup.cur), round: CUP_R[e.r], ko: 1, neutral: e.r === 5, wx: e.wx };
  }
  if (e.k === 'E') {
    const E = g.euro; if (!E || !E.alive) return null;
    if (e.r < 6) { const p = E.gfx[e.r].find(q => q.includes(0)), home = p[0] === 0, o = E.grp[home ? p[1] : p[0]]; return { comp: E.n, short: 'Avrupa', home, oid: o.id, on: clubName(o.n), round: 'Grup ' + (e.r + 1) + '. maç', eu: 1, wx: e.wx }; }
    const k = e.r - 6; if (E.ko !== k || E.gr < 6) return null;
    if (!E.cur) { const S = poolSorted(E.pool); E.cur = P(S.slice(0, Math.max(1, Math.ceil(S.length * (1 - k / 5))))); E.home = Math.random() < .5; }
    return { comp: E.n, short: 'Avrupa', home: k === 3 ? true : E.home, oid: E.cur, on: cname(E.cur), round: EU_KR[k], ko: 1, eu: 1, neutral: k === 3, wx: e.wx };
  }
  if (e.k === 'N') {
    if (!g.club || !g.ntIn) return null;
    if (!e.opp) { const nc = ntCt(), nn = NATIONS.concat(COUNTRIES.map(c => [c.n, c.nb, c.k])).filter(x => x[0] !== nc && (x[2] === ntK(nc) || Math.random() < .25)); e.opp = P(nn)[0]; }
    return { comp: ntCt() + (ntLevel() === 'U21' ? ' U21' : '') + ' Milli Takımı', u21: ntLevel() === 'U21' ? 1 : 0, short: 'Milli', home: e.r === 0, nt: 1, on: e.opp, round: e.r ? 'Hazırlık maçı' : 'Eleme maçı', wx: e.wx };
  }
  return null;
}
const ntCt = () => (g && g.ntc) || g.ct;
const ntNb = ct => { const c = COUNTRIES.find(x => x.n === ct); if (c) return c.nb; const n = NATIONS.find(x => x[0] === ct); return n ? n[1] : 0; };
const ntK = ct => { const c = COUNTRIES.find(x => x.n === ct); if (c) return c.k; const n = NATIONS.find(x => x[0] === ct); return n ? n[2] : 'e'; };
const natNeed = ct => 64 + ntNb(ct) * 1.1;
/* 18-21 yaş: A takıma yetmiyorsa U21 */
const ntLevel = () => { const v = ovr() + (g.form - 6.5) * 2, nd = natNeed(ntCt()); return v >= nd ? 'A' : g.age <= 21 && v >= nd - 7 ? 'U21' : null; };
const ntEligible = () => g.club && g.age >= 17 && g.inj <= 0 && !!ntLevel() && !g.ntRet;
const ntStr = ct => 74 + ntNb(ct) * 1.3;

/* ---------- Hava durumu ---------- */
const WX = { acik: { n: 'Açık', i: '☀' }, bulut: { n: 'Bulutlu', i: '☁' }, yagmur: { n: 'Yağmurlu', i: '🌧' }, ruzgar: { n: 'Rüzgârlı', i: '💨' }, kar: { n: 'Karlı', i: '❄' }, sicak: { n: 'Çok sıcak', i: '🔥' }, sis: { n: 'Sisli', i: '🌫' } };
function weatherFor(w, ct) {
  const k = cinfo(ct).k, winter = w >= 14 && w <= 30, r = Math.random();
  if (k === 'f' || ct === 'Suudi Arabistan') return r < .45 ? 'sicak' : r < .55 ? 'ruzgar' : r < .75 ? 'acik' : 'bulut';
  if (k === 's') return r < .3 ? 'sicak' : r < .5 ? 'yagmur' : r < .6 ? 'ruzgar' : r < .75 ? 'bulut' : 'acik';
  if (winter) return r < .3 ? 'yagmur' : r < .42 && ct !== 'İspanya' && ct !== 'İtalya' ? 'kar' : r < .55 ? 'ruzgar' : r < .62 ? 'sis' : r < .82 ? 'bulut' : 'acik';
  return r < .15 ? 'yagmur' : r < .25 ? 'ruzgar' : r < .35 && (w < 6 || w > 40) ? 'sicak' : r < .55 ? 'bulut' : 'acik';
}

/* ---------- Güç, skor ---------- */
const teamStr = (id, homeAdv) => (club(id) ? club(id).s : 65) + (homeAdv ? 1.5 : 0);
const pois = l => { let e = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > e); return k - 1; };
const xg = (a, b) => 1.35 * Math.pow(a / b, 5.5);
const quickScore = (a, b, m) => [pois(xg(a, b) * (m || 1)), pois(xg(b, a) * (m || 1))];
function rec(T, f, a) { T.GF += f; T.GA += a; if (f > a) { T.W++; T.pt += 3; } else if (f === a) { T.D++; T.pt++; } else T.L++; }
const sortT = T => [...T].sort((x, y) => y.pt - x.pt || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF);
function simLeagueRound(r, myRes) {
  const lg = g.lg, cid = myClubId();
  lg.fx[r].forEach(([i, j]) => {
    const A = lg.teams[i], B = lg.teams[j];
    let s;
    if (A.id === cid && myRes) s = myRes; else if (B.id === cid && myRes) s = [myRes[1], myRes[0]];
    else s = quickScore(teamStr(A.id, 1), teamStr(B.id, 0));
    rec(A, s[0], s[1]); rec(B, s[1], s[0]);
  });
  lg.r = r + 1;
}
function simLg(X) { const T = X.map(c => ({ id: c.id, n: c.n, W: 0, D: 0, L: 0, GF: 0, GA: 0, pt: 0 })); for (let i = 0; i < T.length; i++) for (let j = 0; j < T.length; j++) if (i !== j) { const s = quickScore(teamStr(T[i].id, 1), teamStr(T[j].id, 0)); rec(T[i], s[0], s[1]); rec(T[j], s[1], s[0]); } return T; }
/* Sezon sonu: bütün dünya; terfi/küme (3/3), Avrupa kontenjanı, güç kayması */
function closeSeason() {
  g.ql = {}; g.chs = {}; g.prev = {};
  for (const ct in g.w) {
    const Wt = g.w[ct], ci = cinfo(ct), ord = [];
    Wt.forEach((X, ti) => {
      const mine = g.lg && g.lg.ct === ct && g.lg.t === ti + 1 && g.lg.r >= g.lg.fx.length;
      const T = sortT(mine ? g.lg.teams : simLg(X));
      ord.push(T.map(r => club(r.id)));
      if (T[0]) g.chs[T[0].id] = 1;
      T.forEach((r, i) => g.prev[r.id] = i + 1);
    });
    news(`${ct} şampiyonu: ${clubName(ord[0][0].n)}`);
    ord[0].slice(0, ci.euro).forEach(c => g.ql[c.id] = 'cl');
    ord[0].slice(ci.euro, ci.euro + ci.el).forEach(c => g.ql[c.id] = 'el');
    const nW = Wt.map((_, k) => {
      let X = ord[k].slice(k > 0 ? 3 : 0, ord[k].length - (k < Wt.length - 1 ? 3 : 0));
      if (k < Wt.length - 1) X = X.concat(ord[k + 1].slice(0, 3));
      if (k > 0) X = X.concat(ord[k - 1].slice(-3));
      return X;
    });
    nW.forEach((X, k) => X.forEach(c => {
      if (g.sq && g.sq[c.id]) return; /* kadrosu yönetilen kulübün gücü kadrodan gelir */
      const tgt = k === 0 ? Math.max(c.b, 66 + BIAS[ct]) : TIERB[k + 1] + BIAS[ct];
      if (c.t > k + 1) c.b += 1.5; if (c.t < k + 1) c.b -= 1.5;
      c.b = c.b + (tgt - c.b) * .1;
      c.s = Math.round(c.s + (c.b - c.s) * .35 + R(-2, 2) + (c.rich ? .6 : 0));
    }));
    g.w[ct] = nW;
  }
  reindex();
}

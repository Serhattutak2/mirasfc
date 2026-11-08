/* ============================================================
   v4.4 — ⚡ GÜNÜN POZİSYONU
   Her gün herkese aynı son dakika anı gelir (tarihten seçilir):
   penaltı, serbest vuruş, birebir, kafa, son atak, kontra ya da
   son dakika savunması. Günde tek hak. Başarırsan jeton kazanırsın,
   her gün oynadıkça seri büyür (7. günde büyük ödül).
   Kariyere etkisi yoktur: maç, istatistik ve form değişmez.
   ============================================================ */
const DP = [
  { type: 'pen', min: 94, sc: [1, 1], t: 'Son dakika penaltısı', d: 'Skor 1-1, dakika 90+4. Topun başına sen geçtin.' },
  { type: 'fk', min: 89, sc: [0, 1], t: 'Ceza sahası önünde serbest vuruş', d: '89. dakika, 0-1 gerideyiz. Baraj kuruldu, bütün stat ayakta.' },
  { type: 'one', min: 93, sc: [2, 2], t: 'Kaleciyle karşı karşıya', d: '90+3, skor 2-2. Savunmanın arkasına sarktın, önünde sadece kaleci var.' },
  { type: 'head', min: 90, sc: [0, 0], t: 'Son korner', d: '90. dakika, 0-0. Orta geliyor, kafayı vur.' },
  { type: 'atk', min: 88, sc: [1, 2], t: 'Son atak', d: '88. dakika, 1-2 gerideyiz. Bu atakta gol şart.' },
  { type: 'kontra', min: 91, sc: [1, 1], t: 'Son saniye kontrası', d: '90+1, 1-1. Top kapıldı, önümüz boş!' },
  { type: 'def', min: 92, sc: [1, 0], t: 'Galibiyeti koru', d: '90+2, 1-0 öndeyiz. Rakip son kez geliyor, araya gir.' },
];
const DP_REWARD = 15, DP_STREAK7 = 40;
function dpDay() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function dpDayNum() { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function dpToday() { return DP[dpDayNum() % DP.length]; }
function dpAcct() { const A = acct(); A.dp = A.dp || { last: 0, lastN: 0, streak: 0, best: 0, wins: 0, res: null }; return A.dp; }
function dpPlayed() { return dpAcct().last === dpDay(); }
function dpAvail() { return g && g.phase === 'pro' && g.club && scr === 'game' && !M && !S; }

function dpCardHTML() {
  if (!g || g.phase !== 'pro' || !g.club) return '';
  const D = dpAcct(), x = dpToday(), done = dpPlayed();
  const dots = Array.from({ length: 7 }, (_, i) => `<i class="dpd ${i < (D.streak % 7 || (D.streak && done ? 7 : 0)) ? 'on' : ''}"></i>`).join('');
  return `<div class="card dpcard"><div class="row-b"><div class="eyebrow gold">⚡ Günün Pozisyonu</div><span class="tag gold">🔥 ${D.streak} gün</span></div>
  <h3>${x.t}</h3><p class="m">${x.d}</p><div class="dpdots">${dots}</div>
  ${done ? `<div class="m"><span>${D.res === 'ok' ? `✅ Bugünkü pozisyonu başardın, +${DP_REWARD} 🪙 aldın.` : '❌ Bugünkü pozisyonu kaçırdın.'}</span> <span>Yarın yeni pozisyon gelecek.</span></div>`
    : `<div class="actions"><button class="btn" onclick="dpStart()">Pozisyonu oyna</button></div><div class="m">Günde tek hak · Başarırsan +${DP_REWARD} 🪙 · 7 gün üst üste oynarsan +${DP_STREAK7} 🪙</div>`}</div>`;
}

function dpStart() {
  if (dpPlayed()) return toast('Bugünkü pozisyonu oynadın; yarın yenisi gelecek');
  if (!dpAvail()) return toast('Önce haftadaki işini bitir');
  const x = dpToday(), myId = myClubId();
  const pool = (g.w[g.club.ct] || []).flat().filter(c => c.id !== myId);
  const opp = pool.length ? pool[dpDayNum() % pool.length] : null; if (!opp) return toast('Rakip bulunamadı');
  const info = { oid: opp.id, home: 1, comp: '⚡ Günün Pozisyonu', round: new Date().toLocaleDateString(typeof LANG !== 'undefined' && LANG === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' }) };
  try {
    M = mkMatch(null, info, { start: 1, off: 90 });
  } catch (e) { M = null; return toast('Pozisyon açılamadı'); }
  M.src = 'daily'; M.dp = 1; M.adRetry = 1; M.mom = [{ min: x.min, type: x.type }]; M.mi = 0; M.ev = []; M.ei = 0;
  M.sc = x.sc.slice(); M.t = x.min; M.feed = [{ m: x.min, t: `⚡ Günün Pozisyonu: ${x.t}`, k: 'gold' }];
  M.stage = 'live'; scr = 'match'; dpAcct().pending = dpDay(); acctSave();
  nextMoment();
}
function dpFinish(ok) {
  const D = dpAcct(), A = acct(), day = dpDay(), n = dpDayNum();
  D.streak = D.lastN === n - 1 ? D.streak + 1 : 1; D.last = day; D.lastN = n; D.res = ok ? 'ok' : 'no'; D.pending = 0;
  D.best = Math.max(D.best || 0, D.streak);
  let gain = 0; if (ok) { gain += DP_REWARD; D.wins = (D.wins || 0) + 1; }
  if (D.streak % 7 === 0) gain += DP_STREAK7;
  if (gain) A.tok = (A.tok || 0) + gain;
  acctSave();
  try { cancelAnimationFrame(RAF); } catch (e) { }
  S = null; M = null; scr = 'game'; sv(); draw();
  toast(ok ? `⚡ Başardın! +${gain} 🪙 · Seri ${D.streak} gün` : `Bu sefer olmadı${gain ? ` · Seri ödülü +${gain} 🪙` : ''} · Seri ${D.streak} gün`);
}
{
  const _sc44 = sceneContinue;
  sceneContinue = function () {
    if (typeof M !== 'undefined' && M && M.src === 'daily') { const ok = !!(S && S.good); return dpFinish(ok); }
    return _sc44.apply(this, arguments);
  };
  const _ph44 = proHome;
  proHome = function () { const h = _ph44.apply(this, arguments); try { return dpCardHTML() + h; } catch (e) { return h; } };
  /* yarım kalan günün pozisyonu (uygulama kapandıysa) kaçırılmış sayılır */
  try { const D = acct().dp; if (D && D.pending && D.pending !== D.last) { D.pending = 0; acctSave(); } } catch (e) { }
}

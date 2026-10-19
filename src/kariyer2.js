/* ============================================================
   MİRAS FC — v3.9 · Kariyer gerçekçiliği (parametreler: career.js GROW)
   - Oynadıkça gelişirsin: maç dakikası xp verir; kulübün tesis gücü
     (yıldız) bütün gelişimi çarpar, iyi sağlık ekibi iyileşmeyi hızlandırır.
   - Forma giymezsen gerilersin: üst üste GROW.benchStart hafta oynamazsan
     her hafta özelliklerin, formun ve moralin biraz düşer.
   - Sakatlık kademeleri: hafif, orta, 3-5 ay, yaklaşık 1 yıl. Uzun
     sakatlıkta fiziğin erir; dönüşte birkaç hafta maç ritmi eksik olur.
   - Kariyer eğrisi: gençken hızlanarak yükselir; çok nadiren 17-22 yaşta
     patlama sezonu, 29 yaşından sonra geç çıkış yaşanır.
   ============================================================ */
const INJN = ['hafif', 'orta', 'uzun', 'çok uzun'];
injure = function (w, where) {
  const fitP = g.fit < 40 ? .04 : 0, ageP = g.age > 30 ? .03 : 0, r = Math.random() - fitP - ageP;
  let tier = 0; for (let i = 0; i < GROW.inj.length; i++) if (r < GROW.inj[i][0]) { tier = i; break; }
  const T = GROW.inj[tier], wk = tier === 0 ? w : R(T[1], T[2]);
  g.inj = Math.max(g.inj, wk); g.injLong = Math.max(g.injLong || 0, tier);
  if (tier === 0) return L(`Sakatlandın (${where}), ${wk} hafta yoksun.`);
  if (tier === 1) return L(`Sakatlandın (${where}): kas yırtığı. Yaklaşık ${Math.round(wk / 4)} ay yoksun.`);
  const k = P(['hiz', 'fiz', 'tek']), x = tier === 3 ? R(3, 6) : R(1, 3);
  g.st[k] = Math.max(1, g.st[k] - x); if (tier === 3) g.cap[k] = Math.max(25, Math.min(g.cap[k], g.st[k] + R(4, 9)));
  const what = tier === 3 ? 'Çapraz bağların koptu' : P(['Menisküs yırtığı', 'Kemik kırığı', 'Aşil tendonu sakatlığı']);
  g.sc.push({ a: g.age, t: `${what}: ${Math.round(wk / 4)} ay` });
  L(`Ağır sakatlık ${where}! ${what}. ${tier === 3 ? 'Yaklaşık bir yıl' : `Yaklaşık ${Math.round(wk / 4)} ay`} sahalardan uzak kalacaksın; ${KN[k]} düştü.`);
  try { news(`${g.name} ağır sakatlık geçirdi: ${what}.`); } catch (e) { }
};
const _teamTraining39 = teamTraining;
teamTraining = function () {
  const wasInj = g.inj > 0; _teamTraining39();
  const c = g.club ? club(g.club.id) : null, fs = c ? facOf(c) : 2;
  /* iyi tesis: sağlık ekibi iyileşmeyi hızlandırır */
  if (g.inj > 0 && c && Math.random() < (fs - 2) * .1) { g.inj--; if (!g.inj) L('Sağlık ekibinin desteğiyle erken iyileştin.'); }
  /* uzun sakatlıkta fizik erir */
  if (g.inj > 4 && (g.injLong || 0) >= 2) K.forEach(k => { if ((k === 'hiz' || k === 'fiz' || k === 'tek') && Math.random() < GROW.injLoss * (fs >= 4 ? .7 : 1)) { g.st[k] = Math.max(1, g.st[k] - 1); g.wk.loss[k] = 1; } });
  /* dönüş: maç ritmi eksik */
  if (wasInj && !g.inj && (g.injLong || 0) >= 1) { g.rust = Math.round(GROW.rustWk[0] + (GROW.rustWk[1] - GROW.rustWk[0]) * g.injLong / 3); g.fit = Math.min(g.fit, 62); g.form = cl(g.form - .6 * g.injLong, 3, 10); g.injLong = 0; L(`Sakatlıktan döndün ama maç ritmin eksik. ${g.rust} hafta kadar eski performansını bulman zor olacak.`); }
  else if (g.rust > 0 && !g.inj) g.rust = Math.max(0, g.rust - (g.playedWk ? 2 : 1));
  /* forma giymeyen geriler */
  if (g.club && !g.inj && g.phase === 'pro') {
    g.benchW = g.playedWk ? 0 : (g.benchW || 0) + 1;
    if (g.benchW >= GROW.benchStart) {
      const p = GROW.benchLoss * (1 + (g.benchW - GROW.benchStart) * .15) * (g.age >= 30 ? 1.4 : g.age <= 21 ? .7 : 1);
      K.forEach(k => { if (Math.random() < p * (k === 'tek' || k === 'sut' || k === 'pas' ? 1.2 : .8)) { g.st[k] = Math.max(1, g.st[k] - 1); g.wk.loss[k] = 1; } });
      g.form = cl(g.form - .08, 3, 10); g.mor = clr(g.mor - 1, 0, 100);
      if (g.benchW === GROW.benchStart) L(`${g.benchW} haftadır forma giyemiyorsun; maç ritmin ve gücün düşmeye başladı.`);
    }
  }
  g.playedWk = 0;
};
/* maç ritmi eksikse sahada her şey biraz zor */
const _mood39 = mood;
mood = function () { return _mood39() - ((g && g.rust > 0) ? .035 : 0); };
/* nadir sıçramalar: genç patlama sezonu, yaşlıyken geç çıkış */
const _yearTick39 = yearTick;
yearTick = function (out) {
  const r = _yearTick39(out);
  try {
    if (g.phase === 'pro' && g.age >= 17 && g.age <= 22 && Math.random() < GROW.boomP && (g.ss0ap || 0) >= 0) {
      const ks = K.slice().sort(() => Math.random() - .5).slice(0, 3); ks.forEach(k => { g.xp[k] += rf(1.2, 2.6); }); levelUp();
      const t = 'Patlama sezonu! Bu yıl oyunun bambaşka bir seviyeye çıktı.'; L(t); out && out.lines && out.lines.push('🚀 ' + t);
    } else if (g.phase === 'pro' && g.age >= 29 && g.age <= 35 && Math.random() < GROW.bloomP) {
      const ks = K.filter(k => k !== 'hiz').sort(() => Math.random() - .5).slice(0, 2); ks.forEach(k => { g.cap[k] = Math.min(99, g.cap[k] + 2); g.st[k] = Math.min(g.cap[k], g.st[k] + R(1, 3)); });
      const t = 'Geç gelen çıkış: tecrübe oyununa yansıdı, bu sezon her zamankinden iyisin.'; L(t); out && out.lines && out.lines.push('🌟 ' + t);
    }
  } catch (e) { }
  return r;
};

/* ============================================================
   Teknik direktörlükte Enerji: oyunculuk işleri gizlenir,
   yerine teknik direktöre özel işler gelir.
   ============================================================ */
const PLAYER_ONLY = id => /^tr_|^dr_/.test(id) || ['re_fizyo', 'md_imza'].includes(id);
ACTS.forEach(a => { if (PLAYER_ONLY(a.id)) { const f0 = a.if; a.if = () => g.phase !== 'coach' && (!f0 || f0()); } });
const CO = () => g.coach, csq = () => (g.coach && g.sq[g.coach.id]) || [];
const cAct = (id, n, en, max, d, f, extra) => ACTS.push(Object.assign({ id, g: 'Teknik direktörlük', n, en, max, d, if: () => g.phase === 'coach' && !!g.coach, f }, extra || {}));
cAct('co_analiz', 'Rakip analizi ve video toplantısı', 10, 1, 'Taktik uyumu +, maç planı netleşir', () => { const C = CO(); C.tf = clr((C.tf == null ? 55 : C.tf) + 4, 0, 100); });
cAct('co_taktik', 'Taktik tahtası başında çalış', 10, 2, 'Taktik uyumu ++', () => { const C = CO(); C.tf = clr((C.tf == null ? 55 : C.tf) + 5, 0, 100); });
cAct('co_birebir', 'Oyuncularla birebir görüşme', 8, 2, 'Soyunma odası uyumu +', () => { const C = CO(); C.harm = clr((C.harm || 60) + 3, 0, 100); });
cAct('co_dinlen', 'Takıma dinlenme günü ver', 6, 1, 'Takım yorgunluğu −, uyum +, taktik uyumu −', () => { const C = CO(); C.fat = Math.max(0, (C.fat || 0) - 3); C.harm = clr((C.harm || 60) + 1, 0, 100); C.tf = clr((C.tf == null ? 55 : C.tf) - 1, 0, 100); });
cAct('co_ekidman', 'Gençlere ek idman yaptır', 12, 1, 'Genç oyuncular gelişir, yorgunluk +', () => { const C = CO(); C.fat = Math.min(30, (C.fat || 0) + 2); const ys = csq().filter(p => p.age <= 23 && !p.inj && p.r < (p.pot || 99)).sort(() => Math.random() - .5).slice(0, 3); ys.forEach(p => { if (Math.random() < .55) p.r++; }); if (ys.length) L(`Ek idman: ${ys.map(p => pname(p)).join(', ')} gelişmeye devam ediyor.`); });
cAct('co_altyapi', 'Altyapı maçlarını izle', 8, 1, 'Gizli bir yetenek keşfedebilirsin', () => { const ys = csq().filter(p => p.age <= 20); const p = ys.sort((a, b) => (b.pot || 0) - (a.pot || 0))[0]; if (p && Math.random() < .5) { p.r = Math.min(p.pot || 99, p.r + 2); L(`Altyapıda ${pname(p)} gözüne çarptı; onu A takım antrenmanlarına aldın.`); } else L('Altyapı maçlarını izledin; şimdilik öne çıkan biri yok.'); });
cAct('co_yonetim', 'Yönetimle görüşme', 10, 1, 'Yönetimin güveni +', () => { const C = CO(); C.conf = clr((C.conf || 50) + 3, 0, 100); });
cAct('co_basin', 'Basın toplantısı', 6, 1, 'İtibar +, bazen soyunma odası gerilir', () => { const C = CO(); if (typeof crepAdd === 'function') crepAdd(1); if (Math.random() < .25) { C.harm = clr((C.harm || 60) - 2, 0, 100); L('Basın toplantısındaki sözlerin soyunma odasında yanlış anlaşıldı.'); } });
cAct('co_seminer', 'Antrenörlük semineri', 12, 1, 'İtibar +, taktik uyumu +', () => { const C = CO(); if (typeof crepAdd === 'function') crepAdd(1.5); C.tf = clr((C.tf == null ? 55 : C.tf) + 1, 0, 100); }, { cost: 4 });
cAct('co_ekip', 'Teknik ekiple strateji toplantısı', 8, 1, 'Takım yorgunluğu −, sakatlık riski −', () => { const C = CO(); C.fat = Math.max(0, (C.fat || 0) - 1.5); C.harm = clr((C.harm || 60) + 1, 0, 100); });
const PLAN_CO = { 'Gelişim': ['co_taktik', 'co_taktik', 'co_analiz', 'co_ekidman', 'co_altyapi', 'co_ekip'], 'Dengeli': ['co_analiz', 'co_birebir', 'co_taktik', 'co_ekip', 'ev_partner', 'ev_cocuk', 're_uyku'], 'Aile': ['ev_partner', 'ev_partner', 'ev_cocuk', 'ev_cocuk', 'ev_aile', 'ev_kardes', 'co_birebir'], 'Dinlen': ['co_dinlen', 're_uyku'] };
const _autoPlan39 = autoPlan;
autoPlan = function (name, quiet) {
  if (g.phase !== 'coach') return _autoPlan39(name, quiet);
  const done = []; (PLAN_CO[name] || PLAN_CO['Dengeli']).forEach(id => { const a = ACTS.find(x => x.id === id); if (a && !canAct(a) && doAct(id, 1)) done.push(actVal(a, 'n')); });
  if (!quiet) { toast(done.length ? `${name}: ${done.length} iş yapıldı · kalan ${Math.round(g.en)}⚡` : 'Plana uygun yapılacak iş kalmadı'); sv(); draw(); }
  return done;
};

/* ---------- pazarlıkta anlaşamayınca jetonla yeniden teklif ---------- */
const NEGO_TOK = 20;
function negoRetryTok() {
  const N = g.nego; if (!N || N.done !== -1) return; const o = g.of[N.oi]; if (!o) return;
  if (!tokSpend(NEGO_TOK, 'Yeni teklif')) return;
  o.gone = 0; o.msg = ''; N.done = 0; N.pat = 45; N.round = 0; N.dem = { ...N.base, sal: Math.round((N.base.sal + N.max.sal) / 2) };
  N.log.unshift(`${N.sd} yeniden masaya oturdu: “Son bir şans, makul olalım.”`); sv(); draw();
}
function offerRevive(i) { const o = g.of[i]; if (!o || !o.gone) return; if (!tokSpend(NEGO_TOK, 'Teklifi geri getir')) return; o.gone = 0; o.msg = 'Kulüp jetonla yeniden masaya oturdu.'; sv(); draw(); }
function cnegoRetryTok() {
  const N = g.cnego; if (!N || N.done !== -1) return; const o = g.cof[N.oi]; if (!o) return;
  if (!tokSpend(NEGO_TOK, 'Yeni teklif')) return;
  o.gone = 0; N.done = 0; N.pat = 45; N.log.unshift('Başkan: “Peki, son bir kez konuşalım.”'); sv(); draw();
}
/* transfer: aynı hafta reddedildiysen jetonla yeni teklif */
const _trOffer39 = typeof trOffer === 'function' ? trOffer : null;
if (_trOffer39) trOffer = function (i, f, w) {
  const C = g.coach; if (!C || !windowOpen()) return _trOffer39(i, f, w);
  const x = trMarket()[i]; if (!x) return; const key = x.n + ':' + g.season + ':' + g.week;
  if (C.trT && C.trT[key]) return ask(`Bu hafta ${pname(x)} için teklif yaptın. ${NEGO_TOK / 2} jetonla yeni bir teklif yapılsın mı?`, () => { if (!tokSpend(NEGO_TOK / 2, 'Yeni transfer teklifi')) return; delete C.trT[key]; _trOffer39(i, f, w); }, `🪙 ${NEGO_TOK / 2} · Yeni teklif`);
  return _trOffer39(i, f, w);
};

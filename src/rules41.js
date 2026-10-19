/* ============================================================
   MİRAS FC — v4.1 · Cezalı / sakatken teklif yok
   - Cezaevi ya da men cezası süresince HİÇBİR kulüp teklif yapmaz
     (serbest, transfer dönemi, yenileme, kiralık, memleket çağrısı,
     teknik direktörlük teklifleri dahil).
   - Ağır sakatlıkta (8+ hafta) yeni kulüp teklifi gelmez.
   - ~1 yıllık sakatlıkta sözleşmesi bitmek üzere olan ya da as
     olmayan oyuncunun sözleşmesini kulüp fesheder.
   ============================================================ */
const offBlock = kind => {
  if (!g) return '';
  if (g.jail > 0) return 'Cezaevindeyken hiçbir kulüp seninle sözleşme konuşmuyor';
  if (g.ban > 0) return `Men cezan bitene kadar (${g.ban} hafta) kulüpler teklif yapmıyor`;
  if (g.inj >= 8 && kind !== '16' && kind !== 'renew') return `Sakatlığın geçmeden (${g.inj} hafta) kulüpler teklif yapmıyor`;
  return '';
};
const _soR = startOffers;
startOffers = function (kind) {
  const why = offBlock(kind); if (!why) return _soR(kind);
  toast(why); L(why + '.');
  if (g.after) return afterOffers();
  if (g.phase === 'pro0') g.phase = 'free';
  scr = 'game'; sv(); draw();
};
if (EVMAP.memleketcagri) { const f0 = EVMAP.memleketcagri.f; EVMAP.memleketcagri.f = () => !offBlock('win') && f0(); }
if (typeof coachLook === 'function') { const _cl = coachLook; coachLook = function () { const w = offBlock('coach'); if (w && (g.jail > 0 || g.ban > 0)) return toast(w); return _cl(); }; }
if (typeof coachOfferDirect === 'function') { const _cod = coachOfferDirect; coachOfferDirect = function (id) { if (g && (g.jail > 0 || g.ban > 0)) return; return _cod(id); }; }
/* teknik direktör teklif listeleri cezalıyken temizlenir */
const _payR = payWeek;
payWeek = function () { _payR(); if (g && (g.jail > 0 || g.ban > 0)) { if (g.cof && g.cof.length && g.phase !== 'coach') g.cof = []; if (g.of && g.of.length && scr !== 'offers') g.of = []; } };
/* ~1 yıllık sakatlıkta fesih */
const _injR = injure;
injure = function (w, where) {
  const before = g.injLong || 0; _injR(w, where);
  if ((g.injLong || 0) >= 3 && before < 3 && g.club && g.con && g.phase === 'pro' && !g.loan && (g.con.yrs <= 1 || (g.role || 0) <= 1)) {
    const id = g.club.id, n = cname(id); L(`${n} uzun sakatlığın nedeniyle sözleşmeni feshetti. Tedavini kendin sürdüreceksin.`); news(`${n}, sakatlanan ${g.name} ile yollarını ayırdı.`);
    try { closeHist(); } catch (e) { } g.con = null; g.club = null; g.captain = 0; g.phase = 'free'; g.wq = []; g.cal = (g.cal || []).filter(e => e.k === 'N'); try { dropSquad(id); } catch (e) { }
  }
};
/* kiralıkken sözleşme feshedildiyse (ceza / sakatlık) sezon sonu dönüş yapılmaz */
const _seR41 = seasonEnd;
seasonEnd = function () { if (g && g.loan && !g.club) g.loan = null; return _seR41.apply(this, arguments); };

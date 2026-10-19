/* ============================================================
   MİRAS FC — v4.0 · Suç ve ceza
   Yasa dışı seçimler (vergi kaçırma, şike, yasa dışı bahis, alkollü
   araç…) bir DOSYA açar (g.sins). Hemen ya da yıllar sonra ortaya
   çıkabilir (6 yılda zaman aşımı). Çıkınca DURUŞMA: avukat / itiraf /
   inkâr. Sonuç: para cezası, ün kaybı, men ve HAPİS (g.jail hafta).
   Hapiste: sözleşmen feshedilir, oynayamazsın, ailen uzaklaşır; sadece
   aile ziyareti ve kurs çalışması yapılabilir. Çıkışta yeni bir sayfa.
   ============================================================ */
const CRIME = {
  vergi: { n: 'Vergi kaçırma', jail: [36, 56], fine: 90, rep: 18, now: .25, yr: .18 },
  sike: { n: 'Şike', jail: [14, 26], ban: 92, fine: 60, rep: 35, now: .4, yr: .25 },
  bahis: { n: 'Yasa dışı bahis', jail: [8, 18], ban: 46, fine: 30, rep: 22, now: .3, yr: .2 },
  trafik: { n: 'Alkollü araç kullanma ve kaza', jail: [10, 24], fine: 25, rep: 14, now: .7, yr: .3 },
};
function sin(k, amt) {
  (g.sins = g.sins || []).push({ k, y: g.season, amt: amt || 0 }); L(`📁 ${CRIME[k].n} dosyan açıldı. Bir gün ortaya çıkabilir…`);
  if (Math.random() < CRIME[k].now) expose(g.sins.length - 1);
}
function expose(i) {
  const s = (g.sins || [])[i]; if (!s || g.trial) return; g.sins.splice(i, 1); g.trial = { k: s.k, amt: s.amt };
  news(`${g.name} hakkında ${CRIME[s.k].n.toLocaleLowerCase('tr')} soruşturması açıldı.`); L(`⚖️ ${CRIME[s.k].n} ortaya çıktı! Savcılık dava açtı.`);
  g.evq = g.evq || []; if (!g.evq.some(x => x.id === 'durusma')) g.evq.unshift(buildEv(EVMAP.durusma)); nextEv();
}
function jailTxt(w) { return w >= 40 ? `${Math.round(w / 46 * 10) / 10} yıl` : `${Math.round(w / 4)} ay`; }
function imprison(w, ban) {
  g.jail = Math.max(g.jail || 0, w); if (ban) g.ban = Math.max(g.ban || 0, ban);
  g.hap = clr(g.hap - 20, 0, 100); if (g.fam.partner) relAdj(g.fam.partner, -15); g.fam.kids.forEach(k => relAdj(k, -10));
  if (g.club && g.con && (g.phase === 'pro' || g.phase === 'free')) { const id = g.club.id, n = cname(id); L(`${n} sözleşmeni tek taraflı feshetti.`); try { closeHist(); } catch (e) { } g.con = null; g.club = null; g.captain = 0; g.phase = 'free'; g.wq = []; g.cal = (g.cal || []).filter(e => e.k === 'N'); try { dropSquad(id); } catch (e) { } }
  if (g.coach) { try { coachLeave('Cezaevine girdin', 0); } catch (e) { g.coach = null; } }
  L(`🔒 ${jailTxt(w)} hapis cezası aldın. Kapılar arkandan kapandı.`); news(`${g.name} ${jailTxt(w)} hapis cezasına çarptırıldı.`);
}
const TRIAL_EV = { id: 'durusma', a: [0, 120], t: () => { const c = CRIME[(g.trial || {}).k] || CRIME.vergi; return `⚖️ ${c.n} davası görülüyor. Savcı ${jailTxt(c.jail[1])} hapis ve ağır para cezası istiyor. Salon gazeteciyle dolu.`; },
  c: [
    { l: () => `En iyi avukatları tut (${fm(famCost(45))})`, f: () => trialEnd('avukat'), v: [1, 0, 0, -2] },
    { l: 'Suçunu kabul et, iş birliği yap', f: () => trialEnd('itiraf'), v: [0, 3, 0, 0] },
    { l: 'Masumum! Sonuna kadar savaş', f: () => trialEnd('inkar'), v: [3, -2, 0, 0] },
  ] };
function trialEnd(how) {
  const t = g.trial; if (!t) return; const c = CRIME[t.k]; g.trial = null;
  let jail = R(c.jail[0], c.jail[1]), fine = c.fine, rep = c.rep, ban = c.ban || 0, msg = '';
  if (how === 'avukat') { money(-famCost(45), 'Avukatlar'); if (Math.random() < .4) { jail = 0; fine *= .7; rep *= .6; msg = 'Avukatların davayı çevirdi: hapis yok, sadece para cezası.'; } else { jail = Math.round(jail * .6); msg = 'Avukatlar cezayı indirebildi ama hapisten kurtaramadı.'; } }
  if (how === 'itiraf') { jail = Math.round(jail * .4); rep *= .6; ban = Math.round(ban * .7); msg = 'İtirafın cezanı hafifletti; kamuoyu dürüstlüğünü takdir etti.'; }
  if (how === 'inkar') { if (Math.random() < .25) { jail = 0; fine = 0; rep = -2; ban = 0; msg = 'Mahkeme seni BERAAT ettirdi! Kanıtlar yetersiz bulundu.'; } else { jail = Math.round(jail * 1.3); rep *= 1.3; msg = 'İnkârın mahkemeyi kızdırdı: ceza ağırlaştırıldı.'; } }
  if (fine) money(-famCost(Math.round(fine)), `${c.n} para cezası`); g.rep = cl(g.rep - rep, 0, 100); L(`⚖️ Karar: ${msg}`);
  if (jail > 0) imprison(jail, ban); else if (ban) { g.ban = Math.max(g.ban || 0, ban); L(`Futboldan ${jailTxt(ban)} men edildin.`); }
}
AD_EV.push(TRIAL_EV); EVMAP.durusma = TRIAL_EV; TRIAL_EV.f = () => false; /* sadece sıraya konunca gelir */
const RELEASE_EV = { id: 'cikis', a: [0, 120], f: () => false, t: 'Cezaevinin kapısı açıldı. Dışarıda seni kimin beklediğine bakıyorsun…',
  c: [{ l: 'Gençlere suçtan uzak durmayı anlatan bir vakıf kur', f: () => { money(-famCost(20), 'Vakıf'); g.rep = cl(g.rep + 10, 0, 100); g.hap = clr(g.hap + 8, 0, 100); g.flags.hayirsever = (g.flags.hayirsever || 0) + 1; }, v: [0, 4, 1, -1] },
    { l: 'Hayatını anlatan bir kitap yaz', f: () => { money(famCost(30), 'Kitap'); g.rep = cl(g.rep + 4, 0, 100); }, v: [1, 1, 0, 2] },
    { l: 'Doğruca ailene git', f: () => { if (g.fam.partner) relAdj(g.fam.partner, 12); g.fam.kids.forEach(k => relAdj(k, 10)); aliveParent().forEach(p => relAdj(p, 10)); g.hap = clr(g.hap + 12, 0, 100); }, v: [0, 1, 4, 0] }] };
AD_EV.push(RELEASE_EV); EVMAP.cikis = RELEASE_EV;
/* yeni günaha davet eden olaylar */
const SIN_EV = [
  { id: 'bahisgizli', a: [19, 36], once: 1, w: 2, f: () => g.club && g.rep >= 15, t: 'Bir arkadaşın, kendi maçlarına sahte hesaptan bahis oynayarak “kolay para” kazanmanı öneriyor.', c: [{ l: 'Asla', f: () => { }, v: [0, 3, 0, 0] }, { l: 'Bir kere oynarım, kimse bilmez', f: () => { money(famCost(20), 'Bahis kazancı'); sin('bahis', 20); }, v: [0, -5, 0, 4] }] },
  { id: 'alkolarac', a: [18, 60], cd: 8, w: 1, f: () => g.fin && g.fin.car >= 1, t: 'Bir kutlama gecesinden çıktın; biraz fazla içtin. Arabanın anahtarı elinde.', c: [{ l: 'Taksi çağır', f: () => { }, v: [0, 2, 0, 0] }, { l: 'Kısa mesafe, ben sürerim', f: () => { if (Math.random() < .45) { g.inj = Math.max(g.inj, R(3, 10)); g.hp = (g.hp || 100) - 10; sin('trafik'); L('Bir park halindeki araca çarptın; polis alkol testi yaptı.'); } }, v: [2, -4, 0, 0] }] },
];
SIN_EV.forEach(e => { AD_EV.push(e); EVMAP[e.id] = e; });
/* eski riskli seçimleri dosya sistemine bağla */
(() => {
  const set = (id, i, f) => { const e = EVMAP[id]; if (e && e.c[i]) e.c[i].f = f; };
  set('vergiaffi', 1, () => { money(famCost(30), 'Vergi kaçırma kazancı'); sin('vergi', 30); });
  set('sike', 2, () => { money(famCost(120), 'Şike parası'); sin('sike', 120); });
  set('pk_skandal1', 1, () => { money(famCost(60), 'Rüşvet'); sin('sike', 60); pkClean(-1); });
  set('doping', 1, () => { if (Math.random() < .3) { g.ban = Math.max(g.ban || 0, R(20, 30)); g.rep = cl(g.rep - 12, 0, 100); L('Test pozitif çıktı; uzun süreli men cezası aldın.'); news(`${g.name} doping nedeniyle men edildi.`); } });
})();
/* her hafta: hapis ve men sayacı */
const _payJ = payWeek;
payWeek = function () {
  _payJ();
  if (g.jail > 0) { g.jail--; g.hap = clr(g.hap - .8, 0, 100); if (g.fam.partner) relAdj(g.fam.partner, -.4); if (!g.jail) { L('🔓 Cezaevinden çıktın.'); g.evq = g.evq || []; g.evq.push(buildEv(RELEASE_EV)); nextEv(); } }
  if (g.ban > 0) { g.ban--; if (!g.ban) L('Men cezan bitti; yeniden sahalara dönebilirsin.'); }
};
/* her yıl: dosyalar ortaya çıkabilir, eskiler zaman aşımına uğrar */
const _ytJ = yearTick;
yearTick = function (out) {
  const r = _ytJ(out);
  try {
    if (g.jail > 0 && g.phase === 'retired') { g.jail = Math.max(0, g.jail - 46); if (!g.jail) { L('🔓 Cezaevinden çıktın.'); g.evq = g.evq || []; g.evq.push(buildEv(RELEASE_EV)); } }
    (g.sins || []).slice().forEach((s, i) => { if (g.season - s.y >= 6) { g.sins.splice(g.sins.indexOf(s), 1); L(`${CRIME[s.k].n} dosyan zaman aşımına uğradı. Derin bir nefes aldın.`); } });
    if (!g.trial) { const i = (g.sins || []).findIndex(s => Math.random() < CRIME[s.k].yr); if (i >= 0) expose(i); }
  } catch (e) { }
  return r;
};
/* hapiste ve men cezasında oynayamazsın */
const _selJ = selection;
selection = function (info) { if (g.jail > 0) return { out: 1, why: `Cezaevindesin (${g.jail} hafta)` }; if (g.ban > 0) return { out: 1, why: `Men cezalısın (${g.ban} hafta)` }; return _selJ(info); };
const _canJ = canAct;
canAct = function (a) { if (g.jail > 0 && !/^ev_|^is_kurs|^re_uyku/.test(a.id)) return 'Cezaevindesin'; return _canJ(a); };
/* ana ekranda uyarı */
const _homeJ = homeUI;
homeUI = function () {
  const h = _homeJ(); if (!g) return h;
  const w = g.jail > 0 ? `<div class="card warn jailc"><div class="eyebrow">🔒 Cezaevindesin</div><p class="lead">${g.jail} hafta kaldı.</p><p class="m">Futbol oynayamazsın. Ailen seni ziyaret edebilir; kurs çalışabilirsin. Enerji işlerinin çoğu kapalı.</p></div>` : g.ban > 0 ? `<div class="card warn"><div class="eyebrow">⛔ Men cezası</div><p class="m">${g.ban} hafta boyunca resmi maçlarda oynayamazsın.</p></div>` : '';
  const f = (g.sins || []).length && !g.jail ? `<div class="card"><p class="m">📁 Kapanmamış ${g.sins.length} dosyan var. Her yıl ortaya çıkabilir; zaman aşımı 6 yıl.</p></div>` : '';
  return w + f + h;
};
/* cezaevinde ya da men cezasındayken kulüp teklifi gelmez */
const _soJ = startOffers;
startOffers = function (kind) { if (g && (g.jail > 0 || g.ban > 20) && (kind === 'free' || kind === 'win')) { toast(g.jail > 0 ? 'Cezaevindeyken kulüpler seninle görüşmüyor' : 'Men cezan bitmeden kulüpler teklif yapmıyor'); if (scr !== 'game') { scr = 'game'; draw(); } return; } return _soJ(kind); };

/* ============================================================
   MİRAS FC — v4.0 · Hikâye paketleri 2.0
   Paket alan oyuncu ne aldığını görür ve karşılığını alır:
   - Satın alınca "Paket açıldı" ekranı: bölümler, ne zaman başlar,
     tamamlayınca kazanılacak özel ödül.
   - Mağazada ve Miras sekmesinde Hikâye Günlüğü: bölüm bölüm ilerleme.
   - Her pakete yeni bölümler (Gurbet 8, Skandal 8, Kurucu 7) ve paket
     olayları daha sık çıkar.
   - Tamamlama ödülleri kalıcı ve oyunu değiştirir:
     🌍 Gurbet  → "Dünya Vatandaşı": yurtdışında takım uyumu %50 hızlı,
                  +40 jeton.
     ⚖️ Skandal → dürüst kaldıysan "Temiz Sayfa": ünün 25'in altına
                  düşmez, sponsor primi; değilse "Kötü Çocuk": her sezon
                  cesur markalardan reklam geliri. +40 jeton.
     🏟️ Kurucu  → "Kulüp Babası": kulübün her hafta gelir getirir,
                  altyapısından her sezon bir yetenek çıkar. +40 jeton.
   ============================================================ */
const abroad = () => g.club && g.club.ct && g.club.ct !== g.ct;
const PK2 = {
  gurbet: { e: '🌍', need: 6, rw: 'Dünya Vatandaşı: yurtdışında takım uyumun %50 daha hızlı artar · +40 jeton', when: 'Yurtdışındaki bir kulüpte oynarken başlar.',
    ch: [['pk_gurbet1', 'İlk kış'], ['pk_gurbet2', 'Annenin sesi'], ['pk_gurbet3', 'Sokaktaki nefret'], ['pk_gurbet4', 'Bayram sofrası'], ['pk_gurbet5', 'Yerel dilde ilk röportaj'], ['pk_gurbet6', 'Uykusuz geceler'], ['pk_gurbet7', 'Tribünün şarkısı'], ['pk_gurbet8', 'Sıla: eve dönüş']] },
  skandal: { e: '⚖️', need: 6, rw: 'Temiz Sayfa ya da Kötü Çocuk: seçimlerine göre kalıcı bir ün ve gelir etkisi · +40 jeton', when: 'Profesyonel olunca ve ünün arttıkça başlar.',
    ch: [['pk_skandal1', 'Bahis çetesi'], ['pk_skandal2', 'Çarpıtılmış haber'], ['pk_skandal3', 'Mali soruşturma'], ['pk_skandal4', 'Sahte video'], ['pk_skandal5', 'Paparazzi'], ['pk_skandal6', 'Gece kulübü kavgası'], ['pk_skandal7', 'Belgesel teklifi'], ['pk_skandal8', 'Hesaplaşma']] },
  kurucu: { e: '🏟️', need: 6, rw: 'Kulüp Babası: kulübün her hafta gelir getirir ve her sezon altyapısından yetenek çıkar · +40 jeton', when: 'Futbolu bırakınca (ya da teknik direktörken) yeterli paran varsa başlar.',
    ch: [['pk_kurucu1', 'Mahalle kulübü'], ['pk_kurucu2', 'Küme küme yükseliş'], ['pk_kurucu4', 'İlk forma sponsoru'], ['pk_kurucu5', 'Mahallenin yeteneği'], ['pk_kurucu6', 'Taraftar grubu'], ['pk_kurucu7', 'Devle kupa maçı'], ['pk_kurucu3', 'Adını taşıyan stadyum']] },
};
const pkClean = d => { g.flags.temizP = (g.flags.temizP || 0) + d; };
const PACK_EV2 = [
  /* --- Gurbet --- */
  { id: 'pk_gurbet4', a: [18, 40], once: 1, w: 3, f: () => hasPack('gurbet') && abroad(), t: 'Takım arkadaşın seni ailesinin bayram sofrasına davet etti. Hiç bilmediğin yemekler, hiç bilmediğin şarkılar…', c: [{ l: 'Git, her şeyi tat', f: () => { g.uyum = clr(g.uyum + 10, 0, 100); g.hap = clr(g.hap + 5, 0, 100); g.flags.dil = 1; L('O akşam bir ailen daha oldu.'); }, v: [0, 2, 3, 0] }, { l: 'Kibarca reddet, evde dinlen', f: () => { g.fit = clr(g.fit + 6, 0, 100); g.uyum = clr(g.uyum - 3, 0, 100); }, v: [1, 0, 0, 0] }] },
  { id: 'pk_gurbet5', a: [19, 40], once: 1, w: 3, f: () => hasPack('gurbet') && abroad() && g.flags.dil, t: 'Maçtan sonra mikrofon uzatıldı. Tercüman bekliyor ama sen ülkenin dilini öğrendin.', c: [{ l: 'Yerel dilde konuş', f: () => { g.rep = cl(g.rep + 6, 0, 100); g.uyum = clr(g.uyum + 6, 0, 100); news(`${g.name} röportajını ${g.club.ct} dilinde verdi; taraftarlar çok sevdi.`); }, v: [1, 3, 1, 0] }, { l: 'Tercümana bırak, risk alma', f: () => { }, v: [0, 0, 0, 0] }] },
  { id: 'pk_gurbet6', a: [18, 40], once: 1, w: 3, f: () => hasPack('gurbet') && abroad(), t: 'Gece uyuyamıyorsun. Memleketin kokusu, annenin yemekleri, eski sokağın… Performansın düşmeye başladı.', c: [{ l: 'Bir psikologla çalış', f: () => { money(-famCost(6), 'Psikolog'); g.hap = clr(g.hap + 8, 0, 100); g.form = cl(g.form + .4, 3, 10); }, v: [2, 0, 2, -1] }, { l: 'Hafta sonu memlekete uç', f: () => { g.hap = clr(g.hap + 12, 0, 100); g.fit = clr(g.fit - 10, 0, 100); aliveParent().forEach(p => relAdj(p, 8)); }, v: [0, 0, 4, -1] }, { l: 'Dişini sık, geçer', f: () => { g.form = cl(g.form - .5, 3, 10); g.val.am = clr(g.val.am + 3, 0, 100); }, v: [3, 0, -2, 0] }] },
  { id: 'pk_gurbet7', a: [19, 40], once: 1, w: 3, f: () => hasPack('gurbet') && abroad() && (g.uyum || 0) >= 55, t: () => `${clubName(g.club.n)} taraftarları senin için kendi dilinde bir tezahürat besteledi. Tüm stat aynı anda söylüyor.`, c: [{ l: 'Gözyaşlarını tutamadan tribüne koş', f: () => { g.hap = clr(g.hap + 12, 0, 100); g.mor = clr(g.mor + 10, 0, 100); g.rep = cl(g.rep + 3, 0, 100); }, v: [0, 2, 3, 0] }, { l: 'Formanı tribüne fırlat', f: () => { g.rep = cl(g.rep + 5, 0, 100); g.mor = clr(g.mor + 6, 0, 100); }, v: [0, 3, 1, 0] }] },
  { id: 'pk_gurbet8', a: [21, 42], once: 1, w: 4, f: () => hasPack('gurbet') && (g.flags.gurbetS || 0) >= 1 && g.club && g.club.ct === g.ct, t: 'Yıllar sonra memleketine döndün. Havaalanında binlerce kişi seni bekliyor; ellerinde senin formanın olduğu pankartlar.', c: [{ l: 'Kalabalığın içine yürü', f: () => { g.hap = clr(g.hap + 15, 0, 100); g.rep = cl(g.rep + 6, 0, 100); news(`${g.name} memleketine kahraman gibi döndü.`); }, v: [0, 3, 4, 0] }, { l: 'Sessizce ailene git', f: () => { aliveParent().forEach(p => relAdj(p, 12)); g.hap = clr(g.hap + 10, 0, 100); }, v: [0, 1, 5, 0] }] },
  /* --- Skandal --- */
  { id: 'pk_skandal4', a: [19, 45], once: 1, w: 3, f: () => hasPack('skandal') && g.rep >= 20, t: 'Sosyal medyada seni “hakemi itiyormuş” gibi gösteren montaj bir video yayıldı. Milyonlarca kişi izledi.', c: [{ l: 'Orijinal görüntüleri yayımla', f: () => { pkClean(1); g.rep = cl(g.rep + 4, 0, 100); L('Gerçek ortaya çıktı; montajı yapan hesap kapatıldı.'); }, v: [0, 3, 0, 0] }, { l: 'Dava aç', f: () => { pkClean(1); money(-famCost(8), 'Avukat'); g.rep = cl(g.rep + 2, 0, 100); }, v: [1, 2, 0, -1] }, { l: 'Karşı saldırı: rakip taraftarlara yüklen', f: () => { pkClean(-1); g.rep = cl(g.rep - 4, 0, 100); g.flags.hot = 1; }, v: [2, -3, 0, 1] }] },
  { id: 'pk_skandal5', a: [20, 50], once: 1, w: 3, f: () => hasPack('skandal') && g.fam.partner, t: () => `Paparazziler seni ve ${g.fam.partner.n}'${loc(g.fam.partner.n)} tatilde gizlice fotoğrafladı; dergiler kapak yaptı.`, c: [{ l: 'Birlikte açıklama yapın', f: () => { pkClean(1); relAdj(g.fam.partner, 6); g.rep = cl(g.rep + 2, 0, 100); }, v: [0, 2, 3, 0] }, { l: 'Fotoğrafçıya saldır', f: () => { pkClean(-1); g.rep = cl(g.rep - 6, 0, 100); money(-famCost(15), 'Tazminat'); g.flags.hot = 1; }, v: [2, -4, 0, -1] }, { l: 'Hiç umursama', f: () => { relAdj(g.fam.partner, -4); }, v: [1, 0, -1, 0] }] },
  { id: 'pk_skandal6', a: [19, 38], once: 1, w: 3, f: () => hasPack('skandal') && g.club, t: 'Bir gece kulübünde takım arkadaşın kavgaya karıştı; sen de oradaydın. Kulüp başkanı ne olduğunu soruyor.', c: [{ l: 'Doğruyu anlat', f: () => { pkClean(1); g.uyum = clr(g.uyum - 6, 0, 100); g.rep = cl(g.rep + 3, 0, 100); }, v: [0, 3, 0, 0] }, { l: 'Arkadaşını koru, yalan söyle', f: () => { pkClean(-1); g.uyum = clr(g.uyum + 8, 0, 100); if (Math.random() < .4) { g.rep = cl(g.rep - 8, 0, 100); L('Kamera kayıtları çıktı; yalanın ortaya çıktı.'); } }, v: [1, -2, 2, 0] }] },
  { id: 'pk_skandal7', a: [23, 70], once: 1, w: 3, f: () => hasPack('skandal') && g.rep >= 45, t: 'Bir yayın platformu hayatını belgesel dizi yapmak istiyor: kamera her yerde olacak, evinde bile.', c: [{ l: 'Kabul et, her şeyi göster', f: () => { money(famCost(90), 'Belgesel'); g.rep = cl(g.rep + 10, 0, 100); if (g.fam.partner) relAdj(g.fam.partner, -8); news(`${g.name} belgeseli rekor izlendi.`); }, v: [0, 1, -2, 4] }, { l: 'Sadece futbolu çeksinler', f: () => { pkClean(1); money(famCost(40), 'Belgesel'); g.rep = cl(g.rep + 5, 0, 100); }, v: [1, 2, 1, 2] }, { l: 'Reddet', f: () => { pkClean(1); g.hap = clr(g.hap + 3, 0, 100); }, v: [0, 1, 2, -1] }] },
  { id: 'pk_skandal8', a: [24, 80], once: 1, w: 4, f: () => hasPack('skandal') && pkSeen('skandal') >= 5, t: () => (g.flags.temizP || 0) >= 0 ? 'Federasyon seni yılın Fair Play elçisi seçti. Yıllarca çamur atıldı ama sen hep dik durdun.' : 'Bir spor kanalı seni “futbolun kötü çocuğu” ilan etti. Herkes seni konuşuyor; cesur markalar kapında.', c: [{ l: () => (g.flags.temizP || 0) >= 0 ? 'Ödülü gururla al' : 'Kötü çocuk imajını sahiplen', f: () => { }, v: [0, 2, 0, 0] }] },
  /* --- Kurucu --- */
  { id: 'pk_kurucu4', a: [35, 95], once: 1, w: 3, f: () => hasPack('kurucu') && g.flags.kurucu, t: 'Mahalle kulübün ilk forma sponsorunu arıyor: yerel bir fırın mı, büyük bir bahis şirketi mi?', c: [{ l: 'Mahalle fırını (az para, çok sevgi)', f: () => { g.hap = clr(g.hap + 6, 0, 100); g.rep = cl(g.rep + 2, 0, 100); g.flags.kurucuGelir = (g.flags.kurucuGelir || 1) + .2; }, v: [0, 3, 1, 0] }, { l: 'Bahis şirketi (çok para)', f: () => { money(famCost(30), 'Forma sponsoru'); g.rep = cl(g.rep - 2, 0, 100); g.flags.kurucuGelir = (g.flags.kurucuGelir || 1) + .5; }, v: [0, -2, 0, 3] }] },
  { id: 'pk_kurucu5', a: [36, 95], once: 1, w: 3, f: () => hasPack('kurucu') && (g.flags.kurucuLv || 0) >= 2, t: 'Kulübünün U13 takımında 12 yaşında bir çocuk herkesi geçiyor. Büyük kulüpler gözlemci yolladı.', c: [{ l: 'Onu kendi altyapında tut', f: () => { g.flags.kurucuYild = 1; g.hap = clr(g.hap + 6, 0, 100); L('Mahallenin yeteneği kulübünde kalıyor; adı yakında duyulacak.'); }, v: [0, 3, 1, -1] }, { l: 'Büyük kulübe sat, kulübe yatırım yap', f: () => { money(famCost(50), 'Genç oyuncu satışı'); g.flags.kurucuLv = Math.min(5, (g.flags.kurucuLv || 1) + (Math.random() < .5 ? 1 : 0)); }, v: [0, 0, 0, 3] }] },
  { id: 'pk_kurucu6', a: [36, 95], once: 1, w: 3, f: () => hasPack('kurucu') && (g.flags.kurucuLv || 0) >= 3, t: 'Mahallenin gençleri kulübe bir taraftar grubu kurdu. Senin adınla bir marş yazdılar.', c: [{ l: 'Maçlarda onlarla tribüne çık', f: () => { g.hap = clr(g.hap + 10, 0, 100); g.rep = cl(g.rep + 3, 0, 100); }, v: [0, 2, 2, 0] }, { l: 'Gruba otobüs ve forma al', f: () => { money(-famCost(10), 'Taraftar grubu'); g.hap = clr(g.hap + 7, 0, 100); g.flags.hayirsever = (g.flags.hayirsever || 0) + 1; }, v: [0, 3, 1, -1] }] },
  { id: 'pk_kurucu7', a: [36, 95], once: 1, w: 3, f: () => hasPack('kurucu') && (g.flags.kurucuLv || 0) >= 4, t: 'Kupada kura çekildi: mahalle kulübün ülkenin en büyük takımıyla eşleşti. Bütün ülke bu maçı konuşuyor.', c: [{ l: 'Kenarda sen otur', f: () => { const w = Math.random() < .28; g.hap = clr(g.hap + (w ? 20 : 6), 0, 100); g.rep = cl(g.rep + (w ? 10 : 3), 0, 100); L(w ? 'İNANILMAZ! Mahalle kulübün devi eledi!' : 'Onurlu bir yenilgi; ama bütün ülke kulübünü tanıdı.'); if (w) news(`${g.name}'${loc(g.name)} mahalle kulübü kupada devi devirdi!`); }, v: [1, 2, 2, 0] }, { l: 'Gelirle tesis yap, maçı izle', f: () => { money(famCost(25), 'Kupa geliri'); g.flags.kurucuLv = Math.min(5, (g.flags.kurucuLv || 1) + 1); }, v: [0, 0, 0, 2] }] },
];
PACK_EV2.forEach(e => { AD_EV.push(e); EVMAP[e.id] = e; });
/* eski paket olayları da daha sık çıksın */
['pk_gurbet1', 'pk_gurbet2', 'pk_gurbet3', 'pk_skandal1', 'pk_skandal2', 'pk_skandal3', 'pk_kurucu1', 'pk_kurucu2', 'pk_kurucu3'].forEach(id => { if (EVMAP[id] && !EVMAP[id].w) EVMAP[id].w = 3; });
/* Skandal'da dürüst/kirli seçimleri say */
[['pk_skandal1', [1, -1, 0]], ['pk_skandal2', [1, 0]], ['pk_skandal3', [1, -1]]].forEach(([id, d]) => { const e = EVMAP[id]; if (e) e.c.forEach((c, i) => { const f0 = c.f; c.f = x => { pkClean(d[i] || 0); return f0(x); }; }); });
function pkSeen(k) { return PK2[k].ch.filter(([id]) => g.mem && g.mem[id] != null).length; }
/* tamamlama */
function pkCheck() {
  if (!g || !g.mem) return; g.pkDone = g.pkDone || {};
  Object.keys(PK2).forEach(k => {
    if (!hasPack(k) || g.pkDone[k] || pkSeen(k) < PK2[k].need) return; g.pkDone[k] = 1; tokAdd(40, `${PACKS[k].n} hikâyesi tamamlandı`);
    if (k === 'gurbet') { g.flags.dunya = 1; L('🌍 Gurbet hikâyesini tamamladın: artık bir Dünya Vatandaşısın.'); }
    if (k === 'skandal') { if ((g.flags.temizP || 0) >= 0) { g.flags.temizSayfa = 1; g.rep = cl(g.rep + 8, 0, 100); L('⚖️ Skandal hikâyesi bitti: Temiz Sayfa. Adın artık güvenin simgesi.'); } else { g.flags.kotuCocuk = 1; g.rep = cl(g.rep + 5, 0, 100); L('😈 Skandal hikâyesi bitti: Kötü Çocuk. Herkes seni konuşuyor ve markalar bunu seviyor.'); } }
    if (k === 'kurucu') { g.flags.kulupBaba = 1; L('🏟️ Kurucu hikâyesi tamamlandı: Kulüp Babası. Kulübün artık sana gelir getiriyor.'); }
    pkShow(k, 1);
  });
}
const _choosePk = choose;
choose = function (i) { const id = g && g.ev && g.ev.id; const r = _choosePk(i); if (id && /^pk_/.test(id)) { try { pkCheck(); } catch (e) { } } return r; };
const _autoPk = autoChoose;
autoChoose = function () { const id = g && g.ev && g.ev.id; const r = _autoPk(); if (id && /^pk_/.test(id)) { try { pkCheck(); } catch (e) { } } return r; };
/* kalıcı ödüllerin etkisi */
const _ttPk = teamTraining;
teamTraining = function () { const u0 = g.uyum; _ttPk(); if (g.flags && g.flags.dunya && abroad() && g.uyum > u0) g.uyum = clr(g.uyum + (g.uyum - u0) * .5, 0, 100); if (g.flags && g.flags.temizSayfa && g.rep < 25) g.rep = 25; };
const _ytPk = yearTick;
yearTick = function (out) {
  const ab = abroad(); const r = _ytPk(out);
  try {
    if (ab && hasPack('gurbet')) g.flags.gurbetS = (g.flags.gurbetS || 0) + 1;
    if (g.flags.kotuCocuk) { money(famCost(25), 'Cesur marka reklamları'); out && out.lines && out.lines.push('😈 Kötü çocuk imajın reklam getirdi.'); }
    if (g.flags.temizSayfa && g.fin && g.fin.spons && g.fin.spons.length) { money(famCost(12), 'Temiz imaj sponsor primi'); }
    if (g.flags.kulupBaba && g.flags.kurucuYild && g.sq && g.club && Math.random() < .5) L('Mahalle kulübünün altyapısından bir genç profesyonel oldu; herkes senin adını anıyor.');
  } catch (e) { }
  return r;
};
const _payPk = payWeek;
payWeek = function () { _payPk(); try { if (g.flags && g.flags.kulupBaba) money(famCost(Math.round(2 * (g.flags.kurucuLv || 1) * (g.flags.kurucuGelir || 1))), 'Kulübünün geliri'); } catch (e) { } };

/* ---------- ekranlar: paket açıldı + hikâye günlüğü ---------- */
function pkShow(k, done) {
  const P0 = PACKS[k], X = PK2[k]; if (!P0 || !X) return;
  let el = document.getElementById('setp'); if (!el) { el = document.createElement('div'); el.id = 'setp'; el.className = 'tut'; document.body.appendChild(el); }
  el.hidden = false;
  el.innerHTML = `<div class="tutc card pkc"><div class="tute">${X.e}</div><div class="eyebrow gold">${done ? 'Hikâye tamamlandı' : 'Hikâye paketi açıldı'}</div><h2>${esc(P0.n)}</h2><p class="m">${esc(P0.d)}</p>
  ${done ? `<div class="pkrw">🏆 ${esc(X.rw)}</div>` : `<div class="lbl">Ne zaman başlar?</div><p class="m">${esc(X.when)}</p><div class="lbl">Bölümler (${X.ch.length})</div><ol class="pkch">${X.ch.map(([id, n]) => `<li>${esc(n)}</li>`).join('')}</ol><div class="lbl">Tamamlayınca (${X.need} bölüm)</div><div class="pkrw">🏆 ${esc(X.rw)}</div>`}
  <div class="actions"><button class="btn big" style="flex:1" onclick="document.getElementById('setp').hidden=true">${done ? 'Harika!' : 'Hikâyeye başla'}</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
const _buyPack2 = buyPack;
buyPack = function (k) { const had = acct().packs[k]; _buyPack2(k); if (!had && acct().packs[k]) pkShow(k); };
function pkJournal() {
  if (!g) return ''; const own = Object.keys(PK2).filter(hasPack); if (!own.length) return '';
  return `<div class="card"><div class="eyebrow">📖 Hikâye günlüğü</div>${own.map(k => { const X = PK2[k], n = pkSeen(k), dn = g.pkDone && g.pkDone[k];
    return `<div class="pkj"><div class="row-b"><b>${X.e} ${esc(PACKS[k].n)}</b><span class="m">${n}/${X.ch.length}${dn ? ' · 🏆' : ''}</span></div>${bar(n, X.ch.length)}<div class="pkchips">${X.ch.map(([id, t]) => `<span class="${g.mem && g.mem[id] != null ? 'on' : ''}">${g.mem && g.mem[id] != null ? '✓ ' + esc(t) : '🔒 ???'}</span>`).join('')}</div>${dn ? `<div class="m pkrw2">🏆 ${esc(X.rw)}</div>` : `<div class="m">${esc(X.when)} Ödül: ${n}/${X.need}</div>`}</div>`; }).join('')}</div>`;
}
const _shopUIpk = shopUI;
shopUI = function () {
  let h = _shopUIpk(); if (SHV !== 'paket') return h;
  h = h.replace(/<button class="act" onclick="buyPack\('(\w+)'\)">/g, (m, k) => `<button class="act" onclick="${acct().packs[k] ? `pkShow('${k}')` : `buyPack('${k}')`}">`);
  return h + `<div class="card"><p class="m">Her paket ${Object.values(PK2).map(x => x.ch.length).join(' / ')} bölümlük bir hikâye ve tamamlayınca kalıcı bir ödül içerir. Pakete dokunarak içeriğini gör.</p></div>` + pkJournal();
};
if (typeof legUI === 'function') { const _legPk = legUI; legUI = function () { return _legPk() + pkJournal(); }; }

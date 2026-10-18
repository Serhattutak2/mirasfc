/* ============================================================
   MİRAS FC — JETON, ÖDÜLLER, REKLAM, KARİYER BİLETİ, MAĞAZA
   Hesap düzeyinde tutulur (bütün kayıtlar için ortak): mfc_acct.
   Reklam ve satın alma bir BAĞLANTI NOKTASI üzerinden çalışır:
   mobil uygulamada window.MirasNative (AdMob / App Store / Google Play)
   bağlanır; web sürümünde deneme reklamı ve test satın alma çalışır.
   ============================================================ */
let ACCT = null; const ACCT_MEM = {};
function acct() {
  if (ACCT) return ACCT;
  try { const s = localStorage.getItem('mfc_acct'); if (s) ACCT = JSON.parse(s); } catch (e) { }
  if (!ACCT && ACCT_MEM.a) ACCT = JSON.parse(ACCT_MEM.a);
  ACCT = Object.assign({ tok: 10, streak: 0, lastDay: '', dailyPending: 0, ach: {}, adDay: '', adN: 0, pass: null, sub: 0, slots: 3, owned: {}, theme: 'altin', pitch: 'klasik', lastInter: 0, lang: null, packs: {} }, ACCT || {});
  return ACCT;
}
function acctSave() { const s = JSON.stringify(ACCT); ACCT_MEM.a = s; try { localStorage.setItem('mfc_acct', s); } catch (e) { } }
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function tokAdd(n, why) { const A = acct(); A.tok += n; acctSave(); if (why) toast(`🪙 +${n} · ${why}`); }
function tokSpend(n, what) { const A = acct(); if (A.tok < n) { toast(`${n} jeton gerekli (sende ${A.tok}). Mağazadan kazanabilirsin.`); return false; } A.tok -= n; acctSave(); toast(`🪙 −${n} · ${what}`); return true; }

/* ---------- Günlük giriş ---------- */
const DAILY = [1, 1, 2, 2, 3, 3, 6];
function dailyCheck() {
  const A = acct(), t = today(); if (A.lastDay === t) return;
  const y = new Date(Date.now() - 864e5), ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  A.streak = A.lastDay === ys ? (A.streak % 7) + 1 : 1; A.lastDay = t; A.dailyPending = DAILY[A.streak - 1]; acctSave();
}
function dailyClaim(dbl) {
  const A = acct(); if (!A.dailyPending) return; const n = A.dailyPending;
  const give = () => { tokAdd(n * (dbl ? 2 : 1), `Günlük ödül · ${A.streak}. gün`); A.dailyPending = 0; acctSave(); bpXP(15); draw(); };
  if (dbl) adRewarded('daily', give); else give();
}
function dailyCard() {
  const A = acct(); if (!A.dailyPending) return '';
  return `<div class="card q daily"><div class="eyebrow gold">Günlük ödül · ${A.streak}/7. gün</div><div class="dstreak">${DAILY.map((v, i) => `<span class="${i < A.streak ? 'on' : ''}">${v}</span>`).join('')}</div><p class="m">Her gün gir, seri büyüsün. 7. gün büyük ödül!</p><div class="actions"><button class="btn" onclick="dailyClaim(0)">🪙 ${A.dailyPending} al</button><button class="btn ghost" onclick="dailyClaim(1)">📺 İzle, 2 katı al</button></div></div>`;
}

/* ---------- Başarımlar (hesap düzeyinde, bir kez) ---------- */
const ACH = [
  { id: 'ilkimza', n: 'İlk imza', d: 'İlk profesyonel sözleşmeni imzala', t: 10, f: () => g.hist.length >= 1 },
  { id: 'ilkgol', n: 'İlk gol', d: 'Profesyonel ilk golünü at', t: 10, f: () => g.car.g >= 1 },
  { id: 'gol100', n: 'Golcü', d: 'Kariyerinde 100 gol', t: 30, f: () => g.car.g >= 100 },
  { id: 'gol300', n: 'Efsane golcü', d: 'Kariyerinde 300 gol', t: 60, f: () => g.car.g >= 300 },
  { id: 'mac300', n: 'Emektar', d: '300 resmi maç', t: 30, f: () => g.car.ap >= 300 },
  { id: 'lig1', n: 'Şampiyon', d: 'Lig şampiyonluğu yaşa', t: 25, f: () => g.car.t >= 1 },
  { id: 'kupa1', n: 'Kupa kaldır', d: 'Ulusal kupa kazan', t: 20, f: () => g.car.cup >= 1 },
  { id: 'avrupa', n: 'Avrupa’nın zirvesi', d: 'Şampiyonlar Kupası kazan', t: 60, f: () => g.car.ec >= 1 },
  { id: 'milli', n: 'Ay yıldızlı', d: 'Milli takımda forma giy', t: 15, f: () => g.nat.caps >= 1 },
  { id: 'dunya', n: 'Dünya şampiyonu', d: 'Dünya Kupası kazan', t: 100, f: () => g.ntw.wc >= 1 },
  { id: 'altintop', n: 'Altın Top', d: 'Altın Top ödülünü kazan', t: 80, f: () => (g.car.bal || 0) >= 1 },
  { id: 'kaptan', n: 'Kaptan', d: 'Kaptanlık bandını tak', t: 15, f: () => g.captain },
  { id: 'evlen', n: 'Hayat arkadaşı', d: 'Evlen', t: 15, f: () => g.fam.partner && g.fam.partner.st === 'evli' },
  { id: 'cocuk', n: 'Anne/baba', d: 'Çocuğun olsun', t: 15, f: () => g.fam.kids.length >= 1 },
  { id: 'uccocuk', n: 'Kalabalık aile', d: '3 çocuk sahibi ol', t: 25, f: () => g.fam.kids.length >= 3 },
  { id: 'sirket', n: 'Girişimci', d: 'Bir şirket kur', t: 10, f: () => g.fin.biz.length >= 1 },
  { id: 'milyoner', n: 'Milyoner', d: '10 M€ servete ulaş', t: 30, f: () => wealth() >= 10000 },
  { id: 'kulup', n: 'Başkan', d: 'Bir kulüp satın al', t: 40, f: () => !!g.own },
  { id: 'lisans', n: 'Hoca adayı', d: 'UEFA C lisansı al', t: 10, f: () => g.lic >= 1 },
  { id: 'pro', n: 'Pro lisans', d: 'UEFA Pro lisansı al', t: 30, f: () => g.lic >= 4 },
  { id: 'td', n: 'Kenardaki adam', d: 'Teknik direktör ol', t: 15, f: () => !!g.coach },
  { id: 'tdsamp', n: 'Şampiyon hoca', d: 'T.D. olarak lig kazan', t: 50, f: () => g.coach && g.coach.t >= 1 },
  { id: 'kusak2', n: 'Miras', d: 'Mirası çocuğuna devret', t: 40, f: () => (g.linN || (g.lin || []).length) >= 1 },
  { id: 'kusak5', n: 'Hanedan', d: '5. kuşağa ulaş', t: 120, f: () => (g.linN || (g.lin || []).length) >= 4 },
  { id: 'hayal', n: 'Hayalini yaşadın', d: 'Çocukluk hayalini gerçekleştir', t: 50, f: () => dreamDone(g) },
  { id: 'hayir', n: 'Hayırsever', d: '3 hayır işi yap', t: 20, f: () => (g.flags.hayirsever || 0) >= 3 },
  { id: 'efsane', n: 'Efsane', d: 'Miras Puanı 2400', t: 100, f: () => mp() >= 2400 },
  { id: 'gurbet', n: 'Gurbetçi', d: 'Yurtdışında bir kulüpte oyna', t: 15, f: () => g.hist.some(h => h.ct !== g.ct) },
  { id: 'cocukkulup', n: 'Eve dönüş', d: 'Çocukluk kulübünde oyna', t: 20, f: () => g.homeClub && g.hist.some(h => h.id === g.homeClub && h.how !== 'altyapıdan A takıma') },
  { id: 'dunyasira', n: 'Dünyanın en iyisi', d: 'Antrenörler sıralamasında ilk 10', t: 60, f: () => g.lic >= 1 && g.cw && cwRank() <= 10 },
];
/* başarım ödülleri bilerek küçük: jetonun asıl kaynağı mağaza */
ACH.forEach(a => { a.t = Math.max(2, Math.round(a.t / 5)); });
function achCheck() {
  if (!g || g.phase === 'child' && g.age < 16) return; const A = acct(); let got = null;
  for (const a of ACH) { if (A.ach[a.id]) continue; let ok = false; try { ok = !!a.f(); } catch (e) { } if (ok) { A.ach[a.id] = 1; A.tok += a.t; got = a; L(`🏆 Başarım: ${a.n} (+${a.t} jeton)`); } }
  if (got) { acctSave(); toast(`🏆 ${got.n} · 🪙 +${got.t}`); }
}

/* ---------- Kariyer Bileti (her ay yenilenir) ---------- */
const BP_LV = 30, BP_XP = 100;
function bpCur() { const A = acct(), id = today().slice(0, 7); if (!A.pass || A.pass.id !== id) { A.pass = { id, xp: 0, gold: 0, cf: [], cg: [] }; acctSave(); } return A.pass; }
function bpXP(n) { const p = bpCur(), lv0 = Math.floor(p.xp / BP_XP); p.xp = Math.min(BP_LV * BP_XP, p.xp + n); acctSave(); if (Math.floor(p.xp / BP_XP) > lv0) toast(`🎟 Kariyer Bileti seviye ${Math.floor(p.xp / BP_XP)}!`); }
const bpFree = lv => lv % 5 === 0 ? { tok: 2 + Math.floor(lv / 10) } : null;
const bpGold = lv => lv % 10 === 0 ? { tok: 40, theme: ['', 'mavi', 'zumrut', 'gece'][lv / 10] } : { tok: 12 + Math.floor(lv / 5) * 3 };
function bpClaim(lv, gold) {
  const p = bpCur(); if (Math.floor(p.xp / BP_XP) < lv) return toast('Bu seviyeye henüz ulaşmadın');
  const arr = gold ? p.cg : p.cf; if (arr.includes(lv)) return toast('Zaten aldın'); if (gold && !p.gold) return toast('Altın yol için Altın Bilet gerekli');
  const r = gold ? bpGold(lv) : bpFree(lv); if (!r) return; arr.push(lv); if (r.tok) acct().tok += r.tok; if (r.theme) acct().owned['tema_' + r.theme] = 1; acctSave(); toast(`🎟 Ödül alındı: 🪙 ${r.tok}${r.theme ? ' + tema' : ''}`); draw();
}

/* ---------- Reklam bağlantı noktası ---------- */
const AD = {
  rewarded(kind, cb) { if (window.MirasNative && window.MirasNative.showRewarded) return window.MirasNative.showRewarded(kind, ok => ok && cb()); adOverlay('Ödüllü reklam', 5, cb, false); },
  inter() { if (window.MirasNative && window.MirasNative.showInterstitial) return window.MirasNative.showInterstitial(); adOverlay('Reklam', 5, null, true); },
};
function adOverlay(title, sec, cb, skip) {
  let d = $('adov'); if (!d) { d = document.createElement('div'); d.id = 'adov'; d.className = 'adov'; document.body.appendChild(d); }
  let left = sec; d.hidden = false;
  let paint = () => { d.innerHTML = `<div class="adbox"><div class="eyebrow">${title} · deneme</div><div class="adfake"><b>Miras FC</b><span>Burada gerçek uygulamada bir reklam görünecek.</span></div><div class="m">${left > 0 ? left + ' saniye…' : 'Bitti'}</div>${left <= 0 ? `<button class="btn" id="adok">${cb ? 'Ödülü al' : 'Kapat'}</button>` : skip && left <= sec - 3 ? `<button class="btn ghost" id="adok">Geç</button>` : ''}</div>`; const b = $('adok'); if (b) b.onclick = () => { d.hidden = true; clearInterval(tm); if (cb && left <= 0) cb(); }; };
  const paint0 = paint; paint = () => { paint0(); i18nApply(d); }; paint(); const tm = setInterval(() => { left--; paint(); if (left <= 0) clearInterval(tm); }, 1000);
}
function adRewarded(kind, cb) { AD.rewarded(kind, () => { bpXP(5); cb(); }); }
function adInterMaybe() { const A = acct(); if (A.sub) return; const now = Date.now(); if (now - (A.lastInter || 0) < 180000) return; A.lastInter = now; acctSave(); AD.inter(); }
function adTokens() { const A = acct(), t = today(); if (A.adDay !== t) { A.adDay = t; A.adN = 0; } if (A.adN >= 3) return toast('Bugünkü reklam ödülü hakkın doldu (3/3)'); adRewarded('tok', () => { A.adN++; tokAdd(2, `Reklam ödülü (${A.adN}/3)`); draw(); }); }
/* bağlama özel ödüllü reklamlar */
function adEnergy() { if ((g.adEnW || '') === g.season + ':' + g.week) return toast('Bu hafta enerji reklamını kullandın'); adRewarded('energy', () => { g.adEnW = g.season + ':' + g.week; g.en = Math.min(enMax() + 25, g.en + 25); toast('⚡ +25 enerji'); sv(); draw(); }); }
function adInjury() { if (!g.inj || g.adInj === g.inj) return; adRewarded('inj', () => { g.inj = Math.max(1, Math.ceil(g.inj / 2)); g.adInj = g.inj; toast(`Tedavi hızlandı: ${g.inj} hafta`); sv(); draw(); }); }
function adNego() { const N = g.nego; if (!N || N.done !== -1) return; adRewarded('nego', () => { const o = g.of[N.oi]; o.gone = 0; o.msg = ''; N.done = 0; N.pat = 30; N.log.unshift('Menajerin son bir kez aradı; kulüp masaya döndü.'); sv(); draw(); }); }
function adRetry() { if (!M || !S || S.phase !== 'done' || M.adRetry) return; adRewarded('retry', () => { const mo = S.mo, sc = [...M.sc]; M.adRetry = 1; cancelAnimationFrame(RAF); M.mi--; M.sc = sc; S = mkScene(mo); M.stage = 'scene'; draw(); }); }

/* ---------- Satın alma bağlantı noktası ---------- */
const IAP_P = [
  { id: 'tok100', n: '100 jeton', tok: 100, tl: '34,99 ₺', usd: '$0.99' },
  { id: 'tok550', n: '550 jeton', tok: 550, tl: '149,99 ₺', usd: '$4.99', tag: '+%10' },
  { id: 'tok1200', n: '1.200 jeton', tok: 1200, tl: '299,99 ₺', usd: '$9.99', tag: 'En çok tercih edilen' },
  { id: 'tok2500', n: '2.500 jeton', tok: 2500, tl: '549,99 ₺', usd: '$19.99', tag: '+%25' },
  { id: 'gold', n: 'Altın Bilet (bu ay)', tl: '129,99 ₺', usd: '$3.99' },
  { id: 'miras', n: 'Miras Paketi (bu kayıt)', tl: '39,99 ₺', usd: '$0.99', d: 'Torunla ve sonraki kuşaklarla devam et · sadece bu kayıt için' },
  { id: 'sub', n: 'Miras Kulübü (aylık)', tl: '59,99 ₺', usd: '$1.99', d: 'Zorunlu reklam yok · her ay 150 jeton · +3 kayıt yuvası' },
];
const IAP = {
  buy(id, cb) { if (window.MirasNative && window.MirasNative.purchase) return window.MirasNative.purchase(id, ok => ok && cb()); ask('Bu web sürümünde gerçek ödeme yok. Test satın alması yapılsın mı? (Ücret alınmaz.)', cb, 'Test et'); },
};
function buy(id) {
  const p = IAP_P.find(x => x.id === id); if (!p) return;
  IAP.buy(id, () => { const A = acct(); if (p.tok) A.tok += p.tok; if (id === 'gold') bpCur().gold = 1; if (id === 'miras' && g) { g.heirPass = 1; sv(); } if (id === 'sub') { A.sub = 1; A.tok += 150; A.slots = Math.max(A.slots, 6); } acctSave(); toast(`Teşekkürler! ${p.n} hesabına eklendi`); draw(); });
}

/* ---------- Jetonla alınanlar ---------- */
let UNDO = null, UNDOL = '';
const undoLbl = () => { const t = T(UNDOL); return t.length > 64 ? t.slice(0, 62) + '…' : t; };
const _choose = choose; choose = function (i) { try { UNDO = JSON.stringify(g); UNDOL = g.ev ? g.ev.t : ''; } catch (e) { } return _choose(i); };
const _sign = sign; sign = function (i) { try { UNDO = JSON.stringify(g); UNDOL = 'İmza: ' + (g.of[i] ? clubName(g.of[i].n) : ''); } catch (e) { } return _sign(i); };
function undoLast() { if (!UNDO) return toast('Geri alınacak bir karar yok'); if (!tokSpend(30, 'Kararı geri al')) return; g = JSON.parse(UNDO); UNDO = null; reindex(); scr = g.of && g.of.length ? 'offers' : 'game'; sv(); toast('Karar geri alındı'); draw(); }
function buyEnergy() { if ((g.tokEnW || '') === g.season + ':' + g.week) return toast('Haftada bir kez alınabilir'); if (!tokSpend(15, '+25 enerji')) return; g.tokEnW = g.season + ':' + g.week; g.en += 25; sv(); draw(); }
function buyHeal() { if (!g.inj) return toast('Sakat değilsin'); if (!tokSpend(25, 'Hızlı tedavi')) return; g.inj = Math.max(1, Math.ceil(g.inj / 2)); sv(); draw(); }
function buyScoutNego() { const N = g.nego; if (!N || N.scout) return; if (!tokSpend(20, 'Gözlemci raporu')) return; N.scout = 1; sv(); draw(); }
function buyScoutKid(i) { const k = g.fam.kids[i]; if (!k || k.scouted) return; if (!tokSpend(20, 'Gözlemci raporu')) return; k.scouted = 1; sv(); draw(); }
function buySlot() { const A = acct(); if (A.slots >= 6) return toast('En fazla 6 kayıt yuvası'); if (!tokSpend(150, 'Ek kayıt yuvası')) return; A.slots++; acctSave(); draw(); }
const THEMES = { altin: { n: 'Altın (varsayılan)', c: '#e8c468', c2: '#b8913a', p: 0 }, mavi: { n: 'Gece mavisi', c: '#7fb2ff', c2: '#4b7fd1', p: 50 }, zumrut: { n: 'Zümrüt', c: '#56c98d', c2: '#2f9a63', p: 50 }, gece: { n: 'Kızıl gece', c: '#ff8a6b', c2: '#d1543a', p: 80 } };
const PITCH = { klasik: { n: 'Klasik çim', p: 0 }, retro: { n: 'Retro (eski TV)', p: 60 }, gece: { n: 'Gece maçı', p: 60 } };
function buyTheme(k) { const A = acct(), T = THEMES[k]; if (!T) return; if (!A.owned['tema_' + k] && T.p) { if (!tokSpend(T.p, T.n + ' teması')) return; A.owned['tema_' + k] = 1; } A.theme = k; acctSave(); applyTheme(); draw(); }
function buyPitch(k) { const A = acct(), T = PITCH[k]; if (!T) return; if (!A.owned['saha_' + k] && T.p) { if (!tokSpend(T.p, T.n)) return; A.owned['saha_' + k] = 1; } A.pitch = k; acctSave(); draw(); }
function applyTheme() { const T = THEMES[acct().theme] || THEMES.altin; document.documentElement.style.setProperty('--gold', T.c); document.documentElement.style.setProperty('--gold2', T.c2); }
const PACKS = { gurbet: { n: 'Gurbet', d: 'Yurtdışında yalnızlık, dil, kültür şoku ve sıla hasreti olayları', p: 200 }, skandal: { n: 'Skandal', d: 'Bahis iddiaları, basın krizleri, mahkeme ve itibar savaşları', p: 200 }, kurucu: { n: 'Kulüp kurucusu', d: 'Sıfırdan bir amatör kulüp kurup yükseltme hikâyesi', p: 250 } };
function buyPack(k) { const A = acct(), P0 = PACKS[k]; if (A.packs[k]) return toast('Bu paket zaten sende'); if (!tokSpend(P0.p, P0.n + ' hikâye paketi')) return; A.packs[k] = 1; acctSave(); L(`📖 ${P0.n} hikâye paketi açıldı.`); draw(); }
const hasPack = k => !!acct().packs[k];
/* hikâye paketleri: koşullu olaylar */
const PACK_EV = [
  { id: 'pk_gurbet1', a: [18, 35], once: 1, f: () => hasPack('gurbet') && g.club && g.club.ct !== g.ct, t: () => `${g.club.ct}'${loc(g.club.ct)} ilk kışın. Dil bilmiyorsun, soyunma odasındaki şakaları anlamıyorsun.`, c: [{ l: 'Akşamları dil kursuna git', f: () => { g.flags.dil = 1; g.uyum = clr(g.uyum + 8, 0, 100); g.en = Math.max(0, g.en - 10); }, v: [2, 0, 0, 0] }, { l: 'Ülkemden oyuncularla takıl', f: () => { g.hap = clr(g.hap + 5, 0, 100); g.uyum = clr(g.uyum - 4, 0, 100); }, v: [0, 2, 2, 0] }] },
  { id: 'pk_gurbet2', a: [18, 40], cd: 3, f: () => hasPack('gurbet') && g.club && g.club.ct !== g.ct && aliveParent().length, t: 'Annen telefonda ağlıyor: “Ne zaman döneceksin oğlum/kızım?”', c: [{ l: 'Ailemi yanıma getireyim', f: () => { money(-famCost(15), 'Ailenin taşınması'); aliveParent().forEach(p => relAdj(p, 12)); g.hap = clr(g.hap + 8, 0, 100); }, v: [0, 1, 5, -2] }, { l: 'Devre arasında uçarım', f: () => { aliveParent().forEach(p => relAdj(p, 6)); g.fit = clr(g.fit - 6, 0, 100); }, v: [0, 1, 3, 0] }] },
  { id: 'pk_gurbet3', a: [20, 40], once: 1, f: () => hasPack('gurbet') && g.club && g.club.ct !== g.ct, t: 'Sokakta ırkçı bir saldırıya uğradın. Basın konuyu büyütüyor.', c: [{ l: 'Kampanyanın yüzü ol', f: () => { g.rep = cl(g.rep + 6, 0, 100); g.flags.hayirsever = (g.flags.hayirsever || 0) + 1; }, v: [1, 3, 0, 0] }, { l: 'Sessiz kal, ülkeme dön', f: () => { g.wantOut = 1; g.hap = clr(g.hap - 6, 0, 100); }, v: [0, 0, 3, 0] }] },
  { id: 'pk_skandal1', a: [20, 38], once: 1, f: () => hasPack('skandal') && g.club, t: 'Bir bahis çetesi, sarı kart görmen için sana büyük para teklif ediyor.', c: [{ l: 'Polise git', f: () => { g.rep = cl(g.rep + 8, 0, 100); news(`${g.name} şike girişimini ihbar etti.`); }, v: [0, 5, 0, 0] }, { l: 'Kabul et', f: () => { money(famCost(60), 'Rüşvet'); if (Math.random() < .5) { g.rep = 0; g.role = 0; L('Şike soruşturmasında adın çıktı; 2 yıl men cezası aldın.'); g.inj = 40; } }, v: [0, -8, 0, 6] }, { l: 'Duymamış ol', f: () => { }, v: [0, 0, 0, 0] }] },
  { id: 'pk_skandal2', a: [22, 50], once: 1, f: () => hasPack('skandal') && g.rep >= 30, t: 'Eski bir arkadaşın, yıllar önceki bir olayı “çarpıtarak” bir gazeteye satmış.', c: [{ l: 'Dava aç ve gerçeği anlat', f: () => { money(-famCost(10), 'Avukat'); if (Math.random() < .6) { g.rep = cl(g.rep + 3, 0, 100); L('Davayı kazandın.'); } else { g.rep = cl(g.rep - 6, 0, 100); L('Dava uzadı, adın lekelendi.'); } }, v: [2, 1, 0, -1] }, { l: 'Arkadaşınla yüz yüze konuş', f: () => { const f = friend(); if (f) relAdj(f, -20); g.rep = cl(g.rep - 2, 0, 100); }, v: [0, 2, 0, 0] }] },
  { id: 'pk_skandal3', a: [25, 60], once: 1, f: () => hasPack('skandal') && (g.coach || g.own), t: 'Kulübünün mali tablolarında usulsüzlük çıktı; savcılık soruşturma açtı.', c: [{ l: 'Tam iş birliği yap', f: () => { if (g.coach) g.coach.conf = clr(g.coach.conf - 5, 0, 100); g.rep = cl(g.rep + 3, 0, 100); }, v: [0, 4, 0, -1] }, { l: 'Avukatlarla kapat', f: () => { money(-famCost(40), 'Avukatlar'); if (Math.random() < .3) { g.rep = cl(g.rep - 12, 0, 100); L('Basın belgeleri yayımladı.'); } }, v: [1, -2, 0, 2] }] },
  { id: 'pk_kurucu1', a: [35, 75], once: 1, f: () => hasPack('kurucu') && g.phase !== 'pro' && g.money > famCost(80), t: 'Doğduğun mahallenin amatör takımı kapanmak üzere. Kulübü devralıp yeniden kurabilirsin.', c: [{ l: 'Kulübü kur, başkan ol', f: () => { money(-famCost(80), 'Amatör kulübü kurmak'); g.flags.kurucu = 1; g.flags.kurucuLv = 1; g.hap = clr(g.hap + 10, 0, 100); L('Mahalle kulübünü yeniden kurdun!'); }, v: [2, 4, 2, -3] }, { l: 'Bağış yap, yönetime karışma', f: () => { money(-famCost(20), 'Mahalle kulübüne bağış'); g.flags.hayirsever = (g.flags.hayirsever || 0) + 1; }, v: [0, 3, 1, -1] }] },
  { id: 'pk_kurucu2', a: [35, 90], cd: 2, f: () => hasPack('kurucu') && g.flags.kurucu && (g.flags.kurucuLv || 1) < 5, t: () => `Amatör kulübün ${g.flags.kurucuLv}. kümede. Bir üst lige çıkmak için yatırım gerekiyor.`, c: [{ l: 'Saha ve tesis yatırımı', f: () => { money(-famCost(40 * g.flags.kurucuLv), 'Kulüp tesisi'); if (Math.random() < .6) { g.flags.kurucuLv++; L(`Mahalle kulübün bir üst lige çıktı! (${g.flags.kurucuLv}. seviye)`); g.hap = clr(g.hap + 8, 0, 100); g.rep = cl(g.rep + 2, 0, 100); } else L('Sezon iyi geçmedi; terfi seneye kaldı.'); }, v: [2, 2, 0, -2] }, { l: 'Gençlere oynama şansı ver', f: () => { g.acp = (g.acp || 0) + 1; g.hap = clr(g.hap + 4, 0, 100); }, v: [0, 3, 1, 0] }] },
  { id: 'pk_kurucu3', a: [40, 95], once: 1, f: () => hasPack('kurucu') && (g.flags.kurucuLv || 0) >= 5, t: 'Kurduğun mahalle kulübü profesyonel lige yükseldi! Şehir senin adını stadyuma vermek istiyor.', c: [{ l: 'Kabul et', f: () => { g.rep = cl(g.rep + 10, 0, 100); g.hap = clr(g.hap + 15, 0, 100); g.flags.stadAd = 1; news(`${g.name} Stadyumu açıldı.`); }, v: [1, 3, 1, 0] }] },
];
PACK_EV.forEach(e => { AD_EV.push(e); EVMAP[e.id] = e; });

/* ---------- Ekranlar ---------- */
let SHV = 'jeton', SHB = null;
function openShop() { SHB = scr === 'shop' ? SHB : scr; scr = 'shop'; draw(); window.scrollTo(0, 0); }
function closeShop() { scr = SHB && SHB !== 'shop' ? SHB : (g ? 'game' : 'menu'); SHB = null; if (scr === 'menu' || !g) return menu(); draw(); }
const seasonTok = () => 2 + Math.min(4, Math.floor((g.lastSeason && g.lastSeason.ss ? g.lastSeason.ss.g : 0) / 10)) + (g.lastSeason && g.lastSeason.pos === 1 ? 3 : 0);
function seasonReward(dbl) { if (g.sRew === g.season) return; const n = seasonTok(); const give = () => { g.sRew = g.season; tokAdd(n * (dbl ? 2 : 1), 'Sezon ödülü'); sv(); draw(); }; if (dbl) adRewarded('season', give); else give(); }
function shopUI() {
  const A = acct(), v = SHV, p = bpCur(), lv = Math.floor(p.xp / BP_XP), price = x => (acct().lang === 'en' ? x.usd : x.tl);
  let h = `<div class="card shoph"><div class="row-b"><div><div class="eyebrow">Mağaza</div><div class="big">🪙 ${A.tok}</div></div><button class="btn ghost" onclick="closeShop()">Kapat</button></div><div class="segs">${seg('SHV', 'jeton', 'Jeton', v)}${seg('SHV', 'bilet', '🎟 Bilet', v)}${seg('SHV', 'harca', 'Harca', v)}${seg('SHV', 'gorunum', 'Görünüm', v)}${seg('SHV', 'paket', 'Hikâyeler', v)}${seg('SHV', 'basarim', 'Başarımlar', v)}</div></div>`;
  if (v === 'jeton') {
    const adLeft = A.adDay === today() ? 3 - A.adN : 3;
    h += `<div class="card"><div class="eyebrow">Ücretsiz kazan</div><button class="act" onclick="adTokens()"><div><b>📺 Reklam izle</b><span>Günde 3 kez · kalan ${adLeft}</span></div><div class="ac"><b>+2🪙</b></div></button>${dailyCard()}<div class="m">Başarımlar, sezon sonu ödülleri ve Kariyer Bileti de jeton verir.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Jeton paketleri</div>${IAP_P.filter(x => x.tok).map(x => `<button class="act" onclick="buy('${x.id}')"><div><b>🪙 ${x.n}</b><span>${x.tag || ''}</span></div><div class="ac"><b>${price(x)}</b></div></button>`).join('')}</div>`;
    { const P0 = IAP_P.find(x => x.id === 'miras'); h += `<div class="card"><div class="eyebrow">Miras Paketi</div>${g && g.heirPass ? '<p class="lead">Bu kayıtta açık: bütün kuşaklarla devam edebilirsin. ✨</p>' : `<button class="act" onclick="${g ? 'heirBuy()' : `toast('Önce bir hayat başlat')`}"><div><b>👨‍👦 Kuşaklar boyu devam</b><span>${P0.d}</span></div><div class="ac"><b>${price(P0)}</b></div></button>`}<div class="m">Kurucudan oğluna ilk devir ücretsizdir. Paket yalnızca alındığı kayıt için geçerlidir.</div></div>`; }
    h += `<div class="card"><div class="eyebrow">Miras Kulübü</div>${A.sub ? '<p class="lead">Abonesin. Teşekkürler! ✨</p>' : `<button class="act" onclick="buy('sub')"><div><b>Aylık abonelik</b><span>${IAP_P.find(x => x.id === 'sub').d}</span></div><div class="ac"><b>${price(IAP_P.find(x => x.id === 'sub'))}</b></div></button>`}</div>`;
  }
  if (v === 'bilet') {
    h += `<div class="card"><div class="eyebrow">Kariyer Bileti · ${p.id}</div><div class="prow"><span>Seviye ${lv}/${BP_LV}</span>${bar(p.xp % BP_XP, BP_XP)}<b>${p.xp % BP_XP}/${BP_XP}</b></div><div class="m">Maç oynamak, gol atmak, haftaları ve sezonları tamamlamak bilet puanı kazandırır. Her ay sıfırlanır.</div>${p.gold ? '<div class="m gold">Altın Bilet aktif</div>' : `<button class="btn" onclick="buy('gold')">Altın Bileti aç · ${price(IAP_P.find(x => x.id === 'gold'))}</button>`}</div>`;
    h += `<div class="card"><div class="bp">${Array.from({ length: BP_LV }, (_, i) => i + 1).map(l => { const f = bpFree(l), gd = bpGold(l), cf = p.cf.includes(l), cg = p.cg.includes(l), ok = lv >= l; return `<div class="bpr ${ok ? 'ok' : ''}"><span>${l}</span><button class="chip ${!f ? 'dis' : cf ? 'on' : ''}" ${f ? `onclick="bpClaim(${l},0)"` : 'disabled'}>${f ? (cf ? '✔' : '🪙' + f.tok) : '—'}</button><button class="chip gold ${cg ? 'on' : ''}" onclick="bpClaim(${l},1)">${cg ? '✔' : '🪙' + gd.tok + (gd.theme ? ' + tema' : '')}</button></div>`; }).join('')}</div></div>`;
  }
  if (v === 'harca') {
    h += `<div class="card"><div class="eyebrow">Jetonla</div>
    <button class="act" onclick="${g ? 'undoLast()' : "toast('Önce bir hayata başla')"}"><div><b>↶ Kararı geri al</b><span>${UNDO ? 'Son karar: ' + esc(undoLbl()) : 'Henüz geri alınacak karar yok'}</span></div><div class="ac"><b>🪙30</b></div></button>
    <button class="act" onclick="${g ? 'buyEnergy()' : "toast('Önce bir hayata başla')"}"><div><b>⚡ +25 enerji</b><span>Haftada bir kez</span></div><div class="ac"><b>🪙15</b></div></button>
    <button class="act" onclick="${g ? 'buyHeal()' : "toast('Önce bir hayata başla')"}"><div><b>🏥 Özel klinik</b><span>Sakatlık süresi yarıya iner</span></div><div class="ac"><b>🪙25</b></div></button>
    <button class="act" onclick="buySlot()"><div><b>💾 Ek kayıt yuvası</b><span>Şu an ${A.slots}/6</span></div><div class="ac"><b>🪙150</b></div></button>
    <div class="m">Gözlemci raporu (🪙20): pazarlık masasında kulübün sınırlarını, Yaşam sekmesinde çocuğunun gerçek yeteneğini gösterir.</div></div>`;
  }
  if (v === 'gorunum') {
    h += `<div class="card"><div class="eyebrow">Renk teması</div>${Object.entries(THEMES).map(([k, t]) => `<button class="act" onclick="buyTheme('${k}')"><div><b><i class="sw" style="background:${t.c}"></i>${t.n}</b><span>${A.theme === k ? 'Kullanılıyor' : A.owned['tema_' + k] || !t.p ? 'Sende' : ''}</span></div><div class="ac"><b>${A.owned['tema_' + k] || !t.p ? (A.theme === k ? '✔' : 'Seç') : '🪙' + t.p}</b></div></button>`).join('')}</div>
    <div class="card"><div class="eyebrow">Maç sahası</div>${Object.entries(PITCH).map(([k, t]) => `<button class="act" onclick="buyPitch('${k}')"><div><b>${t.n}</b><span>${A.pitch === k ? 'Kullanılıyor' : ''}</span></div><div class="ac"><b>${A.owned['saha_' + k] || !t.p ? (A.pitch === k ? '✔' : 'Seç') : '🪙' + t.p}</b></div></button>`).join('')}</div>`;
  }
  if (v === 'paket') h += `<div class="card"><div class="eyebrow">Hikâye paketleri</div>${Object.entries(PACKS).map(([k, P0]) => `<button class="act" onclick="buyPack('${k}')"><div><b>📖 ${P0.n}</b><span>${P0.d}</span></div><div class="ac"><b>${A.packs[k] ? '✔ Sende' : '🪙' + P0.p}</b></div></button>`).join('')}<div class="m">Paketler bütün kayıtlarında geçerlidir; olaylar koşulları oluştuğunda hikâyene girer.</div></div>`;
  if (v === 'basarim') { const got = ACH.filter(a => A.ach[a.id]).length; h += `<div class="card"><div class="eyebrow">Başarımlar · ${got}/${ACH.length}</div>${ACH.map(a => `<div class="ach ${A.ach[a.id] ? 'on' : ''}"><span>${A.ach[a.id] ? '🏆' : '🔒'}</span><div><b>${a.n}</b><span class="m">${a.d}</span></div><em>🪙${a.t}</em></div>`).join('')}</div>`; }
  return h;
}

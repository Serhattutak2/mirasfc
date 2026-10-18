/* ============================================================
   MİRAS FC — ÖĞRETİCİ ve YAPIMCI BİLGİSİ (v3.6)
   - İlk açılışta adım adım öğretici (istenirse "Öğreticiyi geç").
   - Menüden her zaman yeniden açılır.
   - İlk maç pozisyonunda kısa kontrol rehberi.
   - Yapımcı: Serhat Tutak · Sardur Technologies
   ============================================================ */
const CREDIT = { maker: 'Serhat Tutak', studio: 'Sardur Technologies', year: 2026, ver: '3.6' };
const TUT = [
  { e: '⚽', t: 'Miras FC’ye hoş geldin', b: ['Bu oyun bir futbolcunun doğumundan son düdüğe kadar bütün hayatı.', 'Kararların kariyerini, aileni, servetini ve geride bırakacağın mirası belirler.', 'Bu öğretici her şeyi adım adım anlatır. İstersen aşağıdan geçebilirsin; menüden her zaman yeniden açılır.'] },
  { e: '🧒', t: '1 · Karakterini oluştur', b: ['Ad soyad yazmak zorunlu. Doğduğun ve büyüdüğün ülkeyi, şehrini, mevkini, oyun tarzını ve ayağını seç.', 'Ailenin durumu (yoksul, orta halli, varlıklı) hikâyeni değiştirir: yoksulluk hırs verir, varlık iyi akademilere kapı açar.', 'Çocukluk hayalini gerçekleştirirsen Miras Puanın büyük bonus kazanır.'] },
  { e: '📖', t: '2 · Çocukluk ve dönüm noktaları', b: ['Her yıl “Bir yıl yaşa” ile ilerlersin. Hikâye ülkene ve ailene göre farklı yazılır.', '5, 9, 12 ve 15 yaşında büyük kararlar (dönüm noktaları) gelir. Seçenek altındaki açıklama neyin değişeceğini söyler.', 'Ara olaylarda verdiğin cevaplar karakterini (hırs, sadakat, aile, para) şekillendirir.'] },
  { e: '✍️', t: '3 · İlk sözleşme', b: ['16 yaşında kulüpler teklif yapar. Rol (as, rotasyon, yedek), maaş ve süreye bak.', 'Pazarlık masasında maaşı, imza parasını ve maddeleri artırabilirsin; çok zorlarsan kulüp çekilir.', 'Sonra forma numaranı seçersin.'] },
  { e: '⚡', t: '4 · Haftalık enerji', b: ['Her hafta enerjin var. Antrenman, dinlenme, medya ve aile eylemleri enerji harcar.', 'Antrenman özelliklerini geliştirir, dinlenme sakatlık riskini azaltır, takımla ek idman UYUMU artırır.', 'Haftayı bitirince maç oynanır; form, moral ve kondisyon maç notunu etkiler.'] },
  { e: '🏟️', t: '5 · Maç: kritik anlar', b: ['Maç kendiliğinden akar; sen sadece kritik anlarda oynarsın.', 'Hücum, oyun kurma, kontra, birebir, kafa, serbest vuruş, penaltı ve savunma anları gelir.', 'Maç ekranında “Oyun tarzı” (savunma / dengeli / hücum) hangi anların geleceğini ve kondisyonunu etkiler.'] },
  { e: '🏹', t: '6 · Pas ve şut: oku çek', b: ['Top sende olunca oyun durur. Parmağını sahaya koy ve ÇEK: oyuncundan bir ok uzar.', 'Okun UCU topun gideceği yerdir. Az çekersen yumuşak ve kısa, çok çekersen sert ve uzun gider.', 'Arkadaşının ÖNÜNE atabilirsin; oraya en çabuk yetişen arkadaşın koşar. Ok kaleye uzanırsa şut olur.', 'Kısa çekersen topla sürersin. Arkadaşına ya da kaleye dokunmak da hızlı pas/şut yapar.'] },
  { e: '🎯', t: '7 · Topa bas: yükseklik ve falso', b: ['Vuruşta ekranda büyük bir top uçar; ona bas.', 'ORTASI: sert ve isabetli, yerden gider. ALTI: havalanır (ne kadar alttan, o kadar yüksek). YANI: falso.', 'Kaleci öndeyken topun altına basarsan aşırtma yaparsın. Iskalasan da top gider, ama zayıf.'] },
  { e: '⚠️', t: '8 · Riskleri oku', b: ['Ok çekerken pası kesebilecek rakiplerin üstünde ⚠️ çıkar; ok turuncuya döner.', 'Sarı kesikli çizgi ofsayt çizgisidir. Pas anında arkadaşın çizginin önündeyse 🚩 ofsayt olur.', 'Sert ya da havadan gelen topu arkadaşın kontrol edemeyebilir; boşta kalan topa kim yakınsa o alır.', 'Kaleci çelerse dönen top için şansın sürebilir.'] },
  { e: '🏃', t: '9 · Arkadaşlarına koşu göster', b: ['Takım uyumun yüksekse bir arkadaşına dokunup sürükle: mavi okla koşacağı yeri gösterirsin.', 'Uyum %40 → 1, %70 → 2, %90 → 3 koşu hakkı (sol üstte 🏃).', 'Uyumu “Takım arkadaşlarıyla ek idman” ve maç oynayarak artırırsın.'] },
  { e: '🛡️', t: '10 · Savunma', b: ['Rakip pas atacakken kırmızı kesikli çizgi pas yolunu gösterir.', 'Oyuncunu pas yoluna SÜRÜKLE ya da yola dokun; yeşil “BURAYA KOŞ” halkası en iyi noktadır.', 'Rakip topla üstüne sürerse önüne çık: önden müdahale daha başarılıdır. Topu kazanınca saha döner, atağa çıkarsın.'] },
  { e: '💰', t: '11 · Para ve yaşam', b: ['Finans sekmesinde ev, araç, kişisel ekip, yatırım, emlak ve şirketlerini yönetirsin.', 'Giderler gelirinle büyür; kötü yatırım seni batırabilir.', 'Servetin yeterince büyürse kulüp satın alabilir, bir kulüp grubu kurabilirsin.'] },
  { e: '👔', t: '12 · Futboldan sonra', b: ['Emekli olunca teknik direktör olabilir, kulüp sahibi olabilir ya da işe girebilirsin.', 'Teknik direktörken maç planı, antrenman, transfer ve canlı maç yönetimi senin elinde.', 'Kulüp sahibiyken genel müdür atayıp otopilotu açabilirsin.'] },
  { e: '🌳', t: '13 · Miras', b: ['Hayatın bitince mirası oğluna devredersin ve onunla devam edersin.', 'Kurucudan oğluna ilk devir ücretsizdir; sonraki kuşaklar için o kayda özel Miras Paketi gerekir.', 'Miras Puanın futbol, insan ve servet mirasından oluşur.'] },
  { e: '🪙', t: '14 · Jeton ve mağaza', b: ['Miras Jetonu ile kararı geri alabilir, enerji ve tedavi alabilir, görünüm değiştirebilirsin.', 'Günlük giriş, başarımlar ve reklam izleyerek az miktarda jeton kazanırsın.', 'Oyunu kazanmak için para gerekmez; jeton sadece zaman ve kolaylık sağlar.'] },
  { e: '🚀', t: 'Hazırsın!', b: ['Menüden boş bir kayda dokunarak yeni bir hayata başla.', 'Bu öğreticiyi menüdeki “📘 Öğretici” düğmesiyle istediğin zaman tekrar açabilirsin.', `${CREDIT.studio} · Yapımcı: ${CREDIT.maker}`] },
];
let TUTI = 0;
function tutOpen(i) {
  TUTI = i || 0; let el = document.getElementById('tut');
  if (!el) { el = document.createElement('div'); el.id = 'tut'; el.className = 'tut'; document.body.appendChild(el); }
  tutDraw();
}
function tutDraw() {
  const el = document.getElementById('tut'); if (!el) return; const s = TUT[TUTI], last = TUTI === TUT.length - 1;
  el.hidden = false;
  el.innerHTML = `<div class="tutc card"><div class="tutt"><span class="eyebrow">Öğretici · ${TUTI + 1}/${TUT.length}</span><button class="lnk" onclick="tutEnd(1)">Öğreticiyi geç ✕</button></div>
  <div class="tute">${s.e}</div><h2>${esc(s.t)}</h2><ul class="tutb">${s.b.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  <div class="tutd">${TUT.map((_, i) => `<i class="${i === TUTI ? 'on' : i < TUTI ? 'done' : ''}"></i>`).join('')}</div>
  <div class="actions">${TUTI ? '<button class="btn ghost" onclick="TUTI--;tutDraw()">← Geri</button>' : ''}<button class="btn big" style="flex:1" onclick="${last ? 'tutEnd(0)' : 'TUTI++;tutDraw()'}">${last ? 'Başla ⚽' : 'İleri →'}</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
function tutEnd(skipped) { const el = document.getElementById('tut'); if (el) el.hidden = true; const A = acct(); A.tutDone = 1; acctSave(); if (skipped) toast('Öğreticiyi menüden tekrar açabilirsin'); }
/* yapımcı bilgisi */
function aboutOpen() {
  let el = document.getElementById('tut'); if (!el) { el = document.createElement('div'); el.id = 'tut'; el.className = 'tut'; document.body.appendChild(el); }
  el.hidden = false;
  el.innerHTML = `<div class="tutc card" style="text-align:center"><div class="crest" style="margin:0 auto 8px">M</div><h2>Miras FC</h2><div class="m" data-notr>A FOOTBALL LIFE · v${CREDIT.ver}</div>
  <div class="eyebrow" style="margin-top:14px">Yapımcı</div><div class="h3" data-notr>${CREDIT.maker}</div>
  <div class="eyebrow" style="margin-top:8px">Geliştirici stüdyo</div><div class="h3" data-notr>${CREDIT.studio}</div>
  <p class="m" style="margin-top:12px">Kulüp ve oyuncu isimleri gerçeğe benzetilmiş kurgudur.</p><p class="m" data-notr>© ${CREDIT.year} ${CREDIT.studio}</p>
  <div class="actions" style="justify-content:center"><button class="btn" onclick="document.getElementById('tut').hidden=true">Kapat</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}
/* menüye düğmeler, imza ve ilk açılışta öğretici */
const _menuTut = menu;
menu = function () {
  _menuTut();
  try {
    const app = document.getElementById('app'), w = app && app.querySelector('.wrap'); if (!w) return;
    const bar = document.createElement('div'); bar.className = 'actions'; bar.style.justifyContent = 'center';
    bar.innerHTML = `<button class="btn ghost" onclick="tutOpen(0)">📘 Öğretici</button><button class="btn ghost" onclick="aboutOpen()">ℹ️ Hakkında</button>`;
    const foot = w.querySelector('.foot'); if (foot) { foot.innerHTML = `v${CREDIT.ver} · ${T('Yapımcı')}: <b data-notr>${CREDIT.maker}</b> · <span data-notr>${CREDIT.studio}</span><br>Kulüp ve oyuncu isimleri gerçeğe benzetilmiş kurgudur.`; w.insertBefore(bar, foot); } else w.appendChild(bar);
    const hero = w.querySelector('.hero'); if (hero && !hero.querySelector('.studio')) { const st = document.createElement('div'); st.className = 'studio'; st.setAttribute('data-notr', ''); st.textContent = `${CREDIT.studio.toUpperCase()} PRESENTS`; hero.insertBefore(st, hero.firstChild); }
    if (typeof i18nApply === 'function') i18nApply(w);
  } catch (e) { }
  if (!acct().tutDone) tutOpen(0);
};
/* ilk maç anında kısa kontrol rehberi */
const TUTM = ['🏹 Parmağını sahaya koy ve ÇEK: okun ucu topun gideceği yer.', '📏 Az çek = yumuşak · çok çek = sert.', '👟 Arkadaşının önüne atabilirsin · ⚽ kaleye uzanırsa şut.', '🎯 Topa bas: ortası yerden, altı havadan, yanı falso.', '⚠️ Kesilebilecek pasları gösterir · 🚩 sarı çizgi ofsayt.'];
const _sceneStartTut = sceneStart;
sceneStart = function () {
  _sceneStartTut(); const A = acct();
  if (S && S.mode === 'atk' && !A.tutMatch) {
    A.tutMatch = 1; acctSave();
    let el = document.getElementById('tut'); if (!el) { el = document.createElement('div'); el.id = 'tut'; el.className = 'tut'; document.body.appendChild(el); }
    el.hidden = false;
    el.innerHTML = `<div class="tutc card"><div class="tute">🏟️</div><h2>İlk pozisyonun!</h2><ul class="tutb">${TUTM.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="actions"><button class="btn big" style="flex:1" onclick="document.getElementById('tut').hidden=true">Anladım, oynayalım</button></div></div>`;
    if (typeof i18nApply === 'function') i18nApply(el);
  }
};

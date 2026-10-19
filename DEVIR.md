# Miras FC: A Football Life — Devir Notu (v4.0)

Bu dosya, projeyi başka bir yapay zekâ ya da geliştiriciyle devam ettirmek için yazıldı. Oyun tek dosyalık bir HTML (`index.html`); kaynak `src/` altında modüler, derleme `python3 tools/build.py`. Oyun Türkçe yazılır, İngilizce bir çeviri katmanıyla gösterilir.

## Altın kurallar
1. `g` (oyun durumu) **JSON olarak kaydedilir**. İçine asla fonksiyon koyma. Olaylar `{id, x, t}` olarak durur; seçenekleri `EVMAP[id]` / `MS` / `MS15` tablolarından bulunur. Test botu, kayıtta fonksiyon bulursa hata verir.
2. Onay için `ask()` / `askText()` kullan; `confirm/alert` artifact'ta çalışmaz. Bir buton bir şey yapamıyorsa `toast()` ile nedenini söyle.
3. Kod içindeki metinler **Türkçe** yazılır. İngilizce karşılığı `i18n/en*.txt` dosyalarına eklenir (aşağıya bak).

Kayıt anahtarları: oyun `mfc2_<slot>`, hesap (jeton, dil, başarımlar, bilet, tema) `mfc_acct`.

## Dosyalar ve derleme sırası
`en → i18n → data → core → squad → events → events2 → life → stories → career → nego → engine → engine5 → engine6 → engine7 → engine8 → engine9 → engine11 → match → finance → owner → coach → coach2 → coach3 → owner2 → legacy → shop → ui → emoji → tutorial → voxdata → engine10 → hall → kariyer2 → coach4 → coach5 → ads → iap → awards → packs2 → justice → story2` (tam liste: `tools/build.py`)

Sonra gelen dosya öncekindeki aynı adlı fonksiyonu ezer; `coach3.js` ve `owner2.js` çoğunlukla `const _f = f; f = function(){…}` sarmalayıcılarıyla eski davranışın üstüne kurar.

| Dosya | İçerik |
|---|---|
| `en.js` | **Otomatik üretilir** (`tools/i18n_build.py`, derlemede kendiliğinden çalışır). Elle düzenleme. |
| `i18n.js` | Dil katmanı: `LANG`, `setLang`, `initLang` (telefon dilini algılar), `T()/tr1()` çevirici, `i18nApply` ve İngilizcede her yeni çizilen düğümü çeviren `MutationObserver` |
| `data.js` | 18 ülke (lig kademeleri, vergi, veraset, kıta), gerçek kulüpler, `STARS`, isim havuzları, milli takımlar |
| `core.js` | yardımcılar, isim değiştirme (`altWord/alter/clubName`), dünya üretimi, zengin yatırımcı kotası `RICHQ`, takvim, hava, sezon kapanışı |
| `squad.js` | kalıcı kadrolar `g.sq`, diziliş, `bestXI`, altyapı, pazar |
| `events.js` / `events2.js` | hikâye ağacı (çocukluk dönüm noktaları ve yaklaşık 150 olay), çocuklarla sohbet (`KCHAT`), menajer görüşmeleri (`AGMEET`) |
| `stories.js` | **Hikâye çeşitliliği:** bölgeye (`REGION`), aile ekonomisine ve şansa göre yıllık anlatı satırları (`FLAV`, tekrar etmez), dönüm noktalarının farklı sürümleri (`MSV`, `q.v`), yeni 15 yaş senaryoları ve ülkeye/ekonomiye özel çocukluk olayları (`CH_EV3`). |
| `life.js` | aile, arkadaşlar, ilişkiler, işler, yaşayan rakip |
| `career.js` | teklifler, imza, kiralık, haftalık enerji eylemleri (`ACTS`) ve özel yetenekler, hafta döngüsü, sezon sonu, milli turnuva |
| `nego.js` | pazarlık masası (renk ipucu yok, sportif direktörün sözleri) |
| `engine5.js` | **Maç motoru v5 "Çiz ve oyna" (asıl oynanış).** `engine.js`'ten sonra yüklenir; `mkScene`'i sarar, `step`, `drawScene`, `bindInput`, `ctlHTML`, `botMove`, `camWant` fonksiyonlarını ezer. Topu kim taşıyorsa ondan yol çizilir (`v5Down/Move/Up`): arkadaşta biterse pas, kalede şut, boşlukta sürme. `pDanger` rakiplerin keseceği yerleri kırmızı yakar; sonuç `doPath` anında belirlenir, `runTick` canlandırır. `shotResult` isabet + kaleci; `nextDraw` savunmayı ve koşuları yeniden dizer. `bestPath` hem ⚡ Otomatik hamle düğmesi hem test botu. Emojili olay yazıları, konfeti, ekran sarsıntısı. v3.1: şut ve kendi paslarında "topa bas" ekranı (`tapBall`, q 0..1 isabet, kolay), yumuşak fizik (yerden pas yavaşlar, havadan pas seker, gol ağı, kaleciden seken top `freeTick`), boşluğa dokunma = kısa sürüş. v3.2: **çubukla nişan** (`stickEval`: hedefe doğru çek, çubuk uzar; uzunluk = güç; arkadaşa uzanırsa pas, kaleye şut, kısa ise sürme, boşluğa ara pas), topa basmada kenara uzaklık = falso/yükseklik miktarı, kavisli yol (`launchPath`), güzel top çizimi (`drawFancyBall`), araya girmede önerilen nokta (`icBest`). Başlangıçta isim zorunlu. |
| `tutorial.js` | İlk açılışta 16 adımlı öğretici (`TUT`, `tutOpen`, "Öğreticiyi geç"), menüde 📘 Öğretici ve ℹ️ Hakkında, ilk maç anında kontrol rehberi. Yapımcı: Serhat Tutak · Sardur Technologies (`CREDIT`). |
| `hall.js` | **Miras Salonu ve Miras Kartı (v3.9, engine10'dan sonra en son yüklenir):** biten her hayat (son düdük ya da mirası devretme) `hallRecord` ile hesaba yazılır (`mfc_acct.hall`, en fazla 60; en yeni 10 hep kalır). Kayıt silinse bile Salon'da durur. Menüde Salon kartı, `scr='hall'` ekranı (rekorlar, sıralama, hikâye), `cardCanvas` ile 1080×1350 paylaşılabilir PNG kart (forma renkleri, Miras Puanı, üç miras çubuğu, istatistikler, öne çıkanlar); `navigator.share` yoksa indirme / uzun basıp kaydetme. `inherit`, `endUI`, `legUI`, `drawInner`, `menu` sarmalanır. Test botu her biten hayatta özetin sayı/fonksiyon temizliğini ve Salon ekranını denetler. |
| `iap.js` | **Gerçek ödeme:** `@capgo/native-purchases` (StoreKit). `SKU` tablosu App Store Connect ürün kimlikleriyle aynı olmalı. Tarayıcıda satın alma yok (ücretsiz deneme kaldırıldı). Miras Paketi her yoldan (`heirBuy`, `inherit`, `handOver`) ödeme ister. |
| `awards.js` | **Ödül Gecesi:** sezon sonunda aday olunan kategorilerde animasyonlu tören (`AWC`, `awOpen`), kazanırsan konuşma seçimi (`SPEECH`), kaybedersen ✗; ömürlük rakip aday olabilir. |
| `packs2.js` | **Hikâye paketleri 2.0:** bölümler ve günlük (`PK2`, `pkJournal`), satın alınca içerik ekranı (`pkShow`), yeni olaylar (`PACK_EV2`), tamamlama ödülleri (Dünya Vatandaşı, Temiz Sayfa/Kötü Çocuk, Kulüp Babası). |
| `justice.js` | **Suç ve ceza:** `sin()` dosya açar, `expose()` duruşma (`durusma`: avukat/itiraf/inkâr), `imprison()` hapis (`g.jail`, sözleşme feshi), men (`g.ban`), zaman aşımı 6 yıl, çıkış olayı. |
| `story2.js` | Memleket/altyapı kulübü çağrısı (transfer döneminde düşük maaşlı teklif, söz verme), karakter oluştururken şehir listesi ve tuttuğun takım seçimi en üstte. Mirasçı mevki uyumu `kariyer2.js` (`heirSetup`). |
| `engine11.js` | **Gerçek savunma ve kaleci (v3.9):** `KEEP` kaleci parametreleri (erişim mesafeyle artar, köşeler kurtarılabilir, dar açı zor; engine5 `shotResult` bunları okur), nişan alırken canlı baskı (en yakın savunmacı üstüne gelir, ikincisi pas yolunu kapar: `DEF11`), adam adama takip (`planMoves` sarmalayıcı), topu kapan rakip kontraya sürer. Aşırtma zorlaştı (engine8). |
| `voxdata.js` | **Otomatik üretilir:** spiker replikleri (TR: Piper fahrettin, EN: Piper alan; açık kaynak sinir ağı sesleri, sherpa-onnx ile üretildi, yayın efekti ffmpeg), mp3 base64. Üretici betik: oturum notlarında `tts/gen.py`; kategori anahtarları `say()` anahtarlarıyla aynı. |
| `kariyer2.js` | **Kariyer gerçekçiliği (v3.9):** parametreler `career.js` → `GROW` (tesis çarpanı, maç xp'si, yedek kalınca gerileme, sakatlık kademeleri hafif/orta/3-5 ay/~1 yıl, dönüşte maç ritmi `g.rust`, nadir patlama/geç çıkış). Teknik direktörlükte Enerji'de oyunculuk işleri gizlenir, `co_*` işleri gelir. Pazarlıkta anlaşamayınca 🪙 ile yeniden teklif (`negoRetryTok`, `offerRevive`, `cnegoRetryTok`, transferde haftalık sınır). |
| `coach4.js` | **Teknik direktör merkezi:** kulüp panosu `cHero` (sıra, puan, galibiyet %, son 5, 4 gösterge halkası, hoca unvanı), taktik tahtası `pitchSVG`, oyuncu kartı `cPl`, basın toplantısı `PRESS4`/`cPress`, maç önü konuşma `PRE`, canlı maç istatistikleri `lmViz`, gelişim raporu `devCard` (`p.r0`). |
| `coach5.js` | **Enerji ve puan:** oyuncu enerjisi `p.en` (maçta düşer, dinlenince toparlanır; bestXI `enPen` ile yorgunları geri iter; takım gücünü ve sakatlık riskini etkiler `EN11`), maç puanı `p.rt/p.rn/p.lr`, kadroda enerji tablosu, tahtada enerji halkası ve numara. **Maçı izle:** canlı maçta her 15 dk `#lmcv` tuvalinde numaralı oyuncularla canlanır (`LMV`, `lmvLoop`). |
| `ads.js` | Reklam sıklığı (`ADCFG.everyWeeks` = 10 hafta + her sezon sonu) ve **AdMob köprüsü** (`@capacitor-community/admob`, şu an Google TEST kimlikleri; gerçek kimlikler gelince `ADCFG` ve Info.plist `GADApplicationIdentifier` değişir). |
| `engine10.js` | **Stadyum (v3.8, en son yüklenir):** iOS ses kilidi (`audioUnlock`: touchend/click'te AudioContext açılır, `navigator.audioSession.type='playback'` ile sessiz modda da çalar), konuşan spiker (`speak`, `voxVoice`: cihazın konuşma motoru, `LANG`'a göre tr-TR / en-GB; `say` sarmalanır, `VPRI` öncelik), **Ayarlar** (`setOpen`, `acct().set`: sfx, crowd, voice, text, vol, cel, rp; menüde ve maç panelinde ⚙️), gol sevinci (`s.cel`: kamera zumu `s.zm`, golcü köşeye koşar `cheer`, rakipler `sad`, dev GOL yazısı, havai fişek; bitince engine9 tekrarı `s.rpReady` başlar), yeni `drawPl` (büyük ve ayrıntılı: saç modeli/rengi, krampon, forma deseni `HSTR(p.c)`: düz/çubuklu/çizgili/kuşaklı, kaleci eldiveni, kaptan pazubandı), stadyum (`drawStadium`: LED panolar, yan panolar, köşe bayrakları, coşkuya `s.hype` göre zıplayan taraftarlar, golde meşale ve flaş), ritmik alkış, maç başı/sonu düdük ve spiker. |
| `engine9.js` | **Canlı maç (v3.7):** WebAudio ile dosyasız stadyum sesi (`sfx`: vuruş, düdük, ağ, direk, ooo, gol kükremesi; `crowdLvl` tribün uğultusu kaleye yaklaştıkça artar; `sndToggle` + `localStorage mfc_snd`), canlı spiker (`COM`, `say`; `flash` olay yazısından beslenir), gol tekrarı (`s.fr` kare kaydı, `s.rp` ağır çekim, dokununca geçer), kaleci plonjonu (`p.dive`) ve bire birde çıkış (`gkPlace` sarmalayıcı, açıyı daraltır), yeni `drawPl` (hıza göre adım, kol, eğilme, sırtta numara, kayarak müdahale `p.slide`), dönen top `drawBall`, yorgunluk (`fatigue`: 55. dakikadan sonra kondisyona göre hızlar, topa basma süresi; 🔋 göstergesi), hava (yağmur: top hızlı + ilk dokunuş zor, kar: yavaş, rüzgâr havadan pası sürükler). Hızlar her sahnede `V9.base`ten yeniden kurulur. |
| `engine8.js` | **Gerçekçi ayrıntılar (v3.5):** ilk dokunuş (sert/havadan top açılabilir), sahipsiz top yarışı (`looseBall`), kaleciden dönen top, aşırtma (topun altına bas, kaleci öndeyse), sürüşte faul (penaltı / serbest vuruş / oyun devam). |
| `engine7.js` | **Ok nereyi gösterirse (v3.4):** okun ucu topun gideceği nokta (`stickEval`), uzunluk = sertlik; pas boşluğa/arkadaşın önüne atılır, oraya en çabuk yetişen arkadaş koşar (`bestRec`), geç kalırsa top orada bekler; top havadan mı yerden mi topa basılan yerden (`launchPath`: alttan = havalı, yükseklik basış derinliğine göre); takım uyumuna göre arkadaşa koşu komutu (`runCmds`, arkadaşa dokunup sürükle). |
| `engine6.js` | **Yaşayan saha (v3.3):** top her karede sahibinin ayağında, koşu yönüne göre (`attach`, `trackDirs`); pas/sürüş anında arkadaşlar boş alana, savunma topun gideceği yere aynı anda hareket eder (`planMoves`); kesilme zamana göre hesaplanır (`pDanger`: rakip topun geçtiği noktaya zamanında yetişebiliyor mu); ofsayt (`offLine`, `isOff`, sahada kesikli çizgi); savunmada rakip topla da sürebilir, topu kazanınca saha 180° döner ve aynı yerden atak başlar (`winBall`). |
| `emoji.js` | Şirket, mülk, ev, araç, yatırım, ekip, tesis ve iş adlarının yanına emoji (`data-emo` + CSS; metne dokunmaz). |
| `engine.js` | **Maç motoru v4 — gerçek top fiziği, 3B yayın kamerası** (`P3` izdüşüm, `unprojG/unprojY` ekran→dünya, `camFit` topu altta kaleyi üstte tutar; tribün, ağ, gölge, oyuncu figürleri). Oyuncuya yüzde gösterilmez (`PV()` yalnız test botunda hesaplar). **v2.6 New Star Soccer kontrolleri:** top sendeyken oyun durur; sapan gibi geri çek-bırak (`swipeParams`) yön+güç verir; ardından vuruş noktası mini oyunu (`startContact`/`contactHit`: yuvarlanan topun üstü = alçak, altı = havalı, yanı = falso, zamanlama = güç, ıskalama = bozuk vuruş). Savunma: rakip pası yavaş akar, oyuncunu pas yoluna sürükleyip kesersin (`icptStart`/`icptTick`, hız = pace). Serbest vuruşta rüzgâr göstergesi. **v2.7 NSS zinciri:** pas kesme → orta saha pası (uzunluğa göre pas puanı `passRate`) → çalım koşusu (`mkDrib`/`drunTick`, sağa/sola dokun) → hücum (`chainScene`). Vizyon (pas) kaç arkadaşın görüneceğini belirler; nişan alırken en yakın rakip üstüne gelir (`liveTick`). Maç ekranında oyun tarzı (`g.wr`: savunma/dengeli/hücum) pozisyon türlerini ve kondisyonu etkiler. Top sendeyken oyun durur; kaydırma = yön, uzunluk = güç, eğrilik = falso, "Havadan" düğmesi = yükseklik. Yerçekimi, hava direnci, Magnus (falso), sekme, yuvarlanma, direk/üst direk, rüzgâr (`physStep`). Rakipler topun yoluna koşar ve kesmeye çalışır; kaleci tepki süresi + dalış hızı + erişimle kurtarır, çelerse dönen top oyunda kalır (`flySub`). Kafa: orta gerçek yörüngeyle gelir, top başa yaklaşınca ağır çekim (`hwin`). Dokunarak oynayana yardımlı düğmeler (`passKick`, `shotKick`, `fkKick`, `crossKick`); yüzdeler aynı fizikle Monte Carlo (`simKick`). Rakip gücü `S.df` kaleciyi, savunmayı, baskıyı büyütür. Savunma sahnesi zamanlama göstergesiyle (`fireTackle`). |
| `match.js` | maç akışı, hızlı sonuç, tablolar |
| `finance.js` | ev, araç, ekip, giderler (gelire bağlı), yatırım, şirket, sponsor, hesap hareketleri |
| `owner.js` | kulüp sahipliği (gelir modeli: maaş bütçesinden türetilir, `clubRev`, `clubPrice`) |
| `owner2.js` | **kulüp grubu** (5 kulübe kadar, `allOwn/switchOwn`), genel müdür ve otopilot vizyonları (`ceoHire`, `ceoRun`), sahip masası olayları (`OWN_EV`), tesisler (`FAC`), kredi, FFP, kulüpler arası oyuncu transferi (`grpMove`), yeni `ownUI` |
| `coach.js` / `coach2.js` | teknik direktörlük: lisans, hedefler, soyunma odası, taktik alışkanlığı, ültimatom; itibar ve dünya sıralaması, seni izleyen kulüpler, boş koltuklara başvuru, antrenör menajeri, kulüp gelirleri, yönetim kurulu toplantıları |
| `coach3.js` | **derin teknik direktörlük:** rakip stilleri ve maç planı, gözlemci raporu, haftalık antrenman programı ve taktik uyumu, oyuncu kişilikleri ve birebir konuşmalar (söz verme, kaptanlık), yönetim felsefesi, transfer pazarlığı ve kiralık, **canlı maç yönetimi** (devre devre bağırma, taktik, oyuncu değişikliği; `lm*`), milli takım hocalığı (`ntj*`), ödül dolabı |
| `coach6.js` | **v4.1 TD 6:** ayrı **İtibar** sekmesi (`repCard`: halka, unvan merdiveni, dünya sıralamasında komşular, sezon grafiği `g.crepH`, hareket günlüğü `g.crepL`/`repSync`, kapılar, kariyer istatistikleri `g.cst`); **Taktik** ekranı (`tak6`: hazır taktikler `TPRE`, mini diziliş, sahada hat/yön, talimatlar tempo/genişlik/pas `plan6`, analiz `tacAnalysis`, etkisi `tacFx` → `cmMods`); **canlı maç otomatik akar** (`LM.auto`, `LM.clk`, hız `LSPD`): 22 nokta sürekli hareket (`lsMove`), pas/araya girme/top kapma/şut/korner/aut (`lsDecide`, `lsPass`, `lsShoot`, `lsArrive`), goller `LM.ev` dakikasında senaryolu atakla (`S6.scr`, saat goli bekler), 15 dk'lık sonuç simülasyonu arka planda (`lsSegRun` → eski `lmSeg`), devre arası duraklar, sakatlıkta oyun durur. **v4.1.1:** hız düğmesi tüm simülasyonu hızlandırır (`LSPD`); kariyer tavanı `cCap`/`cAllowed` (kovulduysan eski kulübün gücü −12…+3, aksi halde son işin başarısına göre +2…+10), unvan eşikleri 20/42/66/88. |
| `engine14.js` | **v4.2:** koşu oku topu alınca söner, koşucu oku depar hızında takip eder; uzun topta pası atan peşinden koşmaz, rakipte yalnızca yetişebilecek en yakın oyuncu topa gider (engine12); kaleci kurtarışta top eldivende durur, kaleci topla aynı anda varır ve plonjon yapar, çelinen top dışarı/ileri seker; zorluk takım gücü farkına göre (`df = 1 + fark/24`, eşitte normal). |
| `sound42.js` + `crowddata.js` | **v4.2:** tribün sesi beyaz gürültü yerine sentez insan seslerinden (döngü, gol kükremesi, ooo, hayal kırıklığı; üretici `tools/vox/crowd.py`); tüm sesler yalnızca maç ekranında (menü/ödül töreni sessiz); reklam takvimde her 10 haftayı geçince (toplu ilerletmede de, `g.adAbs`). |
| `engine13.js` | **v4.1.1:** ok bir arkadaşın ayağına uzanmıyorsa 16 m'ye kadar topu önüne alıp SEN sürersin (`V13.longDrib`); pası atan oyuncu ileri koşar (ver-kaç). |
| `engine12.js` | **v4.1:** boşluğa atılan pasa en yakın rakip koşar (`chaseTo`), ikinci adam kale tarafını kapatır, boştaki topa her takımdan ikişer oyuncu. |
| `rules41.js` | **v4.1:** cezaevi/men/ağır sakatlıkta teklif yok (`offBlock`), ~1 yıllık sakatlıkta kulüp feshi; kiralıkken fesih olursa sezon sonu dönüş yok. |
| `voice2.js` | **v4.1:** cihaz TTS'i tamamen kapalı; yalnızca `voxdata.js` erkek spiker klipleri, sadece maç ekranında (`inMatch`, `vxPlay`). Türkçe oyunda spiker YOK (kullanıcı isteği), yalnızca tribün sesi pozisyonlara tepki verir; İngilizce spiker var. Klip üretici v4.2: `tools/vox/gen2.py` (voxdata.js'e yalnız `en` konur) (TR: Piper tr_TR-fahrettin; EN: Kokoro v0.19 bm_lewis İngiliz erkek yorumcu; ayrı replikler; FFT gürültü azaltma + kapı ile cızırtısız, heyecanlı anlarda formant korunarak perde yükselir). |
| `legacy.js` | Miras puanı, defter, soy ağacı (kurucu + son 5 kuşak), devretme |
| `shop.js` | **Jeton, günlük giriş, 30 başarım, Kariyer Bileti, ödüllü/ara reklam, mağaza, abonelik, geri alma, gözlemci raporu, temalar, hikâye paketleri** |
| `ui.js` | bütün ekranlar |

## İngilizce (i18n) nasıl çalışır
- Kodda metin Türkçe kalır. İngilizce modda ekrana basılan her metin `tr1()` ile çevrilir.
- Sözlük: `i18n/en*.txt`, her satır `Türkçe kalıp ⇒ English pattern`. `{0}`, `{1}` yer tutucuları ekrandaki değişken parçaları yakalar; yakalanan parça da ayrıca çevrilir (ülke, kulüp sonrası metin vb.). Sonraki dosya öncekini ezer.
- Tam eşleşme yoksa sırasıyla: kalıplar → ` → ` / ` · ` / `; ` / ` — ` ile parçalama → `etiket: metin` → cümle cümle (en uzun çevrilebilir cümle grubunu seçer).
- Kulüp ve oyuncu isimleri çevrilmez. Para İngilizcede `K€ / M€ / B€`.
- Yeni metin eklediğinde: `python3 tools/i18n_scan.py $PWD/index.html 800 [pro|coach|own]` (tarayıcıda İngilizce rastgele oynar) ve `MFC_EN=eksik.txt node tools/sim.js index.html 8` (bot; ekranda Türkçe kalan metinleri dosyaya yazar). Çıkanları `i18n/` altına yeni bir `enNN.txt` dosyasına ekle.
- Yeni dil eklemek: `i18n/de*.txt` gibi yeni dosyalar + `i18n_build.py` ve `setLang` içine dil kodu.

## Para kazanma (bağlantı noktaları)
`shop.js` içinde iki adaptör var; web sürümünde deneme çalışır, mobil uygulamada (Capacitor) `window.MirasNative` tanımlanınca gerçekleri devreye girer:
- `AD.rewarded(kind, cb)` → `MirasNative.showRewarded(kind, ok => …)` (AdMob / AppLovin MAX). `kind`: `tok`, `energy`, `inj`, `nego`, `retry`, `daily`, `season`.
- `AD.inter()` → `MirasNative.showInterstitial()`; en az 3 dakikada bir, abonelere hiç.
- `IAP.buy(id, cb)` → `MirasNative.purchase(id, ok => …)`. Ürün kimlikleri: `tok100, tok550, tok1200, tok2500, gold, sub`.
- Gerçek satışta jeton bakiyesi sunucuda doğrulanmalı (App Store / Google Play makbuzu). Şu an bakiye cihazda (`mfc_acct`).

## Test araçları
- `node tools/sim.js index.html 30` — başsız bot 30 hayat oynar; hata, NaN ve kayıtta fonksiyon arar.
- `python3 tools/monkey.py $PWD/index.html 1500 [pro|coach|own]` — gerçek tarayıcıda rastgele tıklama.
- `python3 tools/i18n_scan.py …` ve `MFC_EN=… node tools/sim.js …` — İngilizce kapsama.

## Maç motoru ayarı
- Sabitler `PH` (yerçekimi, sürtünme, Magnus, ağır çekim). Zorluk `S.df = cl(1.06 + güçFarkı/28, .78, 1.5)`.
- Ayar betiği mantığı: belirli sahne tipini yüzlerce kez akıllı botla oynat (`BOTSMART=1`, `botMove`). v4 hedefleri (eşit güç, 70 genel): hücum ~%13–17, birebir ~%40–45, kafa ~%25–33, penaltı ~%75, serbest vuruş ~%20–30, kontra ~%15. Güçlü rakipte belirgin düşer, yetenek yükseldikçe artar.
- Milli takım: birden fazla ülkeye uygunsan oyun artık sorar (`NTCHOICE_EV`); karar `g.ntPick`.

## iOS uygulaması
- `mobile/` Capacitor 8 projesi (SPM, CocoaPods yok). `mobile/res/make_icons.py` simge ve açılış ekranını üretir.
- `.github/workflows/ios.yml`: her push'ta macOS'ta derler, **imzasız IPA**'yı `ios-latest` sürümüne yükler (Sideloadly/AltStore ile kurulur).
- Diawi / TestFlight için imzalı IPA: depo ayarlarına `IOS_P12_BASE64`, `IOS_P12_PASSWORD`, `IOS_PROFILE_BASE64` (ad-hoc profil, telefonun UDID'si ekli), `IOS_TEAM_ID` gizli anahtarları eklenince iş akışı `MirasFC-adhoc.ipa` da üretir.
- Uygulama kimliği `com.serhattutak.mirasfc`. Reklam/satın alma için `window.MirasNative` köprüsü henüz yazılmadı (AdMob + StoreKit eklentisi gerekir).

## Miras ve ekonomi kuralları (v2.4)
- Mirası yalnızca oğullar devralır (`heirOK`). Kurucudan oğula ilk devir ücretsiz; sonraki kuşaklar `g.heirPass` (kayıt başına Miras Paketi) ister.
- Satılık kulüpler: bütün varlıklar satılınca ulaşılan tutardan (%99) aşağı 15 basamak (%2,5'e kadar); nakit yetmezse `liquidate` yatırımları, mülkleri, şirketleri satar.
- Tesis fiyatları kulüp gelirine göre ölçeklenir (v2.4'te ~2 katına çıktı); kişisel etkinlik ücretleri maaşla büyür (`actCost`).

## Bilinen sınırlar / sonraki adımlar
- İngilizcede Miras Defteri'nin bazı cümleleri (virgüllü listeler: vitrin, çocukluk kararları) Türkçe kalabiliyor; `tr1` virgülle bölmüyor.
- Test botu İngilizce taramasında (`MFC_EN`) yaklaşık 3000 Türkçe görünen olay metni kalıyor.
- Bazı İngilizce cümlelerde ülke adı sıfat yerine isim olarak geçer ("your Germany citizenship").
- Kadın futbolcu seçimi yok. Ses yok.
- Mağaza sürümü için: Capacitor sarmalayıcı, AdMob, mağaza içi satın alma, sunucu doğrulaması, KVKK/GDPR onayı.

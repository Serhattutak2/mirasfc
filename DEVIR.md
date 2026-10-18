# Miras FC: A Football Life — Devir Notu (v3.8)

Bu dosya, projeyi başka bir yapay zekâ ya da geliştiriciyle devam ettirmek için yazıldı. Oyun tek dosyalık bir HTML (`index.html`); kaynak `src/` altında modüler, derleme `python3 tools/build.py`. Oyun Türkçe yazılır, İngilizce bir çeviri katmanıyla gösterilir.

## Altın kurallar
1. `g` (oyun durumu) **JSON olarak kaydedilir**. İçine asla fonksiyon koyma. Olaylar `{id, x, t}` olarak durur; seçenekleri `EVMAP[id]` / `MS` / `MS15` tablolarından bulunur. Test botu, kayıtta fonksiyon bulursa hata verir.
2. Onay için `ask()` / `askText()` kullan; `confirm/alert` artifact'ta çalışmaz. Bir buton bir şey yapamıyorsa `toast()` ile nedenini söyle.
3. Kod içindeki metinler **Türkçe** yazılır. İngilizce karşılığı `i18n/en*.txt` dosyalarına eklenir (aşağıya bak).

Kayıt anahtarları: oyun `mfc2_<slot>`, hesap (jeton, dil, başarımlar, bilet, tema) `mfc_acct`.

## Dosyalar ve derleme sırası
`en → i18n → data → core → squad → events → events2 → life → career → nego → engine → engine5 → engine6 → engine7 → engine8 → engine9 → match → finance → owner → coach → coach2 → coach3 → owner2 → legacy → shop → ui → emoji → tutorial → engine10`

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
- Bazı İngilizce cümlelerde ülke adı sıfat yerine isim olarak geçer ("your Germany citizenship").
- Kadın futbolcu seçimi yok. Ses yok.
- Mağaza sürümü için: Capacitor sarmalayıcı, AdMob, mağaza içi satın alma, sunucu doğrulaması, KVKK/GDPR onayı.

# Miras FC — Oyun Tasarım Özeti

Doğumdan son düdüğe, gerçekçi ve ciddi tonda bir futbol hayat simülasyonu. Ücretli (tek seferlik), reklamsız, rastgele ödül kutusu yok.

## Ana fikir
"Hayatın bittiğinde geriye ne kalıyor?" Her sistem Miras'a bağlanır:
- **Futbol mirası:** gol, kupa, rekor, kulüp tarihindeki yer.
- **İnsan mirası:** aile, çocuk, dostluk, itibar.
- **Para mirası:** servet, şirket, kulüp, akademi.

Çocuğa geçiş **isteğe bağlı bonus**tur (ana özellik değil).

## Ton ve denge
- Gerçekçi ve ciddi ağırlıklı. Doğru/yanlış cevap yok, bedeli olan seçimler var.
- Hayat anlatısı ile maç anları karışık (yaklaşık yarı yarıya). Oynarken ayarlanacak.
- Çoğu yıl kısa özetle geçer; yılda ortalama 1-2 gerçek karar.

## İlk sürümün kimliği (öncelik)
1. **Değerler sistemi:** Hırs, Sadakat, Aile, Para. Kararlar birini besler, diğerini zayıflatır; olayları etkiler.
2. **Kalıcı izler:** Ciddi sakatlık kalıcı tavan düşürür (örn. diz ameliyatı → hız tavanı). 30'larda mevki değiştirme.
3. **Miras Defteri:** Hayat sonunda olay kayıtlarından şablonla üretilen kısa hayat hikâyesi, paylaşılabilir kart.

## İkinci aşama
- Kulüp ikonu / gezgin dengesi (taraftar sevgisi vs servet).
- Dünya olayları (kulüp iflası, ekonomik kriz, lig küçülmesi, hoca değişimi).
- Yaşayan rakip (akran karakter, yıllarca paralel yol).
- Menajer / mentor karakterleri, basın ve itibar.
- Miras Salonu: biten hayatların sadece özet kartı (kayıtlar bağımsız kalır).
- Beceri anlı maç pozisyonları (zamanlama çubuğu, kaydırma, yön seçimi).

## Sonraya (futbol sonrası)
Teknik direktörlük, kulüp sahipliği, şirketler, nesiller arası devamlılık.

## Kapsam kararları
- v1.0'dan itibaren **kulüp isimleri gerçek kulüplere benzer ama kısaltılmıştır** (G. Saray, F. Bahçe, M. United, R. Madrid…) ve **oyuncu isimleri gerçek oyunculardan isimde bir, soyisimde bir harf değiştirilerek** türetilir (kullanıcı kararı). Tüm isimler `src/data.js` içinde tek yerde; ticari yayın öncesi lisans/hukuki değerlendirme yapılmalı.
- Üç bağımsız kayıt yuvası; silmede onay.
- Kod `src/` altında modüllere ayrıldı; `python3 tools/build.py` hepsini tek dosyalık `index.html`'e birleştirir (mobil tarayıcıda çalışır, sonra iOS'a Capacitor ile sarmalanacak).

## Para modeli
Tek seferlik ücret (hedef 3-5 USD). Reklam yok, pay-to-win yok. Yaş derecesi ilişki/alkol olaylarına göre doğru ayarlanacak.

## Mevcut durum (v0.4)
Çalışan: karakter oluşturma (mevki, yapı, kişilik), yaşlanma, antrenman odağı, 28 hafızalı olay, akademi, kulüp bulma, 3 maç modu, transfer teklifleri + pazarlık, aile/çocuk, yatırım, ev, vergi, milli takım, emeklilik, 3 kayıt.
Değerler (Hırs, Sadakat, Aile, Para), kalıcı sakatlık izleri, mevki değişimi, Miras Puanı ve Miras Defteri.
Görsel maç anı (kanvas saha + zamanlama çubuğu), penaltı anı, zorluk dengesi (~%60-70 profesyonel olur).
Futbol sonrası teknik direktörlük (lisans, taktik, harcama, bütçe, terfi/küme, görevden alınma).
**Yeni (v0.4):**
- Yaşayan dünya: 8 ülke (Türkiye 4, İngiltere 5, Almanya/İspanya/İtalya/Fransa/Brezilya/Arjantin 3 lig seviyesi), her ligde 12 kalıcı özgün kulüp. Her sezon tüm ligler ilerler: terfi/küme düşme (ilk 2 / son 2), takım güçleri sezonlar içinde değişir, şampiyon haberleri.
- Yurtdışı transfer teklifleri, ülke ekonomisine göre maaş, 22 haftalık sezon, "5 hafta simüle et".
- Nesil geçişi: çocuğunla devam, aile serveti ve Miras Puanı ile yeni karakter, soy sayacı; dünya kaldığı yerden devam eder.
- Teknik direktör artık dünyadaki gerçek kulüpleri çalıştırır.

## Mevcut durum (v0.5)
- **Kupalar:** Her sezon sonunda ulusal kupa (5 tur, tek maç, beraberlikte penaltı). Ligi ilk 2'de bitiren 1. lig kulüpleri ertesi sezon kıtasal kupaya katılır: Avrupa Kulüpler Kupası / Güney Amerika Kulüpler Kupası (grup + Son 16'dan finale). Ortak turnuva ekranı: maç maç oyna ya da turnuvayı simüle et.
- **Milli takım turnuvaları:** Takvim yılı eklendi. Genel güç ülke eşiğini geçince her yıl milli maç ve gol birikir. Dünya Kupası (yıl % 4 = 2), Avrupa Şampiyonası / Güney Amerika Kupası (yıl % 4 = 0); eleme şansı milli güce bağlı. 8 oyun ülkesi + 24 gerçek milli takım adı (oyuncu verisi yok). Ülkelerin milli gücü lig ekonomisinden ayrı tutulur.
- **Yaşayan rakip:** Çocuklukta ortaya çıkan yaşıt; kendi gelişimi, kulübü, transferleri, golleri, şampiyonlukları, milli maçları ve emekliliği var. Basın kıyası, derbi, zor gün olayları; ligde rakibin kulübü ⚔ ile işaretli. Karşılaştırma kartı ve Miras Defteri'nde yer alır.
- **Şirketler:** Restoran zinciri, spor giyim markası, gayrimenkul, teknoloji girişimi, futbol akademisi (her türden bir tane, en fazla 4). Yıllık değer dalgalanması, temettü, büyütme/satış, iflas. Rastgele ekonomik krizler şirketleri ve yatırımları vurur. Akademi genç oyuncu yetiştirir (Miras Puanı).
- **Kulüp sahipliği:** Bütçeye uygun kulübü satın al; bütçe politikası (kemer sık / dengeli / büyük yatırım) gücü ve kasayı etkiler, etkisi güç arttıkça azalır. Taraftar bağlılığı, terfi/küme, şampiyonluk ve kupa haberleri, satış.
- **Miras:** Kupalar, milli turnuvalar, sahiplik ve şirket değeri Miras Puanı ve Defteri'ne bağlandı. Nesil geçişinde şirketler ve kulüp çocuğa geçer.
Test: 400 rastgele hayat (her yeni sistem dahil) hatasız, v0.4 kaydı yeni sürümde açılıp devam ediyor, gerçek tarayıcıda 390 px ekran testi (açık/koyu) hatasız. Kayıt boyutu ~24-27 KB.
Eksik: oyuncu bazlı AI dünya (şimdilik kulüp bazlı), ses/efekt, App Store paketlemesi. Denge (v0.5.1): teknik direktörün transfer harcaması ve kulüp sahibinin yatırımı takım gücüne azalan getiriyle eklenir; teknik direktörlük ve sahiplik Miras Puanı'na kök tabanlı ve en fazla 250 puan katar (futbol mirası önde kalır).

## Mevcut durum (v1.0) — büyük yeniden yazım
Ayrıntılı teknik devir notu: [DEVIR.md](DEVIR.md).
- **Çocukluk (0-16):** Her yıl aileye, şehre ve seçimlere göre değişen anlatı; **4 dönüm noktası sorusu** (5, 9, 12, 15 yaş) kalıcı etkiler ve bayraklar bırakır; 14 çocukluk olayı; yaşayan rakip 10 yaşında ortaya çıkar.
- **16 yaşında profesyonel kapı:** 4-10 teklif; her birinde kulüp, lig, ülke, **rol (Genç / Yedek / Rotasyon / As / Yıldız)**, maaş, süre, imza parası, tesis kalitesi, oynama şansı. Pazarlık: maaş, süre, rol garantisi, imza parası.
- **Sözleşme sistemi:** Maaş sözleşme boyunca sabit; bitince serbest kalırsın; yenileme teklifleri; yaz ve devre arası transfer dönemleri; transfer talebi; menajer (yok / yerel %5 / üst düzey %10).
- **Rol ve oynama süresi:** Rol, takımın gücü ile senin genel değerin, formun ve moralin arasındaki farka göre her ay yeniden belirlenir. Yıldız her maç oynar; yedek oyuna sonradan girer ("Yedek başladın, 63. dakikada girdin").
- **Haftalık enerji (100 puan):** 6 antrenman özelliği + dinlenme + aile/özel hayat + iş/ticaret + medya. Özellikler haftalık XP ile gelişir; kondisyon, form, moral, ün haftalık değişir.
- **Karışık fikstür:** 46 haftalık sezonda lig, ulusal kupa (6 tur), Avrupa Şampiyonlar Kupası / Avrupa Ligi (grup + eleme) ve milli maç araları tek takvimde; hepsi oynanabilir.
- **Maç motoru:** Perspektifli 2.5B saha, stadyum, reklam panoları, gerçek isimli (değiştirilmiş) rakipler. Sürükle-bırak ile şut / pas (takım arkadaşına kilitlenir) / çalım; savunmada parmakla yönlendirme + müdahale; kafa (orta zamanlaması), frikik (baraj ve yükseklik), penaltı. Maç başına 4-9 pozisyon.
- **Gerçekçi kulüpler:** 8 ülke, 1. ligler gerçek kadro büyüklüğünde (18-20 takım) ve gerçekçi güçlerle; alt ligler üretilir. Avrupa kontenjanları ülke gücüne göre.
- **Yaşam:** Anne-baba (yaşlanır, vefat eder), kardeşler, partner (tanışma, evlilik, boşanma), **çocuğa isim koyma**, çocuklarla vakit geçirme, ev ve araba seviyeleri, 30+ yetişkin olayı (aşk, soyunma odası, medya, ticaret, hayırseverlik, idolle karşılaşma, rakip).
- **Finans:** Portföy (mevduat, fon, hisse, kripto), emlak (kira + değer artışı), 6 şirket türü (seviye, reklam kampanyası, kâr/zarar, iflas), sponsorluklar (üne göre), gelir vergisi (ülkeye göre), ekonomik krizler, yıllık gelir tablosu.
- **Kulübüm:** Kulüp satın al; para yatır, transfer yap, yıldızı sat, forma sponsoru seç, altyapı seviyesi, bilet fiyatı; gelir/gider, taraftar.
- **Teknik direktörlük:** UEFA C → B → A → Pro lisans; kulüp seviyesine göre lisans şartı; teklifler (hedef sıra, bütçe, maaş); taktik (5), rotasyon, antrenman yükü, yorgunluk, yönetim güveni, transfer pencereleri, altyapıdan oyuncu, basın toplantıları, görevden alınma, sözleşme yenileme.
- **Miras:** Miras Puanı üçe ayrılır (futbol / insan / para). Ölümde **mirasçı seçilir**; tüm varlıklar (nakit, portföy, emlak, şirketler, kulüp) **veraset vergisi** düşülerek çocuğa geçer; çocuk kendi yaşından devam eder (16 altıysa çocukluk, 16-22 arası profesyonel teklifler, daha büyükse aile servetini yönetir).
- **Arayüz:** Alt sekmeler (Hafta, Antrenman, Fikstür, Kariyer, Yaşam, Finans, Kulübüm, T. Direktör, Miras), gece maçı yayını tarzı koyu görsel kimlik.
Test: `node tools/sim.js index.html 50` ile 50 tam hayat (3.200+ etkileşimli sahne dahil) hatasız; gerçek tarayıcıda 390 px ekran testi. Kayıt ~55 KB. v0.x kayıtları uyumsuz (yeni kayıt anahtarı `mfc1_`).
Eksik / sıradaki: ses ve efektler, oyuncu bazlı tam AI dünya (rakip kadrolar maç için üretiliyor ama sezonlar arası kalıcı değil), teknik direktörün maçlarını izleme modu, App Store paketlemesi.

## v2.0 değişiklikleri
- Maç: NSS tarzı fizik sahnesi (kaydırarak vuruş, falso, ağır çekim, kaleci, baraj, ver-kaç, hava durumu ve özelliklerin etkisi).
- Haftalık enerji: her eylem enerji harcar; kalan enerji rutine gider. Vakit ayırmadığın ilişkiler aşınır.
- Pazarlık masası (11 kalem, sabır, menajer), tekliflerde mevcut sözleşme karşılaştırması, zengin yatırımcılı küçük kulüpler, çocukluk kulübünden davet.
- Uyum, kaptanlık önerisi, forma numarası; kulüp geçmişi (lig, o zamanki güç, numara, altyapı kulübü).
- Doğuştan farklı yetenek ve kariyer eğrileri (erken / geç / istikrarlı / dalgalı), sezon havası.
- Yaşam: ev kirası, giderler, işler, arkadaşlar, kişisel ekip, yaşam tarzı.
- Kulüp sahipliği ve teknik direktörlük: gerçek kadro, diziliş, taktik, teknik ekip, altyapı, dinamik hedefler, sözleşme kalemleri, sürpriz teklifler, maçı yönetme; emeklilikte kendi kulübünü çalıştırma.
- Miras: ölmeden önce çocuğa devretme.

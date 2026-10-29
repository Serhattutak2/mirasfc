# Miras FC: A Football Life — Para kazanma sistemi (v2.2'de kurulu)

## Temel ilke
Oyuncu parayla **zafer satın almaz**; **zaman, kolaylık, bilgi, görünüm ve hikâye** satın alır. Ödeme yapmayan oyuncu reklamla gelir getirir, ödeme yapan az sayıdaki oyuncu jeton ve abonelikle. Stat satışı ve şans kutusu yok.

## Miras Jetonu 🪙 (hesap düzeyinde, bütün kayıtlarda ortak)
| Ücretsiz kaynak | Miktar |
|---|---|
| Başlangıç | 10 |
| Günlük giriş serisi (7 gün) | 1 · 1 · 2 · 2 · 3 · 3 · 6 (reklamla 2 katı) |
| Ödüllü reklam (günde 3) | 2 |
| 30 başarım | 2–24 |
| Sezon sonu ödülü | 2–9 (reklamla 2 katı) |
| Kariyer Bileti ücretsiz yol | her 5 basamakta 2–5 |

v2.4: ücretsiz jeton bilerek az. Jeton isteyen oyuncu mağazaya yönelir (ana gelir).

| Harcama | Fiyat |
|---|---|
| Kararı geri al | 30 |
| Gözlemci raporu (pazarlık sınırları / çocuğun gerçek yeteneği) | 20 |
| +25 enerji (haftada 1) | 15 |
| Hızlı tedavi (sakatlık yarıya) | 25 |
| Ek kayıt yuvası (en fazla 6) | 150 |
| Renk temaları, saha görünümleri | 50–120 |
| Hikâye paketleri: Gurbet, Skandal, Kulüp kurucusu | 200–250 |

## Ödüllü reklam noktaları 📺
Enerji (+25, haftada 1) · pozisyonu tekrar oyna (maç başına 1) · sakatlığı yarıya indir · pazarlıkta menajerin son araması · sezon ödülünü 2'ye katla · günlük ödülü 2'ye katla · mağazada jeton.

**Geçiş reklamı:** yalnızca her 4 oyun haftasında bir (sezon sonu ve emeklilik reklamı kaldırıldı); iki reklam arası en az 90 sn; abonelere ve oturumun ilk 90 sn'sinde hiç. (`ADCFG.everyWeeks = 4`)

## Kariyer Bileti 🎟️
Her gerçek ay yenilenen 30 basamak. Maç oynamak, gol, hafta ve sezon tamamlamak, reklam izlemek bilet puanı verir. Ücretsiz yol her 5 basamakta birkaç jeton verir; **Altın Bilet** (ayda bir satın alınır) her basamakta jeton ve 10., 20., 30. basamakta renk teması verir.

## Mağaza
| Ürün | TR | EN |
|---|---|---|
| 100 jeton | 34,99 ₺ | $0.99 |
| 550 jeton | 149,99 ₺ | $4.99 |
| 1.200 jeton | 299,99 ₺ | $9.99 |
| 2.500 jeton | 549,99 ₺ | $19.99 |
| Altın Bilet (bu ay) | 129,99 ₺ | $3.99 |
| **Miras Paketi** (tek kayıt için): kurucudan oğula ilk devir ücretsiz; torun ve sonraki kuşaklar bu paketle açılır. Yeni kayıtta yeniden alınır. | 39,99 ₺ | $0.99 |
| Miras Kulübü (aylık abonelik): zorunlu reklam yok, her ay 150 jeton, 6 kayıt yuvası | 59,99 ₺ | $1.99 |

## Teknik durum
- Web sürümünde reklam 5 saniyelik **deneme reklamı**, satın alma **test satın alması** (ücret alınmaz).
- Kod iki bağlantı noktasıyla yazıldı (`src/shop.js`): `AD.rewarded / AD.inter` ve `IAP.buy`. Mobil uygulamada `window.MirasNative` tanımlanınca gerçek AdMob ve App Store / Google Play ödemesi devreye girer; oyun içi denge ve ekranlar değişmez.
- Mağazaya çıkmadan önce: Capacitor sarmalayıcı, AdMob (veya AppLovin MAX) hesabı, mağaza ürün kimlikleri (`tok100, tok550, tok1200, tok2500, gold, sub, miras`), sunucuda makbuz doğrulaması ve jeton bakiyesi, KVKK/GDPR reklam onayı, yaş sınırı ayarı.

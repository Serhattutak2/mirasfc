# Miras FC: A Football Life

Doğumdan son düdüğe bir futbol hayat simülasyonu. Türkçe ve İngilizce (ana menüden seçilir). Tasarım: [TASARIM.md](TASARIM.md) · Teknik devir notu: [DEVIR.md](DEVIR.md).

- Yeni (v3.9): **🏛 Miras Salonu** (biten hayatların sıralaması ve rekorlar) ve paylaşılabilir **Miras Kartı** görseli.
- Oyun: `index.html` (tarayıcıda aç; tek dosya).
- Kaynak: `src/` (veri, çekirdek, kadrolar, hikâye ağacı, hayat, kariyer, pazarlık, fizik maç motoru, finans, kulüp sahipliği, teknik direktörlük, miras, arayüz, stil).
- Derleme: `python3 tools/build.py` → `index.html`.
- Test botu: `node tools/sim.js index.html 30` (rastgele hayatlar, hata ve denge raporu).
- Maymun testi: `python3 tools/monkey.py $PWD/index.html 1500` (tarayıcıda rastgele tıklama).
- İngilizce sözlük: `i18n/en*.txt` (derlemede `src/en.js` üretilir). Kapsama testi: `python3 tools/i18n_scan.py $PWD/index.html 800`.

/* ============================================================
   MİRAS FC — KÜÇÜK SİMGELER (v3.3)
   Şirket, mülk, ev, araç, yatırım, ekip, tesis ve iş adlarının
   yanına küçük emoji koyar. Metne dokunmaz (çeviri bozulmaz):
   ilgili öğeye data-emo verir, CSS ::before ile gösterir.
   ============================================================ */
const EMO_NAMES = [
  /* şirketler */
  ['Restoran zinciri', '🍽️'], ['Spor giyim markası', '👕'], ['İnşaat şirketi', '🏗️'], ['Teknoloji girişimi', '💻'],
  ['Futbol akademisi', '⚽'], ['Medya ajansı', '📺'], ['Kafe ve spor barı', '☕'],
  /* mülkler */
  ['Rezidans katı', '🏙️'], ['Ofis katı', '🏬'], ['Butik otel', '🏨'], ['Arsa', '🌳'],
  /* evler (uzun adlar önce) */
  ['Kiralık stüdyo daire', '🛏️'], ['Kiralık rezidans', '🏙️'], ['Kiralık villa', '🏖️'], ['Kiralık daire', '🏢'],
  ['Ailenin evi', '🏠'], ['Kendi dairen', '🔑'], ['Müstakil ev', '🏡'], ['Malikâne', '🏰'], ['Villa', '🏝️'], ['Daire', '🏢'],
  /* araçlar */
  ['Toplu taşıma', '🚌'], ['İkinci el otomobil', '🚗'], ['Orta sınıf otomobil', '🚙'], ['Lüks otomobil', '🚘'], ['Süper otomobil', '🏎️'],
  /* yatırım */
  ['Vadeli mevduat', '🏦'], ['Yatırım fonu', '📊'], ['Hisse senetleri', '📈'], ['Kripto para', '🪙'],
  /* kişisel ekip */
  ['Kişisel antrenör', '🏋️'], ['Özel aşçı / diyetisyen', '👨‍🍳'], ['Spor psikoloğu', '🧠'], ['Avukat ve mali müşavir', '⚖️'], ['Güvenlik ve şoför', '🕶️'],
  /* kulüp tesisleri */
  ['Stadyum', '🏟️'], ['Altyapı', '🌱'], ['Antrenman merkezi', '🎽'], ['Sağlık merkezi', '🏥'], ['Gözlem ağı', '🔭'], ['Mağaza ve dijital', '🛍️'],
  /* işler */
  ['Kurye', '🛵'], ['Garson', '🍷'], ['Spor mağazası satış', '🛒'], ['Altyapı antrenörü', '📋'], ['TV maç yorumcusu', '🎙️'], ['Kulüp danışmanı', '💼'], ['Ofis işi', '🗂️'],
  /* sekmeler ve kartlar */
  ['Portföy', '💰'], ['Mülklerin', '🏘️'], ['Şirketlerin', '🏢'], ['Aracın', '🚗'], ['Kişisel ekibin', '👥'], ['Evin', '🏠'], ['Giderler', '🧾'], ['Sponsorlar', '🤝'],
  ['Banka', '🏦'], ['Finansal Fair Play', '⚖️'], ['Stadyum isim hakkı', '🏟️'], ['Transfer pazarı', '🔄'], ['Kupa dolabı', '🏆'], ['Milli takım', '🌍'],
];
/* İngilizce karşılıkları da ekle (çeviri önce çalışırsa) */
try { const D = typeof EN_DICT !== 'undefined' ? EN_DICT : null; if (D) EMO_NAMES.slice().forEach(([n, e]) => { const en = D[n] || (D.get && D.get(n)); if (typeof en === 'string' && en !== n) EMO_NAMES.push([en, e]); }); } catch (e) { }
const EMO_SKIP = /^[\p{Extended_Pictographic}☀-➿]/u;
function emoFor(t) {
  if (!t || EMO_SKIP.test(t)) return null;
  for (const [n, e] of EMO_NAMES) if (t === n || t.startsWith(n + ' ') || t.startsWith(n + ' ·') || t.startsWith(n + ':')) return e;
  return null;
}
function emoDecorate(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('b, .eyebrow, .chip, .asset > div > b, .opt > b, .kv > span').forEach(el => {
    if (el.dataset.emo) return; const tn = el.firstChild; if (!tn || tn.nodeType !== 3) return;
    const e = emoFor(tn.nodeValue.trim()); if (e) el.dataset.emo = e;
  });
}
const _drawEmo = draw;
draw = function () { const r = _drawEmo.apply(this, arguments); try { emoDecorate(document.getElementById('app')); } catch (e) { } return r; };

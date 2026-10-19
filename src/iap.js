/* ============================================================
   MİRAS FC — Gerçek ödeme (App Store / StoreKit)
   - Uygulamada @capgo/native-purchases ile satın alma; ödeme onaylanmadan
     hiçbir şey açılmaz. Tarayıcı sürümünde satın alma yoktur.
   - App Store Connect'te ürün kimlikleri SKU tablosundakiyle AYNI olmalı
     (Uygulama İçi Satın Almalar). TestFlight'ta Apple sandbox ödemesi
     kullanılır (gerçek para çekilmez).
   ============================================================ */
const SKU = { tok100: 'com.serhattutak.mirasfc.tok100', tok550: 'com.serhattutak.mirasfc.tok550', tok1200: 'com.serhattutak.mirasfc.tok1200', tok2500: 'com.serhattutak.mirasfc.tok2500', gold: 'com.serhattutak.mirasfc.gold', miras: 'com.serhattutak.mirasfc.miras', sub: 'com.serhattutak.mirasfc.sub' };
function iapPlugin() { try { const C = window.Capacitor; if (!C || !(C.isNativePlatform && C.isNativePlatform())) return null; return (C.Plugins && C.Plugins.NativePurchases) || (C.registerPlugin ? C.registerPlugin('NativePurchases') : null); } catch (e) { return null; } }
const IAPST = { busy: 0, prices: {} };
async function iapPrices() { const P = iapPlugin(); if (!P) return; try { const r = await P.getProducts({ productIdentifiers: Object.values(SKU).filter(x => !x.endsWith('.sub')) }); (r.products || []).forEach(p => { const k = Object.keys(SKU).find(k2 => SKU[k2] === p.identifier); if (k) IAPST.prices[k] = p.priceString; }); } catch (e) { } }
if (iapPlugin()) {
  window.MirasNative = Object.assign(window.MirasNative || {}, {
    purchase(id, cb) {
      const P = iapPlugin(), sku = SKU[id]; if (!P || !sku) return toast('Bu ürün şu an satın alınamıyor');
      if (IAPST.busy) return; IAPST.busy = 1; toast('🛒 App Store açılıyor…');
      P.purchaseProduct({ productIdentifier: sku, productType: id === 'sub' ? 'subs' : 'inapp', isConsumable: id !== 'sub', quantity: 1 })
        .then(tx => { IAPST.busy = 0; if (tx && (tx.transactionId || tx.productIdentifier)) cb(true); else cb(false); })
        .catch(e => { IAPST.busy = 0; const m = String(e && (e.message || e)); toast(/cancel/i.test(m) ? 'Satın alma iptal edildi' : /not found|invalid|product/i.test(m) ? 'Ürün App Store’da henüz hazır değil' : 'Ödeme tamamlanamadı'); cb(false); });
    },
  });
  setTimeout(iapPrices, 2500);
}
/* tarayıcıda ödeme yok: ücretsiz "deneme satın alması" kaldırıldı */
IAP.buy = function (id, cb) {
  if (window.MirasNative && window.MirasNative.purchase) return window.MirasNative.purchase(id, ok => ok && cb());
  ask('Satın almalar yalnızca App Store’dan indirilen Miras FC uygulamasında yapılabilir. Jeton kazanmak için günlük ödülü ve reklam ödülünü kullanabilirsin.', () => { }, 'Tamam');
};
/* Miras Paketi: ödeme onayı olmadan açılmaz */
heirBuy = function (cb) { IAP.buy('miras', () => { g.heirPass = 1; sv(); toast('Miras Paketi bu kayıt için açıldı'); if (cb) cb(); else draw(); }); };
/* "Her şeyi ona devret" yolu da paket kontrolünden geçer */
const _inheritIAP = inherit;
inherit = function (ki) {
  if (g && typeof needHeirPass === 'function' && needHeirPass()) { const k = g.fam.kids[ki]; return ask(`${heirGen() + 1}. kuşağa geçmek için Miras Paketi gerekir (${heirPrice()}). Paket yalnızca bu kayıt için geçerlidir.`, () => heirBuy(() => _inheritIAP(ki)), 'Paketi al'); }
  return _inheritIAP(ki);
};
const _handOverIAP = handOver;
handOver = function (ki) { if (g && needHeirPass()) return heirGo(ki, 1); return _handOverIAP(ki); };

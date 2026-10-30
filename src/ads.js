/* Build: 2026-10-30 — reklam modeli + maç motoru + grafik güncellemesi (TestFlight) */
/* ============================================================
   MİRAS FC — Reklam: sıklık + Google AdMob (mobil uygulamada)
   - Geçiş reklamı: doğal molalarda ~90 sn'de bir ve her sezon sonunda
     (abonelere hiç; oturumun ilk 90 sn'sinde yok).
   - "Hafta/sezon atla" düğmeleri önce bir ödüllü reklam gösterir, sonra simüle eder.
   - AdMob: uygulama iOS'ta çalışırken @capacitor-community/admob
     eklentisiyle gerçek reklam; tarayıcıda deneme ekranı.
   - ADCFG.test = true iken Google'ın resmi TEST reklamları gösterilir.
     Gerçek kimlikler gelince ADCFG'yi doldur, test'i false yap ve
     Info.plist'teki GADApplicationIdentifier'ı değiştir.
   ============================================================ */
const ADCFG = {
  test: false,
  ios: { inter: 'ca-app-pub-4873666267587702/4724847012', reward: 'ca-app-pub-4873666267587702/4066371465' },
  everyWeeks: 1, minGap: 90000,
};
const AD_T0 = Date.now(); /* oturumun ilk 90 sn'sinde geçiş reklamı yok */
let AD_SIM = 0; /* hafta/sezon simülasyonunda geçiş reklamı bastırılır (önce tek ödüllü reklam gösterildi) */
function adInterNow() { if (AD_SIM) return; const A = acct(); if (A.sub) return; const now = Date.now(); if (now - AD_T0 < ADCFG.minGap) return; if (now - (A.lastInter || 0) < ADCFG.minGap) return; A.lastInter = now; acctSave(); setTimeout(() => AD.inter(), 350); }
function adWeekTick(n) { const A = acct(); A.adWk = (A.adWk || 0) + (n || 1); if (A.adWk >= ADCFG.everyWeeks) { A.adWk = 0; acctSave(); adInterNow(); } else acctSave(); }
/* geçiş reklamı ~90 sn'de bir (doğal molalarda) ve her sezon sonunda */
const _weekEndAd = weekEnd;
weekEnd = function () { const s0 = g && g.season; _weekEndAd.apply(this, arguments); if (!g) return; if (g.season !== s0) adInterNow(); else adWeekTick(1); };
if (typeof coachWeekEnd === 'function') { const _cwe = coachWeekEnd; coachWeekEnd = function () { const s0 = g && g.season; _cwe.apply(this, arguments); if (!g) return; if (g.season !== s0) adInterNow(); else adWeekTick(1); }; }
/* "Hafta/sezon atla" düğmeleri: önce ödüllü reklam, sonra sessizce simüle et */
function adSkipWeeks(n) { if (typeof simWeeks !== 'function') return; const run = () => { AD_SIM = 1; try { simWeeks(n); } finally { AD_SIM = 0; } }; if (typeof adRewarded === 'function') adRewarded('skip', run); else run(); }

/* ---------- AdMob köprüsü ---------- */
const ADM = { ok: 0, inter: 0, reward: 0, cb: null };
function admobPlugin() { try { const C = window.Capacitor; if (!C || !(C.isNativePlatform && C.isNativePlatform())) return null; return C.Plugins && C.Plugins.AdMob ? C.Plugins.AdMob : (C.registerPlugin ? C.registerPlugin('AdMob') : null); } catch (e) { return null; } }
async function admobInit() {
  const P = admobPlugin(); if (!P || ADM.ok) return; ADM.ok = 1;
  try { await P.initialize({ initializeForTesting: ADCFG.test }); } catch (e) { }
  /* AB/İngiltere kullanıcıları için Google GDPR onay formu (AdMob > Gizlilik ve mesajlaşma) */
  /* onay bilgisi 6 sn içinde gelmezse beklemeden takip iznine geç (ATT penceresi her durumda sorulsun) */
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  try { const ci = await within(P.requestConsentInfo(), 6000); if (ci && ci.isConsentFormAvailable && ci.status === 'REQUIRED') await P.showConsentForm(); } catch (e) { }
  try { await P.requestTrackingAuthorization(); } catch (e) { }
  admobLoad();
}
function admobLoad() {
  const P = admobPlugin(); if (!P) return;
  if (!ADM.inter) P.prepareInterstitial({ adId: ADCFG.ios.inter, isTesting: ADCFG.test }).then(() => { ADM.inter = 1; }).catch(() => { ADM.inter = 0; });
  if (!ADM.reward) P.prepareRewardVideoAd({ adId: ADCFG.ios.reward, isTesting: ADCFG.test }).then(() => { ADM.reward = 1; }).catch(() => { ADM.reward = 0; });
}
if (admobPlugin()) {
  window.MirasNative = Object.assign(window.MirasNative || {}, {
    showInterstitial() { const P = admobPlugin(); if (!P || !ADM.inter) { admobLoad(); return; } ADM.inter = 0; P.showInterstitial().catch(() => { }).finally(() => setTimeout(admobLoad, 1000)); },
    showRewarded(kind, cb) {
      const P = admobPlugin(); if (!P || !ADM.reward) { admobLoad(); toast('Reklam hazırlanıyor, birazdan tekrar dene'); return; }
      ADM.reward = 0; P.showRewardVideoAd().then(r => cb(true)).catch(() => cb(false)).finally(() => setTimeout(admobLoad, 1000));
    },
  });
  if (document.addEventListener) ['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => { admobInit(); }, { once: true, capture: true }));
}

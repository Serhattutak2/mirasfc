/* ============================================================
   MİRAS FC — DİL DESTEĞİ (TR / EN)
   Oyun mantığı Türkçe kalır; ekrana basılan metin çevrilir.
   EN sözlüğü (en.js): { 'Türkçe kalıp {0}': 'English pattern {0}' }
   {n} yer tutucuları yakalanan parçalar olur ve onlar da ayrıca çevrilir.
   ============================================================ */
let LANG = 'tr';
const I18N = { exact: new Map(), pats: [], cache: new Map() };
function i18nInit() {
  if (I18N.ready || typeof EN_DICT === 'undefined') return; I18N.ready = 1;
  for (const k in EN_DICT) {
    const v = EN_DICT[k];
    if (!/\{\d+\}/.test(k)) { I18N.exact.set(k, v); continue; }
    const parts = k.split(/(\{\d+\})/), lits = parts.filter((p, i) => i % 2 === 0), idx = parts.filter((p, i) => i % 2 === 1).map(p => +p.slice(1, -1));
    const re = new RegExp('^' + parts.map((p, i) => i % 2 ? '(.*?)' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$', 'sd');
    const lit = lits.reduce((a, b) => b.length > a.length ? b : a, '');
    const len = lits.join('').replace(/[\s·:,()]/g, '').length; if (len < 3) continue;
    const tailFree = /: \{\d+\}$/.test(k), tailCap = /\}$/.test(k);
    const seps = [' · ', ': ', '; ', ' → ', ' — '].filter(x => !k.includes(x));
    I18N.pats.push({ re, idx, v, lit, len, seps, tailFree, tailCap });
  }
  I18N.pats.sort((a, b) => b.len - a.len);
}
function setLang(l) { LANG = l === 'en' ? 'en' : 'tr'; try { acct().lang = LANG; acctSave(); } catch (e) { } document.documentElement.lang = LANG; I18N.cache.clear(); document.title = 'Miras FC: A Football Life'; i18nWatch(); }
function initLang() { let l = null; try { l = acct().lang; } catch (e) { } if (!l) { const nl = (typeof navigator !== 'undefined' && (navigator.language || '')).toLowerCase(); l = nl.startsWith('tr') ? 'tr' : 'en'; } setLang(l); }
const moneyEN = s => s.replace(/\/yıl\b/g, '/yr').replace(/%(\d+(?:[.,]\d+)?)/g, '$1%').replace(/(\d) Mr€/g, '$1 §B').replace(/(\d) M€/g, '$1 §M').replace(/(\d) B€/g, '$1 K€').replace(/§B/g, 'B€').replace(/§M/g, 'M€').replace(/(\d)B(?=[^a-zA-Z]|$)/g, '$1K').replace(/(\d)Mr(?=[^a-zA-Z]|$)/g, '$1B');
const I18N_L = /[A-Za-zÇĞİÖŞÜçğıöşüâîû]/;
/* yer tutucu bir kelimeyi ortadan bölmesin ("yıl" kalıbı "yıldızı" içinde eşleşmesin) */
function i18nWordOK(t, m) {
  if (!m.indices) return true;
  for (let i = 1; i < m.length; i++) {
    const [a, b] = m.indices[i] || [0, 0]; if (b - a <= 4) continue;
    if (a > 0 && I18N_L.test(t[a - 1]) && I18N_L.test(t[a])) return false;
    if (b < t.length && I18N_L.test(t[b - 1]) && I18N_L.test(t[b])) return false;
  }
  return true;
}
/* tek bir metni çevir (özyinelemeli: yakalanan parçalar da çevrilir) */
function trExact(t) {
  const X = I18N.exact;
  if (X.has(t)) return X.get(t);
  if (/[.!]$/.test(t) && X.has(t.slice(0, -1))) return X.get(t.slice(0, -1)) + t.slice(-1);
  if (X.has(t + '.')) return X.get(t + '.').replace(/\.$/, '');
  if (X.has('· ' + t)) return X.get('· ' + t).replace(/^· /, '');
  if (X.has(t + ' ·')) return X.get(t + ' ·').replace(/ ·$/, '');
  if (/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(t) && t.length < 40) { const U = t.toLocaleUpperCase('tr'); if (X.has(U)) { const v = X.get(U); return v[0] + v.slice(1).toLowerCase(); } }
  if (/^[a-zçğıöşü]/.test(t)) { const u = t[0].toLocaleUpperCase('tr') + t.slice(1); if (X.has(u)) { const v = X.get(u); return v[0].toLowerCase() + v.slice(1); } }
  return null;
}
function trPat(t, d) {
  for (const p of I18N.pats) {
    if (p.lit && !t.includes(p.lit)) continue; const m = t.match(p.re);
    if (!m) continue;
    const caps = m.slice(1), n = caps.length;
    const ok = caps.every((c, i) => {
      const last = i === n - 1 && p.tailCap;
      if (!last && [' · ', ': ', ' → '].some(x => c.includes(x))) return false;
      if (last && p.tailFree) return true;
      if (p.len < 6 && c.length > 25) return false;
      if (p.len >= 15) return true;
      if (c.length > 70 || /[a-zçğıöşüA-Z)”"]{2}[.!?]\s/.test(c)) return false;
      return !(last ? p.seps : []).some(x => c.includes(x));
    });
    if (ok && i18nWordOK(t, m))
      return p.v.replace(/\{(\d+)\}/g, (_, n) => { const j = p.idx.indexOf(+n); return j < 0 ? '' : tr1(m[j + 1], d + 1); });
  }
  return null;
}
const TR_CH = /[A-Za-zÇĞİÖŞÜçğıöşü]/;
function tr1(s, depth) {
  if (LANG !== 'en' || !s) return s; i18nInit();
  const c = I18N.cache.get(s); if (c != null) return c;
  const d = depth || 0;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], t = s.trim();
  let out = t;
  if (t && TR_CH.test(t)) {
    const ex = trExact(t);
    if (ex != null) out = ex;
    else if (d < 7) {
      const sub = x => tr1(x, d + 1);
      let pt = trPat(t, d); if (pt == null && !/^·/.test(t)) { const p2 = trPat('· ' + t, d); if (p2 != null) pt = p2.replace(/^· /, ''); }
      if (pt != null) out = pt;
      else if (t.includes(' → ')) out = t.split(' → ').map(sub).join(' → ');
      else if (/^· ./.test(t)) out = '· ' + sub(t.slice(2));
      else if (/^[^\sA-Za-z0-9ÇĞİÖŞÜçğıöşü(“"'«]{1,3}\s\S/u.test(t)) { const i = t.search(/\s/); out = t.slice(0, i + 1) + sub(t.slice(i + 1)); }
      else if (/ ·$/.test(t)) out = sub(t.slice(0, -2)) + ' ·';
      else if (t.includes(' · ')) out = t.split(' · ').map(sub).join(' · ');
      else if (t.includes('; ') && !/[“"]/.test(t) && !/[.!?]\s/.test(t)) out = t.split('; ').map(sub).join('; ');
      else if (t.includes(' — ')) out = t.split(' — ').map(sub).join(' — ');
      else if (/^[“"«].+[”"»]$/.test(t)) out = t[0] + sub(t.slice(1, -1)) + t.slice(-1);
      else if (/^[^:.]{2,40}: /.test(t)) { const i = t.indexOf(': '); out = sub(t.slice(0, i)) + ': ' + sub(t.slice(i + 2)); }
      else if (/[.!?…]["”]?\s+\S/.test(t)) {
        const sp = t.match(/[^.!?…]+(?:[.!?…]+["”]?|$)\s*/g) || [t];
        if (sp.length > 1) {
          /* en uzun çevrilebilir cümle grubunu açgözlü seç */
          const res = []; let i = 0;
          while (i < sp.length) {
            let done = false;
            for (let j = sp.length; j > i + 1; j--) {
              const cand = sp.slice(i, j).join(''), ct = cand.trim();
              const r = trExact(ct) || (j - i <= 4 ? trPat(ct, d) : null);
              if (r != null) { res.push(cand.replace(ct, r)); i = j; done = true; break; }
            }
            if (!done) { res.push(sub(sp[i])); i++; }
          }
          out = res.join('');
        }
      }
      else if (t.includes(' / ')) out = t.split(' / ').map(sub).join(' / ');
    }
  }
  if (d === 0 && out !== t && /^[A-ZÇĞİÖŞÜ0-9]/.test(t) && /^[a-z]/.test(out)) out = out[0].toUpperCase() + out.slice(1);
  out = lead + moneyEN(out) + trail;
  if (I18N.cache.size > 8000) I18N.cache.clear(); I18N.cache.set(s, out); return out;
}
const T = s => tr1(s);
/* bir DOM ağacındaki bütün metinleri ve bazı nitelikleri çevir */
const I18N_DONE = new WeakMap();
function trNode(nd) {
  const p = nd.parentNode; if (!p || p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.tagName === 'TEXTAREA') return;
  if (p.closest && p.closest('[data-notr]')) return;
  const cur = nd.nodeValue; if (I18N_DONE.get(nd) === cur) return;
  const v = tr1(cur); I18N_DONE.set(nd, v); if (v !== cur) nd.nodeValue = v;
}
function trEl(root) {
  if (root.nodeType === 3) return trNode(root);
  if (root.nodeType !== 1) return;
  if (root.tagName === 'OPTION' && !root.hasAttribute('value')) root.setAttribute('value', root.textContent);
  root.querySelectorAll && root.querySelectorAll('option').forEach(o => { if (!o.hasAttribute('value')) o.setAttribute('value', o.textContent); });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
  nodes.forEach(trNode);
  const els = [root, ...(root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title]') : [])];
  els.forEach(el => { ['placeholder', 'aria-label', 'title'].forEach(a => { if (el.hasAttribute && el.hasAttribute(a)) { const o = el.getAttribute(a), t = tr1(o); if (t !== o) el.setAttribute(a, t); } }); });
}
function i18nApply(root) { if (LANG !== 'en' || !root) return; trEl(root); }
/* İngilizcede her yeni çizilen düğümü otomatik çevir (hangi kod yolundan gelirse gelsin) */
let I18N_OBS = null;
function i18nWatch() {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.body) return;
  if (LANG !== 'en') { if (I18N_OBS) { I18N_OBS.disconnect(); I18N_OBS = null; } return; }
  if (I18N_OBS) return;
  I18N_OBS = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') trNode(m.target);
      else m.addedNodes.forEach(trEl);
    }
  });
  I18N_OBS.observe(document.body, { childList: true, subtree: true, characterData: true });
  trEl(document.body);
}

/* ============================================================
   MİRAS FC — ARAYÜZ (v2): menü, karakter, sekmeler, ekranlar
   Her buton bir şey yapar ya da nedenini söyler (toast).
   ============================================================ */
function newState(o) {
  const pot = rollTalent(), base = pot >= 85 ? [6, 11] : pot >= 70 ? [5, 9] : [3, 8];
  return {
    v: 2, name: o.name, ct: o.ct, city: o.city, pos: o.pos, age: 0, season: 2010, week: 1, phase: 'child',
    st: { hiz: R(...base), pas: R(...base), sut: R(...base), tek: R(...base), def: R(...base), fiz: R(...base) }, xp: { hiz: 0, pas: 0, sut: 0, tek: 0, def: 0, fiz: 0 },
    cap: { hiz: 99, pas: 99, sut: 99, tek: 99, def: 99, fiz: 99 }, pot, arc: P(Object.keys(ARCS)), sf: 0, hp: 100, fit: 100, hap: 70, mor: 60, form: 6.5, rep: 0, money: 0,
    val: { am: 50, sa: 50, ai: 50, pa: 50 }, flags: {}, fam: mkFamily(), friends: [], edu: 0, acad: 0, acadClub: null, homeClub: null,
    club: null, con: null, role: 0, agent: 0, trainer: 0, inj: 0, sc: [], num: 0, uyum: 50, captain: 0, clubYears: 0,
    car: { ap: 0, g: 0, a: 0, t: 0, cup: 0, ec: 0, el: 0 }, seasons: [], ss: { ap: 0, g: 0, a: 0, rs: 0, st: 0 }, nat: { caps: 0, g: 0 }, ntw: { wc: 0, rc: 0 }, trh: [], hist: [],
    cal: [], lg: null, cup: null, euro: null, wq: null, wres: [], wstage: 0, en: 100, wa: {}, tw: 0, touch: {}, routine: 'Dengeli', focus: null,
    log: [], news: [], story: [], qs: [], mem: {}, ev: null, evq: [], q: null, of: [],
    fin: { dep: 0, fund: 0, stock: 0, crypto: 0, props: [], biz: [], spons: [], house: 0, car: 0, hist: [] }, staffP: {}, lux: 1, job: null,
    own: null, coach: null, lic: 0, licYr: 0, licP: 0, co: { t: 0, s: 0, cup: 0 }, lin: [], rv: null, ended: 0, ql: {}, chs: {}, w: null, sq: {}, youth: {}, pid: 0,
  };
}

/* ---------- Diyaloglar ---------- */
let dlgF = null;
function ask(m, f, ok) { dlgF = f; const d = $('dlg'); d.querySelector('.dlg-t').textContent = T(m); d.querySelector('.btn.ghost').textContent = T('Vazgeç'); d.querySelector('.dlg-in').hidden = true; d.querySelector('.dlg-ok').textContent = T(ok || 'Evet'); d.hidden = false; d.querySelector('.dlg-ok').focus(); }
function askText(m, def, f) { dlgF = f; const d = $('dlg'); d.querySelector('.dlg-t').textContent = T(m); const i = d.querySelector('.dlg-in'); i.hidden = false; i.value = def || ''; d.querySelector('.dlg-ok').textContent = T('Kaydet'); d.hidden = false; setTimeout(() => i.focus(), 30); }
function dlgEnd(y) { const f = dlgF, i = $('dlg').querySelector('.dlg-in'), v = i.hidden ? null : i.value; dlgF = null; $('dlg').hidden = true; try { if (y && f) f(v); else if (!y && v !== null && f === nameKidCb) nameKid(''); } catch (e) { console.error(e); toast('Bir hata oluştu: ' + e.message); draw(); } }
const nameKidCb = v => nameKid(v);
const shortT = (t, n) => { t = T(String(t)); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
let toastT = 0; function toast(t) { const el = $('toast'); if (!el) return; el.textContent = T(t); el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2400); }

/* ---------- Ortak parçalar ---------- */
const bar = (v, max, cls) => `<div class="bar ${cls || ''}"><i style="width:${cl(v / (max || 100) * 100, 0, 100)}%"></i></div>`;
const roleTag = r => `<span class="tag r${r}">${ROLES[r]}</span>`;
const kit = (c1, c2) => `<i class="kit" style="background:linear-gradient(135deg,${c1} 55%,${c2} 55%)"></i>`;
const clubKit = id => { const c = club(id); return c ? kit(c.c1, c.c2) : ''; };
const stars = n => '★'.repeat(n) + '<span class="dim">' + '★'.repeat(5 - n) + '</span>';
const wxI = k => k ? `<span class="wx" title="${WX[k].n}">${WX[k].i}</span>` : '';
const seg = (vr, k, n, cur) => `<button class="seg ${cur === k ? 'on' : ''}" onclick="${vr}='${k}';draw()">${n}</button>`;
const ICON = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  en: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  fix: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  car: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  life: '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  fin: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  own: '<path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6"/>',
  coach: '<path d="M4 4h16v12H4zM8 20h8M12 16v4"/><path d="M8 9l3 3 5-5"/>',
  leg: '<path d="M6 3h12v5a6 6 0 0 1-12 0zM9 20h6M12 14v6M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3"/>',
  story: '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 8h6M9 12h6"/>',
};
const ico = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

function tabsFor() {
  const ph = g.phase;
  if (ph === 'child') return [['home', 'Hikâye', 'story'], ['life', 'Aile', 'life'], ['leg', 'Miras', 'leg']];
  const t = [['home', ph === 'retired' ? 'Yıl' : ph === 'coach' ? 'Hafta' : 'Hafta', 'home']];
  if (ph === 'coach') t.push(['coach', 'T. Direktör', 'coach'], ['fix', 'Fikstür', 'fix'], ['en', 'Enerji', 'en']);
  else if (ph === 'retired') t.push(['en', 'Enerji', 'en'], ['coach', 'T. Direktör', 'coach'], ['car', 'Kariyer', 'car']);
  else t.push(['en', 'Enerji', 'en'], ['fix', 'Fikstür', 'fix'], ['car', 'Kariyer', 'car']);
  t.push(['life', 'Yaşam', 'life'], ['fin', 'Finans', 'fin']);
  if (g.own) t.push(['own', 'Kulübüm', 'own']);
  t.push(['leg', 'Miras', 'leg']);
  return t;
}
function setTab(t) { tab = t; draw(); window.scrollTo(0, 0); }
const fmShort = k => { const s = k < 0 ? '−' : '', a = Math.abs(k); return s + (a >= 1e6 ? (a / 1e6).toFixed(1) + 'Mr' : a >= 1000 ? (a / 1000).toFixed(1) + 'M' : Math.round(a) + 'B'); };
function topBar() {
  const c = g.club ? club(g.club.id) : g.coach ? club(g.coach.id) : null;
  const sub = g.phase === 'child' ? `${g.age} yaş · ${esc(g.city)}` : g.phase === 'coach' ? `${g.age} yaş · T. direktör · ${c ? esc(clubName(c.n)) : ''}` : g.phase === 'retired' ? `${g.age} yaş · Emekli` : `${g.age} yaş · ${POSN[g.pos]}${c ? ` · ${esc(clubName(c.n))}${g.num ? ' #' + g.num : ''}` : ' · Kulüpsüz'}`;
  const showEn = g.phase !== 'child';
  return `<header class="top"><div class="tl"><div class="nm">${esc(g.name)}${g.captain ? ' <span class="cap">C</span>' : ''}</div><div class="sub">${sub}</div></div><div class="tr">${['pro', 'free', 'pro0'].includes(g.phase) ? `<div class="ov"><b>${ovr()}</b><span>GENEL</span></div>` : ''}${showEn ? `<button class="ov enb" onclick="setTab('en')" aria-label="Enerji"><b>${Math.round(g.en || 0)}</b><span>ENERJİ</span></button>` : ''}<button class="ov enb" onclick="FINV='ozet';setTab('fin')" aria-label="Nakit"><b class="${g.money < 0 ? 'neg' : ''}">${fmShort(g.money)}</b><span>NAKİT</span>${g.lastD && Date.now() - g.lastD.t < 4000 ? `<i class="dlt ${g.lastD.v < 0 ? 'neg' : 'pos'}">${g.lastD.v > 0 ? '+' : ''}${fmShort(g.lastD.v)}</i>` : ''}</button><button class="ib coinb" onclick="openShop()" aria-label="Mağaza">🪙<small>${acct().tok}</small></button><button class="ib" onclick="menu()" aria-label="Menü">☰</button></div></header>`;
}

/* ---------- Ana çizim ---------- */
function draw() {
  try { drawInner(); } catch (e) { console.error(e); $('app').innerHTML = `<div class="wrap"><div class="card"><div class="eyebrow">Beklenmeyen hata</div><p class="m">${esc(e.message)}</p><button class="btn" onclick="scr='game';tab='home';draw()">Ana ekrana dön</button><button class="btn ghost" onclick="menu()">Menü</button></div></div>`; }
}
function drawInner() {
  if (scr === 'menu') return menu();
  if (scr === 'new') return newScr();
  if (!g) return menu();
  let h = '';
  if (scr === 'match') { if (!M) { scr = 'game'; return drawInner(); } $('app').innerHTML = `<div class="wrap">${matchUI()}</div>`; $('nav').innerHTML = ''; i18nApply($('app')); if (M.stage === 'scene' && S) sceneStart(); return; }
  if (scr === 'cmatch') { if (!CM) { scr = 'game'; return drawInner(); } h = cmatchUI(); }
  else if (scr === 'lmatch') { if (!LM) { scr = 'game'; return drawInner(); } h = lmatchUI(); }
  else if (scr === 'offers') h = offersUI();
  else if (scr === 'nego') h = g.nego ? negoUI() : (scr = 'offers', offersUI());
  else if (scr === 'num') h = numUI();
  else if (scr === 'cnego') h = g.cnego ? cnegoUI() : (scr = 'game', '');
  else if (scr === 'season') h = seasonUI();
  else if (scr === 'shop') h = shopUI();
  else if (scr === 'tour') h = tourUI();
  else if (scr === 'tourinv') h = tourInvUI();
  else if (g.ended && !g.heirDone) h = endUI();
  else {
    scr = 'game';
    const T = tabsFor(); if (!T.some(x => x[0] === tab)) tab = 'home';
    h = topBar() + ({ home: homeUI, en: enUI, fix: fixUI, car: carUI, life: lifeUI, fin: finUI, own: ownUI, coach: coachUI, leg: legUI }[tab] || homeUI)();
    $('nav').innerHTML = `<nav class="tabs">${T.map(([k, n, i]) => `<button class="${tab === k ? 'on' : ''}" onclick="setTab('${k}')">${ico(i)}<span>${n}</span></button>`).join('')}</nav>`;
  }
  if (scr !== 'game') $('nav').innerHTML = '';
  $('app').innerHTML = `<div class="wrap">${h}</div>`; i18nApply($('app')); i18nApply($('nav'));
  if (g.nameKid != null && $('dlg').hidden) { const k = g.fam.kids[g.nameKid]; if (k) askText(`${k.g === 'E' ? 'Oğlunun' : 'Kızının'} adını koy`, k.n, nameKidCb); else g.nameKid = null; }
}
/* butonlardan gelen hatalar oyunu dondurmasın */
window.addEventListener('error', e => { try { toast('Hata: ' + (e.message || '').slice(0, 80)); } catch (x) { } });

/* ---------- Menü ---------- */
function menu() {
  if (!I18N.inited) { I18N.inited = 1; initLang(); }
  scr = 'menu'; cancelAnimationFrame(RAF); S = null;
  let h = `<div class="hero"><div class="crest">M</div><h1>Miras FC</h1><div class="sub" data-notr>A FOOTBALL LIFE</div><p>Doğumdan son düdüğe bir futbol hayatı. Geriye ne bırakacaksın?</p></div>`;
  h += `<div class="langs"><button class="chip ${LANG === 'tr' ? 'on' : ''}" onclick="setLang('tr');menu()">🇹🇷 Türkçe</button><button class="chip ${LANG === 'en' ? 'on' : ''}" onclick="setLang('en');menu()">🇬🇧 English</button></div>`;
  dailyCheck(); applyTheme(); h += `<div class="card coinbar"><div><b>🪙 ${acct().tok}</b><span class="m">Miras Jetonu</span></div><div class="actions tight"><button class="btn ghost" onclick="openShop()">Mağaza</button><button class="btn ghost" onclick="SHV='bilet';openShop()">🎟 Bilet</button></div></div>` + dailyCard();
  for (let i = 1; i <= acct().slots; i++) { const s = ld(i); h += `<div class="card slot"><div><div class="eyebrow">Kayıt ${i}</div><div class="slotn">${s ? esc(s.name) : 'Boş'}</div><div class="m">${s ? `${s.age} yaş · ${s.phase === 'child' ? 'Çocukluk' : s.phase === 'retired' ? 'Emekli' : s.phase === 'coach' ? 'Teknik direktör' : s.club ? esc(clubName(s.club.n)) : 'Kulüpsüz'} · ${s.season}` : 'Yeni bir hayata başla'}</div></div><div class="slotb">${s ? `<button class="btn" onclick="go(${i})">Devam</button><button class="btn ghost danger" onclick="del(${i})">Sil</button>` : `<button class="btn" onclick="nw(${i})">Yeni hayat</button>`}</div></div>`; }
  $('app').innerHTML = `<div class="wrap">${h}<p class="foot">v2.2 · Kulüp ve oyuncu isimleri gerçeğe benzetilmiş kurgudur. v1 kayıtları bu sürümde açılmaz.</p></div>`; $('nav').innerHTML = ''; i18nApply($('app'));
}
function go(i) {
  slot = i; g = ld(i); if (!g || g.v !== 2) { toast('Bu kayıt eski bir sürüme ait.'); return; }
  reindex(); M = null; S = null; CM = null; tab = 'home';
  scr = g.nego ? 'nego' : g.numPick && g.club ? 'num' : g.of && g.of.length ? 'offers' : g.tourInv ? 'tourinv' : g.tour ? 'tour' : g.seasonPending ? 'season' : 'game';
  if (g.wstage && g.phase === 'pro' && !g.wq) g.wstage = 0;
  draw();
}
function del(i) { ask(`Kayıt ${i} kalıcı olarak silinsin mi?`, () => { try { localStorage.removeItem('mfc2_' + i); } catch (e) { } delete MEM[i]; menu(); }); }
const STYLES = { FW: { golcu: ['Golcü', { sut: 1, fiz: .4 }], kanat: ['Kanat', { hiz: 1, tek: .5 }], sahte9: ['Sahte 9', { pas: .7, tek: .7 }] }, MF: { kurucu: ['Oyun kurucu', { pas: 1, tek: .5 }], b2b: ['Box-to-box', { fiz: .7, def: .5, sut: .3 }], on10: ['10 numara', { tek: .8, sut: .5 }] }, DF: { stoper: ['Stoper', { def: 1, fiz: .6 }], bek: ['Bek', { hiz: .8, pas: .5 }], libero: ['Libero', { def: .7, pas: .7 }] } };
const DREAMS = { efsane: 'Kulübümün efsanesi olmak', avrupa: 'Avrupa’nın devlerinde oynamak', milli: 'Milli takımla kupa kaldırmak', zengin: 'Ailemi zengin etmek' };
const ORIGIN_T = { babaanne: x => `Babaannen ${x}'${loc(x)} doğmuş; her yaz oradaki akrabalarını ziyaret ederdiniz. Bu yüzden ${x} vatandaşlığın da var.`, baba: x => `Baban gençken ${x}'${loc(x)} çalıştı; ailende ${x} pasaportu var.`, anne: x => `Annenin ailesi ${x} kökenli; ${x} vatandaşlığın hâlâ geçerli.`, dede: x => `Deden bir zamanlar ${x} milli takımında forma giymişti; ailede ${x} sevgisi hiç bitmedi.` };
let NC = { pos: 'FW', st: 'golcu', yapi: 'de', kis: null, ayak: 'sag', aile: 'r', koken: 'r', kokenNe: 'babaanne', ruya: 'efsane' };
function nw(i) { slot = i; scr = 'new'; NC = { pos: 'FW', st: 'golcu', yapi: 'de', kis: null, ayak: 'sag', aile: 'r', koken: 'r', kokenNe: 'babaanne', ruya: 'efsane' }; draw(); }
function newScr() {
  const opt = (k, v, n) => `<button class="chip ${NC[k] === v ? 'on' : ''}" onclick="NC.${k}='${v}';${k === 'pos' ? `NC.st=Object.keys(STYLES['${v}'])[0];` : ''}newScr()">${n}</button>`;
  const keep = id => ($(id) || {}).value || '';
  const nm = keep('nn'), ct = keep('nc') || NC.ct || 'Türkiye', grow = keep('ng') || NC.grow || ct, city = keep('ny'), fav = keep('nf');
  NC.ct = ct; NC.grow = grow;
  const allNat = COUNTRIES.map(c => c.n).concat(NATIONS.map(x => x[0])).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a.localeCompare(b, 'tr'));
  const clubs = COUNTRIES.find(c => c.n === grow) ? CLUBS1[grow].map(r => r[0]) : [];
  const ntOpts = [ct, grow, NC.koken !== 'yok' && NC.koken !== 'r' ? NC.koken : null].filter((x, i, a) => x && a.indexOf(x) === i);
  $('app').innerHTML = `<div class="wrap"><div class="card"><div class="eyebrow">Yeni hayat · 1/3 Kimlik</div><h2>Karakterini oluştur</h2>
  <label class="lbl" for="nn">Ad Soyad</label><input id="nn" maxlength="24" placeholder="Adını ve soyadını yaz" autocomplete="off" value="${esc(nm)}">
  <label class="lbl" for="nc">Doğduğun ülke</label><select id="nc" onchange="newScr()">${allNat.map(c => `<option ${c === ct ? 'selected' : ''}>${c}</option>`).join('')}</select>
  <label class="lbl" for="ng">Büyüdüğün ve futbola başlayacağın ülke</label><select id="ng" onchange="newScr()">${COUNTRIES.map(c => `<option ${c.n === grow ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
  ${grow !== ct ? `<div class="m">Ailen sen küçükken ${esc(grow)}'${loc(grow)} taşındı. İki ülkenin de milli takımı seni isteyebilir.</div>` : ''}
  <label class="lbl" for="ny">Şehir</label><input id="ny" maxlength="20" placeholder="Örn. Trabzon" value="${esc(city)}">
  <div class="m">Şehrinin kulübü çocukluk kulübün olur; bir gün seni geri çağırabilir.</div>
  <div class="lbl">Aile kökeni</div><div class="chips">${opt('koken', 'r', 'Rastgele')}${opt('koken', 'yok', 'Sadece buralıyız')}</div>
  <select id="nk" onchange="NC.koken=this.value||'r';newScr()" aria-label="Köken ülke"><option value="">Belirli bir ülke seç…</option>${allNat.filter(x => x !== ct).map(c => `<option ${NC.koken === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
  ${NC.koken !== 'r' && NC.koken !== 'yok' ? `<div class="chips">${opt('kokenNe', 'babaanne', 'Babaannem oralı')}${opt('kokenNe', 'baba', 'Babam orada çalıştı')}${opt('kokenNe', 'anne', 'Annemin ailesi')}${opt('kokenNe', 'dede', 'Dedem milli oynadı')}</div>` : ''}
  <div class="lbl">Milli takım tercihin</div><div class="chips">${ntOpts.map(x => `<button class="chip ${NC.nt === x ? 'on' : ''}" onclick="NC.nt='${x}';newScr()">${x}</button>`).join('')}<button class="chip ${!NC.nt ? 'on' : ''}" onclick="NC.nt=null;newScr()">Sonra karar veririm</button></div>
  </div>
  <div class="card"><div class="eyebrow">2/3 Futbolcu</div>
  <div class="lbl">Mevki</div><div class="chips">${opt('pos', 'FW', 'Forvet')}${opt('pos', 'MF', 'Orta saha')}${opt('pos', 'DF', 'Defans')}</div>
  <div class="lbl">Oyun tarzı</div><div class="chips">${Object.entries(STYLES[NC.pos]).map(([k, v]) => opt('st', k, v[0])).join('')}</div>
  <div class="lbl">Kullandığın ayak</div><div class="chips">${opt('ayak', 'sag', 'Sağ')}${opt('ayak', 'sol', 'Sol')}${opt('ayak', 'iki', 'İki ayak (nadir)')}</div>
  <div class="lbl">Fiziksel yapı</div><div class="chips">${opt('yapi', 'uz', 'Uzun ve güçlü')}${opt('yapi', 'de', 'Dengeli')}${opt('yapi', 'ce', 'Çevik')}</div>
  <div class="m">Seçtiğin tarz ve yapı, çocukluğundan itibaren hangi özelliklerinin daha hızlı gelişeceğini belirler.</div></div>
  <div class="card"><div class="eyebrow">3/3 Hayat</div>
  <div class="lbl">Ailenin durumu</div><div class="chips">${opt('aile', 'r', 'Rastgele')}${opt('aile', '1', 'Yoksul')}${opt('aile', '3', 'Orta halli')}${opt('aile', '5', 'Varlıklı')}</div>
  <div class="m">Yoksulluk hırs verir ama imkân kısıtlıdır; varlıklı aile iyi akademilere kapı açar.</div>
  <div class="lbl">Kişilik</div><div class="chips">${opt('kis', 'am', 'Hırslı')}${opt('kis', 'sa', 'Sadık')}${opt('kis', 'ai', 'Aile insanı')}${opt('kis', 'pa', 'Paraya düşkün')}</div>
  ${clubs.length ? `<label class="lbl" for="nf">Tuttuğun takım</label><select id="nf"><option value="">Şehrimin takımı</option>${clubs.map(c => `<option value="${esc(c)}" ${fav === c ? 'selected' : ''}>${esc(clubName(c))}</option>`).join('')}</select>` : ''}
  <div class="lbl">Çocukluk hayalin</div><div class="chips">${Object.entries(DREAMS).map(([k, v]) => opt('ruya', k, v)).join('')}</div>
  <div class="m">Hayalini gerçekleştirirsen Miras Puanın büyük bonus kazanır. Yeteneğin doğuştan gelir ve her hayatta farklıdır.</div>
  <div class="actions"><button class="btn big" onclick="mk()">Hayata başla</button><button class="btn ghost" onclick="menu()">Geri</button></div></div></div>`; i18nApply($('app'));
}
function mkHeritage(ct) {
  const pool = COUNTRIES.map(c => c.n).concat(NATIONS.map(x => x[0])).filter(n => n !== ct), r = Math.random(), n = r < .4 ? 1 : r < .5 ? 2 : 0, out = [];
  const T = [x => `Babaannen ${x}'${loc(x)} doğmuş; her yaz oradaki akrabalarını ziyaret ederdiniz. Bu yüzden ${x} vatandaşlığın da var.`, x => `Baban gençken ${x}'${loc(x)} çalıştı ve sen orada doğdun; ${x} pasaportun var.`, x => `Annenin ailesi yıllar önce ${x}'${loc(x)}n göç etmiş; ${x} vatandaşlığın hâlâ geçerli.`, x => `Deden bir zamanlar ${x} milli takımında forma giymişti; ailede ${x} sevgisi hiç bitmedi.`, x => `Anneannen ${x}'li; evde onun dilinde ninniler dinleyerek büyüdün.`];
  for (let i = 0; i < n; i++) { const x = P(pool.filter(p => !out.some(o => o.ct === p))); out.push({ ct: x, why: P(T)(x) }); }
  return out;
}
function mk() {
  const nm0 = $('nn').value.trim().replace(/\s+/g, ' ');
  if (nm0.length < 2) { toast('Önce karakterinin adını yaz'); const i = $('nn'); if (i) { i.focus(); i.classList.add('err'); i.scrollIntoView({ block: 'center' }); } return; }
  const name = nm0, birth = $('nc').value || 'Türkiye', ct = ($('ng') && $('ng').value) || (COUNTRIES.some(c => c.n === birth) ? birth : 'Türkiye'), city = $('ny').value.trim() || 'İstanbul', fav = $('nf') ? $('nf').value : '';
  g = newState({ name, ct, city, pos: NC.pos });
  g.birth = birth; g.style = NC.st; g.foot = NC.ayak; g.dream = NC.ruya;
  if (NC.yapi === 'uz') { g.st.fiz += 3; g.st.hiz -= 1; } else if (NC.yapi === 'ce') { g.st.hiz += 3; g.st.tek += 1; g.st.fiz -= 2; }
  if (NC.ayak === 'iki') { g.st.tek += 2; g.pot = Math.min(99, g.pot + 1); } else if (NC.ayak === 'sol') { g.st.pas += 1; g.flags.solak = 1; }
  if (NC.kis) g.val[NC.kis] = 66;
  if (NC.aile !== 'r') { g.fam.lv = +NC.aile; } if (g.fam.lv <= 1) g.val.am = Math.min(80, g.val.am + 8);
  genWorld(); M = null; S = null;
  const hc = homeClubFor(city, ct); g.homeClub = hc ? hc.id : null;
  if (fav) { const fc = Object.values(CI).map(x => x.c).find(c => c.n === fav); if (fc) g.favClub = fc.id; } else g.favClub = g.homeClub;
  g.nats = NC.koken === 'yok' ? [] : NC.koken === 'r' ? mkHeritage(ct) : [{ ct: NC.koken, why: ORIGIN_T[NC.kokenNe](NC.koken) }];
  if (birth !== ct && !g.nats.some(n => n.ct === birth)) g.nats.unshift({ ct: birth, why: `${birth}'${loc(birth)} doğdun; ailen sen küçükken ${ct}'${loc(ct)} taşındı.` });
  g.nats = g.nats.filter(n => n.ct !== ct);
  if (NC.nt) { g.ntc = NC.nt === ct ? null : NC.nt; g.ntPick = 1; }
  g.nats.forEach(n => g.story.unshift({ a: 0, t: n.why }));
  if (Math.random() < .4) addFriend('çocukluk', 65);
  const opening = P([`${city}'${loc(city)}, ${HOME[g.fam.lv]} büyüdün.`, `Gözlerini ${city}'${loc(city)} açtın; ilk evin ${HOME[g.fam.lv]} idi.`, `${P(['Karlı bir kış', 'Yağmurlu bir bahar', 'Sıcak bir yaz', 'Serin bir sonbahar'])} gününde ${city}'${loc(city)} dünyaya geldin. Çocukluğun ${HOME[g.fam.lv]} geçti.`]);
  const txt = `${opening} Baban ${g.fam.father.n} ${JOBS[g.fam.lv][0]}, annen ${g.fam.mother.n} ${JOBS[g.fam.lv][1]}.${g.fam.sibs.filter(s => s.age > 0).length ? ' Seni evde ' + g.fam.sibs.filter(s => s.age > 0).map(s => s.n).join(' ve ') + ' karşıladı.' : ''}${hc ? ` Şehrin takımı ${clubName(hc.n)}.` : ''}${g.favClub && club(g.favClub) ? ` Evde herkes ${clubName(club(g.favClub).n)} tutuyor.` : ''} Hayalin: ${DREAMS[g.dream].toLocaleLowerCase('tr')}.`;
  g.story.unshift({ a: 0, t: txt }); L(txt);
  scr = 'game'; tab = 'home'; sv(); draw();
}

/* ---------- Olay kartları ---------- */
function evCard() {
  if (g.kchat) return kidChatCard();
  if (g.q) { const d = msDef(g.q); if (!d) { g.q = null; return ''; } return `<div class="card q"><div class="eyebrow gold">${esc(d.t)}</div><p class="lead">${esc(d.d)}</p><div class="opts">${visOpts(d.c).map((c, i) => `<button class="opt" onclick="answerQ(${i})"><b>${esc(optLabel(c))}</b><span>${esc(c.d || '')}</span></button>`).join('')}</div></div>`; }
  if (g.ev) { const d = EVMAP[g.ev.id]; if (!d) { g.ev = null; return ''; } const o = evOptions(g.ev); return `<div class="card q"><div class="eyebrow">${g.ev.id === 'ntcall' ? 'Milli takım' : 'Hayatından bir an'}</div><p class="lead">${esc(g.ev.t)}</p><div class="opts">${o.map((c, i) => `<button class="opt" onclick="choose(${i})"><b>${esc(optLabel(c, g.ev.x))}</b>${c.d ? `<span>${esc(c.d)}</span>` : ''}</button>`).join('') || `<button class="opt" onclick="choose(0)"><b>Devam</b></button>`}</div></div>`; }
  if (g.press && g.coach && PRESS[g.press]) { const p = PRESS[g.press]; return `<div class="card q"><div class="eyebrow gold">Basın toplantısı</div><p class="lead">${esc(p.t)}</p><div class="opts">${p.c.map((x, i) => `<button class="opt" onclick="pressAnswer(${i})"><b>${esc(x[0])}</b></button>`).join('')}</div></div>`; }
  if (g.cev && g.coach) { const e = cevText(); if (e) return `<div class="card q"><div class="eyebrow gold">Soyunma odası</div><p class="lead">${esc(e.t)}</p><div class="opts">${e.c.map((c, i) => `<button class="opt" onclick="cevAnswer(${i})"><b>${esc(c[0])}</b></button>`).join('')}</div></div>`; }
  if (g.cjob) { const o = g.cjob; return `<div class="card q"><div class="eyebrow gold">Sürpriz teklif</div><p class="lead">${clubKit(o.id)}<b>${esc(clubName(o.n))}</b> (${esc(tierName(o.ct, o.t))}, güç ${o.s}) seni hemen teknik direktör olarak istiyor. Maaş ${fm(o.sal)}/yıl, ${o.yrs} yıl, transfer bütçesi ${fm(o.bud)}. Bonservisini kulüp ödeyecek.</p><div class="actions"><button class="btn" onclick="cjobAnswer(1)">Kabul et</button><button class="btn ghost" onclick="cjobAnswer(0)">Kulübüme sadığım</button></div></div>`; }
  return '';
}
const busy = () => !!(g.q || g.ev || (g.press && g.coach) || g.cjob || (g.cev && g.coach));

/* ---------- Ana sekme ---------- */
function homeUI() {
  if (g.phase === 'child') {
    const ev = evCard();
    return `${ev}<div class="card"><div class="eyebrow">Hikâyen</div>${g.story.slice(0, 6).map((s, i) => `<div class="story ${i ? 'old' : ''}"><b>${s.a} yaş</b><p>${esc(s.t)}</p></div>`).join('')}
    ${ev ? '' : `<div class="actions"><button class="btn big" onclick="childYear()">${g.age >= 15 ? '16 yaşına gir' : 'Yılı yaşa'}</button></div>`}</div>
    ${g.age >= 4 ? `<div class="card"><div class="eyebrow">Gelişimin</div>${statRows(false)}<div class="m">Potansiyel: ${potStars()}${g.age >= 8 ? ' · ' + ARCS[g.arc] + ' gelişim' : ''} · ${g.acad && g.acadClub ? `${['', 'Yerel altyapı', 'Büyük kulüp altyapısı', 'Yurtdışı akademi'][g.acad]}: ${esc(clubName(g.acadClub.n))}` : 'Altyapıda değilsin'}</div></div>` : ''}
    ${friendsCard()}${qsCard()}`;
  }
  const und = UNDO ? `<div class="undo"><span class="m">Son karar: ${esc(undoLbl())}</span><button class="lnk" onclick="undoLast()">↶ Geri al (🪙30)</button></div>` : '';
  if (g.phase === 'pro0') return `${evCard()}<div class="card"><p class="lead">Profesyonel kariyerin başlamak üzere.</p><button class="btn big" onclick="startOffers('16')">Teklifleri gör</button></div>`;
  if (g.phase === 'retired') return und + retiredHome();
  if (g.phase === 'coach') return und + coachHome();
  if (g.phase === 'free') return und + freeHome();
  return und + proHome();
}
function freeHome() {
  return `${evCard()}<div class="card"><div class="eyebrow">Serbest oyuncu · ${g.season} · hafta ${g.week}</div><p class="lead">Bir kulübün yok. Formunu korumak için kendi başına çalış, istersen bir işte çalış; teklifler her an gelebilir.</p>${enLine()}
  ${busy() ? '' : `<div class="actions"><button class="btn big" onclick="startOffers('free')">Teklifleri gör</button><button class="btn ghost" onclick="freeWeek()">Haftayı geç</button></div>`}${g.age >= 30 ? `<button class="btn ghost danger" onclick="ask('Futbolu bırakmak istediğine emin misin?', retire)">Futbolu bırak</button>` : ''}</div>${statusCard()}`;
}
function freeWeek() {
  if (busy()) return toast('Önce karar vermen gereken bir durum var');
  g.tw++; K.forEach(k => xpAdd(k, .02)); payWeek(); relWeek(); restLeft(); g.fit = clr(g.fit + 5, 0, 100);
  g.week++; g.en = enMax(); g.wa = {};
  if (Math.random() < .15) g.ev = pickAdultEvent();
  if (g.week > SEASON_W) return seasonEnd();
  if (Math.random() < .18) return startOffers('free');
  sv(); draw();
}
function enLine() { return `<div class="enl"><span>Enerji</span>${bar(g.en, enMax(), g.en < 20 ? 'bad' : '')}<b>${Math.round(g.en)}/${Math.round(enMax())}</b><button class="lnk" onclick="setTab('en')">Harca</button></div><div class="m">Harcamadığın enerji hafta sonunda dinlenmeye döner (her 10⚡ = +2 kondisyon).${g.lastRest != null ? ` Geçen hafta ${g.lastRest}⚡ dinlenmeye gitti.` : ''}</div>`; }
function statusCard() {
  return `<div class="card"><div class="grid3"><div class="kpi"><span>Form</span><b>${g.form.toFixed(1)}</b>${bar(g.form, 10)}</div><div class="kpi"><span>Kondisyon</span><b>${g.fit}</b>${bar(g.fit, 100, g.fit < 45 ? 'bad' : '')}</div><div class="kpi"><span>Moral</span><b>${g.mor}</b>${bar(g.mor, 100)}</div></div>
  ${g.club ? `<div class="prow"><span>Takım uyumu</span>${bar(g.uyum, 100)}<b>${Math.round(g.uyum)}</b></div>` : ''}${g.sf ? `<div class="m">Sezon havası: ${g.sf >= 2 ? 'her şey yolunda gidiyor 🔥' : g.sf <= -2 ? 'zor bir sezon, hiçbir şey tutmuyor' : g.sf > 0 ? 'iyi gidiyor' : 'biraz durgun'}</div>` : ''}${g.inj > 0 ? `<div class="warn">Sakatsın: ${g.inj} hafta</div>${g.inj > 1 ? `<div class="actions"><button class="btn ghost" onclick="adInjury()">📺 Tedaviyi hızlandır</button><button class="btn ghost" onclick="buyHeal()">🪙25 özel klinik</button></div>` : ''}` : ''}</div>`;
}
function matchCardHTML(o, sel, btns) {
  const oc = o.oid ? club(o.oid) : null, myId = myClubId();
  const st = !sel ? '' : sel.out ? `<span class="tag r0">Kadroda yok</span> <span class="m">${esc(sel.why)}</span>` : sel.start ? `<span class="tag r4">İlk 11</span>` : `<span class="tag r2">Yedek</span> <span class="m">Tahmini giriş ${sel.on}'</span>`;
  return `<div class="mcard"><div class="mc-h"><span class="ctag c-${o.short}">${esc(o.comp)}</span><span class="m">${esc(o.round)}${o.neutral ? ' · tarafsız saha' : o.home ? ' · iç saha' : ' · deplasman'} · ${WX[o.wx || 'acik'].i} ${WX[o.wx || 'acik'].n}</span></div>
  <div class="mc-t"><div>${o.nt ? kit(...(NTCOL[ntCt()] || ['#333', '#fff'])) : clubKit(myId)}<b>${esc(o.nt ? ntCt() + (o.u21 ? ' U21' : '') : clubName(club(myId).n))}</b><span class="m">güç ${o.nt ? Math.round(ntStr(ntCt()) - (o.u21 ? 9 : 0)) : club(myId).s}</span></div><span class="vs">VS</span><div>${o.nt ? kit(...(NTCOL[o.on] || ['#555', '#fff'])) : clubKit(o.oid)}<b>${esc(o.on)}</b><span class="m">güç ${o.nt ? Math.round(ntStr(o.on)) : oc ? oc.s : '—'}${oc && g.prev && g.prev[oc.id] ? ` · geçen sezon ${g.prev[oc.id]}.` : ''}</span></div></div>
  ${st ? `<div class="mc-s">${st}</div>` : ''}<div class="actions">${btns}</div></div>`;
}
function proHome() {
  const ev = evCard(), seasonLbl = `${g.season}/${String(g.season + 1).slice(2)}`;
  let wk = `<div class="card"><div class="row-b"><div class="eyebrow">${seasonLbl} sezonu · Hafta ${g.week}/${SEASON_W}</div>${g.club ? roleTag(g.role) : ''}</div>`;
  const thisW = g.cal.filter(e => e.w === g.week).map(e => ({ e, i: entryInfo(e) })).filter(x => x.i);
  if (!g.wstage) {
    wk += thisW.length ? thisW.map(({ i }) => `<div class="fx"><span class="ctag c-${i.short}">${i.short}</span><span class="fxn">${i.home ? '' : '@ '}${esc(i.on)}</span>${wxI(i.wx)}<span class="m">${esc(i.round)}</span></div>`).join('') : '<p class="m">Bu hafta maç yok. Antrenman ve hayatına odaklan.</p>';
    wk += enLine();
    wk += ev ? '' : `<div class="actions"><button class="btn big" onclick="weekGo()">Haftayı başlat</button><button class="btn ghost" onclick="simWeeks(4)">4 hafta simüle et</button><button class="btn ghost" onclick="simWeeks(60)">Sezonu simüle et</button></div>`;
  } else {
    const m = ev ? null : nextWeekMatch();
    if (m) {
      if (!g.cur || g.cur.ci !== g.wq[0]) g.cur = { ci: g.wq[0], sel: selection(m.info) };
      const sel = g.cur.sel;
      wk += matchCardHTML(m.info, sel, `<button class="btn big" onclick="playMatch()">${sel.out ? 'Maçı izle' : 'Maça çık'}</button><button class="btn ghost" onclick="quickWeekMatch()">Hızlı sonuç</button>`);
    } else if (!ev) {
      const gw = g.wk ? Object.entries(g.wk.gain).map(([k, v]) => `<span class="gain">+${v} ${KN[k]}</span>`).join('') + Object.keys(g.wk.loss).map(k => `<span class="gain neg">−${KN[k]}</span>`).join('') : '';
      wk += `<div class="eyebrow">Hafta özeti</div>${(g.wres || []).map(r => `<div class="fx"><span class="ctag c-${r.c}">${r.c}</span><span class="fxn ${r.w > 0 ? 'w' : r.w < 0 ? 'l' : ''}">${esc(r.t)}</span>${r.r ? `<span class="rt">${r.r.toFixed(1)}</span>` : '<span class="m">—</span>'}</div>`).join('') || '<p class="m">Maç oynanmadı.</p>'}
      <div class="gains">${gw || '<span class="m">Bu hafta özelliklerinde değişim olmadı; ilerleme birikiyor.</span>'}</div>${enLine()}<div class="actions"><button class="btn big" onclick="weekEnd()">Sonraki hafta</button></div>`;
    }
  }
  wk += '</div>';
  return ev + wk + statusCard() + miniTable() + newsCard();
}
function weekGo() { if (busy()) return toast('Önce karar vermen gereken bir durum var'); weekStart(); sv(); draw(); }
function miniTable() {
  if (!g.lg) return ''; const T = sortT(g.lg.teams), me = T.findIndex(x => x.id === myClubId());
  const rows = T.map((x, i) => ({ x, i })).filter(({ i }) => i < 4 || Math.abs(i - me) <= 1 || i >= T.length - 3);
  return `<div class="card"><div class="row-b"><div class="eyebrow">${esc(tierName(g.lg.ct, g.lg.t))}</div><button class="lnk" onclick="FIXV='lg';setTab('fix')">Tüm tablo</button></div><table class="tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>Av</th><th>P</th></tr>${rows.map(({ x, i }) => `<tr class="${x.id === myClubId() ? 'me' : ''} ${i < cinfo(g.lg.ct).euro && g.lg.t === 1 ? 'eu' : ''} ${i >= T.length - 3 && g.lg.t < g.w[g.lg.ct].length ? 'rel' : ''}"><td>${i + 1}</td><td>${esc(clubName(x.n))}${rvOn() && g.rv.club.id === x.id ? ' <span class="rvm">⚔</span>' : ''}</td><td>${x.W + x.D + x.L}</td><td>${x.GF - x.GA}</td><td><b>${x.pt}</b></td></tr>`).join('')}</table></div>`;
}
const newsCard = () => g.news.length ? `<div class="card"><div class="eyebrow">Futbol dünyasından</div><ul class="news">${g.news.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
const potStars = () => stars(cl(Math.ceil((g.pot - 40) / 12), 1, 5));
function qsCard() { return g.qs.length ? `<div class="card"><div class="eyebrow">Dönüm noktaların</div>${g.qs.map(q => `<div class="kv"><span>${q.a} yaş · ${esc(q.t)}</span><b>${esc(q.c)}</b></div>`).join('')}</div>` : ''; }
function statRows(showXp) { return `<div class="stats">${K.map(k => `<div class="srow"><span>${KN[k]}</span>${bar(g.st[k], 99)}<b>${g.st[k]}</b>${showXp ? `<i class="xp" style="--p:${Math.round(cl(g.xp[k], 0, 1) * 100)}%"></i>` : ''}</div>`).join('')}</div>`; }

/* ---------- Enerji ---------- */
function enUI() {
  const groups = {}; ACTS.forEach(a => { if (a.if && !a.if()) return; (groups[a.g] = groups[a.g] || []).push(a); });
  const per = g.phase === 'retired' ? 'Bu yıl' : 'Bu hafta';
  let h = `<div class="card"><div class="eyebrow">${per} enerjin</div><div class="enl big2"><span>⚡</span>${bar(g.en, enMax(), g.en < 20 ? 'bad' : '')}<b>${Math.round(g.en)}/${Math.round(enMax())}</b></div>
  <p class="m">Enerji ${g.phase === 'retired' ? 'her yıl' : 'her hafta'} dolar. Aşağıdaki işlere sen harcarsın; her iş bir şey kazandırır, bir şeyden götürür. <b>Harcamadığın enerji dinlenmeye döner</b> (her 10⚡ = +2 kondisyon). Maçlar enerji harcamaz ama kondisyon düşürür.${g.phase === 'retired' ? ' Emeklilikte her iş bir yıllık etki yaratır.' : ''}</p>
  ${g.en < 20 && g.phase !== 'child' ? `<div class="actions"><button class="btn ghost" onclick="adEnergy()">📺 Reklam izle +25⚡</button><button class="btn ghost" onclick="buyEnergy()">🪙15 → +25⚡</button></div>` : ''}<div class="lbl">Hızlı plan · tek dokunuşla doldur</div><div class="chips">${Object.keys(PLAN).map(n => `<button class="chip" onclick="autoPlan('${n}')">${{ 'Gelişim': '🏋 Gelişim', 'Dengeli': '⚖ Dengeli', 'Aile': '❤ Aile', 'Dinlen': '😴 Dinlen' }[n]}</button>`).join('')}</div>
  <div class="lbl">Simülasyonda kullanılacak plan</div><div class="chips">${Object.keys(PLAN).map(n => `<button class="chip ${(g.routine || 'Dengeli') === n ? 'on' : ''}" onclick="g.routine='${n}';sv();draw()">${n}</button>`).join('')}</div>
  ${g.phase !== 'child' && g.phase !== 'retired' && g.phase !== 'coach' ? `<div class="lbl">Ana antrenman odağın</div><div class="chips">${K.map(k => `<button class="chip ${(g.focus || (g.pos === 'DF' ? 'def' : g.pos === 'MF' ? 'pas' : 'sut')) === k ? 'on' : ''}" onclick="g.focus='${k}';sv();draw()">${KN[k]}</button>`).join('')}</div>` : ''}</div>`;
  for (const gr in groups) h += `<div class="card"><div class="eyebrow">${gr}</div>${groups[gr].map(a => { const why = canAct(a), used = (g.wa || {})[a.id] || 0; return `<button class="act ${why ? 'dis' : ''}" onclick="doAct('${a.id}')"><div><b>${esc(actVal(a, 'n'))}</b><span>${esc(actVal(a, 'd') || '')}${a.cost ? ` · ${fm(actCost(a))}` : ''}</span></div><div class="ac"><b>⚡${actVal(a, 'en')}</b><span>${used}/${a.max || 1}</span></div></button>`; }).join('')}</div>`;
  if (g.licYr) h += `<div class="card"><div class="eyebrow">${LIC[g.lic + 1]} kursu</div><div class="prow"><span>Dersler</span>${bar(g.licP || 0, LIC_N[g.lic + 1])}<b>${g.licP || 0}/${LIC_N[g.lic + 1]}</b></div><div class="m">“Kurs dersine çalış” eylemiyle ilerler.${g.phase === 'retired' ? ' Emeklilikte yıl sonunda kendiliğinden tamamlanır.' : ''}</div></div>`;
  if (g.phase === 'pro' || g.phase === 'free') h += perksCard();
  if (g.phase !== 'child' && g.phase !== 'retired' && g.phase !== 'coach') h += `<div class="card"><div class="eyebrow">Özellikler</div>${statRows(true)}<div class="m">Potansiyel: ${potStars()} · ${ARCS[g.arc]} gelişim · Yaş çarpanı ×${ageF(g.age).toFixed(2)}. İnce yeşil çizgi bir sonraki puana ilerlemeyi gösterir.${g.sc.length ? '<br>Kalıcı izler: ' + g.sc.map(x => esc(x.t)).join('; ') : ''}</div></div>${statusCard()}`;
  return h;
}

/* ---------- Fikstür ---------- */
let FIXV = 'cal';
function fixUI() {
  const v = FIXV;
  let h = `<div class="segs">${seg('FIXV', 'cal', 'Takvim', v)}${seg('FIXV', 'lg', 'Lig', v)}${seg('FIXV', 'cup', 'Kupa', v)}${g.euro ? seg('FIXV', 'eu', 'Avrupa', v) : ''}</div>`;
  if (!g.cal.length) return h + '<div class="card"><p class="m">Şu an bir takvimin yok.</p></div>';
  const KN2 = { L: 'Lig', C: 'Kupa', E: 'Avrupa', N: 'Milli' };
  if (v === 'cal') {
    h += `<div class="card"><div class="eyebrow">Sezon takvimi · lig, kupa, Avrupa ve milli maçlar</div>${g.cal.map((e, idx) => {
      const pending = e.w > g.week || (e.w === g.week && (!g.wstage || (g.wq || []).includes(idx)));
      const i = pending ? entryInfo(e) : null;
      if (!i && !e.res) return '';
      const lbl = i ? (i.home ? '' : '@ ') + esc(i.on) : esc(e.opn || '');
      return `<div class="fx ${e.res ? 'done' : ''} ${e.w === g.week ? 'now' : ''}"><span class="wk">H${e.w}</span><span class="ctag c-${KN2[e.k]}">${KN2[e.k]}</span><span class="fxn ${e.w2 > 0 ? 'w' : e.w2 < 0 ? 'l' : ''}">${lbl}${e.res ? ` <b>${esc(e.res)}</b>` : ''}</span>${wxI(e.wx)}${e.my ? `<span class="rt">${(+e.my).toFixed(1)}</span>` : `<span class="m">${i ? esc(i.round) : ''}</span>`}</div>`;
    }).join('') || '<p class="m">Takvim yok.</p>'}</div>`;
  }
  if (v === 'lg' && g.lg) { const T = sortT(g.lg.teams); h += `<div class="card"><div class="eyebrow">${esc(tierName(g.lg.ct, g.lg.t))} · ${g.lg.r}. hafta sonrası</div><div class="tw"><table class="tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>Av</th><th>P</th></tr>${T.map((x, i) => `<tr class="${x.id === myClubId() ? 'me' : ''} ${(i < cinfo(g.lg.ct).euro && g.lg.t === 1) || (i < 3 && g.lg.t > 1) ? 'eu' : ''} ${i >= T.length - 3 && g.lg.t < g.w[g.lg.ct].length ? 'rel' : ''}"><td>${i + 1}</td><td>${clubKit(x.id)}${esc(clubName(x.n))}</td><td>${x.W + x.D + x.L}</td><td>${x.W}</td><td>${x.D}</td><td>${x.L}</td><td>${x.GF - x.GA}</td><td><b>${x.pt}</b></td></tr>`).join('')}</table></div><div class="m legend"><i class="lg-eu"></i> ${g.lg.t === 1 ? 'Avrupa' : 'Terfi'} <i class="lg-rel"></i> Küme düşme</div></div>`; }
  if (v === 'cup' && g.cup) h += `<div class="card"><div class="eyebrow">${esc(g.cup.n)}</div>${CUP_R.map((r, i) => `<div class="kv"><span>${r} · H${CUP_W[i]}</span><b>${i < g.cup.r ? 'Geçildi' : i === g.cup.r && g.cup.alive ? 'Sıradaki' + (g.cup.cur ? ': ' + esc(cname(g.cup.cur)) : '') : !g.cup.alive && i === g.cup.r && !g.cup.won ? 'Elendi' : g.cup.won ? '🏆' : '—'}</b></div>`).join('')}</div>`;
  if (v === 'eu' && g.euro) { const E = g.euro; h += `<div class="card"><div class="eyebrow">${esc(E.n)} · Grup</div><table class="tbl"><tr><th>Takım</th><th>O</th><th>Av</th><th>P</th></tr>${sortT(E.grp).map(x => `<tr class="${x.id === myClubId() ? 'me' : ''}"><td>${esc(clubName(x.n))}</td><td>${x.W + x.D + x.L}</td><td>${x.GF - x.GA}</td><td><b>${x.pt}</b></td></tr>`).join('')}</table>${E.gr >= 6 ? `<div class="m">Eleme turları: ${EU_KR.map((r, i) => `${r}${i < E.ko ? ' ✓' : ''}`).join(' · ')}${E.won ? ' · 🏆' : !E.alive ? ' · elendiniz' : ''}</div>` : ''}</div>`; }
  return h + newsCard();
}

/* ---------- Kariyer ---------- */
function conRows(C, x) {
  const r = [['Yıllık maaş', fm(C.sal)], ['Kalan süre', (C.yrs != null ? C.yrs : '—') + ' sezon'], ['Sözleşmedeki rol', ROLES[C.role] + (C.promise ? ' (garantili)' : '')], ['Maç başı prim', fm(C.app || 0)], ['Gol/asist primi', fm(C.goal || 0)], ['Serbest kalma bedeli', fm(C.rel || 0)], ['Kulüp evi', C.house ? 'Var' : 'Yok'], ['Kulüp aracı', C.car ? 'Var' : 'Yok'], ['İmaj hakları', '%' + (C.img || 0)]];
  if (C.loyal) r.push(['Sadakat primi', fm(C.loyal)]);
  if (x) r.push(['Haftalık net (vergi sonrası)', fm(C.sal / SEASON_W * (1 - cinfo(g.club ? g.club.ct : g.ct).tax - agentCut()))]);
  return `<div class="kvs">${r.map(([a, b]) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
}
function carUI() {
  const c = g.club ? club(g.club.id) : null, C = g.con;
  let h = '';
  if (c) h += `<div class="card clubc" style="--c1:${c.c1};--c2:${c.c2}"><div class="row-b"><div><div class="eyebrow">Kulübün${g.loan ? ' · kiralık (ana kulüp: ' + esc(clubName(g.loan.n)) + ')' : ''}${g.acadClub && g.acadClub.id === c.id ? ' · altyapısında yetiştin' : ''}</div><h2>${esc(clubName(c.n))}</h2><div class="m">${esc(tierName(clubCt(c.id), c.t))} · ${esc(clubCt(c.id))} · Takım gücü ${c.s} · Tesis ${stars(facOf(c))}</div></div>${roleTag(g.role)}</div>
  <div class="kvs"><div class="kv"><span>Forma numaran</span><b>${g.num || '—'}</b></div><div class="kv"><span>Kulüpteki yılın</span><b>${(g.clubYears || 0) + 1}</b></div><div class="kv"><span>Kaptanlık</span><b>${g.captain ? 'Kaptansın' : 'Hayır'}</b></div><div class="kv"><span>Piyasa değerin</span><b>${fm(mValue())}</b></div></div>
  <div class="prow"><span>Uyum</span>${bar(g.uyum, 100)}<b>${Math.round(g.uyum)}</b></div><div class="m">Uyum kulüpte kaldıkça, takımla çalıştıkça ve oynadıkça artar; her transfer sıfıra yakın başlatır. Yüksek uyum performansını ve kaptanlık şansını artırır.</div>
  ${C ? `<div class="eyebrow">Sözleşmen</div>${conRows(C, 1)}` : ''}
  <div class="actions"><button class="btn ghost" onclick="reqTransfer()">${g.wantOut ? 'Transfer talebin iletildi' : 'Transfer talep et'}</button>${g.age <= 23 && !g.loan && g.role <= 2 ? `<button class="btn ghost" onclick="reqLoan()">Kiralık gitmek istiyorum</button>` : ''}${g.age >= 30 ? `<button class="btn ghost danger" onclick="ask('Futbolu bırakmak istediğine emin misin?', retire)">Futbolu bırak</button>` : ''}</div></div>`;
  h += `<div class="card"><div class="eyebrow">Menajer</div><div class="kv"><span>${AGENTS[g.agent].n}</span><b>${g.agent ? 'Komisyon %' + Math.round(agentCut() * 100) : '—'}</b></div><p class="m">Menajer daha çok ve daha iyi teklif getirir, maaşını yükseltir ve pazarlık masasında senin yerine konuşur.</p><div class="chips">${AGENTS.map((a, i) => `<button class="chip ${g.agent === i ? 'on' : ''}" onclick="setAgent(${i})">${a.n}${a.cut ? ' · %' + Math.round(a.cut * 100) : ''}${a.rep && g.rep < a.rep ? ' (ün ' + a.rep + ')' : ''}</button>`).join('')}</div></div>`;
  h += agentCard();
  h += `<div class="card"><div class="eyebrow">Kariyer</div><div class="stats4"><div><b>${g.car.ap}</b>Maç</div><div><b>${g.car.g}</b>Gol</div><div><b>${g.car.a}</b>Asist</div><div><b>${Math.round(g.rep)}</b>Ün</div></div>
  <div class="trophies">${[['Lig', g.car.t], ['Kupa', g.car.cup], ['Ş. Kupası', g.car.ec], ['A. Ligi', g.car.el || 0], ['Altın Top', g.car.bal || 0], ['Gol kr.', g.car.gk || 0], ['Dünya K.', g.ntw.wc], ['Kıta Ş.', g.ntw.rc]].map(([n, v]) => `<div class="tro ${v ? 'on' : ''}"><b>${v}</b><span>${n}</span></div>`).join('')}</div></div>`;
  h += histCard();
  if (g.seasons.length) h += `<div class="card"><div class="eyebrow">Sezon sezon</div><div class="tw"><table class="tbl"><tr><th>Sezon</th><th>Kulüp</th><th>Rol</th><th>M</th><th>G</th><th>A</th><th>Ort.</th></tr>${g.seasons.map(s => `<tr><td>${s.y}</td><td>${esc(s.c === '—' ? s.c : clubName(s.c))}</td><td>${s.role}</td><td>${s.ap}</td><td>${s.g}</td><td>${s.a}</td><td>${s.r || '—'}</td></tr>`).join('')}</table></div></div>`;
  h += ntCard();
  if (g.phase !== 'retired' && g.phase !== 'coach' && g.age >= 24) h += licCard();
  h += rvCard();
  return h;
}
function ntCard() {
  const nc = ntCt(), lv = g.club ? ntLevel() : null, nd = natNeed(nc), v = Math.round(ovr() + (g.form - 6.5) * 2);
  const opts = [{ ct: g.ct, why: 'Doğduğun ülke.' }].concat(g.nats || []);
  return `<div class="card"><div class="eyebrow">Milli takım</div><div class="row-b"><div>${kit(...(NTCOL[nc] || ['#333', '#fff']))}<b class="h3">${esc(nc)}</b>${g.ntLock ? ' <span class="tag r3">Kesin</span>' : ''}</div><span class="m">${lv === 'A' ? 'A takım seviyesindesin' : lv === 'U21' ? 'U21 seviyesindesin' : g.ntRet ? 'Milli takımı bıraktın' : 'Kadro dışı'}</span></div>
  <div class="kvs"><div class="kv"><span>A takım</span><b>${g.nat.caps} maç · ${g.nat.g} gol</b></div><div class="kv"><span>U21</span><b>${g.nat.u21 || 0} maç · ${g.nat.u21g || 0} gol</b></div><div class="kv"><span>Seçilme eşiği</span><b>~${Math.round(nd)} (sen ${v})</b></div><div class="kv"><span>Milli takım gücü</span><b>${Math.round(ntStr(nc))}</b></div></div>
  ${opts.length > 1 ? `<div class="eyebrow">Oynayabileceğin ülkeler</div>${opts.map(o => `<div class="kv"><span>${esc(o.ct)}${o.ct === nc ? ' ✓' : ''}</span><b class="m">${esc(o.why)}</b></div>`).join('')}<div class="m">${g.ntLock ? 'Resmi maça çıktığın için seçimin kesinleşti.' : 'Bir ülkeyle resmi maça çıkana kadar diğer federasyonlar seni davet edebilir.'}</div>` : ''}
  ${g.ntRet && g.phase === 'pro' && g.age < 35 ? `<button class="btn ghost" onclick="g.ntRet=0;L('Milli takıma dönüş kapısını açtın.');sv();draw()">Milli takıma dön</button>` : ''}
  ${g.trh.length ? `<div class="eyebrow">Turnuvalar</div>${g.trh.slice(0, 6).map(x => `<div class="kv"><span>${x.y} ${esc(x.n)}</span><b>${esc(x.r)}</b></div>`).join('')}` : ''}<div class="m">Milli maçlar 10, 20 ve 31. haftalarda oynanır; çağrıldığında katılıp katılmamak senin kararın. Maçları kendin oynayabilirsin.</div></div>`;
}
function reqTransfer() { if (g.wantOut) return toast('Talebin zaten masada'); g.wantOut = 1; g.mor = clr(g.mor - 3, 0, 100); g.uyum = clr(g.uyum - 5, 0, 100); L('Kulübüne transfer talebini ilettin.'); toast('Transfer talebin iletildi'); sv(); draw(); }
function setAgent(i) { const a = AGENTS[i]; if (a.rep && g.rep < a.rep) return toast(`Bu menajer için ün ${a.rep} gerekli (senin ${Math.round(g.rep)})`); g.agent = i; L(`${a.n} ile anlaştın.`); toast(a.n); sv(); draw(); }
function perksCard() {
  const P2 = g.perks || {}, got = Object.keys(PERKS).filter(k => P2[k]);
  return `<div class="card"><div class="eyebrow">Özel yetenekler · ${got.length}/${Object.keys(PERKS).length}</div><div class="perks">${Object.entries(PERKS).map(([k, pk]) => { const pr = (g.perkP || {})[k] || 0; return `<div class="pk ${P2[k] ? 'on' : ''}"><b>${P2[k] ? '✨ ' : ''}${pk.n}</b><span class="m">${P2[k] ? pk.d : `${pr}/${pk.need} çalışma · ${KN[pk.st]} ${g.st[pk.st]}/${pk.min}`}</span>${P2[k] ? '' : bar(pr, pk.need)}</div>`; }).join('')}</div><div class="m">“Özel çalışma” eylemleriyle açılır ve maçta gerçekten etki eder.</div></div>`;
}
function histCard() {
  const H = g.hist; if (!H.length && !g.acadClub) return '';
  const now = g.season, items = [];
  if (g.acadClub) { const ac = club(g.acadClub.id) || g.acadClub; items.push({ acad: 1, c1: ac.c1 || '#555', c2: ac.c2 || '#ddd', n: g.acadClub.n, ct: clubCt(g.acadClub.id) || g.ct, sub: ['', 'Yerel altyapı', 'Büyük kulüp altyapısı', 'Yurtdışı akademi'][g.acad] || 'Altyapı', y: `${g.season - g.age + (g.flags.yurtdisi ? 12 : 12)}–${g.season - g.age + 16}` }); }
  H.forEach(x => { const c = club(x.id); items.push({ x, c1: c ? c.c1 : '#444', c2: c ? c.c2 : '#999', cur: !x.y1 && g.club && g.club.id === x.id }); });
  const totAp = H.reduce((s, x) => s + x.ap, 0) || 1;
  let h = `<div class="card"><div class="eyebrow">Kulüp yolculuğun</div><div class="tl2">`;
  items.forEach((it, i) => {
    if (it.acad) { h += `<div class="tln acad" style="--c1:${it.c1};--c2:${it.c2}"><div class="tld"></div><div class="tlc"><div class="tlh"><b>${esc(clubName(it.n))}</b><span class="tag r2">Altyapı</span></div><div class="m">${esc(it.sub)} · ${esc(it.ct)} · ${it.y}</div>${H[0] && H[0].id === g.acadClub.id ? `<div class="m gold">↓ ${esc(clubName(it.n))} A takımına yükseldin</div>` : H[0] ? `<div class="m">↓ Profesyonel kariyerine ${esc(clubName(H[0].n))} ile başladın</div>` : ''}</div></div>`; return; }
    const x = it.x, c = club(x.id), y1 = x.y1 || now, yrs = Math.max(1, y1 - x.y0 + (x.y1 ? 0 : 1)), share = Math.round(x.ap / totAp * 100);
    h += `<div class="tln ${it.cur ? 'cur' : ''}" style="--c1:${it.c1};--c2:${it.c2}"><div class="tld"></div><div class="tlc">
      <div class="tlh"><b>${esc(clubName(x.n))}</b>${x.num ? `<span class="shirt" style="--c1:${it.c1};--c2:${it.c2}">${x.num}</span>` : ''}</div>
      <div class="m">${x.y0}–${x.y1 || 'bugün'} · ${yrs} sezon · ${esc(x.how || '')}${it.cur ? ' · şu an burada' : ''}</div>
      <div class="tlg"><div><span>Lig</span><b>${esc(tierName(x.ct, x.t))}</b></div><div><span>Ülke</span><b>${esc(x.ct)}</b></div><div><span>O zamanki güç</span><b>${x.s}${c && c.s !== x.s ? ` <i class="${c.s > x.s ? 'pos' : 'neg'}">→ ${c.s}</i>` : ''}</b></div><div><span>Rol</span><b>${ROLES[x.role] || '—'}</b></div></div>
      <div class="tls"><span><b>${x.ap}</b> maç</span><span><b>${x.g}</b> gol</span><span><b>${x.a}</b> asist</span>${x.sal ? `<span><b>${fm(x.sal)}</b>/yıl</span>` : ''}</div>
      <div class="tlbar"><i style="width:${share}%"></i></div></div></div>`;
  });
  return h + '</div><div class="m">Çubuk, o kulüpte oynadığın maçların kariyerindeki payını gösterir.</div></div>';
}
function rvCard() {
  const r = g.rv; if (!r) return '';
  const me = { k: g.club ? clubName(g.club.n) : g.phase === 'retired' ? 'Emekli' : 'Kulüpsüz', o: ovr(), ap: g.car.ap, g: g.car.g, t: g.car.t, nat: g.nat.caps }, he = { k: r.ret ? 'Emekli' : r.club ? clubName(r.club.n) : 'Kulüpsüz', o: r.o, ap: r.ap, g: r.g, t: r.t, nat: r.nat };
  return `<div class="card"><div class="eyebrow">⚔ Yaşayan rakip</div><h3>${esc(r.n)}</h3><div class="m">${POSN[r.pos]} · ${esc(r.ct)}${r.dost ? ' · artık dostsunuz' : ''}</div><table class="tbl"><tr><th></th><th>Sen</th><th>${esc(r.n.split(' ')[0])}</th></tr>${[['Kulüp', 'k'], ['Genel', 'o'], ['Maç', 'ap'], ['Gol', 'g'], ['Şampiyonluk', 't'], ['Milli maç', 'nat']].map(([l, k]) => `<tr><td>${l}</td><td>${esc(me[k])}</td><td>${esc(he[k])}</td></tr>`).join('')}</table></div>`;
}
function licCard() {
  const n = (g.lic || 0) + 1;
  return `<div class="card"><div class="eyebrow">Antrenörlük lisansı</div><div class="lics">${LIC.slice(1).map((x, i) => `<div class="lic ${g.lic > i ? 'on' : g.licYr && g.lic === i ? 'now' : ''}">${x}</div>`).join('')}</div>
  <p class="m">Kurs ücretini öde, sonra “Kurs dersine çalış” eylemiyle dersleri tamamla (oynarken de olur). 3. lig için C, 2. lig için B, 1. lig için A, büyük kulüpler için Pro gerekir.${g.edu ? ' Eğitimin kurs ücretini düşürüyor.' : ''}</p>
  ${g.licYr ? `<div class="prow"><span>${LIC[n]} dersleri</span>${bar(g.licP || 0, LIC_N[n])}<b>${g.licP || 0}/${LIC_N[n]}</b></div><button class="btn ghost" onclick="doAct('is_kurs')">Ders çalış (⚡12)</button>` : n <= 4 ? `<button class="btn" onclick="licStart()">${LIC[n]} kursuna yazıl · ${fm(licCost(n))}</button>` : '<div class="m">En üst lisansa sahipsin.</div>'}</div>`;
}

/* ---------- Yaşam ---------- */
function friendsCard() {
  const F = g.friends || []; if (!F.length) return '';
  const tw = g.tw || 0;
  return `<div class="card"><div class="eyebrow">Arkadaşların</div>${F.map((f, i) => { const since = g.phase === 'child' ? 0 : tw - ((g.touch || {})['f' + i] || 0); return `<div class="person"><div><b>${esc(f.n)}</b><span class="m">${esc(f.type || 'arkadaş')} · ${f.since || 0} yaşından beri${f.dead ? ' · hayatını kaybetti' : since > 6 ? ` · ${since} haftadır görüşmediniz` : ''}</span></div>${f.dead ? '' : bar(f.rel, 100, f.rel < 35 ? 'bad' : '')}</div>`; }).join('')}${g.phase !== 'child' ? `<button class="btn ghost" onclick="doAct('ev_arkadas')">Arkadaşlarınla buluş (⚡8)</button>` : ''}<div class="m">Vakit ayırmadığın ilişkiler zamanla zayıflar.</div></div>`;
}
let LIFEV = 'aile';
function lifeUI() {
  const F = g.fam, tw = g.tw || 0, since = k => tw - ((g.touch || {})[k] || 0);
  let h = evCard();
  if (g.phase === 'child') {
    h += `<div class="card"><div class="eyebrow">Ailen · ${FAMW[F.lv]}</div>${[[F.father, 'Baban'], [F.mother, 'Annen']].map(([p, l]) => `<div class="person"><div><b>${esc(p.n)}</b><span class="m">${l} · ${p.alive ? p.age + ' yaş' : 'hayatını kaybetti'}</span></div>${p.alive ? bar(p.rel, 100) : ''}</div>`).join('')}${F.sibs.filter(s => s.age >= 0).map(s => `<div class="person"><div><b>${esc(s.n)}</b><span class="m">${s.g === 'E' ? 'Erkek' : 'Kız'} kardeş · ${s.age} yaş</span></div>${bar(s.rel, 100)}</div>`).join('')}</div>${friendsCard()}`;
    return h + innerCard();
  }
  h += `<div class="segs">${seg('LIFEV', 'aile', 'Aile', LIFEV)}${seg('LIFEV', 'ev', 'Ev ve yaşam', LIFEV)}${seg('LIFEV', 'is', 'İş', LIFEV)}${seg('LIFEV', 'ben', 'Ben', LIFEV)}</div>`;
  if (LIFEV === 'aile') {
    h += `<div class="card"><div class="eyebrow">Anne, baba, kardeşler</div>${[[F.father, 'Baban'], [F.mother, 'Annen']].map(([p, l]) => `<div class="person"><div><b>${esc(p.n)}</b><span class="m">${l} · ${p.alive ? p.age + ' yaş' + (since('par') > 6 && g.phase !== 'child' ? ` · ${since('par')} haftadır görmedin` : '') : 'hayatını kaybetti'}</span></div>${p.alive ? bar(p.rel, 100, p.rel < 35 ? 'bad' : '') : ''}</div>`).join('')}
    ${F.sibs.filter(s => s.age >= 0).map(s => `<div class="person"><div><b>${esc(s.n)}</b><span class="m">${s.g === 'E' ? 'Erkek' : 'Kız'} kardeş · ${s.age} yaş</span></div>${bar(s.rel, 100)}</div>`).join('')}
    <div class="actions">${aliveParent().length ? `<button class="btn ghost" onclick="doAct('ev_aile')">Ziyaret et (⚡10)</button>` : ''}${F.sibs.some(s => s.age > 10) ? `<button class="btn ghost" onclick="doAct('ev_kardes')">Kardeşlerinle buluş (⚡6)</button>` : ''}${aliveParent().length ? `<button class="btn ghost" onclick="setParentSupport(${g.parentSupport ? 0 : 6})">${g.parentSupport ? 'Aile desteğini kes' : 'Ailene yıllık destek ver (' + fm(Math.round(6 * cinfo(g.ct).e)) + ')'}</button>` : ''}</div></div>`;
    h += `<div class="card"><div class="eyebrow">Partner ve çocuklar</div>${F.partner ? `<div class="person"><div><b>${esc(F.partner.n)}</b><span class="m">${{ flört: 'Flört', sevgili: 'Sevgilin', evli: 'Eşin' }[F.partner.st] || 'Partnerin'} · ${F.partner.y || 0} yıl${since('p') > 4 ? ` · ${since('p')} haftadır baş başa vakit geçirmediniz` : ''}</span></div>${bar(F.partner.rel, 100, F.partner.rel < 35 ? 'bad' : '')}</div>${F.partner.tr ? `<div class="m">${esc(F.partner.job || '')}${F.partner.tr ? ' · ' + PTRAIT[F.partner.tr].n : ''}${F.partner.how ? ' · tanışma: ' + esc(F.partner.how) : ''}${F.partner.far ? ' · şu an uzak mesafe' : ''}${F.partner.kriz ? ' · <span class="neg">ilişkide kriz var</span>' : ''}</div>` : ''}${(F.partner.mem || []).length ? `<div class="mems">${F.partner.mem.slice(0, 5).map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}<div class="actions"><button class="btn ghost" onclick="doAct('ev_partner')">Akşam yemeği (⚡8)</button><button class="btn ghost" onclick="trip()">Birlikte tatile çık (${fm(tripCost())})</button>${F.partner.st === 'sevgili' && (F.partner.y || 0) >= 1 ? `<button class="btn ghost" onclick="propose()">Evlenme teklif et</button>` : ''}</div>` : `<p class="m">Şu an bir ilişkin yok.</p>${g.age >= 18 ? `<button class="btn ghost" onclick="doAct('ev_tanis')">Dışarı çık, yeni insanlarla tanış (⚡10)</button>` : ''}`}
    ${F.kids.map((k, i) => `<div class="person"><div><b>${esc(k.n)}</b><span class="m">${k.g === 'E' ? 'Oğlun' : 'Kızın'} · ${k.age} yaş · futbol yeteneği ${k.scouted ? k.tal + ' (gerçek: ' + clr(k.tal + (k.path === 'futbol' ? 6 : 0) + (k.acad ? 4 : 0), 1, 99) + ')' : k.tal}${k.acad ? ' · futbol okulunda' : ''}${k.age < 25 && since('k' + i) > 3 ? ` · ${since('k' + i)} haftadır ilgilenmedin` : ''}</span></div>${bar(k.rel || 60, 100, (k.rel || 60) < 35 ? 'bad' : '')}</div><div class="actions tight"><button class="lnk" onclick="kidChat(${i})">💬 Konuş</button>${!k.scouted && k.age >= 6 && k.age <= 20 ? `<button class="lnk" onclick="buyScoutKid(${i})">🔍 Gözlemci (🪙20)</button>` : ''}<button class="lnk" onclick="askText('Yeni isim', g.fam.kids[${i}].n, v=>{if(v&&v.trim()){g.fam.kids[${i}].n=v.trim().slice(0,18);sv();draw();}})">Adını değiştir</button>${k.age >= 5 && k.age <= 15 && !k.acad ? `<button class="lnk" onclick="kidAcad(${i})">Futbol okuluna yazdır</button>` : ''}${canHand() ? `<button class="lnk" onclick="handOver(${i})">Her şeyi ona devret</button>` : ''}</div>`).join('')}
    ${F.kids.some(k => k.age < 25) ? `<button class="btn ghost" onclick="doAct('ev_cocuk')">Çocuklarınla vakit geçir (⚡8)</button>` : ''}</div>`;
    h += friendsCard();
  }
  if (LIFEV === 'ev') {
    const H = HOMES[g.fin.house], e = cinfo(g.ct).e, ex = expenses();
    h += `<div class="card"><div class="eyebrow">Evin</div><h3>${esc(H.n)}</h3><div class="m">${esc(H.d)}${H.rent ? ` · yıllık kira ${fm(Math.round(H.rent * e))}${g.con && g.con.house ? ' (kulüp ödüyor)' : ''}` : ''}${H.up ? ` · bakım ${fm(Math.round(H.up * e))}/yıl` : ''}</div>
    <div class="opts">${HOMES.map((x, i) => i === g.fin.house || (i === 0 && !aliveParent().length) ? '' : `<button class="opt sm" onclick="setHouse(${i})"><b>${esc(x.n)}</b><span>${x.rent ? 'Kira ' + fm(Math.round(x.rent * e)) + '/yıl' : x.buy ? 'Satın al ' + fm(Math.round(x.buy * e)) : 'Ücretsiz'} · ${esc(x.d)}</span></button>`).join('')}</div></div>`;
    h += `<div class="card"><div class="eyebrow">Aracın</div><div class="kv"><span>${esc(CARS[g.fin.car].n)}</span><b>${g.con && g.con.car ? 'Kulüp aracı da var' : ''}</b></div><div class="chips">${CARS.map((c, i) => i === g.fin.car ? '' : `<button class="chip" onclick="setCar(${i})">${c.n}${c.c ? ' · ' + fm(Math.round(c.c * e)) : ''}</button>`).join('')}</div></div>`;
    h += `<div class="card"><div class="eyebrow">Yaşam tarzı</div><div class="chips">${['Tutumlu', 'Normal', 'Lüks'].map((n, i) => `<button class="chip ${(g.lux == null ? 1 : g.lux) === i ? 'on' : ''}" onclick="setLux(${i})">${n}</button>`).join('')}</div><div class="eyebrow">Yıllık giderlerin</div>${ex.items.map(([n, v]) => `<div class="kv"><span>${esc(n)}</span><b class="neg">−${fm(v)}</b></div>`).join('')}<div class="kv"><span><b>Toplam</b></span><b class="neg">−${fm(ex.total)}/yıl</b></div><div class="m">Haftalık ${fm(ex.total / SEASON_W)}. Giderler maaşından her hafta düşer.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Kişisel ekibin</div>${STAFF.map(s => `<div class="asset"><div><b>${s.n}</b><span class="m">${s.d} · yılda ${fm(Math.round(s.c * e))}</span></div><button class="chip ${hasStaff(s.k) ? 'on' : ''}" onclick="toggleStaff('${s.k}')">${hasStaff(s.k) ? 'Çalışıyor · bırak' : 'Tut'}</button></div>`).join('')}</div>`;
  }
  if (LIFEV === 'is') {
    const J = Object.entries(JOBLIST).filter(([k, j]) => j.if());
    h += `<div class="card"><div class="eyebrow">İşin</div>${g.job ? `<div class="kv"><span>${esc(JOBLIST[g.job.k].n)}</span><b>${fm(JOBLIST[g.job.k].pay)}/vardiya</b></div><div class="actions"><button class="btn" onclick="doAct('is_vardiya')">İşe git (⚡${JOBLIST[g.job.k].en})</button><button class="btn ghost danger" onclick="quitJob()">İşten ayrıl</button></div>` : '<p class="m">Şu an bir işin yok.</p>'}
    ${J.length ? `<div class="eyebrow">İş ilanları</div>${J.map(([k, j]) => `<div class="asset"><div><b>${j.n}</b><span class="m">Vardiya başı ${fm(j.pay)} · ⚡${j.en}</span></div><button class="chip ${g.job && g.job.k === k ? 'on' : ''}" onclick="${g.job && g.job.k === k ? "toast('Zaten bu işte çalışıyorsun')" : `takeJob('${k}')`}">${g.job && g.job.k === k ? 'Çalışıyorsun' : 'Başvur'}</button></div>`).join('')}` : `<p class="m">${g.club ? 'Profesyonel futbolcuyken başka işte çalışamazsın; şirketlerin ve yatırımların var.' : 'Şu an uygun ilan yok.'}</p>`}</div>`;
    h += `<div class="card"><div class="eyebrow">Eğitim</div><div class="kv"><span>Eğitim seviyesi</span><b>${g.edu.toFixed ? g.edu.toFixed(1) : g.edu}/5</b></div><p class="m">Eğitim pazarlıkta, kurs ücretlerinde ve iş seçeneklerinde avantaj sağlar. “Kurs dersine çalış” eylemi (lisans kursunda değilken) eğitimi artırır.</p><button class="btn ghost" onclick="doAct('is_kurs')">Ders çalış (⚡12)</button></div>`;
  }
  if (LIFEV === 'ben') { h += innerCard(); h += `<div class="card"><div class="eyebrow">Geçmiş</div><ul class="log">${g.log.slice(0, 40).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`; }
  return h;
}
function innerCard() { const rel = (n, v) => `<div class="prow"><span>${n}</span>${bar(v, 100)}<b>${Math.round(v)}</b></div>`; return `<div class="card"><div class="eyebrow">İç dünyan</div>${rel('Mutluluk', g.hap)}${rel('Sağlık', g.hp)}${rel('Hırs', g.val.am)}${rel('Sadakat', g.val.sa)}${rel('Aile', g.val.ai)}${rel('Para', g.val.pa)}<div class="m">Değerlerin kararlarınla şekillenir ve karşına çıkan olayları değiştirir.</div></div>`; }
const tripCost = () => Math.round((15 + g.fin.house * 6) * cinfo(g.ct).e);
function trip() { const p = g.fam.partner; if (!p) return; const c = tripCost(); if (g.money < c) return toast(`Tatil ${fm(c)}; paran yetmiyor`); if (g.en < 15) return toast('Tatil için en az 15 enerji gerekli'); money(-c, 'Tatil'); g.en -= 15; relAdj(p, 10); touch('p'); g.hap = clr(g.hap + 5, 0, 100); g.fit = clr(g.fit + 5, 0, 100); L(`${p.n} ile tatile çıktınız.`); toast('İyi tatiller!'); sv(); draw(); }
function propose() { const p = g.fam.partner; if (!p) return; if (p.rel >= 55 && Math.random() < .5 + p.rel / 200) { ask(`${p.n} “evet” dedi! Nasıl bir düğün?`, () => { wedding(1); sv(); draw(); }, 'Görkemli düğün'); setTimeout(() => { const d = $('dlg'); if (!d.hidden) d.querySelector('.ghost').textContent = 'Sade nikâh'; dlgF2 = () => { wedding(0); sv(); draw(); }; }, 0); } else { relAdj(p, -8); L(`${p.n} henüz hazır olmadığını söyledi.`); toast('Henüz değil...'); } sv(); draw(); }
let dlgF2 = null; const _dlgEnd = dlgEnd; dlgEnd = function (y) { const f2 = dlgF2; dlgF2 = null; if (!y && f2) { $('dlg').hidden = true; dlgF = null; $('dlg').querySelector('.ghost').textContent = 'Vazgeç'; return f2(); } $('dlg').querySelector('.ghost').textContent = 'Vazgeç'; _dlgEnd(y); };
function kidAcad(i) { const k = g.fam.kids[i], c = famCost(4); if (!k) return; if (g.money < c) return toast('Paran yetmiyor'); money(-c, `${k.n} futbol okulu kaydı`); k.acad = 1; relAdj(k, 5); L(`${k.n} futbol okuluna başladı.`); toast(`${k.n} futbol okulunda`); sv(); draw(); }

/* ---------- Finans ---------- */
let FINV = 'ozet';
function finUI() {
  const v = FINV, e = cinfo(g.ct).e;
  let h = `<div class="segs">${seg('FINV', 'ozet', 'Özet', v)}${seg('FINV', 'port', 'Portföy', v)}${seg('FINV', 'emlak', 'Emlak', v)}${seg('FINV', 'sirket', 'Şirketler', v)}${seg('FINV', 'spons', 'Sponsor', v)}${!g.own && g.age >= 18 ? seg('FINV', 'kulup', 'Kulüp al', v) : ''}</div>`;
  const w = wealth();
  if (v === 'ozet') {
    const H = g.fin.hist[0], ex = expenses(), fy = g.fy || {};
    h += `<div class="card"><div class="eyebrow">Net servet</div><div class="big">${fm(w)}</div><div class="kvs"><div class="kv"><span>Nakit</span><b class="${g.money < 0 ? 'neg' : ''}">${fm(g.money)}</b></div><div class="kv"><span>Portföy</span><b>${fm(portVal())}</b></div><div class="kv"><span>Emlak</span><b>${fm(propVal())}</b></div><div class="kv"><span>Şirketler</span><b>${fm(bizVal())}</b></div><div class="kv"><span>Evin</span><b>${fm(homeVal())}</b></div>${g.own ? `<div class="kv"><span>Kulüp</span><b>${fm(ownVal())}</b></div>` : ''}</div>${g.cri ? '<div class="warn">Ekonomik kriz sürüyor.</div>' : ''}${g.money < 0 ? '<div class="warn">Borçtasın: %12 yıllık faiz işliyor.</div>' : ''}</div>`;
    h += `<div class="card"><div class="eyebrow">Bu yıl şimdiye kadar</div><div class="kvs"><div class="kv"><span>Brüt gelir</span><b class="pos">${fm(fy.inc || 0)}</b></div><div class="kv"><span>Vergi</span><b class="neg">−${fm(fy.tax || 0)}</b></div><div class="kv"><span>Menajer</span><b class="neg">−${fm(fy.agent || 0)}</b></div><div class="kv"><span>Giderler</span><b class="neg">−${fm(fy.exp || 0)}</b></div><div class="kv"><span>…kira</span><b class="neg">−${fm(fy.rent || 0)}</b></div></div></div>`;
    h += `<div class="card"><div class="eyebrow">Hesap hareketleri</div>${(g.ledger || []).length ? `<div class="ledger">${g.ledger.slice(0, 25).map(x => `<div class="lg"><span class="m">${x.y}${x.w ? ' · H' + x.w : ''}</span><span>${esc(shortT(x.k, 48))}</span><b class="${x.v < 0 ? 'neg' : 'pos'}">${x.v > 0 ? '+' : ''}${fm(x.v)}</b></div>`).join('')}</div>` : '<p class="m">Henüz hareket yok.</p>'}<div class="m">Her harcama ve gelir anında nakdinden düşer ya da eklenir. Servet; nakit, yatırım, mülk, şirket ve evinin toplamıdır.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Gider kalemleri (yıllık)</div>${ex.items.map(([n, x]) => `<div class="kv"><span>${esc(n)}</span><b>${fm(x)}</b></div>`).join('')}<div class="kv"><span><b>Toplam</b></span><b class="neg">${fm(ex.total)}</b></div><button class="lnk" onclick="LIFEV='ev';setTab('life')">Evi, aracı ve ekibi değiştir</button></div>`;
    h += `<div class="card"><div class="eyebrow">Geçmiş yıllar</div>${g.fin.hist.length ? `<div class="tw"><table class="tbl"><tr><th>Yıl</th><th>Gelir</th><th>Vergi</th><th>Gider</th><th>Yatırım</th><th>Net</th></tr>${g.fin.hist.map(x => `<tr><td>${x.y}</td><td>${fmShort(x.inc)}</td><td>${fmShort(x.tax)}</td><td>${fmShort(x.exp)}</td><td class="${x.inv < 0 ? 'neg' : 'pos'}">${fmShort(x.inv)}</td><td class="${(x.net || 0) < 0 ? 'neg' : 'pos'}">${fmShort(x.net || 0)}</td></tr>`).join('')}</table></div>` : '<p class="m">İlk yıl sonunda gelir tablon burada görünecek.</p>'}<div class="m">Veraset vergisi (${esc(g.ct)}): %${Math.round(cinfo(g.ct).inh * 100)}.</div></div>`;
  }
  if (v === 'port') h += `<div class="card"><div class="eyebrow">Portföy · nakit ${fm(g.money)}</div>${g.invE ? `<div class="m">Bu yılki araştırma bonusu: +%${(g.invE * .4).toFixed(1)} getiri</div>` : ''}${ASSETS.map(a => `<div class="asset"><div><b>${a.n}</b><span class="m">${a.d} · beklenen getiri ~%${Math.round(a.m * 100)}</span></div><b>${fm(g.fin[a.k])}</b><div class="actions tight"><button class="chip" onclick="invest('${a.k}',g.money*.1)">+%10 nakit</button><button class="chip" onclick="invest('${a.k}',g.money*.25)">+%25</button><button class="chip" onclick="invest('${a.k}',g.money*.5)">+%50</button><button class="chip" onclick="divest('${a.k}')">Bozdur</button></div></div>`).join('')}</div>`;
  if (v === 'emlak') h += `<div class="card"><div class="eyebrow">Mülklerin</div>${g.fin.props.map((p, j) => `<div class="asset"><div><b>${p.n}</b><span class="m">Alış ${fm(p.b)} · kira getirisi %${(PROPS[p.i].y * 100).toFixed(1)} (${fm(p.v * PROPS[p.i].y)}/yıl)</span></div><b>${fm(p.v)}</b><div class="actions tight"><button class="chip" onclick="sellProp(${j})">Sat</button></div></div>`).join('') || '<p class="m">Henüz mülkün yok.</p>'}</div><div class="card"><div class="eyebrow">Satılık · nakit ${fm(g.money)}</div>${PROPS.map((p, i) => { const c = Math.round(p.c * e); return `<div class="asset"><div><b>${p.n}</b><span class="m">Kira %${(p.y * 100).toFixed(1)} · değer artışı ~%${Math.round(p.gr * 100)}</span></div><b>${fm(c)}</b><div class="actions tight"><button class="chip ${g.money < c ? 'dis' : ''}" onclick="buyProp(${i})">Satın al</button></div></div>`; }).join('')}</div>`;
  if (v === 'sirket') h += `<div class="card"><div class="eyebrow">Şirketlerin · nakit ${fm(g.money)}</div><p class="m">Enerji sekmesindeki “Şirket toplantıları” şirketlerinin yıllık performansını artırır.</p>${g.fin.biz.map((b, j) => `<div class="asset"><div><b>${esc(b.n)}</b><span class="m">${BIZ[b.i].n} · seviye ${b.lvl}/5 · geçen yıl ${b.last >= 0 ? '+' : ''}${fm(b.last)}</span></div><b>${fm(b.v)}</b><div class="actions tight"><button class="chip ${b.lvl >= 5 || g.money < bizUpCost(b) ? 'dis' : ''}" onclick="bizUp(${j})">${b.lvl >= 5 ? 'En üst seviye' : 'Büyüt · ' + fm(bizUpCost(b))}</button><button class="chip ${b.mk ? 'dis' : ''}" onclick="bizMk(${j})">Reklam · ${fm(bizMkCost(b))}</button><button class="chip" onclick="bizSell(${j})">Sat</button></div></div>`).join('') || '<p class="m">Henüz şirketin yok.</p>'}</div><div class="card"><div class="eyebrow">Şirket kur</div>${BIZ.map((b, i) => { const c = Math.round(b.c * e); return `<div class="asset"><div><b>${b.n}</b><span class="m">Getiri ~%${Math.round(b.m * 100)} · risk ${b.v > .4 ? 'çok yüksek' : b.v > .2 ? 'yüksek' : b.v > .1 ? 'orta' : 'düşük'}</span></div><b>${fm(c)}</b><div class="actions tight"><button class="chip ${g.money < c || g.fin.biz.some(x => x.i === i) ? 'dis' : ''}" onclick="newBiz(${i})">${g.fin.biz.some(x => x.i === i) ? 'Var' : 'Kur'}</button></div></div>`; }).join('')}</div>`;
  if (v === 'spons') h += `<div class="card"><div class="eyebrow">Sponsorlukların</div>${g.fin.spons.map(s => `<div class="kv"><span>${esc(s.n)} · ${s.y} yıl kaldı</span><b>${fm(s.v)}/yıl</b></div>`).join('') || '<p class="m">Aktif sponsorluğun yok.</p>'}<div class="m">Enerji sekmesindeki “Reklam çekimi” sponsorlardan ek gelir getirir.</div></div><div class="card"><div class="eyebrow">Teklifler</div>${(g.sponsOf || []).map((s, i) => `<div class="asset"><div><b>${esc(s.n)}</b><span class="m">${s.y} yıl</span></div><b>${fm(s.v)}/yıl</b><div class="actions tight"><button class="chip" onclick="signSpons(${i})">İmzala</button></div></div>`).join('') || `<p class="m">Ünün arttıkça markalar seni arayacak (ün ${Math.round(g.rep)}; ilk teklif için ~18).</p>`}</div>`;
  if (v === 'kulup') { const B = buyList().filter(c => !ownById(c.id)), mn = cheapestClub(); h += `<div class="card"><div class="eyebrow">Satılık kulüpler · nakit ${fm(g.money)} · bütün varlıklarınla ${fm(liquidW())}</div><p class="m">Kulübü aldıktan sonra Kulübüm sekmesinden kadro, teknik direktör, stadyum, altyapı ve transferi yönetirsin. Emekliysen takımı kendin de çalıştırabilirsin. En fazla ${MAXCLUBS} kulüplük bir grup kurabilirsin (şu an ${allOwn().length}).</p>${B.map(c => `<div class="asset"><div>${clubKit(c.id)}<b>${esc(clubName(c.n))}</b><span class="m">${esc(tierName(c.ct, c.t))} · ${esc(c.ct)} · güç ${c.s}</span></div><b>${fm(c.p)}</b><div class="actions tight"><button class="chip" onclick="buyClub(${c.id})">${g.money < c.p ? 'Varlık satıp al' : 'Satın al'}</button></div></div>`).join('') || `<p class="m">Bütçene uygun kulüp yok. En ucuz kulüp yaklaşık ${fm(mn)}.</p>`}</div>`; }
  return h;
}


/* ---------- T: itibar, piyasa, kariyer ---------- */
function coachCareerCard() {
  const rep = cRep(), rk = cwRank(), top = ensureCW().slice().sort((a, b) => b.r - a.r).slice(0, 5), C = g.coach;
  const H = (g.cHist || []).slice(0, 8);
  return `<div class="card"><div class="eyebrow">Antrenörlük kariyerin</div>
  <div class="prow"><span>İtibar</span>${bar(rep, 100)}<b>${rep}</b></div><div class="m">Dünya sıralaması: <b class="gold">${rk}.</b> · Lisans ${LIC[g.lic || 0]}${C ? ` · son maçlar ${(C.f5 || []).map(x => LANG === 'en' ? (x === 3 ? 'W' : x === 1 ? 'D' : 'L') : (x === 3 ? 'G' : x === 1 ? 'B' : 'M')).join(' ') || '—'}` : ''}</div>
  <div class="rank">${top.map((c, i) => `<div><span>${i + 1}.</span><b>${esc(c.nw ? c.n : alter(c.n))}</b><em>${c.r}</em></div>`).join('')}${rk > 5 ? `<div class="me"><span>${rk}.</span><b>${esc(g.name)} (sen)</b><em>${rep}</em></div>` : ''}</div>
  <div class="m">İtibar; hedefleri tutturmak, kupa ve terfiyle yükselir, küme düşme ve kovulmayla düşer. Büyük kulüpler yalnızca yüksek itibarlı hocalara bakar.</div>
  ${H.length || C ? `<div class="eyebrow">Geçmiş</div>${C ? `<div class="kv"><span>${C.start}– · ${esc(clubName(C.n))}</span><b>şu an · ${C.s + 1}. sezon</b></div>` : ''}${H.map(x => `<div class="kv"><span>${x.y} · ${esc(clubName(x.n))}</span><b>${esc(x.r)}</b></div>`).join('')}` : ''}</div>`;
}
function marketCard() {
  const I = Object.entries(g.cint || {}).sort((a, b) => b[1] - a[1]).slice(0, 6), ag = g.cag || 0;
  return `<div class="card"><div class="eyebrow">Piyasa · seni izleyen kulüpler</div>${I.length ? I.map(([id, v]) => { const c = club(+id); return c ? `<div class="prow"><span>${clubKit(c.id)}${esc(clubName(c.n))} <small class="m">${esc(tierName(clubCt(c.id), c.t))}</small></span>${bar(v, 100)}<b>${Math.round(v)}</b></div>` : ''; }).join('') : '<p class="m">Şu an seni yakından izleyen kulüp yok. İyi sonuçlar ve itibar ilgiyi artırır.</p>'}
  <div class="m">İlgi 75'i geçen kulüpler teklif yapabilir. İlgi her ay güncellenir; kötü gidişte söner.</div>
  <div class="eyebrow">Antrenör menajerin</div><div class="chips">${CAG.map((a, i) => `<button class="chip ${ag === i ? 'on' : ''}" onclick="cagSet(${i})">${a.n}${a.cut ? ' · %' + Math.round(a.cut * 100) : ''}</button>`).join('')}</div><div class="m">Menajer ilgiyi hızlandırır, daha yüksek maaş getirir ve maaşından pay alır.</div></div>`;
}
function vacancyCard() {
  const V = vacancies();
  return `<div class="card"><div class="eyebrow">Boş koltuklar · ${g.season}</div>${V.length ? V.map(c => `<div class="asset"><div>${clubKit(c.id)}<b>${esc(clubName(c.n))}</b><span class="m">${esc(tierName(clubCt(c.id), c.t))} · ${esc(clubCt(c.id))} · güç ${c.s}</span></div><button class="chip" onclick="applyJob(${c.id})">Başvur</button></div>`).join('') : '<p class="m">Lisansına uygun boş koltuk yok.</p>'}<div class="m">Yılda en fazla 3 başvuru. Kabul şansı itibarına ve menajerine bağlı. Kalan hakkın: ${Math.max(0, 3 - (g.vapp || 0))}.</div></div>`;
}

/* ---------- Kulübüm ---------- */
let OV = 'ozet';
function sqTable(id, mode) {
  const sq = [...(g.sq[id] || [])].sort((a, b) => ['GK', 'DF', 'MF', 'FW'].indexOf(a.p) - ['GK', 'DF', 'MF', 'FW'].indexOf(b.p) || b.r - a.r);
  const B = mode === 'own' ? g.own : g.coach, xi = new Set(bestXI(id, (mode === 'own' ? g.own.form : g.coach.form) || '4-4-2').map(p => p.id)), sell = (B && B.sell) || [];
  return `<div class="sq">${sq.map(p => `<div class="sqr ${xi.has(p.id) ? 'inxi' : ''} ${p.out ? 'out' : ''}"><span class="sqp p-${p.p}">${p.p}</span><span class="sqn"><b>${p.num || ''}</b> ${esc(pname(p))}${p.real ? ' <i class="star">★</i>' : ''}<small>${p.age} yaş · pot ${p.pot} · ${fm(p.wage)}/yıl · ${p.yrs} yıl${p.inj ? ` · <span class="neg">sakat ${p.inj} hf</span>` : ''}${p.ap ? ` · ${p.ap} maç ${p.g || 0} gol` : ''}${mode === 'coach' ? ` · ${(p.mor == null ? 65 : p.mor) >= 70 ? '😊' : (p.mor == null ? 65 : p.mor) < 40 ? '😠' : '😐'}${g.coach.capt === p.id ? ' · ©' : ''}${p.loanIn ? ' · kiralık' : ''}` : ''}${sell.includes(p.id) ? ' · <span class="gold">satış listesinde</span>' : ''}${p.yrs <= 1 ? (p.renew ? ' · <span class="pos">yenilenecek</span>' : ' · <span class="neg">sözleşme bitiyor</span>') : ''}</small></span><b class="sqr-r">${p.r}</b><span class="sqa">${mode === 'coach' ? `<button class="mini" onclick="g.coach.talk=${p.id};draw();window.scrollTo(0,0)" title="Konuş">💬</button><button class="mini" onclick="togOut(${p.id})" title="Kadro dışı">${p.out ? '↩' : '⨯'}</button><button class="mini" onclick="coachSellNow(${p.id})" title="Sat">€</button>` : `<button class="mini" onclick="ownSell(${p.id})" title="Sat">€</button>`}${p.yrs <= 1 ? `<button class="mini" onclick="${mode === 'coach' ? 'renewP' : 'ownRenew'}(${p.id})" title="Sözleşme yenile">✎</button>` : ''}</span></div>`).join('')}</div><div class="m">★ gerçek oyuncu · altın satır: ilk 11 · ⨯ kadro dışı · € sat · ✎ sözleşmesini yenile. Maaş toplamı ${fm(wageBill(id))}/yıl.</div>`;
}
function formChips(cur, fn) { return `<div class="chips">${Object.keys(FORMS).map(f => `<button class="chip ${cur === f ? 'on' : ''}" onclick="${fn}('${f}')">${f}</button>`).join('')}</div>`; }
function youthList(id, fn) { const Y = (g.youth || {})[id] || []; return Y.length ? Y.map(y => `<div class="asset"><div><b>${esc(y.n)}</b><span class="m">${POSN[y.p]} · ${y.age} yaş · şu an ${y.r} · potansiyel ${y.pot}${y.pot >= 80 ? ' 💎' : ''}</span></div><button class="chip" onclick="${fn}(${y.id})">A takıma al</button></div>`).join('') : '<p class="m">Bu yılın altyapı adayları A takıma alındı ya da henüz yok. Her yıl yeni adaylar gelir.</p>'; }
function marketList(id, seed, fn, bud) { const L2 = market(id, seed); return `<div class="m">${windowOpen() || g.phase === 'retired' ? '🟢 Transfer dönemi açık' : '🔴 Transfer dönemi kapalı (1-4. ve 22-25. haftalar). Satışları listeye koyabilirsin.'} · Bütçe ${fm(bud)}</div>${L2.map((x, i) => `<div class="asset"><div><b>${esc(pname(x))}${x.real ? ' <i class="star">★</i>' : ''}</b><span class="m">${POSN[x.p]} · ${x.age} yaş · reyting ${x.r} · ${esc(cname(x.from))} · maaş ${fm(x.wage)}</span></div><b>${fm(x.fee)}</b><div class="actions tight"><button class="chip ${bud < x.fee ? 'dis' : ''}" onclick="${fn}(${i})">Transfer et</button></div></div>`).join('') || '<p class="m">Pazarda uygun oyuncu yok.</p>'}`; }
/* ---------- Teknik direktörlük ---------- */
let CV2 = 'ozet';
function coachUI() {
  const C = g.coach;
  if (!C) {
    let h = licCard();
    if (g.cof && g.cof.length) h += `<div class="card"><div class="eyebrow gold">İş teklifleri</div>${g.cof.map((o, i) => `<div class="card offer" style="--c1:${club(o.id).c1};--c2:${club(o.id).c2}"><div class="row-b"><div>${clubKit(o.id)}<b class="on">${esc(clubName(o.n))}</b><div class="m">${esc(tierName(o.ct, o.t))} · ${esc(o.ct)} · güç ${o.s}${o.home ? ' · çocukluk kulübün' : ''}</div></div></div><div class="kvs"><div class="kv"><span>Maaş</span><b>${fm(o.sal)}/yıl</b></div><div class="kv"><span>Süre</span><b>${o.yrs} yıl</b></div><div class="kv"><span>Transfer bütçesi</span><b>${fm(o.bud)}</b></div><div class="kv"><span>Beklenti</span><b>~${o.exp}. sıra</b></div><div class="kv"><span>Şampiyonluk primi</span><b>${fm(o.bonusT || 0)}</b></div><div class="kv"><span>Kovulursa tazminat</span><b>kalan maaşın %${Math.round((o.comp || .4) * 100)}'i</b></div></div>${o.gone ? '<div class="m note">Kulüp masadan kalktı.</div>' : `<div class="actions"><button class="btn" onclick="coachSign(${i})">İmzala</button><button class="btn ghost" onclick="cnegoOpen(${i})">Pazarlık et</button></div>`}</div>`).join('')}</div>`;
    h += ntjCard();
    if (g.phase === 'retired' && g.lic >= 1) h += coachCareerCard() + cabinetCard() + vacancyCard() + marketCard();
    if (g.phase === 'retired') h += `<div class="card"><div class="eyebrow">İş ara</div><p class="m">Lisansın, ünün ve antrenörlük geçmişin hangi kulüplerin seni arayacağını belirler.</p><button class="btn ghost" onclick="coachLook()">Teklifleri yenile</button></div>`;
    else if (g.phase !== 'coach') h += `<div class="card"><p class="m">Teknik direktörlük teklifleri futbolu bıraktıktan sonra gelir. Lisansı şimdiden alabilirsin.</p></div>`;
    if (g.cHist && g.cHist.length) h += `<div class="card"><div class="eyebrow">Teknik direktörlük geçmişin</div>${g.cHist.slice(0, 12).map(x => `<div class="kv"><span>${x.y} · ${esc(clubName(x.n))}</span><b>${esc(x.r)}</b></div>`).join('')}</div>`;
    return h;
  }
  const c = club(C.id), v = CV2;
  let h = `<div class="segs">${seg('CV2', 'ozet', 'Özet', v)}${seg('CV2', 'plan', 'Maç planı', v)}${seg('CV2', 'kadro', 'Kadro', v)}${seg('CV2', 'tak', 'Taktik', v)}${seg('CV2', 'ant', 'Antrenman', v)}${seg('CV2', 'ekip', 'Ekip', v)}${seg('CV2', 'tr', 'Transfer', v)}${seg('CV2', 'alt', 'Altyapı', v)}${seg('CV2', 'kar', 'Kariyer', v)}</div>`;
  if (v === 'ozet') {
    h += `<div class="card clubc" style="--c1:${c.c1};--c2:${c.c2}"><div class="eyebrow">Teknik direktör · ${C.s + 1}. sezon${C.own ? ' · kendi kulübün' : ''}</div><h2>${esc(clubName(c.n))}</h2><div class="m">${esc(tierName(C.ct, c.t))} · güç ${c.s} · ${C.form} · ${TACT[C.tac].n} · ${C.gp ? `${C.wins}/${C.gp} galibiyet` : 'henüz maç yok'}</div>
    ${C.phil ? `<div class="m">Yönetim felsefesi: <b class="gold">${PHIL[C.phil].n}</b> — ${PHIL[C.phil].d}</div>` : ''}<div class="prow"><span>Yönetim güveni</span>${bar(C.conf, 100, C.conf < 30 ? 'bad' : '')}<b>${Math.round(C.conf)}</b></div><div class="m">${C.conf >= 70 ? 'Koltuğun sağlam.' : C.conf >= 45 ? 'Yönetim izliyor.' : C.conf >= 30 ? '⚠ Koltuk ısınıyor.' : '🔥 Kovulmanın eşiğindesin.'}</div><div class="prow"><span>Soyunma odası</span>${bar(C.harm || 60, 100, (C.harm || 60) < 40 ? 'bad' : '')}<b>${Math.round(C.harm || 60)}</b></div>${C.ult ? `<div class="warn">Ültimatom: ${C.ult.n} maçta ${C.ult.need - C.ult.pts > 0 ? (C.ult.need - C.ult.pts) + ' puan daha lazım' : 'hedef tuttu'}</div>` : ''}${(C.tacUse || {})[C.tac] > 8 ? '<div class="warn">Rakipler oyununu çözmeye başladı: taktiği değiştir.</div>' : ''}<div class="prow"><span>Yorgunluk</span>${bar(C.fat, 30, C.fat > 18 ? 'bad' : '')}<b>${Math.round(C.fat)}</b></div></div>`;
    h += `<div class="card"><div class="eyebrow">Sezon hedefleri</div>${C.obj.map(o => { const s = objState(o); return `<div class="obj ${s.ok > 0 ? 'ok' : s.ok < 0 ? 'no' : ''}"><span>${s.ok > 0 ? '✔' : s.ok < 0 ? '✘' : '•'}</span><b>${esc(o.n)}</b><em>${esc(s.cur)}</em></div>`; }).join('')}${C.objNote ? `<div class="m note">${esc(C.objNote)}</div>` : ''}<div class="m">Hedefler sezon içinde değişebilir: iyi gidersen yönetim çıtayı yükseltir, transferle kadro güçlenirse beklenti artar.</div></div>`;
    h += `<div class="card"><div class="eyebrow">Sözleşmen</div><div class="kvs"><div class="kv"><span>Maaş</span><b>${C.own ? 'Kulüp sahibisin' : fm(C.sal) + '/yıl'}</b></div><div class="kv"><span>Kalan süre</span><b>${C.own ? '—' : C.yrs + ' sezon'}</b></div><div class="kv"><span>Başlangıç</span><b>${C.start}</b></div><div class="kv"><span>Şampiyonluk primi</span><b>${fm(C.bonusT || 0)}</b></div><div class="kv"><span>Kovulma tazminatı</span><b>${C.own ? '—' : fm(Math.round(C.sal * C.yrs * C.comp))}</b></div><div class="kv"><span>Transfer bütçesi</span><b>${fm(C.bud)}</b></div></div>
    <div class="actions"><button class="btn ghost" onclick="askBudget()">Yönetimden ek bütçe iste</button>${C.own ? '' : `<button class="btn ghost danger" onclick="coachQuit()">İstifa et</button>`}</div></div>`;
    h += `<div class="card"><div class="eyebrow">Kulüp kasası (bu sezon)</div><div class="kvs"><div class="kv"><span>Transfer bütçesi</span><b>${fm(C.bud)}</b></div><div class="kv"><span>Maç/kupa/bilet geliri</span><b class="pos">+${fm(C.inc || 0)}</b></div><div class="kv"><span>Ekip maaşları (yıllık)</span><b class="neg">−${fm(staffWages())}</b></div><div class="kv"><span>Oyuncu maaşları (yıllık)</span><b>${fm(wageBill(C.id))}</b></div></div><div class="m">Gelirlerin yarısı transfer bütçesine eklenir. Sezon sonunda sıralama primi gelir.</div></div>`;
  }
  if (v === 'kadro') h += talkPanel() + `<div class="card"><div class="eyebrow">Kadro · ${(g.sq[C.id] || []).length} oyuncu · ${C.form}</div>${sqTable(C.id, 'coach')}<div class="m">💬 ile oyuncuyla birebir konuş: övgü, eleştiri, forma sözü ya da kaptanlık.</div></div>`;
  if (v === 'plan') { const m = nextWeekMatch() || (() => { const e = g.cal.find(x => x.w >= g.week && x.k !== 'N' && entryInfo(x)); return e ? { info: entryInfo(e) } : null; })(); h += m ? planCard(m.info) : '<div class="card"><p class="m">Yaklaşan maç yok.</p></div>'; }
  if (v === 'ant') h += `<div class="card"><div class="eyebrow">Haftalık antrenman programı</div><div class="opts">${Object.entries(TRN).map(([k, t]) => `<button class="opt sm ${(C.trn || 'taktik') === k ? 'on' : ''}" onclick="setTrn('${k}')"><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div><div class="prow"><span>Taktik uyumu</span>${bar(C.tf == null ? 55 : C.tf, 100)}<b>${Math.round(C.tf == null ? 55 : C.tf)}</b></div><div class="m">Taktiği değiştirince uyum düşer; taktik çalışması onu hızla yükseltir. Uyum yüksekse takım planı iyi uygular.</div>
    <div class="eyebrow">Antrenman yükü</div><div class="chips">${['Hafif', 'Normal', 'Ağır'].map((n, i) => `<button class="chip ${C.load === i ? 'on' : ''}" onclick="setLoad(${i})">${n}</button>`).join('')}</div><div class="prow"><span>Yorgunluk</span>${bar(C.fat, 30, C.fat > 18 ? 'bad' : '')}<b>${Math.round(C.fat)}</b></div></div>`;
  if (v === 'kar') h += coachCareerCard() + cabinetCard() + marketCard() + (C.hist.length ? `<div class="card"><div class="eyebrow">Bu kulüpteki sezonların</div>${C.hist.map(x => `<div class="kv"><span>${x.y}</span><b>${esc(x.r)}</b></div>`).join('')}</div>` : '');
  if (v === 'tak') h += `<div class="card"><div class="eyebrow">Diziliş</div>${formChips(C.form, 'setForm')}<div class="m">Diziliş ilk 11'i belirler; mevkisinde yeterli oyuncu yoksa başka mevkiden oynatılan oyuncu verimsiz olur.</div>${xiPreview(C.id, C.form)}</div>
    <div class="card"><div class="eyebrow">Oyun anlayışı</div><div class="opts">${Object.entries(TACT).map(([k, t]) => `<button class="opt sm ${C.tac === k ? 'on' : ''}" onclick="setTac('${k}')"><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div>
    <div class="eyebrow">Rotasyon</div><div class="chips">${['Az', 'Dengeli', 'Çok'].map((n, i) => `<button class="chip ${C.rot === i ? 'on' : ''}" onclick="setRot(${i})">${n}</button>`).join('')}</div>
    <div class="eyebrow">Antrenman yükü</div><div class="chips">${['Hafif', 'Normal', 'Ağır'].map((n, i) => `<button class="chip ${C.load === i ? 'on' : ''}" onclick="setLoad(${i})">${n}</button>`).join('')}</div><div class="m">Ağır antrenman gençleri geliştirir ama sakatlık getirir; hafif antrenman yorgunluğu atar.</div></div>`;
  if (v === 'ekip') h += `<div class="card"><div class="eyebrow">Teknik ekip · bütçe ${fm(C.bud)}</div><div class="m">Ekip maaşları kulüp bütçesinden her hafta düşer: yılda ${fm(staffWages())}. İşe alırken bir defalık imza ücreti ödenir.</div>${STAFFC.map(s => { const lv = (C.staff || {})[s.k] || 0; return `<div class="asset"><div><b>${s.n}</b><span class="m">${s.d} · seviye ${lv}/3</span></div><button class="chip ${lv >= 3 ? 'dis' : ''}" onclick="hireStaff('${s.k}')">${lv >= 3 ? 'En iyi' : lv ? 'Geliştir' : 'İşe al'}</button></div>`; }).join('')}</div>`;
  if (v === 'tr') h += trCard();
  if (v === 'alt') h += `<div class="card"><div class="eyebrow">Altyapı adayları</div>${youthList(C.id, 'coachPromote')}<div class="m">Altyapı direktörü (Ekip) adayların kalitesini artırır.</div></div>`;
  return h;
}
function xiPreview(id, form) { const xi = bestXI(id, form); return `<div class="xi">${['FW', 'MF', 'DF', 'GK'].map(p => `<div class="xir">${xi.filter(x => x.p === p || (x.oop && p === 'MF' && false)).map(x => `<span class="xip ${x.oop ? 'oop' : ''}"><b>${x.r}</b>${esc(short(pname(x)))}</span>`).join('')}</div>`).join('')}</div>`; }
function coachHome() {
  const C = g.coach; if (!C) return retiredHome();
  const ev = evCard(), c = club(C.id);
  let h = ev + `<div class="card"><div class="row-b"><div class="eyebrow">${g.season}/${String(g.season + 1).slice(2)} · Hafta ${g.week}/${SEASON_W}</div><span class="m">${esc(clubName(c.n))}</span></div>`;
  if (!g.wstage) {
    const thisW = g.cal.filter(e => e.w === g.week && e.k !== 'N').map(e => entryInfo(e)).filter(x => x);
    h += thisW.length ? thisW.map(i => `<div class="fx"><span class="ctag c-${i.short}">${i.short}</span><span class="fxn">${i.home ? '' : '@ '}${esc(i.on)}</span>${wxI(i.wx)}<span class="m">${esc(i.round)}</span></div>`).join('') : '<p class="m">Bu hafta maç yok.</p>';
    h += `${windowOpen() ? '<div class="m">🟢 Transfer dönemi açık</div>' : ''}${enLine()}`;
    h += ev ? '' : `<div class="actions"><button class="btn big" onclick="cWeekGo()">Haftayı başlat</button><button class="btn ghost" onclick="coachSim(4)">4 hafta</button><button class="btn ghost" onclick="coachSim(60)">Sezonu bitir</button></div>`;
  } else {
    const m = ev ? null : nextWeekMatch();
    if (m) h += matchCardHTML(m.info, null, `<button class="btn big" onclick="lmStart()">Maçı yönet (canlı)</button><button class="btn ghost" onclick="cmQuickBtn()">Hızlı sonuç</button>`) + '</div>' + planCard(m.info) + '<div class="card">';
    else if (!ev) h += `<div class="eyebrow">Hafta özeti</div>${(g.wres || []).map(r => `<div class="fx"><span class="ctag c-${r.c}">${r.c}</span><span class="fxn ${r.w > 0 ? 'w' : r.w < 0 ? 'l' : ''}">${esc(r.t)}</span></div>`).join('') || '<p class="m">Maç oynanmadı.</p>'}<div class="actions"><button class="btn big" onclick="coachWeekEnd()">Sonraki hafta</button></div>`;
  }
  h += '</div>';
  h += `<div class="card"><div class="eyebrow">Hedefler · güven ${Math.round(C.conf)}</div>${C.obj.slice(0, 3).map(o => { const s = objState(o); return `<div class="obj ${s.ok > 0 ? 'ok' : s.ok < 0 ? 'no' : ''}"><span>${s.ok > 0 ? '✔' : s.ok < 0 ? '✘' : '•'}</span><b>${esc(o.n)}</b><em>${esc(s.cur)}</em></div>`; }).join('')}<button class="lnk" onclick="CV2='ozet';setTab('coach')">Tüm detaylar</button></div>`;
  return h + miniTable() + newsCard();
}
function cWeekGo() { if (busy()) return toast('Önce karar vermen gereken bir durum var'); coachWeekStart(); sv(); draw(); }
function cmatchUI() {
  const m = CM, i = m.info, us = clubName(club(g.coach.id).n), w = WX[i.wx || 'acik'];
  const evs = m.ev.map(x => `<div class="fi ${x.s ? 'bad' : 'good'}"><b>${x.m}'</b> ⚽ ${x.s ? esc(i.on) : esc(us)}${x.p ? ' · ' + esc(x.p) : ''}</div>`).join('') || '<div class="fi mut">Henüz gol yok.</div>';
  let h = `<div class="sb"><div class="sbc">${esc(i.comp)} · ${esc(i.round)} · ${w.i} ${w.n}</div><div class="sbr"><span class="tm">${clubKit(g.coach.id)}${esc(i.home ? us : i.on)}</span><b class="sc">${i.home ? m.sc[0] : m.sc[1]} – ${i.home ? m.sc[1] : m.sc[0]}</b><span class="tm r">${esc(i.home ? i.on : us)}</span></div><div class="sbc">${m.h === 1 ? 'Devre arası' : 'Maç sonu' + (m.res && m.res.pens ? ` · pen. ${m.res.pens[0]}-${m.res.pens[1]}` : '')}</div></div><div class="feed">${evs}</div>`;
  if (m.h === 1) h += `<div class="card"><div class="eyebrow">Soyunma odası</div>${m.talk ? `<p class="lead">${esc(m.talk)}</p>` : `<div class="opts"><button class="opt" onclick="cmTalk('motive')"><b>Motive et</b><span>Genelde işe yarar</span></button><button class="opt" onclick="cmTalk('sakin')"><b>Sakin kal, plana güven</b><span>Küçük ama güvenli etki</span></button><button class="opt" onclick="cmTalk('sert')"><b>Sert eleştir</b><span>Büyük etki ya da ters tepki</span></button></div>`}
  <div class="eyebrow">İkinci yarı taktiği</div><div class="chips">${Object.entries(TACT).map(([k, t]) => `<button class="chip ${m.tac === k ? 'on' : ''}" onclick="cmTac('${k}')">${t.n}</button>`).join('')}</div>
  ${m.subbed ? `<div class="m">${esc(m.subT)}</div>` : `<button class="btn ghost" onclick="cmSub()">Oyuncu değişikliği yap</button>`}
  <button class="btn big" onclick="cmSecond()">İkinci yarıyı başlat</button></div>`;
  else h += `<div class="card"><p class="lead">${m.res.win ? 'Kazandınız!' : m.res.draw ? 'Berabere.' : 'Kaybettiniz.'}</p><button class="btn big" onclick="cmDone()">Devam</button></div>`;
  return h;
}
function retiredHome() {
  const s = g.lastSeason, ev = evCard();
  const nj = g.ntjOf || (g.ntjT && !g.ntjT.done) ? `<div class="card q"><div class="eyebrow gold">Milli takım</div><p class="lead">${g.ntjOf ? `${esc(g.ntjOf.ct)} federasyonu seni teknik direktör olarak istiyor.` : `${esc(g.ntjT.n)} başladı; takımını sen yöneteceksin.`}</p><button class="btn" onclick="setTab('coach')">Teknik direktörlüğe git</button></div>` : '';
  return `${ev}${nj}<div class="card"><div class="eyebrow">${g.season} · emeklilik</div><p class="lead">${g.age} yaşındasın. Zamanını ailene, işlerine ve futbolun başka yüzlerine ayırabilirsin.</p>${s && s.lines && s.lines.length ? `<ul class="news">${s.lines.filter(x => x).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  ${enLine()}<div class="m">${g.job ? 'İşin: ' + esc(JOBLIST[g.job.k].n) + ' (yıllık gelir yazılır)' : 'Bir işin yok.'} ${g.lic ? '· Lisans: ' + LIC[g.lic] : ''}</div>
  ${ev ? '' : `<div class="actions"><button class="btn big" onclick="retiredYear()">Yılı geç</button>${g.lic ? `<button class="btn ghost" onclick="setTab('coach')">Teknik direktörlük</button>` : ''}${g.own ? `<button class="btn ghost" onclick="setTab('own')">Kulübüm</button>` : ''}</div>`}</div>${newsCard()}`;
}

/* ---------- Miras ---------- */
function legUI() {
  const p = mpParts(g), tot = p.foot + p.human + p.money;
  return `<div class="card"><div class="eyebrow">Miras Puanı</div><div class="big">${tot} <small>${mpT(tot)}</small></div>${g.dream ? `<div class="m">Çocukluk hayalin: <b>${esc(DREAMS[g.dream])}</b> · ${dreamDone(g) ? '<span class="pos">✔ gerçekleşti (+150)</span>' : 'henüz gerçekleşmedi'}</div>` : ''}
  <div class="prow"><span>Futbol mirası</span>${bar(p.foot, Math.max(tot, 1))}<b>${p.foot}</b></div><div class="prow"><span>İnsan mirası</span>${bar(p.human, Math.max(tot, 1))}<b>${p.human}</b></div><div class="prow"><span>Para mirası</span>${bar(p.money, Math.max(tot, 1))}<b>${p.money}</b></div></div>
  ${g.phase !== 'child' ? `<div class="card"><div class="eyebrow">Mirası devret</div>${g.fam.kids.length ? (canHand() ? `<p class="m">Ölmeden önce her şeyi bir çocuğuna devredip onunla devam edebilirsin. Veraset vergisi %${Math.round(cinfo(g.ct).inh * 100)}.</p>${heirListHTML(1)}` : '<p class="m">Futbolu bıraktığında ya da 35 yaşından sonra çocuğuna devredebilirsin.</p>') : '<p class="m">Henüz çocuğun yok. Mirasçın olmazsa hikâye seninle biter.</p>'}</div>` : ''}
  <div class="card"><div class="eyebrow">Miras Defteri</div><p class="defter">${esc(defter())}</p><button class="btn ghost" onclick="copyDefter()">Metni kopyala</button></div>
  ${g.lin.length ? `<div class="card"><div class="eyebrow">Soy ağacı · ${(g.linN || g.lin.length) + 1}. kuşak</div><div class="tree">${g.lin.map((x, i) => `${i === 1 && (x.gen || 2) > 2 ? '<div class="tgap">⋮ aradaki kuşaklar</div>' : ''}<div class="tnode"><b>${x.gen || i + 1}. kuşak · ${esc(x.n)}</b><span class="m">${x.y0 ? x.y0 + '–' + x.y1 + ' · ' : ''}${x.a} yaş · ${x.ap != null ? x.ap + ' maç, ' + x.g + ' gol' : ''}${x.tr ? ', ' + x.tr + ' kupa' : ''}${x.cs ? ' · ' + x.cs + ' sezon T.D.' + (x.ct ? ', ' + x.ct + ' şampiyonluk' : '') : ''}${x.own ? ' · ' + esc(clubName(x.own)) + ' sahibi' : ''}</span><em>${x.p} · ${x.t}${x.kid ? ' → ' + esc(x.kid) : ''}</em></div>`).join('')}<div class="tnode cur"><b>${(g.linN || g.lin.length) + 1}. kuşak · ${esc(g.name)}</b><span class="m">devam ediyor</span></div></div></div>` : ''}
  ${qsCard()}${rvCard()}`;
}
function endUI() {
  const F = g.fam;
  return `<div class="card"><div class="eyebrow">Son düdük</div><h2>${esc(g.name)} · ${g.age} yaş</h2><div class="big">${mp()} <small>${mpT(mp())}</small></div><p class="defter">${esc(defter())}</p><button class="btn ghost" onclick="copyDefter()">Metni kopyala</button></div>
  <div class="card"><div class="eyebrow">Miras kime kalacak?</div>${F.kids.length ? `<p class="m">Mirasçın servetin, şirketlerin, mülklerin ve kulübünle devam eder. Veraset vergisi: %${Math.round(cinfo(g.ct).inh * 100)}.</p>${heirListHTML(0)}` : '<p class="m">Geride çocuk bırakmadın. Hikâye burada biter.</p>'}<button class="btn ghost" onclick="g.heirDone=1;sv();menu()">Menüye dön</button></div>`;
}

/* ---------- Teklifler ---------- */
function offersUI() {
  const K2 = { '16': 'İlk profesyonel sözleşmen', free: 'Serbest oyuncu teklifleri', win: 'Transfer teklifleri', renew: 'Sözleşme yenileme', loan: 'Kiralık teklifleri' }[g.ofKind] || 'Teklifler';
  const playP = r => Math.round((START_P[r] + (1 - START_P[r]) * SUB_P[r] * .6) * 100), C = g.con, cc = g.club ? club(g.club.id) : null;
  const tags = o => [o.rich ? '<span class="tag gold">Zengin yatırımcı</span>' : '', g.favClub === o.id ? '<span class="tag gold">Tuttuğun takım</span>' : '', o.home ? '<span class="tag gold">Çocukluk kulübün</span>' : '', o.acadOffer ? '<span class="tag gold">Altyapı kulübün</span>' : '', o.loan ? '<span class="tag r2">Kiralık</span>' : '', o.renew ? '<span class="tag r3">Mevcut kulübün</span>' : ''].join('');
  const diff = (a, b) => b ? `<i class="${a >= b ? 'pos' : 'neg'}">${a >= b ? '+' : ''}${Math.round((a / b - 1) * 100)}%</i>` : '';
  return `<div class="card"><div class="eyebrow gold">${K2}</div><h2>${g.of.filter(o => !o.gone).length} teklif masada</h2><p class="m">Genel ${ovr()} · ${g.age} yaş · ${AGENTS[g.agent].n}. Rol, kulübün gücü ile senin seviyen arasındaki farka göre belirlenir. Pazarlık masasında her kalemi tek tek konuşabilirsin.</p></div>
  ${C && cc ? `<div class="card clubc cur" style="--c1:${cc.c1};--c2:${cc.c2}"><div class="eyebrow">Şu anki sözleşmen · ${esc(clubName(cc.n))}</div>${conRows(C)}<div class="kv"><span>Uyum</span><b>${Math.round(g.uyum)}</b></div><div class="m">Kulüp değiştirirsen uyumun sıfıra yakın başlar.</div></div>` : ''}
  ${g.of.map((o, i) => { const c = club(o.id); return `<div class="card offer ${o.gone ? 'gone' : ''}" style="--c1:${c.c1};--c2:${c.c2}"><div class="row-b"><div>${clubKit(o.id)}<b class="on">${esc(clubName(o.n))}</b><div class="m">${esc(tierName(o.ct, o.t))} · ${esc(o.ct)} · güç ${o.s}${g.prev && g.prev[o.id] ? ` · geçen sezon ${g.prev[o.id]}.` : ''}</div><div class="tags">${tags(o)}</div></div>${roleTag(o.role)}</div>
  <div class="kvs"><div class="kv"><span>Maaş</span><b>${o.loan ? 'Aynı kalır (' + fm(o.sal) + ')' : fm(o.sal) + '/yıl ' + (C ? diff(o.sal, C.sal) : '')}</b></div>${o.loan ? `<div class="kv"><span>Kiralayan kulübün katkısı</span><b>${o.loanTop ? '+' + fm(o.loanTop) + '/yıl' : 'yok'}</b></div>` : ''}<div class="kv"><span>Süre</span><b>${o.yrs} yıl</b></div><div class="kv"><span>İmza parası</span><b>${fm(o.bonus || 0)}</b></div><div class="kv"><span>Oynama şansı</span><b>~%${playP(o.role)}</b></div><div class="kv"><span>Maç primi</span><b>${fm(o.app || 0)}</b></div><div class="kv"><span>Gol/asist primi</span><b>${fm(o.goal || 0)}</b></div><div class="kv"><span>Ev / araç</span><b>${o.house ? 'Ev' : '—'} / ${o.car ? 'Araç' : '—'}</b></div><div class="kv"><span>Tesis</span><b>${stars(o.fac)}</b></div></div>
  ${o.msg ? `<div class="m note">${esc(o.msg)}</div>` : ''}${o.gone ? '' : `<div class="actions"><button class="btn" onclick="sign(${i})">İmzala</button>${o.loan ? '' : `<button class="btn ghost" onclick="negoOpen(${i})">Pazarlık masası</button>`}</div>`}</div>`; }).join('') || '<div class="card"><p class="m">Şu an sana resmi bir teklif yok.</p></div>'}
  <div class="card"><button class="btn ghost" onclick="declineOffers()">${g.ofKind === 'win' || g.ofKind === 'loan' ? 'Kulübümde kalıyorum' : g.ofKind === 'renew' ? 'Yenileme teklifini reddet' : 'Şimdilik hiçbirini kabul etme'}</button></div>`;
}
function negoUI() {
  const N = g.nego, o = g.of[N.oi]; if (!o) { g.nego = null; scr = 'offers'; return offersUI(); }
  const c = club(o.id);
  return `<div class="card offer" style="--c1:${c.c1};--c2:${c.c2}"><div class="eyebrow gold">Pazarlık masası · ${N.round}. tur</div><h2>${clubKit(o.id)}${esc(clubName(o.n))}</h2><div class="m">Karşında sportif direktör ${esc(N.sd)}. ${g.agent ? AGENTS[g.agent].n + ' yanında.' : 'Menajerin yok; tek başınasın.'}</div>
  <div class="kv"><span>Masadaki hava</span><b>${N.pat > 75 ? 'Sakin' : N.pat > 50 ? 'Ciddi' : N.pat > 25 ? 'Gergin' : 'Kopma noktasında'}</b></div></div>
  <div class="card"><div class="eyebrow">Talepler</div>${NEGK.map(d => { const b = N.base[d.k], v = N.dem[d.k], up = d.lowGood ? v < b : v > b, dn = d.lowGood ? v > b : v < b; return `<div class="ng"><div><b>${d.n}</b><span class="m">Teklif: ${d.fmt(b)}${N.scout ? ` · <span class="gold">sınır ≈ ${d.fmt(N.max[d.k])}</span>` : ''}</span></div><button class="step" onclick="negoAdj('${d.k}',-1)" aria-label="Azalt">−</button><b class="ngv">${d.fmt(v)}</b><button class="step" onclick="negoAdj('${d.k}',1)" aria-label="Artır">+</button></div>`; }).join('')}
  ${N.scout ? '' : `<button class="btn ghost" onclick="buyScoutNego()">🔍 Gözlemci raporu: sınırları gör (🪙20)</button>`}
  <div class="m">Kulübün sınırlarını bilmiyorsun: ne kadar isteyeceğin senin riskin. Fazla zorlarsan sabır tükenir ve kulüp masadan kalkar. Sportif direktörün sözlerini dikkatle oku.</div></div>
  <div class="card"><div class="eyebrow">Masada konuşulanlar</div><ul class="news">${N.log.slice(0, 8).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${N.done === 1 ? `<button class="btn big" onclick="negoSign()">Anlaşmayı imzala</button>` : N.done === -1 ? `<div class="actions"><button class="btn ghost" onclick="adNego()">📺 Reklam izle: menajerin son kez arasın</button><button class="btn big" onclick="negoLeave()">Tekliflere dön</button></div>` : `<div class="actions"><button class="btn big" onclick="negoSubmit(0)">Teklifi sun</button>${g.agent ? `<button class="btn ghost" onclick="negoSubmit(1)">Menajerim konuşsun</button>` : ''}<button class="btn ghost" onclick="negoSign()">İlk teklifi kabul et</button><button class="btn ghost" onclick="negoLeave()">Masadan kalk</button></div>`}</div>`;
}
function numUI() {
  const list = ensureSquad(g.club.id), taken = {}; list.forEach(p => taken[p.num] = p);
  const pref = [g.pos === 'FW' ? 9 : g.pos === 'MF' ? 8 : 4, 10, 7, 11, 17, 19, 21, 23, 14, 99];
  return `<div class="card"><div class="eyebrow gold">Forma numarası</div><h2>${esc(clubName(g.club.n))}</h2><p class="m">Boş bir numara seç ya da birinin numarasını iste (rolün yüksekse ve ünün varsa verebilir; vermezse uyum biraz düşer).</p></div>
  <div class="card"><div class="nums">${Array.from({ length: 99 }, (_, i) => i + 1).map(n => { const t = taken[n]; return `<button class="numb ${t ? 'tk' : ''} ${pref.includes(n) ? 'pf' : ''}" onclick="${t ? `pickNum(${n},1)` : `pickNum(${n})`}" title="${t ? esc(pname(t)) : 'Boş'}">${n}${t ? `<small>${esc(short(pname(t)).split(' ').slice(-1)[0].slice(0, 6))}</small>` : ''}</button>`; }).join('')}</div></div>`;
}
function tourInvUI() {
  const t = g.tourInv; if (!t) { scr = 'game'; return homeUI(); }
  return `<div class="card q"><div class="eyebrow gold">${g.season} · ${esc(t.n)}</div><h2>Milli takım kadrosuna çağrıldın</h2><p class="lead">${esc(ntCt())} teknik direktörü seni ${esc(t.n)} kadrosuna aldı. Yazın dinlenme yerine turnuvada oynayacaksın.</p><div class="actions"><button class="btn big" onclick="tourAccept(1)">Katıl</button><button class="btn ghost" onclick="tourAccept(0)">Dinlenmek istiyorum</button></div></div>`;
}

/* ---------- Sezon sonu ---------- */
function seasonUI() {
  const s = g.lastSeason || { lines: [] }, ss = s.ss;
  return `<div class="card"><div class="eyebrow gold">Sezon sonu · ${g.season - 1}/${String(g.season).slice(2)}</div><h2>${s.pos ? s.pos + '. sıra' : 'Sezon tamamlandı'}</h2><ul class="news">${s.lines.filter(x => x).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${ss ? `<div class="stats4"><div><b>${ss.ap}</b>Maç</div><div><b>${ss.g}</b>Gol</div><div><b>${ss.a}</b>Asist</div><div><b>${ss.avg ? ss.avg.toFixed(2) : '—'}</b>Ort. puan</div></div>` : ''}
  ${s.fin ? `<div class="m">Yıllık brüt gelir ${fm(s.fin.inc)}, vergi ${fm(s.fin.tax)}, giderler ${fm(s.fin.exp)}, yatırım sonucu ${s.fin.inv >= 0 ? '+' : ''}${fm(s.fin.inv)}.</div>` : ''}
  <div class="m">Artık ${g.age} yaşındasın.</div>${g.sRew !== g.season ? `<div class="srew"><span>Sezon ödülü 🪙 ${seasonTok()}</span><button class="chip" onclick="seasonReward(0)">Al</button><button class="chip" onclick="seasonReward(1)">📺 2 katı</button></div>` : ''}</div>${evCard()}
  ${busy() ? '' : `<div class="card"><button class="btn big" onclick="seasonCont()">Devam</button></div>`}`;
}
function seasonCont() { if (g.sRew !== g.season) { g.sRew = g.season; tokAdd(seasonTok(), 'Sezon ödülü'); } adInterMaybe(); if (g.ended) { g.seasonPending = 0; scr = 'game'; sv(); return draw(); } if (g.phase === 'coach' || g.phase === 'retired') { g.seasonPending = 0; scr = 'game'; tab = 'home'; sv(); draw(); } else seasonGo(); }

/* ---------- Milli turnuva ---------- */
function tourUI() {
  const T = g.tour; if (!T) { scr = 'game'; return homeUI(); }
  const info = tourInfo();
  return `<div class="card"><div class="eyebrow gold">${T.y} · ${esc(T.n)}</div><h2>${esc(ntCt())}</h2><table class="tbl"><tr><th>Grup</th><th>O</th><th>Av</th><th>P</th></tr>${sortT(T.grp).map(x => `<tr class="${x.n === ntCt() ? 'me' : ''}"><td>${esc(x.n)}</td><td>${x.W + x.D + x.L}</td><td>${x.GF - x.GA}</td><td><b>${x.pt}</b></td></tr>`).join('')}</table>
  ${T.gm >= 3 && T.alive ? `<div class="m">Eleme: ${T.kos.map((r, i) => r + (i < T.ko ? ' ✓' : '')).join(' · ')}</div>` : ''}<ul class="news">${T.log.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  ${info ? `<div class="card">${matchCardHTML(info, null, `<button class="btn big" onclick="playTour()">Maça çık</button><button class="btn ghost" onclick="quickTour()">Hızlı sonuç</button>`)}</div>`
    : `<div class="card"><h2>${T.won ? '🏆 Şampiyon!' : esc(T.end || '')}</h2><button class="btn big" onclick="tourEnd()">Devam</button></div>`}`;
}

function cnegoUI() {
  const N = g.cnego, o = (g.cof || [])[N.oi]; if (!o) { g.cnego = null; scr = 'game'; return ''; }
  return `<div class="card offer" style="--c1:${club(o.id).c1};--c2:${club(o.id).c2}"><div class="eyebrow gold">Teknik direktör pazarlığı · ${N.round}. tur</div><h2>${clubKit(o.id)}${esc(clubName(o.n))}</h2><div class="m">${esc(tierName(o.ct, o.t))} · güç ${o.s} · beklenti ~${o.exp}. sıra</div><div class="kv"><span>Masadaki hava</span><b>${N.pat > 75 ? 'Sakin' : N.pat > 50 ? 'Ciddi' : N.pat > 25 ? 'Gergin' : 'Kopma noktasında'}</b></div></div>
  <div class="card"><div class="eyebrow">Talepler</div>${CNEGK.map(d => `<div class="ng"><div><b>${d.n}</b><span class="m">Teklif: ${d.fmt(N.base[d.k])}</span></div><button class="step" onclick="cnegoAdj('${d.k}',-1)">−</button><b class="ngv">${d.fmt(N.dem[d.k])}</b><button class="step" onclick="cnegoAdj('${d.k}',1)">+</button></div>`).join('')}<div class="m">Yönetimin sınırını bilmiyorsun; ne kadar zorlayacağın senin kararın.</div></div>
  <div class="card"><ul class="news">${N.log.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${N.done === 1 ? `<button class="btn big" onclick="cnegoSign()">Sözleşmeyi imzala</button>` : N.done === -1 ? `<button class="btn big" onclick="cnegoLeave()">Geri dön</button>` : `<div class="actions"><button class="btn big" onclick="cnegoSubmit()">Teklifi sun</button><button class="btn ghost" onclick="cnegoSign()">İlk teklifi kabul et</button><button class="btn ghost" onclick="cnegoLeave()">Masadan kalk</button></div>`}</div>`;
}

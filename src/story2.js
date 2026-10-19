/* ============================================================
   MİRAS FC — v4.0 · Memleket ve altyapı çağrısı, şehir ve takım seçimi
   - Transfer döneminde büyüdüğün şehrin takımı ya da altyapısından
     çıktığın kulüp seni çağırır: maaş düşük, ama şehir seni bekliyor.
     Kabul edersen düşük maaşlı teklif masaya gelir; imzalarsan taraftar
     seni bağrına basar. Söz verirsen sözleşmen bitince geri dönersin.
   - Karakter oluştururken şehir listeden seçilir (yazabilirsin de),
     şehrinin takımı gösterilir ve tuttuğun takımı en başta sen seçersin.
   ============================================================ */
function homeCallTarget() {
  if (g.phase !== 'pro' || !g.club || !windowOpen() || g.age < 21 || g.age > 35) return null;
  const ids = [g.homeClub, g.acadClub && g.acadClub.id].filter((x, i, a) => x && a.indexOf(x) === i && x !== g.club.id && club(x));
  return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null;
}
const HOME_EV = {
  id: 'memleketcagri', a: [21, 35], cd: 3, w: 3,
  pre: () => { const id = homeCallTarget(); return { id, acad: id && g.acadClub && g.acadClub.id === id && id !== g.homeClub ? 1 : 0 }; },
  f: () => !!homeCallTarget(),
  t: x => { const c = club(x.id); if (!c) return 'Eski kulübün seni arıyor.'; const n = clubName(c.n); return x.acad ? `Altyapısından çıktığın ${n} zor günlerden geçiyor. Kulüp başkanı bizzat aradı: “Seni biz yetiştirdik. Maaşın düşük olacak ama bu forma seni bekliyor. Geri döner misin?”` : `Büyüdüğün şehrin takımı ${n}'${loc(n)} sana ihtiyacı var. Başkan bizzat aradı: “Sana fazla para veremeyiz ama bu şehir seni bekliyor. Gelir misin?”`; },
  c: [
    { l: 'Memleketime dönüyorum (düşük maaş)', f: x => homeCallAccept(x), v: [0, 3, 3, -4] },
    { l: 'Teşekkür ederim ama kalıyorum', f: x => { g.hap = clr(g.hap - 2, 0, 100); L('Memleket taraftarı biraz kırıldı ama seni anlıyor.'); }, v: [2, 0, 0, 2] },
    { l: 'Söz veriyorum: sözleşmem bitince döneceğim', f: x => { g.flags.memSoz = x.id; g.rep = cl(g.rep + 2, 0, 100); L('Verdiğin söz şehirde dilden dile dolaşıyor.'); }, v: [0, 2, 2, 0] },
  ] };
function homeCallAccept(x) {
  const c = club(x.id); if (!c) return; const ct = clubCt(x.id), cur = g.con ? g.con.sal : salary(ovr(), c.t, ct, 2);
  const o = mkOffer(c, ct, 'win', { home: 1, homeCall: 1 }); o.sal = Math.max(1, Math.round(Math.min(o.sal, cur) * (x.acad ? .5 : .45))); o.bonus = Math.round(o.sal * .1); o.msg = 'Memleket çağrısı: maaş düşük, sevgi büyük.';
  g.of = [o]; g.ofKind = 'win'; L(`${clubName(c.n)} düşük maaşlı bir teklif gönderdi.`); setTimeout(() => { scr = 'offers'; sv(); draw(); }, 50);
}
AD_EV.push(HOME_EV); EVMAP.memleketcagri = HOME_EV;
/* söz verdiysen: sözleşmen bitince memleket kulübü kapında */
const _soS = startOffers;
startOffers = function (kind) {
  const r = _soS(kind);
  try { if (g.flags.memSoz && (kind === 'free' || kind === 'renew') && g.of && club(g.flags.memSoz) && !g.of.some(o => o.id === g.flags.memSoz)) { const c = club(g.flags.memSoz), o = mkOffer(c, clubCt(c.id), kind === 'renew' ? 'win' : kind, { home: 1, homeCall: 1 }); o.sal = Math.round(o.sal * .6); o.msg = 'Verdiğin sözü hatırlatıyorlar: “Eve dön.”'; g.of.unshift(o); draw(); } } catch (e) { }
  return r;
};
/* imzalayınca taraftar sevinci */
const _signS = sign;
sign = function (i) {
  const o = g.of && g.of[i], hc = o && o.homeCall; const r = _signS(i);
  if (hc && g.club && g.club.id === o.id) { g.hap = clr(g.hap + 15, 0, 100); g.mor = clr(g.mor + 10, 0, 100); g.rep = cl(g.rep + 3, 0, 100); g.uyum = clr((g.uyum || 50) + 15, 0, 100); g.flags.memleket = 1; if (g.flags.memSoz === o.id) g.flags.memSoz = 0; L('🏠 Eve döndün! Tribünler adını haykırıyor.'); news(`${g.name} memleketi ${clubName(o.n)}'${loc(clubName(o.n))} döndü.`); }
  return r;
};
/* teklif kartında rozet */
const _offTagS = typeof offersUI === 'function' ? offersUI : null;

/* ---------- karakter oluşturma: şehir listesi ve tuttuğun takım ---------- */
const _newScrS = newScr;
newScr = function () {
  _newScrS();
  try {
    const grow = ($('ng') && $('ng').value) || NC.grow || 'Türkiye', rows = (CLUBS1[grow] || []).concat((CLUBS2 && CLUBS2[grow] || []).filter(r => Array.isArray(r)));
    const cities = rows.map(r => r[5]).filter((x, i, a) => x && a.indexOf(x) === i).sort((a, b) => a.localeCompare(b, 'tr'));
    const ny = $('ny'); if (!ny) return;
    if (cities.length && !$('cityl')) { const dl = document.createElement('datalist'); dl.id = 'cityl'; dl.innerHTML = cities.map(c => `<option value="${esc(c)}">`).join(''); ny.after(dl); ny.setAttribute('list', 'cityl'); ny.placeholder = T('Listeden seç ya da yaz'); }
    const hint = document.createElement('div'); hint.className = 'm'; hint.id = 'cityh';
    const upd = () => { const v = ny.value.trim().toLocaleLowerCase('tr'), r = rows.find(r => (r[5] || '').toLocaleLowerCase('tr') === v); hint.textContent = r ? `🏟️ ${T('Şehrinin takımı')}: ${clubName(r[0])}` : ''; };
    ny.after(hint); ny.addEventListener('input', upd); upd();
    /* tuttuğun takım seçimini şehrin hemen altına taşı */
    const nf = $('nf'), lb = document.querySelector('label[for="nf"]'); if (nf && lb) { hint.after(lb); lb.after(nf); lb.textContent = T('Tuttuğun takım (sen seç)'); }
  } catch (e) { }
};

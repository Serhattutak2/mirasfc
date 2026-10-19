/* ============================================================
   MİRAS FC — MİRAS: Miras Puanı (futbol / insan / para),
   Miras Defteri, ölüm, mirasçı seçimi, veraset vergisi
   ============================================================ */
function dreamDone(h) {
  if (!h.dream) return false;
  if (h.dream === 'efsane') return (h.hist || []).some(x => x.ap >= 250);
  if (h.dream === 'avrupa') return (h.hist || []).some(x => x.ct !== h.ct && x.s >= 82 && x.t === 1);
  if (h.dream === 'milli') return (h.ntw.wc || 0) + (h.ntw.rc || 0) > 0;
  if (h.dream === 'zengin') return (h === g ? wealth() : h._w || 0) >= 50000;
  return false;
}
function mpParts(h) {
  const c = h.car, n = h.ntw || {}, o = h.own, oh = h.oh || {}, F = h.fam;
  const foot = c.ap * .5 + c.g * 2 + c.a + c.t * 60 + c.cup * 25 + c.ec * 90 + (c.el || 0) * 45 + (c.bal || 0) * 150 + (c.sezon || 0) * 30 + (c.gk || 0) * 25 + (h.nat ? h.nat.caps * 2 + h.nat.g * 3 : 0) + (n.wc || 0) * 160 + (n.rc || 0) * 90 + (h.hist.length === 1 && c.ap >= 150 ? 50 : 0)
    + (h.co && h.co.s ? Math.min(250, 50 * Math.sqrt(h.co.t) + Math.min(30, h.co.s) * 2 + (h.co.cup || 0) * 8) : 0);
  const human = Math.min(4, F.kids.length) * 20 + F.kids.reduce((s, k) => s + Math.max(0, (k.rel || 60) - 50) * .4, 0) + (F.partner && F.partner.st === 'evli' ? 30 : 0) + h.hap / 3 + Math.min(4, h.flags.hayirsever || 0) * 25 + h.rep * .6 + Math.min(15, h.acp || 0) * 6 + (h.flags.kaptan ? 25 : 0);
  const money = 25 * Math.log10(1 + Math.max(0, (h._w || 0)) / 100) + (o || oh.yr ? Math.min(250, 30 + 40 * Math.sqrt((o ? o.t : 0) + (oh.t || 0)) + (o ? o.cup || 0 : 0) * 8 + Math.min(30, (o ? o.yr : 0) + (oh.yr || 0))) : 0) + (h.fin ? h.fin.biz.length * 15 : 0);
  const dr = dreamDone(h) ? 150 : 0;
  return { foot: Math.round(foot + (h.dream === 'efsane' || h.dream === 'avrupa' || h.dream === 'milli' ? dr : 0)), human: Math.round(human), money: Math.round(money + (h.dream === 'zengin' ? dr : 0)) };
}
const mp = h => { h = h || g; h._w = h === g ? wealth() : h._w; const p = mpParts(h); return p.foot + p.human + p.money; };
const mpT = p => p >= 2400 ? 'Efsane' : p >= 1400 ? 'Yıldız' : p >= 700 ? 'Saygın' : p >= 250 ? 'Sıradan' : 'Unutulmuş';

function defter(h) {
  h = h || g; const F = h.fam, c = h.car, s = [];
  const loc = /[aıou][^aeıioöuü]*$/.test(h.ct) ? 'da' : 'de';
  s.push(`${h.name}, ${h.ct}'${loc}, ${h.city} şehrinde ${FAMW[F.lv]} bir ailede doğdu. Babası ${F.father.n}, annesi ${F.mother.n}.`);
  if (h.acadClub) s.push(`Futbolu ${clubName(h.acadClub.n)} altyapısında öğrendi.`);
  const q = h.qs || []; if (q.length) s.push('Çocukluğunda verdiği kararlar: ' + q.map(x => `${x.a} yaşında “${LANG === 'en' ? T(x.c).toLowerCase() : x.c.toLocaleLowerCase('tr')}”`).join(', ') + '.');
  if (!c.ap) s.push('Profesyonel futbolda forma giyemedi; hayatı sahanın dışında şekillendi.');
  else {
    s.push(`${c.ap} maçta ${c.g} gol, ${c.a} asist üretti${c.t ? `, ${c.t} lig şampiyonluğu yaşadı` : ''}.`);
    if (h.hist.length) s.push(h.hist.length === 1 ? `Tek kulübü ${clubName(h.hist[0].n)} oldu.` : `İlk kulübü ${clubName(h.hist[0].n)}, son kulübü ${clubName(h.hist[h.hist.length - 1].n)}; ${new Set(h.hist.map(x => x.id)).size} kulüpte oynadı.`);
    const tr = [c.cup ? `${c.cup} ulusal kupa` : '', c.ec ? `${c.ec} Şampiyonlar Kupası` : '', c.el ? `${c.el} Avrupa Ligi` : '', c.bal ? `${c.bal} Altın Top` : '', c.gk ? `${c.gk} gol krallığı` : ''].filter(x => x);
    if (tr.length) s.push('Vitrinindekiler: ' + tr.join(', ') + '.');
  }
  if (h.nat && h.nat.caps) s.push(`Milli formayı ${h.nat.caps} kez giydi, ${h.nat.g} gol attı.${h.ntw.wc ? ' Dünya Kupası kazandı.' : h.ntw.rc ? ' Kıta şampiyonu oldu.' : ''}`);
  if (h.sc.length) s.push(`En zor anı ${h.sc[0].a} yaşındaydı: ${h.sc[0].t.toLocaleLowerCase('tr')}.`);
  if (h.rv && (h.rv.ap || c.ap)) { const r = h.rv, cs = x => x.ap * .5 + x.g * 2 + x.t * 60 + (x.cup || 0) * 25; s.push(`Hayatı boyunca yaşıtı ${r.n} ile kıyaslandı; ${cs(c) >= cs(r) ? 'sonunda tarih onu öne yazdı' : 'çoğu zaman onun gölgesinde kaldı'}${r.dost ? ', ama zor gününde yanında oldu' : ''}.`); }
  if (h.co && h.co.s) s.push(`Futbolun ardından ${h.co.s} sezon teknik direktörlük yaptı${h.co.t ? ' ve ' + h.co.t + ' şampiyonluk kazandı' : ''}.`);
  if (h.own || (h.oh && h.oh.n)) s.push(`${clubName(h.own ? h.own.n : h.oh.n)} kulübünün sahibi oldu.`);
  if (h.fin.biz.length) s.push(`Kurduğu şirketler: ${h.fin.biz.map(b => b.n).join(', ')}.`);
  if (F.partner && F.partner.st === 'evli') s.push(`${F.partner.n} ile ${F.partner.y} yıl evli kaldı.`);
  s.push(F.kids.length ? `Geride ${F.kids.length} çocuk bıraktı: ${F.kids.map(k => k.n).join(', ')}.` : 'Geride çocuk bırakmadı.');
  const vv = h.val, mx = ['am', 'sa', 'ai', 'pa'].reduce((a, b) => vv[b] > vv[a] ? b : a);
  s.push({ am: 'Onu tanıyanlar hırsını hatırlıyor.', sa: 'Sadakatiyle anılıyor.', ai: 'Önceliği hep ailesiydi.', pa: 'Kararlarında parayı hep yakından gözetti.' }[mx]);
  s.push(`Bıraktığı servet: ${fm(h === g ? wealth() : h._w || 0)}. Miras Puanı ${mp(h)} — ${mpT(mp(h))}.`);
  return s.join(' ');
}
function copyDefter() { const t = 'Miras FC — ' + defter(); try { navigator.clipboard.writeText(t).then(() => toast('Kopyalandı'), () => toast('Kopyalanamadı; metni seçip kopyala')); } catch (e) { toast('Kopyalanamadı'); } }

/* Mirasçıya geçiş: veraset vergisi ödenir, varlıklar devredilir */
function inherit(ki) {
  const o = g, kid = o.fam.kids[ki]; if (!kid) return;
  const est = wealth(), rate = cinfo(o.ct).inh, tax = Math.round(Math.max(0, est - 500) * rate);
  let cash = o.money + portVal();
  const gen = (o.linN || (o.lin || []).length) + 1, co = o.co || {}, ch = (o.cHist || []).length;
  const legacy = { n: o.name, p: mp(), t: mpT(mp()), a: o.age, gen, y0: o.y0 || o.season - o.age, y1: o.season, ap: o.car.ap, g: o.car.g, tr: o.car.t + o.car.cup + o.car.ec, cs: co.s || 0, ct: co.t || 0, club: o.hist.length ? o.hist[o.hist.length - 1].n : '', own: o.own ? o.own.n : '', kid: kid.n };
  /* bellek dolmasın: kurucu + son 5 kuşak */
  let lin = (o.lin || []).concat([legacy]); if (lin.length > 6) lin = [lin[0]].concat(lin.slice(-5));
  const OW = allOwn(), keep = { sq: Object.fromEntries(OW.filter(x => o.sq && o.sq[x.id]).map(x => [x.id, o.sq[x.id]])), youth: Object.fromEntries(OW.filter(x => o.youth && o.youth[x.id]).map(x => [x.id, o.youth[x.id]])), owns: (o.owns || []).map(x => ({ ...x, t: 0, cup: 0, yr: 0 })), pid: o.pid, moved: o.moved, homeClub: o.homeClub, w: o.w, wid: o.wid, ql: o.ql, chs: o.chs, news: o.news, season: o.season, trh: [], lin, linN: gen, own: o.own ? { ...o.own, t: 0, cup: 0, yr: 0 } : null, props: o.fin.props, biz: o.fin.biz, house: o.fin.house };
  cash -= tax; if (cash < 0) { /* nakit yetmezse emlak satılır */ while (cash < 0 && keep.props.length) cash += keep.props.pop().v; if (cash < 0 && keep.biz.length) cash += keep.biz.pop().v; }
  const st0 = 4 + kid.age * 3.2;
  g = newState({ name: kid.n + ' ' + sur(), ct: o.ct, city: o.city, pos: P(['FW', 'MF', 'DF']), heir: 1 });
  Object.assign(g, { linN: keep.linN, sq: keep.sq, youth: keep.youth, pid: keep.pid, moved: keep.moved, homeClub: keep.homeClub, w: keep.w, wid: keep.wid, ql: keep.ql, chs: keep.chs, news: keep.news, lin, season: keep.season, own: keep.own, owns: keep.owns });
  g.age = kid.age; g.y0 = keep.season - kid.age; g.pot = clr(Math.max(kid.tal + R(-5, 10), rollTalent() - 8), 40, 99); g.mother = o.name;
  K.forEach(k => g.st[k] = clr(st0 * kid.tal / 70 + R(-4, 4), 1, 70));
  if (kid.path === 'futbol') K.forEach(k => g.st[k] = clr(g.st[k] + 3, 1, 75)); if (kid.acad) g.pot = Math.min(99, g.pot + 2); g.edu = kid.edu || 0; if (kid.tough) g.val.am = clr(g.val.am + 8, 0, 100);
  g.money = Math.max(0, Math.round(cash)); g.fin.props = keep.props; g.fin.biz = keep.biz; g.fin.house = keep.house;
  g.fam.lv = clr(1 + Math.log10(1 + Math.max(0, est) / 50) * 1.4, 1, 5);
  g.fam.father = { n: o.name.split(' ')[0], age: o.age, alive: o.handed ? 1 : 0, rel: kid.rel || 60 }; g.fam.mother = { n: o.fam.partner ? o.fam.partner.n : P(FN_F), age: o.fam.partner ? o.fam.partner.age || o.age - 2 : o.age - 2, alive: 1, rel: 70 };
  g.fam.sibs = o.fam.kids.filter((x, i) => i !== ki).map(x => ({ n: x.n, g: x.g, age: x.age, rel: 60 }));
  reindex();
  L(`${o.name} ${o.handed ? 'her şeyi devretti' : 'hayatını kaybetti'}. Mirasçısı ${g.name} oldu. Veraset vergisi: ${fm(tax)}.`);
  if (g.own) L(`Aileden kalan kulüp${(g.owns || []).length ? 'ler' : ''}: ${allOwn().map(x => clubName(x.n)).join(', ')}.`);
  if (g.age < 16) { g.phase = 'child'; if (g.age >= 10 && !g.rv) mkRv(); }
  else if (g.age <= 22) { g.phase = 'pro0'; scr = 'game'; sv(); return startOffers('16'); }
  else { g.phase = 'retired'; L('Futbol için geç; ailenin mirasını yönetmeye odaklanıyorsun.'); }
  scr = 'game'; tab = 'home'; sv(); draw();
}
/* Emeklilikte çocuğa devretme (karakterin hayatı burada biter) */
const canHand = () => g.fam.kids.length && (g.phase === 'retired' || g.phase === 'coach' || g.age >= 35);
function handOver(ki) {
  const k = g.fam.kids[ki]; if (!k) return; if (k.g !== 'E') return toast('Mirası sadece oğulların devralabilir'); if ((k.rel || 60) < 20) return toast(`${k.n} ile aranız çok kötü (bağ ${Math.round(k.rel)}). Önce ona zaman ayır.`); if (!canHand()) return toast('Devretmek için futbolu bırakmış ya da 35 yaşını geçmiş olmalısın');
  ask(`Her şeyi ${k.n}'${loc(k.n)} devret ve onunla devam et? ${g.name} hikâyeden çekilir; servet, şirketler${g.own ? ', kulüp' : ''} mirasçıya geçer (veraset vergisi ödenir).`, () => {
    L(`${g.name} her şeyi ${k.n}'${loc(k.n)} devretti ve sessiz bir hayata çekildi.`); g.ended = 1; g.handed = 1; inherit(ki);
  });
}

/* ---------- Miras kuralları (v2.4) ----------
   - Kariyer erkek futbolcu üzerine kurulu: mirası yalnızca oğullar devralır.
   - Kurucudan çocuğa ilk devir ücretsiz. Torun ve sonraki kuşaklar için
     "Miras Paketi" gerekir; paket sadece O KAYIT için geçerlidir (g.heirPass),
     yeni bir kayıtta yeniden alınır. Fiyat düşük tutuldu. */
const heirOK = k => !!k && k.g === 'E';
const heirGen = () => (g.linN || (g.lin || []).length) + 1;
const needHeirPass = () => heirGen() >= 2 && !g.heirPass;
const heirPrice = () => { const p = IAP_P.find(x => x.id === 'miras'); return p ? (acct().lang === 'en' ? p.usd : p.tl) : ''; };
function heirBuy(cb, asked) {
  const done = () => { g.heirPass = 1; sv(); toast('Miras Paketi bu kayıt için açıldı'); if (cb) cb(); else draw(); };
  if (window.MirasNative && window.MirasNative.purchase) return window.MirasNative.purchase('miras', ok => ok && done());
  if (!asked) return IAP.buy('miras', done);
  done();
}
function heirGo(ki, hand) {
  const k = g.fam.kids[ki]; if (!heirOK(k)) return toast('Mirası sadece oğulların devralabilir');
  const go = () => hand ? handOver(ki) : inherit(ki);
  if (!needHeirPass()) return go();
  ask(`${heirGen() + 1}. kuşağa geçmek için Miras Paketi gerekir (${heirPrice()}). Paket yalnızca bu kayıt için geçerlidir; alınca bu ailenin bütün kuşakları açılır.`, () => heirBuy(go, 1), 'Paketi al');
}
const _inherit0 = inherit;
inherit = function (ki) { const k = g.fam.kids[ki], pass = g.heirPass; if (!heirOK(k)) return toast('Mirası sadece oğulların devralabilir'); _inherit0(ki); if (pass) { g.heirPass = 1; sv(); } };
function heirListHTML(btn) {
  const F = g.fam, sons = F.kids.map((k, i) => [k, i]).filter(([k]) => heirOK(k)), dau = F.kids.filter(k => !heirOK(k)).length;
  if (!sons.length) return `<p class="m">${dau ? 'Mirası devralabilecek bir oğlun yok; hikâye seninle biter.' : 'Henüz çocuğun yok. Mirasçın olmazsa hikâye seninle biter.'}</p>`;
  const pass = needHeirPass() ? `<p class="m">🔒 ${heirGen() + 1}. kuşak için Miras Paketi gerekir · ${heirPrice()} · yalnızca bu kayıt için</p>` : '';
  return pass + sons.map(([k, i]) => `<div class="asset"><div><b>${esc(k.n)}</b><span class="m">${k.age} yaş · futbol yeteneği ${k.tal} · bağınız ${Math.round(k.rel || 60)}</span></div><button class="chip" onclick="heirGo(${i},${btn ? 1 : 0})">${btn ? 'Devret ve devam et' : 'Onunla devam et'}</button></div>`).join('') + (dau ? `<p class="m">Kızların mirası devralmaz.</p>` : '');
}

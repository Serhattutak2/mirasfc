/* ============================================================
   MİRAS FC — HAYAT: doğum, aile, arkadaşlar, çocukluk,
   olay seçimi (kimlikle), işler, ilişkilerin zamanla değişmesi,
   yaşayan rakip
   ============================================================ */
const JOBS = [null, ['inşaat işçisi', 'evlere temizliğe giden bir kadın'], ['servis şoförü', 'tekstil atölyesinde çalışan bir kadın'], ['belediyede memur', 'ilkokul öğretmeni'], ['küçük bir hırdavat dükkânının sahibi', 'hastanede hemşire'], ['bir inşaat şirketinin sahibi', 'mimar']];
const HOME = [null, 'şehrin kenar mahallesinde, tek göz bir gecekonduda', 'eski bir apartmanın bodrum katında', 'sakin bir mahallede, üç katlı bir apartmanda', 'bahçeli müstakil bir evde', 'şehrin en iyi semtinde, geniş bir villada'];
const FAMW = [null, 'çok yoksul', 'dar gelirli', 'orta halli', 'rahat', 'varlıklı'];
const FN_M = ['Hasan', 'Mehmet', 'Ahmet', 'Mustafa', 'Hüseyin', 'İbrahim', 'Murat', 'Kemal', 'Osman', 'Rıza', 'Selim', 'Cemal'];
const FN_F = ['Fatma', 'Ayşe', 'Emine', 'Hatice', 'Zeynep', 'Sevgi', 'Gülay', 'Nermin', 'Sema', 'Leyla', 'Hülya', 'Nurten'];
const ARCS = { erken: 'Erken patlayan', gec: 'Geç açılan', istikrarli: 'İstikrarlı', dalgali: 'Dalgalı' };

function mkFamily() {
  const lv = R(1, 5);
  const f = { lv, father: { n: P(FN_M), age: R(24, 38), alive: 1, rel: 60 }, mother: { n: P(FN_F), age: R(22, 35), alive: 1, rel: 65 }, sibs: [], partner: null, kids: [], ex: [], grand: 0 };
  for (let i = R(0, 2); i > 0; i--) { const gg = Math.random() < .5 ? 'E' : 'K'; f.sibs.push({ n: P(gg === 'E' ? KID_M : KID_F), g: gg, age: R(-6, 8), rel: 60 }); }
  return f;
}
/* Yetenek dağılımı: her oyun farklı; bazen zayıf, bazen dahi */
function rollTalent() { const r = Math.random(); return r < .3 ? R(44, 62) : r < .75 ? R(62, 80) : r < .95 ? R(80, 90) : R(90, 97); }
function addFriend(type, rel, name) { g.friends = g.friends || []; if (g.friends.length >= 6) return; const n = name || P(FRIEND_N.filter(x => !g.friends.some(f => f.n === x))) || P(FRIEND_N); g.friends.push({ n, type, rel: rel || 60, since: g.age }); L(`${n} ile yakın arkadaş oldunuz.`); }

/* ---------- Çocukluk anlatısı ---------- */
function storyYear(a) {
  const F = g.fam, fl = g.flags, fa = F.father, mo = F.mother, s = [], fr = friend(), hc = g.homeClub ? cname(g.homeClub) : null;
  const idol = fl.idol ? alter(fl.idol) : null;
  if (a === 1) s.push(P(['İlk adımlarını salondaki halının üstünde attın; elinden bırakmadığın şey plastik bir toptu.', 'Bir yaşındayken yuvarlanan her şeyin peşinden emekliyordun. Annen buna “top merakı” diyordu.']));
  if (a === 2) s.push(P(['Deden sana küçük, deri bir top hediye etti. Ona bir isim bile koydun.', `Baban ${fa.n} akşamları yorgun gelse de seninle salonda topu yuvarlamadan uyumuyordu.`]));
  if (a === 3) s.push(P(['Kreşte öğretmenin, diğer çocuklar oyuncaklarla oynarken senin hep bahçede top kovaladığını anlattı.', 'İlk kez bir duvara top vurup döneni yakalamayı denedin. Saatlerce sürdü.']));
  if (a === 4) { s.push(F.lv >= 2 ? `Babanın omzunda ilk kez ${hc || 'şehrin kulübünün'} maçına gittin. Tribünün uğultusu o gece rüyalarına girdi.` : 'Kahvehanenin televizyonunda büyük bir maçı izledin; kalabalık her gol sesinde ayağa kalkıyordu ve sen de onlarla birlikte bağırıyordun.'); if (!fr) addFriend('çocukluk', 70); }
  if (a === 6) {
    s.push('İlkokula başladın. Teneffüs zili çaldığında sınıftan ilk koşan hep sendin.');
    if (fl.baba) s.push(`Baban ${fa.n} her akşam işten dönünce seninle parkta pas yapıyor; “sol ayağını da kullan” diye tekrarlıyor.`);
    if (fl.sokak) s.push('Mahallenin büyük çocukları seni artık kaleye değil, sahaya alıyor. Dizlerinde hiç kabuk eksik olmuyor.');
    if (fl.idol) s.push(`Odanın duvarında ${idol} posteri asılı; onun gol sevincini aynada çalışıyorsun.`);
    if (fl.okul1) s.push(`Annen ${mo.n} karnene bakıp gülümsüyor. “Önce okul” sözünü tuttun.`);
  }
  if (a === 7) s.push(fr ? `${fr.n} ile mahallede iki taştan kale kurup akşama kadar oynuyorsunuz.` : P(['Mahalle turnuvasında ilk golünü attın ve sahayı bir uçtan bir uca koştun.', 'Okul bahçesindeki maçlarda takımları kuran kişi oldun.']));
  if (a === 8) s.push(F.lv <= 2 ? 'Kramponun yoktu; lastik ayakkabılarla oynuyordun ve burunları hep delikti. Annen gece yamıyordu.' : 'Doğum gününde ilk gerçek kramponların geldi. Bir hafta yatağının yanında uyudular.');
  if (a === 10) {
    if (fl.fokulu) s.push('Futbol okulunda antrenörün tekniğine dikkat çekti; seni bir üst yaş grubuyla çalıştırıyor.');
    if (fl.belediye) s.push(`${hc} minikler takımıyla ilk deplasmanına gittin. Dönüşte otobüste herkes şarkı söylüyordu; kazanmıştınız.`);
    if (fl.sokak2) s.push('Sokakta öğrendiğin çalımlar mahallede efsane oldu. “Topu ondan almak imkânsız” diyorlar.');
    if (fl.atletizm) s.push('Okulun 100 metre yarışını açık farkla kazandın. Beden öğretmenin atletizm için ısrar ediyor.');
  }
  if (a === 11) s.push(g.rv ? `Yaşıtın ${g.rv.n} ile aynı turnuvada karşılaştınız. O gün o iki gol attı, sen bir. Yolunuz bundan sonra hep kesişecek.` : 'Yaz boyunca sabah erkenden çıkıp akşam ezanına kadar top oynadın.');
  if (a === 13) {
    const ac = g.acadClub ? clubName(g.acadClub.n) : null;
    if (g.acad === 2) s.push(`${ac} yurdundaki ilk kışın zor geçti. Telefonda annenin sesini duyunca ağlamamak için kendini zor tuttun ama sabah antrenmanına herkesten önce çıktın.`);
    else if (g.acad === 3) s.push(`${ac} akademisinde yabancı bir dilde antrenman notu tutmayı öğrendin. Soyunma odasında ilk esprini yaptın ve herkes güldü.`);
    else if (g.acad === 1) s.push(`${ac} altyapısında hafta sonları ligde oynuyorsun. Tribünde ailen hep aynı yerde, aynı battaniyenin altında.`);
    else s.push(`Okul takımında kaptansın. Hafta sonları ${fl.baba ? 'babanla' : 'tek başına'} parkta ek çalışma yapıyorsun.`);
  }
  if (a === 14) s.push(P(['Bir yaz içinde boyun on santim uzadı. Dizlerin ağrıyor ama hızın arttı.', 'Aynaya baktığında çocukluğun yavaşça çekiliyor. Antrenörün “artık oyunu okumayı öğren” diyor.']));
  if (a === 16) s.push('On altı yaşına girdin. Kapıda profesyonel futbolun eşiği var.');
  if (!s.length) s.push(P(['Mevsimler geçti; top hep ayağındaydı.', 'Okul, ev ve saha arasında bir yıl daha geçti.', 'Bu yıl en çok duvara pas çalıştın; duvar hiç yorulmadı.', `${F.sibs.length ? 'Kardeşlerinle' : 'Arkadaşlarınla'} yaz akşamları sokakta maç yaptınız.`]));
  return s.join(' ');
}

/* ---------- Çocukluk yılı ---------- */
const childAgeF = () => ({ erken: 1.25, gec: .8, istikrarli: 1, dalgali: R(70, 130) / 100 }[g.arc] || 1);
function childYear() {
  g.age++; g.season++;
  const a = g.age;
  if (a >= 4) K.forEach(k => {
    let d = g.pot / 99 * (a <= 8 ? R(1, 3) : R(2, 4)) * childAgeF();
    if (g.acad === 1) d *= 1.15; if (g.acad === 2) d *= 1.3; if (g.acad === 3) d *= 1.4;
    if (g.flags.fokulu && (k === 'tek' || k === 'pas')) d += .6;
    if (g.flags.atletizm && k === 'hiz') d += .6;
    if (g.flags.sokak2 && k === 'tek') d += .6;
    const sw = g.style && STYLES[g.pos] && STYLES[g.pos][g.style] ? STYLES[g.pos][g.style][1][k] || 0 : 0; d += sw * (a <= 9 ? .4 : .7);
    up(k, Math.round(d));
  });
  famAge(); relYear();
  g.hap = clr(g.hap + R(-3, 4), 0, 100);
  if (a === 10 && !g.rv) mkRv();
  const txt = storyYear(a); g.story.unshift({ a, t: txt }); L(txt);
  if (a >= 16) { g.phase = 'pro0'; g.ev = null; g.q = null; g.evq = []; startOffers('16'); return; }
  if (a === 15) { const opts = ['menajer', 'sakatlik', 'aile']; if (ovr() >= 42) opts.push('milli'); if (g.acad) opts.push('ilk'); g.q = { age: 15, k: P(opts) }; }
  else if (MS[a]) g.q = { age: a };
  if (a >= 6) { g.evq = []; const n = Math.random() < .45 ? 2 : 1; for (let i = 0; i < n; i++) { const e = pickChildEvent(); if (e && !g.evq.some(x => x.id === e.id)) g.evq.push(e); } nextEv(); }
  tidy(); sv(); draw();
}
let msDef = q => q.age === 15 ? MS15[q.k] : MS[q.age];
function answerQ(i) {
  const q = g.q; if (!q) return; const d = msDef(q), opts = visOpts(d.c), c = opts[i]; if (!c) return;
  c.f(); applyV(c.v);
  g.qs.push({ a: g.age, t: d.t.split('— ')[1], c: c.l }); L(`${d.t}: ${c.l}`); g.q = null; tidy(); sv(); draw();
}
const visOpts = cs => cs.filter(c => !c.if || c.if());
const optLabel = (c, x) => typeof c.l === 'function' ? c.l(x || {}) : c.l;
function applyV(v) { if (v) ['am', 'sa', 'ai', 'pa'].forEach((k, j) => g.val[k] = clr(g.val[k] + v[j], 0, 100)); }
function nextEv() { if (!g.ev && g.evq && g.evq.length) g.ev = g.evq.shift(); }

/* ---------- Olay seçimi ---------- */
function buildEv(e) { const x = e.pre ? e.pre() : {}; return { id: e.id, x, t: typeof e.t === 'function' ? e.t(x) : e.t }; }
function pickChildEvent() { const y = g.age, c = CH_EV.filter(e => y >= e.a[0] && y <= e.a[1] && (!e.f || e.f()) && g.mem[e.id] == null); return c.length ? buildEv(P(c)) : null; }
const PEV = new Set(['tanis', 'p_ilk', 'evlilik', 'bebek', 'p_tatil', 'p_is', 'p_aile', 'p_kiskanc', 'p_yil', 'ihmal', 'aldatma']);
function pickAdultEvent() {
  const y = g.age, M = g.mem;
  const c = AD_EV.filter(e => y >= e.a[0] && y <= e.a[1] && (!e.f || e.f()) && !(e.once && M[e.id] != null) && !(e.cd && M[e.id] != null && y - M[e.id] < e.cd) && !(PEV.has(e.id) && g.pEvY === y));
  if (!c.length) return null;
  let t = c.reduce((s, e) => s + (e.w || 1), 0) * Math.random(); for (const e of c) { t -= e.w || 1; if (t <= 0) return buildEv(e); }
  return buildEv(c[0]);
}
function evOptions(ev) { const d = EVMAP[ev.id]; return d ? visOpts(d.c) : []; }
function choose(i) {
  const ev = g.ev; if (!ev) return; const opts = evOptions(ev), c = opts[i];
  if (!c) { g.ev = null; nextEv(); sv(); draw(); return; }
  g.mem[ev.id] = g.age; if (PEV.has(ev.id)) g.pEvY = g.age; MCTX = String(ev.t).slice(0, 200); c.f(ev.x || {}); MCTX = ''; applyV(c.v);
  L(ev.t + ' → ' + optLabel(c, ev.x)); g.ev = null; nextEv(); tidy(); sv(); draw();
}
function autoChoose() {
  const ev = g.ev; if (!ev) return; const opts = evOptions(ev); if (!opts.length) { g.ev = null; return; }
  let best = 0, bv = -1e9; opts.forEach((c, i) => { const d = c.v || [0, 0, 0, 0]; const v = ['am', 'sa', 'ai', 'pa'].reduce((s, k, j) => s + d[j] * g.val[k], 0) + Math.random() * 50; if (v > bv) { bv = v; best = i; } });
  const c = opts[best]; g.mem[ev.id] = g.age; MCTX = String(ev.t).slice(0, 200); c.f(ev.x || {}); MCTX = ''; applyV(c.v); L(ev.t + ' → ' + optLabel(c, ev.x)); g.ev = null; nextEv(); tidy();
}

/* ---------- Aile ---------- */
function famAge() {
  const F = g.fam;
  [F.father, F.mother].forEach((p, i) => {
    if (!p.alive) return; p.age++;
    const risk = p.age > 62 ? (p.age - 60) / 200 * (p.health ? .6 : 1) : 0;
    if (Math.random() < risk) { p.alive = 0; g.hap -= 20; L(`${i ? 'Annen' : 'Baban'} ${p.n} hayatını kaybetti. ${p.rel >= 70 ? 'Son yıllarınız yakın geçmişti; en azından bu teselli.' : 'Söylenmemiş sözler içinde kaldı.'}`); g.flags['kayip' + i] = 1; news(`${g.name}'${loc(g.name)} acı gün: ${i ? 'annesi' : 'babası'} vefat etti.`); }
  });
  F.sibs.forEach(s => s.age++);
  F.kids.forEach(k => { k.age++; if (k.age <= 18) k.tal = clr((k.tal || 50) + R(-1, 2) + (k.rel > 70 ? 1 : 0) + (k.acad ? 1 : 0), 1, 99); });
  if (F.partner) {
    F.partner.y++; F.partner.age = (F.partner.age || g.age) + 1; if (F.partner.far) F.partner.far--;
    if (F.partner.st === 'flört' && F.partner.rel >= 52) { F.partner.st = 'sevgili'; pmem('ilişkinizi resmileştirdiniz'); L(`${F.partner.n} ile artık resmen sevgilisiniz.`); } else if (F.partner.st === 'flört' && F.partner.rel < 40) { L(`${F.partner.n} ile görüşmeler kendiliğinden bitti.`); F.ex.push(F.partner.n); F.partner = null; g.flags.ayrilikYas = g.age; }
  }
  if (F.partner) {
    if (F.partner.age > 70 && Math.random() < (F.partner.age - 68) / 120) { g.hap -= 30; L(`Hayat arkadaşın ${F.partner.n} hayatını kaybetti.`); F.ex.push(F.partner.n); F.partner = null; }
  }
  (g.friends || []).forEach(f => { if (!f.dead && g.age > 60 && Math.random() < (g.age - 58) / 300) { f.dead = 1; g.hap -= 8; L(`Eski dostun ${f.n} hayatını kaybetti.`); } });
  if (g.flags.bebekYolda) { g.flags.bebekYolda = 0; birth(); }
}
/* Yıllık ilişki değişimi (emeklilikte / çocuklukta; profesyonel hayatta haftalık işler) */
function relYear() {
  if (g.phase === 'child') { aliveParent().forEach(p => relAdj(p, R(-1, 3))); (g.friends || []).forEach(f => relAdj(f, R(-3, 2))); return; }
}
/* Haftalık ihmal: zaman ayırmazsan ilişkiler aşınır */
function relWeek() {
  const F = g.fam, tw = g.tw || 0, since = k => tw - ((g.touch || {})[k] || 0);
  if (F.partner) { const pr = F.partner, fl = { romantik: 1.3, kiskanc: 1.2, sakin: .8, kariyerci: .6, maceraci: 1 }[pr.tr] || 1; relAdj(pr, since('p') > 4 ? -.45 * fl * (pr.far ? .6 : 1) : since('p') > 2 ? -.12 : .05); if (pr.st === 'evli' && pr.rel < 22 && !pr.kriz) pr.rel = 22; }
  F.kids.forEach((k, i) => { const sk = since('k' + i); relAdj(k, k.age < 25 ? (sk > 3 ? -.6 : 0) : (sk > 6 ? -.3 : 0)); if (k.rel < 20 && !k.kus && k.age >= 12) { k.kus = 1; L(`${k.n} seninle konuşmuyor. Ona zaman ayırmazsan aranızdaki mesafe büyüyecek.`); } if (k.rel >= 35) k.kus = 0; });
  aliveParent().forEach((p, i) => relAdj(p, since('par') > 6 ? -.35 : 0));
  (g.friends || []).forEach((f, i) => { if (!f.dead) relAdj(f, since('f' + i) > 6 ? -.5 : 0); });
}
const touch = k => { g.touch = g.touch || {}; g.touch[k] = g.tw || 0; };
function wedding(big) {
  const p = g.fam.partner, c = big ? famCost(60) + Math.round(g.rep) : famCost(8);
  money(-c, 'Düğün'); p.st = 'evli'; pmem(big ? 'görkemli bir düğün' : 'sade bir nikâh'); g.hap += big ? 14 : 10; relAdj(p, big ? 12 : 8); if (big) g.rep += 3;
  L(`${p.n} ile evlendin. ${big ? 'Görkemli düğün' : 'Sade nikâh'} ${fm(c)} tuttu.`); news(`${g.name} evlendi.`);
}
function birth() {
  const gg = Math.random() < .5 ? 'E' : 'K', sug = P(gg === 'E' ? KID_M : KID_F);
  g.fam.kids.push({ n: sug, g: gg, age: 0, tal: clr(R(30, 70) + (g.pot - 60) * .3, 1, 99), rel: 70 }); g.hap += 15;
  L(`${gg === 'E' ? 'Bir oğlun' : 'Bir kızın'} oldu!`); g.nameKid = g.fam.kids.length - 1;
}
function nameKid(n) { const k = g.fam.kids[g.nameKid]; if (k && n && n.trim()) { k.n = n.trim().slice(0, 18); L(`Çocuğunun adını ${k.n} koydun.`); } g.nameKid = null; sv(); draw(); }
function breakup() {
  const p = g.fam.partner; if (!p) return;
  g.fam.ex.push(p.n); g.hap -= 15;
  if (p.st === 'evli') { const pay = Math.round(Math.max(0, g.money) * .3); money(-pay, 'Boşanma: nafaka ve mal paylaşımı'); L(`${p.n} ile boşandınız. Nafaka ve mal paylaşımı: ${fm(pay)}.`); g.fam.kids.forEach(k => relAdj(k, -8)); }
  else L(`${p.n} ile yollarınız ayrıldı.`);
  g.fam.partner = null; g.flags.ayrilikYas = g.age;
}

/* ---------- İşler ---------- */
const JOBLIST = {
  kurye: { n: 'Kurye', pay: 2, en: 15, if: () => g.age >= 16 && !g.club },
  garson: { n: 'Garson', pay: 1.5, en: 12, if: () => g.age >= 14 && !g.club },
  magaza: { n: 'Spor mağazası satış', pay: 2.5, en: 14, if: () => g.age >= 17 && !g.club },
  akademi: { n: 'Altyapı antrenörü', pay: 6, en: 15, if: () => g.age >= 24 && g.phase !== 'pro' },
  yorumcu: { n: 'TV maç yorumcusu', pay: 25, en: 12, if: () => g.phase === 'retired' && g.rep >= 25 },
  danisman: { n: 'Kulüp danışmanı', pay: 15, en: 15, if: () => g.phase === 'retired' && g.car.ap > 150 },
  ofis: { n: 'Ofis işi', pay: 4, en: 18, if: () => g.age >= 20 && g.edu >= 1 && g.phase !== 'pro' },
};
function takeJob(k) { g.job = { k }; L(`Yeni işin: ${JOBLIST[k].n}.`); sv(); draw(); }
function quitJob() { if (g.job) L(`${JOBLIST[g.job.k].n} işinden ayrıldın.`); g.job = null; sv(); draw(); }

/* ---------- Yaşayan rakip ---------- */
const rvOn = () => g.rv && !g.rv.ret && g.rv.club;
function mkRv() {
  const NP = NAMES[cinfo(g.ct).lang] || NAMES.tr;
  g.rv = { n: P(NP.f) + ' ' + P(NP.l), ct: g.ct, pos: P(['FW', 'MF', 'DF']), o: clr(ovr() + R(-6, 6), 10, 70), pot: clr(g.pot + R(-8, 10), 50, 96), club: null, ap: 0, g: 0, a: 0, t: 0, cup: 0, nat: 0, ret: 0 };
  L(`Şehrinde seninle her konuda yarışan bir çocuk var: ${g.rv.n}.`);
}
function rvYear() {
  const r = g.rv; if (!r || r.ret) return; const a = g.age;
  r.o = clr(r.o + (a <= 21 ? r.pot / 99 * R(2, 6) : a <= 28 ? R(0, 2) : -R(1, 3)), 1, Math.min(99, r.pot + 5));
  if (r.club) { const c = club(r.club.id); if (c) { r.club.n = c.n; r.club.t = c.t; r.club.ct = clubCt(c.id); } else r.club = null; }
  if (r.club && a >= 17) {
    const c = club(r.club.id), role = roleFor(r.o, c.s, a), n = Math.round(R(28, 40) * [.1, .25, .55, .85, .95][role]);
    r.ap += n; r.g += Math.round(n * { FW: .45, MF: .14, DF: .04 }[r.pos] * r.o / 75 * R(70, 130) / 100); r.a += Math.round(n * { FW: .15, MF: .2, DF: .05 }[r.pos] * r.o / 75);
    if (g.chs[c.id] && c.t === 1 && role >= 2) { r.t++; news(`Rakibin ${r.n}, ${clubName(c.n)} ile şampiyon oldu.`); }
    if (c.t === 1 && Math.random() < .07) r.cup++;
    if (r.o >= natNeed(r.ct)) r.nat += R(4, 8);
  }
  if (!r.club && a >= 16 && a <= 24) { const T = g.w[r.ct].flat().filter(c => roleFor(r.o, c.s, a) >= 1); if (T.length) { const c = P(T.sort((x, y) => y.s - x.s).slice(0, 10)); r.club = { id: c.id, n: c.n, ct: r.ct, t: c.t }; L(`Rakibin ${r.n} profesyonel oldu: ${clubName(c.n)}.`); } }
  else if (r.club && a <= 31 && Math.random() < .22) {
    const ct = r.o >= 74 && Math.random() < .4 ? P(COUNTRIES).n : r.club.ct, cur = club(r.club.id);
    const c = P(g.w[ct].flat().filter(x => cur && x.s > cur.s && roleFor(r.o, x.s, a) >= 2));
    if (c) { r.club = { id: c.id, n: c.n, ct, t: c.t }; L(`Rakibin ${r.n}, ${clubName(c.n)} (${tierName(ct, c.t)}) ile anlaştı.`); news(`${r.n} → ${clubName(c.n)}`); }
  }
  if (a >= 33 && (r.o < 55 || Math.random() < (a - 32) / 7)) { r.ret = 1; L(`Rakibin ${r.n} futbolu bıraktı.`); }
}

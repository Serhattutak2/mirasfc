/* ============================================================
   MİRAS FC — HİKÂYE ÇEŞİTLİLİĞİ (v3.2)
   Her hayat aynı anlatılmasın: ülkeye (bölge), ailenin ekonomik
   durumuna ve şansa göre farklı çocukluk satırları, farklı dönüm
   noktası soruları ve yeni olaylar.
   ============================================================ */
const REGION = { 'Türkiye': 'tr', 'Brezilya': 'latam', 'Arjantin': 'latam', 'Meksika': 'latam', 'Uruguay': 'latam', 'İngiltere': 'west', 'İspanya': 'west', 'Almanya': 'west', 'İtalya': 'west', 'Fransa': 'west', 'Hollanda': 'west', 'Portekiz': 'west', 'Belçika': 'west', 'Yunanistan': 'east', 'Sırbistan': 'east', 'Hırvatistan': 'east', 'Suudi Arabistan': 'arab', 'Mısır': 'arab', 'Fas': 'arab', 'Japonya': 'asia', 'Güney Kore': 'asia', 'ABD': 'us' };
const reg = () => REGION[g.ct] || 'west';
const poor = () => g.fam.lv <= 2, rich = () => g.fam.lv >= 4;

/* ---------- yıllık anlatıya renk katan satırlar (tekrar etmez) ---------- */
const FLAV = [
  { a: [3, 8], r: 'tr', t: 'Bayram sabahı dedenin elini öptün; harçlığınla ilk kendi topunu aldın.' },
  { a: [5, 10], r: 'tr', t: 'Mahalle arasında kale direği iki taş, hakem de bakkal amcaydı. Akşam ezanı maçı bitiren düdüktü.' },
  { a: [6, 12], r: 'tr', t: 'Yaz tatilini köyde geçirdin; harman yerinde amcaoğullarınla toz duman içinde maç yaptınız.' },
  { a: [8, 14], r: 'tr', t: 'Derbi günü mahallede kimse sokakta değildi; bütün sokak tek bir televizyonun başına toplandı.' },
  { a: [4, 9], r: 'latam', t: 'Sokakta yalınayak, plastik şişeden yapılmış bir topla oynadın. Topu ayağında tutmayı orada öğrendin.' },
  { a: [7, 13], r: 'latam', t: 'Plajda futvôlei oynayan gençleri saatlerce izledin; top hiç yere düşmüyordu.' },
  { a: [8, 14], r: 'latam', t: 'Mahallenin duvarına büyük bir futbolcunun resmini çizdiler. Her sabah okula giderken ona selam veriyordun.' },
  { a: [6, 12], r: 'latam', t: 'Pazar günleri bütün mahalle çimsiz bir sahada toplanıyor; maç bitene kadar barbekü dumanı eksik olmuyor.' },
  { a: [5, 10], r: 'west', t: 'Cumartesi sabahları yağmur da yağsa çamurlu sahalarda kulüp maçına gidiyordun; annen termosla çay getiriyordu.' },
  { a: [7, 13], r: 'west', t: 'Okul takımının antrenörü, beden eğitimi öğretmeniydi. İlk taktik tahtasını ondan gördün.' },
  { a: [9, 15], r: 'west', t: 'Kulübün sezon kartını hediye aldın; her maç aynı koltukta, aynı atkıyla oturdun.' },
  { a: [5, 11], r: 'east', t: 'Kış uzun ve sertti; spor salonunda futsal oynayarak top tekniğini geliştirdin.' },
  { a: [8, 14], r: 'east', t: 'Mahallenin betondan sahasında demir kalelere çarpan topun sesi akşama kadar susmadı.' },
  { a: [5, 11], r: 'arab', t: 'Akşam serinliğinde, gün batarken kum sahalarda maç başlıyordu. Gece ışıkları yanınca kimse eve dönmek istemiyordu.' },
  { a: [8, 14], r: 'arab', t: 'Okulun avlusundaki maçlarda öğretmenler bile oyuna katılıyordu.' },
  { a: [5, 11], r: 'asia', t: 'Okulda disiplin büyüktü; ders bitince herkes sahayı süpürür, sonra antrenmana başlardı.' },
  { a: [8, 14], r: 'asia', t: 'Gece yarısı uyanıp Avrupa maçlarını izledin; sabah okulda gözlerin kapanıyordu.' },
  { a: [5, 11], r: 'us', t: 'Okulda herkes başka sporlara yöneliyordu ama sen soccer topunu bırakmadın.' },
  { a: [9, 15], r: 'us', t: 'Yaz kampında üniversite antrenörleri seni not aldı; “Bu çocuk farklı” dediler.' },
  { a: [3, 9], e: 'poor', t: 'Evde elektrik kesildiğinde mum ışığında sokak lambasının altında top sektirdin.' },
  { a: [7, 13], e: 'poor', t: 'Hafta sonları pazarda babana yardım ettin; aradaki boş saatlerde tezgâhların arasında top oynadın.' },
  { a: [9, 15], e: 'poor', t: 'Ayakkabının tabanı ayrılınca bantla yapıştırdın. Takım arkadaşların güldü, sen gol attın.' },
  { a: [10, 15], e: 'poor', t: 'Okul çıkışı simit satarak kazandığın parayla ilk forma setini aldın.' },
  { a: [5, 11], e: 'rich', t: 'Doğum gününde bahçeye küçük bir sentetik saha kurdurdular; bütün sınıf maça geldi.' },
  { a: [8, 14], e: 'rich', t: 'Yaz tatilinde yurtdışında bir futbol kampına gittin; ilk kez yabancı çocuklarla takım oldun.' },
  { a: [10, 15], e: 'rich', t: 'Özel antrenör haftada iki gün eve geliyor. “Yetenek para ile alınmaz” diyor ve seni zorluyor.' },
  { a: [4, 15], t: 'Bir gece rüyanda dolu bir stadyumda gol attığını gördün. Uyandığında hâlâ kalbin hızlı atıyordu.' },
  { a: [6, 14], t: 'Bir köpek yavrusu sahiplendin; adını en sevdiğin futbolcunun adı koydun. Topu ondan kaçırmak en iyi çalım antrenmanıydı.' },
  { a: [7, 15], t: 'Bileğini burktun; iki hafta topsuz kalmak sana iki yıl gibi geldi.' },
  { a: [9, 15], t: 'Mahallede “ikinci el” bir futbol oyun konsolu dolaşıyordu; sırayla oynuyordunuz ama sen hep taktik ekranında kalıyordun.' },
  { a: [10, 15], t: 'Bir turnuvada rakip takımın antrenörü maçtan sonra yanına gelip elini sıktı. O an büyük bir şeyin parçası olduğunu hissettin.' },
  { a: [11, 15], t: 'İlk kez bir maçta kırmızı kart gördün. Eve dönerken baban hiç konuşmadı; ertesi sabah ise “herkes hata yapar” dedi.' },
];
const _storyYear0 = storyYear;
storyYear = function (a) {
  const base = _storyYear0(a), used = g.flags.fl || (g.flags.fl = []), r = reg(), e = poor() ? 'poor' : rich() ? 'rich' : 'mid';
  if (Math.random() > .65) return base;
  const c = FLAV.map((x, i) => [x, i]).filter(([x, i]) => a >= x.a[0] && a <= x.a[1] && (!x.r || x.r === r) && (!x.e || x.e === e) && !used.includes(i));
  if (!c.length) return base; const [x, i] = P(c); used.push(i); return base + ' ' + x.t;
};

/* ---------- dönüm noktalarının farklı sürümleri ---------- */
const MSV = {
  5: [
    { id: 'tr5', if: () => reg() === 'tr', t: 'Dönüm noktası 1/4 — Sokağın çocuğu', d: 'Mahallede herkes top peşinde. Seni futbola kim bağlayacak?', c: [
      { l: 'Bakkal amcanın kurduğu mahalle takımı', d: 'Takım ruhu ve fizik artar, mahallede bir dost edinirsin.', f: () => { g.flags.sokak = 1; up('fiz', 2); up('def', 2); addFriend('çocukluk', 70); }, v: [2, 3, 0, 0] },
      { l: 'Ağabeyinin arkadaşlarıyla okul bahçesinde', d: 'Büyüklerle oynamak tekniğini zorlar.', f: () => { up('tek', 3); up('hiz', 2); }, v: [3, 0, 1, 0] },
      { l: 'Dedenin anlattığı eski maç hikâyeleri', d: 'Oyunu okumayı erken öğrenirsin; ailene bağlanırsın.', f: () => { up('pas', 3); g.flags.dede = 1; relAdj(g.fam.father, 6); }, v: [0, 2, 4, 0] },
    ] },
    { id: 'latam5', if: () => reg() === 'latam', t: 'Dönüm noktası 1/4 — Kum ve sokak', d: 'Futbol burada bir dil. Sen o dili nerede öğreneceksin?', c: [
      { l: 'Sokakta yalınayak', d: 'Teknik çok artar.', f: () => { g.flags.sokak = 1; up('tek', 5); }, v: [3, 0, 0, 0] },
      { l: 'Plajda futvôlei ve kum maçları', d: 'Denge, kafa ve fizik artar.', f: () => { up('fiz', 3); up('tek', 2); g.flags.kum = 1; }, v: [2, 0, 1, 0] },
      { l: 'Kilise salonundaki futsal takımı', d: 'Pas ve kısa alanda karar verme gelişir.', f: () => { up('pas', 4); up('tek', 1); }, v: [0, 3, 2, 0] },
    ] },
    { id: 'poor5', if: () => poor(), t: 'Dönüm noktası 1/4 — Zor günler', d: 'Ev geçinmekte zorlanıyor. Futbol senin için ne olacak?', c: [
      { l: 'Kaçış: her boş anda top', d: 'Hırsın büyür, teknik artar.', f: () => { g.val.am = Math.min(100, g.val.am + 6); up('tek', 3); up('fiz', 1); }, v: [5, 0, 0, 0] },
      { l: 'Babana pazarda yardım, akşamları top', d: 'Aileyle bağın güçlenir, fizik artar.', f: () => { relAdj(g.fam.father, 10); up('fiz', 3); }, v: [0, 2, 5, 1] },
      { l: 'Öğretmeninin ücretsiz okul takımı', d: 'Eğitim ve disiplin; pas gelişir.', f: () => { g.edu++; up('pas', 2); up('def', 1); }, v: [0, 2, 2, 0] },
    ] },
    { id: 'rich5', if: () => rich(), t: 'Dönüm noktası 1/4 — Her şey hazır', d: 'İmkânların bol. Ama tutku parayla gelmez.', c: [
      { l: 'Özel futbol akademisinin minikler grubu', d: 'Teknik ve pas artar.', f: () => { up('tek', 3); up('pas', 2); g.flags.fokulu = 1; }, v: [1, 0, 0, 2] },
      { l: 'Bahçedeki sahada babanla', d: 'Babanla bağ ve şut gelişir.', f: () => { g.flags.baba = 1; relAdj(g.fam.father, 12); up('sut', 3); }, v: [0, 2, 4, 0] },
      { l: 'Lüksü bırak, mahalle maçlarına karış', d: 'Fizik ve hırs artar; mahallede dost edinirsin.', f: () => { up('fiz', 3); up('tek', 2); addFriend('çocukluk', 65); g.val.am = Math.min(100, g.val.am + 4); }, v: [4, 1, 0, -2] },
    ] },
  ],
  9: [
    { id: 'scout9', t: 'Dönüm noktası 2/4 — Tribündeki adam', d: 'Bir turnuvada kenarda not tutan bir adam dikkatini çekti. Maçtan sonra ailenle konuşmak istiyor.', c: [
      { l: 'Önerdiği deneme antrenmanına git', d: 'Potansiyel artar; ailen yorulur.', f: () => { g.pot = Math.min(99, g.pot + 2); up('tek', 2); up('hiz', 1); }, v: [3, 0, -1, 0] },
      { l: 'Ailenle şehrin kulübünde kal', d: 'Çocukluk kulübün olur, takım ruhu.', f: () => { g.flags.belediye = 1; g.flags.homeKid = 1; up('pas', 2); up('def', 2); }, v: [0, 5, 2, 0] },
      { l: 'Önce okul bitsin', d: 'Eğitim artar, gelişim biraz yavaşlar.', f: () => { g.edu++; up('pas', 1); }, v: [0, 1, 3, 1] },
    ] },
    { id: 'poor9', if: () => poor(), t: 'Dönüm noktası 2/4 — Aidat', d: 'Takımın aylık aidatı arttı; evde para yok.', c: [
      { l: 'Antrenörünle konuş, burs iste', d: 'Antrenörün sana inanır; teknik ve pas gelişir.', f: () => { up('tek', 2); up('pas', 2); g.flags.burs = 1; }, v: [1, 3, 1, 0] },
      { l: 'Okul çıkışı çalışıp aidatı öde', d: 'Hırs ve fizik artar, yorulursun.', f: () => { up('fiz', 3); g.hp -= 5; g.val.am = Math.min(100, g.val.am + 5); }, v: [4, 0, 2, 2] },
      { l: 'Sokağa dön, kendi kendine çalış', d: 'Teknik artar ama disiplin eksik kalır.', f: () => { g.flags.sokak2 = 1; up('tek', 4); }, v: [3, 0, 0, 0] },
    ] },
    { id: 'abroad9', if: () => rich() || reg() === 'west', t: 'Dönüm noktası 2/4 — Yaz kampı', d: 'Büyük bir kulübün yaz kampına davet edildin. Aynı yaz ailen tatile gitmek istiyor.', c: [
      { l: 'Kampa git', d: 'Teknik ve hız artar, gözlemciler seni tanır.', f: () => { up('tek', 2); up('hiz', 2); g.rep += 3; }, v: [4, 0, -2, 0] },
      { l: 'Ailenle tatile git', d: 'Aile bağı ve mutluluk.', f: () => { relAdj(g.fam.father, 6); relAdj(g.fam.mother, 6); g.hap += 8; }, v: [0, 1, 5, 0] },
      { l: 'Kampın sadece ilk haftası', d: 'Biraz ikisinden de.', f: () => { up('tek', 1); g.hap += 3; }, v: [1, 0, 2, 0] },
    ] },
  ],
  12: [
    { id: 'move12', t: 'Dönüm noktası 3/4 — Taşınma', d: 'Babana başka bir şehirde iş teklifi geldi. Takımını ve arkadaşlarını bırakmak zorunda kalabilirsin.', c: [
      { l: 'Taşınalım; yeni şehrin altyapısını dene', d: 'Yeni bir başlangıç: gelişim hızlanır ama arkadaşlarından ayrılırsın.', f: () => { const c = P(g.w[g.ct][0].slice().sort((a, b) => b.s - a.s).slice(0, 6)); setAcad(c, 2); (g.friends || []).forEach(f => relAdj(f, -15)); }, v: [3, -2, 0, 1] },
      { l: 'Ben kalayım, akrabamın yanında', d: 'Takımın ve arkadaşların yanında kalırsın; aileden uzaklaşırsın.', f: () => { setAcad(club(g.homeClub), 1); relAdj(g.fam.mother, -6); g.flags.yerel = 1; }, v: [0, 5, -3, 0] },
      { l: 'Babam teklifi reddetsin', d: 'Her şey yerinde kalır; ailen fedakârlık eder.', f: () => { setAcad(club(g.homeClub), 1); relAdj(g.fam.father, 8); g.flags.fedakarAile = 1; }, v: [0, 3, 4, -1] },
    ] },
    { id: 'tv12', t: 'Dönüm noktası 3/4 — Viral video', d: 'Bir maçta attığın çalımlı gol internette milyonlarca kez izlendi. Telefon susmuyor.', c: [
      { l: 'Büyük kulübün altyapı teklifini kabul et', d: 'En hızlı gelişim, büyük beklenti.', f: () => { const c = P(g.w[g.ct][0].slice().sort((a, b) => b.s - a.s).slice(0, 3)); setAcad(c, 2); g.rep += 6; g.pot = Math.min(99, g.pot + 1); }, v: [4, 0, -2, 2] },
      { l: 'Sosyal medya hesabı aç, ünü büyüt', d: 'Ün artar; dikkat dağılabilir.', f: () => { g.rep += 10; g.flags.unlu = 1; up('tek', 1); }, v: [1, 0, 0, 5] },
      { l: 'Kafanı kaldırma, yerel kulüpte çalışmaya devam', d: 'Ayakların yere basar; çocukluk kulübün sana minnettar.', f: () => { setAcad(club(g.homeClub), 1); g.flags.sadik16 = 1; up('pas', 1); up('def', 1); }, v: [0, 5, 2, -2] },
    ] },
    { id: 'poor12', if: () => poor(), t: 'Dönüm noktası 3/4 — Yurt ve burs', d: 'Büyük kulübün altyapısı seni yurtta tam burslu istiyor. Evde senin de çalışmana ihtiyaç var.', c: [
      { l: 'Bursu kabul et, ailene ilk maaşınla destek ol', d: 'Gelişim hızlanır; hırsın tavan yapar.', f: () => { const c = P(g.w[g.ct][0].slice().sort((a, b) => b.s - a.s).slice(0, 5)); setAcad(c, 2); g.flags.yurt = 1; g.val.am = Math.min(100, g.val.am + 8); }, v: [6, 0, 0, 2] },
      { l: 'Evde kal, şehrin kulübünde oyna, hafta sonu çalış', d: 'Aileye destek; gelişim yavaşlar.', f: () => { setAcad(club(g.homeClub), 1); relAdj(g.fam.father, 10); relAdj(g.fam.mother, 10); g.hp -= 4; }, v: [0, 3, 6, 1] },
    ] },
  ],
};
/* yeni 15 yaş senaryoları */
Object.assign(MS15, {
  deneme: { t: 'Dönüm noktası 4/4 — Yurtdışı denemesi', d: 'Bir Avrupa kulübü seni bir haftalık denemeye çağırdı. Uçak bileti ailenin bütçesini zorlar.', c: [
    { l: 'Git ve kendini göster', d: 'Potansiyelin ve ünün artar.', f: () => { g.pot = Math.min(99, g.pot + 2); g.rep += 5; if (g.fam.lv <= 2) relAdj(g.fam.father, -4); }, v: [5, 0, -1, 1] },
    { l: 'Şimdi değil; önce burada büyü', d: 'Kulübün minnettar; daha iyi ilk sözleşme.', f: () => { g.flags.sadik16 = 1; }, v: [0, 4, 2, 0] },
  ] },
  rakip: { t: 'Dönüm noktası 4/4 — Rakip okul', d: 'Şehir şampiyonluğu finalinde ezeli rakip okulla karşılaşıyorsunuz. Hocan seni kaptan yapmak istiyor ama en yakın arkadaşın da aday.', c: [
    { l: 'Kaptanlığı kabul et', d: 'Liderlik ve ün; arkadaşın kırılabilir.', f: () => { g.flags.kaptan15 = 1; g.rep += 3; relAdj(friend(), -8); }, v: [4, 1, 0, 0] },
    { l: 'Bandı arkadaşına bırak', d: 'Dostluk ve takım ruhu.', f: () => { relAdj(friend(), 12); g.hap += 5; }, v: [0, 5, 2, 0] },
  ] },
  issiz: { if: () => poor() || Math.random() < .3, t: 'Dönüm noktası 4/4 — Babanın işi', d: 'Baban işini kaybetti. Bir antrenör sana yarı zamanlı iş ayarlayabileceğini söylüyor.', c: [
    { l: 'Çalış, eve para getir', d: 'Aile bağın derinleşir; antrenmanlar aksar.', f: () => { K.forEach(k => up(k, -1)); relAdj(g.fam.father, 12); g.val.ai = Math.min(100, g.val.ai + 6); money(15); }, v: [0, 2, 6, 2] },
    { l: 'Futbola tam odaklan, ailem anlayacak', d: 'Gelişim sürer; hırs ve baskı artar.', f: () => { up('fiz', 1); g.val.am = Math.min(100, g.val.am + 6); g.hp -= 4; }, v: [5, 0, -2, 0] },
  ] },
  menajer2: { if: () => rich(), t: 'Dönüm noktası 4/4 — Aile şirketi', d: 'Baban, futbolu bırakıp aile şirketinde staj yapmanı istiyor. “Futbol bir kumar” diyor.', c: [
    { l: 'Futboldan vazgeçmem', d: 'Hırs artar; babanla aranız soğur.', f: () => { relAdj(g.fam.father, -10); g.val.am = Math.min(100, g.val.am + 8); }, v: [6, 0, -3, 0] },
    { l: 'Yazın staj, kışın futbol', d: 'Eğitim ve iş deneyimi; gelişim biraz yavaşlar.', f: () => { g.edu++; g.flags.staj = 1; }, v: [0, 2, 3, 3] },
  ] },
});
/* dönüm noktası seçilirken sürüm seç */
const _msDef0 = msDef;
msDef = function (q) { if (q.v && MSV[q.age]) { const v = MSV[q.age].find(x => x.id === q.v); if (v) return v; } return _msDef0(q); };
const _childYear0 = childYear;
childYear = function () {
  _childYear0(); const q = g.q; if (!q || q.v) return;
  if (MSV[q.age]) { const vs = MSV[q.age].filter(v => !v.if || v.if()); if (vs.length && Math.random() < .7) { q.v = P(vs).id; sv(); draw(); } }
  else if (q.age === 15 && Math.random() < .5) { const ks = ['deneme', 'rakip', 'issiz', 'menajer2'].filter(k => !MS15[k].if || MS15[k].if()); if (ks.length) { q.k = P(ks); sv(); draw(); } }
};

/* ---------- yeni çocukluk olayları (ülke ve ekonomiye göre) ---------- */
const CH_EV3 = [
  { id: 'c3_bayram', a: [6, 12], f: () => reg() === 'tr', t: 'Bayramda akrabalardan topladığın harçlık cebinde. Mahallede yeni bir top satılıyor.', c: [{ l: 'Topu al', f: () => { up('tek', 1); g.hap += 4; }, v: [1, 0, 0, 1] }, { l: 'Annene ver, evin ihtiyacı var', f: () => relAdj(g.fam.mother, 8), v: [0, 2, 4, -1] }, { l: 'Kardeşine bisiklet için biriktir', f: () => g.fam.sibs.forEach(s => relAdj(s, 6)), v: [0, 1, 3, 0] }] },
  { id: 'c3_halisaha', a: [10, 15], f: () => reg() === 'tr', t: 'Babanın iş arkadaşları halı sahada bir kişi eksik. Seni çağırıyorlar.', c: [{ l: 'Git, büyüklerle oyna', f: () => { up('fiz', 1); up('tek', 1); relAdj(g.fam.father, 4); }, v: [2, 0, 2, 0] }, { l: 'Ödevini bitir', f: () => { g.edu += .5; }, v: [0, 0, 1, 0] }] },
  { id: 'c3_favela', a: [8, 14], f: () => reg() === 'latam' && poor(), t: 'Mahallede bir tanıdığın seni “kolay para” işine çağırıyor. Sokak antrenörün ise sahaya gelmeni bekliyor.', c: [{ l: 'Sahaya git', f: () => { up('tek', 2); g.flags.durust = 1; }, v: [2, 3, 1, -2] }, { l: 'Bir kere denemekten ne çıkar', f: () => { money(10); if (Math.random() < .5) { g.hap -= 10; L('Başın polisle derde girdi; ailen çok üzüldü.'); relAdj(g.fam.mother, -12); } }, v: [0, -4, -3, 5] }] },
  { id: 'c3_karnaval', a: [7, 13], f: () => reg() === 'latam', t: 'Karnaval haftası. Mahallenin futbol takımı kostümlerle sokakta maç yapacak.', c: [{ l: 'Kostümünü giy, maça katıl', f: () => { g.hap += 8; addFriend('çocukluk', 60); }, v: [0, 2, 1, 0] }, { l: 'Antrenmanı kaçırma', f: () => up('pas', 1), v: [2, 0, 0, 0] }] },
  { id: 'c3_kar', a: [6, 12], f: () => ['east', 'west', 'asia'].includes(reg()), t: 'Bütün gece kar yağdı; sahalar kapalı.', c: [{ l: 'Kar topu savaşı', f: () => { g.hap += 6; }, v: [0, 1, 1, 0] }, { l: 'Spor salonunda futsal', f: () => up('tek', 1), v: [2, 0, 0, 0] }, { l: 'Babanla kar küreyip saha aç', f: () => { relAdj(g.fam.father, 6); up('fiz', 1); }, v: [1, 1, 3, 0] }] },
  { id: 'c3_ramazan', a: [9, 15], f: () => ['tr', 'arab'].includes(reg()), t: 'Oruç ayı; antrenmanlar iftardan sonra, gece yapılıyor. Gündüz okulda yorgun düşüyorsun.', c: [{ l: 'Gece antrenmanlarına devam', f: () => { up('fiz', 1); g.hp -= 3; }, v: [2, 1, 1, 0] }, { l: 'Bu ay dinlen', f: () => { g.hp += 4; }, v: [0, 0, 2, 0] }] },
  { id: 'c3_lise', a: [12, 15], f: () => reg() === 'us', t: 'Lise takımının koçu, amerikan futbolunda “kicker” olmanı istiyor. Burs ihtimali büyük.', c: [{ l: 'Soccer\'dan vazgeçme', f: () => { g.val.am = Math.min(100, g.val.am + 4); }, v: [3, 2, 0, 0] }, { l: 'İkisini birden oyna', f: () => { up('sut', 2); g.hp -= 4; }, v: [1, 0, 0, 3] }] },
  { id: 'c3_juku', a: [10, 15], f: () => reg() === 'asia', t: 'Ailen akşamları özel derse (dershane) gitmeni istiyor. Antrenman saatleri çakışıyor.', c: [{ l: 'Dershaneye git', f: () => { g.edu++; }, v: [0, 1, 3, 1] }, { l: 'Antrenmana git, ailene söz ver: notlar düşmeyecek', f: () => { up(P(K), 1); g.hp -= 2; }, v: [3, 0, -1, 0] }] },
  { id: 'c3_kum', a: [7, 13], f: () => reg() === 'arab', t: 'Kum fırtınası yüzünden turnuva ertelendi. Takım kaptanı herkesi kapalı salona çağırıyor.', c: [{ l: 'Salonda ek çalışma', f: () => up('pas', 1), v: [2, 1, 0, 0] }, { l: 'Evde ailenle', f: () => relAdj(g.fam.mother, 5), v: [0, 0, 3, 0] }] },
  { id: 'c3_akademi', a: [10, 15], f: () => reg() === 'west', t: 'Akademi seni bir yaş büyüklerle oynatmak istiyor. Orada daha az süre alacaksın.', c: [{ l: 'Kabul et, zorlan', f: () => { up('tek', 1); up('fiz', 1); }, v: [3, 0, 0, 0] }, { l: 'Kendi yaşında kaptan kal', f: () => { g.rep += 2; up('pas', 1); }, v: [0, 3, 0, 0] }] },
  { id: 'c3_kis', a: [8, 14], f: () => reg() === 'east', t: 'Mahallenin büyükleri betondan sahada turnuva düzenliyor; ödül bir krampon.', c: [{ l: 'Katıl, kramponu kazanmak için oyna', f: () => { if (Math.random() < .5) { up('tek', 2); g.hap += 6; L('Turnuvayı kazandın, krampon senin!'); } else up('fiz', 1); }, v: [3, 0, 0, 1] }, { l: 'Hakemlik yap', f: () => { up('pas', 1); g.flags.hakem = 1; }, v: [0, 2, 0, 0] }] },
  { id: 'c3_hediye', a: [8, 14], f: () => rich(), t: 'Doğum gününde sana pahalı bir akıllı saat ve bir PlayStation aldılar. Arkadaşların ise sahada bekliyor.', c: [{ l: 'Sahaya git', f: () => up('tek', 1), v: [2, 2, 0, -1] }, { l: 'Bütün gün oyun oyna', f: () => { g.hap += 5; }, v: [-1, 0, 0, 1] }, { l: 'Arkadaşları eve çağır, bahçede maç', f: () => { addFriend('çocukluk', 60); g.hap += 4; }, v: [0, 2, 1, 0] }] },
  { id: 'c3_kiralik', a: [9, 15], f: () => poor(), t: 'Ev sahibi kirayı artırdı; taşınmanız gerekebilir. Babanın kafası çok dolu.', c: [{ l: 'Babanla konuş, ona moral ver', f: () => relAdj(g.fam.father, 8), v: [0, 1, 4, 0] }, { l: 'Antrenmanda hıncını çıkar', f: () => { up('fiz', 1); g.val.am = Math.min(100, g.val.am + 3); }, v: [3, 0, 0, 0] }, { l: 'Komşunun dükkânında çalış', f: () => { money(8); g.hp -= 3; }, v: [1, 0, 3, 2] }] },
  { id: 'c3_hoca', a: [9, 15], t: () => `Antrenörün seni idmandan sonra kenara çekti: “Sende bir şey var ama ${P(['sol ayağın', 'kafa vuruşların', 'pas görüşün', 'savunmaya dönüşün'])} zayıf” dedi.`, c: [{ l: 'Her gün yarım saat fazladan çalış', f: () => { up(P(K), 2); }, v: [4, 0, 0, 0] }, { l: 'Güçlü yanına odaklan', f: () => { const k = K.slice().sort((a, b) => g.st[b] - g.st[a])[0]; up(k, 2); }, v: [1, 0, 0, 0] }] },
  { id: 'c3_gozluk', a: [7, 13], t: 'Tahtayı göremediğini fark ettiler; gözlük takman gerekiyor. Sahada lens mi, gözlük mü?', c: [{ l: 'Spor gözlüğü', f: () => { g.flags.gozluk = 1; }, v: [0, 0, 1, 0] }, { l: 'Lens için ailene yalvar', f: () => { relAdj(g.fam.mother, -2); }, v: [1, 0, -1, 1] }] },
];
CH_EV3.forEach(e => { CH_EV.push(e); EVMAP[e.id] = e; });

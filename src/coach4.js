/* ============================================================
   MİRAS FC — v3.9 · Teknik direktör merkezi (görsel)
   - Kulüp panosu: forma renklerinde başlık, lig sırası, puan, son 5 maç,
     dört gösterge halkası (yönetim, soyunma odası, taktik uyumu, zindelik)
     ve hoca unvanı (itibara göre).
   - Taktik tahtası: dizilişe göre sahada ilk 11; oyuncuya dokun = kart.
   - Oyuncu kartı: güç, potansiyel, moral, maç, değer; konuş / sat.
   - Basın toplantısı: maç haftalarında gazeteci soruları; cevabın
     soyunma odasını, yönetimi ve maçın başını etkiler.
   - Maç önü konuşma: odak / baskı / rahat.
   - Canlı maç: sahada top ve baskı bölgesi, momentum grafiği,
     şut, isabet, topla oynama, korner.
   - Gelişim raporu: sezon başından beri yükselen ve düşen oyuncular.
   ============================================================ */
const CRANK = [[0, 'Genç hoca', '🌱'], [10, 'Gelecek vadeden', '📈'], [25, 'Tecrübeli', '🎓'], [45, 'Usta taktisyen', '🧠'], [70, 'Efsane', '👑']];
const crank = () => { const r = typeof cRep === 'function' ? cRep() : (g.crep || 0); let o = CRANK[0]; CRANK.forEach(x => { if (r >= x[0]) o = x; }); return o; };
function ring(v, max, lbl, col) {
  const p = cl(v / max, 0, 1), R = 26, C = 2 * Math.PI * R, c = col || (p >= .66 ? '#56c98d' : p >= .4 ? '#e8c468' : '#ff6b5b');
  return `<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * p} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${Math.round(p * 100)}</text></svg><span>${lbl}</span></div>`;
}
const initials = n => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toLocaleUpperCase('tr');
function lgPosOf(id) { if (!g.lg) return null; const T = sortT(g.lg.teams), i = T.findIndex(x => x.id === id); return i < 0 ? null : { pos: i + 1, n: T.length, pt: T[i].pt, gp: T[i].W + T[i].D + T[i].L }; }
function cHero(compact) {
  const C = g.coach, c = club(C.id), L0 = lgPosOf(C.id), rk = crank(), f5 = (C.f5 || []).slice(-5);
  const dots = f5.map(x => `<i class="${x === 3 ? 'w' : x === 1 ? 'd' : 'l'}">${x === 3 ? 'G' : x === 1 ? 'B' : 'M'}</i>`).join('') || '<em class="m">henüz maç yok</em>';
  const fit = 100 - cl((C.fat || 0) / 30, 0, 1) * 100;
  return `<div class="card chero" style="--c1:${c.c1};--c2:${c.c2}"><div class="chtop"><div class="crest2">${esc(initials(clubName(c.n)))}</div><div class="chn"><div class="eyebrow">${esc(tierName(C.ct, c.t))} · ${C.s + 1}. sezon</div><h2>${esc(clubName(c.n))}</h2><div class="rank">${rk[2]} ${esc(rk[1])}</div></div></div>
  <div class="chstats"><div><b>${L0 ? L0.pos + '.' : '—'}</b><span>Sıra</span></div><div><b>${L0 ? L0.pt : '—'}</b><span>Puan</span></div><div><b>${C.gp ? Math.round(C.wins / C.gp * 100) : 0}<small>%</small></b><span>Galibiyet</span></div><div class="f5"><div>${dots}</div><span>Son 5 maç</span></div></div>
  ${compact ? '' : `<div class="rings">${ring(C.conf || 0, 100, 'Yönetim')}${ring(C.harm || 60, 100, 'Soyunma odası')}${ring(C.tf == null ? 55 : C.tf, 100, 'Taktik uyumu')}${ring(fit, 100, 'Zindelik')}</div>`}</div>`;
}

/* ---------- taktik tahtası ---------- */
function pitchSVG(id, form) {
  const xi = bestXI(id, form), c = club(id), F = FORMS[form || '4-4-2'] || FORMS['4-4-2'], sq = g.sq[id] || [];
  const by = p => xi.filter(x => x.p === p), rows = [];
  rows.push({ y: 128, L: by('GK') }); rows.push({ y: 104, L: by('DF') });
  const mf = by('MF'); if (mf.length >= 5 && form !== '3-5-2') { rows.push({ y: 82, L: mf.slice(0, form === '4-1-4-1' ? 1 : 2) }); rows.push({ y: 60, L: mf.slice(form === '4-1-4-1' ? 1 : 2) }); } else rows.push({ y: 72, L: mf });
  rows.push({ y: 34, L: by('FW') });
  let tok = '';
  rows.forEach(r => { const n = r.L.length; r.L.forEach((p, i) => { const x = n === 1 ? 50 : 12 + 76 * i / (n - 1), q = sq.find(z => z.id === p.id) || p, mor = q.mor == null ? 65 : q.mor, mc = mor >= 65 ? '#56c98d' : mor >= 40 ? '#e8c468' : '#ff6b5b', nm2 = esc(short(pname(p)).split(' ').slice(-1)[0]).slice(0, 11);
    tok += `<g class="tok" onclick="cPl(${p.id})"><circle cx="${x}" cy="${r.y}" r="7.2" fill="${c.c1}" stroke="${p.oop ? '#ff8a1e' : c.c2}" stroke-width="1.6"/><text x="${x}" y="${r.y + 2.4}" text-anchor="middle" font-size="6.4" font-weight="800" fill="${lum(c.c1) > 150 ? '#111' : '#fff'}">${p.r}</text><circle cx="${x + 5.6}" cy="${r.y - 5.6}" r="1.9" fill="${mc}" stroke="#0b1210" stroke-width=".6"/><text x="${x}" y="${r.y + 12.5}" text-anchor="middle" font-size="4.3" font-weight="600" fill="#fff">${nm2}</text></g>`; }); });
  const ln = 'stroke="rgba(255,255,255,.55)" stroke-width=".6" fill="none"';
  return `<div class="pitchb"><svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8f2a"/><stop offset="1" stop-color="#25771f"/></linearGradient></defs><rect width="100" height="140" fill="url(#pg)"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect y="${i * 20}" width="100" height="10" fill="rgba(255,255,255,.035)"/>`).join('')}
  <rect x="4" y="4" width="92" height="132" ${ln}/><line x1="4" y1="70" x2="96" y2="70" ${ln}/><circle cx="50" cy="70" r="10" ${ln}/><rect x="24" y="4" width="52" height="18" ${ln}/><rect x="24" y="118" width="52" height="18" ${ln}/><rect x="38" y="4" width="24" height="6" ${ln}/><rect x="38" y="130" width="24" height="6" ${ln}/>${tok}</svg>
  <div class="m">Dokun: oyuncu kartı · renkli nokta moral · turuncu çerçeve mevkisi dışında</div></div>`;
}
xiPreview = function (id, form) { return pitchSVG(id, form); };

/* ---------- oyuncu kartı ---------- */
function cPl(pid) {
  const C = g.coach; if (!C) return; const q = (g.sq[C.id] || []).find(x => x.id === pid); if (!q) return;
  let el = document.getElementById('setp'); if (!el) { el = document.createElement('div'); el.id = 'setp'; el.className = 'tut'; document.body.appendChild(el); }
  const c = club(C.id), mor = q.mor == null ? 65 : q.mor, pot = q.pot || q.r, ps = typeof persOf === 'function' ? persOf(q) : null;
  el.hidden = false;
  el.innerHTML = `<div class="tutc card plc" style="--c1:${c.c1};--c2:${c.c2}"><div class="tutt"><span class="eyebrow">${POSN[q.p] || q.p}</span><button class="lnk" onclick="setClose()">Kapat ✕</button></div>
  <div class="plh"><div class="plr"><b>${q.r}</b><span>güç</span></div><div><h2>${esc(pname(q))}</h2><div class="m">${q.age} yaş${ps && PERS[ps] ? ' · ' + PERS[ps] : ''}${C.capt === q.id ? ' · Kaptan' : ''}${q.inj ? ` · <span class="neg">sakat ${q.inj} hf</span>` : ''}</div></div></div>
  <div class="prow"><span>Potansiyel</span>${bar(pot, 99)}<b>${pot}</b></div><div class="prow"><span>Moral</span>${bar(mor, 100, mor < 40 ? 'bad' : '')}<b>${Math.round(mor)}</b></div>
  <div class="kvs"><div class="kv"><span>Bu sezon maç</span><b>${q.ap || 0}</b></div><div class="kv"><span>Gelişim</span><b class="${(q.r - (q.r0 == null ? q.r : q.r0)) >= 0 ? 'pos' : 'neg'}">${q.r0 == null ? '—' : (q.r - q.r0 >= 0 ? '+' : '') + (q.r - q.r0)}</b></div>${q.wage ? `<div class="kv"><span>Maaş</span><b>${fm(q.wage)}</b></div>` : ''}${q.val ? `<div class="kv"><span>Değer</span><b>${fm(q.val)}</b></div>` : ''}</div>
  <div class="actions"><button class="btn" onclick="g.coach.talk=${q.id};CV2='kadro';setClose();setTab('coach')">💬 Birebir konuş</button><button class="btn ghost" onclick="setClose();coachSellNow(${q.id})">€ Sat</button></div></div>`;
  if (typeof i18nApply === 'function') i18nApply(el);
}

/* ---------- basın toplantısı ---------- */
const PRESS4 = [
  { q: 'Hocam, bu maçı kazanmazsanız koltuğunuz sallanır mı?', o: [['Baskıyı seviyorum, kazanacağız.', { conf: 1, harm: 1, mom: 6 }], ['Benim işim sonuç değil, süreç.', { conf: -2, harm: 1 }], ['Bu soruya cevap vermeyeceğim.', { crep: -.5 }]] },
  { q: 'Rakibin yıldız oyuncusu için özel bir planınız var mı?', o: [['Onu durdurmak için çalıştık.', { mom: 4 }], ['Biz kendi oyunumuza bakarız.', { harm: 1 }], ['Abartılmış bir oyuncu bence.', { mom: -6, crep: .5 }]] },
  { q: 'Soyunma odasında huzursuzluk olduğu konuşuluyor.', o: [['Takımım bir aile, sorun yok.', { harm: 2, conf: -1 }], ['Herkes forması için savaşmalı.', { harm: -2, mom: 4 }], ['Dedikodulara yorum yapmam.', {}]] },
  { q: 'Taraftarlar daha hücumcu bir oyun istiyor.', o: [['Onların sesini duyuyorum, öne çıkacağız.', { conf: 1, mom: 4 }], ['Dengeyi bozmayacağım.', { harm: 1 }], ['Taraftar oyunu bilmiyor.', { conf: -3, crep: -1 }]] },
  { q: 'Hakem kararları hakkında ne düşünüyorsunuz?', o: [['Hakemleri eleştirmem.', { crep: .5 }], ['Bu sezon çok haksızlığa uğradık!', { harm: 2, conf: -1 }], ['Hepsi oyunun parçası.', {}]] },
  { q: 'Genç oyunculara daha çok şans verecek misiniz?', o: [['Altyapı bu kulübün geleceği.', { conf: 2, harm: 1 }], ['Forma hak edene.', { harm: 1 }], ['Şu an sonuç zamanı.', { conf: -1, mom: 2 }]] },
  { q: 'Transfer döneminde yeni isimler gelecek mi?', o: [['Yönetimle çalışıyoruz.', { conf: 1 }], ['Bu kadroya güveniyorum.', { harm: 2 }], ['Takviye şart, kadro yetersiz.', { harm: -3, conf: -1, crep: .5 }]] },
  { q: 'Son maçtaki performansı nasıl değerlendiriyorsunuz?', o: [['Gurur duydum.', { harm: 2 }], ['Daha iyisini yapmalıyız.', { mom: 4, harm: -1 }], ['Bireysel hatalar bizi yaktı.', { harm: -3, mom: 2 }]] },
  { q: 'Şampiyonluk konuşmak için erken mi?', o: [['Hedefimiz zirve.', { conf: 2, mom: 4 }], ['Maç maç bakıyoruz.', { harm: 1 }], ['Biz favori değiliz.', { mom: -2, conf: -1 }]] },
  { q: 'Kaptanınızla aranızda sorun olduğu yazıldı.', o: [['Kaptanım sağ kolumdur.', { harm: 3 }], ['Kimse takımdan büyük değil.', { harm: -2, conf: 1 }], ['Yalan haber.', { crep: -.5 }]] },
];
const _cws4 = coachWeekStart;
coachWeekStart = function (auto) {
  _cws4(auto); const C = g.coach; if (!C || g.phase !== 'coach') return;
  if (auto) { C.press = null; return; }
  const hasM = g.cal && g.cal.some(e => e.w === g.week && e.k !== 'N');
  if (hasM && !C.press && !g.press && Math.random() < .4) C.press = { i: R(0, PRESS4.length - 1) };
};
function cPress(k) {
  const C = g.coach; if (!C || !C.press) return; const Q = PRESS4[C.press.i], o = Q.o[k], e = o[1];
  if (e.conf) C.conf = clr((C.conf || 50) + e.conf, 0, 100); if (e.harm) C.harm = clr((C.harm || 60) + e.harm, 0, 100); if (e.crep && typeof crepAdd === 'function') crepAdd(e.crep); C.pmom = (C.pmom || 0) + (e.mom || 0);
  const fx = [e.harm > 0 ? 'soyunma odası memnun' : e.harm < 0 ? 'soyunma odası gerildi' : '', e.conf > 0 ? 'yönetim olumlu karşıladı' : e.conf < 0 ? 'yönetim rahatsız' : '', e.mom > 0 ? 'takım maça hırslı çıkacak' : e.mom < 0 ? 'rakip bunu motivasyona çevirdi' : ''].filter(Boolean).join(', ');
  L(`Basın toplantısı: “${o[0]}”${fx ? ' — ' + fx + '.' : ''}`); toast(fx ? '🎤 ' + fx : '🎤 Basın toplantısı bitti'); C.press = null; sv(); draw();
}
function pressCard() {
  const C = g.coach; if (!C || !C.press || g.press) return ''; const Q = PRESS4[C.press.i];
  return `<div class="card q press"><div class="eyebrow gold">🎤 Basın toplantısı</div><p class="lead">“${esc(Q.q)}”</p><div class="opts">${Q.o.map((o, k) => `<button class="opt" onclick="cPress(${k})"><b>${esc(o[0])}</b></button>`).join('')}</div></div>`;
}
/* ---------- maç önü konuşma ---------- */
const PRE = { odak: { n: '🎯 Odaklan', d: 'Güvenli, küçük etki' }, baski: { n: '🔥 Baskı yap', d: 'Uyum yüksekse büyük etki, değilse ters teper' }, rahat: { n: '😌 Rahat ol', d: 'Gerginliği alır, yorgunluk biraz azalır' } };
function setPre(k) { const C = g.coach; if (!C) return; C.pre = C.pre === k ? null : k; sv(); draw(); }
const _planCard4 = planCard;
planCard = function (info) {
  const C = g.coach, h = _planCard4(info); if (!C) return h;
  const pre = `<div class="eyebrow">Maç önü konuşma</div><div class="chips">${Object.entries(PRE).map(([k, p]) => `<button class="chip ${C.pre === k ? 'on' : ''}" onclick="setPre('${k}')">${p.n}</button>`).join('')}</div>${C.pre ? `<div class="m">${PRE[C.pre].d}</div>` : ''}`;
  return h.replace(/<\/div>$/, pre + '</div>');
};
const _lmStart4 = lmStart;
lmStart = function () {
  const C = g.coach; _lmStart4(); if (!LM || !C) return;
  const h = (C.harm || 60) / 100; let mom = C.pmom || 0, boost = 1, note = '';
  if (C.pre === 'odak') { boost = 1.04; note = 'Takım odaklı başladı.'; }
  if (C.pre === 'baski') { if (Math.random() < .35 + h * .5) { boost = 1.12; mom += 6; note = 'Maç önü konuşman ateşledi!'; } else { boost = .93; note = 'Baskı ağır geldi, oyuncular gergin.'; } }
  if (C.pre === 'rahat') { boost = 1.02; C.fat = Math.max(0, (C.fat || 0) - 1); note = 'Takım rahat ve özgüvenli.'; }
  LM.boost = (LM.boost || 1) * boost; LM.mom = cl((LM.mom || 0) + mom, -50, 50); C.pmom = 0; C.pre = null;
  if (note) LM.log.unshift({ m: 0, t: note, k: 'mut' });
  LM.st = { sh: [0, 0], on: [0, 0], kor: [0, 0], pos: [], mh: [LM.mom] }; draw();
};
/* ---------- canlı maç: istatistik ---------- */
const _lmSeg4 = lmSeg;
lmSeg = function () {
  const m = LM; if (!m || m.res) return _lmSeg4(); const sc0 = m.sc.slice(), mom0 = m.mom || 0; _lmSeg4(); if (!LM || LM !== m) return;
  const st = m.st || (m.st = { sh: [0, 0], on: [0, 0], kor: [0, 0], pos: [], mh: [] }), du = m.sc[0] - sc0[0], dt = m.sc[1] - sc0[1], am = (mom0 + m.mom) / 2;
  const su = du + R(0, 2) + (am > 10 ? 1 : 0) + (am > 25 ? 1 : 0), sth = dt + R(0, 2) + (am < -10 ? 1 : 0) + (am < -25 ? 1 : 0);
  st.sh[0] += su; st.sh[1] += sth; st.on[0] += du + Math.round((su - du) * rf(.2, .5)); st.on[1] += dt + Math.round((sth - dt) * rf(.2, .5));
  st.kor[0] += R(0, am > 5 ? 2 : 1); st.kor[1] += R(0, am < -5 ? 2 : 1); st.pos.push(cl(50 + am * .4 + rf(-4, 4), 25, 75)); st.mh.push(m.mom);
};
function lmViz() {
  const m = LM; if (!m) return ''; const st = m.st || { sh: [0, 0], on: [0, 0], kor: [0, 0], pos: [], mh: [m.mom || 0] }, C = g.coach, c = club(C.id), mom = m.mom || 0;
  const pos = st.pos.length ? Math.round(st.pos.reduce((a, b) => a + b, 0) / st.pos.length) : 50, bx = 50 + mom * .8, glow = mom >= 0 ? 'rgba(86,201,141,.35)' : 'rgba(255,107,91,.35)';
  const mh = st.mh.length > 1 ? st.mh : [0, mom], pts = mh.map((v, i) => `${(i / Math.max(1, mh.length - 1)) * 100},${11 - v / 50 * 9}`).join(' ');
  const row = (n, a, b) => { const t = a + b || 1; return `<div class="lsr"><b>${a}</b><div class="lsb"><i style="width:${a / t * 100}%;background:${c.c1}"></i><i style="width:${b / t * 100}%"></i></div><b>${b}</b><span>${n}</span></div>`; };
  return `<div class="card lviz"><svg viewBox="0 0 100 46" class="lpitch"><rect width="100" height="46" fill="#2a8a26"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${i * 20}" width="10" height="46" fill="rgba(255,255,255,.04)"/>`).join('')}<rect x="2" y="2" width="96" height="42" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5"/><line x1="50" y1="2" x2="50" y2="44" stroke="rgba(255,255,255,.5)" stroke-width=".5"/><circle cx="50" cy="23" r="6" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5"/><rect x="2" y="13" width="9" height="20" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5"/><rect x="89" y="13" width="9" height="20" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5"/>
  <ellipse cx="${bx}" cy="23" rx="16" ry="14" fill="${glow}"><animate attributeName="rx" values="14;18;14" dur="2s" repeatCount="indefinite"/></ellipse><circle cx="${bx}" cy="23" r="1.8" fill="#fff" stroke="#111" stroke-width=".4"><animate attributeName="cy" values="20;26;21;24;20" dur="3s" repeatCount="indefinite"/></circle>
  <text x="4" y="42" font-size="3.4" fill="rgba(255,255,255,.8)">◀ ${esc(clubName(c.n)).slice(0, 18)}</text><text x="96" y="42" font-size="3.4" text-anchor="end" fill="rgba(255,255,255,.8)">${esc(m.info.on).slice(0, 18)} ▶</text></svg>
  <svg viewBox="0 0 100 22" class="lmom"><line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,.08)"/><line x1="0" y1="11" x2="100" y2="11" stroke="rgba(255,255,255,.15)" stroke-dasharray="2 2"/><polyline points="${pts}" fill="none" stroke="#e8c468" stroke-width="1.2"/><text x="1" y="5" font-size="3.5" fill="rgba(255,255,255,.5)">${esc(T("Momentum"))}</text></svg>
  ${row('Şut', st.sh[0], st.sh[1])}${row('İsabetli şut', st.on[0], st.on[1])}${row('Korner', st.kor[0], st.kor[1])}<div class="lsr"><b>${pos}%</b><div class="lsb"><i style="width:${pos}%;background:${c.c1}"></i><i style="width:${100 - pos}%"></i></div><b>${100 - pos}%</b><span>Topla oynama</span></div></div>`;
}
const _lmUI4 = lmatchUI;
lmatchUI = function () { const h = _lmUI4(), i = h.indexOf('<div class="card"><div class="prow"><span>Momentum'); return i < 0 ? h + lmViz() : h.slice(0, i) + lmViz() + h.slice(i); };

/* ---------- gelişim raporu ---------- */
function devCard(id) {
  const sq = g.sq[id] || []; sq.forEach(p => { if (p.r0 == null) p.r0 = p.r; });
  const d = sq.map(p => ({ p, d: p.r - p.r0 })).filter(x => x.d !== 0).sort((a, b) => b.d - a.d), up = d.filter(x => x.d > 0).slice(0, 5), dn = d.filter(x => x.d < 0).slice(-3).reverse();
  if (!up.length && !dn.length) return `<div class="card"><div class="eyebrow">📈 Gelişim raporu</div><p class="m">Sezon başından beri değişim yok. Antrenman programı, yük ve maç süresi oyuncuların gelişimini belirler.</p></div>`;
  const li = x => `<div class="dvr" onclick="cPl(${x.p.id})"><span class="sqp p-${x.p.p}">${x.p.p}</span><b>${esc(pname(x.p))}</b><em>${x.p.age} yaş · ${x.p.r}</em><i class="${x.d > 0 ? 'pos' : 'neg'}">${x.d > 0 ? '▲ +' : '▼ '}${x.d}</i></div>`;
  return `<div class="card"><div class="eyebrow">📈 Gelişim raporu · bu sezon</div>${up.map(li).join('')}${dn.length ? `<div class="eyebrow">Düşüşte</div>${dn.map(li).join('')}` : ''}</div>`;
}
const _cse4 = coachSeasonEnd;
coachSeasonEnd = function () { const C = g.coach; if (C) (g.sq[C.id] || []).forEach(p => { p.r0 = p.r; }); return _cse4(); };

/* ---------- ekranlara yerleştir ---------- */
const _coachUI4 = coachUI;
coachUI = function () {
  const C = g.coach; let h = _coachUI4(); if (!C) return h;
  const v = CV2; const i = h.indexOf('</div>') + 6; /* sekme şeridinden sonra */
  if (v === 'ozet') h = h.slice(0, i) + cHero() + h.slice(i);
  if (v === 'kadro') h = h.slice(0, i) + `<div class="card"><div class="eyebrow">Taktik tahtası · ${C.form}</div>${pitchSVG(C.id, C.form)}</div>` + devCard(C.id) + h.slice(i);
  return h;
};
const _coachHome4 = coachHome;
coachHome = function () { const C = g.coach; if (!C) return _coachHome4(); return cHero(1) + pressCard() + _coachHome4(); };

/* ============================================================
   MİRAS FC — v4.1 · TEKNİK DİREKTÖR 6
   1) İTİBAR: ayrı sekme. Büyük itibar halkası, unvan merdiveni,
      sıradaki unvana kalan puan, dünya sıralamasında komşuların,
      sezon sezon itibar grafiği, son itibar hareketleri (neden),
      hangi kulüplerin kapısının açık olduğu, kariyer istatistikleri.
   2) TAKTİK: hazır taktikler (Gegenpress, Tiki-taka, Kontra...),
      mini diziliş kartları, sahada savunma hattı ve hücum yönü,
      takım talimatları (hat, pres, tempo, genişlik, pas, yön, markaj),
      canlı taktik analizi (hücum / savunma / kontrol / yorgunluk /
      talimat uyumu) ve çelişki uyarıları. Talimatlar maç sonucunu
      gerçekten etkiler (cmMods) ve yorgunluk getirir.
   3) CANLI MAÇ: süre kendiliğinden akar (yavaş / normal / hızlı),
      22 oyuncu nokta olarak sürekli hareket eder: diziliş bloğu topa
      göre kayar, en yakın rakip prese çıkar, ikinci adam kapatır,
      pas, araya girme, top kapma, şut, kurtarış, aut, korner, direk.
      Goller gerçek dakikasında oynanan bir atakla gelir. Devre arası,
      sakatlıkta durma, oyuncu değişikliği, kenardan talimat, canlı
      istatistik ve erkek spiker anlatımı.
   ============================================================ */

/* =================== 1) İTİBAR =================== */
const _crepAdd6 = crepAdd;
crepAdd = function (d, why) { _crepAdd6(d, why); if (why && Math.abs(d) >= .5) repLog(d, why); g.crepS = g.crep || 0; };
function repLog(d, why) { g.crepL = g.crepL || []; g.crepL.unshift({ y: g.season, w: g.week, d: Math.round(d * 10) / 10, t: String(why) }); if (g.crepL.length > 14) g.crepL.length = 14; }
function repSync(why) { const r = g.crep || 0; if (g.crepS == null) { g.crepS = r; return; } const d = r - g.crepS; if (Math.abs(d) >= .5) repLog(d, why); g.crepS = r; }
const _cws6 = coachWeekStart;
coachWeekStart = function (auto) { repSync('Maç sonuçları ve gelişmeler'); return _cws6(auto); };
const _cse6 = coachSeasonEnd;
coachSeasonEnd = function () {
  repSync('Maç sonuçları ve gelişmeler'); const r = _cse6(); repSync('Sezon sonu değerlendirmesi');
  g.crepH = (g.crepH || []).concat([{ y: g.season, r: Math.round(cRep()), k: cwRank() }]).slice(-12); return r;
};
const _cmApply6 = cmApply;
cmApply = function (e, info, res) {
  const C = g.coach; if (C && res) {
    const s = g.cst || (g.cst = { gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }); s.gp++; if (res.win) s.w++; else if (res.draw) s.d++; else s.l++; s.gf += (res.sc || [0, 0])[0]; s.ga += (res.sc || [0, 0])[1];
    const p = planOf(); C.fat = cl((C.fat || 0) + (p.pres === 2 ? .35 : 0) + (p.tempo === 2 ? .35 : 0) - (p.tempo === 0 ? .2 : 0), 0, 30);
  }
  return _cmApply6(e, info, res);
};
function sparkRep(H) {
  if (!H || H.length < 2) return ''; const mx = Math.max(10, ...H.map(x => x.r)), n = H.length;
  const pts = H.map((x, i) => `${(i / (n - 1)) * 96 + 2},${30 - x.r / mx * 26}`).join(' ');
  return `<svg viewBox="0 0 100 36" class="rep6sp"><polyline points="${pts}" fill="none" stroke="#e8c468" stroke-width="1.4" stroke-linejoin="round"/>${H.map((x, i) => `<circle cx="${(i / (n - 1)) * 96 + 2}" cy="${30 - x.r / mx * 26}" r="1.3" fill="#e8c468"/>`).join('')}<text x="2" y="35" font-size="4" fill="rgba(255,255,255,.5)">${H[0].y}</text><text x="98" y="35" font-size="4" text-anchor="end" fill="rgba(255,255,255,.5)">${H[n - 1].y}</text></svg>`;
}
function repDoors(rep) {
  const dom = Math.round(55 + (rep + 12) / 1.6), abr = Math.round(55 + (rep + 2) / 1.6);
  return { dom: Math.min(99, dom), abr: Math.min(99, abr) };
}
function repCard() {
  const rep = Math.round(cRep()), rk = cwRank(), C = g.coach, cur = crank(), i0 = CRANK.indexOf(cur), nx = CRANK[i0 + 1];
  const H = g.crepH || [], prev = H.length ? H[H.length - 1].k : null, mv = prev ? prev - rk : 0;
  const pc = nx ? cl((rep - cur[0]) / (nx[0] - cur[0]), 0, 1) : 1, D = repDoors(rep);
  const ladder = CRANK.map((x, i) => `<div class="rep6t ${i < i0 ? 'done' : i === i0 ? 'on' : ''}"><i>${x[2]}</i><b>${esc(x[1])}</b><span>${x[0]}+</span></div>`).join('');
  let h = `<div class="card rep6"><div class="rep6h">${ring(rep, 100, 'İtibar', '#e8c468')}<div class="rep6i"><div class="eyebrow">Teknik direktör itibarın</div><h2>${cur[2]} ${esc(cur[1])}</h2>
  <div class="m">Dünya sıralaması <b class="gold">${rk}.</b>${mv ? ` <span class="${mv > 0 ? 'pos' : 'neg'}">${mv > 0 ? '▲' : '▼'}${Math.abs(mv)}</span>` : ''} · Lisans ${LIC[g.lic || 0]}</div>
  ${nx ? `<div class="rep6n"><span>Sıradaki unvan: <b>${nx[2]} ${esc(nx[1])}</b></span><em>${Math.max(1, Math.ceil(nx[0] - rep))} puan</em></div><div class="bar"><i style="width:${pc * 100}%;background:#e8c468"></i></div>` : '<div class="rep6n"><b class="gold">Zirvedesin: efsane hoca.</b></div>'}</div></div>
  <div class="rep6l">${ladder}</div>
  ${H.length > 1 ? `<div class="eyebrow">Sezon sezon itibar</div>${sparkRep(H)}` : ''}
  <div class="eyebrow">Kapılar</div><div class="kv"><span>Seni düşünen kulüpler (yurt içi)</span><b>güç ≤ ${D.dom}</b></div><div class="kv"><span>Yurt dışı</span><b>güç ≤ ${D.abr}</b></div><div class="kv"><span>Menajer</span><b>${esc(CAG[g.cag || 0].n)}</b></div></div>`;
  /* dünya sıralaması: ilk 3 + komşular */
  const all = ensureCW().map(c => ({ n: c.nw ? c.n : alter(c.n), r: Math.round(c.r) })).concat([{ n: g.name, r: rep, me: 1 }]).sort((a, b) => b.r - a.r || (a.me ? -1 : 1));
  const mi = all.findIndex(x => x.me), keep = new Set([0, 1, 2, mi - 2, mi - 1, mi, mi + 1, mi + 2].filter(i => i >= 0 && i < all.length));
  let last = -1, rows = '';
  [...keep].sort((a, b) => a - b).forEach(i => { if (last >= 0 && i > last + 1) rows += '<div class="rep6gap">···</div>'; const x = all[i]; rows += `<div class="rep6w ${x.me ? 'me' : ''}"><span>${i + 1}.</span><b>${esc(x.n)}${x.me ? ' (sen)' : ''}</b><div class="rep6b"><i style="width:${x.r}%"></i></div><em>${x.r}</em></div>`; last = i; });
  h += `<div class="card"><div class="eyebrow">🌍 Dünya teknik direktör sıralaması</div>${rows}</div>`;
  /* hareketler */
  const Lg = (g.crepL || []).slice(0, 8);
  h += `<div class="card"><div class="eyebrow">Son itibar hareketleri</div>${Lg.length ? Lg.map(x => `<div class="rep6m"><i class="${x.d > 0 ? 'pos' : 'neg'}">${x.d > 0 ? '+' : ''}${x.d}</i><span>${esc(x.t)}</span><em>${x.y}${x.w ? ' · ' + x.w + '. hf' : ''}</em></div>`).join('') : '<p class="m">Henüz kayıtlı bir hareket yok.</p>'}
  <div class="eyebrow">İtibarı ne etkiler?</div><div class="rep6f"><span class="pos">🏆 Lig şampiyonluğu +12</span><span class="pos">🥇 Kupa / terfi +5</span><span class="pos">🎯 Hedefleri tutturmak +</span><span class="pos">🎓 Lisans +2</span><span class="pos">🎤 Basın, seminer +1</span><span class="neg">🔥 Kovulmak −4</span><span class="neg">⬇ Küme düşmek −</span><span class="neg">✘ Tutmayan hedefler −</span></div></div>`;
  /* kariyer istatistikleri */
  const s = g.cst || { gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }, cups = (g.cab || []).length, clubs = new Set((g.cHist || []).map(x => x.n).concat(C ? [C.n] : [])).size;
  const Hh = (g.cHist || []).slice(0, 8);
  h += `<div class="card"><div class="eyebrow">Kariyer istatistikleri</div><div class="rep6s"><div><b>${s.gp}</b><span>Yönetilen maç</span></div><div><b class="pos">${s.w}</b><span>Kazanılan</span></div><div><b>${s.d}</b><span>Beraberlik</span></div><div><b class="neg">${s.l}</b><span>Mağlubiyet</span></div><div><b>${s.gp ? Math.round(s.w / s.gp * 100) : 0}%</b><span>Galibiyet oranı</span></div><div><b>${s.gf}:${s.ga}</b><span>Averaj</span></div><div><b class="gold">${cups}</b><span>Kupalar</span></div><div><b>${clubs}</b><span>Kulüpler</span></div></div>
  ${Hh.length || C ? `<div class="eyebrow">Geçmiş</div>${C ? `<div class="kv"><span>${C.start}– · ${esc(clubName(C.n))}</span><b>şu an · ${C.s + 1}. sezon</b></div>` : ''}${Hh.map(x => `<div class="kv"><span>${x.y} · ${esc(clubName(x.n))}</span><b>${esc(x.r)}</b></div>`).join('')}` : ''}</div>`;
  return h;
}
coachCareerCard = function () { return repCard(); };

/* =================== 2) TAKTİK =================== */
const TEMPO = ['Yavaş', 'Normal', 'Hızlı'], GEN = ['Dar', 'Dengeli', 'Geniş'], PAS = ['Kısa', 'Karışık', 'Uzun'];
const TPRE = {
  gegen: { n: 'Gegenpress', i: '⚡', d: 'Topu kaybettiğin an bas, yüksek hat', s: { tac: 'pres', hat: 'yuksek', pres: 2, tempo: 2, gen: 1, pas: 1 } },
  tiki: { n: 'Tiki-taka', i: '🎯', d: 'Kısa pas, sabır, topa sahip ol', s: { tac: 'topa', hat: 'yuksek', pres: 1, tempo: 0, gen: 2, pas: 0 } },
  kanat: { n: 'Kanat hücumu', i: '🪽', d: 'Geniş oyna, orta yağdır', s: { tac: 'hucum', hat: 'orta', pres: 1, tempo: 2, gen: 2, pas: 1 } },
  denge: { n: 'Dengeli', i: '⚖️', d: 'Her duruma uygun, risk yok', s: { tac: 'denge', hat: 'orta', pres: 1, tempo: 1, gen: 1, pas: 1 } },
  kontra: { n: 'Kontra atak', i: '🏹', d: 'Derinde bekle, hızlı çık', s: { tac: 'kontra', hat: 'derin', pres: 0, tempo: 2, gen: 1, pas: 2 } },
  otobus: { n: 'Otobüsü çek', i: '🚌', d: 'Önce gol yeme, skoru koru', s: { tac: 'savunma', hat: 'derin', pres: 0, tempo: 0, gen: 0, pas: 2 } },
};
const TIDEAL = { pres: { pres: 2, hat: 'yuksek', tempo: 2 }, topa: { pas: 0, tempo: 0, gen: 2 }, kontra: { hat: 'derin', pas: 2, tempo: 2 }, savunma: { hat: 'derin', pres: 0, gen: 0 }, hucum: { gen: 2, tempo: 2, hat: 'yuksek' }, denge: { pres: 1, hat: 'orta', tempo: 1 } };
function plan6() { const p = planOf(); if (p.tempo == null) p.tempo = 1; if (p.gen == null) p.gen = 1; if (p.pas == null) p.pas = 1; return p; }
function tacSyn(t, p) { const I = TIDEAL[t] || {}, k = Object.keys(I); return k.length ? k.filter(x => p[x] === I[x]).length / k.length : 0; }
function tacClash(t, p) {
  const o = [];
  if (p.hat === 'yuksek' && p.pres === 0) o.push('Yüksek savunma hattı ile düşük pres: arkada koşu yolları açılır.');
  if (p.hat === 'derin' && p.pres === 2) o.push('Derin hat ile yüksek pres: takım ikiye bölünür, orta saha boşalır.');
  if (t === 'topa' && p.pas === 2) o.push('Topa sahip olmak isteyip uzun top oynamak birbiriyle çelişiyor.');
  if (t === 'kontra' && p.tempo === 0) o.push('Kontra atak yavaş tempoyla işlemez.');
  if (t === 'savunma' && p.hat === 'yuksek') o.push('Otobüs taktiği yüksek savunma hattıyla çelişiyor.');
  if (t === 'pres' && p.pres === 0) o.push('Yüksek pres taktiği seçip presi düşük tutmak etkisiz.');
  return o;
}
function mfQ() { const C = g.coach; if (!C) return 0; const xi = bestXI(C.id, C.form), mf = xi.filter(x => x.p === 'MF'); if (!mf.length) return 0; return mf.reduce((s, x) => s + x.r, 0) / mf.length - club(C.id).s; }
function tacFx(tac) {
  const C = g.coach; if (!C) return { us: 1, th: 1 }; const p = plan6(), t = tac || C.tac; let us = 1, th = 1;
  us *= [.97, 1, 1.045][p.tempo]; th *= [.96, 1, 1.03][p.tempo];
  us *= [.98, 1, 1.03][p.gen]; th *= [.97, 1, 1.025][p.gen];
  if (p.pas === 0) us *= 1 + cl(mfQ() / 250, -.04, .04); if (p.pas === 2) { us *= .99; th *= .98; }
  const syn = tacSyn(t, p), n = tacClash(t, p).length; us *= (1 + syn * .05) * (1 - n * .02); th *= (1 - syn * .035) * (1 + n * .035);
  if ((p.tempo === 2 || p.pres === 2) && (C.fat || 0) > 18) { us *= .97; th *= 1.03; }
  return { us, th };
}
const _cmMods6 = cmMods;
cmMods = function (info, tac) { const r = _cmMods6(info, tac), t = tacFx(tac); return { us: r.us * t.us, th: r.th * t.th }; };
function setPlan6(k, v) {
  const p = plan6(); v = +v; if (!['tempo', 'gen', 'pas'].includes(k) || !(v >= 0 && v <= 2)) return; p[k] = v;
  toast(`${{ tempo: 'Tempo', gen: 'Genişlik', pas: 'Pas' }[k]}: ${{ tempo: TEMPO, gen: GEN, pas: PAS }[k][v]}`); sv(); draw();
}
function tacPreset(k) {
  const C = g.coach, P0 = TPRE[k]; if (!C || !P0) return; const s = P0.s, p = plan6();
  if (C.tac !== s.tac) { const tf0 = C.tf; setTac(s.tac); if (tf0 != null) C.tf = Math.max(25, tf0 - 22); }
  Object.assign(p, { hat: s.hat, pres: s.pres, tempo: s.tempo, gen: s.gen, pas: s.pas }); C.tpre = k; toast(`${P0.i} ${P0.n} uygulandı`); sv(); draw();
}
function presetOf() { const C = g.coach, p = plan6(); return Object.keys(TPRE).find(k => { const s = TPRE[k].s; return C.tac === s.tac && p.hat === s.hat && p.pres === s.pres && p.tempo === s.tempo && p.gen === s.gen && p.pas === s.pas; }); }
function miniForm(f) {
  const F = FORMS[f], rows = [[1, 33]]; let y = 25;
  if (f === '4-2-3-1') rows.push([4, y], [2, 18], [3, 12], [1, 6]); else if (f === '4-1-4-1') rows.push([4, y], [1, 19.5], [4, 13], [1, 6]); else rows.push([F.DF, y], [F.MF, 16], [F.FW, 7]);
  return `<svg viewBox="0 0 30 38"><rect x=".5" y=".5" width="29" height="37" rx="2" fill="#2a8a26" stroke="rgba(255,255,255,.35)" stroke-width=".6"/><line x1="1" y1="19" x2="29" y2="19" stroke="rgba(255,255,255,.25)" stroke-width=".4"/>${rows.map(([n, yy]) => Array.from({ length: n }, (_, i) => `<circle cx="${n === 1 ? 15 : 4 + 22 * i / (n - 1)}" cy="${yy}" r="1.8" fill="#fff"/>`).join('')).join('')}</svg>`;
}
function tacPitch() {
  const C = g.coach, p = plan6(); let h = pitchSVG(C.id, C.form);
  const hy = { derin: 113, orta: 101, yuksek: 89 }[p.hat] || 101, sx = { sol: 16, merkez: 50, sag: 84 }[p.side] || 50;
  const ov = `<line x1="6" y1="${hy}" x2="94" y2="${hy}" stroke="#e8c468" stroke-width=".7" stroke-dasharray="2.2 1.6" opacity=".85"/><text x="94" y="${hy - 1.6}" text-anchor="end" font-size="3.3" fill="#e8c468">Savunma hattı</text>
  <path d="M${sx} 52 L${sx} 22" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-dasharray="3 2" fill="none"/><path d="M${sx - 3.5} 25 L${sx} 18 L${sx + 3.5} 25 Z" fill="rgba(255,255,255,.7)"/>
  ${p.gen === 2 ? '<path d="M4 70 L12 70 M88 70 L96 70" stroke="rgba(255,255,255,.5)" stroke-width="1.2"/>' : ''}`;
  return h.replace('</svg>', ov + '</svg>');
}
function bar6(n, v, col, hint) { return `<div class="tan"><span>${n}</span><div class="tanb"><i style="width:${cl(v, 3, 100)}%;background:${col}"></i></div><b>${Math.round(cl(v, 0, 100))}</b>${hint ? `<em>${hint}</em>` : ''}</div>`; }
function tacAnalysis() {
  const C = g.coach, p = plan6(), t = C.tac, T0 = TACT[t], syn = tacSyn(t, p), cls = tacClash(t, p), fit = 100 - cl((C.fat || 0) / 30, 0, 1) * 100;
  const atk = 50 + (T0.us - 1) * 260 + (p.tempo - 1) * 7 + (p.gen - 1) * 5 + { yuksek: 4, orta: 0, derin: -5 }[p.hat] + syn * 8 - cls.length * 5;
  const def = 50 + (1 - T0.th) * 260 + { derin: 8, orta: 0, yuksek: -6 }[p.hat] + (p.pres - 1) * 3 + syn * 6 - cls.length * 7 - (p.gen === 2 ? 3 : 0);
  const ctl = 50 + ({ topa: 20, savunma: -16, kontra: -12, pres: 4, hucum: 4, denge: 0 }[t] || 0) + (p.pas === 0 ? 10 : p.pas === 2 ? -10 : 0) + (p.tempo === 0 ? 6 : p.tempo === 2 ? -5 : 0) + cl(mfQ(), -6, 6);
  const load = 22 + p.pres * 15 + p.tempo * 13 + (t === 'pres' ? 16 : t === 'savunma' ? -8 : 0);
  const notes = cls.slice();
  if ((p.tempo === 2 || p.pres === 2) && fit < 55) notes.push(`Takımın zindeliği ${Math.round(fit)}%: yüksek tempo ve pres sakatlık ve düşüş getirir.`);
  if (t === 'topa' && mfQ() < -2) notes.push('Orta sahan topa sahip olma oyunu için yeterince kaliteli değil.');
  if (p.pas === 0 && mfQ() > 2) notes.push('Orta sahan kaliteli: kısa pas oyunu sana avantaj sağlar.');
  if (syn >= .99) notes.unshift(`✔ Talimatlar ${T0.n} anlayışıyla tam uyumlu.`);
  const nm = nextWeekMatch && nextWeekMatch(), pm = nm && nm.info && nm.info.oid ? prepMod(nm.info, t) : null;
  return `<div class="card"><div class="eyebrow">📊 Taktik analizi</div>
  ${bar6('Hücum gücü', atk, '#56c98d')}${bar6('Savunma sağlamlığı', def, '#4aa3ff')}${bar6('Topa sahip olma', ctl, '#e8c468')}${bar6('Fiziksel yük', load, load > 70 ? '#ff6b5b' : '#c08bff')}${bar6('Talimat uyumu', syn * 100, '#e8c468')}${bar6('Taktik uyumu (antrenman)', C.tf == null ? 55 : C.tf, '#56c98d')}
  ${notes.length ? notes.map(x => `<div class="${x.startsWith('✔') ? 'm pos' : 'warn'}">${esc(x)}</div>`).join('') : '<div class="m">Çelişen talimat yok.</div>'}
  ${pm ? `<div class="m">Sıradaki rakip <b>${esc(nm.info.on)}</b>: ${pm.hits ? `planın rakibe uyuyor (${pm.hits} doğru hamle)` : pm.miss ? 'planın rakibin oyununa ters olabilir' : 'nötr eşleşme'}. Ayrıntı: Maç planı.</div>` : ''}</div>`;
}
function segRow(n, cur, opts, fn) { return `<div class="trow"><span>${n}</span><div class="tseg">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" onclick="${fn}(${typeof v === 'string' ? `'${v}'` : v})">${l}</button>`).join('')}</div></div>`; }
function tak6() {
  const C = g.coach, p = plan6(), pr = presetOf();
  let h = `<div class="card"><div class="eyebrow">Hazır taktikler ${pr ? `· <span class="gold">${TPRE[pr].i} ${TPRE[pr].n}</span>` : '· özel'}</div><div class="tpre">${Object.entries(TPRE).map(([k, x]) => `<button class="${pr === k ? 'on' : ''}" onclick="tacPreset('${k}')"><i>${x.i}</i><b>${x.n}</b><span>${x.d}</span></button>`).join('')}</div><div class="m">Hazır taktik, oyun anlayışını ve tüm talimatları tek dokunuşla ayarlar. Anlayış değişirse taktik uyumu düşer.</div></div>`;
  h += `<div class="card"><div class="eyebrow">Diziliş · ${C.form} · güç ${club(C.id).s}</div><div class="tform">${Object.keys(FORMS).map(f => `<button class="${C.form === f ? 'on' : ''}" onclick="setForm('${f}')">${miniForm(f)}<b>${f}</b></button>`).join('')}</div>${tacPitch()}</div>`;
  h += `<div class="card"><div class="eyebrow">Oyun anlayışı</div><div class="opts">${Object.entries(TACT).map(([k, t]) => `<button class="opt sm ${C.tac === k ? 'on' : ''}" onclick="setTac('${k}')"><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div></div>`;
  h += `<div class="card"><div class="eyebrow">Takım talimatları</div>
  ${segRow('Savunma hattı', p.hat, [['derin', 'Derin'], ['orta', 'Normal'], ['yuksek', 'Yüksek']], "setPlan('hat',")}
  ${segRow('Pres', p.pres, [[0, 'Düşük'], [1, 'Normal'], [2, 'Yüksek']], "setPlan('pres',")}
  ${segRow('Tempo', p.tempo, [[0, 'Yavaş'], [1, 'Normal'], [2, 'Hızlı']], "setPlan6('tempo',")}
  ${segRow('Genişlik', p.gen, [[0, 'Dar'], [1, 'Dengeli'], [2, 'Geniş']], "setPlan6('gen',")}
  ${segRow('Pas', p.pas, [[0, 'Kısa'], [1, 'Karışık'], [2, 'Uzun']], "setPlan6('pas',")}
  ${segRow('Hücum yönü', p.side, [['sol', 'Sol'], ['merkez', 'Merkez'], ['sag', 'Sağ']], "setPlan('side',")}
  ${segRow('Yıldıza adam adama', p.mark ? 1 : 0, [[0, 'Yok'], [1, 'Var']], "setPlan('mark',")}
  <div class="m">Hızlı tempo ve yüksek pres daha çok pozisyon üretir ama yorar. Geniş oyun kanatları açar, arkada boşluk bırakır.</div></div>`;
  h += tacAnalysis();
  h += `<div class="card"><div class="eyebrow">Rotasyon</div><div class="chips">${['Az', 'Dengeli', 'Çok'].map((n, i) => `<button class="chip ${C.rot === i ? 'on' : ''}" onclick="setRot(${i})">${n}</button>`).join('')}</div>
  <div class="eyebrow">Antrenman yükü</div><div class="chips">${['Hafif', 'Normal', 'Ağır'].map((n, i) => `<button class="chip ${C.load === i ? 'on' : ''}" onclick="setLoad(${i})">${n}</button>`).join('')}</div><div class="m">Ağır antrenman gençleri geliştirir ama sakatlık getirir; hafif antrenman yorgunluğu atar.</div></div>`;
  return h;
}
const _coachUI6 = coachUI;
coachUI = function () {
  let h = _coachUI6(); const C = g.coach; if (!C) return h;
  const i = h.indexOf('</div>'); if (i < 0) return h;
  h = h.slice(0, i) + seg('CV2', 'itb', 'İtibar', CV2) + h.slice(i);
  const j = h.indexOf('</div>') + 6;
  if (CV2 === 'tak') return h.slice(0, j) + tak6();
  if (CV2 === 'itb') return h.slice(0, j) + repCard();
  return h;
};

/* =================== 3) CANLI MAÇ: OTOMATİK AKAN SÜRE + NOKTALAR =================== */
const LSPD = [.55, 1, 2.4], LSPN = ['Yavaş', 'Normal', 'Hızlı'];
let LS = null;
const dir6 = p => p.side ? -1 : 1, U6 = (side, x) => side ? 100 - x : x, X6 = (side, u) => side ? 100 - u : u;
const d6 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function lsYs(n) { if (n <= 1) return [30]; const sp = n === 2 ? 18 : n === 3 ? 30 : n === 4 ? 40 : 46; return Array.from({ length: n }, (_, i) => 30 - sp / 2 + sp * i / (n - 1)); }
function lsLay(list, form, side) {
  const by = k => list.filter(p => p.p === k), out = [], add = (L, u, pos) => { const ys = lsYs(L.length); L.forEach((p, i) => out.push({ side, pos, u0: u, hy: side ? 60 - ys[i] : ys[i], id: p.id, num: p.num || (out.length + 1), n: p.id != null && p.n ? short(pname(p)) : '', gk: pos === 'GK' })); };
  add(by('GK').slice(0, 1), 4, 'GK'); add(by('DF'), 19, 'DF');
  const mf = by('MF'); if (form === '4-2-3-1' && mf.length >= 5) { add(mf.slice(0, 2), 33, 'MF'); add(mf.slice(2), 49, 'MF'); } else if (form === '4-1-4-1' && mf.length >= 5) { add(mf.slice(0, 1), 31, 'MF'); add(mf.slice(1), 46, 'MF'); } else add(mf, 40, 'MF');
  add(by('FW'), by('FW').length === 1 ? 63 : 60, 'FW');
  out.forEach(p => { p.x = X6(side, Math.min(p.u0, 46)); p.y = p.hy; p.ph = Math.random() * 6; });
  return out;
}
function colDist(a, b) { const A = parseInt((a || '#888').slice(1), 16), B = parseInt((b || '#888').slice(1), 16); return Math.abs((A >> 16) - (B >> 16)) + Math.abs(((A >> 8) & 255) - ((B >> 8) & 255)) + Math.abs((A & 255) - (B & 255)); }
function lsNew() {
  const C = g.coach, c = club(C.id), oid = LM.info.oid, oc = oid && club(oid);
  const fake = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'].map((p, i) => ({ p, num: [1, 2, 4, 5, 3, 8, 6, 10, 7, 9, 11][i] }));
  let oxi = null; try { oxi = oid && g.sq[oid] && g.sq[oid].length >= 11 ? bestXI(oid, '4-4-2') : null; } catch (e) { }
  const A = lsLay(lmOn(), C.form, 0), B = lsLay(oxi || fake, '4-4-2', 1);
  let ca = [c.c1, c.c2], cb = oc ? [oc.c1, oc.c2] : ['#f2f2f2', '#c0392b'];
  if (colDist(ca[0], cb[0]) < 110) cb = colDist(ca[0], cb[1]) >= 110 ? [cb[1], cb[0]] : (lum(ca[0]) > 140 ? ['#1d2b53', '#fff'] : ['#f2f2f2', '#222']);
  return { P: A.concat(B), ca, cb, b: { x: 50, y: 30, h: 0, own: null, fl: null }, poss: 0, t: 0, dc: .6, dead: 0, rs: 0, cel: 0, hold: 0, tk: 0, scr: null, chq: [], st: { pos: [0, 0], sh: [0, 0], on: [0, 0], kor: [0, 0] }, vt: 0, flash: null, last: 0, raf: 0, ui: 0 };
}
function lsVoice(k, pri, gap) { const S6 = LS; if (!S6) return; if (S6.t - S6.vt < (gap == null ? 3.2 : gap) && (pri || 1) < 3) return; S6.vt = S6.t; try { vxPlay(k, pri || 1); } catch (e) { } }
function lsKick(side, t) { const S6 = LS; S6.rs = t || 1.5; S6.dead = 0; S6.rk = null; S6.kickSide = side; S6.b.fl = null; S6.b.own = null; S6.b.x = 50; S6.b.y = 30; S6.b.h = 0; S6.scr = S6.scr && S6.scr.out === 'goal' ? S6.scr : null; S6.P.forEach(p => p.run = null); }
function lsKickGo() {
  const S6 = LS, side = S6.kickSide || 0, c = S6.P.filter(p => p.side === side && !p.off && !p.gk).sort((a, b) => d6(a, { x: 50, y: 30 }) - d6(b, { x: 50, y: 30 }))[0];
  if (!c) return; c.x = 50 - dir6(c) * .6; c.y = 30; S6.b.own = c; S6.poss = side; S6.dc = .7;
}
function lsMates(c) { return LS.P.filter(p => p.side === c.side && p !== c && !p.off); }
function lsOpen(p) { let m = 99; LS.P.forEach(q => { if (q.side !== p.side && !q.off) m = Math.min(m, d6(p, q)); }); return m; }
function lsPick(c, fwdOnly) {
  const pl = c.side === 0 && g.coach ? plan6() : { pas: 1, side: 'merkez' }, u = U6(c.side, c.x);
  let best = null, bs = -1e9;
  lsMates(c).forEach(m => {
    if (m.gk && u > 30) return; const du = U6(m.side, m.x) - u, d = d6(c, m); if (fwdOnly && du < 4) return;
    let s = du * (pl.pas === 2 ? .75 : .45) + Math.min(lsOpen(m), 10) * .9 - Math.max(0, d - (pl.pas === 0 ? 16 : pl.pas === 2 ? 40 : 28)) * .6 - (d < 5 ? 8 : 0) + Math.random() * 7;
    if (c.side === 0 && pl.side !== 'merkez') { const wy = pl.side === 'sol' ? 10 : 50; s -= Math.abs(m.y - wy) * .08; }
    if (s > bs) { bs = s; best = m; }
  });
  return best;
}
function lsStr(side) { const m = LM; let md = { us: 1, th: 1 }; try { md = cmMods(m.info, m.tac); } catch (e) { } const a = m.a * md.us * (m.boost || 1), b = m.b * md.th; return side ? b - a : a - b; }
function lsPass(c, t, forceInt) {
  const S6 = LS, b = S6.b, lead = U6(t.side, t.x) > U6(c.side, c.x) ? rf(.5, 3) : 0, tx = cl(t.x + dir6(t) * lead, 1, 99), ty = cl(t.y + rf(-1.2, 1.2), 1, 59), d = Math.hypot(tx - c.x, ty - c.y);
  const dur = cl(d / 30, .28, 1.35), arc = d > 26 ? d * .09 : 0, sc = S6.scr;
  let pI = cl(.15 - lsStr(c.side) * .006 - (c.side ? -1 : 1) * (LM.mom || 0) / 50 * .05 + (d > 30 ? .07 : 0), .03, .3);
  if (sc && sc.side === c.side) pI = 0; if (sc && sc.side !== c.side) pI = .8; if (forceInt) pI = 1;
  if (Math.random() < pI) {
    const k = rf(.45, .7), pt = { x: c.x + (tx - c.x) * k, y: c.y + (ty - c.y) * k }, opp = S6.P.filter(p => p.side !== c.side && !p.off && !p.gk).sort((a, b2) => d6(a, pt) - d6(b2, pt))[0];
    if (opp) { opp.run = pt; b.fl = { fx: b.x, fy: b.y, tx: pt.x, ty: pt.y, dur: dur * k + .15, k: 0, arc: arc * k, to: opp, kind: 'pass' }; b.own = null; return; }
  }
  t.run = { x: tx, y: ty }; b.fl = { fx: b.x, fy: b.y, tx, ty, dur, k: 0, arc, to: t, kind: 'pass' }; b.own = null;
}
function lsShoot(c, out) {
  const S6 = LS, b = S6.b, side = c.side;
  if (out === 'auto') { const r = Math.random(); out = r < .46 ? 'save' : r < .8 ? 'wide' : r < .87 ? 'post' : 'corner'; }
  const gx = side ? -1.2 : 101.2, gy = out === 'goal' ? 30 + rf(-2.6, 2.6) : out === 'save' ? 30 + rf(-2.2, 2.2) : out === 'post' ? (Math.random() < .5 ? 26.8 : 33.2) : out === 'corner' ? 30 + (Math.random() < .5 ? -5 : 5) : 30 + (Math.random() < .5 ? -1 : 1) * rf(4.6, 9);
  const tx = out === 'post' || out === 'save' ? (side ? 0.6 : 99.4) : gx, d = Math.hypot(tx - c.x, gy - c.y);
  b.fl = { fx: b.x, fy: b.y, tx, ty: gy, dur: cl(d / 48, .22, .7), k: 0, arc: out === 'wide' && Math.random() < .5 ? 2.2 : .6, kind: 'shot', out, side, by: c }; b.own = null;
  S6.st.sh[side]++; if (out === 'goal' || out === 'save' || out === 'post') S6.st.on[side]++;
  try { sfx('kick', 1); } catch (e) { }
  if (out !== 'goal' && side === 0 && Math.random() < .55) lsVoice(U6(0, c.x) < 75 ? 'longshot' : 'shot', 2, 2);
  if (S6.scr && S6.scr.out !== 'goal') S6.scr = null;
}
function lsGoal(side, by) {
  const S6 = LS, m = LM, ev = m.ev[m.gi]; m.gi++; S6.scr = null; S6.cel = 2.6; S6.gs = side; S6.scorer = by || null;
  m.clk = Math.max(m.clk, (ev ? ev.m : m.clk) + .002);
  const sc = lsSc(); S6.flash = { t: S6.t, txt: side ? T('GOL YEDİK') : `⚽ ${T('GOL!')} ${ev && ev.p ? short(ev.p) : ''}`, side };
  try { if (!side) { sfx('net'); sfx('roar'); crowdLvl(.3); setTimeout(() => crowdLvl(.12), 2600); lsVoice(sc[0] === sc[1] ? 'equal' : sc[0] - sc[1] === 1 ? 'lead' : 'goal', 3); } else { sfx('net'); sfx('groan'); lsVoice('concede', 3); } } catch (e) { }
  S6.kickSide = 1 - side; lsUI(1);
}
function lsArrive() {
  const S6 = LS, b = S6.b, f = b.fl; b.fl = null; b.h = 0;
  if (f.kind === 'pass') { const r = f.to; r.run = null; b.own = r; if (r.side !== S6.poss) { S6.poss = r.side; if (r.side === 0 && U6(0, r.x) < 45 && Math.random() < .35) lsVoice('counter', 1); else if (r.side === 0 && Math.random() < .2) lsVoice('win', 1); } S6.dc = r.gk ? 1.1 : rf(.35, .85); return; }
  if (f.kind === 'shot') {
    const def = 1 - f.side, gk = S6.P.find(p => p.side === def && p.gk && !p.off);
    if (f.out === 'goal') { b.x = f.tx; b.y = f.ty; return lsGoal(f.side, f.by); }
    if (f.out === 'save' && gk) { gk.y = b.y; b.own = gk; S6.poss = def; S6.dc = 1.3; if (f.side === 0) lsVoice('save', 2, 1.5); try { sfx('roar'); } catch (e) { } return; }
    if (f.out === 'post') { lsVoice('post', 2, 1); const rb = { x: X6(f.side, rf(84, 90)), y: 30 + rf(-9, 9) }; b.fl = { fx: b.x, fy: b.y, tx: rb.x, ty: rb.y, dur: .45, k: 0, arc: 1, kind: 'loose' }; return; }
    if (f.out === 'corner') { S6.st.kor[f.side]++; S6.dead = 1.5; S6.rk = { k: 'corner', side: f.side, y: f.ty < 30 ? .8 : 59.2 }; lsVoice('corner', 1); const tk = S6.P.filter(p => p.side === f.side && !p.off && !p.gk).sort((a, c) => d6(a, b) - d6(c, b))[0]; if (tk) { tk.run = { x: f.side ? .8 : 99.2, y: S6.rk.y }; S6.rk.tk = tk; } return; }
    S6.dead = 1.3; S6.rk = { k: 'gk', side: def }; if (f.side === 0) lsVoice('wide', 1, 1.5); return;
  }
  if (f.kind === 'cross') { const r = f.to; if (r.side !== f.side || Math.random() < .25) { const pt = { x: X6(f.side, rf(48, 62)), y: rf(8, 52) }; b.fl = { fx: b.x, fy: b.y, tx: pt.x, ty: pt.y, dur: .8, k: 0, arc: 4, kind: 'loose' }; return; } b.own = r; lsShoot(r, S6.scr && S6.scr.side === f.side ? S6.scr.out : (Math.random() < .5 ? 'save' : 'wide')); return; }
  if (f.kind === 'loose') { let best = null, bd = 99; S6.P.forEach(p => { if (p.off) return; const d = d6(p, b); if (d < bd) { bd = d; best = p; } }); if (best) { b.own = best; if (best.side !== S6.poss) S6.poss = best.side; S6.dc = .5; } return; }
}
function lsRestart() {
  const S6 = LS, b = S6.b, rk = S6.rk || { k: 'gk', side: 1 - S6.poss }; S6.rk = null;
  if (rk.k === 'gk') { const gk = S6.P.find(p => p.side === rk.side && p.gk && !p.off) || S6.P.find(p => p.side === rk.side && !p.off); gk.x = X6(rk.side, 5); gk.y = 30; b.x = gk.x; b.y = 30; b.own = gk; S6.poss = rk.side; S6.dc = .9; return; }
  if (rk.k === 'corner') {
    const cx = rk.side ? .8 : 99.2; b.x = cx; b.y = rk.y; if (rk.tk) { rk.tk.x = cx; rk.tk.y = rk.y; rk.tk.run = null; }
    const pt = { x: X6(rk.side, rf(88, 94)), y: 30 + rf(-6, 6) }, cands = S6.P.filter(p => !p.off && !p.gk && p !== rk.tk).sort((a, c) => d6(a, pt) - d6(c, pt)).slice(0, 4);
    const sc = S6.scr && S6.scr.side === rk.side, to = sc ? (cands.find(p => p.side === rk.side) || cands[0]) : (Math.random() < .62 ? (cands.find(p => p.side !== rk.side) || cands[0]) : (cands.find(p => p.side === rk.side) || cands[0]));
    if (!to) return; to.run = pt; b.fl = { fx: b.x, fy: b.y, tx: pt.x, ty: pt.y, dur: .9, k: 0, arc: 6, kind: 'cross', to, side: rk.side }; return;
  }
}
function lsDecide(c) {
  const S6 = LS, side = c.side, u = U6(side, c.x), sc = S6.scr, mine = sc && sc.side === side, theirs = sc && sc.side !== side;
  const tf = side === 0 && g.coach ? [1.3, 1, .78][plan6().tempo] : 1;
  if (c.gk) { const t = lsPick(c); if (t) lsPass(c, t); S6.dc = rf(.9, 1.4); return; }
  if (mine) {
    if (u > 77 || (S6.hold > 2.2 && u > 55) || S6.hold > 4) return lsShoot(c, sc.out);
    const f = lsPick(c, 1); if (f && U6(side, f.x) > u + 8 && Math.random() < .5) { lsPass(c, f); return; }
    S6.dc = .25; return;
  }
  if (!theirs && u > 63 && Math.abs(c.y - 30) < 20 && Math.random() < (u - 58) / 40) return lsShoot(c, 'auto');
  const t = lsPick(c); if (t) lsPass(c, t, theirs && Math.random() < .5); S6.dc = rf(.5, 1.2) * tf;
}
function lsSc() { const m = LM; return [0, 1].map(s => m.ev.filter(x => x.s === s && x.m < m.clk).length); }
function lsTacOff(side, att) {
  if (side) return att ? 6 : -3; const p = g.coach ? plan6() : {}, t = LM.tac;
  return (att ? 6 : -3) + ({ hucum: 5, pres: 4, topa: 2, denge: 0, kontra: -4, savunma: -8 }[t] || 0) + ({ derin: -4, orta: 0, yuksek: 4 }[p.hat] || 0);
}
function lsMove(dt) {
  const S6 = LS, b = S6.b, t = S6.t, poss = S6.poss, live = !(S6.rs > 0) && !(S6.cel > 0) && !(S6.dead > 0);
  let pr1 = null, pr2 = null;
  if (live) { const def = 1 - poss, ds = S6.P.filter(p => p.side === def && !p.off && !p.gk && !p.run).sort((a, c) => d6(a, b) - d6(c, b)); pr1 = ds[0]; pr2 = ds[1]; }
  const pl0 = g.coach ? plan6() : { pres: 1, gen: 1, tempo: 1 };
  S6.P.forEach(p => {
    if (p.off) return; let tx, ty, sp = 5.2; const side = p.side, ub = U6(side, b.x), att = side === poss;
    if (S6.rs > 0) { tx = X6(side, Math.min(p.u0, side === S6.kickSide ? 49 : 45)); ty = p.hy; sp = 10; }
    else if (S6.cel > 0) { if (side === S6.gs && S6.scorer && !p.gk) { tx = S6.scorer.x + Math.sin(t * 3 + p.ph) * 2.2; ty = S6.scorer.y + Math.cos(t * 3 + p.ph) * 2.2; sp = 8; if (p === S6.scorer) { tx = X6(side, 92); ty = p.hy < 30 ? 4 : 56; } } else { tx = X6(side, Math.min(p.u0, 45)); ty = p.hy; sp = 3; } }
    else if (p === b.own) { const u = U6(side, p.x), mine = S6.scr && S6.scr.side === side; tx = X6(side, Math.min(97, u + 6)); ty = u > 60 ? p.y + (30 - p.y) * .4 : p.y + Math.sin(t + p.ph) * 2; sp = mine ? 8.2 : (side === 0 ? [4.6, 5.6, 6.6][pl0.tempo] : 5.6); if (p.gk) { tx = p.x; ty = p.y; } if (S6.dead > 0) { tx = p.x; ty = p.y; } }
    else if (p.run) { tx = p.run.x; ty = p.run.y; sp = 8.8; }
    else if (p === pr1) { tx = b.x - dir6(p) * .5; ty = b.y; sp = 7.4 * (side === 0 ? [.75, 1, 1.22][pl0.pres] * (LM.tac === 'pres' ? 1.1 : 1) : 1); }
    else if (p === pr2) { const gx = X6(side, 0); tx = b.x + (gx - b.x) * .18; ty = b.y + (30 - b.y) * .3; sp = 6.6; }
    else if (p.gk) { tx = X6(side, 2.5 + cl((ub - 30) * .05, 0, 6)); ty = 30 + cl((b.y - 30) * .32, -4.5, 4.5); sp = 4.5; }
    else {
      let u = p.u0 + (ub - 50) * .5 + lsTacOff(side, att);
      if (att) { if (p.pos === 'FW') u = Math.max(u, Math.min(ub + 9, 88)); if (p.pos === 'DF') u = Math.min(u, ub - 3); }
      else { u = Math.min(u, ub + (p.pos === 'FW' ? 12 : p.pos === 'MF' ? 4 : -3)); if (p.pos === 'DF') u = Math.min(u, Math.max(ub - 7, 8)); }
      u = cl(u + Math.cos(t * .55 + p.ph) * 1.4, 6, 92);
      let y = p.hy + (b.y - 30) * (att ? .2 : .36); if (att && side === 0) y = 30 + (y - 30) * [.85, 1, 1.16][pl0.gen];
      tx = X6(side, u); ty = y + Math.sin(t * .7 + p.ph) * 1.3; sp = att ? 5.6 : 5.2;
    }
    if (S6.dead > 0 && !p.run) sp = Math.min(sp, 3.2);
    tx = cl(tx, .5, 99.5); ty = cl(ty, .8, 59.2);
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy); if (d > .03) { const k = Math.min(1, sp * dt / d); p.x += dx * k; p.y += dy * k; p.mv = d > .6; } else p.mv = false;
  });
  /* aynı takımdan üst üste binenleri ayır */
  for (let i = 0; i < S6.P.length; i++) for (let j = i + 1; j < S6.P.length; j++) { const a = S6.P[i], c = S6.P[j]; if (a.off || c.off) continue; const d = d6(a, c); if (d < 2.6 && d > .001 && a !== b.own && c !== b.own) { const k = (2.6 - d) * .25, ux = (a.x - c.x) / d, uy = (a.y - c.y) / d; a.x += ux * k; a.y += uy * k; c.x -= ux * k; c.y -= uy * k; } }
}
function lsSegRun() {
  const m = LM, S6 = LS;
  if (m.injP) { const bn = lmBench()[0]; if (bn) { m.out = m.injP; lmSub(bn.id); toast('Sağlık ekibi uyardı: değişiklik otomatik yapıldı'); } else m.injP = null; }
  const n0 = m.log.length; m.noAnim = 1; _lmSegRaw();
  const add = m.log.slice(0, m.log.length - n0);
  add.forEach(x => { const t = x.t || ''; if (t.includes('direği')) S6.chq.push({ m: x.m, side: 0, out: 'post' }); else if (t.includes('son anda çeldi')) S6.chq.push({ m: x.m, side: 0, out: 'save' }); else if (t.includes('kritik kurtarış')) S6.chq.push({ m: x.m, side: 1, out: 'save' }); });
  S6.chq.sort((a, b) => a.m - b.m);
}
function lsTick(dt) {
  const m = LM, S6 = LS; if (!m || !S6) return;
  if (m.pz || m.fin) return;
  S6.t += dt; if (S6.flash && S6.t - S6.flash.t > 2.4) S6.flash = null;
  if (S6.cel > 0) { S6.cel -= dt; lsMove(dt); if (S6.cel <= 0) lsKick(S6.kickSide, 1.4); return; }
  if (S6.rs > 0) { S6.rs -= dt; lsMove(dt); if (S6.rs <= 0) lsKickGo(); return; }
  /* saat */
  const rate = LSPD[m.spd == null ? 1 : m.spd]; let nc = m.clk + dt * rate; const ng = m.ev[m.gi];
  if (ng && nc >= ng.m - .001) { nc = Math.max(m.clk, ng.m - .001); S6.hold += dt; } else S6.hold = 0;
  if (!m.ht && nc >= 45) { nc = 45; m.clk = 45; m.ht = 1; m.htP = 1; m.pz = 1; try { sfx('whistle', 1); crowdLvl(.05); } catch (e) { } lsVoice('half', 2, 0); draw(); return; }
  if (m.res && nc >= 90 + (m.xt || 2)) { m.clk = 90 + (m.xt || 2); m.fin = 1; try { sfx('whistle', 1); crowdLvl(0); } catch (e) { } lsVoice('final', 3); lsUI(1); draw(); return; }
  m.clk = nc;
  while (!m.res && m.seg < 6 && m.clk >= m.seg * 15 && !(m.seg === 3 && !m.ht)) lsSegRun();
  if (m.clk > 70 && !S6.tired) { S6.tired = 1; if (Math.random() < .5) lsVoice('tired', 1); }
  /* senaryo: gol / pozisyon */
  const lead = 4.2 * rate, ng2 = m.ev[m.gi];
  if (ng2 && (!S6.scr || S6.scr.out !== 'goal') && m.clk >= ng2.m - lead) S6.scr = { side: ng2.s, out: 'goal' };
  while (S6.chq[0] && S6.chq[0].m < m.clk - 2) S6.chq.shift();
  if (!S6.scr && S6.chq[0] && m.clk >= S6.chq[0].m - lead * .7) S6.scr = S6.chq.shift();
  if (S6.scr && S6.hold > 6.5 && S6.scr.out === 'goal') { const c = S6.b.own && S6.b.own.side === S6.scr.side ? S6.b.own : S6.P.filter(p => p.side === S6.scr.side && !p.off && !p.gk).sort((a, c2) => U6(c2.side, c2.x) - U6(a.side, a.x))[0]; if (c && !S6.b.fl) { S6.b.x = c.x; S6.b.y = c.y; lsShoot(c, 'goal'); } }
  /* top */
  const b = S6.b;
  if (b.fl) { const f = b.fl; f.k += dt / f.dur; if (f.k >= 1) { b.x = f.tx; b.y = f.ty; lsArrive(); } else { b.x = f.fx + (f.tx - f.fx) * f.k; b.y = f.fy + (f.ty - f.fy) * f.k; b.h = Math.sin(f.k * Math.PI) * (f.arc || 0); } }
  else if (S6.dead > 0) { S6.dead -= dt; if (S6.dead <= 0) lsRestart(); }
  else if (b.own) {
    const c = b.own; b.x += (c.x + dir6(c) * .9 - b.x) * Math.min(1, dt * 14); b.y += (c.y - b.y) * Math.min(1, dt * 14); b.h = 0;
    S6.st.pos[c.side] += dt;
    const sc = S6.scr, prot = sc && sc.side === c.side, force = sc && sc.side !== c.side;
    const opp = S6.P.filter(p => p.side !== c.side && !p.off && !p.gk && d6(p, c) < 2.2)[0];
    if (opp && !c.gk && !prot) { S6.tk += dt; if (S6.tk > (force ? .2 : .5)) { S6.tk = 0; const pw = force ? 1 : cl(.42 - lsStr(c.side) * .01, .2, .65) * (c.side === 1 && g.coach ? [.8, 1, 1.2][plan6().pres] : 1); if (Math.random() < pw) { b.own = opp; S6.poss = opp.side; S6.dc = rf(.3, .7); if (opp.side === 0 && Math.random() < .3) lsVoice('tackle', 1); } } }
    else S6.tk = 0;
    if (b.own === c) { S6.dc -= dt; if (S6.dc <= 0) lsDecide(c); }
  } else { const near = S6.P.filter(p => !p.off).sort((a, c) => d6(a, b) - d6(c, b))[0]; if (near) { b.own = near; S6.poss = near.side; } }
  if (Math.abs((m.mom || 0)) > 28 && Math.random() < dt * .02) lsVoice('press', 1, 8);
  lsMove(dt);
}
function lsRender() {
  const cv = document.getElementById('lm6cv'), S6 = LS; if (!cv || !S6) return;
  const W = cv.clientWidth || 340, H = Math.round(W * .64), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
  const x = cv.getContext && cv.getContext('2d'); if (!x) return;
  const sx = W / 106, sy = H / 66; x.setTransform(dpr * sx, 0, 0, dpr * sy, dpr * 3 * sx, dpr * 3 * sy);
  x.fillStyle = '#2b8a27'; x.fillRect(-3, -3, 106, 66); for (let i = 0; i < 10; i += 2) { x.fillStyle = 'rgba(255,255,255,.045)'; x.fillRect(i * 10, 0, 10, 60); }
  x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = .32;
  x.strokeRect(0, 0, 100, 60); x.beginPath(); x.moveTo(50, 0); x.lineTo(50, 60); x.stroke(); x.beginPath(); x.arc(50, 30, 8.4, 0, 7); x.stroke();
  [0, 1].forEach(s => { const g0 = s ? 100 : 0, k = s ? -1 : 1; x.strokeRect(Math.min(g0, g0 + k * 15.7), 12.2, 15.7, 35.6); x.strokeRect(Math.min(g0, g0 + k * 5.2), 21.9, 5.2, 16.2); x.beginPath(); x.arc(g0 + k * 10.5, 30, .35, 0, 7); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill();
    x.beginPath(); x.arc(g0 + k * 10.5, 30, 8.4, s ? Math.PI - .93 : -.93, s ? Math.PI + .93 : .93, false); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(s ? 100 : -1.8, 26.8, 1.8, 6.4); x.strokeRect(s ? 100 : -1.8, 26.8, 1.8, 6.4); });
  x.beginPath(); x.arc(50, 30, .4, 0, 7); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill();
  const b = S6.b, own = b.own;
  S6.P.forEach(p => {
    if (p.off) return; const col = p.side ? S6.cb : S6.ca, gk = p.gk, fc = gk ? (p.side ? '#ffd23f' : '#3ad1ff') : col[0];
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(p.x + .35, p.y + 1.6, 1.7, .6, 0, 0, 7); x.fill();
    if (p === own) { x.strokeStyle = '#fff'; x.lineWidth = .35; x.beginPath(); x.arc(p.x, p.y, 2.7, 0, 7); x.stroke(); }
    x.fillStyle = fc; x.strokeStyle = gk ? '#111' : col[1]; x.lineWidth = .45; x.beginPath(); x.arc(p.x, p.y, 1.85, 0, 7); x.fill(); x.stroke();
    x.fillStyle = lum(fc) > 150 ? '#111' : '#fff'; x.font = '800 2px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.num, p.x, p.y + .1);
  });
  if (own && own.n && !S6.cel) { x.font = '700 2.3px sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(0,0,0,.55)'; const w = x.measureText(own.n).width + 1.6; x.fillRect(own.x - w / 2, own.y - 5.6, w, 2.8); x.fillStyle = '#fff'; x.fillText(own.n, own.x, own.y - 4.15); }
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(b.x + .2, b.y + .5, .75, .35, 0, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.strokeStyle = '#111'; x.lineWidth = .25; x.beginPath(); x.arc(b.x, b.y - (b.h || 0), .8 + (b.h || 0) * .06, 0, 7); x.fill(); x.stroke();
  if (S6.flash) { const a = 1 - (S6.t - S6.flash.t) / 2.4; x.globalAlpha = cl(a * 2, 0, 1); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(-3, 22, 106, 16); x.fillStyle = S6.flash.side ? '#ff8a6b' : '#ffe34d'; x.font = '900 7px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(S6.flash.txt, 50, 30, 94); x.globalAlpha = 1; }
  if (LM && LM.pz && !LM.fin) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-3, -3, 106, 66); x.fillStyle = '#fff'; x.font = '900 6px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(LM.htP ? T('DEVRE ARASI') : '❚❚', 50, 30); }
}
function lsClock() { const m = LM; if (!m) return ''; if (m.fin) return T('MS'); if (m.htP) return T('İY'); const c = m.clk; return c > 90 ? `90+${Math.min(m.xt || 2, Math.ceil(c - 90))}'` : c > 45 && !m.ht ? `45+'` : `${Math.max(1, Math.ceil(c))}'`; }
function lsScoreTxt() { const sc = lsSc(), i = LM.info; return i.home ? `${sc[0]} – ${sc[1]}` : `${sc[1]} – ${sc[0]}`; }
function lsFeed() {
  const m = LM, L0 = m.log.filter(x => x.m === 0 || x.m < m.clk || m.fin).slice(0, 12);
  return L0.map(x => `<div class="fi ${x.k}"><b>${x.m}'</b> ${esc(T(x.t))}</div>`).join('') || '<div class="fi mut">Maç başlamak üzere.</div>';
}
function lsStats() {
  const S6 = LS; if (!S6) return ''; const C = g.coach, c = club(C.id), st = S6.st, tp = st.pos[0] + st.pos[1] || 1, pos = Math.round(st.pos[0] / tp * 100);
  const row = (n, a, b) => { const t = a + b || 1; return `<div class="lsr"><b>${a}</b><div class="lsb"><i style="width:${a / t * 100}%;background:${c.c1}"></i><i style="width:${b / t * 100}%"></i></div><b>${b}</b><span>${n}</span></div>`; };
  return `<div class="lsr"><b>${pos}%</b><div class="lsb"><i style="width:${pos}%;background:${c.c1}"></i><i style="width:${100 - pos}%"></i></div><b>${100 - pos}%</b><span>${T('Topla oynama')}</span></div>${row(T('Şut'), st.sh[0], st.sh[1])}${row(T('İsabetli şut'), st.on[0], st.on[1])}${row(T('Korner'), st.kor[0], st.kor[1])}`;
}
let LSF = -1;
function lsUI(force) {
  const S6 = LS; if (!S6 || !LM) return; const now = performance.now(); if (!force && now - S6.ui < 250) return; S6.ui = now;
  const set = (id, v, html) => { const el = document.getElementById(id); if (el) { if (html) { if (el._v !== v) { el.innerHTML = v; el._v = v; } } else if (el.textContent !== v) el.textContent = v; } };
  set('lm6clk', lsClock()); set('lm6sc', lsScoreTxt()); set('lm6st', lsStats(), 1);
  const m = LM, vis = m.log.filter(x => x.m === 0 || x.m < m.clk).length;
  if (vis !== LSF || force) {
    const nw = m.log.filter(x => x.m === 0 || x.m < m.clk).slice(0, Math.max(0, vis - Math.max(0, LSF)));
    if (LSF >= 0) nw.forEach(x => { const t = x.t || ''; if (t.includes('🟥')) { lsVoice('red', 2, 0); const side = t.includes('Rakipten') ? 1 : 0, q = LS.P.filter(p => p.side === side && !p.off && !p.gk && p !== LS.b.own)[0]; if (q) q.off = 1; } else if (t.includes('🟨')) lsVoice('card', 1, 1); else if (t.includes('🚑') && m.injP) { m.pz = 1; m.injW = 1; setTimeout(draw, 0); } else if (t.includes('🔁')) lsVoice('sub', 1); });
    LSF = vis; set('lm6feed', lsFeed(), 1); const fe = document.getElementById('lm6feed'); if (fe && typeof i18nApply === 'function') i18nApply(fe);
    const mo = document.getElementById('lm6mom'); if (mo) mo.style.left = (50 + (m.mom || 0)) + '%';
  }
}
function lsLoop(ts) {
  const S6 = LS; if (!S6) return; S6.raf = 0;
  if (!LM || !LM.auto || scr !== 'lmatch') return;
  const now = ts || performance.now(), dt = S6.last ? Math.min(.05, (now - S6.last) / 1000) : .016; S6.last = now;
  try { lsTick(dt); lsRender(); lsUI(); } catch (e) { console.error(e); }
  S6.raf = requestAnimationFrame(lsLoop);
}
function lsEnsure() { if (LS && !LS.raf && LM && LM.auto && scr === 'lmatch' && typeof requestAnimationFrame === 'function' && document.getElementById('lm6cv')) { LS.last = 0; LS.raf = requestAnimationFrame(lsLoop); } }
/* --- simülasyonun ham 15 dk'lık adımı (eski animasyonsuz) --- */
const _lmSegRaw = lmSeg;
const _lmStart6 = lmStart;
lmStart = function () {
  _lmStart6(); if (!LM) return; const m = LM;
  m.auto = 1; m.noAnim = 1; m.clk = 0; m.gi = 0; m.spd = (acct && acct().lmSpd != null) ? acct().lmSpd : 1; m.xt = R(1, 4); m.pz = 0; m.ht = 0; m.htP = 0; m.fin = 0; LSF = -1;
  LS = lsNew(); lsKick(0, .9); try { crowdLvl(.12); } catch (e) { }
  draw();
};
function lmPause() { if (!LM || LM.fin) return; if (LM.htP) return lmHalfGo(); if (LM.injW && LM.injP) return toast('Önce sakatlanan oyuncunun yerine birini al'); LM.pz = LM.pz ? 0 : 1; LM.injW = 0; draw(); }
function lmSpeed(i) { if (!LM) return; LM.spd = i; try { acct().lmSpd = i; acctSave(); } catch (e) { } draw(); }
function lmHalfGo() { const m = LM; if (!m || !m.htP) return; m.htP = 0; m.pz = 0; if (LS) { lsKick(1, 1.6); } try { sfx('whistle', 1); crowdLvl(.12); } catch (e) { } lsVoice('kickoff', 2, 0); draw(); }
function lmToEnd() {
  const m = LM; if (!m || m.fin) return; if (!m.ht) { m.ht = 1; m.htP = 0; }
  let k = 0; while (!m.res && k++ < 8) { if (m.injP) { const bn = lmBench()[0]; if (bn) { m.out = m.injP; lmSub(bn.id); } else m.injP = null; } m.noAnim = 1; _lmSegRaw(); }
  m.clk = 90 + (m.xt || 2); m.gi = m.ev.length; m.fin = 1; m.pz = 0; try { crowdLvl(0); sfx('whistle', 1); } catch (e) { } draw();
}
lmSimAll = function () { if (LM && LM.auto) return lmToEnd(); const m = LM; let k = 0; while (m && !m.res && k++ < 8) { if (m.injP) { const b = lmBench()[0]; if (b) { m.out = m.injP; lmSub(b.id); } else m.injP = null; } m.noAnim = 1; _lmSegRaw(); } };
const _lmSub6 = lmSub;
lmSub = function (inId) {
  const m = LM, outId = m && m.out; const n0 = m ? m.subs : 0; _lmSub6(inId); if (!m || m.subs === n0) return;
  if (m.auto) { if (m.log[0] && String(m.log[0].t).startsWith('🔁')) m.log[0].m = Math.max(1, Math.floor(m.clk)); if (LS) { const d = LS.P.find(p => p.side === 0 && p.id === outId), q = (g.sq[g.coach.id] || []).find(p => p.id === inId); if (d && q) { d.id = q.id; d.num = q.num || d.num; d.n = short(pname(q)); } } if (!m.injP) m.injW = 0; lsVoice('sub', 1, 0); }
};
const _lmDone6 = lmDone;
lmDone = function () { if (LS && LS.raf) { try { cancelAnimationFrame(LS.raf); } catch (e) { } } LS = null; try { crowdLvl(0); } catch (e) { } return _lmDone6(); };
const _lmatchUI6 = lmatchUI;
lmatchUI = function () {
  const m = LM; if (!m || !m.auto) return _lmatchUI6();
  if (!LS) { LS = lsNew(); lsKick(0, .5); }
  const i = m.info, C = g.coach, us = clubName(club(C.id).n), w = WX[i.wx || 'acik'];
  let h = `<div class="sb"><div class="sbc">${esc(i.comp)} · ${esc(i.round)} · ${w.i} ${w.n}</div><div class="sbr"><span class="tm">${clubKit(C.id)}${esc(i.home ? us : i.on)}</span><b class="sc" id="lm6sc">${lsScoreTxt()}</b><span class="tm r">${esc(i.home ? i.on : us)}</span></div><div class="sbc"><span class="lm6clk" id="lm6clk">${lsClock()}</span>${m.fin && m.res && m.res.pens ? ` · pen. ${m.res.pens[0]}-${m.res.pens[1]}` : ''}</div></div>`;
  h += `<div class="card lm6"><canvas id="lm6cv"></canvas>${m.fin ? '' : `<div class="lm6c"><button class="btn ${m.pz ? '' : 'ghost'} sm" onclick="lmPause()">${m.htP ? '▶ 2. yarı' : m.pz ? '▶ Devam' : '❚❚ Durdur'}</button><div class="tseg sm">${LSPN.map((n, k) => `<button class="${(m.spd == null ? 1 : m.spd) === k ? 'on' : ''}" onclick="lmSpeed(${k})">${n}</button>`).join('')}</div><button class="btn ghost sm" onclick="lmToEnd()">⏭ Sonuç</button></div>`}
  <div class="prow"><span>Momentum</span><div class="mom"><i id="lm6mom" style="left:${50 + (m.mom || 0)}%"></i></div><b>${m.mom > 8 ? 'Siz' : m.mom < -8 ? 'Rakip' : '—'}</b></div><div class="lm6st" id="lm6st">${lsStats()}</div></div>`;
  if (m.fin) {
    h += `<div class="card"><p class="lead">${m.res.win ? 'Kazandınız!' : m.res.draw ? 'Berabere.' : 'Kaybettiniz.'}</p><button class="btn big" onclick="lmDone()">Devam</button></div>`;
    return h + `<div class="feed" id="lm6feed">${lsFeed()}</div>`;
  }
  let c = '';
  if (m.htP) {
    c += `<div class="eyebrow gold">Devre arası · ${lsScoreTxt()}</div>`;
    if (!m.talked) c += `<div class="opts"><button class="opt" onclick="lmTalk('motive')"><b>Motive et</b><span>Genelde işe yarar</span></button><button class="opt" onclick="lmTalk('sakin')"><b>Sakin kal, plana güven</b><span>Küçük ama güvenli etki</span></button><button class="opt" onclick="lmTalk('sert')"><b>Sert eleştir</b><span>Büyük etki ya da ters tepki</span></button></div>`;
    else if (m.talk) c += `<p class="m note">${esc(m.talk)}</p>`;
  }
  if (m.injW && m.injP) c += `<div class="warn">🚑 Sakatlık! Oyun durdu: yedeklerden birini oyuna al.</div>`;
  c += `<div class="eyebrow">Kenardan talimat ${m.shout ? '· ' + SHOUT[m.shout].n : '<span class="m">(sıradaki 15 dk)</span>'}</div><div class="chips">${Object.entries(SHOUT).map(([k, s]) => `<button class="chip ${m.shout === k ? 'on' : ''} ${m.shout && m.shout !== k ? 'dis' : ''}" onclick="lmShout('${k}')">${s.n}</button>`).join('')}</div>`;
  c += `<div class="eyebrow">Oyun anlayışı</div><div class="chips">${Object.entries(TACT).map(([k, t]) => `<button class="chip ${m.tac === k ? 'on' : ''}" onclick="lmTac('${k}')">${t.n}</button>`).join('')}</div>`;
  const p = plan6();
  c += segRow('Pres', p.pres, [[0, 'Düşük'], [1, 'Normal'], [2, 'Yüksek']], "setPlan('pres',") + segRow('Savunma hattı', p.hat, [['derin', 'Derin'], ['orta', 'Normal'], ['yuksek', 'Yüksek']], "setPlan('hat',") + segRow('Tempo', p.tempo, [[0, 'Yavaş'], [1, 'Normal'], [2, 'Hızlı']], "setPlan6('tempo',");
  const injNow = m.injW && m.injP; if (injNow && !m.out) m.out = m.injP;
  if (!m.showSubs && !injNow) c += `<button class="btn ghost" onclick="LM.showSubs=1;draw()">🔁 Oyuncu değişikliği (${m.subs}/${m.maxS})</button>`;
  else c += `<div class="eyebrow">Oyuncu değişikliği · ${m.subs}/${m.maxS}</div><div class="sq">${lmOn().map(q => `<div class="sqr ${m.out === q.id ? 'inxi' : ''}"><span class="sqp p-${q.p}">${q.p}</span><span class="sqn">${esc(pname(q))}${injNow && q.id === m.injP ? ' <span class="neg">🚑</span>' : ''}</span><b class="sqr-r">${q.r}</b><span class="sqa"><button class="mini" onclick="lmOut(${q.id})">${m.out === q.id ? '✓' : '⇄'}</button></span></div>`).join('')}</div>${m.out ? `<div class="m">Yerine girecek:</div><div class="chips">${lmBench().map(q => `<button class="chip" onclick="lmSub(${q.id})">${q.p} ${esc(short(pname(q)))} ${q.r}</button>`).join('') || '<span class="m">Yedek yok</span>'}</div>` : ''}${injNow ? '' : '<button class="lnk" onclick="LM.showSubs=0;LM.out=null;draw()">Kapat</button>'}`;
  if (m.htP) c += `<button class="btn big" onclick="lmHalfGo()">İkinci yarıyı başlat</button>`;
  else if (m.injW && !m.injP) c += `<button class="btn big" onclick="lmPause()">▶ Oyuna devam</button>`;
  return h + `<div class="card">${c}</div><div class="feed" id="lm6feed">${lsFeed()}</div>`;
};
const _draw6 = draw;
draw = function () { _draw6(); if (scr === 'lmatch' && LM && LM.auto) { lsUI(1); lsRender(); lsEnsure(); } };
document.addEventListener && document.addEventListener('visibilitychange', () => { if (document.hidden && LM && LM.auto && !LM.fin && !LM.pz) { LM.pz = 1; try { draw(); } catch (e) { } } });

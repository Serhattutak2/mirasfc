// Miras FC v2 başsız test botu: rastgele kararlarla tam hayatlar oynar, hataları ve dengeyi raporlar.
// Kullanım: node tools/sim.js index.html 50
const fs = require('fs'), vm = require('vm');
const [, , file, N0] = process.argv, N = +N0 || 50;
const html = fs.readFileSync(file, 'utf8'), code = html.split('<script>')[1].split('</script>')[0];
const els = {}, store = {};
const el = id => els[id] || (els[id] = { id, innerHTML: '', value: '', textContent: '', hidden: true, querySelector: () => ({ textContent: '', hidden: true, value: '', focus() { } }), getContext: () => null, parentElement: { clientWidth: 360 }, style: {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) });
const ctx = {
  document: { getElementById: el, createElement: () => el('x' + Math.random()), body: { appendChild() { } }, documentElement: { style: { setProperty() { } } } }, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  window: { scrollTo() { }, devicePixelRatio: 1, addEventListener() { } }, requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, performance: { now: () => 0 }, navigator: { clipboard: { writeText: () => Promise.resolve() } },
  setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0, clearInterval: () => 0, console, Math, JSON,
};
vm.createContext(ctx); if (process.env.BOTSMART) ctx.BOTSMART = 1;
vm.runInContext(code.replace(/\nmenu\(\);\n$/, '\n'), ctx);
vm.runInContext('ask=(m,f)=>f(); askText=(m,d,f)=>f("Test"); sceneStart=()=>{}; draw0=draw; draw=()=>{ drawInner(); };', ctx);
/* MFC_EN=1: ekrana çizilen her metni topla, sonda İngilizce çevirisi Türkçe kalanları raporla */
const SEGS = new Set();
if (process.env.MFC_EN) {
  ctx.__seg = h => { String(h).split(/<[^>]*>/).forEach(t => { t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); if (t.length > 1 && SEGS.size < 400000) SEGS.add(t); }); };
  vm.runInContext('const __di = drawInner; drawInner = function () { const r = __di.apply(this, arguments); __seg($("app").innerHTML); __seg($("nav").innerHTML); return r; }; const __to = toast; toast = function (t) { __seg(String(t)); return __to(t); }; const __ask = ask; ask = function (m, f) { __seg(String(m)); return __ask(m, f); };', ctx);
  process.on('exit', () => {
    vm.runInContext('LANG="en"', ctx); const TRW = /[çğışöüÇĞİŞÖÜâ]|\b(ve|bir|için|yıl|sen|ile|daha|gibi|kulüp|maç|hafta|olarak|değil|var|yok|sezon|takım|oyuncu|yaş|seni|senin|onu|bu|çok)\b/;
    const miss = new Map();
    for (const t of SEGS) { const o = ctx.tr1(t); if (TRW.test(o)) { const k = o.slice(0, 220); miss.set(k, (miss.get(k) || 0) + 1); } }
    fs.writeFileSync(process.env.MFC_EN, [...miss.keys()].join('\n')); console.error('i18n: segs', SEGS.size, 'turkish-looking', miss.size);
  });
}
const R2 = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const E = s => vm.runInContext(s, ctx), pick = a => a[Math.floor(Math.random() * a.length)], rnd = Math.random;
const CT = ['Türkiye', 'İngiltere', 'Almanya', 'İspanya', 'İtalya', 'Fransa', 'Brezilya', 'Arjantin'];
const st = { lives: 0, pro: 0, maxOvr: [], pot: [], ap: 0, g: 0, titles: 0, cups: 0, ec: 0, wc: 0, nt: 0, own: 0, coach: 0, coachSeasons: 0, heirs: 0, scenes: 0, sceneGoals: 0, sceneTypes: {}, sceneEnds: {}, err: [], mp: [], save: 0, ages: [], firstClubTier: {}, roles16: {}, goalsPerApp: [], nego: { ok: 0, gone: 0 }, money: [] };
function checkNum(o, p, d = 0) { if (d > 7) return; for (const k in o) { const v = o[k]; if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('NaN/Inf: ' + p + '.' + k); else if (typeof v === 'function') throw new Error('fonksiyon kayıtta: ' + p + '.' + k); else if (v && typeof v === 'object' && k !== 'w') checkNum(v, p + '.' + k, d + 1); } }
/* Fizik sahnesini bot oyna: kaydırma yerine doğrudan vuruş */
function playScene() {
  st.scenes++; const t = E('S.type'); st.sceneTypes[t] = (st.sceneTypes[t] || 0) + 1; const g0 = E('M.sc[0]');
  for (let i = 0; i < 3000; i++) {
    const ph = E('S && S.phase'); if (!ph) break;
    if (ph === 'done') { const b = E('S.banner.t'); st.sceneEnds[b] = (st.sceneEnds[b] || 0) + 1; E('sceneContinue()'); break; }
    if (['draw', 'icpt', 'meter', 'tap'].includes(ph) && rnd() < .6) E('botMove()'); else E('step(0.05)');
  }
  if (E('S')) { st.sceneEnds.ZAMAN = (st.sceneEnds.ZAMAN || 0) + 1; E('endScene({t:"ZAMAN",s:""},0)'); E('sceneContinue()'); }
  if (E('M.sc[0]') > g0) st.sceneGoals++;
}
function botWeek() {
  if (!E('g.wstage')) { if (rnd() < .3) { E('simWeeks(4)'); return; } E('weekGo()'); return; }
  const m = E('!!(g.ev?null:nextWeekMatch())');
  if (m) {
    if (rnd() < .12) { E('playMatch()'); let k = 0; while (E("scr==='match'") && k++ < 80) { if (E("M.stage==='post'")) { E('matchDone()'); break; } if (rnd() < .7 && E('M.mi<M.mom.length')) { E('nextMoment()'); if (E('!!S')) playScene(); } else E('simRest()'); } }
    else E('quickWeekMatch()');
  } else if (!E('!!g.ev')) E('weekEnd()');
}
function randomUI() {
  for (const t of ['home', 'en', 'fix', 'car', 'life', 'fin', 'own', 'coach', 'leg']) if (rnd() < .02) E(`tab='${t}';FIXV='${pick(['cal', 'lg', 'cup', 'eu'])}';FINV='${pick(['ozet', 'port', 'emlak', 'sirket', 'spons', 'kulup'])}';LIFEV='${pick(['aile', 'ev', 'is', 'ben'])}';OV='${pick(['ozet', 'kadro', 'td', 'tr', 'alt', 'stad'])}';CV2='${pick(['ozet', 'kadro', 'tak', 'ekip', 'tr', 'alt'])}';draw()`);
}
function randomLife() {
  if (rnd() < .5) { const ids = E("ACTS.filter(a=>!canAct(a)).map(a=>a.id)"); if (ids.length) E(`doAct('${pick(ids)}')`); }
  if (rnd() < .03) E(`g.routine='${pick(['Dengeli', 'Gelişim', 'Aile', 'Toparlanma'])}'`);
  if (rnd() < .02) E(`invest('${pick(['dep', 'fund', 'stock', 'crypto'])}',g.money*.2)`);
  if (rnd() < .01) E(`newBiz(${Math.floor(rnd() * 7)})`); if (rnd() < .01) E(`buyProp(${Math.floor(rnd() * 6)})`);
  if (rnd() < .02 && E('g.fin.biz.length')) E('bizUp(0)'); if (rnd() < .01 && E('g.fin.biz.length')) E('bizMk(0)');
  if (rnd() < .006 && E('!g.own && buyList().some(c=>c.p<=g.money)')) E(`buyClub(${E('buyList().find(c=>c.p<=g.money).id')})`);
  if (E('!!g.own') && rnd() < .03) { E(`ownDeposit(g.money*.1);ownTick(${Math.floor(rnd() * 3)})`); const r = rnd(); if (r < .2) E('ownMarketBuy(0)'); else if (r < .3) E('ownAcad()'); else if (r < .4) E('ownStad()'); else if (r < .5) E('ownHire(0)'); else if (r < .6 && E('(g.youth[g.own.id]||[]).length')) E('ownPromote(g.youth[g.own.id][0].id)'); else if (r < .7) E('(g.sq[g.own.id]||[]).length&&ownSell(g.sq[g.own.id][R(0,g.sq[g.own.id].length-1)].id)'); else if (r < .75) E('ownWithdraw(g.own.bud*.1)'); if (E('g.own && g.own.spOf && !g.own.sp')) E('ownSponsor(0)'); }
  if (rnd() < .01 && E('g.sponsOf && g.sponsOf.length')) E('signSpons(0)');
  if (rnd() < .01 && E('!!g.fam.partner')) E('trip()'); if (rnd() < .005 && E('g.fam.partner && g.fam.partner.st==="sevgili"')) E('propose()');
  if (rnd() < .005) E(`setHouse(${Math.floor(rnd() * 9)})`); if (rnd() < .004) E(`setCar(${Math.floor(rnd() * 5)})`);
  if (rnd() < .004) E(`toggleStaff('${pick(['trainer', 'asci', 'psik', 'avukat', 'guvenlik'])}')`); if (rnd() < .003) E(`setAgent(${Math.floor(rnd() * 3)})`);
  if (rnd() < .005) E(`setLux(${Math.floor(rnd() * 3)})`);
  if (rnd() < .03 && E('g.fam.kids.length')) { E(`kidChat(${Math.floor(rnd() * E('g.fam.kids.length'))})`); if (E('!!g.kchat')) { E(`kidAnswer(${Math.floor(rnd() * 2)})`); E('kidChatClose()'); } }
  if (rnd() < .02 && E('g.agent')) E(`agentMeet('${pick(['kulup', 'zam', 'sponsor', 'medya'])}')`);
  if (rnd() < .01 && E('g.age>=20 && g.lic<4 && !g.licYr')) E('licStart()');
  if (rnd() < .01) { const J = E("Object.keys(JOBLIST).filter(k=>JOBLIST[k].if())"); if (J.length) E(`takeJob('${pick(J)}')`); }
}
for (let life = 0; life < N; life++) {
  try {
    E('nw(1)'); el('nn').value = 'Test Oyuncu'; el('nc').value = pick(CT); el('ny').value = pick(['İstanbul', 'Trabzon', 'Bursa', 'Madrid', 'London', 'Şehir']);
    E(`NC.pos='${pick(['FW', 'MF', 'DF'])}';NC.kis=${pick(["'am'", "'sa'", "'ai'", "'pa'", 'null'])};mk()`);
    st.pot.push(E('g.pot'));
    let steps = 0, heirs = 0;
    while (steps++ < 60000) {
      const s = E('scr');
      if (s === 'game') {
        if (E('g.ended && !g.heirDone')) { E('draw0()'); const he = E('JSON.stringify(hallEntry(g))'); const ho = JSON.parse(he); checkNum(ho, 'hall'); if (!ho.defter || !ho.n) throw new Error('hall: eksik özet'); if (!E('acct().hall.some(x=>x.key===' + JSON.stringify(ho.key) + ')')) throw new Error('hall: endUI kaydetmedi'); E("scr='hall';HALLX=acct().hall[0].key;drawInner();scr='game'"); if (E('$("app").innerHTML').includes('Beklenmeyen hata')) throw new Error('hall ekranı hata'); st.hall = E('acct().hall.length'); if (E('g.fam.kids.length') && heirs < 1 && rnd() < .5) { E(`inherit(${Math.floor(rnd() * E('g.fam.kids.length'))})`); heirs++; st.heirs++; continue; } break; }
        if (E('g.nameKid!=null')) E('nameKid("Test")');
        if (E('!!g.q')) { E(`answerQ(${Math.floor(rnd() * E('visOpts(msDef(g.q).c).length'))})`); continue; }
        if (E('!!g.ev')) { E(`choose(${Math.floor(rnd() * Math.max(1, E('evOptions(g.ev).length')))})`); continue; }
        if (E('!!(g.press&&g.coach)')) { E('pressAnswer(0)'); continue; }
        if (E('!!(g.cev&&g.coach)')) { E(`cevAnswer(${rnd() < .5 ? 0 : 1})`); continue; }
        if (E('!!g.cjob')) { E(`cjobAnswer(${rnd() < .3 ? 1 : 0})`); continue; }
        randomUI();
        const ph = E('g.phase');
        if (ph !== 'child' && E('g.age>=16')) randomLife();
        if (E('scr') !== 'game') continue;
        if (ph === 'child') E('childYear()');
        else if (ph === 'pro0') E("startOffers('16')");
        else if (ph === 'free') { if (rnd() < .3) E("startOffers('free')"); else E('freeWeek()'); }
        else if (ph === 'pro') { if (E('g.age>=33') && rnd() < .002) { E('retire()'); continue; } botWeek(); }
        else if (ph === 'retired') {
          if (E('g.lic>=1') && rnd() < .3) { const v = E('vacancies().map(c=>c.id)'); if (v.length) E(`applyJob(${v[0]})`); if (rnd() < .2) E(`cagSet(${Math.floor(rnd() * 3)})`); if (E('g.cof && g.cof.length')) { E('coachSign(0)'); st.coach++; continue; } }
          if (E('g.lic>=1') && rnd() < .25) { E('coachLook()'); if (E('g.cof && g.cof.length')) { E('coachSign(0)'); st.coach++; continue; } }
          if (E('!!g.own && !g.coach') && rnd() < .1) { E('ownSelfCoach()'); if (E('!!g.coach')) { st.coach++; continue; } }
          if (E('g.age>=50 && g.fam.kids.length') && rnd() < .02) { E('handOver(0)'); heirs++; st.heirs++; continue; }
          if (E('!!g.own')) { const r3 = rnd(); if (r3 < .15) E(`ceoHire(0)`); else if (r3 < .25) E(`facUp('${pick(['stad', 'train', 'med', 'scoutL', 'shop', 'acad'])}')`); else if (r3 < .3) E(`ownLoan(.1)`); else if (r3 < .33) E('ownRepay()'); else if (r3 < .38) E(`setVis('${pick(['tutumlu', 'dengeli', 'iddiali', 'altyapi'])}')`); while (E('!!g.own && (g.own.inbox||[]).length') && rnd() < .8) E(`ownAns(g.own.id,0,${R2(0, 2)})`); if (rnd() < .1 && E('!!g.own && (g.owns||[]).length')) E('switchOwn(g.owns[0].id)'); if (rnd() < .05 && E('!!g.own && (g.owns||[]).length && (g.sq[g.own.id]||[]).length')) E('grpMove(g.sq[g.own.id][0].id, g.owns[0].id)'); }
          if (E('g.money > 5000') && rnd() < .2 && E('allOwn().length<5')) { const L3 = E('buyList().filter(c=>!ownById(c.id)).map(c=>c.id)'); if (L3.length) { E(`buyClub(${L3[0]})`); st.own++; } }
          if (E('!!g.ntjOf')) { if (rnd() < .6) E('ntjSign()'); else E('ntjReject()'); }
          if (E('!!(g.ntjT && !g.ntjT.done)')) { let k2 = 0; while (E('!!(g.ntjT && !g.ntjT.done)') && k2++ < 10) E(`ntjPlay('${pick(['savunma', 'denge', 'hucum'])}')`); }
          E('retiredYear()');
        } else if (ph === 'coach') {
          const r = rnd();
          if (r < .05) E(`setTac('${pick(['hucum', 'denge', 'savunma', 'kontra', 'pres', 'topa'])}')`); else if (r < .08) E(`setForm('${pick(['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1', '4-1-4-1'])}')`);
          else if (r < .1) E(`hireStaff('${pick(['asst', 'ana', 'fiz', 'gkc', 'scout', 'genc'])}')`); else if (r < .12) E('coachBuy(0)'); else if (r < .13) E('(g.sq[g.coach.id]||[]).length&&coachSellNow(g.sq[g.coach.id][R(0,g.sq[g.coach.id].length-1)].id)');
          else if (r < .14 && E('(g.youth[g.coach.id]||[]).length')) E('coachPromote(g.youth[g.coach.id][0].id)'); else if (r < .15) E('askBudget()'); else if (r < .16) E('(g.sq[g.coach.id]||[]).length&&togOut(g.sq[g.coach.id][0].id)');
          if (rnd() < .05) E(pick([`setPlan('hat','${pick(['derin', 'orta', 'yuksek'])}')`, `setPlan('pres',${R2(0, 2)})`, `setPlan('side','${pick(['sol', 'merkez', 'sag'])}')`, `setPlan('mark',1)`])); if (rnd() < .05) E(`setTrn('${pick(['taktik', 'fizik', 'duran', 'bitir', 'savunma', 'genc'])}')`);
          if (rnd() < .04) { const q = E('(P(g.sq[g.coach.id]||[])||{}).id'); if (q) E(`pTalk(${q},'${pick(['ov', 'el', 'soz', 'kapt'])}')`); }
          if (rnd() < .03 && E('windowOpen()')) { E('trPick(0)'); if (rnd() < .5) E(`trOffer(0,${pick([.85, 1, 1.2])},${pick([1, 1.15, 1.3])})`); else E('trLoan(0)'); }
          if (!E('g.wstage')) { if (rnd() < .4) E(`coachSim(${pick([4, 60])})`); else E('cWeekGo()'); }
          else if (E('!!nextWeekMatch()')) { if (rnd() < .3) { E('lmStart()'); let k = 0; while (E('!!LM && !LM.res') && k++ < 20) { if (E('!!LM.injP')) { const b = E('(lmBench()[0]||{}).id'); E('LM.out=LM.injP'); if (b) E(`lmSub(${b})`); else E('LM.injP=null'); } if (E('LM.seg===3 && !LM.talked')) E(`lmTalk('${pick(['motive', 'sakin', 'sert'])}')`); const r2 = rnd(); if (r2 < .3) E(`lmShout('${pick(['one', 'tut', 'kanat', 'sert', 'ates'])}')`); else if (r2 < .4) E(`lmTac('${pick(['hucum', 'denge', 'savunma', 'kontra', 'pres', 'topa'])}')`); else if (r2 < .5) { const o = E('(lmOn()[3]||{}).id'), b = E('(lmBench()[0]||{}).id'); if (o && b) { E(`lmOut(${o})`); E(`lmSub(${b})`); } } if (rnd() < .1) E('lmSimAll()'); else E('lmSeg()'); } if (E('!!LM && !!LM.res')) E('lmDone()'); } else E('cmQuickBtn()'); }
          else E('coachWeekEnd()');
          if (E('g.coach') && E('g.coach.s') > 0) st.coachSeasons = Math.max(st.coachSeasons, E('g.coach.s'));
        }
      } else if (s === 'offers') {
        const kind = E('g.ofKind'), ok = E('g.of.map((o,i)=>o.gone?-1:i).filter(i=>i>=0)');
        if (ok.length && rnd() < .3 && !E(`g.of[${ok[0]}].loan`)) {
          const i = pick(ok); if (E(`g.of[${i}].loan`)) { E(`sign(${i})`); continue; }
          E(`negoOpen(${i})`); let k = 0;
          while (E("scr==='nego'") && k++ < 12) { E(`negoAdj('${pick(['sal', 'yrs', 'bonus', 'role', 'app', 'goal', 'rel', 'house', 'car', 'img', 'loyal'])}',${pick([1, 1, 2, -1])})`); E(`negoSubmit(${rnd() < .4 ? 1 : 0})`); const d = E('g.nego && g.nego.done'); if (d === 1) { st.nego.ok++; E('negoSign()'); break; } if (d === -1) { st.nego.gone++; E('negoLeave()'); break; } }
          if (E("scr==='nego'")) E('negoLeave()');
          continue;
        }
        if (ok.length && (kind !== 'win' || rnd() < .4)) { const i = pick(ok); if (kind === '16') { const o = E(`g.of[${i}]`); st.firstClubTier[o.t] = (st.firstClubTier[o.t] || 0) + 1; st.roles16[o.role] = (st.roles16[o.role] || 0) + 1; } E(`sign(${i})`); }
        else E('declineOffers()');
      } else if (s === 'nego') E('negoLeave()');
      else if (s === 'num') { const n = E('g.num') || 0; if (rnd() < .3) E(`pickNum(${pick([9, 10, 7, 11])},1)`); if (E("scr==='num'")) E('pickNum(freeNum(g.sq[g.club.id], g.pos))'); }
      else if (s === 'season') { if (E('busy()')) { if (E('!!g.ev')) E('choose(0)'); else if (E('!!g.press')) E('pressAnswer(0)'); else if (E('!!g.cjob')) E('cjobAnswer(0)'); else if (E('!!(g.cev&&g.coach)')) E('cevAnswer(0)'); else if (E('!!g.q')) E('answerQ(0)'); } else E('seasonCont()'); }
      else if (s === 'tourinv') E(`tourAccept(${rnd() < .8 ? 1 : 0})`);
      else if (s === 'tour') { if (E('!!tourInfo()')) { if (rnd() < .3) { E('playTour()'); E('simRest()'); E('matchDone()'); } else E('quickTour()'); } else E('tourEnd()'); }
      else if (s === 'match') { if (E("M.stage==='post'")) E('matchDone()'); else E('simRest()'); }
      else if (s === 'cmatch') { if (E('CM.h===1')) E('cmSecond()'); E('cmDone()'); }
      else throw new Error('bilinmeyen ekran ' + s);
      if (steps % 300 === 0) { checkNum(E('g'), 'g'); E('draw0()'); if (E('$("app").innerHTML').includes('Beklenmeyen hata')) throw new Error('draw hata: ' + E('$("app").innerHTML').slice(0, 300)); }
    }
    if (steps >= 60000) throw new Error('adım sınırı: ' + E('JSON.stringify({ev:g.ev&&g.ev.id,q:!!g.q,kchat:!!g.kchat,cev:g.cev,press:g.press,cjob:!!g.cjob,cof:(g.cof||[]).length,nego:!!g.nego,coach:!!g.coach,season:g.season})') + ' yaş ' + E('g.age') + ' faz ' + E('g.phase') + ' ekran ' + E('scr') + ' hafta ' + E('g.week') + ' wstage ' + E('g.wstage'));
    E('draw()'); const g = E('g'); checkNum(g, 'g');
    st.lives++; if (g.hist.length) st.pro++; st.maxOvr.push(g.peak || 0); st.ap += g.car.ap; st.g += g.car.g; st.titles += g.car.t; st.cups += g.car.cup; st.ec += g.car.ec; st.wc += g.ntw.wc; st.nt += g.nat.caps;
    if (g.own || g.oh) st.own++; st.mp.push(E('mp()')); st.ages.push(g.age); st.save = Math.max(st.save, (store.mfc2_1 || '').length); st.money.push(Math.round(E('wealth()')));
    if (g.car.ap > 50) st.goalsPerApp.push(+(g.car.g / g.car.ap).toFixed(2) + g.pos);
    if (g.hist.length) st.careers = (st.careers || []).concat([`${g.pos} ${g.arc} peak${g.peak} pot${g.pot} ap${g.car.ap} g${g.car.g} lig${g.car.t} kupa${g.car.cup} milli${g.nat.caps} kulüp:${g.hist.map(h => E(`clubName(${JSON.stringify(h.n)})`) + '(' + h.t + ')').join('>')} mp${E('mp()')}`]);
  } catch (e) { st.err.push(String(e.message) + ' @ ' + String(e.stack).split('\n').filter(l => l.includes('evalmachine')).slice(0, 3).join(' | ') + ' yaş ' + E('g&&g.age') + ' faz ' + E('g&&g.phase') + ' ekran ' + E('scr')); }
}
const srt = a => a.sort((x, y) => x - y), med = a => srt(a)[a.length >> 1];
console.log(JSON.stringify({ ...st, pot: { min: Math.min(...st.pot), med: med(st.pot), max: Math.max(...st.pot) }, maxOvr: { min: Math.min(...st.maxOvr), med: med(st.maxOvr), max: Math.max(...st.maxOvr) }, mp: { med: med(st.mp), max: Math.max(...st.mp) }, money: { med: med(st.money), max: Math.max(...st.money) }, ages: { med: med(st.ages) }, goalsPerApp: st.goalsPerApp.slice(0, 12), careers: (st.careers || []).slice(0, 10), err: st.err.length, errSample: [...new Set(st.err)].slice(0, 8) }, null, 1));

/* ============================================================
   MİRAS FC — v4.1 · Spiker yalnızca maçta, yalnızca erkek spiker sesi
   - Cihazın konuşma motoru (iPhone'da kadın sesi "Yelda") ARTIK HİÇ
     kullanılmaz. Sadece voxdata.js'teki erkek spiker replikleri çalar.
   - Spiker yalnızca maç ekranında (oyuncu sahnesi / TD canlı maç) konuşur;
     menü, ödül töreni, hızlı sonuçlar sessizdir.
   - iPhone: ses bağlamı askıdaysa önce uyandırılır, sonra çalar
     (eski sürüm bu durumda cihaz sesine düşüyordu). Uygulamada
     AVAudioSession "playback" (AppDelegate) → sessiz modda da duyulur.
   ============================================================ */
speak = function () { };
try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
const inMatch = () => typeof scr !== 'undefined' && ((scr === 'match' && typeof M !== 'undefined' && M && M.plays !== false) || scr === 'lmatch');
function vxPlay(k, pri, force) {
  if (!setOf('voice') || (!force && !inMatch())) return;
  const D = typeof VOXDATA !== 'undefined' ? VOXDATA[LANG === 'en' ? 'en' : 'tr'] : null, L = D && D[k]; if (!L) return;
  if (!SND.ctx) { try { sndInit(); } catch (e) { } } if (!SND.ctx) return;
  pri = pri == null ? 1 : pri;
  if (VX.cur && pri < VX.curPri) return; if (VX.cur && pri <= VX.curPri && pri < 2) return;
  let i = Math.floor(Math.random() * L.length); if (L.length > 1 && i === VX.last[k]) i = (i + 1) % L.length; VX.last[k] = i;
  const t0 = Date.now();
  const go = () => vxDecode(k, i).then(b => {
    if (!b || !setOf('voice') || Date.now() - t0 > 2500) return;
    try { if (VX.cur) { try { VX.cur.stop(); } catch (e) { } } const s = SND.ctx.createBufferSource(), gn = SND.ctx.createGain(); gn.gain.value = 1.4; s.buffer = b; s.connect(gn); gn.connect(SND.master); s.start(); VX.cur = s; VX.curPri = pri; s.onended = () => { if (VX.cur === s) { VX.cur = null; VX.curPri = -1; } }; } catch (e) { }
  });
  if (SND.ctx.state !== 'running') { try { SND.ctx.resume().then(go, () => { }); } catch (e) { } } else go();
}
voiceSay = function (k, txt, pri) { vxPlay(k, pri); };
/* ses denemesi: efekt + tribün; spiker maçta konuşur */
setTest = function () { audioUnlock(); setTimeout(() => { sfx('kick', 1); setTimeout(() => sfx('net'), 250); setTimeout(() => sfx('roar'), 300); vxPlay('goal', 3, 1); crowdLvl(.12); setTimeout(() => { if (!S) crowdLvl(0); }, 2500); }, 60); };
/* sesi her dokunuşta canlı tut (iOS bazen "interrupted" yapar) */
if (document.addEventListener) ['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => { try { if (SND.ctx && SND.ctx.state !== 'running' && SND.on) SND.ctx.resume(); } catch (e) { } }, { capture: true, passive: true }));
/* TD canlı maç: başlama, devre, bitiş */
if (typeof lmStart === 'function') { const _lmS = lmStart; lmStart = function () { _lmS(); try { audioUnlock(); sfx('whistle', 1); vxPlay('kickoff', 2); } catch (e) { } }; }

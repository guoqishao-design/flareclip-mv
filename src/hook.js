// hook.js: the cold open (bars 2–3, the first ~3.9 s of every cut that starts at bar 2, and of the 15 s cut).
// A hard before/after contrast: the dull, grey 3-hour stream nobody watched, then Snip slashes the frame and the
// other half bursts open in full colour: a 30-second clip with the views pouring in.
//   bar 2 beat 0  "3:00:00" slams in on a grey, washed-out stream
//   bar 2 beat 1  "0 views" stamp
//   bar 2 beat 2  Snip slashes the frame along the diagonal
//   bar 2 beat 3  the bright half slides open: the clip, "0:30", hearts, the counter racing to 24.8K
//   bar 3         both halves side by side; fans pop up and cheer; the grey half sags

const DULL = { bg: '#9EA2AE', bg2: '#B8BBC4', ink: '#4A4D5A', tape: ['#7D8290', '#949AA6'] };
// draw with a washed-out palette (everything in PAL pulled toward grey), then restore
function greyed(fn, k = .82) {
  const saved = { ...PAL };
  for (const key in PAL) { if (key === 'ink') continue; const c = parseInt(PAL[key].slice(1), 16), l = Math.round(.3 * (c >> 16 & 255) + .59 * (c >> 8 & 255) + .11 * (c & 255)); PAL[key] = mixCol(PAL[key], '#' + ((1 << 24) + (l << 16) + (l << 8) + l).toString(16).slice(1), k); }
  try { fn(); } finally { Object.assign(PAL, saved); }
}
// the lonely stream: a slumped streamer at a small desk, monitor showing nobody
function lonelyDesk(S, x, y, s) {
  greyed(() => {
    paint(rrPts(x - 120, y - 300, 170, 250, 30), { wash: PAL.red, ink: PAL.ink, sw: 1 });
    streamer(x - 40, y - 60, s, { sit: true, eyes: 'tired', mouth: 'flat', slump: .8, aL: -1.2, aR: -1.2 });
    paint(rrPts(x + 30, y - 72, 420, 26, 8), { wash: PAL.wood, ink: PAL.ink, sw: 1 });
    monitor(x + 260, y - 72, 250, 160, { live: false, viewers: 0, screen: PAL.teal, glow: 0 });
  });
}

// the split: vertical frames split top/bottom, horizontal frames left/right, along a slight diagonal
function hookRegions(off) {
  if (VERT) {
    const b = [[-300, 1030], [2220, 890]];
    return { A: [[-300, -500], [2220, -500], b[1], b[0]], B: [b[0], b[1], [2220, 2500], [-300, 2500]].map(([x, y]) => [x, y + off]), line: b };
  }
  const b = [[1030, -300], [890, 2220]];
  return { A: [[-500, -300], b[0], b[1], [-500, 2220]], B: [b[0], [2500, -300], [2500, 2220], b[1]].map(([x, y]) => [x + off, y]), line: b };
}

shot(barAt(2), barAt(4), (S, lt, dur) => {
  const b0 = BB(2, 0), b1 = BB(2, 1), b2 = BB(2, 2), b3 = BB(2, 3), c0 = BB(3, 0), c2 = BB(3, 2);
  const shake = shakeXY(S, 16 * Math.exp(-(S - b1) * 9) * (S > b1) + 22 * Math.exp(-(S - b2) * 9) * (S > b2));
  camBegin(960 + shake[0], 960 + shake[1], kf(lt, [[0, 1.08], [dur, 1.0]]));
  const open = easeOut(seg(S, b2 + .05, b3 + .1)), R = hookRegions((1 - open) * 1400);
  const Bc = VERT ? [930, 1410] : [1450, 960];
  frameWash(DULL.bg);
  if (open > 0) {
    paint(R.B, { wash: PAL.gold, ink: null });
    // sunburst rays inside B
    push(); if (VERT) translate(0, (1 - open) * 1400); else translate((1 - open) * 1400, 0);
    for (let i = 0; i < 16; i += 2) {
      const a0 = S * .25 + i / 16 * TAU, a1 = a0 + TAU / 16, L = 1400;
      paint([[Bc[0], Bc[1]], [Bc[0] + Math.cos(a0) * L, Bc[1] + Math.sin(a0) * L], [Bc[0] + Math.cos(a1) * L, Bc[1] + Math.sin(a1) * L]], { wash: PAL.rose, washOp: 170, ink: null });
    }
    pop();
  }
  // ----- A: the dull half (fills the whole frame until the slash) -----
  const areaA = open > 0 ? R.A : rectPts(...viewRect());
  paint(areaA, { wash: DULL.bg, ink: null });
  paint(areaA, { fill: DULL.bg2, fillOp: 120, bleed: .3, tex: .8, border: .2, ink: null });
  const A = VERT ? { tx: 960, ty: 330, lab: [960, 170], st: [1210, 470], tape: [[380, 520], [700, 480], [1000, 560], [1300, 500], [1560, 600]], zz: [860, 700], desk: [800, 960] }
    : { tx: 480, ty: 690, lab: [480, 545], st: [700, 1110], tape: [[40, 860], [260, 820], [500, 890], [740, 830], [980, 910]], zz: [330, 1200], desk: [290, 1450] };
  const scroll = frac(S * .6);
  tape(A.tape.map(([x, y]) => [x - scroll * 60, y]), 90, { tint: f => mixCol(DULL.tape[0], DULL.tape[1], hash(Math.floor(f * 14 + scroll * 14))) });
  // the empty house (only visible until the bright half slides over it): grey seats, a tumbleweed rolling past
  if (open < 1) {
    greyed(() => seats(VERT ? 960 : 1440, VERT ? 1330 : 880, VERT ? 6 : 5, 3, 0, S), .9);
    const tx = VERT ? lerp(1500, 420, frac(S * .3)) : lerp(1900, 1000, frac(S * .3)), ty = VERT ? 1250 : 820;
    tumbleweed(tx, ty - Math.abs(Math.sin(S * 5)) * 30, 46, -S * 6);
  }
  lonelyDesk(S, A.desk[0], A.desk[1], 13);
  letter('3 HOURS LIVE', A.lab[0], A.lab[1], 64, DULL.ink, { font: '700 64px "Fredoka"', shadow: false, alpha: .9 });
  letter('3:00:00', A.tx, A.ty, 190, DULL.ink, { font: '700 190px "Fredoka"', shadow: false, pop: .35 + .8 * seg(S, b0 - .05, b0 + .2) });
  if (S > b1) {
    const k = seg(S, b1, b1 + .18), sc = lerp(2.2, 1, easeOut(k));
    push(); translate(A.st[0], A.st[1]); rotate(-.18); scale(sc);
    paint(rrPts(-210, -70, 420, 140, 26), { ink: PAL.red, sw: 2.6 });
    pop();
    letter('0 views', A.st[0], A.st[1], 92 * sc, PAL.red, { font: `700 ${Math.round(92 * sc)}px "Fredoka"`, rot: -.18, shadow: false, alpha: k });
  }
  letter('z', A.zz[0] + frac(S * .5) * 40, A.zz[1] - frac(S * .5) * 90, 50 + 30 * frac(S * .5), DULL.ink, { font: '700 50px "Fredoka"', shadow: false, alpha: 1 - frac(S * .5) });

  if (open > 0) {
    // the clip on a phone, with hearts spraying out
    const pk = backOut(seg(S, b3 - .05, b3 + .3));
    if (pk > .02) {
      clipCard(Bc[0], Bc[1] + (VERT ? 20 : 0), 560 * pk, -.05, { glow: 1, words: seg(S, c0, c0 + 1.2), play: true, track: true, bg: PAL.sky });
      for (let i = 0; i < 12; i++) {
        const t0 = b3 + i * BEAT * .25, a = S - t0; if (a < 0 || a > 1.6) continue;
        const ang = -Math.PI / 2 + (hash(i) - .5) * 2.2, d = 180 + a * 520;
        paint(heartPts(Bc[0] + Math.cos(ang) * d * .9, Bc[1] - 120 + Math.sin(ang) * d * .7, 26 + 16 * hash(i + 3)), { wash: [PAL.red, PAL.rose, PAL.flame][i % 3], washOp: 255 * (1 - seg(a, 1.1, 1.6)), ink: PAL.ink, sw: .9 });
      }
      const views = Math.round(24800 * easeOut(seg(S, b3 + .1, c2)));
      const cnt = views >= 1000 ? (views / 1000).toFixed(1) + 'K' : String(views);
      const lx = VERT ? 930 : Bc[0], ly = VERT ? 1630 : 1340, ty = VERT ? 1120 : 540;
      letter('30 SECONDS', lx, ty, 70, PAL.ink, { font: '700 70px "Fredoka"', shadow: false, stroke: PAL.cream, pop: seg(S, b3, b3 + .2) * 1.1 });
      paint(rrPts(lx - 230, ly - 62, 460, 124, 62), { wash: PAL.cream, ink: PAL.ink, sw: 1.4 });
      paint(heartPts(lx - 150, ly, 34 * (1 + .3 * pulse(REAL_S, 5))), { wash: PAL.red, ink: PAL.ink, sw: .9 });
      letter(cnt, lx + 40, ly + 2, 80 * (1 + .08 * pulse(REAL_S, 6)), PAL.red, { font: '700 80px "Fredoka"', shadow: false });
      letter('ILLUSTRATIVE VIEWS', lx, ly + 92, 30, PAL.ink, { font: '600 30px "Fredoka"', shadow: false, stroke: PAL.cream });
    }
    // fans popping up along the bright edge
    const fans = seg(S, c0, c0 + .4);
    if (fans > 0) {
      const rows = VERT ? [[510, 1770], [700, 1790], [1190, 1790], [1360, 1770]] : [[1080, 1480], [1260, 1490], [1640, 1490], [1830, 1480]];
      rows.forEach(([x, y], i) => { const k = backOut(seg(S, c0 + i * .07, c0 + i * .07 + .3)); if (k > .02) fan(x, y, 13 * k, { seed: 140 + i, aL: 1.2 + .3 * Math.sin(S * 8 + i), aR: 1.3, eyes: ['star', 'heart'][i % 2], mouth: 'open', hop: Math.abs(Math.sin((bpOf(REAL_S) + i * .3) * Math.PI)) * .6 }); });
      confetti(S, c0, 40, VERT ? [420, 900, 1080, 1000] : [950, 300, 970, 1300]);
    }
    // the slash: a bright streak along the cut line, then a clean ink edge
    const [p0, p1] = R.line, fl = 1 - seg(S, b2, b2 + .35);
    if (fl > 0) paint(limbPts([p0, p1], 60 * fl + 6, 60 * fl + 6), { wash: '#FFF8E6', ink: null });
    inkLine([p0, p1], 2.2, PAL.ink, 'ink', 0);
  }
  // Snip: bursts in from the corner and slashes on beat 2, then perches on the seam
  if (S > b1 - .15) {
    const jk = seg(S, b1 - .15, b2), from = VERT ? [1700, 300] : [1500, 200], at = [960, 960];
    const x = lerp(from[0], at[0], easeOut(jk)), y = lerp(from[1], at[1], easeOut(jk)) - Math.sin(jk * Math.PI) * 120;
    const closing = S > b2 && S < b2 + .16;
    snip(x, y + 110, 20, { eyes: 'determined', mouth: closing ? 'open' : 'grin', aL: 1.1, aR: 1.1, cutL: closing ? 0 : 1, cutR: closing ? 0 : 1, glow: .8, sq: closing ? .25 : -.15 * pulse(REAL_S, 6), rot: VERT ? -.06 : .1 });
    if (S > b2) { sparks(960, 960, S - b2, 14, 260); sfx('SNIP!', VERT ? 700 : 1180, VERT ? 800 : 700, 150, PAL.flame, S - b2, { life: .9, rot: -.12 }); }
  }
  camEnd();
});

// ---------- the CLIP IT title card (design bars 0–2; plays during the instrumental after "nobody stayed") ----------
// The sequence runs on the shot's own progress; pulses follow the real beat (REAL_S) so it stays on the music.
shot(barAt(0), barAt(2), (S, lt, dur) => {
  const p = lt / dur, beat = bpOf(REAL_S);
  camBegin(960, 960, lerp(1.06, 1.0, easeOut(p)));
  frameWash('#F7E3C4');
  const rays = 14;
  for (let i = 0; i < rays; i += 2) {
    const a0 = REAL_S * .12 + i / rays * TAU, a1 = a0 + TAU / rays;
    paint([[960, 900], [960 + Math.cos(a0) * 1600, 900 + Math.sin(a0) * 1600], [960 + Math.cos(a1) * 1600, 900 + Math.sin(a1) * 1600]], { wash: PAL.flameLt, washOp: 140, ink: null });
  }
  paint(ellPts(960, 900, 620, 520, 30), { fill: PAL.cream, fillOp: 160, bleed: .35, tex: .4, border: .1, ink: null });
  ambient(REAL_S, 'sparkle', null, 16, { col: PAL.gold });
  // the long tape runs across; Snip cuts it at 70 % and the ends fall away
  const cut = p > .7, fall = easeIn(seg(p, .7, 1)), ty = 1180, scroll = frac(lt * .8) * 100;
  if (!cut) tape([[-200 - scroll, ty], [400 - scroll, ty + 30], [960, ty], [1520 + 100 - scroll, ty - 30], [2200, ty]], 96, { labels: { every: 3, fmt: f => hms(f * 10800) } });
  else {
    tape([[-200, ty + fall * 700], [400, ty + 30 + fall * 500], [840, ty + fall * 200]], 96, { seed: 2 });
    tape([[1080, ty - fall * 200], [1520, ty - 30 + fall * 500], [2200, ty + fall * 700]], 96, { seed: 9 });
    clipCard(960, lerp(ty, 1030, easeOut(seg(p, .7, .85))), 300 * backOut(seg(p, .7, .82)), 0, { glow: 1, play: true, bg: PAL.sky });
  }
  // title letters, one per step
  const TS = VERT ? 190 : 250, word = 'CLIP IT!', font = `400 ${TS}px "Permanent Marker"`, W = textW(word, font), n = Math.floor(seg(p, .02, .42) * word.length + .999);
  let x = 960 - W / 2;
  for (let i = 0; i < word.length; i++) {
    const cw = textW(word[i], font);
    if (i < n && word[i] !== ' ') {
      const t0 = .02 + i / word.length * .4, k = seg(p, t0, t0 + .06);
      letter(word[i], x + cw / 2, 640 + 8 * Math.sin(beat * Math.PI + i), TS * (1 + .06 * pulse(REAL_S, 5)), [PAL.flame, PAL.rose, PAL.gold, PAL.flame, PAL.teal, PAL.flame, PAL.rose, PAL.gold][i], { font, shadow: false, stroke: PAL.ink, pop: k * 1.15, rot: (hash(i) - .5) * .2 });
    }
    x += cw;
  }
  const sub = seg(p, .45, .55);
  if (sub > 0) letter('a FlareClip song', 960, 820, 64, PAL.ink, { font: '600 64px "Fredoka"', shadow: false, alpha: sub });
  // Snip rides the tape in, then snips
  const sx = lerp(1700, 960, easeOut(seg(p, .45, .68))), jump = Math.sin(seg(p, .45, .68) * Math.PI) * 140;
  const closing = p > .7 && p < .74;
  snip(sx, ty - 40 - jump, 17, { eyes: cut ? 'happy' : 'determined', mouth: closing ? 'open' : 'grin', aL: cut ? 1.3 : .9, aR: cut ? 1.3 : .9, cutL: closing ? 0 : 1, cutR: closing ? 0 : 1, glow: .6, flip: true });
  if (cut) { sparks(960, ty, (p - .7) * dur, 12, 220); sfx('SNIP!', 1250, 1000, 130, PAL.flame, (p - .7) * dur, { life: .9, rot: .1 }); }
  // Mochi watches from the corner
  cat(VERT ? 560 : 420, 1500, 11, { pose: 'sit', eyes: cut ? 'wide' : 'open', lookX: .7 });
  camEnd();
});

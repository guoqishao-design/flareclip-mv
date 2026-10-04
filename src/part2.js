// part2.js: the second half of the song, for the 2-minute cut and the full MV.
// Section starts (bar numbers) are estimated from the music; if a section is off, change the number here and
// everything in it moves with it (shots, lyrics). Bar n starts at barAt(n) seconds into the song.
const SEC = { day2: 30, v2: 31, ch2: 43, brk: 51, bridge: 54, build: 57, final: 61 };

// fractional bar → song time
// the seated/standing streamer's hand position (mirrors streamer() in chars.js; no slump)
function handPos(x, y, s, ang, side, sit = true) {
  const hipY = sit ? 0 : -4.6 * s, shY = hipY - 4.8 * s, shx = side * 2.0 * s, a = side > 0 ? -ang : Math.PI + ang;
  const ex = shx + Math.cos(a) * 2.2 * s, ey = shY + .3 * s + Math.sin(a) * 2.2 * s;
  return [x + ex + Math.cos(a + side * .3) * 2.0 * s, y + ey + Math.sin(a + side * .3) * 2.0 * s];
}
let _mctx = null;
function textW(str, font) { _mctx = _mctx || document.createElement('canvas').getContext('2d'); _mctx.font = font; return _mctx.measureText(str).width; }

// ---------- bar 30: the calendar flips to day 2 ----------
shot(barAt(SEC.day2), barAt(SEC.v2), (S, lt, dur) => {
  camBegin(960, 940, 1);
  frameWash('#F6E6CC');
  paint(ellPts(960, 1500, 900, 520 + 300 * easeOut(lt / dur), 30), { fill: PAL.flameLt, fillOp: 140, bleed: .3, tex: .4, border: .1, ink: null });
  const cx = 960, cy = 900, w = 520, h = 560;
  paint(rrPts(cx - w / 2, cy - h / 2, w, h, 36), { wash: PAL.cream, ink: PAL.ink, sw: 1.4 });
  paint(rrPts(cx - w / 2, cy - h / 2, w, 130, 36), { wash: PAL.red, ink: null });
  paint(rectPts(cx - w / 2, cy - h / 2 + 90, w, 40), { wash: PAL.red, ink: null });
  for (const x of [-140, 140]) paint(rrPts(cx + x - 14, cy - h / 2 - 40, 28, 90, 14), { wash: PAL.grey, ink: PAL.ink, sw: 1 });
  letter('DAY', cx, cy - h / 2 + 66, 64, PAL.cream, { font: '700 64px "Fredoka"', shadow: false });
  const flip = seg(S, BB(SEC.day2, 1), BB(SEC.day2, 2));
  letter('2', cx, cy + 70, 300, PAL.ink, { font: '700 300px "Fredoka"', shadow: false, pop: seg(S, BB(SEC.day2, 1) + BEAT * .6, BB(SEC.day2, 2) + BEAT * .2) * 1.1 });
  if (flip < 1) {   // the old page tears off and flies up
    push(); translate(cx, cy - h / 2 + 130 - flip * 500); rotate(-flip * .9);
    paint(rectPts(-w / 2, 0, w, h - 130), { wash: PAL.cream, ink: PAL.ink, sw: 1.2 });
    pop();
    if (flip === 0) letter('1', cx, cy + 70, 300, PAL.ink, { font: '700 300px "Fredoka"', shadow: false });
  }
  // Snip circles the date
  const circ = seg(S, BB(SEC.day2, 2) + BEAT * .3, BB(SEC.day2, 3) + BEAT * .6);
  if (circ > 0) { const pts = []; for (let i = 0; i <= 30 * circ; i++) { const a = -2 + i / 30 * TAU * 1.05; pts.push([cx + Math.cos(a) * 170, cy + 60 + Math.sin(a) * 190]); } if (pts.length > 2) inkLine(pts, 2.2, PAL.red, 'ink', .5); }
  ambient(S, 'sparkle', null, 14, { col: PAL.gold });
  cat(cx - 360, 1300, 11, { pose: 'sit', eyes: flip > .5 ? 'wide' : 'open', lookX: .6, tail: 1 });
  snip(cx + 360, 1300, 15, { eyes: 'happy', mouth: 'grin', aL: 1.2, aR: .2, cutL: .8, cutR: .8, dy: -.4 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)), flip: true });
  camEnd();
});

// ---------- VERSE 2 ----------
// bars 31–33 "Drop the stream in, grab a drink": daytime; the 3-hour file flies into the FlareClip drop zone,
// the progress bar fills, the streamer leans back with a mug while Snip snips away on top of the monitor.
shot(barAt(SEC.v2), barAt(SEC.v2 + 3), (S, lt, dur) => {
  const b0 = SEC.v2, drop = BB(b0, 2), sip = BB(b0 + 1, 0);
  camBegin(VERT ? 1000 : 990, 980, kf(lt, [[0, 1.2], [dur, 1.08]]) * VZ);
  const prog = seg(S, drop + .3, BB(b0 + 2, 2)), done = prog >= 1;
  const aR = S < drop ? kf(S, [[barAt(b0), -.3], [drop - .25, 1.0], [drop, .2]]) : S < sip ? .2 : 1.25;
  deskScene(S, { clock: 10 + lt * .1, wall: '#B9A8CF', sky: '#8EC5E8', sun: [560, 420], live: false, cat: { pose: 'sit', eyes: S > drop ? 'wide' : 'open', lookX: .5 }, viewers: null, eyes: S > sip && !done ? 'happy' : done ? 'star' : 'open', mouth: S > sip ? 'smile' : 'grin', aL: -1.1, aR, glow: .5,
    screen: '#2A2438', content: (sx, sy, w, h) => {
      // drop zone
      const z = [sx + 40, sy + 30, w - 80, h - 60];
      for (let i = 0; i < 14; i++) { const f0 = i / 14, f1 = f0 + .04, per = 2 * (z[2] + z[3]);
        const at = f => { let d = f * per; if (d < z[2]) return [z[0] + d, z[1]]; d -= z[2]; if (d < z[3]) return [z[0] + z[2], z[1] + d]; d -= z[3]; if (d < z[2]) return [z[0] + z[2] - d, z[1] + z[3]]; d -= z[2]; return [z[0], z[1] + z[3] - d]; };
        inkLine([at(f0), at(f1)], 1, S > drop ? PAL.flame : PAL.cream, 'inkfine', 0); }
      paint(snipBodyPts(sx + w / 2, sy + h * .42, 7, S, .5), { wash: PAL.flame, ink: null });
      if (S < drop + .2) letter('drop your video', sx + w / 2, sy + h * .72, 24, PAL.cream, { font: '600 24px "Fredoka"', shadow: false, alpha: .8 });
      else {
        paint(rrPts(sx + 60, sy + h * .68, w - 120, 22, 11), { wash: '#4A4458', ink: null });
        paint(rrPts(sx + 60, sy + h * .68, Math.max(22, (w - 120) * prog), 22, 11), { wash: done ? PAL.leaf : PAL.gold, ink: null });
        letter(done ? '20 clips ready' : `${Math.floor(prog * 100)}%`, sx + w / 2, sy + h * .84, 26, PAL.cream, { font: '700 26px "Fredoka"', shadow: false });
      }
    } });
  // the file flies from the hand to the screen
  if (S < drop + .1) {
    const k = easeIn(seg(S, drop - .45, drop)), [hx, hy] = handPos(760, 1180, 17, 1.0, 1);
    const fx = lerp(hx + 20, 1190, k), fy = lerp(hy - 40, 870, k) - Math.sin(k * Math.PI) * 120, sc = 1 - .6 * k;
    push(); translate(fx, fy); rotate(-.2 + k * .2); scale(sc);
    paint(rrPts(-110, -45, 220, 90, 14), { wash: '#2F2A38', ink: PAL.ink, sw: 1.1 });
    for (let i = 0; i < 4; i++) paint(rectPts(-95 + i * 50, -25, 40, 50), { wash: '#8FA2BC', ink: null });
    pop();
    letter('3:00:00', fx, fy + 70 * sc, 34 * sc, PAL.ink, { font: `700 ${Math.round(34 * sc)}px "Fredoka"`, stroke: PAL.cream, shadow: false });
  }
  if (S > drop) sparks(1190, 880, S - drop, 8, 140);
  // the mug
  if (S > sip) {
    const [hx, hy] = handPos(760, 1180, 17, 1.25, 1);
    paint(rrPts(hx - 6, hy - 70, 60, 70, 12), { wash: PAL.cream, ink: PAL.ink, sw: 1.1 });
    paint(rrPts(hx - 6, hy - 70, 60, 16, 6), { wash: '#7A4A2E', ink: null });
    inkLine([[hx + 54, hy - 55], [hx + 74, hy - 45], [hx + 74, hy - 25], [hx + 54, hy - 18]], 1.2);
    for (let i = 0; i < 2; i++) inkLine([[hx + 10 + i * 22, hy - 85], [hx + 2 + i * 22, hy - 110 - 10 * wob(S, 1, i / 2)], [hx + 12 + i * 22, hy - 135]], .8, PAL.grey, 'inkfine', .6);
  }
  // Snip on the monitor, snipping on every eighth note while it works
  const busy = S > drop && !done, cut = busy && frac(bpOf(REAL_S) * 2) < .3;
  snip(1300, 820, 13, { eyes: done ? 'happy' : 'determined', mouth: 'grin', aL: busy ? .9 : 1.3, aR: busy ? .9 : 1.3, cutL: cut ? 0 : 1, cutR: cut ? 0 : 1, glow: busy ? .5 : .2, sq: -.1 * pulse2(REAL_S, 8) });
  camEnd();
});

// bars 34–36 "Twenty clips back before you blink": close on the streamer's face, a blink, and twenty clips are there.
shot(barAt(SEC.v2 + 3), barAt(SEC.v2 + 6), (S, lt, dur) => {
  const b0 = SEC.v2 + 3, blink = BB(b0, 2), open = blink + .22;
  if (S < open) {   // close-up: the streamer watching the screen, then a blink
    camBegin(960, 960, kf(S, [[barAt(b0), 1], [blink, 1.08]]));
    frameWash('#B9A8CF');
    paint(ellPts(960, 900, 800, 700, 30), { fill: PAL.gold, fillOp: 60, bleed: .3, tex: .4, border: .1, ink: null });
    paint(rrPts(1180, 300, 420, 360, 20), { wash: '#8EC5E8', ink: PAL.ink, sw: 1.3 });
    inkLine([[1390, 300], [1390, 660]], 1.2); inkLine([[1180, 480], [1600, 480]], 1.2);
    const s = 62, closed = S > blink;
    streamer(960, 880 + 11.8 * s, s, { eyes: closed ? 'closed' : 'wide', mouth: closed ? 'smile' : 'o', aL: -1.2, aR: -1.2 });
    // screen glow on the face
    paint(ellPts(960, 1000, 420, 300, 24), { fill: PAL.teal, fillOp: 40, bleed: .3, tex: .2, border: .1, ink: null });
    if (closed) sfx('blink', 1250, 760, 70, PAL.ink, S - blink, { life: .5, stroke: PAL.cream });
    camEnd();
    return;
  }
  camBegin(960, 960, VERT ? 1 : .95);
  frameWash('#2F6F6D');
  sunburst(960, 960, '#2F6F6D', PAL.teal, S * .1);
  ambient(S, 'sparkle', null, 20);
  const cols = VERT ? 4 : 5, rows = VERT ? 5 : 4, ch = VERT ? 250 : 215, dx = VERT ? 235 : 250, dy = VERT ? 285 : 245;
  const x0 = 960 - (cols - 1) * dx / 2 + (VERT ? 0 : 160), y0 = (VERT ? 1060 : 960) - (rows - 1) * dy / 2;
  let shown = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, t0 = open + i * .04, k = seg(S, t0, t0 + .25); if (k <= 0) continue; shown++;
    clipCard(x0 + c * dx, y0 + r * dy + 6 * wob(S, .8, i / 7), ch * backOut(k), .06 * (hash(i) - .5), { bg: [PAL.sky, PAL.rose, PAL.gold, PAL.leaf, PAL.lilac, PAL.flameLt][i % 6], play: true, glow: pulse(REAL_S + i * .03, 4) * .5 });
  }
  const cx = VERT ? 960 : 330, cy = VERT ? 200 : 960;
  paint(rrPts(cx - 170, cy - 80, 340, 160, 50), { wash: PAL.cream, ink: PAL.ink, sw: 1.3 });
  letter(String(shown), cx, cy - 10, 96, PAL.flame, { font: '700 96px "Fredoka"', shadow: false, pop: pulse(REAL_S, 5) * .3 + 1 });
  letter('clips', cx, cy + 52, 34, PAL.ink, { font: '700 34px "Fredoka"', shadow: false });
  snip(VERT ? 1320 : 330, VERT ? 1700 : 1330, 13, { eyes: 'star', mouth: 'open', aL: 1.3, aR: 1.3, cutL: .5, cutR: .5, dy: -.5 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) });
  camEnd();
});

// bars 37–39 "Face in the frame, words that glow": one big clip; the face-tracking bracket follows the streamer,
// the captions light up word by word.
function bigClip(S, o) {
  const cx = 960, cy = 900, h = 1000, w = h * 9 / 16, top = cy - h / 2, bot = cy + h / 2;
  const BG = o.bg;
  frameWash(BG);
  paint(ellPts(960, 900, 760, 700, 30), { fill: PAL.flameLt, fillOp: 90, bleed: .3, tex: .4, border: .1, ink: null });
  ambient(S, 'float', null, 14, { glyphs: ['heart', 'star', 'note'], cols: [PAL.rose, PAL.gold, PAL.flame], speed: 60 });
  paint(rrPts(cx - w / 2 - 16, top - 16, w + 32, h + 32, 50), { wash: '#26222F', ink: null });
  paint(rrPts(cx - w / 2, top, w, h, 40), { wash: o.screen || PAL.sky, ink: null });
  // the streamer, big, swaying
  const sway = 60 * wob(S, .45), s = 56, hx = cx + sway, feetY = 780 + 11.8 * s;
  streamer(hx, feetY, s, { eyes: o.eyes || 'happy', mouth: o.mouth || (frac(S * 4) < .5 ? 'o' : 'grin'), aL: -.9 + .35 * pulse(REAL_S, 3), aR: -.75 });
  // hide what spills out below the card, then the frame
  paint(rectPts(cx - w / 2 - 40, bot + 16, w + 80, 700), { wash: BG, ink: null });
  paint(rrPts(cx - w / 2 - 16, bot - 40, w + 32, 56, 16), { wash: '#26222F', ink: null });
  paint(rrPts(cx - w / 2 - 16, top - 16, w + 32, h + 32, 50), { ink: PAL.ink, sw: 1.6 });
  // face bracket, lagging a touch behind the face
  const lag = 60 * wob(S - .12, .45), fx = cx + lag, fy = 780, b = 150, L = 50;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) inkLine([[fx + sx * b, fy + sy * b - sy * L], [fx + sx * b, fy + sy * b], [fx + sx * b - sx * L, fy + sy * b]], 2.4, PAL.gold, 'ink', 0);
  // two viewers watching on their phones
  const FP = VERT ? [[545, 1800, 10], [1375, 1800, 10]] : [[330, 1420, 14], [1600, 1420, 14]];
  FP.forEach(([x, y, fs], i) => fan(x, y, fs, { seed: 50 + i, phone: true, aR: .9, aL: -1.1, eyes: ['heart', 'star'][i], mouth: 'open', hop: Math.abs(Math.sin((bpOf(REAL_S) + i * .5) * Math.PI)) * .3, flip: i === 1 }));
  return { cx, cy, w, h, top, bot };
}
shot(barAt(SEC.v2 + 6), barAt(SEC.v2 + 9), (S, lt, dur) => {
  const b0 = SEC.v2 + 6;
  camBegin(960, 920, VERT ? 1.05 : .9);
  const C = bigClip(S, { bg: '#F1D7B0', screen: PAL.sky });
  // captions: one word per beat, the current word gold and bigger
  const LINES = [['THIS', 'IS', 'THE'], ['GOOD', 'BIT']], bi = Math.floor(bpOf(S) - bpOf(barAt(b0)));
  const cur = bi % 6, font = n => `700 ${n}px "Fredoka"`;
  paint(rrPts(C.cx - C.w / 2 + 20, C.bot - 250, C.w - 40, 170, 30), { wash: '#1F1B28', washOp: 170, ink: null });
  let k = 0;
  LINES.forEach((line, li) => {
    const ws = line.map(w => textW(w, font(64))), gap = 22, total = ws.reduce((a, b) => a + b, 0) + gap * (line.length - 1);
    let x = C.cx - total / 2;
    line.forEach((w, j) => {
      const on = k <= cur, now = k === cur, sz = now ? 64 * (1 + .25 * pulse(REAL_S, 5)) : 64;
      letter(w, x + ws[j] / 2, C.bot - 205 + li * 80, sz, on ? (now ? PAL.gold : PAL.cream) : '#8C8499', { font: font(Math.round(sz)), shadow: false });
      x += ws[j] + gap; k++;
    });
  });
  if (cur >= 0) paint(ellPts(C.cx, C.bot - 170, 260, 110, 24), { fill: PAL.gold, fillOp: 60 * pulse(REAL_S, 3), bleed: .3, tex: .2, border: .1, ink: null });
  snip(VERT ? 1330 : 1340, 1400, 14, { eyes: 'happy', mouth: 'grin', aL: 1.3, aR: .3, cutL: .6, cutR: .9, lookX: -.6, dy: -.3 * pulse(REAL_S, 5) });
  camEnd();
});

// bars 40–42 "Every language, ready to go": the caption flips language on every beat, language tags pop up,
// then copies of the clip fly off in every direction.
const READY = ['Ready to go!', '¡Listo!', 'Pronto!', '準備OK!', '准备好了！', "C'est parti !", "Los geht's!", 'Siap!', 'Hazır!', 'Pronto!', 'Gotowe!', 'Klaar!'];
const TAGS = ['EN', 'ES', 'PT', '日本語', '中文', 'FR', 'DE', 'ID', 'TR', 'IT'];
shot(barAt(SEC.v2 + 9), barAt(SEC.v2 + 12), (S, lt, dur) => {
  const b0 = SEC.v2 + 9, fly = BB(b0 + 2, 0);
  camBegin(960, 920, (VERT ? 1.05 : .9) * kf(S, [[fly, 1], [barAt(b0 + 3), .85]]));
  const C = bigClip(S, { bg: '#CFE3EE', screen: PAL.rose, eyes: 'happy', mouth: 'grin' });
  const bi = Math.max(0, Math.floor(bpOf(S) - bpOf(barAt(b0))));
  paint(rrPts(C.cx - C.w / 2 + 20, C.bot - 230, C.w - 40, 120, 30), { wash: '#1F1B28', washOp: 170, ink: null });
  letter(READY[bi % READY.length], C.cx, C.bot - 168, 60 * (1 + .15 * pulse(REAL_S, 6)), PAL.gold, { font: `700 60px "Fredoka", "Hiragino Sans", "PingFang SC", "Noto Sans CJK SC", sans-serif`, shadow: false });
  // language tags around the clip
  const TP = VERT ? [[560, 420], [1360, 470], [540, 760], [1380, 820], [560, 1120], [1370, 1170], [620, 1480], [1300, 1520], [960, 300], [960, 1640]]
    : [[330, 420], [1590, 440], [260, 760], [1660, 780], [330, 1100], [1590, 1120], [560, 1380], [1360, 1400], [640, 260], [1280, 260]];
  TAGS.forEach((t, i) => { const t0 = barAt(b0) + i * BEAT * .5; bubble(TP[i][0], TP[i][1], 90 + t.length * (/[^\x00-\x7F]/.test(t) ? 44 : 26), 80, t, { pop: seg(S, t0, t0 + .3), col: [PAL.cream, PAL.flameLt, PAL.gold, PAL.sky, PAL.rose][i % 5] }); });
  // copies fly out
  if (S > fly) {
    const a = S - fly;
    for (let i = 0; i < 10; i++) {
      const ang = i / 10 * TAU + .3, r = easeOut(a / 1.6) * 1100;
      clipCard(C.cx + Math.cos(ang) * r, C.cy + Math.sin(ang) * r * .9, 260, a * 3 * (i % 2 ? 1 : -1), { bg: [PAL.sky, PAL.rose, PAL.gold, PAL.leaf, PAL.lilac][i % 5], play: true });
    }
    sfx('GO!', C.cx, C.top - 60, 150, PAL.flame, a, { life: 1.5, rot: -.06 });
  }
  camEnd();
});

// ---------- CHORUS 2: the chorus-1 shots replayed on the chorus-2 bars, in the alternate colours ----------
(function reuseChorus(from0, from1, to0) {
  const src = SHOTS.filter(s => s.a >= barAt(from0) - 1e-3 && s.a < barAt(from1) - 1e-3);
  for (const sh of src) {
    const a = barAtF(barOf(sh.a) - from0 + to0), b = barAtF(barOf(sh.b) - from0 + to0);
    shot(a, b, (S) => { const S1 = barAtF(barOf(S) - to0 + from0); VARIANT = 1; sh.fn(S1, S1 - sh.a, sh.b - sh.a); VARIANT = 0; });
  }
  // Visuals reuse chorus 1, but chorus 2 lyrics are aligned explicitly below.
  // Copying the first chorus timings caused a growing subtitle drift.
})(22, 30, SEC.ch2);

// ---------- bars 51–53: instrumental break. Snip alone in a spotlight, then the colours start flashing on the beat
// and clips rain down. ----------
shot(barAt(SEC.brk), barAt(SEC.bridge), (S, lt, dur) => {
  const b0 = SEC.brk, hype = seg(S, barAt(b0 + 1) - .1, barAt(b0 + 1) + .1);
  camBegin(960, 980, kf(lt, [[0, 1.25], [dur, 1.0]]));
  const cols = [PAL.rose, PAL.gold, PAL.teal, PAL.lilac], bi = Math.floor(bpOf(REAL_S));
  frameWash(hype > 0 ? mixCol('#20183A', cols[((bi % 4) + 4) % 4], .55 * hype) : '#20183A');
  for (const [x, c] of [[560, PAL.gold], [1360, PAL.rose]]) if (hype > 0) paint([[x - 50, -200], [x + 50, -200], [960 + (x - 960) * .2 + 300, 1400], [960 + (x - 960) * .2 - 300, 1400]], { fill: c, fillOp: 80 * hype * (.5 + .5 * pulse(REAL_S, 3)), bleed: .25, tex: .2, border: .1, ink: null });
  paint([[900, -200], [1020, -200], [1260, 1420], [660, 1420]], { fill: PAL.cream, fillOp: 90, bleed: .25, tex: .2, border: .1, ink: null });
  paint(ellPts(960, 1400, 380, 70, 24), { wash: PAL.cream, washOp: 120, ink: null });
  // raining clips
  if (hype > 0) for (let i = 0; i < 14; i++) {
    const t0 = barAt(b0 + 1) + i * BEAT * .5, a = S - t0; if (a < 0) continue;
    const x = 300 + hash(i) * 1320, y = -150 + a * 700;
    if (y < 2100) clipCard(x, y, 170, a * (hash(i + 4) - .5) * 4, { bg: [PAL.sky, PAL.rose, PAL.gold, PAL.leaf, PAL.lilac][i % 5], play: true });
  }
  if (hype > 0) { ambient(S, 'sparkle', null, 16); fanRow(S, VERT ? 450 : 150, VERT ? 1470 : 1770, 1580, VERT ? 10 : 12, VERT ? 6 : 10, 100, { cheer: true, hop: .7 }); }
  const hop = hype > 0 ? Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) : .3 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI / 2));
  const closing = hype > 0 && frac(bpOf(REAL_S) * 2) < .25;
  snip(960, 1400 - hop * 90, 22, { eyes: hype > 0 ? (hop > .5 ? 'star' : 'happy') : 'closed', mouth: hype > 0 ? 'open' : 'smile', aL: hype > 0 ? 1.3 : -.4, aR: hype > 0 ? 1.3 : -.4, cutL: closing ? 0 : 1, cutR: closing ? 0 : 1, sq: .2 * (1 - hop) - .1, glow: .3 + .5 * hype });
  camEnd();
});

// ---------- BRIDGE ----------
// bars 54–56 "Long, long video? Let it go": dusk on a hill. The streamer holds the end of the endless tape,
// which streams up into the sky like a kite tail; they let go and it drifts away.
shot(barAt(SEC.bridge), barAt(SEC.build), (S, lt, dur) => {
  const b0 = SEC.bridge, let_ = BB(b0 + 1, 0), away = seg(S, let_, barAt(b0 + 3));
  camBegin(960, kf(lt, [[0, 1080], [dur, 900]]), kf(lt, [[0, 1.15], [dur, 1.0]]));
  frameWash('#E9B7A6');
  paint(rectPts(-300, -800, 2520, 1300), { wash: '#9C86C9', washOp: 200, ink: null });
  paint(rectPts(-300, 300, 2520, 700), { fill: '#F2A07B', fillOp: 140, bleed: .35, tex: .5, border: .2, ink: null });
  paint(ellPts(1350, 1080, 120, 120, 26), { wash: '#FFD9A0', washOp: 230, ink: null });
  for (let i = 0; i < 14; i++) paint(starPts(hash(i) * 1920, -200 + hash(i + 40) * 700, 6 + hash(i + 3) * 6, .4, 4), { wash: PAL.cream, washOp: 90 + 120 * pulse(REAL_S + i * .1, 2), ink: null });
  // clouds drifting, birds
  for (let i = 0; i < 4; i++) cloud(frac(hash(i) + S * .012 * (1 + i * .3)) * 2400 - 240, 260 + i * 130, 220 + hash(i + 2) * 160, '#F8E3D6', 200);
  for (let i = 0; i < 4; i++) bird(frac(hash(i + 9) + S * .03) * 2200 - 140, 520 + 60 * Math.sin(S * .5 + i) + i * 40, 22, S * 9 + i);
  // hill
  paint([[-300, 1330], [300, 1250], [800, 1210], [1300, 1240], [2220, 1320], [2220, 2400], [-300, 2400]], { wash: '#6F8F5A', ink: PAL.ink, sw: 1.2, curv: .4 });
  paint([[-300, 1450], [600, 1400], [1400, 1430], [2220, 1480], [2220, 2400], [-300, 2400]], { wash: '#58774A', ink: null, curv: .4 });
  for (let i = 0; i < 16; i++) { const fx = hash(i + 30) * 1900, fy = 1300 + hash(i + 31) * 200; inkLine([[fx, fy], [fx + 4 * Math.sin(S + i), fy - 30]], .8, '#3E5A30', 'inkfine', .5); paint(ellPts(fx + 4 * Math.sin(S + i), fy - 34, 9, 9, 8), { wash: [PAL.cream, PAL.gold, PAL.rose][i % 3], ink: null }); }
  const sx = 860, sy = 1225, s = 19;
  cat(640, 1235, 10, { pose: 'sit', eyes: S < let_ ? 'open' : 'wide', lookX: .8, tail: 2 });
  const aR = S < let_ ? 1.35 : 1.35 - .6 * seg(S, let_, let_ + .6);
  streamer(sx, sy, s, { eyes: S < let_ ? 'open' : 'happy', mouth: 'smile', aL: -.3, aR });
  // the tape: from the hand, waving up to the top right; once let go, it drifts up and away
  const [hx, hy] = handPos(sx, sy, s, 1.35, 1, false);
  const off = [away * 700, -away * 900], pts = [];
  for (let i = 0; i <= 14; i++) {
    const f = i / 14, x = hx + f * 900 + 90 * Math.sin(f * 5 - S * 2.2), y = hy - f * 1000 + 50 * Math.sin(f * 7 - S * 1.7);
    pts.push([x + off[0] * (.4 + f * .6), y + off[1] * (.6 + f * .4) + (S > let_ ? 0 : 0)]);
  }
  if (away < .98) tape(pts, 72 * (1 - .5 * away), { seed: 3, labels: away < .2 ? { every: 3, fmt: f => hms(f * 10800) } : null });
  snip(1110, 1235, 13, { eyes: 'happy', mouth: 'smile', aL: S > let_ ? 1.3 + .2 * wob(S, 1.5) : -.3, aR: -.3, cutL: .8, cutR: .8, flip: true, glow: .3 });
  camEnd();
});

// bars 57–60 "Flare Clip, clip it, steal the show": the build. A night stage, the FlareClip name spells itself
// out on the beats, Snip grows and glows, the crowd rises, and it all flares white-gold on the last beat.
shot(barAt(SEC.build), barAt(SEC.final), (S, lt, dur) => {
  const b0 = SEC.build, flare = seg(S, BB(b0 + 3, 2), barAt(b0 + 4));
  camBegin(960, kf(lt, [[0, 1050], [dur, 960]]), kf(lt, [[0, 1.2], [dur, 1.0]]) * (1 + .03 * barPulse(REAL_S, 6)));
  frameWash('#191531');
  for (let i = 0; i < 4; i++) {
    const x = 300 + i * 440, sw = .35 * Math.sin(S * 1.3 + i * 1.7), c = [PAL.gold, PAL.rose, PAL.teal, PAL.flameLt][i];
    paint([[x - 40, -200], [x + 40, -200], [x + Math.sin(sw) * 1500 + 260, 1300], [x + Math.sin(sw) * 1500 - 260, 1300]], { fill: c, fillOp: 60 + 60 * seg(lt, 0, dur), bleed: .25, tex: .2, border: .1, ink: null });
  }
  paint(rectPts(-300, 1180, 2520, 130), { wash: PAL.wood, ink: PAL.ink, sw: 1.2 });
  paint(rectPts(-300, 1310, 2520, 1000), { wash: '#2A1E33', ink: null });
  // the name, one letter per beat over the first two bars
  const word = 'FlareClip', font = '700 180px "Fredoka"', W = textW(word, font), n = Math.min(word.length, Math.floor(bpOf(S) - bpOf(barAt(b0)) + 1));
  let x = 960 - W / 2;
  for (let i = 0; i < word.length; i++) {
    const cw = textW(word[i], font);
    if (i < n) { const t0 = beatAt(Math.round(bpOf(barAt(b0))) + i); letter(word[i], x + cw / 2, VERT ? 560 : 760, 180, i < 5 ? PAL.cream : PAL.flame, { font, shadow: false, pop: seg(S, t0, t0 + .25) * 1.15, stroke: i < 5 ? PAL.ink : null }); }
    x += cw;
  }
  // crowd rising
  const crowd = seg(S, barAt(b0 + 2), barAtF(b0 + 3.5));
  if (crowd > 0) seats(960, 1560 - 120 * easeOut(crowd), 11, 3, crowd, S);
  const grow = easeIn(seg(S, barAt(b0), barAt(b0 + 4)));
  const u = lerp(15, 26, grow), hop = Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) * (lt > dur / 2 ? 1 : .4);
  snip(960, 1190 - hop * 50, u, { eyes: grow > .6 ? 'star' : 'determined', mouth: grow > .6 ? 'open' : 'grin', aL: 1.2 + .2 * pulse(REAL_S, 4), aR: 1.2 + .2 * pulse(REAL_S, 4), cutL: frac(bpOf(REAL_S) * 2) < .25 ? 0 : 1, cutR: frac(bpOf(REAL_S) * 2) < .25 ? 0 : 1, glow: .4 + .8 * grow });
  if (crowd > 0) fanRow(S, VERT ? 450 : 120, VERT ? 1470 : 1800, 1700 - 250 * easeOut(crowd), VERT ? 11 : 13, VERT ? 7 : 12, 120, { cheer: true, hop: .8 });
  if (lt > dur * .5) confetti(S, barAt(b0 + 2), 60, [-100, -100, 2120, 2120]);
  if (flare > 0) paint(ellPts(960, 900, 150 + 2200 * easeIn(flare), 150 + 2200 * easeIn(flare), 40), { wash: '#FFF3D6', washOp: 255 * seg(flare, 0, .6), ink: null });
  camEnd();
});

// ---------- lyrics (aligned against assets/clipit-2min.mp3) ----------
lyric(72.27, 75.57, 'Drop the stream in, grab a drink');
lyric(76.42, 78.93, 'Twenty clips back before you blink');
lyric(79.82, 83.00, 'Face in the frame, words that glow');
lyric(83.78, 86.70, 'Every language, ready to go');

lyric(88.28, 90.67, 'Clip it, clip it (snip, snip)');
lyric(90.68, 93.00, 'Cut it to the good bit');
lyric(93.79, 96.76, 'Three hours in, thirty seconds out');
lyric(96.77, 99.37, "That's the part they talk about");
lyric(99.48, 100.95, 'Clip it, clip it (snip, snip)');
lyric(101.02, 103.41, "Now the whole world's seen it");

lyric(108.18, 112.63, 'Long, long video? Let it go');
lyric(115.55, 119.78, 'Flare Clip, clip it, steal the show');

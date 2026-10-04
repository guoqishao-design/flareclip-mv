// scenes.js: the shots, in song time. The 30 s cut uses bars 2–5 (intro), 22–29 (chorus) and 85–end (outro);
// the 15 s cut uses bar 21 (end of the pre-chorus), bars 22–24 and the outro.
// Bar n starts at barAt(n); beat k of bar n is at beatAt(2 + 4n + k) (the first downbeat is beat 2).
const BB = (n, k = 0) => beatAt(2 + 4 * n + k);
// VARIANT is set while a chorus shot is replayed for a later chorus (see part2.js): vc() picks the alternate colour
let VARIANT = 0;
const vc = (a, b) => VARIANT ? b : a;

// ---------- helpers ----------
function subPath(path, k) {
  if (k >= 1) return path;
  const T = tapeSample(path), L = k * T.len, out = [path[0]]; let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (acc + d >= L) { const f = (L - acc) / d; out.push([lerp(path[i - 1][0], path[i][0], f), lerp(path[i - 1][1], path[i][1], f)]); break; }
    out.push(path[i]); acc += d;
  }
  return out.length > 1 ? out : [path[0], [path[0][0] + 1, path[0][1]]];
}
function sunburst(cx, cy, a, b, rot, n = 18) {
  frameWash(a);
  for (let i = 0; i < n; i += 2) {
    const a0 = rot + i / n * TAU, a1 = rot + (i + 1) / n * TAU, R = 2600;
    paint([[cx, cy], [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R]], { wash: b, washOp: 150, ink: null });
  }
  paint(ellPts(cx, cy, 520, 520, 30), { fill: PAL.cream, fillOp: 120, bleed: .35, tex: .3, border: .1, ink: null });
}
function tumbleweed(x, y, r, a) {
  for (let i = 0; i < 5; i++) inkLine(ellPts(x, y, r * (.6 + hash(i) * .4), r * (.5 + hash(i + 2) * .5), 12, 0, a + i * .7), .9, '#8A6E4B', 'inkfine', .7);
}
// the streamer's desk setup, shared by several shots. o: viewers, eyes, mouth, slump, screen, content, emote, clock, dawn
function deskScene(S, o = {}) {
  const dawn = o.dawn || 0;
  room(S, { clock: o.clock, clockX: 1320, clockY: 470, winX: 470, winY: 330, glowX: 1080, glowY: 900, wall: o.wall || mixCol(PAL.night, '#7A5C8C', dawn) });
  if (dawn > 0) paint(rrPts(470, 330, 360, 300, 16), { wash: mixCol('#141A3A', '#F2A07B', dawn), washOp: 255 * dawn, ink: null });
  if (o.sky) {   // daytime window: sky colour over the night view, optional sun, then the mullions again
    paint(rrPts(470, 330, 360, 300, 16), { wash: o.sky, washOp: o.skyOp ?? 255, ink: null });
    if (o.sun) paint(ellPts(o.sun[0], o.sun[1], 42, 42, 20), { wash: '#FFE9A8', washOp: o.sun[2] ?? 255, ink: null });
    inkLine([[650, 330], [650, 630]], 1.1); inkLine([[470, 480], [830, 480]], 1.1);
    paint(rrPts(470, 330, 360, 300, 16), { ink: PAL.ink, sw: 1.2 });
  }
  const night = o.night ?? (o.sky ? 0 : 1 - dawn * .6);
  roomDecor(S, { night });
  deskDecor(S);
  // chair back behind the streamer
  paint(rrPts(640, 880, 230, 330, 40), { wash: PAL.red, ink: PAL.ink, sw: 1.2 });
  streamer(760, 1180, 17, { sit: true, eyes: o.eyes || 'open', mouth: o.mouth || 'flat', slump: o.slump || 0, aL: o.aL ?? -1.1, aR: o.aR ?? -.25, emote: o.emote, emoteK: o.emoteK });
  desk(1100, 1070, 700);
  deskTop(S, { rgb: night > .5 });
  monitor(1190, 1070, 400, 260, { live: o.live ?? true, viewers: o.viewers, screen: o.screen || PAL.teal, content: o.content, glow: o.glow ?? .6 });
  // Mochi the cat, on top of the monitor (asleep unless told otherwise)
  if (o.cat !== false) { const c = o.cat || {}; cat(c.x ?? 1060, 718, 8, { pose: c.pose || 'loaf', eyes: c.eyes, lookX: c.lookX, flip: c.flip }); }
  if (night > .3) ambient(S, 'dust', [760, 560, 700, 560], 12, { speed: 18 });
}

// ======================= INTRO: "Three hours live… and nobody stayed" =======================

// bars 2–3: the cold-open hook lives in src/hook.js

// bars 4–5: "nobody stayed". Close on the monitor (0 viewers, a tumbleweed), then pull back: the streamer nods off,
// and Snip pops out of the corner of the monitor, determined.
shot(barAt(4), barAt(6), (S, lt, dur) => {
  const half = barAt(5) - barAt(4);
  if (lt < half) {
    camBegin(1190, 880, kf(lt, [[0, 1.75], [half, 1.9]]));
    deskScene(S, { clock: 11.5, viewers: 0, eyes: 'tired', slump: .6,
      content: (sx, sy, w, h) => { letter('...', sx + w / 2, sy + h / 2 + 10, 90, PAL.cream, { shadow: false, alpha: .7 }); } });
    const tx = kf(lt, [[0, 1500], [half, 880]], x => x), ty = 1040 - Math.abs(Math.sin(lt * 5)) * 30;
    tumbleweed(tx, ty, 34, -lt * 6);
    camEnd();
    return;
  }
  const l2 = lt - half;
  camBegin(kf(l2, [[0, 960], [half, 1080]]), kf(l2, [[0, 980], [half, 930]]), kf(l2, [[0, 1.15], [half, 1.25]]) * VZ);
  const px = VERT ? 1300 : 1370, py = VERT ? 810 : 860;
  const pop = seg(S, BB(5, 1), BB(5, 1) + .35);
  deskScene(S, { clock: 11.8, viewers: 0, eyes: 'closed', mouth: 'o', slump: .9, emote: 'zzz', emoteK: seg(l2, 0, .3) });
  if (pop > 0) {
    const cut = S > BB(5, 2) && S < BB(5, 2) + .15 || S > BB(5, 3) && S < BB(5, 3) + .15 ? 0 : 1;
    snip(px, py - 90 * backOut(pop), 15 * backOut(pop), { eyes: 'determined', mouth: 'flat', aL: .6, aR: .9, cutL: cut, cutR: cut, glow: .5, sq: -.12 * pulse(REAL_S, 8), lookX: -.5, noLegs: pop < .5 });
    if (S > BB(5, 2)) sparks(px + 110, py - 60, S - BB(5, 2), 6, 90);
    if (S > BB(5, 3)) sparks(px - 100, py - 70, S - BB(5, 3), 6, 90);
  }
  camEnd();
});

// ======================= PRE-CHORUS END (15 s cut): "…a little help to escape" =======================
// bar 21: Snip on top of the monitor winds up; the good bit of the tape glows gold on the floor.
shot(barAt(21), barAt(22), (S, lt, dur) => {
  camBegin(kf(lt, [[0, 1000], [dur, 1100]]), kf(lt, [[0, 960], [dur, 1040]]), kf(lt, [[0, 1.1], [dur, 1.3]]) * VZ);
  deskScene(S, { clock: 12.4, viewers: 0, eyes: 'closed', slump: .9, emote: 'zzz' });
  const path = [[1390, 990], [1450, 1120], [1400, 1290], [1150, 1380], [800, 1420], [520, 1520], [380, 1700], [520, 1880], [900, 1950]];
  tape(path, 84, { hi: [.36, .44], glow: .6 + .4 * pulse(REAL_S, 3) });
  const wind = ease(lt / dur);
  snip(1250, 830, 15, { eyes: 'determined', mouth: 'grin', aL: 1.2 * wind, aR: 1.2 * wind, cutL: 1, cutR: 1, sq: .35 * wind, dy: 0, glow: .4 + .6 * wind, lookX: .4, lookY: .8 });
  camEnd();
});

// ======================= CHORUS =======================
const TAPE_Y = 1010;
const straightTape = (x0, x1, y, sag = 30) => { const p = []; for (let i = 0; i <= 12; i++) { const f = i / 12; p.push([lerp(x0, x1, f), y + Math.sin(f * Math.PI) * sag]); } return p; };

// bar 22 "Clip it, clip it (snip, snip)": Snip lands on the tape and cuts twice, on beats 3 and 4.
shot(barAt(22), barAt(23), (S, lt, dur) => {
  const c1 = BB(22, 2), c2 = BB(22, 3);
  const [sx, sy] = shakeXY(S, 14 * (Math.exp(-(S - c1) * 8) * (S > c1) + Math.exp(-(S - c2) * 8) * (S > c2)));
  camBegin(960 + sx, 960 + sy, 1);
  sunburst(960, 900, vc(PAL.rose, PAL.teal), vc(PAL.gold, PAL.flameLt), S * .15);
  ambient(S, 'bokeh', null, 10, { cols: [PAL.cream, PAL.flameLt] });
  ambient(S, 'float', [300, 300, 1320, 1400], 12, { glyphs: ['note', 'star'], cols: [PAL.cream, PAL.gold], speed: 70 });
  // the tape, cut into three once both snips land; the middle piece (the good bit) glows
  const gap1 = S > c1 ? easeOut((S - c1) / .25) * 60 : 0, gap2 = S > c2 ? easeOut((S - c2) / .25) * 60 : 0;
  const midLift = S > c2 ? -easeOut((S - c2) / .3) * 60 : 0;
  tape(straightTape(-120 - gap1, 800 - gap1, TAPE_Y), 110, { seed: 1, labels: { every: 3, fmt: f => hms(f * 4000), alpha: .8 } });
  tape(straightTape(800, 1120, TAPE_Y + midLift, 4), 110, { hi: [0, 1], glow: S > c1 ? 1 : .5 });
  tape(straightTape(1120 + gap2, 2040 + gap2, TAPE_Y), 110, { seed: 5, labels: { every: 3, fmt: f => hms(6000 + f * 4800), alpha: .8 } });
  // Snip drops in on the downbeat, then hops between the two cut points
  const land = backOut(seg(lt, 0, .3));
  const x = S < c1 ? 800 : kf(S, [[c1, 800], [c2 - .05, 1120]], ease);
  const hop = S > c1 + .1 && S < c2 ? -Math.sin(seg(S, c1 + .1, c2) * Math.PI) * 120 : 0;
  const closing = (S > c1 && S < c1 + .14) || (S > c2 && S < c2 + .14);
  snip(x, TAPE_Y - 40 + lerp(-500, 0, land) + hop, 20, { eyes: 'determined', mouth: closing ? 'open' : 'grin', aL: -.9, aR: -.9, cutL: closing ? 0 : 1, cutR: closing ? 0 : 1, sq: -.2 * pulse(REAL_S, 9) });
  sparks(800, TAPE_Y, S - c1, 10, 150); sparks(1120, TAPE_Y, S - c2, 10, 150);
  if (S > c1) sfx('SNIP!', 700, 700, 120, PAL.flame, S - c1, { rot: -.15 });
  if (S > c2) sfx('SNIP!', 1230, 660, 130, PAL.gold, S - c2, { rot: .12 });
  camEnd();
});

// bar 23 "Cut it to the good bit": the gold piece rises, turns upright and becomes a vertical clip. Snip holds it up.
shot(barAt(23), barAt(24), (S, lt, dur) => {
  camBegin(960, 960, kf(lt, [[0, 1], [dur, 1.08]]));
  sunburst(960, 820, vc(PAL.gold, PAL.rose), vc(PAL.flameLt, PAL.gold), S * .15);
  ambient(S, 'sparkle', null, 18);
  fanRow(S, VERT ? 470 : 250, VERT ? 1450 : 1670, VERT ? 1720 : 1500, VERT ? 11 : 12, VERT ? 6 : 9, 40, { cheer: true, hop: .6 });
  const k = easeOut(seg(lt, 0, .9));
  const rot = lerp(0, -Math.PI / 2, k), y = lerp(TAPE_Y - 60, 760, k), sc = lerp(1, 1.9, k);
  if (k < .75) {
    push(); translate(960, y); rotate(rot); scale(sc);
    tape(straightTape(-160, 160, 0, 0), 110, { hi: [0, 1], glow: 1 });
    pop();
  }
  const card = seg(lt, .6, 1.0);
  if (card > 0) clipCard(960, 760, 640 * backOut(card), 0, { glow: 1, words: seg(lt, 1.0, 1.9), play: true });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + S * .8, r = 420 + 30 * wob(S, 1, i / 8); if (card > .5) paint(starPts(960 + Math.cos(a) * r, 760 + Math.sin(a) * r * .9, 18 + 8 * pulse(REAL_S + i * .1, 4), .4, 4), { wash: PAL.cream, ink: null }); }
  snip(960, 1330, 20, { eyes: 'happy', mouth: 'grin', aL: 1.35, aR: 1.35, cutL: .2, cutR: .2, dy: -.4 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)), blush: 1 });
  camEnd();
});

// bar 24 "Three hours in, thirty seconds out": the clip machine. The long tape feeds in, Snip cranks, a short clip drops out.
shot(barAt(24), barAt(25), (S, lt, dur) => {
  camBegin(VERT ? 1000 : 980, VERT ? 1000 : 960, VERT ? 1.05 : 1);
  frameWash(vc('#F6DDB8', '#DCEBD2'));
  paint(ellPts(960, 900, 900, 700, 30), { fill: PAL.flameLt, fillOp: 90, bleed: .3, tex: .5, ink: null });
  paint(rectPts(-100, 1300, 2120, 800), { wash: '#E7C49A', ink: null }); inkLine([[-100, 1300], [2020, 1304]], 1);
  const crank = bpOf(REAL_S) * .5;
  // tape pours in from the top left, scrolling
  const scroll = frac(lt * 1.5);
  tape([[80, -80], [300, 120], [560, 300], [760, 470], [900, 540]], 96, { tint: f => mixCol('#6F86A8', '#A7B8C9', hash(Math.floor(f * 12 + scroll * 12))) });
  for (const [gx, gy, gr, dir] of [[VERT ? 640 : 520, 700, 120, 1], [VERT ? 1330 : 1450, 620, 90, -1], [VERT ? 1380 : 1600, 860, 60, 1]]) {
    paint(starPts(gx, gy, gr, .78, 10, crank * TAU * dir * (120 / gr) * .3), { wash: '#E3B98A', washOp: 200, ink: PAL.ink, sw: .9 });
    paint(ellPts(gx, gy, gr * .35, gr * .35, 14), { wash: '#F6DDB8', ink: PAL.ink, sw: .8 });
  }
  ambient(S, 'float', [300, 300, 1320, 900], 8, { glyphs: ['clip'], cols: [PAL.sky, PAL.rose, PAL.gold, PAL.leaf], speed: 60 });
  machine(980, 1300, 1.25, crank);
  { const c = frac(bpOf(REAL_S) * 2) < .3; snip(1150, 770, 6, { eyes: 'determined', mouth: 'grin', aL: .8, aR: .8, cutL: c ? 0 : 1, cutR: c ? 0 : 1, noShadow: true, flip: true }); }
  if (!VERT) { const out2 = seg(lt, .9, 1.2); fan(1720, 1300, 13, { seed: 21, aL: out2 > 0 ? 1.3 : -1.1, aR: out2 > 0 ? 1.1 : -1.1, eyes: out2 > 0 ? 'star' : 'dot', mouth: out2 > 0 ? 'open' : 'o', hop: out2 > 0 ? Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) * .6 : 0, flip: true }); }
  letter('3:00:00', VERT ? 720 : 470, VERT ? 330 : 560, 78, PAL.ink, { font: '700 78px "Fredoka"', rot: -.12, stroke: PAL.cream, shadow: false, pop: seg(lt, 0, .3) * 1.2 });
  // the short clip drops out of the chute and bounces
  const out = seg(lt, .7, 1.3), bx = lerp(1290, VERT ? 1330 : 1470, out), by = lerp(1260, 1180, out) - Math.abs(Math.sin(out * Math.PI * 2)) * 90 * (1 - out);
  if (out > 0) { clipCard(bx, by - 170, VERT ? 260 : 300, .12 * (1 - out), { glow: .8, play: true }); letter('0:30', bx - (VERT ? 20 : 0), by + 30, 84, PAL.flame, { font: '700 84px "Fredoka"', stroke: PAL.cream, shadow: false, pop: seg(lt, 1.0, 1.25) * 1.2 }); }
  snip(VERT ? 640 : 620, 1300, 17, { eyes: 'determined', mouth: 'grin', aL: .2 + .5 * Math.sin(crank * TAU), aR: -.2, cutL: .3, cutR: .8, flip: false, lookX: .6, sq: .12 * pulse(REAL_S, 6) });
  camEnd();
});

// bar 25 "That's the part they talk about": phones pop up everywhere, hearts float, bubbles say wow.
shot(barAt(25), barAt(26), (S, lt, dur) => {
  camBegin(960, 960, kf(lt, [[0, 1.08], [dur, 1]]));
  frameWash(vc(PAL.sky, '#F3B7C2'));
  paint(ellPts(960, 960, 1000, 900, 30), { fill: PAL.cream, fillOp: 110, bleed: .35, tex: .5, ink: null });
  const P = [[960, 820, 0], [620, 700, -.15], [1300, 690, .14], [560, 1150, .1], [1360, 1140, -.12], [960, 300, .06], [960, 1560, -.05], [700, 1720, .12], [1250, 1760, -.1], [640, 260, -.1], [1290, 250, .12]];
  P.forEach(([x, y, r], i) => {
    const t0 = BB(25) + i * BEAT / 2, k = seg(S, t0, t0 + .3); if (k <= 0) return;
    phone(x, y, (i === 0 ? 420 : 300) * backOut(k), r + .05 * wob(S, .7, i / 5), { glow: i === 0 ? .6 : 0, likes: frac((S - t0) * .9 + hash(i)), bg: [PAL.sky, PAL.rose, PAL.leaf, PAL.gold, PAL.lilac][i % 5] });
  });
  ambient(S, 'float', null, 16, { glyphs: ['heart', 'star', 'heart'], cols: [PAL.rose, PAL.gold, PAL.red], speed: 90 });
  if (VERT) fanRow(S, 440, 1480, 1900, 11, 7, 60, { phone: true, eyes: 'happy', mouth: 'open', hop: .4 });
  else { fanRow(S, 60, 420, 1500, 13, 3, 60, { phone: true, eyes: 'happy', mouth: 'open', hop: .4 }); fanRow(S, 1500, 1860, 1500, 13, 3, 64, { phone: true, eyes: 'heart', mouth: 'open', hop: .4 }); }
  const words = ['WOW', 'lol', 'omg', 'haha', 'so true'];
  const BP = VERT ? [[1270, 470], [650, 950], [1300, 960], [640, 1420], [1260, 1430]] : [[1560, 480], [360, 700], [1580, 900], [340, 1180], [1560, 1330]];
  words.forEach((w, i) => { const t0 = BB(25, 1) + i * BEAT * .6; bubble(BP[i][0], BP[i][1], 170 + w.length * 18, 90, w, { pop: seg(S, t0, t0 + .3), col: PAL.cream }); });
  snip(960, 1380, 13, { eyes: 'star', mouth: 'open', aL: 1.3, aR: 1.3, cutL: .5, cutR: .5, dy: -.6 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) });
  camEnd();
});

// bar 26 "Clip it, clip it (snip, snip)": back at the desk, now lit up. The streamer wakes to a clip with a face-tracking
// frame and captions lighting word by word; Snip keeps snipping pieces off the tape.
shot(barAt(26), barAt(27), (S, lt, dur) => {
  camBegin(1010, VERT ? 930 : 880, (VERT ? kf(lt, [[0, 1.15], [dur, 1.25]]) : kf(lt, [[0, 1.1], [dur, 1.18]])) * VZ);
  const wake = seg(lt, 0, .4);
  deskScene(S, { clock: 13, viewers: Math.round(lerp(0, 1280, easeIn(seg(lt, .2, dur)))), eyes: wake < 1 ? 'wide' : 'star', mouth: 'grin', slump: 0, aL: .9, aR: .3, emote: 'spark', emoteK: seg(lt, .2, .5), dawn: .35, glow: 1, cat: { pose: 'sit', eyes: 'wide', lookX: .6 },
    content: (sx, sy, w, h) => { paint(rrPts(sx + 20, sy + 20, w - 40, h - 40, 10), { wash: PAL.sky, washOp: 200, ink: null }); } });
  const bob = 8 * wob(S, .8);
  clipCard(VERT ? 1080 : 1190, (VERT ? 600 : 680) + bob, VERT ? 480 : 420, .04, { glow: .7, track: true, words: seg(lt, .3, dur - .2) });
  const c1 = BB(26, 2), c2 = BB(26, 3), closing = (S > c1 && S < c1 + .14) || (S > c2 && S < c2 + .14);
  snip(VERT ? 1290 : 1470, 1070, 13, { eyes: 'happy', mouth: 'grin', aL: .3, aR: 1.1, cutL: closing ? 0 : .9, cutR: closing ? 0 : .9, dy: -.3 * pulse(REAL_S, 5) });
  for (const [c, x] of [[c1, VERT ? 1340 : 1560], [c2, VERT ? 1370 : 1600]]) {
    const a = S - c; if (a < 0 || a > 1.2) continue;
    clipCard(x + a * 260, 1000 - a * 520 + a * a * 300, 130, a * 2, { face: true, bg: PAL.rose });
    sparks(x, 1000, a, 6, 80);
  }
  camEnd();
});

// bar 27 "Now the whole world's seen it": the globe spins, clips orbit it, hellos pop up in many languages.
shot(barAt(27), barAt(28), (S, lt, dur) => {
  camBegin(960, 930, kf(lt, [[0, 1.12], [dur, 1.0]]));
  frameWash(vc('#2B2356', '#15344A'));
  paint(rectPts(-100, -100, 2120, 2120), { fill: vc(PAL.lilac, PAL.teal), fillOp: 90, bleed: .3, tex: .7, border: .2, ink: null });
  for (let i = 0; i < 26; i++) paint(starPts(hash(i) * 1920, hash(i + 50) * 1920, 6 + hash(i + 7) * 8, .4, 4), { wash: PAL.cream, washOp: 120 + 120 * pulse(REAL_S + i * .07, 3), ink: null });
  ambient(S, 'sparkle', null, 22);
  // a shooting star every other beat
  { const k = frac(bpOf(REAL_S) / 2), sx = 300 + hash(Math.floor(bpOf(REAL_S) / 2)) * 900, sy = 250 + hash(Math.floor(bpOf(REAL_S) / 2) + 5) * 300; if (k < .5) inkLine([[sx + k * 900, sy + k * 400], [sx + k * 900 - 160, sy + k * 400 - 70]], 1.6, PAL.cream, 'ink', 0); }
  globe(960, 930, 330, S * .12);
  for (const [i, off] of [[0, -.95], [1, -.5], [2, .5], [3, .95]]) {
    const a = -Math.PI / 2 + off + .06 * Math.sin(S * .8 + i), gx = 960 + Math.cos(a) * 322, gy = 930 + Math.sin(a) * 322;
    push(); translate(gx, gy); rotate(a + Math.PI / 2);
    fan(0, 0, 8.5, { seed: 80 + i, aR: 1.2 + .4 * Math.sin(S * 6 + i), aL: -1.1, hop: Math.abs(Math.sin((bpOf(REAL_S) + i * .25) * Math.PI)) * .5, eyes: 'happy', mouth: 'open', flip: i > 1 });
    pop();
  }
  for (let i = 0; i < 5; i++) {
    const a = S * .9 + i / 5 * TAU, x = 960 + Math.cos(a) * 520, y = 930 + Math.sin(a) * 200;
    if (Math.sin(a) < 0) clipCard(x, y, 150, .2 * Math.cos(a), { bg: [PAL.rose, PAL.gold, PAL.leaf, PAL.sky, PAL.flameLt][i] });
  }
  for (let i = 0; i < 5; i++) {
    const a = S * .9 + i / 5 * TAU, x = 960 + Math.cos(a) * 520, y = 930 + Math.sin(a) * 200;
    if (Math.sin(a) >= 0) clipCard(x, y, 170, .2 * Math.cos(a), { bg: [PAL.rose, PAL.gold, PAL.leaf, PAL.sky, PAL.flameLt][i] });
  }
  const hellos = VERT ? [['Hola!', 640, 470], ['Olá!', 1290, 480], ['こんにちは', 1160, 1250], ['你好', 700, 1260], ['Hi!', 960, 300], ['Salut!', 960, 1560]]
    : [['Hola!', 560, 560], ['Olá!', 1360, 560], ['こんにちは', 1420, 1240], ['你好', 500, 1240], ['Hi!', 320, 740], ['Salut!', 1610, 740]];
  hellos.forEach(([w, x, y], i) => { const t0 = BB(27) + i * BEAT * .5; bubble(x, y, 110 + w.length * (/[^\x00-\x7F]/.test(w) ? 50 : 30), 96, w, { pop: seg(S, t0, t0 + .3), col: [PAL.cream, PAL.flameLt, PAL.sky, PAL.rose, PAL.gold, PAL.cream][i] }); });
  snip(960, 560 + 20 * wob(S, 1), 11, { eyes: 'happy', mouth: 'open', aL: 1.3, aR: 1.3, cutL: .5, cutR: .5, noLegs: true, rot: .15 * wob(S, .5) });
  camEnd();
});

// bars 28–29 (chorus tail): the full house. Seats packed and bouncing, confetti, Snip and the streamer dance on stage.
shot(barAt(28), barAt(30), (S, lt, dur) => {
  camBegin(960, kf(lt, [[0, 960], [dur, 1000]]), kf(lt, [[0, 1.15], [dur, .98]]));
  frameWash(vc('#5B2B3E', '#1E3A4C'));
  paint(rectPts(-100, -100, 2120, 1300), { fill: vc(PAL.rose, PAL.sky), fillOp: 120, bleed: .3, tex: .6, border: .2, ink: null });
  // spotlights
  for (const [x, c] of [[640, PAL.gold], [1280, PAL.flameLt]]) paint([[x - 60, -100], [x + 60, -100], [x + 330, 1150], [x - 330, 1150]], { fill: c, fillOp: 90 + 60 * pulse(REAL_S, 3), bleed: .25, tex: .2, border: .1, ink: null });
  // stage
  paint(rectPts(-100, 1120, 2120, 140), { wash: PAL.wood, ink: PAL.ink, sw: 1.2 });
  paint(rectPts(-100, 1260, 2120, 900), { wash: '#3A1E2B', ink: null });
  // curtains at the sides of the world
  for (const s of [-1, 1]) paint([[960 + s * 1000, -100], [960 + s * 700, -100], [960 + s * 780, 500], [960 + s * 700, 1120], [960 + s * 1000, 1120]], { wash: PAL.red, ink: PAL.ink, sw: 1.2, curv: .3 });
  const hopS = Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)), hopP = Math.abs(Math.sin(bpOf(REAL_S) * Math.PI + .9));
  streamer(760, 1130 - hopP * 30, 17, { eyes: 'happy', mouth: 'grin', aL: 1.3 * hopP + .2, aR: 1.3 * (1 - hopP) + .2 });
  snip(1170, 1130 - hopS * 80, 24, { eyes: hopS > .5 ? 'star' : 'happy', mouth: 'open', aL: 1.3, aR: 1.3, cutL: hopS, cutR: 1 - hopS, sq: .25 * (1 - hopS) - .1, glow: .5 });
  for (const [i, x] of [[0, VERT ? 560 : 440], [1, VERT ? 1370 : 1480]]) { const h = Math.abs(Math.sin((bpOf(REAL_S) + .5) * Math.PI)); fan(x, 1130 - h * 20, 14, { seed: 90 + i, aL: 1.4 * h + .1, aR: 1.4 * (1 - h) + .1, eyes: 'happy', mouth: 'open', flip: i === 1 }); }
  seats(960, 1400, 11, 4, 1, S);
  confetti(S, barAt(28), 70, [-100, -100, 2120, 2120]);
  if (S > barAt(29) - .02) sfx('CLIP IT!', 960, VERT ? 420 : 640, 150, PAL.gold, S - barAt(29) + .02, { life: 1.6, rot: -.05 });
  camEnd();
});

// ======================= OUTRO: "Three hours in… thirty seconds out" + (Snip!) =======================
// bar 85: dawn. The streamer smiles at a phone full of views; Snip sits on the monitor holding a tiny clip.
shot(barAt(85), barAt(86), (S, lt, dur) => {
  camBegin(1060, 900, kf(lt, [[0, 1.2], [dur, 1.35]]) * VZ);
  deskScene(S, { clock: 6.2, viewers: 24800, eyes: 'happy', mouth: 'smile', slump: 0, aL: .4, aR: -.3, dawn: .9, glow: .8, emote: 'heart', emoteK: seg(lt, .5, .8), cat: { pose: 'sit', eyes: 'happy' },
    content: (sx, sy, w, h) => { for (let i = 0; i < 3; i++) clipCard(sx + w * (.25 + i * .25), sy + h * .55, h * .7, 0, { bg: [PAL.rose, PAL.gold, PAL.leaf][i], face: true }); } });
  snip(1300, 745, 12, { eyes: 'happy', mouth: 'smile', aL: .9, aR: -.6, cutL: .5, cutR: .5, noLegs: false, blush: 1 });
  camEnd();
});

// bar 86 → end: Snip jumps to the centre and cuts the whole picture open on a beat; the halves slide away to the end card.
shot(barAt(86), SONG_DUR + 1, (S, lt, dur) => {
  const tc = BB(86, 2);                                   // the big snip
  const open = seg(S, tc, tc + .45);
  // end card underneath
  frameWash(PAL.cream);
  paint(ellPts(960, 900, 820, 620, 30), { fill: PAL.flameLt, fillOp: 110, bleed: .35, tex: .5, ink: null });
  paint(ellPts(960, 1000, 520, 420, 30), { fill: PAL.rose, fillOp: 40, bleed: .35, tex: .5, ink: null });
  if (open > 0) {
    const k = seg(S, tc + .45, tc + .9);
    letter('Flare', 960 - 150, 720, 170, PAL.ink, { font: '700 170px "Fredoka"', shadow: false, pop: k * 1.1 });
    letter('Clip', 960 + 205, 720, 170, PAL.flame, { font: '700 170px "Fredoka"', shadow: false, pop: k * 1.1 });
    letter('Long video in. Best moments out.', 960, 860, 58, PAL.ink, { font: '600 58px "Fredoka"', shadow: false, alpha: seg(S, tc + .75, tc + 1.05) });
    const u = seg(S, tc + .95, tc + 1.25);
    if (u > 0) { paint(rrPts(960 - 230, 925, 460, 92, 46), { wash: PAL.flame, ink: PAL.ink, sw: 1.1 }); letter('flareclip.com', 960, 972, 50, PAL.cream, { font: '700 50px "Fredoka"', shadow: false, alpha: u }); }
    ambient(S, 'sparkle', [300, 450, 1320, 1150], 14, { col: PAL.gold });
    const pk = backOut(seg(S, tc + .6, tc + 1.0));
    if (pk > .02) {
      cat(1160, 1400, 10 * pk, { pose: 'sit', eyes: 'happy', flip: true });
      fan(720, 1400, 11 * pk, { seed: 3, aL: 1.3 + .3 * wob(S, 2), aR: -1.1, eyes: 'happy', mouth: 'open' });
      fan(1330, 1400, 11 * pk, { seed: 6, aR: 1.3 + .3 * wob(S, 2, .5), aL: -1.1, eyes: 'heart', mouth: 'smile', flip: true });
    }
    snip(960, 1400, 22, { eyes: 'happy', mouth: 'grin', aL: 1.2 + .25 * wob(S, 2), aR: -.4, cutL: .6, cutR: .3, blush: 1, dy: -.2 * Math.abs(Math.sin(bpOf(REAL_S) * Math.PI)) });
  }
  // the old picture as two torn halves sliding apart along a jagged diagonal
  if (open < 1) {
    const d = easeIn(open) * 1500, cut = [];
    for (let i = 0; i <= 14; i++) { const f = i / 14; cut.push([lerp(-200, 2120, f) + (i % 2 ? 40 : -40), lerp(2120, -200, f) + (i % 2 ? -30 : 30)]); }
    const A = [[-400, -400], ...cut.slice().reverse(), [-400, 2400]].map(([x, y]) => [x - d * .7, y - d * .7]);
    const B = [[2400, 2400], ...cut, [2400, -400]].map(([x, y]) => [x + d * .7, y + d * .7]);
    const pre = S < tc;
    for (const P of [A, B]) paint(P, { wash: PAL.night, ink: open > 0 ? PAL.ink : null, sw: 1.6 });
    if (pre) {
      // before the cut: Snip leaps to the centre in front of the dark room
      paint(rectPts(-100, -100, 2120, 2120), { fill: PAL.indigo, fillOp: 120, bleed: .25, tex: .7, border: .2, ink: null });
      const k = seg(S, barAt(86), tc - .05);
      snip(960, lerp(1500, 1150, backOut(k)), 26, { eyes: 'determined', mouth: 'grin', aL: 1.1, aR: 1.1, cutL: 1, cutR: 1, glow: .7, sq: -.2 * (1 - k) });
    } else {
      sparks(960, 960, S - tc, 14, 260);
      sfx('SNIP!', 960, 800, 200, PAL.gold, S - tc, { life: .9 });
    }
  }
});

// ---------- lyrics (aligned against assets/clipit-2min.mp3) ----------
// Times remain in song time; timeline.js maps them into each edit.
lyric(11.74, 13.78, 'Three hours live');
lyric(15.99, 16.95, 'And nobody stayed');
lyric(44.51, 47.52, 'It just needs a little help to escape');
lyric(47.78, 49.21, 'Clip it, clip it (snip, snip)');
lyric(49.59, 50.93, 'Cut it to the good bit');
lyric(51.72, 53.12, 'Three hours in, thirty seconds out');
lyric(53.27, 54.79, "That's the part they talk about");
lyric(55.02, 58.67, 'Clip it, clip it (snip, snip)');
lyric(59.74, 61.65, "Now the whole world's seen it");

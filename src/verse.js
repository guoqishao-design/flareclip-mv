// verse.js: verse 1 and the pre-chorus (bars 6–20), used by the 60 s cut and the full MV.
//   bars 6–8   "Went live at nine, went on and on"        day turns to night at the desk, the tape keeps pouring out
//   bars 9–11  "Said something genius, then it was gone"  a gold idea pops out, rides the tape and sinks into the pile
//   bars 12–14 "Buried at hour two, minute ten"           a cross-section of the pile: layer on layer of tape, the gold deep down
//   bars 15–17 "Nobody's scrolling back again"            a phone feed; the 3-hour video gets swiped past, again and again
//   bars 18–20 "The gold is in there, deep in the tape"   night, the streamer asleep; Snip follows the glow, finds it, leaps up
// Bar 21 (in scenes.js) picks up with Snip on the monitor.

const PILE = [[1390, 990], [1450, 1120], [1400, 1290], [1150, 1380], [800, 1420], [520, 1520], [380, 1700], [520, 1880], [900, 1950]];
const GOLD_AT = [906, 1408];           // where the good bit [.36, .44] of PILE lies on the floor
const talking = S => frac(S * 4) < .5 ? 'o' : 'grin';

// bars 6–8 "Went live at nine, went on and on": the sky outside goes day → dusk → night, the clock spins,
// the streamer talks and waves, the tape pours off the desk and piles up.
shot(barAt(6), barAt(9), (S, lt, dur) => {
  const k = lt / dur;
  camBegin(kf(lt, [[0, VERT ? 1000 : 930], [dur, 1000]]), kf(lt, [[0, 930], [dur, 1010]]), kf(lt, [[0, VERT ? 1.2 : 1.3], [dur, 1.08]]) * VZ);
  const sky = k < .5 ? mixCol('#8EC5E8', '#F2A07B', k * 2) : mixCol('#F2A07B', '#141A3A', (k - .5) * 2);
  const wall = k < .5 ? mixCol('#A99BC4', '#8A5F86', k * 2) : mixCol('#8A5F86', PAL.night, (k - .5) * 2);
  const viewers = Math.round(lerp(2, 46, easeOut(seg(k, 0, .45))) - 30 * seg(k, .55, 1));
  deskScene(S, { clock: 9 + k * 9, viewers, wall, sky, skyOp: 255 * (1 - seg(k, .75, 1)), sun: [lerp(560, 760, k), lerp(410, 600, k), 255 * (1 - seg(k, .35, .6))],
    eyes: pulse(REAL_S, 5) > .6 ? 'happy' : 'open', mouth: talking(S), aL: -1.1, aR: .3 + 1.0 * pulse(REAL_S, 3), glow: .6, night: seg(k, .45, .9), cat: k < .6 ? { pose: 'sit', eyes: 'open', lookX: -.5 } : { pose: 'loaf' },
    content: (sx, sy, w, h) => { for (let i = 0; i < 3; i++) paint(rrPts(sx + 30, sy + 100 + i * 40, 140 + hash(i + Math.floor(S * 2)) * 180, 20, 10), { wash: PAL.cream, washOp: 150, ink: null }); } });
  tape(subPath(PILE, .15 + .85 * easeOut(k)), 84, { labels: { every: 2, fmt: f => hms(f * 10800) } });
  if (S >= barAt(6)) sfx('LIVE!', VERT ? 1000 : 1150, VERT ? 610 : 640, 120, PAL.red, S - barAt(6), { life: 1.5, rot: -.08 });
  camEnd();
});

// bars 9–11 "Said something genius, then it was gone"
shot(barAt(9), barAt(12), (S, lt, dur) => {
  const idea = BB(9, 2), into = BB(10, 1), outOf = BB(10, 2);
  camBegin(kf(S, [[barAt(9), 960], [barAt(11), 980], [barAt(12), 1000]]), kf(S, [[barAt(9), 900], [barAt(11), 930], [barAt(12) - .3, 1230]]),
    kf(S, [[barAt(9), 1.25], [barAt(11), 1.2], [barAt(12) - .3, 1.3]]) * VZ);
  const gotIt = S > idea && S < into + .6;
  deskScene(S, { clock: 19.5 + lt * .3, viewers: 16, cat: gotIt ? { pose: 'sit', eyes: 'wide', lookX: -.6 } : { pose: 'loaf' }, eyes: gotIt ? 'star' : 'open', mouth: gotIt ? 'grin' : talking(S), aL: gotIt ? 1.2 : -1.1, aR: gotIt ? 1.3 : .2 + .6 * pulse(REAL_S, 3), glow: .6 });
  // the gold moment rides the tape: its position along the pile goes from the monitor (0) to .40, then more tape covers it
  const ride = seg(S, outOf, barAt(11) + BEAT * 3), f = lerp(.0, .40, easeOut(ride));
  const shine = 1 - seg(S, barAt(11) + BEAT * 2, barAt(12));
  tape(PILE, 84, { hi: S > outOf ? [Math.max(0, f - .04), f + .04] : null, glow: .9 * shine, labels: { every: 2, fmt: q => hms(q * 10800) } });
  // more tape slides over it: two strips, then it is gone
  const cover = seg(S, barAt(11) + BEAT * 2, barAt(12) - .2);
  if (cover > 0) {
    tape(subPath([[1500, 1330], [1200, 1400], [950, 1395], [700, 1430], [500, 1480]], easeOut(cover)), 84, { seed: 7 });
    tape(subPath([[380, 1330], [700, 1420], [980, 1440], [1250, 1470]], easeOut(seg(cover, .3, 1))), 84, { seed: 11 });
  }
  // the idea bubble: pops from the mouth, then flies into the screen
  if (S > idea && S < into + .5) {
    const pk = seg(S, idea, idea + .3), fly = easeIn(seg(S, into - .1, into + .4));
    const bx = lerp(900, 1190, fly), by = lerp(700, 860, fly) - 20 * Math.sin(S * 6), sc = backOut(pk) * (1 - fly * .9);
    push(); translate(bx, by); scale(sc);
    paint(rrPts(-120, -85, 240, 170, 70), { wash: PAL.gold, ink: PAL.ink, sw: 1.2 });
    paint([[-60, 70], [-10, 70], [-120, 140]], { wash: PAL.gold, ink: PAL.ink, sw: 1.2 });
    paint(rectPts(-70, 55, 70, 30), { wash: PAL.gold, ink: null });
    paint(starPts(0, 0, 58 + 6 * pulse(REAL_S, 4), .45, 5), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    pop();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + S * 2, r = 170 * sc; paint(starPts(bx + Math.cos(a) * r, by + Math.sin(a) * r * .8, 14 * sc, .4, 4), { wash: PAL.cream, ink: null }); }
  }
  if (S > idea) sfx('!!', 760, 560, 110, PAL.gold, S - idea, { life: 1.0, rot: .1 });
  camEnd();
});

// bars 12–14 "Buried at hour two, minute ten": a cross-section under the desk; layer on layer of tape, the gold deep down
const LAYER_Y0 = 380, LAYER_DY = 150, GOLD_ROW = 8;       // gold row at y = 1580
shot(barAt(12), barAt(15), (S, lt, dur) => {
  camBegin(960, kf(lt, [[0, VERT ? 700 : 620], [dur * .55, VERT ? 1350 : 1330], [dur, 1420]]), VERT ? 1.0 : 1.05);
  const [vx, vy, vw, vh] = viewRect();
  frameWash('#3E2A20');
  paint(rectPts(vx, vy, vw, vh), { fill: '#6B4A33', fillOp: 110, bleed: .3, tex: .8, border: .2, ink: null });
  // the surface: the room floor with the desk legs
  if (vy < 160) paint(rectPts(vx, vy, vw, 160 - vy), { wash: PAL.night, ink: null });
  paint(rectPts(-200, 160, 2320, 90), { wash: PAL.woodDk, ink: PAL.ink, sw: 1.2 });
  for (const x of [800, 1400]) paint(rectPts(x - 14, -200, 28, 360), { wash: PAL.woodDk, ink: PAL.ink, sw: 1 });
  // layers of tape, each drifting sideways a little
  for (let i = 0; i < 12; i++) {
    const y = LAYER_Y0 + i * LAYER_DY, dir = i % 2 ? 1 : -1, off = dir * lt * 40 + hash(i) * 200;
    const path = []; for (let j = 0; j <= 10; j++) { const x = -400 + j * 280 + off; path.push([x, y + 18 * Math.sin(j * 1.3 + i)]); }
    const isGold = i === GOLD_ROW, t0 = i * 900;
    tape(path, 92, { seed: i * 13, hi: isGold ? [.47, .53] : null, glow: isGold ? .35 + .55 * pulse(REAL_S, 3) : 0, labels: { every: 5, fmt: f => hms(t0 + f * 1800), alpha: .6 } });
  }
  // pebbles between the layers
  for (let i = 0; i < 40; i++) paint(ellPts(hash(i) * 2000 - 40, LAYER_Y0 + 75 + Math.floor(hash(i + 3) * 11) * LAYER_DY + (hash(i + 5) - .5) * 30, 10 + hash(i + 7) * 12, 7 + hash(i + 8) * 8, 10), { wash: '#8A6A50', washOp: 200, ink: null });
  // the tag on the gold
  const gy = LAYER_Y0 + GOLD_ROW * LAYER_DY, tag = seg(S, BB(13, 1), BB(13, 1) + .35);
  if (tag > 0) { paint(rrPts(960 - 150, gy - 170, 300, 84, 30), { wash: PAL.gold, ink: PAL.ink, sw: 1.1 }); letter('2:10:00', 960, gy - 127, 54 * backOut(tag), PAL.ink, { font: `700 ${Math.round(54 * backOut(tag))}px "Fredoka"`, shadow: false }); inkLine([[960, gy - 86], [960, gy - 50]], 1.2); }
  camEnd();
});

// bars 15–17 "Nobody's scrolling back again": a phone feed; the thumb swipes the 3-hour video away on every other beat
shot(barAt(15), barAt(18), (S, lt, dur) => {
  camBegin(960, 960, VERT ? 1.0 : .8);
  const BG = '#CDBBE3';
  frameWash(BG);
  const PH = 1250, PW = 700, px = 960 - PW / 2, py = 960 - PH / 2, top = py + 90, bot = py + PH - 70;
  // the feed: swipes land on beats 0 and 2 of each bar
  const b = bpOf(S) - bpOf(barAt(15)), n = Math.floor(b / 2), sw = easeOut(seg((b / 2 - n) * 2, 0, .55));
  const ITEM = 430, scroll = (n + sw) * ITEM;
  const BODY = '#26222F';
  paint(rrPts(px, py, PW, PH, 45), { wash: BODY, ink: null });
  paint(rrPts(px + 22, top, PW - 44, bot - top, 24), { wash: PAL.cream, ink: null });
  const first = Math.floor(scroll / ITEM) - 1;
  for (let i = first; i < first + 5; i++) {
    const y = top + 30 + i * ITEM - scroll; if (y > bot || y + 380 < top) continue;
    const cx = 960, tw = 600, th = 338;
    paint(rrPts(cx - tw / 2, y, tw, th, 22), { wash: mixCol('#6F86A8', '#8F9FB4', hash(i)), ink: PAL.ink, sw: 1 });
    // a tiny sleepy streamer in the thumbnail
    paint(ellPts(cx - 60, y + 190, 70, 44, 18), { wash: PAL.teal, washOp: 200, ink: null });
    paint(ellPts(cx - 60, y + 130, 40, 42, 18), { wash: '#F4CFAE', washOp: 220, ink: null });
    paint(ellPts(cx, y + th / 2, 46, 46, 18), { wash: PAL.cream, washOp: 210, ink: null });
    paint([[cx - 14, y + th / 2 - 22], [cx + 24, y + th / 2], [cx - 14, y + th / 2 + 22]], { wash: PAL.ink, ink: null });
    paint(rrPts(cx + tw / 2 - 180, y + th - 64, 160, 48, 14), { wash: '#1F1B28', washOp: 230, ink: null });
    if (y + th - 39 > top + 20 && y + th - 39 < bot - 20) letter('3:00:00', cx + tw / 2 - 100, y + th - 39, 32, PAL.cream, { font: '700 32px "Fredoka"', shadow: false });
    paint(rrPts(cx - tw / 2, y + th + 18, 420, 22, 11), { wash: '#B7AFC4', ink: null });
    if (y + th + 62 > top + 20 && y + th + 62 < bot - 20) letter(`${[3, 0, 1, 2, 0][((i % 5) + 5) % 5]} views`, cx - tw / 2 + 60, y + th + 62, 26, '#8C8499', { font: '600 26px "Fredoka"', shadow: false });
  }
  // cover what scrolled out of the screen, then the phone's top and bottom caps and outline
  paint(rectPts(px - 60, py - 600, PW + 120, 600), { wash: BG, ink: null });
  paint(rectPts(px - 60, py + PH, PW + 120, 600), { wash: BG, ink: null });
  paint(rrPts(px, py, PW, top - py, 45), { wash: BODY, ink: null });
  paint(rrPts(px, bot, PW, py + PH - bot, 35), { wash: BODY, ink: null });
  paint(rrPts(px, py, PW, PH, 45), { ink: PAL.ink, sw: 1.6 });
  paint(rrPts(960 - 60, py + 32, 120, 26, 13), { wash: '#0E0C14', ink: null });
  // the thumb, flicking up on each swipe
  const tk = (b / 2 - n) * 2, flick = tk < .6 ? Math.sin(seg(tk, 0, .6) * Math.PI) : 0;
  const thx = 1130 - 40 * flick, thy = 1330 - 360 * flick;
  paint(limbPts([[thx + 160, thy + 420], [thx + 40, thy + 140], [thx, thy]], 150, 110), { wash: '#F1C7A5', ink: PAL.ink, sw: 1.2, curv: .4 });
  paint(ellPts(thx + 4, thy + 20, 36, 44, 14, 0, -.3), { wash: '#FBE3D2', washOp: 200, ink: PAL.ink, sw: .8 });
  // reactions
  const W4 = ['skip', 'too long', 'next', 'zzz'], P4 = VERT ? [[560, 520], [1350, 800], [560, 1160], [1350, 1420]] : [[380, 560], [1540, 780], [380, 1180], [1540, 1400]];
  ambient(S, 'float', null, 10, { glyphs: ['clip'], cols: ['#B7AFC4', '#A89FB8'], speed: 40 });
  W4.forEach((w, i) => {
    const t0 = BB(15, 1) + i * BEAT * 2, left = P4[i][0] < 960, fs = VERT ? 8.5 : 12, fx = P4[i][0] + (left ? -20 : 20), fy = P4[i][1] + (VERT ? 150 : 200);
    fan(fx, fy, fs, { seed: 30 + i, phone: true, aR: .9, aL: -1.1, eyes: i === 3 ? 'closed' : 'dot', mouth: i === 3 ? 'o' : 'flat', flip: !left });
    bubble(P4[i][0], P4[i][1] - (VERT ? 20 : 40), 150 + w.length * 22, 90, w, { pop: seg(S, t0, t0 + .3), col: i % 2 ? PAL.cream : '#F3E1A9' });
  });
  camEnd();
});

// bars 18–20 "The gold is in there, deep in the tape": night again, the streamer asleep. Snip walks along the pile,
// the gold pulses under it; Snip finds it, gears up, and leaps onto the monitor (where bar 21 picks up).
shot(barAt(18), barAt(21), (S, lt, dur) => {
  const find = BB(19, 2), jump = BB(20, 3);
  camBegin(kf(S, [[barAt(18), 960], [find, 980], [BB(20, 2), 1000], [barAt(21), 1000]]), kf(S, [[barAt(18), 1330], [find, 1300], [BB(20, 2), 1150], [barAt(21), 960]]),
    kf(S, [[barAt(18), 1.7], [find, 1.6], [BB(20, 2), 1.3], [barAt(21), 1.1]]) * VZ);
  deskScene(S, { clock: 23.2 + lt * .1, viewers: 0, eyes: 'closed', mouth: 'o', slump: .9, emote: 'zzz' });
  tape(PILE, 84, { hi: [.36, .44], glow: .25 + .5 * pulse(REAL_S, 3) });
  // Snip: walks in from the right, sniffing, stops at the glow, looks down, then at us, snips twice, leaps
  let x, y = 1360, o = { eyes: 'normal', mouth: 'smile', aL: -.3, aR: -.3, cutL: .8, cutR: .8, lookY: .6, lookX: -.4 };
  if (S < find) { x = kf(S, [[barAt(18), 1560], [find, 1010]], x => x); o = { ...o, walk: S * 14, dy: -.15 * Math.abs(Math.sin(S * 7)), flip: true }; }
  else if (S < BB(20, 0)) { x = 1010; o = { ...o, eyes: 'wide', mouth: 'o', lookY: 1, lookX: -.6, glow: .4 * pulse(REAL_S, 3), sq: -.1 * pulse(REAL_S, 6) }; }
  else if (S < jump) {
    x = 1010; const closing = (S > BB(20, 1) && S < BB(20, 1) + .14) || (S > BB(20, 2) && S < BB(20, 2) + .14);
    o = { eyes: 'determined', mouth: closing ? 'open' : 'grin', aL: .9, aR: .9, cutL: closing ? 0 : 1, cutR: closing ? 0 : 1, glow: .5, sq: -.15 * pulse(REAL_S, 8), lookX: .3 };
  } else {
    const j = seg(S, jump, barAt(21));
    x = lerp(1010, 1250, j); y = lerp(1360, 830, j) - Math.sin(j * Math.PI) * 260;
    o = { eyes: 'determined', mouth: 'grin', aL: 1.2, aR: 1.2, cutL: 1, cutR: 1, sq: .2 - .4 * Math.sin(j * Math.PI), glow: .5, noLegs: false };
  }
  snip(x, y, 15, o);
  if (S > find) sfx('!', 1010, 1130, 110, PAL.gold, S - find, { life: .9 });
  if (S > BB(20, 1)) sparks(1110, 1270, S - BB(20, 1), 6, 80);
  if (S > BB(20, 2)) sparks(910, 1270, S - BB(20, 2), 6, 80);
  camEnd();
});

// Aligned against assets/clipit-2min.mp3 (song time, not edit time).
lyric(23.99, 28.00, 'Went live at nine, went on and on');
lyric(28.71, 30.68, 'Said something genius, then it was gone');
lyric(31.42, 34.13, 'Buried at hour two, minute ten');
lyric(34.91, 37.82, "Nobody's scrolling back again");
lyric(39.80, 44.00, 'The gold is in there, deep in the tape');

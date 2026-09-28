// cast2.js: extra characters (the cat, fans) and set dressing (room decor, ambient particles, sky bits).
// Loaded after chars.js and props.js.

// ---------- Mochi, the streamer's cat ----------
// cat(x, y, u, o): (x, y) = the surface it sits on, centre of the body. u ≈ 1/10 of its length.
// o: pose 'loaf' (asleep, curled) | 'sit' | 'pounce'; eyes 'open' | 'closed' | 'happy' | 'wide'; lookX; flip; tail (phase)
const CAT = { fur: '#E9A45E', dark: '#C1733A', belly: '#FBE6CB' };
function cat(x, y, u, o = {}) {
  const t = S, pose = o.pose || 'sit', sw = Math.max(.6, u / 12);
  push(); translate(x, y); if (o.flip) scale(-1, 1); rotate(o.rot || 0);
  const ear = (hx, hy, r, s) => {
    const tw = s > 0 ? .1 * Math.max(0, Math.sin(t * 5 + 1)) ** 20 : 0;   // an occasional twitch
    paint([[hx + s * r * .25, hy - r * .6], [hx + s * r * (.75 + tw), hy - r * 1.45], [hx + s * r * .95, hy - r * .25]], { wash: CAT.fur, ink: PAL.ink, sw });
    paint([[hx + s * r * .45, hy - r * .6], [hx + s * r * .75, hy - r * 1.15], [hx + s * r * .82, hy - r * .45]], { wash: PAL.rose, washOp: 160, ink: null });
  };
  const face = (hx, hy, r, eyes) => {
    for (const s of [-1, 1]) {
      const ex = hx + s * r * .42 + (o.lookX || 0) * r * .1, ey = hy - r * .05;
      if (eyes === 'closed') inkLine([[ex - r * .2, ey], [ex, ey + r * .1], [ex + r * .2, ey]], sw);
      else if (eyes === 'happy') inkLine([[ex - r * .2, ey + r * .06], [ex, ey - r * .12], [ex + r * .2, ey + r * .06]], sw);
      else { paint(ellPts(ex, ey, r * .16, r * (eyes === 'wide' ? .24 : .2), 12), { wash: PAL.ink, ink: null }); paint(ellPts(ex - r * .05, ey - r * .07, r * .05, r * .05, 8), { wash: PAL.cream, ink: null }); }
    }
    paint([[hx - r * .1, hy + r * .2], [hx + r * .1, hy + r * .2], [hx, hy + r * .32]], { wash: PAL.rose, ink: null });
    inkLine([[hx - r * .22, hy + r * .42], [hx - r * .1, hy + r * .5], [hx, hy + r * .38], [hx + r * .1, hy + r * .5], [hx + r * .22, hy + r * .42]], sw * .8, PAL.ink, 'inkfine', .4);
    for (const s of [-1, 1]) for (const k of [0, 1]) inkLine([[hx + s * r * .45, hy + r * (.28 + k * .12)], [hx + s * r * 1.05, hy + r * (.18 + k * .22)]], sw * .5, PAL.ink, 'inkfine', 0);
  };
  if (pose === 'loaf') {
    const br = 1 + .04 * Math.sin(t * 2.2);                         // breathing
    paint(limbPts([[4.2 * u, -.8 * u], [5.6 * u, -.2 * u], [4.4 * u, .4 * u], [1 * u, .5 * u]], 1.0 * u, .7 * u), { wash: CAT.fur, ink: PAL.ink, sw, curv: .5 });
    paint(ellPts(0, -2.6 * u * br, 5 * u, 2.8 * u * br, 26), { wash: CAT.fur, ink: PAL.ink, sw: sw * 1.1 });
    for (let i = 0; i < 3; i++) inkLine([[-1 * u + i * 1.5 * u, -5 * u * br], [-.6 * u + i * 1.5 * u, -3.9 * u * br]], sw * 1.2, CAT.dark, 'ink', .3);
    const hx = -4 * u, hy = -3.4 * u, r = 2.5 * u;
    ear(hx, hy, r, -1); ear(hx, hy, r, 1);
    paint(ellPts(hx, hy, r, r * .9, 22), { wash: CAT.fur, ink: PAL.ink, sw });
    face(hx, hy, r, o.eyes || 'closed');
    if (!o.eyes || o.eyes === 'closed') {   // little z's
      const z = frac(t * .4);
      letter('z', x + (o.flip ? 1 : -1) * (hx - r * .5 - z * 30), y + hy - r * 1.4 - z * 60, 30 + 16 * z, PAL.indigo, { font: '700 30px "Fredoka"', alpha: 1 - z, shadow: false });
    }
  } else {
    const lift = pose === 'pounce' ? -2 * u : 0;
    const tw = Math.sin(t * 3 + (o.tail || 0));
    paint(limbPts([[2.2 * u, -1 * u], [4.2 * u, -2.5 * u + tw * .6 * u], [4.4 * u + tw * u, -5.5 * u], [3.4 * u + tw * 1.4 * u, -7 * u]], 1.0 * u, .6 * u), { wash: CAT.fur, ink: PAL.ink, sw, curv: .5 });
    paint(ellPts(0, -3.4 * u + lift, 3.1 * u, 3.6 * u, 24), { wash: CAT.fur, ink: PAL.ink, sw: sw * 1.1 });
    paint(ellPts(0, -2.8 * u + lift, 1.7 * u, 2.4 * u, 18), { wash: CAT.belly, washOp: 220, ink: null });
    for (const s of [-1, 1]) paint(ellPts(s * 1.2 * u, -.35 * u + lift, 1 * u, .6 * u, 14), { wash: CAT.belly, ink: PAL.ink, sw: sw * .9 });
    for (let i = 0; i < 2; i++) inkLine([[-2.9 * u, -4.5 * u + i * 1.1 * u + lift], [-2.1 * u, -4.2 * u + i * 1.1 * u + lift]], sw * 1.1, CAT.dark);
    const hx = 0, hy = -8 * u + lift + .2 * u * Math.sin(t * 1.5), r = 2.7 * u;
    ear(hx, hy, r, -1); ear(hx, hy, r, 1);
    paint(ellPts(hx, hy, r, r * .9, 22), { wash: CAT.fur, ink: PAL.ink, sw });
    for (let i = -1; i <= 1; i++) inkLine([[hx + i * r * .3, hy - r * .85], [hx + i * r * .25, hy - r * .55]], sw, CAT.dark);
    face(hx, hy, r, o.eyes || 'open');
  }
  pop();
}

// ---------- fans: little people with phones, all slightly different ----------
// fan(x, y, s, o): (x, y) = feet. s ≈ 1/10 of their height. o: seed, aL, aR (+ raised), eyes 'dot' | 'happy' | 'heart' | 'star' | 'closed',
// mouth 'smile' | 'open' | 'o' | 'flat', phone (true = holding one up), hop (0..1 lift), flip, bubble text
const SKIN = ['#F4CFAE', '#E0AC83', '#C68A62', '#8D5B3E', '#F7DCC4'];
const HAIR = ['#2E2233', '#5A3A2A', '#C98A3E', '#8A2F3C', '#1F2A4A', '#D9D2C8'];
const SHIRT = [PAL.rose, PAL.gold, PAL.leaf, PAL.sky, PAL.lilac, PAL.flame, '#E6E0D2', PAL.red];
function fan(x, y, s, o = {}) {
  const id = o.seed ?? 0, sw = Math.max(.5, s / 13);
  const skin = SKIN[Math.floor(hash(id * 3.1) * SKIN.length)], hair = HAIR[Math.floor(hash(id * 5.7) * HAIR.length)];
  const shirt = SHIRT[Math.floor(hash(id * 7.3) * SHIRT.length)], style = Math.floor(hash(id * 9.9) * 5);
  push(); translate(x, y - (o.hop || 0) * 1.6 * s); if (o.flip) scale(-1, 1);
  // legs
  for (const d of [-1, 1]) {
    paint(limbPts([[d * .7 * s, -3.2 * s], [d * .75 * s, -.3 * s]], .95 * s, .8 * s), { wash: '#39406B', ink: PAL.ink, sw, curv: .2 });
    paint(ellPts(d * .9 * s, -.2 * s, .7 * s, .32 * s, 10), { wash: PAL.cream, ink: PAL.ink, sw: sw * .8 });
  }
  // arms (behind the body when lowered)
  const arm = (d, ang) => {
    const a = d > 0 ? -ang : Math.PI + ang, shx = d * 1.5 * s, shy = -6.4 * s;
    const ex = shx + Math.cos(a) * 1.6 * s, ey = shy + Math.sin(a) * 1.6 * s, hx = ex + Math.cos(a + d * .35) * 1.4 * s, hy = ey + Math.sin(a + d * .35) * 1.4 * s;
    paint(limbPts([[shx, shy], [ex, ey], [hx, hy]], .8 * s, .6 * s), { wash: shirt, ink: PAL.ink, sw, curv: .4 });
    paint(ellPts(hx, hy, .38 * s, .38 * s, 10), { wash: skin, ink: PAL.ink, sw: sw * .7 });
    return [hx, hy];
  };
  // torso
  paint(rrPts(-1.8 * s, -7 * s, 3.6 * s, 4.2 * s, 1.2 * s), { wash: shirt, ink: PAL.ink, sw });
  const hL = arm(-1, o.aL ?? -1.2), hR = arm(1, o.aR ?? -1.2);
  if (o.phone) { const [px, py] = o.aR > .3 ? hR : hL; paint(rrPts(px - .45 * s, py - 1.5 * s, .9 * s, 1.6 * s, .2 * s), { wash: '#26222F', ink: PAL.ink, sw: sw * .7 }); paint(rrPts(px - .33 * s, py - 1.38 * s, .66 * s, 1.3 * s, .12 * s), { wash: PAL.sky, washOp: 220, ink: null }); }
  // head
  const hy = -9.3 * s, r = 2.3 * s;
  if (style === 3) paint(rrPts(-r * 1.1, hy - r * .4, r * 2.2, r * 2.6, r * .9), { wash: hair, ink: PAL.ink, sw });   // long hair behind
  paint(ellPts(0, hy, r, r * 1.05, 20), { wash: skin, ink: PAL.ink, sw });
  if (style === 0) paint([[-r * 1.05, hy], [-r * .8, hy - r * .9], [0, hy - r * 1.2], [r * .8, hy - r * .9], [r * 1.05, hy], [r * .3, hy - r * .55], [-r * .4, hy - r * .5]], { wash: hair, ink: PAL.ink, sw, curv: .5 });
  else if (style === 1) { paint(ellPts(0, hy - r * 1.25, r * .5, r * .45, 12), { wash: hair, ink: PAL.ink, sw }); paint([[-r * 1.02, hy - r * .1], [-r * .7, hy - r * .95], [r * .7, hy - r * .95], [r * 1.02, hy - r * .1], [0, hy - r * .6]], { wash: hair, ink: PAL.ink, sw, curv: .5 }); }
  else if (style === 2) { paint([[-r * 1.1, hy - r * .35], [-r * .9, hy - r * 1.05], [r * .9, hy - r * 1.05], [r * 1.1, hy - r * .35]], { wash: shirt, ink: PAL.ink, sw, curv: .4 }); paint(rrPts(0, hy - r * .5, r * 1.4, r * .28, r * .14), { wash: shirt, ink: PAL.ink, sw: sw * .8 }); }   // cap
  else if (style === 3) paint([[-r * 1.05, hy - r * .1], [-r * .7, hy - r * 1], [r * .7, hy - r * 1], [r * 1.05, hy - r * .1], [r * .2, hy - r * .5]], { wash: hair, ink: null, curv: .5 });
  else for (let i = -2; i <= 2; i++) paint([[i * r * .38 - r * .2, hy - r * .7], [i * r * .45, hy - r * 1.35 - hash(id + i) * r * .3], [i * r * .38 + r * .2, hy - r * .7]], { wash: hair, ink: PAL.ink, sw: sw * .8 });   // spiky
  // face
  const eyes = o.eyes || 'dot', ey = hy + r * .1;
  for (const d of [-1, 1]) {
    const ex = d * r * .4;
    if (eyes === 'happy' || eyes === 'closed') inkLine([[ex - r * .18, ey + (eyes === 'happy' ? r * .05 : 0)], [ex, ey + (eyes === 'happy' ? -r * .12 : r * .1)], [ex + r * .18, ey + (eyes === 'happy' ? r * .05 : 0)]], sw);
    else if (eyes === 'heart') paint(heartPts(ex, ey, r * .26), { wash: PAL.rose, ink: PAL.ink, sw: sw * .6 });
    else if (eyes === 'star') paint(starPts(ex, ey, r * .26, .45, 5), { wash: PAL.gold, ink: PAL.ink, sw: sw * .6 });
    else paint(ellPts(ex, ey, r * .12, r * .15, 10), { wash: PAL.ink, ink: null });
  }
  for (const d of [-1, 1]) paint(ellPts(d * r * .62, ey + r * .35, r * .18, r * .1, 8), { wash: PAL.rose, washOp: 130, ink: null });
  const m = o.mouth || 'smile', my = hy + r * .55;
  if (m === 'open') paint(ellPts(0, my, r * .25, r * .2, 12), { wash: PAL.ember, ink: PAL.ink, sw: sw * .7 });
  else if (m === 'o') paint(ellPts(0, my, r * .12, r * .15, 10), { wash: PAL.ember, ink: PAL.ink, sw: sw * .7 });
  else if (m === 'flat') inkLine([[-r * .2, my], [r * .2, my]], sw);
  else inkLine([[-r * .25, my - r * .05], [0, my + r * .12], [r * .25, my - r * .05]], sw);
  pop();
  if (o.bubble) bubble(x + (o.flip ? -1 : 1) * 3.2 * s, y - 13.5 * s - (o.hop || 0) * 1.6 * s, 60 + o.bubble.length * 22, 70, o.bubble, { pop: o.bubbleK ?? 1, col: o.bubbleCol || PAL.cream });
}
// a cheering crowd row: n fans across [x0, x1] at y, bouncing on the beat
function fanRow(S, x0, x1, y, s, n, seed = 0, o = {}) {
  for (let i = 0; i < n; i++) {
    const id = seed + i, x = lerp(x0, x1, (i + .5) / n) + (hash(id + 1) - .5) * 30, ph = hash(id + 2);
    const hop = Math.abs(Math.sin((bpOf(S) + ph * .5) * Math.PI)) * (o.hop ?? .5);
    const up = o.cheer ? 1.1 + .4 * Math.sin(bpOf(S) * Math.PI + ph * 6) : -1.1;
    fan(x, y, s * (.9 + hash(id + 3) * .2), { seed: id, hop, aL: o.cheer ? up : -1.1, aR: o.cheer ? 2.2 - up : (o.phone ? .9 : -1.1), phone: o.phone, eyes: o.eyes || ['happy', 'dot', 'star', 'heart'][id % 4], mouth: o.mouth || (id % 3 ? 'open' : 'smile'), flip: id % 2 === 1 });
  }
}

// ---------- ambient particles (deterministic in S) ----------
// kind: 'dust' (motes in lamp light) | 'sparkle' (twinkling stars) | 'float' (glyphs drifting up) | 'bokeh'
function ambient(S, kind, area, n = 20, o = {}) {
  const [ax, ay, aw, ah] = area || viewRect(0);
  for (let i = 0; i < n; i++) {
    const sp = o.speed ?? 30, h1 = hash(i * 1.7 + 3), h2 = hash(i * 2.3 + 7), h3 = hash(i * 3.1 + 11);
    const y = ay + ah - frac(h2 + S * sp * (.5 + h3) / ah) * ah, x = ax + h1 * aw + Math.sin(S * (.6 + h3) + i) * 30;
    if (kind === 'dust') paint(ellPts(x, y, 4 + h3 * 4, 4 + h3 * 4, 8), { wash: PAL.flameLt, washOp: 90 + 100 * Math.sin(S * 2 + i) ** 2, ink: null });
    else if (kind === 'sparkle') { const tw = pulse(S + h1 * 2, 3); paint(starPts(ax + h1 * aw, ay + h2 * ah, (8 + 12 * h3) * (.5 + tw), .38, 4, S * .5 + i), { wash: o.col || PAL.cream, washOp: 140 + 115 * tw, ink: null }); }
    else if (kind === 'bokeh') paint(ellPts(ax + h1 * aw + Math.sin(S * .3 + i) * 40, ay + h2 * ah, 30 + 50 * h3, 30 + 50 * h3, 20), { fill: o.cols ? o.cols[i % o.cols.length] : PAL.cream, fillOp: 50 + 30 * Math.sin(S + i) ** 2, bleed: .3, tex: .2, border: .1, ink: null });
    else if (kind === 'float') {
      const g = (o.glyphs || ['heart', 'star', 'note'])[i % (o.glyphs || ['heart', 'star', 'note']).length], r = 14 + h3 * 14, c = o.cols ? o.cols[i % o.cols.length] : PAL.rose;
      if (g === 'heart') paint(heartPts(x, y, r), { wash: c, washOp: 200, ink: PAL.ink, sw: .7 });
      else if (g === 'star') paint(starPts(x, y, r, .45, 5, S * .8 + i), { wash: c, washOp: 220, ink: PAL.ink, sw: .7 });
      else if (g === 'note') { paint(ellPts(x, y, r * .7, r * .5, 12, 0, -.4), { wash: c, ink: PAL.ink, sw: .7 }); inkLine([[x + r * .6, y - r * .1], [x + r * .6, y - r * 2]], 1.1); inkLine([[x + r * .6, y - r * 2], [x + r * 1.3, y - r * 1.5]], 1.1); }
      else if (g === 'clip') clipCard(x, y, r * 3, Math.sin(S + i) * .3, { bg: c, play: true, face: false });
    }
  }
}

// ---------- sky bits ----------
function cloud(x, y, w, col = PAL.cream, op = 220) {
  paint([[x - w / 2, y], [x - w * .42, y - w * .18], [x - w * .2, y - w * .3], [x + w * .05, y - w * .36], [x + w * .28, y - w * .26], [x + w * .45, y - w * .12], [x + w / 2, y]], { wash: col, washOp: op, ink: PAL.ink, sw: .9, curv: .6 });
}
function bird(x, y, s, flap) {
  const a = Math.sin(flap) * .6;
  inkLine([[x - s, y - s * a], [x - s * .4, y - s * .2], [x, y + s * .1], [x + s * .4, y - s * .2], [x + s, y - s * a]], 1.1, PAL.ink, 'ink', .5);
}

// ---------- the streamer's room: extra set dressing ----------
// wall decor behind everything in deskScene; lights react to the beat. night 0..1 turns the string lights on.
function roomDecor(S, o = {}) {
  const night = o.night ?? 1;
  // acoustic panels behind the chair
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) paint(rrPts(600 + c * 110, 700 + r * 110, 96, 96, 12), { wash: '#4B3F6E', washOp: 200, ink: PAL.ink, sw: .7 });
  // poster: a big flame doodle
  paint(rrPts(880, 380, 230, 300, 10), { wash: PAL.cream, washOp: 230, ink: PAL.ink, sw: 1 });
  paint(snipBodyPts(995, 560, 13, S * .5, .3), { wash: PAL.flame, washOp: 220, ink: null, curv: .5 });
  paint([[975, 610], [1020, 632], [975, 654]], { wash: PAL.ink, washOp: 200, ink: null });
  // shelves on the left (the horizontal frame shows them fully; the vertical frame shows their edge)
  for (const sy of [640, 900]) {
    paint(rectPts(80, sy, 390, 22), { wash: PAL.wood, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 6; i++) paint(rrPts(100 + i * 38, sy - 80 - hash(i + sy) * 30, 32, 80 + hash(i + sy) * 30, 4), { wash: [PAL.rose, PAL.teal, PAL.gold, PAL.lilac, PAL.leaf, PAL.red][(i + sy) % 6], ink: PAL.ink, sw: .7 });
  }
  // plant on the upper shelf, figurine (a tiny Snip) on the lower one
  paint(rrPts(360, 590, 70, 50, 10), { wash: PAL.red, ink: PAL.ink, sw: .9 });
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .45 + .05 * Math.sin(S * 1.5 + i); paint(limbPts([[395, 592], [395 + Math.cos(a) * 60, 592 + Math.sin(a) * 70]], 22, 6), { wash: PAL.leaf, ink: PAL.ink, sw: .7, curv: .3 }); }
  paint(snipBodyPts(410, 880, 5, S, .5), { wash: PAL.flame, ink: PAL.ink, sw: .8, curv: .5 });
  // right side: tall plant and a lava lamp (horizontal frame)
  paint(rrPts(1580, 1130, 120, 130, 16), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32 + .06 * Math.sin(S * 1.2 + i); paint(limbPts([[1640, 1135], [1640 + Math.cos(a) * 170, 1135 + Math.sin(a) * 230]], 34, 8), { wash: i % 2 ? PAL.leaf : '#5E8F4C', ink: PAL.ink, sw: .8, curv: .3 }); }
  paint(rrPts(1760, 1000, 60, 170, 28), { wash: PAL.lilac, washOp: 200, ink: PAL.ink, sw: .9 });
  for (let i = 0; i < 3; i++) paint(ellPts(1790 + 8 * Math.sin(S + i), 1150 - frac(S * .15 + i / 3) * 140, 14, 18, 10), { wash: PAL.rose, ink: null });
  // string lights across the top of the wall
  const bulbs = 18;
  const path = []; for (let i = 0; i <= bulbs; i++) { const f = i / bulbs; path.push([60 + f * 1800, 250 + Math.sin(f * Math.PI * 3) * 40 + 20]); }
  inkLine(path, .9, PAL.ink, 'inkfine', .5);
  for (let i = 1; i < bulbs; i++) {
    const [bx, by] = path[i], on = night * (.55 + .45 * pulse(S + i * .11, 3));
    if (on > .05) paint(ellPts(bx, by + 22, 34, 34, 14), { fill: [PAL.gold, PAL.rose, PAL.sky, PAL.flameLt][i % 4], fillOp: 90 * on, bleed: .3, tex: .2, border: .1, ink: null });
    paint(ellPts(bx, by + 20, 9, 13, 10), { wash: on > .05 ? [PAL.gold, PAL.rose, PAL.sky, PAL.flameLt][i % 4] : '#CFC6B8', ink: PAL.ink, sw: .6 });
  }
}
// on the desk and floor: rug, keyboard, mug, desk lamp, cables
function deskDecor(S, o = {}) {
  paint(ellPts(900, 1330, 560, 70, 30), { wash: PAL.rose, washOp: 120, ink: null });
  paint(ellPts(900, 1330, 470, 52, 30), { wash: PAL.gold, washOp: 80, ink: null });
  inkLine([[1250, 1100], [1300, 1250], [1420, 1290], [1520, 1270]], .9, '#3A3346', 'inkfine', .6);
}
function deskTop(S, o = {}) {
  // keyboard and mouse in front of the monitor
  paint(rrPts(890, 1044, 190, 24, 8), { wash: '#3B3549', ink: PAL.ink, sw: .8 });
  for (let i = 0; i < 8; i++) paint(rectPts(900 + i * 22, 1049, 15, 7), { wash: (o.rgb ? [PAL.rose, PAL.gold, PAL.sky, PAL.leaf][(i + Math.floor(bpOf(S))) % 4] : '#8D8A96'), washOp: 220, ink: null });
  // mug
  if (!o.noMug) { paint(rrPts(1400, 1020, 40, 50, 8), { wash: PAL.teal, ink: PAL.ink, sw: .8 }); inkLine([[1440, 1030], [1452, 1040], [1440, 1055]], .9); }
}

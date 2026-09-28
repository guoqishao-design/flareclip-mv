// chars.js: the cast. All original designs.
//
// Snip: FlareClip's mascot, a little flame with scissor hands.
//   snip(x, y, u, o): (x, y) = ground point between the feet; u = unit (body is ~7u wide, ~10u tall with the tip).
//   o: dy (lift in u, negative = up), sq (squash; negative stretches), rot, flip,
//      eyes: normal | happy | determined | star | closed | wide | look (lookX/lookY -1..1) | sad | heart
//      mouth: smile | grin | open | o | flat | wobble | tongue
//      aL/aR: arm angles (0 = sideways, + raised, - lowered); cutL/cutR: blade openness 0 (closed) .. 1 (open)
//      blush, glow (0..1 halo), tipWave (0..1 how much the flame tip flickers), noLegs, noShadow
//
// Streamer: the creator, a young person with a headset and a teal hoodie.
//   streamer(x, y, s, o): (x, y) = ground point (or seat point when sit); s = unit (about 12s tall standing).
//   o: sit, slump (0..1), eyes: open | tired | happy | wide | closed | star, mouth: smile | flat | o | grin | sad,
//      aL/aR arm angles, dy, rot, emote ('zzz' | 'spark' | 'heart' | '!' | 'sweat'), emoteK 0..1

function bladePts(len) {
  // one scissor blade: a slim pointed leaf from the pivot outward
  return [[0, -len * .02], [len * .3, -len * .12], [len * .78, -len * .08], [len, 0], [len * .5, len * .07], [0, len * .05]];
}
function scissorHand(px, py, ang, u, open, sw) {
  // two steel blades crossing at the pivot, opening symmetrically around the arm direction; two red finger loops behind
  const len = 3.1 * u, a = .5 * open + .05;
  for (const s of [-1, 1]) {
    const lp = xform([[px - 1.0 * u, py + s * .55 * u]], px, py, ang)[0];
    paint(ellPts(lp[0], lp[1], .72 * u, .52 * u, 16, 0, ang + s * .5), { wash: PAL.ember, ink: PAL.ink, sw: sw * .9 });
    paint(ellPts(lp[0], lp[1], .3 * u, .2 * u, 10, 0, ang + s * .5), { wash: PAL.cream, ink: null });
  }
  for (const s of [-1, 1]) {
    const pts = xform(bladePts(len).map(([x, y]) => [px + x, py + y * s]), px, py, ang + s * a);
    paint(pts, { wash: '#E4EAF0', ink: PAL.ink, sw: sw * .9, curv: .35 });
    inkLine(xform([[px + len * .25, py], [px + len * .8, py]], px, py, ang + s * a), sw * .5, '#9AA7B4');   // blade shine
  }
  paint(ellPts(px, py, .3 * u, .3 * u, 10), { wash: PAL.gold, ink: PAL.ink, sw: sw * .6 });
}

function snipBodyPts(cx, cy, u, t, wave) {
  // teardrop flame: round belly at the bottom, tip curling up and flickering
  const p = [], n = 40;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;                                // 0 = right side
    const up = Math.sin(a) < 0;                            // upper half (y up is negative)
    let rx = 3.4 * u, ry = 3.3 * u;
    let x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    if (up) {
      const k = -Math.sin(a);                              // 0 at the sides .. 1 at the top
      const pull = Math.pow(k, 2.2);
      x *= 1 - pull * .92;
      y -= pull * 4.6 * u;
      x += pull * (1.1 * u + wave * .9 * u * Math.sin(t * 7.3 + k * 2));   // tip leans and flickers
    }
    p.push([cx + x, cy + y]);
  }
  return p;
}

function snip(x, y, u, o = {}) {
  const t = S, sw = Math.max(.6, u / 16);
  const flip = o.flip ? -1 : 1, sq = o.sq || 0;
  const bob = (o.dy || 0) * u;
  const sx = 1 + sq * .35, sy = 1 - sq * .35;
  push(); translate(x, y + bob); rotate(o.rot || 0); scale(flip * sx, sy);
  const cy = -3.3 * u;                                   // belly centre above the ground point
  const wave = o.tipWave ?? .6;

  if (o.glow) paint(ellPts(0, cy - 1.5 * u, 7 * u, 7.5 * u, 30), { fill: PAL.flameLt, fillOp: 110 * o.glow, bleed: .35, tex: .2, border: .1, ink: null });
  if (!o.noShadow) paint(ellPts(0, 0, 3.6 * u, .7 * u, 20), { wash: PAL.ink, washOp: 38, ink: null });

  // legs: two stubby feet
  if (!o.noLegs) for (const s of [-1, 1]) {
    const lx = s * 1.4 * u, walk = o.walk != null ? Math.sin(o.walk + (s > 0 ? Math.PI : 0)) * .5 * u : 0;
    inkLine([[lx, cy + 2.6 * u], [lx + walk * .5, -.4 * u + Math.min(0, walk) * .3]], sw * 1.1);
    paint(ellPts(lx + walk * .6 + s * .2 * u, -.25 * u, .75 * u, .38 * u, 14), { wash: PAL.flameDk, ink: PAL.ink, sw: sw * .9 });
  }

  // arms with scissor hands (drawn behind the body at the shoulders, hands in front)
  const arm = (s, ang, open) => {
    const shx = s * 3.0 * u, shy = cy + .2 * u;
    const a = s > 0 ? -ang : Math.PI + ang;              // + raises the arm
    const hx = shx + Math.cos(a) * 1.9 * u, hy = shy + Math.sin(a) * 1.9 * u;
    paint(limbPts([[shx, shy], [lerp(shx, hx, .5), lerp(shy, hy, .5) - .15 * u], [hx, hy]], .75 * u, .55 * u), { wash: PAL.flameDk, ink: PAL.ink, sw: sw * .9, curv: .5 });
    return () => scissorHand(hx, hy, a, u, open, sw);
  };
  const handL = arm(-1, o.aL ?? -.35, o.cutL ?? .7), handR = arm(1, o.aR ?? -.35, o.cutR ?? .7);

  // body: outer flame, inner lighter core
  const body = snipBodyPts(0, cy, u, t, wave);
  paint(body, { wash: PAL.flame, ink: PAL.ink, sw: sw * 1.25, curv: .5 });
  const core = snipBodyPts(0, cy + .7 * u, u * .62, t + .4, wave * .7);
  paint(core, { wash: PAL.flameLt, washOp: 235, ink: null, curv: .5 });
  paint(ellPts(-1.6 * u, cy - 1.2 * u, .5 * u, .9 * u, 14, 0, .5), { wash: PAL.cream, washOp: 150, ink: null });   // shine

  // face
  const ey = cy + .1 * u, ex = 1.25 * u, er = .78 * u;
  const eyes = o.eyes || 'normal', lx = (o.lookX || 0) * .28 * u, ly = (o.lookY || 0) * .25 * u;
  for (const s of [-1, 1]) {
    const cx = s * ex;
    if (eyes === 'happy' || eyes === 'closed') {
      const arc = eyes === 'happy' ? -1 : 1;
      inkLine([[cx - er * .8, ey + arc * -.15 * u], [cx, ey + arc * .35 * u], [cx + er * .8, ey + arc * -.15 * u]], sw * 1.3);
    } else if (eyes === 'star') {
      paint(starPts(cx, ey, er * 1.25, .45, 5), { wash: PAL.gold, ink: PAL.ink, sw: sw * .9 });
    } else if (eyes === 'heart') {
      paint(heartPts(cx, ey, er * 1.1), { wash: PAL.rose, ink: PAL.ink, sw: sw * .9 });
    } else {
      const h = eyes === 'wide' ? 1.25 : eyes === 'determined' ? .8 : eyes === 'sad' ? .9 : 1.05;
      paint(ellPts(cx, ey, er * .82, er * h, 20), { wash: PAL.cream, ink: PAL.ink, sw: sw * .9 });
      const pr = er * (eyes === 'wide' ? .36 : .46);
      paint(ellPts(cx + lx, ey + ly + er * .12, pr, pr * 1.1, 14), { wash: PAL.ink, ink: null });
      paint(ellPts(cx + lx - pr * .35, ey + ly - pr * .2, pr * .32, pr * .32, 10), { wash: PAL.cream, ink: null });
      if (eyes === 'determined') paint(limbPts([[cx + s * er * 1.0, ey - er * 1.45], [cx - s * er * .9, ey - er * .95]], .32 * u, .22 * u), { wash: PAL.ink, ink: null });   // brows slanting down to the middle
      if (eyes === 'sad') paint(limbPts([[cx + s * er * .9, ey - er * 1.0], [cx - s * er * .8, ey - er * 1.45]], .26 * u, .18 * u), { wash: PAL.ink, ink: null });
    }
  }
  if (o.blush) for (const s of [-1, 1]) paint(ellPts(s * 2.2 * u, ey + .95 * u, .6 * u, .32 * u, 14), { wash: PAL.rose, washOp: 150 * o.blush, ink: null });
  const my = ey + 1.35 * u, mouth = o.mouth || 'smile';
  if (mouth === 'smile') inkLine([[-.6 * u, my], [0, my + .38 * u], [.6 * u, my]], sw * 1.2);
  else if (mouth === 'grin') paint([[-.9 * u, my - .1 * u], [.9 * u, my - .1 * u], [.5 * u, my + .6 * u], [-.5 * u, my + .6 * u]], { wash: PAL.ember, ink: PAL.ink, sw: sw, curv: .6 });
  else if (mouth === 'open' || mouth === 'tongue') {
    paint(ellPts(0, my + .2 * u, .6 * u, .5 * u, 16), { wash: PAL.ember, ink: PAL.ink, sw });
    if (mouth === 'tongue') paint(ellPts(0, my + .45 * u, .35 * u, .2 * u, 12), { wash: PAL.rose, ink: null });
  } else if (mouth === 'o') paint(ellPts(0, my + .15 * u, .3 * u, .38 * u, 14), { wash: PAL.ember, ink: PAL.ink, sw });
  else if (mouth === 'wobble') inkLine([[-.7 * u, my + .1 * u], [-.35 * u, my - .1 * u], [0, my + .1 * u], [.35 * u, my - .1 * u], [.7 * u, my + .1 * u]], sw);
  else inkLine([[-.5 * u, my + .1 * u], [.5 * u, my + .1 * u]], sw * 1.1);

  handL(); handR();
  pop();
}

// ---------- the streamer ----------
function streamer(x, y, s, o = {}) {
  const sw = Math.max(.6, s / 14);
  push(); translate(x, y + (o.dy || 0) * s); rotate(o.rot || 0); if (o.flip) scale(-1, 1);
  const slump = o.slump || 0, sit = !!o.sit;
  const hipY = sit ? 0 : -4.6 * s;
  const shoulderY = hipY - 4.8 * s + slump * 1.1 * s;
  const lean = slump * .9 * s;
  const headX = lean * 1.2, headY = shoulderY - 2.4 * s + slump * .9 * s;

  if (!sit) {
    // legs and shoes
    for (const side of [-1, 1]) {
      paint(limbPts([[side * 1.1 * s, hipY], [side * 1.05 * s, hipY * .5], [side * 1.0 * s, -.5 * s]], 1.7 * s, 1.3 * s), { wash: PAL.indigo, ink: PAL.ink, sw: sw, curv: .3 });
      paint(ellPts(side * 1.25 * s, -.3 * s, 1.1 * s, .5 * s, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .9 });
    }
  } else {
    // seated: thighs forward, shins down
    for (const side of [-1, 1]) {
      const kx = 3.2 * s, ky = 0;
      paint(limbPts([[side * .6 * s, 0], [kx, ky], [kx + .2 * s, 4.2 * s]], 1.7 * s, 1.3 * s), { wash: PAL.indigo, ink: PAL.ink, sw: sw, curv: .3 });
      paint(ellPts(kx + .7 * s, 4.4 * s, 1.0 * s, .42 * s, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .9 });
    }
  }
  // hoodie torso
  const torso = [[-2.1 * s + lean * .3, shoulderY], [2.1 * s + lean * .3, shoulderY], [2.3 * s, hipY + .4 * s], [-2.3 * s, hipY + .4 * s]];
  paint(torso, { wash: PAL.teal, ink: PAL.ink, sw: sw * 1.1, curv: .35 });
  paint([[-1.1 * s + lean * .3, hipY - 1.4 * s], [1.1 * s + lean * .3, hipY - 1.4 * s], [1.3 * s, hipY - .2 * s], [-1.3 * s, hipY - .2 * s]], { wash: PAL.tealDk, washOp: 160, ink: null, curv: .3 });   // pocket
  // arms
  for (const side of [-1, 1]) {
    const ang = side < 0 ? (o.aL ?? -1.2) : (o.aR ?? -1.2);
    const shx = side * 2.0 * s + lean * .3, a = side > 0 ? -ang : Math.PI + ang;
    const ex = shx + Math.cos(a) * 2.2 * s, ey = shoulderY + .3 * s + Math.sin(a) * 2.2 * s;
    const hx = ex + Math.cos(a + side * .3) * 2.0 * s, hy = ey + Math.sin(a + side * .3) * 2.0 * s;
    paint(limbPts([[shx, shoulderY + .3 * s], [ex, ey], [hx, hy]], 1.5 * s, 1.1 * s), { wash: PAL.teal, ink: PAL.ink, sw: sw * .9, curv: .4 });
    paint(ellPts(hx, hy, .5 * s, .5 * s, 12), { wash: '#F1C7A5', ink: PAL.ink, sw: sw * .8 });
  }
  // head, hair, headset
  paint(ellPts(headX, headY, 2.0 * s, 2.15 * s, 26), { wash: '#F4CFAE', ink: PAL.ink, sw: sw * 1.1 });
  paint([[headX - 2.15 * s, headY - .2 * s], [headX - 1.6 * s, headY - 1.9 * s], [headX, headY - 2.5 * s], [headX + 1.7 * s, headY - 1.8 * s],
         [headX + 2.15 * s, headY - .1 * s], [headX + 1.2 * s, headY - 1.0 * s], [headX - .2 * s, headY - .8 * s], [headX - 1.3 * s, headY - 1.1 * s]],
        { wash: '#3A2A33', ink: PAL.ink, sw: sw, curv: .5 });                                  // hair with bangs
  inkLine([[headX - 2.25 * s, headY], [headX - 1.4 * s, headY - 2.6 * s], [headX + 1.4 * s, headY - 2.6 * s], [headX + 2.25 * s, headY]], sw * 1.6, PAL.ink, 'ink', .7);   // headband
  for (const side of [-1, 1]) paint(rrPts(headX + side * 2.2 * s - .5 * s, headY - .7 * s, 1.0 * s, 1.5 * s, .4 * s), { wash: PAL.flame, ink: PAL.ink, sw: sw });   // ear cups
  inkLine([[headX - 2.1 * s, headY + .6 * s], [headX - 1.6 * s, headY + 1.5 * s], [headX - .7 * s, headY + 1.6 * s]], sw * 1.1);   // mic boom
  paint(ellPts(headX - .6 * s, headY + 1.6 * s, .3 * s, .25 * s, 10), { wash: PAL.ink, ink: null });

  // face
  const eyes = o.eyes || 'open', eY = headY + .2 * s;
  for (const side of [-1, 1]) {
    const cx = headX + side * .75 * s;
    if (eyes === 'tired') { inkLine([[cx - .35 * s, eY], [cx + .35 * s, eY]], sw * 1.2); inkLine([[cx - .3 * s, eY + .35 * s], [cx + .3 * s, eY + .4 * s]], sw * .6, PAL.lilac); }
    else if (eyes === 'happy' || eyes === 'closed') inkLine([[cx - .35 * s, eY + .1 * s], [cx, eY - (eyes === 'happy' ? .25 : -.15) * s], [cx + .35 * s, eY + .1 * s]], sw * 1.1);
    else if (eyes === 'star') paint(starPts(cx, eY, .45 * s, .45, 5), { wash: PAL.gold, ink: PAL.ink, sw: sw * .6 });
    else paint(ellPts(cx, eY, eyes === 'wide' ? .3 * s : .2 * s, eyes === 'wide' ? .36 * s : .26 * s, 12), { wash: PAL.ink, ink: null });
  }
  paint(ellPts(headX - 1.3 * s, eY + .7 * s, .35 * s, .2 * s, 10), { wash: PAL.rose, washOp: 120, ink: null });
  paint(ellPts(headX + 1.3 * s, eY + .7 * s, .35 * s, .2 * s, 10), { wash: PAL.rose, washOp: 120, ink: null });
  const mY = headY + 1.15 * s, m = o.mouth || 'smile';
  if (m === 'smile') inkLine([[headX - .4 * s, mY], [headX, mY + .25 * s], [headX + .4 * s, mY]], sw);
  else if (m === 'grin') paint([[headX - .6 * s, mY - .05 * s], [headX + .6 * s, mY - .05 * s], [headX + .3 * s, mY + .45 * s], [headX - .3 * s, mY + .45 * s]], { wash: PAL.ember, ink: PAL.ink, sw: sw * .8, curv: .6 });
  else if (m === 'o') paint(ellPts(headX, mY + .1 * s, .22 * s, .28 * s, 12), { wash: PAL.ember, ink: PAL.ink, sw: sw * .8 });
  else if (m === 'sad') inkLine([[headX - .4 * s, mY + .2 * s], [headX, mY], [headX + .4 * s, mY + .2 * s]], sw);
  else inkLine([[headX - .35 * s, mY + .1 * s], [headX + .35 * s, mY + .1 * s]], sw);

  if (o.emote && (o.emoteK ?? 1) > .02) emote(o.emote, headX + 2.6 * s, headY - 2.2 * s, s, o.emoteK ?? 1);
  pop();
}

// little reaction marks next to a head
function emote(kind, x, y, s, k) {
  const sc = backOut(k); if (sc < .02) return;
  push(); translate(x, y); scale(sc);
  const zig = (zx, zy, zs) => inkLine([[zx - zs, zy - zs], [zx + zs, zy - zs], [zx - zs, zy + zs], [zx + zs, zy + zs]], .9, PAL.indigo, 'ink', 0);
  if (kind === 'zzz') { zig(0, 0, .55 * s); zig(1.2 * s, -1.3 * s, .42 * s); }
  else if (kind === 'spark') paint(starPts(0, 0, 1.1 * s, .38, 4), { wash: PAL.gold, ink: PAL.ink, sw: .8 });
  else if (kind === 'heart') paint(heartPts(0, 0, 1.0 * s), { wash: PAL.rose, ink: PAL.ink, sw: .8 });
  else if (kind === 'sweat') paint([[0, -.9 * s], [.55 * s, .2 * s], [0, .7 * s], [-.55 * s, .2 * s]], { wash: PAL.sky, ink: PAL.ink, sw: .7, curv: .6 });
  else if (kind === '!') { paint([[-.35 * s, -1.6 * s], [.35 * s, -1.6 * s], [.15 * s, .3 * s], [-.15 * s, .3 * s]], { wash: PAL.red, ink: PAL.ink, sw: .8 }); paint(ellPts(0, .9 * s, .3 * s, .3 * s, 10), { wash: PAL.red, ink: PAL.ink, sw: .8 }); }
  pop();
}

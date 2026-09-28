// props.js: sets and props shared by the scenes. World units; see core.js for the frame layout.

// ---------- the streamer's room at night ----------
// wall + floor across the whole world, a starry window, a wall clock (hands angle in turns), lamp glow
function room(S, o = {}) {
  const floorY = o.floorY ?? 1260;
  paint(rectPts(-100, -100, 2120, floorY + 100), { wash: o.wall || PAL.night, ink: null });
  paint(rectPts(-100, -100, 2120, floorY + 100), { fill: PAL.indigo, fillOp: 120, bleed: .25, tex: .7, border: .2, ink: null });
  // floorboards
  paint(rectPts(-100, floorY, 2120, 2100 - floorY), { wash: PAL.woodDk, ink: null });
  for (let i = 0; i < 9; i++) inkLine([[-100, floorY + 60 + i * i * 14], [2020, floorY + 60 + i * i * 14 + 6]], .6, '#6E4A30', 'inkfine', .1);
  inkLine([[-100, floorY], [2020, floorY + 4]], 1.2);
  // window with stars and a moon
  if (o.window !== false) {
    const wx = o.winX ?? 520, wy = o.winY ?? 300;
    paint(rrPts(wx, wy, 360, 300, 16), { wash: '#141A3A', ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 9; i++) paint(starPts(wx + 30 + hash(i) * 300, wy + 30 + hash(i + 9) * 240, 7 + hash(i + 3) * 6, .4, 4), { wash: PAL.cream, washOp: 150 + 100 * pulse(S + i * .13, 3), ink: null });
    paint(ellPts(wx + 280, wy + 80, 38, 38, 20), { wash: '#F6E7B5', ink: null });
    paint(ellPts(wx + 296, wy + 70, 34, 34, 20), { wash: '#141A3A', ink: null });
    inkLine([[wx + 180, wy], [wx + 180, wy + 300]], 1.1); inkLine([[wx, wy + 150], [wx + 360, wy + 150]], 1.1);
  }
  // clock
  if (o.clock !== undefined) clock(o.clockX ?? 1300, o.clockY ?? 380, 95, o.clock);
  // lamp glow pooled on the wall
  paint(ellPts(o.glowX ?? 1150, o.glowY ?? 820, 520, 380, 30), { fill: PAL.gold, fillOp: 70, bleed: .35, tex: .3, border: .1, ink: null });
}
function clock(x, y, r, turns) {
  paint(ellPts(x, y, r, r, 30), { wash: PAL.cream, ink: PAL.ink, sw: 1.4 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; inkLine([[x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78], [x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9]], .8); }
  const hA = turns / 12 * TAU - Math.PI / 2, mA = turns * TAU - Math.PI / 2;
  inkLine([[x, y], [x + Math.cos(hA) * r * .45, y + Math.sin(hA) * r * .45]], 2.2, PAL.ink, 'ink', 0);
  inkLine([[x, y], [x + Math.cos(mA) * r * .72, y + Math.sin(mA) * r * .72]], 1.5, PAL.ember, 'ink', 0);
  paint(ellPts(x, y, 8, 8, 10), { wash: PAL.ink, ink: null });
}

function desk(x, y, w) {
  // desktop surface top at y; legs down to the floor
  paint(rrPts(x - w / 2, y, w, 34, 10), { wash: PAL.wood, ink: PAL.ink, sw: 1.2 });
  for (const s of [-1, 1]) paint(rectPts(x + s * (w / 2 - 50) - 14, y + 34, 28, 260), { wash: PAL.woodDk, ink: PAL.ink, sw: 1 });
}

// monitor: bottom-centre of the stand at (x, y); screen w×h; content(sx, sy, sw, sh) paints inside the screen
function monitor(x, y, w, h, o = {}) {
  const sx = x - w / 2, sy = y - 70 - h;
  paint(rectPts(x - 26, y - 72, 52, 72), { wash: PAL.grey, ink: PAL.ink, sw: 1 });
  paint(rrPts(x - 90, y - 12, 180, 22, 8), { wash: PAL.grey, ink: PAL.ink, sw: 1 });
  paint(rrPts(sx - 22, sy - 22, w + 44, h + 44, 22), { wash: '#34303F', ink: PAL.ink, sw: 1.4 });
  paint(rrPts(sx, sy, w, h, 8), { wash: o.screen || PAL.teal, ink: null });
  if (o.glow) paint(ellPts(x, sy + h / 2, w * .8, h * .8, 24), { fill: o.screen || PAL.teal, fillOp: 90 * o.glow, bleed: .35, tex: .2, border: .1, ink: null });
  if (o.content) o.content(sx, sy, w, h);
  if (o.live) {
    paint(rrPts(sx + 22, sy + 20, 150, 52, 14), { wash: PAL.red, ink: PAL.ink, sw: .9 });
    paint(ellPts(sx + 50, sy + 46, 10, 10, 10), { wash: PAL.cream, washOp: 120 + 135 * pulse(S, 2), ink: null });
    letter('LIVE', sx + 112, sy + 47, 30, PAL.cream, { font: '700 30px "Fredoka"', shadow: false });
  }
  if (o.viewers != null) {
    paint(rrPts(sx + w - 190, sy + 20, 168, 52, 14), { wash: '#1F1B28', washOp: 210, ink: null });
    paint(ellPts(sx + w - 158, sy + 46, 16, 10, 14), { wash: PAL.cream, ink: null });
    paint(ellPts(sx + w - 158, sy + 46, 5, 5, 8), { wash: PAL.ink, ink: null });
    letter(String(o.viewers), sx + w - 90, sy + 47, 32, o.viewers === 0 ? PAL.rose : PAL.cream, { font: '700 32px "Fredoka"', shadow: false });
  }
}

// ---------- film tape (the long video) ----------
// path: [[x, y], ...]; w: tape width; hi: [a, b] fraction of the length that glows gold (the good bit)
function tapeSample(path) {
  const d = [0]; for (let i = 1; i < path.length; i++) d.push(d[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const at = f => {
    const L = f * d[d.length - 1]; let i = 1; while (i < d.length - 1 && d[i] < L) i++;
    const k = (L - d[i - 1]) / Math.max(1e-6, d[i] - d[i - 1]), a = path[i - 1], b = path[i];
    return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
  return { len: d[d.length - 1], at };
}
function tape(path, w = 90, o = {}) {
  paint(limbPts(path, w), { wash: '#2F2A38', ink: PAL.ink, sw: 1.1, curv: .3 });
  const T = tapeSample(path), step = w * 1.15, n = Math.floor(T.len / step);
  for (let i = 0; i < n; i++) {
    const f = (i + .5) / n, p = T.at(f), c = Math.cos(p.ang), s = Math.sin(p.ang);
    const lit = o.hi && f >= o.hi[0] && f <= o.hi[1];
    const fw = step * .78, fh = w * .52;
    const quad = [[-fw / 2, -fh / 2], [fw / 2, -fh / 2], [fw / 2, fh / 2], [-fw / 2, fh / 2]].map(([x, y]) => [p.x + x * c - y * s, p.y + x * s + y * c]);
    const tint = o.tint ? o.tint(f) : mixCol('#6F86A8', '#A7B8C9', hash(i + (o.seed || 0)));
    paint(quad, { wash: lit ? PAL.gold : tint, washOp: lit ? 255 : 210, ink: null });
    for (const e of [-1, 1]) for (const q of [-.25, .25]) {
      const hx = p.x + (q * step) * c - (e * w * .38) * s, hy = p.y + (q * step) * s + (e * w * .38) * c;
      paint(rectPts(hx - 5, hy - 4, 10, 8), { wash: PAL.paper, washOp: 200, ink: null });
    }
    if (o.labels && i % o.labels.every === 0) letter(o.labels.fmt(f), p.x - (w * .95) * s, p.y + (w * .95) * c, 30, PAL.cream, { font: '700 30px "Fredoka"', rot: p.ang, shadow: false, alpha: o.labels.alpha ?? 1 });
  }
  if (o.hi && o.glow) {
    const m = T.at((o.hi[0] + o.hi[1]) / 2);
    paint(ellPts(m.x, m.y, w * 2.4, w * 1.6, 24, 0, m.ang), { fill: PAL.gold, fillOp: 120 * o.glow, bleed: .3, tex: .2, border: .1, ink: null });
  }
  return T;
}
const hms = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = Math.floor(sec) % 60; return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };

// ---------- the short clip (vertical card) ----------
// centre (x, y), height h (width = h * 9/16), rot; o.glow, o.face (tiny streamer), o.words (0..1 caption progress), o.track (face bracket)
function clipCard(x, y, h, rot = 0, o = {}) {
  const w = h * 9 / 16;
  push(); translate(x, y); rotate(rot);
  if (o.glow) paint(ellPts(0, 0, w * 1.1, h * .75, 24), { fill: PAL.gold, fillOp: 130 * o.glow, bleed: .3, tex: .2, border: .1, ink: null });
  paint(rrPts(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, w * .14), { wash: '#26222F', ink: PAL.ink, sw: 1.2 });
  paint(rrPts(-w / 2, -h / 2, w, h, w * .1), { wash: o.bg || PAL.sky, ink: null });
  // a little stream still: the streamer's head and shoulders
  if (o.face !== false) {
    const fs = h / 36;
    paint(ellPts(0, h * .06, 6.5 * fs, 4 * fs, 18), { wash: PAL.teal, ink: null });
    paint(ellPts(0, -h * .1, 3.4 * fs, 3.6 * fs, 18), { wash: '#F4CFAE', ink: PAL.ink, sw: .8 });
    paint([[-3.5 * fs, -h * .1], [-2.6 * fs, -h * .1 - 3 * fs], [0, -h * .1 - 4 * fs], [2.8 * fs, -h * .1 - 3 * fs], [3.5 * fs, -h * .1], [1.4 * fs, -h * .1 - 1.6 * fs], [-1.5 * fs, -h * .1 - 1.8 * fs]], { wash: '#3A2A33', ink: null, curv: .5 });
    for (const s of [-1, 1]) paint(ellPts(s * 1.2 * fs, -h * .1 + .4 * fs, .4 * fs, .5 * fs, 8), { wash: PAL.ink, ink: null });
    inkLine([[-1 * fs, -h * .1 + 1.8 * fs], [0, -h * .1 + 2.5 * fs], [1 * fs, -h * .1 + 1.8 * fs]], .8);
  }
  // face-tracking bracket
  if (o.track) {
    const b = h * .17, cy = -h * .1, L = b * .35;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) inkLine([[sx * b, sy * b + cy - sy * L], [sx * b, sy * b + cy], [sx * b - sx * L, sy * b + cy]], 1.3, PAL.gold, 'ink', 0);
  }
  // caption bars lighting up word by word
  if (o.words != null) {
    const n = 4, bw = w * .16, gap = w * .03, y0 = h * .3, x0 = -(n * bw + (n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) paint(rrPts(x0 + i * (bw + gap), y0, bw, h * .05, h * .02), { wash: o.words * n > i ? PAL.gold : PAL.cream, washOp: 235, ink: null });
  }
  // play badge
  if (o.play) { paint(ellPts(0, h * .36, w * .1, w * .1, 16), { wash: PAL.cream, washOp: 220, ink: null }); paint([[-w * .03, h * .36 - w * .05], [w * .055, h * .36], [-w * .03, h * .36 + w * .05]], { wash: PAL.ink, ink: null }); }
  pop();
}

// phone held upright, screen shows a clip; o.likes (0..1) floats a heart up
function phone(x, y, h, rot = 0, o = {}) {
  clipCard(x, y, h, rot, { ...o, play: o.play ?? true });
  if (o.likes > 0) {
    const k = o.likes, hx = x + h * .32, hy = y - h * .35 - k * h * .5;
    paint(heartPts(hx, hy, h * .12 * backOut(clamp(k * 3))), { wash: PAL.rose, washOp: 255 * (1 - seg(k, .7, 1)), ink: PAL.ink, sw: .9 });
  }
}

// speech bubble with a word in it
function bubble(x, y, w, h, word, o = {}) {
  const k = o.pop ?? 1, sc = backOut(k); if (sc < .02) return;
  push(); translate(x, y); scale(sc);
  paint([...rrPts(-w / 2, -h / 2, w, h, h * .45), ], { wash: o.col || PAL.cream, ink: PAL.ink, sw: 1.1 });
  paint([[-w * .1, h * .42], [w * .05, h * .42], [-w * .22, h * .85]], { wash: o.col || PAL.cream, ink: PAL.ink, sw: 1.1 });
  paint(rectPts(-w * .12, h * .3, w * .2, h * .2), { wash: o.col || PAL.cream, ink: null });
  pop();
  letter(word, x, y + 2, h * .46 * sc, PAL.ink, { font: `700 ${Math.round(h * .46 * sc)}px "Fredoka", "Hiragino Sans", "PingFang SC", "Noto Sans CJK SC", sans-serif`, shadow: false });
}

// ---------- the clip machine ----------
// a hopper on legs: tape goes in the top, a short clip drops out the chute. crank: angle in turns.
function machine(x, y, s, crank, o = {}) {
  const sw = 1.3;
  // legs
  for (const d of [-1, 1]) paint(rectPts(x + d * 150 * s - 14 * s, y - 40 * s, 28 * s, 160 * s), { wash: PAL.woodDk, ink: PAL.ink, sw });
  // hopper (funnel)
  paint([[x - 230 * s, y - 420 * s], [x + 230 * s, y - 420 * s], [x + 90 * s, y - 220 * s], [x - 90 * s, y - 220 * s]], { wash: PAL.flame, ink: PAL.ink, sw, curv: .15 });
  paint([[x - 200 * s, y - 405 * s], [x + 200 * s, y - 405 * s], [x + 170 * s, y - 380 * s], [x - 170 * s, y - 380 * s]], { wash: PAL.flameDk, ink: null });
  // body box
  paint(rrPts(x - 180 * s, y - 230 * s, 360 * s, 200 * s, 30 * s), { wash: PAL.teal, ink: PAL.ink, sw });
  // gauge: needle swings with the crank
  paint(ellPts(x - 60 * s, y - 130 * s, 50 * s, 50 * s, 20), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
  const na = -Math.PI * .8 + Math.PI * .6 * (.5 + .5 * Math.sin(crank * TAU));
  inkLine([[x - 60 * s, y - 130 * s], [x - 60 * s + Math.cos(na) * 40 * s, y - 130 * s + Math.sin(na) * 40 * s]], 1.4, PAL.red, 'ink', 0);
  // chute
  paint([[x + 60 * s, y - 70 * s], [x + 170 * s, y - 70 * s], [x + 250 * s, y - 10 * s], [x + 140 * s, y - 10 * s]], { wash: PAL.grey, ink: PAL.ink, sw });
  // crank on the left side
  const ca = crank * TAU, cx = x - 180 * s, cy = y - 140 * s;
  paint(ellPts(cx, cy, 20 * s, 20 * s, 12), { wash: PAL.gold, ink: PAL.ink, sw: 1 });
  const hx = cx - 70 * s * Math.cos(ca), hy = cy + 70 * s * Math.sin(ca);
  inkLine([[cx, cy], [hx, hy]], 2.4, PAL.ink, 'ink', 0);
  paint(rrPts(hx - 14 * s, hy - 30 * s, 28 * s, 60 * s, 12 * s), { wash: PAL.red, ink: PAL.ink, sw: 1 });
  // puff lights on the top
  for (let i = 0; i < 3; i++) paint(ellPts(x - 60 * s + i * 60 * s, y - 250 * s, 14 * s, 14 * s, 10), { wash: [PAL.gold, PAL.rose, PAL.leaf][i], washOp: 140 + 115 * pulse(S + i * BEAT / 3, 5), ink: PAL.ink, sw: .8 });
}

// ---------- the world ----------
function globe(x, y, r, spin) {
  paint(ellPts(x, y, r * 1.18, r * 1.18, 30), { fill: PAL.sky, fillOp: 90, bleed: .35, tex: .3, border: .1, ink: null });
  paint(ellPts(x, y, r, r, 36), { wash: '#4E8FC7', ink: PAL.ink, sw: 1.4 });
  // continents: blobs that slide across and wrap around
  for (let i = 0; i < 7; i++) {
    const lon = frac(hash(i) + spin) * 2 - 1;             // -1..1 across the face
    if (Math.abs(lon) > .92) continue;
    const lat = (hash(i + 20) - .5) * 1.3, cx = x + Math.sin(lon * Math.PI / 2) * r * .95, cy = y + lat * r * .75;
    const sq = Math.cos(lon * Math.PI / 2), rr = r * (.16 + hash(i + 40) * .18);
    const pts = []; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, q = rr * (.7 + .5 * hash(i * 10 + k)); pts.push([cx + Math.cos(a) * q * sq, cy + Math.sin(a) * q * .8]); }
    paint(pts, { wash: PAL.leaf, ink: null, curv: .6 });
  }
  paint(ellPts(x - r * .35, y - r * .4, r * .22, r * .12, 14, 0, -.6), { wash: PAL.cream, washOp: 140, ink: null });
  inkLine(ellPts(x, y, r, r, 36), 1.4, PAL.ink, 'ink', .5);
}

// ---------- theatre seats (the audience) ----------
// rows of seats facing the camera; fill 0..1 how many are occupied; occupants bounce on the beat
function seats(x, y, cols, rows, fill, S) {
  for (let r = rows - 1; r >= 0; r--) {
    const yy = y + r * 120, sc = 1 + r * .12, off = (r % 2) * 60;
    for (let c = 0; c < cols; c++) {
      const xx = x + (c - (cols - 1) / 2) * 140 * sc + off, id = r * 31 + c;
      if (hash(id + 7) < fill) {
        const bounce = -Math.abs(Math.sin((bpOf(S) + hash(id)) * Math.PI)) * 18 * fill;
        const hs = 30 * sc, hy = yy - 70 * sc + bounce;
        if (hash(id + 3) < .5) {
          // a tiny flame fan: one shape, two eyes
          paint([[xx - hs, hy + hs * .6], [xx - hs * .9, hy - hs * .3], [xx - hs * .2, hy - hs * 1.6], [xx + hs * .3, hy - hs * .7], [xx + hs, hy - hs * .1], [xx + hs, hy + hs * .6]], { wash: PAL.flame, ink: PAL.ink, sw: .8, curv: .6 });
          for (const s of [-1, 1]) paint(ellPts(xx + s * hs * .35, hy + hs * .1, hs * .16, hs * .2, 8), { wash: PAL.ink, ink: null });
        } else {
          paint(ellPts(xx, yy - 30 * sc + bounce, hs * 1.2, hs * .8, 14), { wash: [PAL.rose, PAL.lilac, PAL.leaf, PAL.gold][id % 4], ink: PAL.ink, sw: .8 });
          paint(ellPts(xx, hy - hs * .2, hs * .75, hs * .8, 14), { wash: '#F1C7A5', ink: PAL.ink, sw: .8 });
          for (const s of [-1, 1]) inkLine([[xx + s * 10 * sc - 5, hy - hs * .3], [xx + s * 10 * sc, hy - hs * .45], [xx + s * 10 * sc + 5, hy - hs * .3]], .7);
        }
      }
      paint(rrPts(xx - 60 * sc, yy - 30 * sc, 120 * sc, 70 * sc, 16 * sc), { wash: PAL.red, ink: PAL.ink, sw: 1 });
    }
  }
}

// ---------- confetti ----------
function confetti(S, t0, n = 60, area = [FRAME.x0, FRAME.y0, FW, FH]) {
  const age = S - t0; if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const x = area[0] + hash(i) * area[2] + Math.sin(age * 3 + i) * 30, y = area[1] - 80 + (age * (260 + hash(i + 5) * 260) + hash(i + 9) * area[3] * .3);
    if (y > area[1] + area[3] + 40) continue;
    const r = 12 + hash(i + 2) * 10, a = age * (3 + hash(i + 4) * 5) + i;
    paint(xform([[-r, -r * .45], [r, -r * .45], [r, r * .45], [-r, r * .45]].map(([px, py]) => [x + px, y + py]), x, y, a), { wash: [PAL.gold, PAL.rose, PAL.sky, PAL.leaf, PAL.flame, PAL.lilac][i % 6], ink: null });
  }
}

// spark burst at a cut point
function sparks(x, y, age, n = 8, r = 120) {
  if (age < 0 || age > .6) return;
  const k = easeOut(age / .6);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + hash(i) * .4, d = r * k * (.6 + hash(i + 3) * .6);
    paint(starPts(x + Math.cos(a) * d, y + Math.sin(a) * d, 16 * (1 - k) + 4, .4, 4, a), { wash: i % 2 ? PAL.gold : PAL.flameLt, ink: null });
  }
}

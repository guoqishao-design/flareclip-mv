// core.js: FlareClip watercolor promo engine.
// World: a 1920×1920 square. The output frame shows the middle of it:
//   vertical 9:16  (1080×1920) → x 420..1500, full height
//   horizontal 16:9 (1920×1080) → full width, y 420..1500
// So all key action stays in the centre square x, y ∈ [420, 1500]; backgrounds fill the whole world.
// Every frame is a pure function of song time S (seconds into the full song), so frames can render in parallel.

const Q = new URLSearchParams(location.search);
const FMT = Q.get('fmt') === 'h' ? 'h' : 'v';
const SCALE = +(Q.get('scale') || 1);                 // preview renders at a fraction of full size
const FW = FMT === 'v' ? 1080 : 1920, FH = FMT === 'v' ? 1920 : 1080;   // frame size in world units
const W = Math.round(FW * SCALE), H = Math.round(FH * SCALE);           // canvas pixels
const WORLD = 1920, OX = FW / 2 - WORLD / 2, OY = FH / 2 - WORLD / 2;   // world → frame offset
const TAU = Math.PI * 2;
const VERT = FMT === 'v';
const VZ = VERT ? 1.28 : 1;                             // tighter framing in the tall format, where characters would look small

// ---------- music grid: detected beats (src/music.js), 123 BPM with small local drift ----------
const BEAT = 60 / 123.05, BAR = BEAT * 4;
const BOIL = 12;                                        // linework redraws 12×/s like hand-drawn animation
// position of S in a sorted list of event times: integer part = index, fraction = progress to the next
function gridPos(list, S) {
  if (S <= list[0]) return (S - list[0]) / BEAT / (list === BARS ? 4 : 1);
  const n = list.length; if (S >= list[n - 1]) return n - 1 + (S - list[n - 1]) / (list === BARS ? BAR : BEAT);
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (list[m] <= S) lo = m; else hi = m; }
  return lo + (S - list[lo]) / (list[hi] - list[lo]);
}

const PAL = {
  paper: '#F4ECDD', ink: '#2A2230', cream: '#FFF6E6',
  flame: '#F28C3A', flameDk: '#D8622B', flameLt: '#FFD27A', ember: '#E4553A',
  teal: '#3B9C9A', tealDk: '#2A7472', indigo: '#2E3A74', night: '#1D2347',
  rose: '#E6788F', gold: '#EDB33C', sky: '#8CC6E8', leaf: '#6FA35A', lilac: '#9C86C9',
  red: '#D9483B', wood: '#B98556', woodDk: '#8A5D3B', grey: '#8D8A96'
};

// ---------- maths and timing ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, x) => a + (b - a) * x;
const frac = x => x - Math.floor(x);
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = x => Math.pow(clamp(x), 3);
const backOut = x => { x = clamp(x); const s = 1.8; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const elasticOut = x => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (TAU / 3)) + 1; };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * TAU);
const bpOf = S => gridPos(BEATS, S);                  // beat position (0 = first beat of the song)
const barOf = S => gridPos(BARS, S);                   // bar position (0 = first full bar)
const beatAt = n => BEATS[Math.max(0, Math.min(BEATS.length - 1, n))];
const barAt = n => BARS[Math.max(0, Math.min(BARS.length - 1, n))];
const pulse = (S, k = 6) => Math.exp(-frac(bpOf(S)) * k);        // 1 on each beat, then decays
const pulse2 = (S, k = 6) => Math.exp(-frac(bpOf(S) * 2) * k);   // same on eighth notes
const barPulse = (S, k = 4) => Math.exp(-frac(barOf(S)) * k);    // 1 on each downbeat
// keyframes: kf(t, [[t0, v0], [t1, v1], ...], easeFn); values may be numbers or arrays
function kf(t, keys, e = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i], k = e((t - a) / (b - a));
      return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
}
function mixCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = i => Math.round(lerp((pa >> i) & 255, (pb >> i) & 255, clamp(k)));
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}
// hand-drawn jitter, reseeded 12×/s so outlines gently "boil"
const jit = a => (random() * 2 - 1) * a;
const shakeXY = (S, amt) => { const f = Math.floor(S * 24); return [(hash(f * 1.7) - .5) * 2 * amt, (hash(f * 2.3 + 9) - .5) * 2 * amt]; };

// ---------- camera (world space) ----------
// camBegin(cx, cy, zoom, rot): world point (cx, cy) lands in the frame centre. Always pair with camEnd().
let CAM = null;
function camBegin(cx = 960, cy = 960, zoom = 1, rot = 0) {
  push(); translate(960, 960); rotate(rot); scale(zoom); translate(-cx, -cy); CAM = { cx, cy, zoom, rot };
}
function camEnd() { pop(); CAM = null; }
// world → frame coordinates (frame units, before SCALE)
function toFrame(x, y) {
  let fx = x, fy = y;
  if (CAM) {
    const c = Math.cos(CAM.rot), s = Math.sin(CAM.rot), dx = (x - CAM.cx) * CAM.zoom, dy = (y - CAM.cy) * CAM.zoom;
    fx = 960 + dx * c - dy * s; fy = 960 + dx * s + dy * c;
  }
  return [fx + OX, fy + OY];
}
// frame rectangle expressed in world coordinates (no camera): handy for full-frame fills
const FRAME = { x0: -OX, y0: -OY, x1: -OX + FW, y1: -OY + FH };

// ---------- geometry ----------
function rectPts(x, y, w, h, j = 0) {
  return [[x + jit(j), y + jit(j)], [x + w / 2 + jit(j), y + jit(j) * .5], [x + w + jit(j), y + jit(j)],
          [x + w + jit(j) * .5, y + h / 2], [x + w + jit(j), y + h + jit(j)], [x + w / 2 + jit(j), y + h + jit(j) * .5],
          [x + jit(j), y + h + jit(j)], [x + jit(j) * .5, y + h / 2]];
}
function ellPts(cx, cy, rx, ry, n = 28, j = 0, rot = 0) {
  const p = []; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; p.push([cx + Math.cos(a) * rx + jit(j), cy + Math.sin(a) * ry + jit(j)]); } return p;
}
function rrPts(x, y, w, h, r, j = 0) {
  const p = [], n = 5, corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r + jit(j), cy + Math.sin(a) * r + jit(j)]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return p;
}
function starPts(cx, cy, r, inner = .42, n = 5, rot = -Math.PI / 2) {
  const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, q = i % 2 ? r * inner : r; p.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return p;
}
function heartPts(cx, cy, r) {
  const p = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); p.push([cx + x * r / 16, cy - y * r / 16]); } return p;
}
// a thick limb along a polyline, as a closed shape (sleeves, legs, arms)
function limbPts(path, w0, w1 = w0) {
  const L = [], R = [], n = path.length;
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([path[i][0] - dy / d * w, path[i][1] + dx / d * w]); R.push([path[i][0] + dy / d * w, path[i][1] - dx / d * w]);
  }
  return [...L, ...R.reverse()];
}
// transform a point list: rotate by a around (ox, oy), then shift
function xform(pts, ox, oy, a = 0, sx = 1, sy = sx) {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => { const dx = (x - ox) * sx, dy = (y - oy) * sy; return [ox + dx * c - dy * s, oy + dx * s + dy * c]; });
}

// ---------- paint ----------
// paint(pts, {wash, washOp, fill, fillOp, bleed, tex, border, ink, sw, br, curv})
//  wash: flat colour (reads solidly: characters, props) · fill: watercolour with bleeding edges (backgrounds, glows)
//  ink: outline colour (null = no outline) · sw: outline weight · curv: smooth the outline through the points
function paint(pts, o = {}) {
  if (o.wash || o.fill) {
    if (o.wash) brush.wash(o.wash, o.washOp ?? 255); else brush.noWash();
    if (o.fill) { brush.fill(o.fill, o.fillOp ?? 160); brush.fillBleed(o.bleed ?? .12); brush.fillTexture(o.tex ?? .45, o.border ?? .4); } else brush.noFill();
    brush.noHatch(); brush.noStroke();
    if (o.curv) { brush.beginShape(o.curv); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true); }
    else brush.polygon(pts);
  }
  if (o.ink !== null) {
    brush.noWash(); brush.noFill(); brush.noHatch(); brush.set(o.br || 'ink', o.ink || PAL.ink, o.sw ?? 1);
    brush.beginShape(o.curv || 0); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true);
  }
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  brush.noFill(); brush.noWash(); brush.noHatch(); brush.set(br, col, sw); brush.spline(pts, curv);
}
// a full-frame flat colour (world coords of the visible frame, generous margin)
// the visible frame in world coordinates (through the camera, if one is active), grown by margin m
function viewRect(m = 80) {
  if (!CAM) return [FRAME.x0 - m, FRAME.y0 - m, FW + 2 * m, FH + 2 * m];
  const r = Math.abs(Math.cos(CAM.rot)) + Math.abs(Math.sin(CAM.rot)), hw = FW / 2 / CAM.zoom * r + m, hh = FH / 2 / CAM.zoom * r + m;
  return [CAM.cx - hw, CAM.cy - hh, 2 * hw, 2 * hh];
}
function frameWash(col, op = 255) { paint(rectPts(...viewRect()), { wash: col, washOp: op, ink: null }); }

// ---------- lettering (2D overlay, placed through the camera) ----------
let LETTERS = [];
function letter(txt, x, y, size, color, o = {}) {
  if (!o.screen) { [x, y] = toFrame(x, y); if (CAM) { size *= CAM.zoom; o = { ...o, rot: (o.rot || 0) + CAM.rot }; } }
  LETTERS.push({ txt, x, y, size, color, ...o });
}
// comic sound effect: pops in at age 0, wobbles, fades by life
function sfx(txt, x, y, size, color, age, o = {}) {
  const life = o.life ?? 1.1; if (age < 0 || age > life) return;
  letter(txt, x, y, size, color, { pop: age * 5, rot: (o.rot ?? -.08) + Math.sin(age * 22) * .03 * (1 - age / life), alpha: 1 - seg(age, life - .25, life), stroke: PAL.cream, ...o });
}
function drawLetters(c) {
  for (const L of LETTERS) {
    const k = L.pop != null ? backOut(L.pop) : 1; if (k <= .01) continue;
    c.save(); c.scale(SCALE, SCALE); c.translate(L.x, L.y); c.rotate(L.rot || 0); c.scale(k, k); c.globalAlpha = clamp(L.alpha ?? 1);
    c.font = L.font || `${L.size}px "Permanent Marker"`;
    c.textAlign = L.align || 'center'; c.textBaseline = 'middle';
    if (L.stroke) { c.lineJoin = 'round'; c.lineWidth = L.size * .16; c.strokeStyle = L.stroke; c.strokeText(L.txt, 0, 0); }
    if (L.shadow !== false) { c.fillStyle = PAL.ink; c.fillText(L.txt, L.size * .045, L.size * .055); }
    c.fillStyle = L.color; c.fillText(L.txt, 0, 0);
    c.restore();
  }
}

// ---------- paper, grain ----------
function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function makePaper() {
  const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext, rnd = lcg(21);
  c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    const x = rnd() * W, y = rnd() * H, r = (100 + rnd() * 360) * SCALE, gr = c.createRadialGradient(x, y, 0, x, y, r), a = .05 * rnd();
    gr.addColorStop(0, `rgba(165,128,82,${a})`); gr.addColorStop(1, 'rgba(165,128,82,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.lineWidth = Math.max(1, SCALE);
  for (let i = 0; i < 1500 * SCALE * SCALE + 200; i++) {
    const x = rnd() * W, y = rnd() * H, l = (6 + rnd() * 24) * SCALE, a = rnd() * TAU;
    c.strokeStyle = `rgba(112,90,62,${.03 + rnd() * .06})`; c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  return g;
}
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), rnd = lcg(7);
  const id = c.createImageData(W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 255 - (rnd() < .5 ? rnd() * rnd() * 30 : 0); d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 3; d[i + 3] = 255; }
  c.putImageData(id, 0, 0);
  const r = Math.max(W, H), g = c.createRadialGradient(W / 2, H / 2, r * .32, W / 2, H / 2, r * .75);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,92,66,.32)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  return cv;
}

function defineBrushes() {
  brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], rotate: 'natural', noise: .15 });
  brush.add('inkfine', { type: 'default', weight: 2.6, scatter: .15, sharpness: .85, grain: 40, opacity: 230, spacing: .2, pressure: [1.1, .8], rotate: 'natural', noise: .1 });
  brush.add('dry', { type: 'default', weight: 14, scatter: 3, sharpness: .3, grain: 6, opacity: 90, spacing: .6, pressure: [1, .6], rotate: 'natural', noise: .4 });
}

// force p5.brush to composite everything queued so far (so later 2D letters land on top)
function flushBrush() {
  brush.noStroke(); brush.noHatch(); brush.noWash(); brush.fill('#000000', 1); brush.fillBleed(0); brush.fillTexture(0, 0);
  brush.polygon([[-5000, -5000], [-4990, -5000], [-4990, -4990]]); brush.noFill();
}

// ---------- frame ----------
let S = 0, paperG = null, grainC = null, outC = null, outX = null;
async function setup() {
  createCanvas(W, H, WEBGL); pixelDensity(1); noLoop();
  brush.scaleBrushes(5 * SCALE); defineBrushes();
  paperG = makePaper(); grainC = makeGrain();
  outC = document.getElementById('out'); outC.width = W; outC.height = H; outX = outC.getContext('2d');
  await Promise.all([document.fonts.load('100px "Permanent Marker"'), document.fonts.load('700 60px "Fredoka"'), document.fonts.load('600 60px "Fredoka"')]);
  window.ready = true;
}
function draw() {
  if (!window.ready) return;
  LETTERS = []; CAM = null;
  push(); translate(-W / 2, -H / 2);
  image(paperG, 0, 0);
  scale(SCALE); translate(OX, OY);                      // world coordinates from here on
  randomSeed(1000 + Math.floor(S * BOIL)); noiseSeed(77);
  drawWorld(S);
  flushBrush();
  pop();
}
const GRADE = Q.get('grade') || 'contrast(1.16) saturate(1.25)';   // ?grade=none to compare
let VIG = null;
function composite() {
  const c = outX;
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // colour grade: a touch more contrast and saturation so the watercolour reads punchier on a phone
  c.filter = GRADE; c.drawImage(drawingContext.canvas, 0, 0, W, H); c.filter = 'none';
  // soft vignette pulls the eye to the centre
  if (!VIG) { VIG = document.createElement('canvas'); VIG.width = W; VIG.height = H; const v = VIG.getContext('2d'), g = v.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(182,168,192,1)'); v.fillStyle = g; v.fillRect(0, 0, W, H); }
  c.globalCompositeOperation = 'multiply'; c.drawImage(VIG, 0, 0); c.globalCompositeOperation = 'source-over';
  drawLetters(c);
  c.globalCompositeOperation = 'multiply'; c.drawImage(grainC, 0, 0);
  c.globalCompositeOperation = 'source-over';
  drawOverlay(c, S);                                     // karaoke, end card text (timeline.js)
}
// render at EDIT time t (seconds into the chosen cut)
window.renderAt = async (t, type = 'image/jpeg', q = .92) => { S = editToSong(t); await redraw(); composite(); return outC.toDataURL(type, q); };
window.renderSong = async (s, type = 'image/jpeg', q = .92) => { S = s; await redraw(); composite(); return outC.toDataURL(type, q); };
window.gpuInfo = () => { const gl = drawingContext, e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };

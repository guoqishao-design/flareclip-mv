// timeline.js: cuts (edit time → song time), shot registry, karaoke and end-card overlay.

// Cuts of the song, from assets/edits.json. Each segment plays song time [src_start, src_end) starting at edit_start.
const EDITS = { ...CUTS, full: { duration: SONG_DUR, segments: [{ src_start: 0, src_end: SONG_DUR, edit_start: 0 }] } };
const EDIT = EDITS[Q.get('edit') || '30s'] || EDITS['30s'];
function editToSong(t) {
  let seg = EDIT.segments[0];
  for (const s of EDIT.segments) if (t >= s.edit_start) seg = s;
  return Math.min(seg.src_end - 1e-3, seg.src_start + (t - seg.edit_start));
}

// Shot registry: shot(a, b, fn) paints song time [a, b). fn(S, lt, dur) must paint the whole frame.
const SHOTS = [];
function shot(a, b, fn) { SHOTS.push({ a, b, fn }); SHOTS.sort((x, y) => x.a - y.a); }
let MODEL = null;                                       // set by ?model=<name> for character sheets

// Time warp: the shots were designed on a "design" bar grid; WARP says which design bars play during which real
// bars of the song, so every shot lands on the line it illustrates (the lyric times come from the vocal alignment).
// Each entry: [realFrom, realTo, designFrom, designTo, variant] in bars (fractions allowed). Bars map linearly.
// Shot progress uses design time. Beat-driven motion must use REAL_S, because warping changes beat phase.
const WARP = [
  [0, 2, 0, 2],             // (full MV only) title card
  [2, 4, 2, 4],             // cold-open hook: 3 hours / 0 views → SNIP → 30 seconds / 24.8K
  [4, 6.5, 4, 5],           // "Three hours live": the empty monitor, a tumbleweed
  [6.5, 8, 5, 6],           // "…and nobody stayed": the streamer nods off, Snip pops out of the monitor
  [8, 11, 0, 2],            // instrumental: the CLIP IT title card
  [11, 14, 6, 9],           // "Went live at nine, went on and on"
  [14, 15.5, 9, 12],        // "Said something genius, then it was gone"
  [15.5, 17.2, 12, 15],     // "Buried at hour two, minute ten"
  [17.2, 19.7, 15, 18],     // "Nobody's scrolling back again"
  [19.7, 22.2, 18, 21],     // "The gold is in there, deep in the tape"
  [22.2, 24, 21, 22],       // "It just needs a little help to escape": Snip winds up on the monitor
  [24, 24.9, 22, 23],       // chorus 1: "Clip it, clip it (snip, snip)"
  [24.9, 26, 23, 24],       //   "Cut it to the good bit"
  [26, 26.8, 24, 25],       //   "Three hours in, thirty seconds out"
  [26.8, 27.7, 25, 26],     //   "That's the part they talk about"
  [27.7, 30, 26, 27],       //   "Clip it, clip it (snip, snip)"
  [30, 31.3, 27, 28],       //   "Now the whole world's seen it"
  [31.3, 32.6, 28, 30],     //   the full house
  [32.6, 34, 30, 31],       // DAY 2
  [34, 36.4, 31, 31.45],    // waiting to drop the file…
  [36.4, 38.5, 31.45, 34],  // "Drop the stream in, grab a drink"
  [38.5, 40.3, 34, 37],     // "Twenty clips back before you blink"
  [40.3, 42.3, 37, 40],     // "Face in the frame, words that glow"
  [42.3, 44.5, 40, 43],     // "Every language, ready to go"
  [44.5, 45.85, 43, 44],    // chorus 2 (chorus-1 shots in the alternate colours, part2.js)
  [45.85, 47.4, 44, 45],
  [47.4, 49, 45, 46],
  [49, 50.4, 46, 47],
  [50.4, 51.2, 47, 48],
  [51.2, 53, 48, 49.5],
  [53, 54.9, 51, 54],       // instrumental break
  [54.9, 58.6, 54, 57],     // "Long, long video? Let it go"
  [58.6, 61, 57, 61],       // "Flare Clip, clip it, steal the show"
  [61, 69, 22, 30],         // (full MV only) final choruses, until proper shots exist
  [69, 77, 43, 51],
  [77, 85, 22, 30],
];
function barAtF(f) { const i = Math.floor(f); return lerp(barAt(i), barAt(i + 1), f - i); }
let REAL_S = 0;                                         // real song time of the frame being drawn
function warpSong(S) {
  const rb = barOf(S);
  for (const [r0, r1, d0, d1] of WARP) if (rb >= r0 && rb < r1) return barAtF(d0 + (rb - r0) * (d1 - d0) / (r1 - r0));
  return S;
}
function drawWorld(S) {
  REAL_S = S;
  if (MODEL) { MODEL(S); return; }
  const D = warpSong(S);
  const sh = SHOTS.find(x => D >= x.a && D < x.b);
  if (!sh) { frameWash(PAL.paper); return; }
  sh.fn(D, D - sh.a, sh.b - sh.a);
  CAM = null;
}

// Lyrics in song time. Timings are aligned against the rendered edit audio.
const LYRICS = [];
function lyric(t0, t1, text) { LYRICS.push({ t0, t1, text }); }

function drawOverlay(c, S) {
  karaoke(c, S);
  // The song is a fictional creator story, not a promise about plan limits or view counts.
  if (S >= 72.1 && S < 87) {
    c.save(); c.scale(SCALE, SCALE); c.font = '600 28px "Fredoka"'; c.textAlign = 'center';
    const label = 'Animated story · clip limits vary by plan', y = FMT === 'v' ? 200 : 75;
    const width = c.measureText(label).width + 40;
    c.fillStyle = 'rgba(42,34,48,.85)'; c.beginPath(); c.roundRect(FW / 2 - width / 2, y - 30, width, 44, 12); c.fill();
    c.fillStyle = PAL.cream; c.fillText(label, FW / 2, y); c.restore();
  }
  if (window.endCard) window.endCard(c, S);
}
function karaoke(c, S) {
  const L = LYRICS.find(l => S >= l.t0 - .08 && S < l.t1 + .15); if (!L) return;
  const k = ease(seg(S, L.t0 - .08, L.t0 + .1)) * (1 - ease(seg(S, L.t1, L.t1 + .15)));
  if (k < .02) return;
  const size = FMT === 'v' ? 64 : 56, y = FMT === 'v' ? 1470 : 985, maxW = FMT === 'v' ? 960 : 1500;
  c.save(); c.scale(SCALE, SCALE); c.globalAlpha = k;
  c.font = `700 ${size}px "Fredoka"`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = Math.min(maxW, c.measureText(L.text).width), x = FW / 2;
  const s = Math.min(1, maxW / c.measureText(L.text).width);
  c.translate(x, y + (1 - k) * 18); c.scale(s, s);
  const pw = w / s + size * .9, ph = size * 1.35;
  c.fillStyle = 'rgba(42,34,48,.82)';
  c.beginPath(); c.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); c.fill();
  // sweep: sung part in gold, the rest in cream
  const p = clamp((S - L.t0) / Math.max(.2, L.t1 - L.t0 - .1));
  const tw = c.measureText(L.text).width, x0 = -tw / 2;
  c.fillStyle = PAL.cream; c.fillText(L.text, 0, 2);
  c.save(); c.beginPath(); c.rect(x0, -ph / 2, tw * p, ph); c.clip(); c.fillStyle = PAL.gold; c.fillText(L.text, 0, 2); c.restore();
  c.restore();
}

// Contact sheet of several edit times (quick visual checks)
window.renderSheet = async (times, cols = 3, w = 360) => {
  const h = Math.round(w * H / W), rows = Math.ceil(times.length / cols), sc = document.createElement('canvas');
  sc.width = cols * w; sc.height = rows * h; const c = sc.getContext('2d'), ms = [];
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now(); S = editToSong(times[i]); await redraw(); composite(); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * h;
    c.drawImage(outC, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x, y, 70, 22); c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 5, y + 16);
  }
  return { url: sc.toDataURL('image/jpeg', .88), ms };
};

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
function drawWorld(S) {
  if (MODEL) { MODEL(S); return; }
  const sh = SHOTS.find(x => S >= x.a && S < x.b);
  if (!sh) { frameWash(PAL.paper); return; }
  sh.fn(S, S - sh.a, sh.b - sh.a);
  CAM = null;
}

// Lyrics in song time. Timings are aligned against the rendered edit audio.
const LYRICS = [];
function lyric(t0, t1, text) { LYRICS.push({ t0, t1, text }); }

function drawOverlay(c, S) {
  karaoke(c, S);
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

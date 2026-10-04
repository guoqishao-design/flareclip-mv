# CLAUDE.md — flareclip-mv

Watercolor music video for FlareClip's song "Clip It". Every frame is painted by p5.js 2 + p5.brush (WebGL) in
headless Chrome (puppeteer-core) and encoded with ffmpeg. One 1920×1920 "world" is framed two ways:
vertical 9:16 (world x 420–1500, full height) and horizontal 16:9 (world y 420–1500, full width).
Maintainer: FlareClip (GitHub guoqishao-design). The user writes in Chinese; reply in Chinese. Code, comments and commits in English.

## Commands

```bash
npm ci
node render.mjs --sheet=1,20,40,60,80,100,118 --edit=2min --fmt=v --scale=0.5 --out=out/check.jpg  # contact sheet: the main review tool
node render.mjs --all --edit=2min            # frames + mp4, both formats (out/clipit-2min-{v,h}.mp4)
node render.mjs --all --fmt=v --range=0,3 --out=out/bench.mp4   # speed test
node render.mjs --model=cast --fmt=h --out=out/cast.jpg         # character sheets (snip | cast)
python3 tools/cuts.py                        # after editing assets/edits.json: rebuild cut audio + CUTS/DUR tables
```

- In a Linux container add `--no-sandbox` (Chrome runs as root). The sandbox stays on by default for the owner's Mac.
- Linux uses SwiftShader (CPU): a full frame costs seconds to a minute, so check with `--sheet` at `--scale=0.5`,
  never full renders. Run long sheets in the background (`setsid nohup … &`) and poll; tool calls time out at 10 min.
  `ms/frame` printed by `--sheet` is misleading (GPU work is flushed later).
- Final videos render on an Apple Silicon Mac (Metal). Frames cache in `out/cache/<fingerprint>/frames-<edit>-<fmt>/`.
  Source, audio, dependency lock, fps and scale changes create a new cache automatically. Preserve older caches.
  Outputs default to `out/renders/<fingerprint>/`; use `--outdir=out/releases/v1.1.0` for a release.
- `assets/clipit.mp3` (the full song) is not in Git; only the cut mp3s are. `tools/cuts.py` needs the full song.

## Time model (read this before touching timing)

- **Song time** `S` (seconds into the full song). `src/music.js` holds detected `BEATS`/`BARS` (generated; edit via tools).
  Helpers in `src/core.js`: `barAt(n)` (integer bars only), `beatAt(i)`, `bpOf(S)`, `barOf(S)` (fractional),
  `pulse(S)`; `BB(n, k)` in scenes.js = beat k of bar n. `barAtF(f)` (timeline.js) for fractional bars.
- **Edit time**: each cut in `CUTS` (from `assets/edits.json`) maps edit seconds → song seconds (`editToSong`).
  Cuts: 15s (hook + chorus lines 1–4 + final chorus line + 2-second end card), 30s (hook + pre-chorus + chorus + 2-second end card), 60s, 2min.
- **Design time**: shots were authored on a design bar grid. `WARP` in `src/timeline.js` maps real song bars →
  design bars piecewise, so each shot plays exactly while its lyric is sung. To move a shot, edit `WARP`, not the shot.
  Inside a shot, `S` is design time; the real song time is `REAL_S` (use it for beat pulses if a shot is stretched).
- **Lyrics** (`lyric(t0, t1, text)` in scenes.js / verse.js / part2.js) are in **real song time**, aligned to the vocal.
  Karaoke uses real time; don't shift lyrics when changing `WARP`.
- Real song structure (bars): intro hook 2–4 · "Three hours live / nobody stayed" 5–8 · instrumental (title card) 8–11 ·
  verse 1 11–19 · pre-chorus 19.7–24 · chorus 1 24–31 · verse 2 36.5–44.5 · chorus 2 44.5–52.5 · break 53–55 ·
  bridge 55–61 · final choruses 61–85 (no dedicated shots yet) · outro 85–end.

## Code map

- `src/core.js` — canvas, camera (`camBegin/camEnd`, `viewRect`, `frameWash`), painting (`paint`, `inkLine`), lettering
  (`letter`, `sfx`), brushes, colour grade + vignette (`GRADE`, `?grade=none`), `renderAt`.
- `src/timeline.js` — cuts, shot registry (`shot(a, b, fn)` in design time), `WARP`, karaoke overlay.
- `src/hook.js` — cold open (bars 2–4) and the CLIP IT title card (design bars 0–2).
- `src/scenes.js` — "nobody stayed", chorus 1 (design bars 21–30), outro and end card (bars 85–end), `deskScene`.
- `src/verse.js` — verse 1 + pre-chorus (design bars 6–21). `src/part2.js` — day 2, verse 2, chorus 2 (chorus-1 shots
  replayed with `VARIANT = 1` colours via `vc(a, b)`), break, bridge, build-up. `SEC` = design bar of each section.
- `src/chars.js` — Snip (mascot: flame with scissor hands) and the streamer. `src/cast2.js` — Mochi the cat, `fan()`
  audience people, `fanRow`, `ambient()` particles, room decor. `src/props.js` — monitor, tape, clip cards, machine…
- `vendor/p5.brush.js` — patched copy (`isInCanvas()` always true; the original ignored the camera transform and dropped
  strokes). Keep using the vendored file.

## Gotchas

- Always design for both formats: key action inside the centre square (420–1500 both axes); put per-format positions
  behind `VERT ? … : …`. Check both `--fmt=v` and `--fmt=h` sheets before committing visual changes.
- `letter()`/`sfx()` text is a 2D overlay drawn above all paint and positioned through the camera only (not through
  `push/translate/rotate`). Never call them inside a local transform; anything painted later cannot cover text.
- Never name a local variable `pop` (shadows p5's `pop()`). `barAt()` takes integers; use `barAtF()` for fractions.
- Frames must be pure functions of time (deterministic `hash()`, no `Math.random()`): renders run in parallel workers.
- Karaoke sits at frame y≈1470 (vertical) / y≈985 (horizontal); keep important art out of that band.

## Conventions

- Commits: author "FlareClip <support@flareclip.com>"; small, descriptive English messages.
- Don't push to `main` unless the owner asks; use a branch. Don't commit `out/`, `node_modules/`, or the full song.
- Licensing: code MIT; song, lyrics, FlareClip brand, Snip, Mochi, previews and videos are all rights reserved
  (`ASSETS_LICENSE.md`). The song was generated on a paid Mureka plan.

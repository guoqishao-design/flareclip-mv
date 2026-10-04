# FlareClip — “Clip It” Watercolor Music Video

[![FlareClip watercolor music video preview](preview/2min-horizontal.jpg)](https://github.com/guoqishao-design/flareclip-mv/releases/latest)

**[Watch / download the videos](https://github.com/guoqishao-design/flareclip-mv/releases/latest)** · **[Try FlareClip](https://flareclip.com/?utm_source=github&utm_medium=referral&utm_campaign=clip_it_mv)** · [How the animation works](#how-it-works)

The official open-source FlareClip music-video project: a frame-by-frame watercolor animation rendered with p5.js, WebGL, Puppeteer, and FFmpeg. One square animation world produces both 9:16 vertical video and 16:9 horizontal video, with beat-aware motion and lyrics aligned to the recorded vocal.

**[Turn long videos into short, shareable clips with FlareClip →](https://flareclip.com/)**

> Music disclosure: “Clip It” was generated with Mureka under a paid plan. The soundtrack is AI-generated. See [Asset licensing](#asset-licensing) before reusing any bundled media or FlareClip brand elements.

The MV tells an illustrated creator story. Its view counters, clip counts and sung lyrics are illustrative, not measured customer results or promises about current plan limits. See [FlareClip](https://flareclip.com/) for current product capabilities. Source code is MIT-licensed; music, artwork and video rights are separate.

## Version 1.1

- A cold open shows the long-stream / short-clip contrast in the first seconds.
- Shot timing follows the vocal alignment; beat pulses follow real song time even when a shot is stretched.
- The 15-second and 30-second edits have two-second end cards and complete lyric phrases.
- Vertical opening graphics leave more space at the bottom for social-player controls.
- Frame caches are content-addressed, so changed animation cannot silently reuse old frames.

| Edit | Duration | Formats |
|---|---:|---|
| Short hook | 15.08 s | 1080×1920 and 1920×1080 |
| Chorus cut | 27.96 s | 1080×1920 and 1920×1080 |
| One-minute story | 58.54 s | 1080×1920 and 1920×1080 |
| Complete MV | 120.50 s | 1080×1920 and 1920×1080 |

Edit names (`15s`, `30s`, `60s`, `2min`) are approximate. The release includes matching SRT captions, checksums and a manifest identifying the source commit. The earlier [v1.0.0 release](https://github.com/guoqishao-design/flareclip-mv/releases/tag/v1.0.0) remains available.

## What this project demonstrates

- Deterministic, frame-by-frame p5.js animation in headless Chrome
- A watercolor rendering style built with p5.brush and WebGL
- One animation timeline for 9:16 and 16:9 compositions
- Beat-aware motion driven by detected musical timing
- Vocal-aligned, burned-in English lyrics
- Resumable parallel frame rendering and FFmpeg encoding

The final 2-minute videos are distributed through this repository's GitHub Releases rather than committed to Git. Preview stills are available in [`preview/`](preview/).

## Requirements

- Node.js 22.12 or newer (required by the locked Puppeteer dependency)
- FFmpeg
- Google Chrome or another Chromium-based browser

On macOS, install FFmpeg with:

```bash
brew install ffmpeg
```

The renderer automatically looks for Google Chrome in its standard macOS and Windows locations. For another browser location, pass its executable explicitly:

```bash
node render.mjs --all --edit=2min --chrome="/path/to/chrome"
```

Chrome's sandbox remains enabled by default. Use `--no-sandbox` only inside a trusted, isolated CI or container environment when Chrome cannot launch otherwise.

## Quick start

```bash
npm ci

# Render a three-second vertical benchmark first.
npm run bench

# Render the complete 2-minute MV in vertical and horizontal formats.
npm run render:2min
```

The benchmark prints the active GPU. On Apple Silicon it should contain `Apple` and `Metal`. If it contains `SwiftShader`, retry with a visible Chrome window:

```bash
node render.mjs --all --fmt=v --range=0,3 --out=out/bench.mp4 --headful
```

Completed frames are cached under `out/cache/<fingerprint>/frames-<edit>-<format>/`. The fingerprint includes animation source, audio, the dependency lock, frame rate and scale. Re-running the same command skips complete JPEGs; changed inputs create a separate cache. Older caches and renders remain untouched.

MP4s default to `out/renders/<fingerprint>/`. To collect all formats in a named directory, use `--outdir=out/releases/v1.1.0`. Existing MP4s are not replaced unless `--overwrite` is explicitly supplied. `--range=4,7` encodes only those three seconds and seeks the audio to the matching time.

## Render options

```bash
# Other edits
npm run render:60s
npm run render:30s
npm run render:15s

# One format only: v = vertical, h = horizontal
node render.mjs --all --edit=2min --fmt=v

# Re-encode already-rendered frames
node render.mjs --encode --edit=2min

# Contact sheet at selected edit times
node render.mjs --sheet=1,20,40,60,80,100,118 --fmt=h --scale=0.5 --out=out/check.jpg

# Character sheets
node render.mjs --model=snip --out=out/model.jpg
node render.mjs --model=cast --fmt=h --out=out/cast.jpg
```

`--workers=3` is the default. Apple Silicon machines can often use 4; reduce it to 2 if the computer becomes unresponsive.

## How it works

- [`src/core.js`](src/core.js) — canvas, camera, deterministic watercolor rendering, typography, paper and grain
- [`src/scenes.js`](src/scenes.js) — intro, first chorus, and outro
- [`src/hook.js`](src/hook.js) — before/after cold open and animated title card
- [`src/verse.js`](src/verse.js) — first verse and pre-chorus
- [`src/part2.js`](src/part2.js) — second verse, second chorus, instrumental section, and bridge
- [`src/timeline.js`](src/timeline.js) — edit-time to song-time mapping and vocal-aligned lyrics
- [`src/music.js`](src/music.js) — detected beats and bars
- [`src/chars.js`](src/chars.js) — Snip, FlareClip's flame-and-scissors mascot, and the streamer
- [`src/cast2.js`](src/cast2.js) — Mochi the cat, audience characters, room set, and particles
- [`src/props.js`](src/props.js) — props and environmental details
- [`render.mjs`](render.mjs) — Chrome orchestration, parallel JPEG frame rendering, resume support, and FFmpeg encoding

The edit map converts edit time to real song time. `WARP` then maps real song time into the design time used by each shot. Lyrics and musical pulses stay on real song time; shot progress uses design time. The same animation system serves all four cuts and both formats.

To rebuild the short cuts without the private full song, reuse the relevant passages of the bundled two-minute audio:

```bash
python3 tools/cuts.py 15s 30s --source assets/clipit-2min.mp3 --source-edit 2min
npm test
node tools/export-captions.mjs --outdir=out/captions
```

The full song is required only for edits that need passages absent from the bundled source audio. Do not shift lyric timestamps when adjusting shot timing. [Rendering and timing notes](CLAUDE.md) describe the time model and review commands.

For quick visual debugging, open `studio.html?fmt=v&edit=2min` in Chrome and run `renderAt(seconds)` in the browser console.

## Output sizes

Full-resolution rendering produces thousands of JPEG frames and can use several gigabytes of local disk space. The entire `out/` directory is intentionally ignored by Git. Keep final MP4 files in GitHub Releases or another media host rather than in repository history.

## Asset licensing

The original rendering source code is available under the [MIT License](LICENSE).

The FlareClip name and visual identity, Snip character, lyrics, soundtrack, preview images, and rendered videos are governed by [`ASSETS_LICENSE.md`](ASSETS_LICENSE.md) and are not included in the MIT grant. No trademark rights are granted.

Third-party components retain their original licenses. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`vendor/p5.brush.LICENSE.md`](vendor/p5.brush.LICENSE.md).

Please report security issues privately as described in [`SECURITY.md`](SECURITY.md). Do not include credentials, private media, or other sensitive information in a public issue.

External contributions follow the zero-trust review requirements in [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull-request code is not executed automatically.

## About FlareClip

[FlareClip](https://flareclip.com/) turns long videos into short, shareable clips with viral titles, reframing, captions, and publishing tools.

Copyright © 2026 FlareClip. The code and media have different licensing terms as described above.

---

## 中文说明

这是 FlareClip 歌曲《Clip It》的程序化水彩动画 MV。动画由 p5.js、p5.brush 和 WebGL 逐帧绘制，再由 FFmpeg 编码成横版与竖版视频。字幕时间已经依据实际演唱音频校准。

```bash
npm ci
npm run bench
npm run render:2min
```

逐帧缓存和最终 MP4 位于 `out/`，不会提交到 Git。完整成片通过 GitHub Releases 发布。访问 **[FlareClip 官网](https://flareclip.com/)**，了解如何把长视频转换为适合 YouTube Shorts、TikTok 和 Reels 的短片。

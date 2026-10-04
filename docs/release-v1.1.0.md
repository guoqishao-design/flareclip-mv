# Clip It MV v1.1.0

This release brings the public videos up to date with the vocal-aligned animation and cold open, and improves the short edits for social viewing.

## Watch and download

Eight H.264/AAC MP4s cover four edits in both vertical 1080×1920 and horizontal 1920×1080 formats, at 24 fps:

- `clipit-15s-{v,h}.mp4`: approximately 15.08 seconds, with a two-second end card.
- `clipit-30s-{v,h}.mp4`: approximately 27.96 seconds, with a two-second end card.
- `clipit-60s-{v,h}.mp4`: approximately 58.54 seconds.
- `clipit-2min-{v,h}.mp4`: approximately 120.50 seconds.

Matching SRT captions, SHA-256 checksums and a release manifest identify the media and source revision. The earlier v1.0.0 release remains unchanged.

## Changes

- A before/after cold open introduces the creator story immediately.
- Shot progress uses design time; musical pulses use real song time after vocal timing adjustments.
- The short cuts use complete lyric phrases and a compact end card.
- Vertical opening graphics are positioned farther from the bottom edge.
- Illustrative view and clip counts are identified as part of the animated story.
- Source-, audio-, dependency- and parameter-aware frame caches prevent stale frames from entering new renders.
- Range encoding trims both frames and audio to the requested interval. Incomplete JPEGs are rendered again.
- Completed outputs can be resumed after checksum validation; unrelated existing MP4s require explicit overwrite.
- Node.js 22.12+ is required by the locked Puppeteer version.

## Rights and credits

An official FlareClip project. The soundtrack was generated with Mureka under a paid plan and is identified as AI-generated music. Animation frames are drawn programmatically with p5.js, p5.brush and WebGL, captured with Puppeteer and encoded with FFmpeg.

The original source code is MIT-licensed. The soundtrack, lyrics, characters, brand assets, previews and videos have separate rights under [ASSETS_LICENSE.md](https://github.com/guoqishao-design/flareclip-mv/blob/main/ASSETS_LICENSE.md). Illustrated metrics and lyrics are not customer outcomes or current product entitlements.

[Source code](https://github.com/guoqishao-design/flareclip-mv) · [FlareClip](https://flareclip.com/?utm_source=github&utm_medium=referral&utm_campaign=clip_it_mv)

// Validate every delivered video by decoding frames, then write a public, credential-free manifest.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { renderFingerprint } from './render-config.mjs';

const outdir = process.argv.find(a => a.startsWith('--outdir='))?.slice(9);
if (!outdir) throw new Error('Pass --outdir=out/releases/<version>');
const edits = JSON.parse(readFileSync('assets/edits.json', 'utf8'));
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const assets = [];
for (const edit of ['15s', '30s', '60s', '2min']) {
  const timeline = edits[`clipit-${edit}`];
  const expectedFrames = Math.round(timeline.duration * 24);
  const fingerprint = renderFingerprint('.', { edit, fps: 24, scale: 1, audio: `assets/clipit-${edit}.mp3` });
  for (const fmt of ['v', 'h']) {
    const name = `clipit-${edit}-${fmt}.mp4`, file = join(outdir, name);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_read_frames,r_frame_rate,duration', '-of', 'json', file], { encoding: 'utf8' });
    if (probe.status !== 0 || probe.stderr.trim()) throw new Error(`Decode failed: ${name}\n${probe.stderr}`);
    const info = JSON.parse(probe.stdout), video = info.streams.find(s => s.codec_type === 'video'), audio = info.streams.find(s => s.codec_type === 'audio');
    const [width, height] = fmt === 'v' ? [1080, 1920] : [1920, 1080];
    if (video?.codec_name !== 'h264' || audio?.codec_name !== 'aac' || video.width !== width || video.height !== height
        || video.r_frame_rate !== '24/1' || +video.nb_read_frames !== expectedFrames
        || Math.abs(+video.duration - expectedFrames / 24) > 0.002 || Math.abs(+video.duration - +audio.duration) > 0.06) {
      throw new Error('Unexpected video/audio contract: ' + name);
    }
    const hash = sha256(file), record = JSON.parse(readFileSync(file + '.json', 'utf8'));
    if (record.fingerprint !== fingerprint || record.sha256 !== hash || record.startFrame !== 0 || record.endFrame !== expectedFrames) {
      throw new Error('Render provenance does not match current sources: ' + name);
    }
    assets.push({ name, bytes: statSync(file).size, sha256: hash, duration: +info.format.duration, width, height, fps: 24, frames: expectedFrames, fingerprint });
    console.log(`Verified ${name}: ${info.format.duration}s, ${expectedFrames} decoded frames`);
  }
  const name = `clipit-${edit}.srt`, file = join(outdir, name);
  assets.push({ name, bytes: statSync(file).size, sha256: sha256(file) });
}
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const manifest = { project: 'FlareClip — Clip It', source: 'https://github.com/guoqishao-design/flareclip-mv', sourceCommit,
  createdAt: new Date().toISOString(), renderer: 'p5.js / WebGL / Puppeteer / FFmpeg', assets };
writeFileSync(join(outdir, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const sums = assets.map(a => `${a.sha256}  ${a.name}`);
sums.push(`${sha256(join(outdir, 'release-manifest.json'))}  release-manifest.json`);
writeFileSync(join(outdir, 'flareclip-release-SHA256SUMS.txt'), sums.join('\n') + '\n');
console.log('Wrote release manifest and SHA-256 checksums.');

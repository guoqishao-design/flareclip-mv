import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function frameRange(duration, fps, range) {
  if (!(Number.isFinite(fps) && fps > 0 && fps <= 120)) throw new Error('fps must be between 0 and 120');
  const limits = range === undefined ? [0, duration] : String(range).split(',').map(Number);
  if (limits.length !== 2 || !limits.every(Number.isFinite) || limits[0] < 0 || limits[1] <= limits[0] || limits[1] > duration) {
    throw new Error(`range must be start,end within 0,${duration}`);
  }
  const start = Math.round(limits[0] * fps), end = Math.min(Math.round(duration * fps), Math.round(limits[1] * fps));
  if (end <= start) throw new Error('range must contain at least one frame');
  return { start, end, count: end - start, offset: start / fps, duration: (end - start) / fps };
}

export function renderFingerprint(root, settings) {
  const files = ['render.mjs', 'tools/render-config.mjs', 'studio.html', 'package-lock.json', 'vendor/p5.brush.js', 'assets/edits.json', settings.audio,
    ...readdirSync(join(root, 'src')).filter(f => f.endsWith('.js')).sort().map(f => `src/${f}`)];
  const hash = createHash('sha256').update(JSON.stringify({ cacheSchema: 2, ...settings }));
  for (const file of files) hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0');
  return hash.digest('hex').slice(0, 20);
}

export function isCompleteJpeg(buffer) {
  return buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9;
}

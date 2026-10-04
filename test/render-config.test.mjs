import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frameRange, renderFingerprint, isCompleteJpeg } from '../tools/render-config.mjs';

test('range encoding starts at the requested frame and aligns audio', () => {
  assert.deepEqual(frameRange(15, 24, '4,7'), { start: 96, end: 168, count: 72, offset: 4, duration: 3 });
  assert.equal(frameRange(15.094, 24).count, 362);
  for (const range of ['-1,3', '3,2', '0,16', 'a,3', '1', '0,0.001']) assert.throws(() => frameRange(15, 24, range));
  assert.throws(() => frameRange(15, 0));
});

test('source, dependency, audio, fps and scale changes invalidate frame reuse', () => {
  const root = mkdtempSync(join(tmpdir(), 'flareclip-cache-test-'));
  try {
    for (const dir of ['src', 'vendor', 'assets', 'tools']) mkdirSync(join(root, dir));
    const files = ['render.mjs', 'tools/render-config.mjs', 'studio.html', 'package-lock.json', 'vendor/p5.brush.js', 'assets/edits.json', 'assets/audio.mp3', 'src/core.js'];
    for (const file of files) writeFileSync(join(root, file), 'initial');
    const settings = { edit: '15s', fps: 24, scale: 1, audio: 'assets/audio.mp3' };
    const base = renderFingerprint(root, settings);
    assert.equal(base, renderFingerprint(root, settings));
    for (const file of files) {
      writeFileSync(join(root, file), 'changed');
      assert.notEqual(base, renderFingerprint(root, settings), file);
      writeFileSync(join(root, file), 'initial');
    }
    assert.notEqual(base, renderFingerprint(root, { ...settings, fps: 30 }));
    assert.notEqual(base, renderFingerprint(root, { ...settings, scale: 0.5 }));
  } finally { rmSync(root, { recursive: true }); }
});

test('truncated cached JPEGs are rejected', () => {
  assert.equal(isCompleteJpeg(Buffer.from([0xff, 0xd8, 1, 2, 0xff, 0xd9])), true);
  assert.equal(isCompleteJpeg(Buffer.from([0xff, 0xd8, 1, 2])), false);
  assert.equal(isCompleteJpeg(Buffer.from('not an image')), false);
});

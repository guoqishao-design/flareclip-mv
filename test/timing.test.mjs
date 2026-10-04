import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const files = ['src/music.js', 'src/core.js', 'src/timeline.js', 'src/scenes.js', 'src/hook.js', 'src/verse.js', 'src/part2.js'];
function timeline(edit) {
  const context = vm.createContext({ URLSearchParams, location: { search: `?edit=${edit}` }, window: {} });
  for (const file of files) vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file });
  return context;
}

test('generated cut table matches the audio edit source of truth', () => {
  const edits = JSON.parse(readFileSync('assets/edits.json', 'utf8'));
  const context = timeline('15s');
  const cuts = JSON.parse(vm.runInContext('JSON.stringify(CUTS)', context));
  for (const [key, edit] of Object.entries(edits)) {
    assert.deepEqual(cuts[key.replace('clipit-', '')], edit);
    const total = edit.segments.reduce((sum, segment) => sum + segment.src_end - segment.src_start, 0) - 0.04 * (edit.segments.length - 1);
    assert.ok(Math.abs(edit.duration - total) < 0.001);
  }
  for (const name of ['clipit-15s', 'clipit-30s']) {
    const edit = edits[name];
    assert.ok(Math.abs(edit.duration - edit.segments.at(-1).edit_start - 2) < 0.001);
  }
});

test('all released edits have a registered shot for every 24 fps frame', () => {
  for (const edit of ['15s', '30s', '60s', '2min']) {
    const context = timeline(edit);
    assert.equal(vm.runInContext(`(() => {
      for (let frame = 0; frame < Math.round(EDIT.duration * 24); frame++) {
        const design = warpSong(editToSong(frame / 24));
        if (!SHOTS.some(shot => design >= shot.a && design < shot.b)) return frame;
      }
      return -1;
    })()`, context), -1, edit);
  }
});

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = process.argv.find(a => a.startsWith('--outdir='));
const outdir = arg ? arg.slice('--outdir='.length) : 'out/captions';
const lyrics = [];
for (const file of ['src/scenes.js', 'src/verse.js', 'src/part2.js']) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/lyric\(([\d.]+), ([\d.]+), (['"])(.*?)\3\);/g)) {
    lyrics.push({ start: +match[1], end: +match[2], text: match[4] });
  }
}
const timestamp = seconds => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
mkdirSync(outdir, { recursive: true });
for (const [name, edit] of Object.entries(JSON.parse(readFileSync('assets/edits.json', 'utf8')))) {
  const cues = [];
  edit.segments.forEach((segment, i) => {
    const editEnd = edit.segments[i + 1]?.edit_start ?? edit.duration;
    for (const lyric of lyrics) {
      const start = Math.max(lyric.start, segment.src_start) - segment.src_start + segment.edit_start;
      const end = Math.min(lyric.end - segment.src_start + segment.edit_start, editEnd);
      if (end > start) cues.push({ start, end, text: lyric.text });
    }
  });
  cues.sort((a, b) => a.start - b.start);
  writeFileSync(join(outdir, `${name}.srt`), cues.map((cue, i) => `${i + 1}\n${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}\n`).join('\n'));
  console.log(`${name}: ${cues.length} caption cues`);
}

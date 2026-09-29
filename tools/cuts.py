#!/usr/bin/env python3
"""Rebuild the cuts from assets/edits.json.

For every "clipit-<name>" entry it recomputes edit_start/duration from the segments, writes
assets/clipit-<name>.mp3 (40 ms crossfades), and regenerates CUTS in src/music.js and DUR in render.mjs.

Needs the full song at assets/clipit.mp3 (not in Git) and ffmpeg.

    python3 tools/cuts.py            # all cuts
    python3 tools/cuts.py 30s 15s    # only these (audio); code tables are always rewritten
"""
import json, re, subprocess, sys, tempfile, os

XF = 0.04  # crossfade between segments, seconds
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

edits = json.load(open('assets/edits.json'))
only = set(sys.argv[1:])

for key, cut in edits.items():
    segs = cut['segments']
    t = 0.0
    for i, s in enumerate(segs):
        s['edit_start'] = round(t, 3) or 0
        t += (s['src_end'] - s['src_start']) - (XF if i < len(segs) - 1 else 0)
    cut['duration'] = round(t, 3)
    name = key.replace('clipit-', '')
    if only and name not in only:
        continue
    if not os.path.exists('assets/clipit.mp3'):
        sys.exit('assets/clipit.mp3 (the full song) is missing')
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for i, s in enumerate(segs):
            p = f'{tmp}/{i}.wav'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'assets/clipit.mp3', '-af',
                            f"atrim={s['src_start']}:{s['src_end']},asetpts=PTS-STARTPTS", p], check=True)
            parts.append(p)
        cmd = ['ffmpeg', '-v', 'error', '-y']
        for p in parts:
            cmd += ['-i', p]
        if len(parts) > 1:
            chain, last = [], '[0]'
            for i in range(1, len(parts)):
                out = f'[x{i}]' if i < len(parts) - 1 else ''
                chain.append(f'{last}[{i}]acrossfade=d={XF}:c1=tri:c2=tri{out}')
                last = out
            cmd += ['-filter_complex', ';'.join(chain)]
        cmd += ['-c:a', 'libmp3lame', '-b:a', '192k', f'assets/clipit-{name}.mp3']
        subprocess.run(cmd, check=True)
    print(f'{name}: {cut["duration"]} s')

json.dump(edits, open('assets/edits.json', 'w'), indent=1)

cuts = {k.replace('clipit-', ''): v for k, v in edits.items()}
music = open('src/music.js').read()
music = re.sub(r'const CUTS = \{.*?\};', 'const CUTS = ' + json.dumps(cuts) + ';', music, flags=re.S)
open('src/music.js', 'w').write(music)

render = open('render.mjs').read()
durs = ', '.join(f"'{k}': {v['duration']}" for k, v in cuts.items())
render = re.sub(r'const DUR = \{[^}]*\}', f"const DUR = {{ {durs}, full: 172.304 }}", render)
open('render.mjs', 'w').write(render)
print('updated src/music.js and render.mjs')

#!/usr/bin/env python3
"""Rebuild the cuts from assets/edits.json.

For every "clipit-<name>" entry it recomputes edit_start/duration from the segments, writes
assets/clipit-<name>.mp3 (40 ms crossfades), and regenerates CUTS in src/music.js.

Needs the full song at assets/clipit.mp3 (not in Git) and ffmpeg.

    python3 tools/cuts.py            # all cuts
    python3 tools/cuts.py 30s 15s    # only these (audio); code tables are always rewritten
"""
import argparse, json, re, subprocess, sys, tempfile, os

XF = 0.04  # crossfade between segments, seconds
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('edits', nargs='*')
parser.add_argument('--source', default='assets/clipit.mp3', help='Local full-song path; never committed')
parser.add_argument('--source-edit', help='Map song time into a bundled edit, e.g. 2min, instead of a full song')
args = parser.parse_args()
edits = json.load(open('assets/edits.json'))
only = set(args.edits)
unknown = only - {key.replace('clipit-', '') for key in edits}
if unknown:
    sys.exit('Unknown edits: ' + ', '.join(sorted(unknown)))
if not os.path.isfile(args.source):
    sys.exit('Full song is missing; provide --source /path/to/clipit.mp3')
source_segments = edits.get('clipit-' + args.source_edit, {}).get('segments', []) if args.source_edit else None
if args.source_edit and (not source_segments or not only or args.source_edit in only):
    sys.exit('--source-edit requires a known source edit and explicit, different output edits')

def source_range(segment):
    if source_segments is None:
        return segment['src_start'], segment['src_end']
    for part in source_segments:
        if segment['src_start'] >= part['src_start'] and segment['src_end'] <= part['src_end']:
            offset = part['edit_start'] - part['src_start']
            return round(segment['src_start'] + offset, 3), round(segment['src_end'] + offset, 3)
    sys.exit('Requested song segment is not contained in the source edit')

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
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for i, s in enumerate(segs):
            p = f'{tmp}/{i}.wav'
            start, end = source_range(s)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', args.source, '-af',
                            f"atrim={start}:{end},asetpts=PTS-STARTPTS", p], check=True)
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

print('updated assets/edits.json and src/music.js')

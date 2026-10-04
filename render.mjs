// render.mjs: paint frames in headless Chrome and encode MP4s.
//
//   node render.mjs --sheet=0,4,8,12 [--fmt=v|h] [--edit=2min|60s|30s|15s|full] [--scale=0.5] [--cols=4] [--w=360] --out=out/check.jpg
//   node render.mjs --model=snip [--fmt=h] [--scale=0.5] --out=out/model.jpg          character sheet
//   node render.mjs --frames [--fmt=v] [--edit=30s] [--workers=3]                      full-size JPEG frames (resumable)
//   node render.mjs --encode [--fmt=v] [--edit=30s]                                    frames + audio → out/renders/<fingerprint>/
//   node render.mjs --all [--edit=30s] [--workers=3]                                   frames + encode, both formats
//   node render.mjs --all --fmt=v --scale=0.5 --range=0,3 --out=out/test.mp4           quick speed test on 3 seconds
//
// Chrome: --chrome=<path>. Defaults: macOS Google Chrome, Windows Chrome, Linux Playwright Chromium.
// On a Mac the GPU is used through Metal. The first lines print the GPU; "SwiftShader" means software rendering (slow).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { frameRange, renderFingerprint, isCompleteJpeg } from './tools/render-config.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const fps = +(args.fps || 24), scale = +(args.scale || 1), edit = args.edit || '30s';
const edits = JSON.parse(readFileSync('assets/edits.json', 'utf8'));
const DUR = edit === 'full' ? 172.304 : edits[`clipit-${edit}`]?.duration;
const AUDIO = { '2min': 'assets/clipit-2min.mp3', '60s': 'assets/clipit-60s.mp3', '30s': 'assets/clipit-30s.mp3', '15s': 'assets/clipit-15s.mp3', full: 'assets/clipit.mp3' }[edit];
if (!DUR || !AUDIO) throw new Error('Unknown edit: ' + edit);
if (!Number.isFinite(scale) || scale <= 0 || scale > 2) throw new Error('scale must be between 0 and 2');
if (args.fmt && !['v', 'h'].includes(args.fmt)) throw new Error('fmt must be v or h');
if (args.out && !args.fmt && !args.sheet && !args.model) throw new Error('--out requires --fmt; use --outdir for both formats');
const workers = +(args.workers || 3);
if (!Number.isInteger(workers) || workers < 1 || workers > 16) throw new Error('workers must be an integer between 1 and 16');
const range = frameRange(DUR, fps, args.range);
const fingerprint = renderFingerprint('.', { edit, fps, scale, audio: AUDIO });
const cacheDir = fmt => `out/cache/${fingerprint}/frames-${edit}-${fmt}`;
const frameFile = (fmt, i) => `${cacheDir(fmt)}/f${String(i).padStart(5, '0')}.jpg`;
const validFrame = file => existsSync(file) && isCompleteJpeg(readFileSync(file));

const plat = os.platform();
const CHROME = args.chrome || (plat === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : plat === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const GPU_ARGS = plat === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : plat === 'win32' ? ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const run = (cmd, a) => new Promise((ok, bad) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('error', bad); p.on('close', c => c ? bad(new Error(cmd + ' exited ' + c)) : ok()); });
const b64 = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

async function launch() {
  const launchArgs = ['--allow-file-access-from-files', '--disable-background-networking', '--no-first-run',
    '--disable-renderer-backgrounding', '--disable-background-timer-throttling', ...GPU_ARGS];
  // Keep Chrome's sandbox enabled by default. --no-sandbox is intended only for
  // trusted, isolated CI/container environments that cannot launch otherwise.
  if (args['no-sandbox']) launchArgs.unshift('--no-sandbox');
  return puppeteer.launch({
    executablePath: CHROME, headless: args.headful ? false : true, protocolTimeout: 0,
    args: launchArgs,
  });
}
async function openPage(browser, fmt, extra = '') {
  const page = await browser.newPage();
  page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[page error]', e.message));
  const q = `?fmt=${fmt}&scale=${scale}&edit=${edit}${extra}`;
  await page.goto(pathToFileURL(resolve('studio.html')).href + q, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 180000 });
  await page.evaluate(() => window.renderAt(0));   // warm-up: the very first paint after loading can come out wrong
  return page;
}

async function frames(fmt) {
  const dir = cacheDir(fmt); mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/manifest.json`, JSON.stringify({ fingerprint, edit, fmt, fps, scale, duration: DUR }, null, 2));
  const todo = [];
  for (let i = range.start; i < range.end; i++) if (!validFrame(frameFile(fmt, i))) todo.push(i);
  console.log(`${edit} ${fmt}: ${range.count} frames, ${todo.length} to paint; cache ${fingerprint}`);
  if (!todo.length) return;
  const browser = await launch();
  try {
  const first = await openPage(browser, fmt);
  console.log('GPU:', await first.evaluate(() => window.gpuInfo()));
  const pages = [first]; for (let w = 1; w < workers; w++) pages.push(await openPage(browser, fmt));
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async page => {
    while (next < todo.length) {
      const i = todo[next++], url = await page.evaluate((t) => window.renderAt(t, 'image/jpeg', .93), i / fps);
      const f = `${dir}/f${String(i).padStart(5, '0')}.jpg`; writeFileSync(f + '.tmp', b64(url)); renameSync(f + '.tmp', f);
      if (++done % 24 === 0 || done === todo.length) {
        const s = (Date.now() - t0) / 1000, rate = s / done;
        console.log(`  ${done}/${todo.length}  ${rate.toFixed(2)} s/frame  ~${Math.round(rate * (todo.length - done) / 60)} min left`);
      }
    }
  }));
  } finally { await browser.close(); }
}
async function encode(fmt) {
  for (let i = range.start; i < range.end; i++) if (!validFrame(frameFile(fmt, i))) throw new Error(`Missing or incomplete frame ${i}; render the requested range first`);
  const suffix = args.range ? `-${range.start}-${range.end}` : '';
  const out = args.out || `${args.outdir || `out/renders/${fingerprint}`}/clipit-${edit}-${fmt}${suffix}.mp4`;
  if (existsSync(out) && !args.overwrite) {
    let saved;
    try { saved = JSON.parse(readFileSync(out + '.json', 'utf8')); } catch {}
    if (saved?.fingerprint === fingerprint && saved.fmt === fmt && saved.startFrame === range.start && saved.endFrame === range.end
        && saved.sha256 === createHash('sha256').update(readFileSync(out)).digest('hex')) {
      console.log('verified existing output ' + out); return;
    }
    throw new Error(`Output already exists: ${out}. Choose a new path or explicitly pass --overwrite.`);
  }
  mkdirSync(dirname(resolve(out)), { recursive: true });
  const tmp = out.slice(0, -extname(out).length) + '.partial.mp4';
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-framerate', String(fps), '-start_number', String(range.start), '-i', `${cacheDir(fmt)}/f%05d.jpg`, '-ss', String(range.offset), '-i', AUDIO,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-frames:v', String(range.count), '-af', 'apad', '-t', String(range.duration), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
  renameSync(tmp, out);
  writeFileSync(out + '.json', JSON.stringify({ fingerprint, edit, fmt, fps, scale, startFrame: range.start, endFrame: range.end,
    sha256: createHash('sha256').update(readFileSync(out)).digest('hex') }, null, 2));
  console.log('wrote ' + out);
}

const fmts = args.fmt ? [args.fmt] : ['v', 'h'];
if (args.sheet || args.model) {
  const fmt = args.fmt || 'v', browser = await launch();
  const page = await openPage(browser, fmt, args.model ? `&model=${args.model}` : '');
  console.log('GPU:', await page.evaluate(() => window.gpuInfo()));
  const times = args.model ? [0] : String(args.sheet).split(',').map(Number);
  const { url, ms } = await page.evaluate((ts, c, w) => window.renderSheet(ts, c, w), times, +(args.cols || Math.min(4, times.length)), +(args.w || (args.model ? 1600 : 360)));
  const out = args.out || 'out/check.jpg'; mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, b64(url));
  console.log('wrote ' + out + '  ms/frame: ' + ms.join(', '));
  await browser.close();
} else if (args.frames || args.all) {
  for (const f of fmts) { await frames(f); if (args.all) await encode(f); }
} else if (args.encode) {
  for (const f of fmts) await encode(f);
} else {
  console.log('nothing to do: see the header of render.mjs for usage');
}

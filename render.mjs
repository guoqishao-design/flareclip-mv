// render.mjs: paint frames in headless Chrome and encode MP4s.
//
//   node render.mjs --sheet=0,4,8,12 [--fmt=v|h] [--edit=2min|60s|30s|15s|full] [--scale=0.5] [--cols=4] [--w=360] --out=out/check.jpg
//   node render.mjs --model=snip [--fmt=h] [--scale=0.5] --out=out/model.jpg          character sheet
//   node render.mjs --frames [--fmt=v] [--edit=30s] [--workers=3]                      full-size JPEG frames (resumable)
//   node render.mjs --encode [--fmt=v] [--edit=30s]                                    frames + audio → out/clipit-30s-v.mp4
//   node render.mjs --all [--edit=30s] [--workers=3]                                   frames + encode, both formats
//   node render.mjs --all --fmt=v --scale=0.5 --range=0,3 --out=out/test.mp4           quick speed test on 3 seconds
//
// Chrome: --chrome=<path>. Defaults: macOS Google Chrome, Windows Chrome, Linux Playwright Chromium.
// On a Mac the GPU is used through Metal. The first lines print the GPU; "SwiftShader" means software rendering (slow).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync, renameSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import os from 'node:os';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const fps = +(args.fps || 24), scale = +(args.scale || 1), edit = args.edit || '30s';
const DUR = { '30s': 27.552, '15s': 15.501, '60s': 58.528, '2min': 120.519, full: 172.304 }[edit];
const AUDIO = { '2min': 'assets/clipit-2min.mp3', '60s': 'assets/clipit-60s.mp3', '30s': 'assets/clipit-30s.mp3', '15s': 'assets/clipit-15s.mp3', full: 'assets/clipit.mp3' }[edit];

const plat = os.platform();
const CHROME = args.chrome || (plat === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : plat === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const GPU_ARGS = plat === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : plat === 'win32' ? ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const run = (cmd, a) => new Promise((ok, bad) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('close', c => c ? bad(new Error(cmd + ' exited ' + c)) : ok()); });
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
  const dir = `out/frames-${edit}-${fmt}${scale !== 1 ? '-x' + scale : ''}`; mkdirSync(dir, { recursive: true });
  const n = Math.round(DUR * fps), todo = [];
  const [r0, r1] = args.range ? String(args.range).split(',').map(Number) : [0, DUR];   // --range=0,2 paints only that span (for a quick test)
  for (let i = Math.round(r0 * fps); i < Math.min(n, Math.round(r1 * fps)); i++) { const f = `${dir}/f${String(i).padStart(5, '0')}.jpg`; if (!(existsSync(f) && statSync(f).size > 0)) todo.push(i); }
  console.log(`${edit} ${fmt}: ${n} frames, ${todo.length} to paint`);
  if (!todo.length) return;
  const browser = await launch(), workers = +(args.workers || 3);
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
  await browser.close();
}
async function encode(fmt) {
  const dir = `out/frames-${edit}-${fmt}${scale !== 1 ? '-x' + scale : ''}`, out = args.out || `out/clipit-${edit}-${fmt}.mp4`;
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-framerate', String(fps), '-i', `${dir}/f%05d.jpg`, '-i', AUDIO,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
  console.log('wrote ' + out);
}

const fmts = args.fmt ? [args.fmt] : ['v', 'h'];
if (args.sheet || args.model) {
  const fmt = args.fmt || 'v', browser = await launch();
  const page = await openPage(browser, fmt, args.model ? `&model=${args.model}` : '');
  console.log('GPU:', await page.evaluate(() => window.gpuInfo()));
  const times = args.model ? [0] : String(args.sheet).split(',').map(Number);
  const { url, ms } = await page.evaluate((ts, c, w) => window.renderSheet(ts, c, w), times, +(args.cols || Math.min(4, times.length)), +(args.w || (args.model ? 1600 : 360)));
  const out = args.out || 'out/check.jpg'; mkdirSync('out', { recursive: true }); writeFileSync(out, b64(url));
  console.log('wrote ' + out + '  ms/frame: ' + ms.join(', '));
  await browser.close();
} else if (args.frames || args.all) {
  for (const f of fmts) { await frames(f); if (args.all) await encode(f); }
} else if (args.encode) {
  for (const f of fmts) await encode(f);
} else {
  console.log('nothing to do: see the header of render.mjs for usage');
}

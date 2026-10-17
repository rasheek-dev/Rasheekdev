// Renders the ad to numbered JPEG frames with headless Chromium (Playwright).
//   node tools/render.mjs <main|short> [frames|preview|still] [fps=30] [times=comma,list]
// frames  -> build/<cut>/frames/00000.jpg ...  (+ build/<cut>/cues.json for the audio script)
// preview -> build/<cut>/preview/*.png at the given times (a contact sheet is built by build.sh)
// still   -> build/<cut>/still.png at the first time given (used for the thumbnail)
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
// use a local `npm i playwright` if present, otherwise a global install
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(execSync('npm root -g').toString().trim() + '/playwright/index.mjs')); }

const [,, cut = 'main', mode = 'frames', fpsArg = '30', timesArg = ''] = process.argv;
const fps = +fpsArg, root = resolve(process.cwd());
const out = `${root}/build/${cut}`; mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`file://${root}/index.html?render&cut=${cut}`);
await page.waitForFunction(() => window.READY === true);
await page.waitForTimeout(300);
writeFileSync(`${out}/cues.json`, JSON.stringify(await page.evaluate(c => window.MentraAd.cues(c), cut), null, 1));
const D = await page.evaluate(() => window.DURATION);

let times, dir, ext;
if (mode === 'frames') { times = Array.from({ length: Math.round(D * fps) }, (_, i) => i / fps); dir = `${out}/frames`; ext = 'jpg'; }
else { times = timesArg.split(',').map(Number); dir = mode === 'still' ? out : `${out}/preview`; ext = 'png'; }
mkdirSync(dir, { recursive: true });

const stage = await page.$('#stage');
for (let i = 0; i < times.length; i++) {
  await page.evaluate(t => window.seek(t), times[i]);
  const path = mode === 'still' ? `${out}/still.png` : `${dir}/${String(i).padStart(5, '0')}.${ext}`;
  await stage.screenshot(ext === 'jpg' ? { path, type: 'jpeg', quality: 93 } : { path });
  if (mode === 'frames' && i % 150 === 0) console.log(`${cut}: frame ${i}/${times.length}`);
}
await browser.close();

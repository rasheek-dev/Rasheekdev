// node render.mjs [preview|full] [fps]   (writes preview/*.png or frames/*.jpg, plus sfx.json)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';
const [,, mode = 'preview', fps = '30'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/signs.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);

const D = await p.evaluate(() => window.DURATION);
writeFileSync('sfx.json', JSON.stringify(await p.evaluate(() => ({sfx: window.SFX, beats: window.BEATS, dur: window.DURATION}))));
const pv = mode === 'preview';
const list = pv ? [0, 3.0, 6.0, 10.5, 14.8, 19.0, 23.0, 27.2, 33.5]
               : Array.from({ length: Math.round(D * +fps) }, (_, i) => i / +fps);
const dir = pv ? 'preview' : 'frames'; mkdirSync(dir, { recursive: true });
for (let i = 0; i < list.length; i++) {
  await p.evaluate(t => window.render(t), list[i]);
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.${pv ? 'png' : 'jpg'}`, ...(pv ? {} : { type: 'jpeg', quality: 92 }) });
}
await b.close();

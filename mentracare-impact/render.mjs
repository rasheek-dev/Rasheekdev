// node render.mjs [preview|full] [fps]   (writes preview/*.png or frames/*.jpg, plus sfx.json)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';
const [,, mode = 'preview', fps = '30'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/impact.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.evaluate(() => layout());
const D = await p.evaluate(() => window.DURATION);
writeFileSync('sfx.json', JSON.stringify(await p.evaluate(() => window.SFX)));
const pv = mode === 'preview';
const list = pv ? [6.5, 12.0, 16.5, 24.6, 25.6, 25.95, 26.3]
               : Array.from({ length: Math.round(D * +fps) }, (_, i) => i / +fps);
const dir = pv ? 'preview' : 'frames'; mkdirSync(dir, { recursive: true });
for (let i = 0; i < list.length; i++) {
  await p.evaluate(t => window.render(t), list[i]);
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.${pv ? 'png' : 'jpg'}`, ...(pv ? {} : { type: 'jpeg', quality: 92 }) });
}
await b.close();

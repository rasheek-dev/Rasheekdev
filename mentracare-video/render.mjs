import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
const [,, mode='preview', fps='30'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/scene.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
const D = await p.evaluate(() => window.DURATION);
const times = mode === 'preview' ? [1.5, 4.2, 8.5, 17, 21.5, 24.8, 27.6, 30, 35] : null;
const dir = mode === 'preview' ? 'preview' : 'frames'; mkdirSync(dir, { recursive: true });
const list = times ?? Array.from({ length: Math.round(D * +fps) }, (_, i) => i / +fps);
for (let i = 0; i < list.length; i++) {
  await p.evaluate(t => window.render(t), list[i]);
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.${times ? 'png' : 'jpg'}`, ...(times ? {} : { type: 'jpeg', quality: 92 }) });
}
await b.close();

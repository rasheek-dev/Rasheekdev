// Two-pass renderer for the Reel.
//   node tools/render.mjs bg      [times]   -> build/bg/00000.jpg   clean 3D footage from ../mentra-3d, mapped per REEL.bg
//   node tools/render.mjs overlay [times]   -> build/ov/00000.png   transparent captions + graphics (reel.html)
// [times] = optional comma list of seconds (preview); default = every frame at 30 fps.
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import(execSync('npm root -g').toString().trim() + '/playwright/index.mjs')); }
const [,, pass = 'overlay', timesArg = ''] = process.argv, root = resolve('.');
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.error('page error:', e.message));
// read the reel config from reel.html
await p.goto(`file://${root}/reel.html`); await p.waitForFunction(() => window.READY);
const R = await p.evaluate(() => window.REEL);
writeFileSync('build/reel.json', JSON.stringify(R));
const times = timesArg ? timesArg.split(',').map(Number) : Array.from({ length: R.duration * R.fps }, (_, i) => i / R.fps);
const dir = `build/${pass === 'bg' ? 'bg' : 'ov'}`; mkdirSync(dir, { recursive: true });
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const eob = x => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
if (pass === 'bg') {
  await p.goto(`file://${root}/../mentra-3d/index.html?render&cut=main`); await p.waitForFunction(() => window.READY === true);
  await p.addStyleTag({ content: '#caps,#brandText,#endCard,#wash{display:none!important} #gl{transform-origin:50% 50%}' });
}
const el = await p.$('#stage');
for (let i = 0; i < times.length; i++) {
  const t = times[i], idx = process.env.BY_FRAME ? Math.round(t * R.fps) : i, path = `${dir}/${String(idx).padStart(5, '0')}.${pass === 'bg' ? 'jpg' : 'png'}`;
  if (pass === 'bg') {
    const s = R.bg.find(s => t >= s.t[0] && t < s.t[1]) || R.bg[R.bg.length - 1], u = cl((t - s.t[0]) / (s.t[1] - s.t[0]));
    const punch = s.punch ? 1 + .12 * eob((t - s.punch) / .3) : 1, z = lerp(s.zoom[0], s.zoom[1], u) * punch;
    await p.evaluate(([src, blur, dim, z]) => { window.seek(src); const g = document.getElementById('gl'); g.style.filter = `blur(${blur}px) brightness(${dim})`; g.style.transform = `scale(${z})`; },
      [lerp(s.src[0], s.src[1], u), s.blur || 0, s.dim || 1, z]);
    await el.screenshot({ path, type: 'jpeg', quality: 94 });
  } else {
    await p.evaluate(([t, c]) => { window.COVER = c; window.render(t); }, [t, !!process.env.COVER]);
    await el.screenshot({ path, omitBackground: true });
  }
  if (!timesArg && i % 150 === 0) console.log(`${pass}: ${i}/${times.length}`);
}
await b.close();

// node tools/debug.mjs out.png t "cx,cy,cz,tx,ty,tz,fov" [pose] [nothreads]
import { execSync } from 'child_process';
const { chromium } = await import(execSync('npm root -g').toString().trim() + '/playwright/index.mjs');
const [,, out, t, camS, pose, nt] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(`file://${process.cwd()}/index.html?render`); await p.waitForFunction(() => window.READY);
await p.evaluate(([c, pose, nt]) => { if (c) window.DEBUGCAM = c.split(',').map(Number); if (pose) window.DEBUGPOSE = pose; if (nt) window.NOTHREADS = 1; }, [camS, pose, nt]);
await p.evaluate(t => window.seek(t), +t); await (await p.$('#stage')).screenshot({ path: out }); await b.close();

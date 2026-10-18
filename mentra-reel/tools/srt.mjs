// Writes out/Mentra-Reel.srt from the caption timeline in build/reel.json
import { readFileSync, writeFileSync } from 'fs';
const R = JSON.parse(readFileSync('build/reel.json', 'utf8'));
const ts = s => { const ms = Math.round(s * 1000); return `00:${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const lines = R.captions.map((c, i) => `${i + 1}\n${ts(c.t[0])} --> ${ts(c.t[1])}\n${c.w.join(' ')}\n`);
lines.splice(1, 0); writeFileSync('out/Mentra-Reel.srt', lines.join('\n')); console.log('srt written');

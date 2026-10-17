// Writes English + Malayalam .srt subtitle files for both cuts from src/config.js
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const window = {}; eval(readFileSync('src/config.js', 'utf8'));
const C = window.MENTRA, ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
mkdirSync('out', { recursive: true });
for (const cut of ['main', 'short']) for (const [lang, k] of [['en', 3], ['ml', 2]]) {
  const srt = C[cut].vo.map((v, i) => `${i + 1}\n${ts(v[0])} --> ${ts(v[1])}\n${v[k]}\n`).join('\n');
  writeFileSync(`out/Mentra-${cut === 'main' ? '40s' : '15s'}.${lang}.srt`, srt);
}
console.log('subtitles written to out/');

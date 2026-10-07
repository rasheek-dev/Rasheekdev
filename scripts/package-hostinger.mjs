// Packs dist/ as mindledger/ inside mindledger-upload.zip, ready to extract in public_html.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const zipPath = join(root, 'mindledger-upload.zip');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Run "npm run build" first.');

const staging = mkdtempSync(join(tmpdir(), 'mindledger-'));
cpSync(dist, join(staging, 'mindledger'), { recursive: true });
rmSync(zipPath, { force: true });

if (process.platform === 'win32') {
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(staging, 'mindledger')}' -DestinationPath '${zipPath}'`]);
} else {
  execFileSync('zip', ['-qr', zipPath, 'mindledger'], { cwd: staging });
}
rmSync(staging, { recursive: true, force: true });
console.log(`Created ${zipPath}`);

// Bundles src/bridge.js → js/bridge.js and copies the web app into dist/ for Capacitor.
import { build } from 'esbuild';
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = join(root, 'src', 'firebase-config.js');
if (!existsSync(cfg)) writeFileSync(cfg, 'export const firebaseConfig = null;\n');

await build({
  entryPoints: [join(root, 'src', 'bridge.js')],
  bundle: true, minify: true, format: 'iife', target: ['es2020'],
  outfile: join(root, 'js', 'bridge.js'), legalComments: 'none', logLevel: 'info',
});

const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons', 'img']) cpSync(join(root, f), join(dist, f), { recursive: true });
console.log('web build → dist/');

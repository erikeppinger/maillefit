// Copies the static web app into dist/ for the desktop build (Tauri embeds dist/).
import { rm, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = root + 'dist';
await rm(dist, { recursive: true, force: true });
await mkdir(dist);
for (const item of ['index.html', 'css', 'src']) await cp(root + item, `${dist}/${item}`, { recursive: true });
console.log('web app copied to dist/');

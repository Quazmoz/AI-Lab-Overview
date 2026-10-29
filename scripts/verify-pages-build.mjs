import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/';
assert.match(base, /^\/(?:[\w.-]+\/)*$/, 'VITE_BASE_PATH must begin and end with /');

const html = readFileSync('dist/index.html', 'utf8');
assert.match(html, /id="root"/, 'Missing React mount point');
assert.doesNotMatch(html, /\/src\/main\.tsx/, 'Development entrypoint remains in build');

const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
const localUrls = urls.filter((url) => url.startsWith('/') && !url.startsWith('//'));
assert.ok(localUrls.some((url) => /\/assets\/[^/]+\.js$/.test(url)), 'No bundled JS asset');
assert.ok(localUrls.some((url) => /\/assets\/[^/]+\.css$/.test(url)), 'No bundled CSS asset');

for (const url of localUrls) {
  assert.ok(url.startsWith(base), `Asset uses wrong base path: ${url}`);
  const relativePath = url.slice(base.length).split(/[?#]/, 1)[0];
  assert.ok(relativePath && existsSync(join('dist', relativePath)), `Missing built asset: ${url}`);
}

console.log(`Verified ${localUrls.length} local asset URLs under ${base}`);

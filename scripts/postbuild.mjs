// GitHub Pages helpers: disable Jekyll processing and provide an SPA 404
// fallback that serves index.html for any path.
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';

const dist = 'dist';

writeFileSync(`${dist}/.nojekyll`, '');

if (existsSync(`${dist}/index.html`)) {
  copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
}

console.log('postbuild: wrote .nojekyll and 404.html');

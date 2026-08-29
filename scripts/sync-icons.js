import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const iconsDir = path.resolve(projectRoot, 'front', 'src-tauri', 'icons');
const frontPublic = path.resolve(projectRoot, 'front', 'public');
const appPublic = path.resolve(projectRoot, 'front', 'app', 'public');

const copyMap = [
  { src: '32x32.png', dests: ['favicon-32x32.png', 'favicon.png', 'favicon-16x16.png'] },
  { src: '64x64.png', dests: ['favicon-48.png'] },
  { src: '128x128@2x.png', dests: ['icon-192.png'] },
  { src: 'icon.png', dests: ['icon-512.png', 'apple-touch-icon.png'] },
  { src: 'icon.ico', dests: ['favicon.ico', 'logo_aresta.ico'] }
];

for (const targetDir of [frontPublic, appPublic]) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const mapping of copyMap) {
    const srcPath = path.join(iconsDir, mapping.src);
    if (fs.existsSync(srcPath)) {
      for (const destFile of mapping.dests) {
        const destPath = path.join(targetDir, destFile);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${mapping.src} -> ${destPath}`);
      }
    } else {
      console.warn(`Source not found: ${srcPath}`);
    }
  }
}
console.log('Icon sync complete!');

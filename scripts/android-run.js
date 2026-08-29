#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const action = process.argv[2] || 'dev';
const frontDir = path.join(__dirname, '..', 'front');

// Assegura Cargo no PATH
const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
const cargoBin = path.join(cargoHome, 'bin');
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
const currentPath = process.env[pathKey] || '';
if (fs.existsSync(cargoBin) && !currentPath.includes(cargoBin)) {
  process.env[pathKey] = `${cargoBin}${path.delimiter}${currentPath}`;
}

let tauriCmd = 'tauri:android:dev';
if (action === 'build' || action === 'apk') {
  tauriCmd = 'tauri:android:build';
} else if (action === 'open') {
  tauriCmd = 'tauri:android:open';
}

console.log(`\x1b[34m[Aresta Android]\x1b[0m Executando: \x1b[36mnpm run ${tauriCmd}\x1b[0m...`);

try {
  execSync(`npm run ${tauriCmd}`, {
    cwd: frontDir,
    stdio: 'inherit',
    env: process.env
  });
} catch (err) {
  process.exit(1);
}
